import dotenv from "dotenv";

dotenv.config();

function parseCorsOrigins() {
    const raw = process.env.CORS_ORIGINS || "";
    const fromEnv = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (fromEnv.length) return fromEnv;
    return [
        "https://greengrouplogistics.com",
        "https://www.greengrouplogistics.com",
        "https://os.greengrouplogistics.com",
    ];
}

export const config = {
    port: parseInt(process.env.PORT || process.env.API_PORT || "3847", 10),
    host: process.env.API_HOST || "0.0.0.0",
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    webhookSecret: process.env.WEBHOOK_SECRET || "webhook-dev-secret",
    timezone: process.env.TIMEZONE || "America/Los_Angeles",
    companyName: process.env.COMPANY_NAME || "Green Logistics",
    legacyApiUrl: process.env.LEGACY_API_URL || "",
    legacyIngestToken: process.env.LEGACY_INGEST_TOKEN || "",
    corsOrigins: parseCorsOrigins(),
    appVersion: "1.0.0",
    deployCommit: process.env.GIT_COMMIT?.slice(0, 7) || "local",
};
