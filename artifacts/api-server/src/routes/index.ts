import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import matchesRouter from "./matches.js";
import messagesRouter from "./messages.js";
import paymentsRouter from "./payments.js";
import adminRouter from "./admin.js";
import waitlistRouter from "./waitlist.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/matches", matchesRouter);
router.use("/messages", messagesRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);
router.use("/waitlist", waitlistRouter);

export default router;
