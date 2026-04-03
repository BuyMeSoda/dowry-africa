import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import matchesRouter from "./matches.js";
import messagesRouter from "./messages.js";
import paymentsRouter from "./payments.js";
import adminRouter from "./admin.js";
import earlyAccessRouter from "./earlyAccess.js";
import notificationsRouter from "./notifications.js";
import customValuesRouter from "./customValues.js";
import settingsRouter from "./settings.js";
import reportsRouter from "./reports.js";
import promptsRouter from "./prompts.js";
import adminAuthRouter from "./adminAuth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/matches", matchesRouter);
router.use("/messages", messagesRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);
router.use("/admin-auth", adminAuthRouter);
router.use("/early-access", earlyAccessRouter);
router.use("/notifications", notificationsRouter);
router.use("/custom-values", customValuesRouter);
router.use("/settings", settingsRouter);
router.use("/reports", reportsRouter);
router.use("/prompts", promptsRouter);

export default router;
