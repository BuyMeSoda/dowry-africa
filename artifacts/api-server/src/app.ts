import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { seedDatabase } from "./db/database.js";

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
app.use(express.json({ type: ["application/json", "text/plain", "*/*"] }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

seedDatabase().then(() => {
  logger.info("Database seeded with demo users");
}).catch((err) => {
  logger.error({ err }, "Failed to seed database");
});

export default app;
