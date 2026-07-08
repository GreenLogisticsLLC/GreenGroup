import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js";
import { config } from "../config/env.js";
import { getWebhookUrls } from "../lib/helpers.js";

const router = Router();
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function getCommit() {
    try {
        const raw = fs.readFileSync(path.join(root, "deploy-version.txt"), "utf8").trim();
        return raw && raw !== "local" ? raw.slice(0, 7) : config.deployCommit;
    } catch {
        return config.deployCommit;
    }
}

router.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.json({
            status: "OK",
            platform: "Green OS",
            version: config.appVersion,
            commit: getCommit(),
            company: config.companyName,
            database: "ONLINE",
            api: "ONLINE",
            webhookUrls: getWebhookUrls(config.port),
            timestamp: new Date().toISOString(),
        });
    } catch {
        return res.status(503).json({ status: "DEGRADED", database: "OFFLINE" });
    }
});

export default router;
