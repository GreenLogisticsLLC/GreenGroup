import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { apiResponse } from "../lib/response.js";
import { loginUser } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(422).json(apiResponse(false, "Username and password required"));
    }
    const result = await loginUser(username, password);
    if (!result) {
        return res.status(401).json(apiResponse(false, "Invalid credentials"));
    }
    return res.json(apiResponse(true, "Login successful", result));
});

router.get("/me", authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { userId: req.user.userId },
        include: { role: true },
    });
    if (!user) {
        return res.status(401).json(apiResponse(false, "User not found"));
    }
    return res.json(
        apiResponse(true, "OK", {
            userId: user.userId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.roleName,
        })
    );
});

export default router;
