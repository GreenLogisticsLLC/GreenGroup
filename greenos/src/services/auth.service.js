import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { config } from "../config/env.js";

export async function loginUser(username, password) {
    const identifier = String(username || "").trim();
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
        },
        include: { role: true },
    });

    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    await prisma.user.update({
        where: { userId: user.userId },
        data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
        { userId: user.userId, username: user.username, role: user.role.roleName },
        config.jwtSecret,
        { expiresIn: "8h" }
    );

    return {
        token,
        user: {
            userId: user.userId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.roleName,
        },
    };
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch {
        return null;
    }
}

export const ADMIN_ROLES = ["Administrator", "Owner"];
export const MANAGER_ROLES = ["Administrator", "Owner", "Manager"];

export function hasAdminRole(role) {
    return ADMIN_ROLES.includes(role);
}

export function hasManagerRole(role) {
    return MANAGER_ROLES.includes(role);
}
