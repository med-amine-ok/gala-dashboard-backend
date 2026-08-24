// lib/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres"; // node-postgres driver
import * as schema from "../../drizzle/schema";

// Create a singleton pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
