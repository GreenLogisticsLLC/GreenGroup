import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/env.js";
import { diffMinutes, getWorkDateString, normalizeCardToken } from "../../lib/helpers.js";

function resolveToggleDirection(currentStatus) {
    return currentStatus === "INSIDE_OFFICE" ? "EXIT" : "ENTRY";
}

function scheduledTimes(workDate, shift) {
    const [sh, sm] = shift.startTime.split(":").map(Number);
    const [eh, em] = shift.endTime.split(":").map(Number);
    const start = new Date(`${workDate}T00:00:00`);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(`${workDate}T00:00:00`);
    end.setHours(eh, em, 0, 0);
    if (shift.crossMidnight && end <= start) end.setDate(end.getDate() + 1);
    return { scheduledStart: start, scheduledEnd: end };
}

export async function processAttendanceEvent(input) {
    const employee = await prisma.employee.findUnique({
        where: { employeeId: input.employeeId },
        include: { shift: true },
    });
    if (!employee?.shift) throw new Error("Employee or shift not found");

    const workDate = getWorkDateString(input.eventTime, config.timezone);
    const { scheduledStart, scheduledEnd } = scheduledTimes(workDate, employee.shift);

    let session = await prisma.attendanceSession.findUnique({
        where: { employeeId_workDate: { employeeId: employee.employeeId, workDate } },
    });

    if (!session) {
        session = await prisma.attendanceSession.create({
            data: {
                employeeId: employee.employeeId,
                shiftId: employee.shiftId,
                workDate,
                scheduledStart,
                scheduledEnd,
            },
        });
    }

    const direction = resolveToggleDirection(session.currentStatus);

    const event = await prisma.attendanceEvent.create({
        data: {
            sessionId: session.sessionId,
            employeeId: employee.employeeId,
            eventTime: input.eventTime,
            direction,
            deviceId: input.deviceId,
            webhookId: input.webhookId,
            source: input.source || "ACCESS_CONTROL",
        },
    });

    const updates = { lastActivity: input.eventTime };

    if (direction === "ENTRY") {
        updates.currentStatus = "INSIDE_OFFICE";
        if (!session.firstEntry) {
            updates.firstEntry = input.eventTime;
            const lateMinutes = Math.max(0, diffMinutes(scheduledStart, input.eventTime) - employee.shift.gracePeriodMinutes);
            updates.late = lateMinutes > 0;
            updates.lateMinutes = lateMinutes;
        }
    } else {
        updates.currentStatus = "COMPLETED";
        updates.lastExit = input.eventTime;
        updates.exitCount = session.exitCount + 1;
    }

    const updatedSession = await prisma.attendanceSession.update({
        where: { sessionId: session.sessionId },
        data: updates,
    });

    return { event, session: updatedSession, direction };
}

export async function findEmployeeByCard(token) {
    const normalized = normalizeCardToken(token);
    const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });
    return employees.find((e) => normalizeCardToken(e.cardNumber) === normalized) || null;
}

export async function getDashboardRows() {
    const now = new Date();
    const workDate = getWorkDateString(now, config.timezone);
    const employees = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        include: { shift: true },
        orderBy: { lastName: "asc" },
    });

    const rows = [];
    for (const emp of employees) {
        const session = await prisma.attendanceSession.findFirst({
            where: { employeeId: emp.employeeId, workDate },
            orderBy: { createdAt: "desc" },
        });
        rows.push({
            employeeId: emp.employeeId,
            employeeNumber: emp.employeeNumber,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            department: emp.department,
            shiftName: emp.shift.shiftName,
            firstEntry: session?.firstEntry?.toISOString() ?? null,
            currentStatus: session?.currentStatus ?? "SCHEDULED",
            lateMinutes: session?.lateMinutes ?? 0,
            exitCount: session?.exitCount ?? 0,
            lastActivity: session?.lastActivity?.toISOString() ?? null,
        });
    }

    const stats = {
        totalEmployees: rows.length,
        insideOffice: rows.filter((r) => r.currentStatus === "INSIDE_OFFICE").length,
        completed: rows.filter((r) => r.currentStatus === "COMPLETED").length,
        scheduled: rows.filter((r) => r.currentStatus === "SCHEDULED").length,
    };

    return { workDate, rows, stats };
}
