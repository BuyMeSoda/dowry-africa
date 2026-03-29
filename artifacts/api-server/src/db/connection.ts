import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export const db = drizzle(pool, { schema });
