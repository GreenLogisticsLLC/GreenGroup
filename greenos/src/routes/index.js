import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import platformRoutes from "./platform.routes.js";
import attendanceRoutes from "../modules/attendance/routes.js";

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use("/v1/auth", authRoutes);
apiRouter.use("/v1/platform", platformRoutes);
apiRouter.use("/v1", attendanceRoutes);

export default apiRouter;
