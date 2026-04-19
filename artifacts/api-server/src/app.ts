import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { runMigrations } from "./db/migrate.js";
import { seedDatabase } from "./db/seed.js";

const app: Express = express();

// Required for correct IP detection behind Railway / Replit reverse proxies
app.set("trust proxy", 1);

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
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && allowedOrigins.length === 0) {
  logger.warn("CORS_ORIGINS is not set in production — all cross-origin browser requests will be rejected.");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, Postman, native mobile)
      if (!origin) return callback(null, true);
      // Always allow localhost in any port (dev)
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      // Allow Replit dev domains (workspace previews)
      try {
        if (/\.replit\.dev$/.test(new URL(origin).hostname)) return callback(null, true);
      } catch { /* malformed origin — fall through */ }
      // Allow explicit allow-list from env
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In non-production, fall back to allow-all when no explicit list is configured.
      // In production we never silently allow-all — operators must opt in via CORS_ORIGINS.
      if (!isProduction && allowedOrigins.length === 0) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: false,
  }),
);

// Stripe webhook needs the raw body for signature verification — must come before express.json()
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

app.use((req, _res, next) => {
  if (req.headers["content-type"]?.startsWith("multipart/")) return next();
  express.json({ type: ["application/json", "text/plain", "*/*"] })(req, _res, next);
});
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
