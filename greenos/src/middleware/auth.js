import { apiResponse } from "../lib/response.js";
import { verifyToken, hasAdminRole, hasManagerRole } from "../services/auth.service.js";

export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json(apiResponse(false, "Unauthorized"));
    }
    const payload = verifyToken(header.slice(7));
    if (!payload) {
        return res.status(401).json(apiResponse(false, "Invalid or expired token"));
    }
    req.user = payload;
    next();
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json(apiResponse(false, "Insufficient permissions"));
        }
        next();
    };
}

export function requireAdmin(req, res, next) {
    if (!req.user || !hasAdminRole(req.user.role)) {
        return res.status(403).json(apiResponse(false, "Administrator access required"));
    }
    next();
}

export function requireManager(req, res, next) {
    if (!req.user || !hasManagerRole(req.user.role)) {
        return res.status(403).json(apiResponse(false, "Manager access required"));
    }
    next();
}
