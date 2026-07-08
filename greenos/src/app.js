import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config/env.js";
import apiRouter from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, "..", "public");

export function createApp() {
    const app = express();
    app.set("trust proxy", 1);
    app.use(cors({ origin: config.corsOrigins, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
    app.use(express.json({ limit: "1mb" }));
    app.use("/api", apiRouter);
    app.use(express.static(publicPath));
    app.get("*", (_req, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
    });
    return app;
}

export function startServer() {
    const app = createApp();
    app.listen(config.port, config.host, () => {
        console.log(`Green OS v${config.appVersion}`);
        console.log(`Server: http://localhost:${config.port} (listening on ${config.host})`);
        console.log(`Health: GET http://localhost:${config.port}/api/health`);
    });
}
