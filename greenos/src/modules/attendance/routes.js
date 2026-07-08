import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { apiResponse } from "../../lib/response.js";
import { config } from "../../config/env.js";
import { authMiddleware, requireManager } from "../../middleware/auth.js";
import { buildWebhookId, normalizeCardToken } from "../../lib/helpers.js";
import {
    processAttendanceEvent,
    findEmployeeByCard,
    getDashboardRows,
} from "./attendance.service.js";

const router = Router();

router.post("/webhook/attendance", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || auth.slice(7) !== config.webhookSecret) {
        return res.status(401).json(apiResponse(false, "Unauthorized"));
    }

    const payload = req.body || {};
    if (!payload.token || !payload.device_id || !payload.scanned_at) {
        return res.status(422).json(apiResponse(false, "Invalid payload"));
    }

    const webhookId = buildWebhookId(payload);
    const existing = await prisma.attendanceEvent.findUnique({ where: { webhookId } });
    if (existing) {
        return res.json(apiResponse(true, "Duplicate", { duplicate: true }));
    }

    let employee = null;
    if (payload.external_ref) {
        employee = await prisma.employee.findUnique({ where: { externalRef: payload.external_ref } });
    }
    if (!employee) employee = await findEmployeeByCard(payload.token);

    if (!employee) {
        const token = normalizeCardToken(payload.token);
        await prisma.pendingCardScan.upsert({
            where: { cardToken: token },
            update: { deviceId: payload.device_id, scannedAt: new Date(payload.scanned_at) },
            create: { cardToken: token, deviceId: payload.device_id, scannedAt: new Date(payload.scanned_at) },
        });
        return res.status(422).json(apiResponse(false, "Unknown employee"));
    }

    try {
        const result = await processAttendanceEvent({
            employeeId: employee.employeeId,
            eventTime: new Date(payload.scanned_at),
            deviceId: payload.device_id,
            webhookId,
            source: `LEGACY_READER:${payload.profile_id || "default"}`,
        });
        return res.json(apiResponse(true, "Processed", result));
    } catch (err) {
        return res.status(500).json(apiResponse(false, err.message || "Processing failed"));
    }
});

router.get("/dashboard", authMiddleware, async (_req, res) => {
    const data = await getDashboardRows();
    return res.json(apiResponse(true, "Dashboard loaded", data));
});

router.get("/employees", authMiddleware, async (req, res) => {
    const all = req.query.all === "true";
    const employees = await prisma.employee.findMany({
        where: all ? {} : { status: "ACTIVE" },
        include: { shift: true },
        orderBy: { lastName: "asc" },
    });
    return res.json(apiResponse(true, "Employees loaded", employees));
});

router.get("/shifts", authMiddleware, async (_req, res) => {
    const shifts = await prisma.shift.findMany({ where: { isActive: true } });
    return res.json(apiResponse(true, "Shifts loaded", shifts));
});

router.post("/employees", authMiddleware, requireManager, async (req, res) => {
    const body = req.body || {};
    if (!body.employeeNumber || !body.firstName || !body.lastName || !body.cardNumber || !body.shiftId) {
        return res.status(422).json(apiResponse(false, "Missing required fields"));
    }
    const cardNumber = normalizeCardToken(body.cardNumber);
    if (!cardNumber) return res.status(422).json(apiResponse(false, "Invalid card UID"));

    try {
        const employee = await prisma.employee.create({
            data: {
                employeeNumber: String(body.employeeNumber).trim(),
                firstName: String(body.firstName).trim(),
                lastName: String(body.lastName).trim(),
                department: body.department || null,
                position: body.position || null,
                cardNumber,
                externalRef: body.externalRef || String(body.employeeNumber).trim(),
                shiftId: body.shiftId,
            },
            include: { shift: true },
        });
        return res.status(201).json(apiResponse(true, "Employee created", { employee }));
    } catch (err) {
        if (err.code === "P2002") {
            return res.status(409).json(apiResponse(false, "Employee number or card already exists"));
        }
        return res.status(500).json(apiResponse(false, "Failed to create employee"));
    }
});

export default router;
