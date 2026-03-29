import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { runMigrations } from "./db/migrate.js";
import { seedDatabase } from "./db/seed.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Stripe webhook needs the raw body for signature verification — must come before express.json()
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

app.use(express.json({ type: ["application/json", "text/plain", "*/*"] }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Run migrations then seed on every startup (idempotent)
runMigrations()
  .then(() => {
    logger.info("Database migrations complete");
    return seedDatabase();
  })
  .then(() => {
    logger.info("Database seeded with demo users");
  })
  .catch((err) => {
    logger.error({ err }, "Database setup failed");
  });

export default app;
