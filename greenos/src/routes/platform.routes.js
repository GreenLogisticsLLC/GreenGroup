import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { apiResponse } from "../lib/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { hasAdminRole } from "../services/auth.service.js";

const router = Router();

router.get("/modules", authMiddleware, async (req, res) => {
    const modules = await prisma.platformModule.findMany({
        orderBy: { sortOrder: "asc" },
    });

    const isAdmin = hasAdminRole(req.user.role);
    const visible = modules.filter((m) => m.enabled || isAdmin);

    return res.json(apiResponse(true, "Modules loaded", visible));
});

export default router;
