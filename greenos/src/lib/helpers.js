import os from "os";
import { randomUUID } from "crypto";

export function normalizeCardToken(token) {
    return String(token || "")
        .toLowerCase()
        .trim()
        .replace(/^0x_/i, "")
        .replace(/0x/gi, "")
        .replace(/[\s_-]/g, "");
}

export function buildWebhookId(payload) {
    return [
        payload.profile_id || "default",
        payload.device_id,
        normalizeCardToken(payload.token),
        payload.scanned_at,
        payload.decision,
    ].join("|");
}

export function getWorkDateString(date, timezone) {
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
}

export function diffMinutes(start, end) {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
}

export function formatDateTime(date) {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-GB", {
        timeZone: process.env.TIMEZONE || "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

export function getAllNetworkIps() {
    const ips = [];
    for (const nets of Object.values(os.networkInterfaces())) {
        for (const net of nets ?? []) {
            const isV4 = String(net.family) === "IPv4" || String(net.family) === "4";
            if (isV4 && !net.internal) ips.push(net.address);
        }
    }
    return ips;
}

export function getWebhookUrls(port) {
    const path = `/api/v1/webhook/attendance`;
    const local = `http://localhost:${port}${path}`;
    const ips = getAllNetworkIps();
    const ip = ips.find((i) => i.startsWith("192.168.")) ?? ips[0];
    const network = ip ? `http://${ip}:${port}${path}` : null;
    return { local, network, recommended: network ?? local };
}

export function generateRequestId() {
    return randomUUID();
}
