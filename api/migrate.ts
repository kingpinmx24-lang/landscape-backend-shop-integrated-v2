import { db } from "../server/db";
import { sql } from "drizzle-orm";

export default async function handler(req: any, res: any) {
  const secret = req.query.secret;
  if (secret !== "landscape-migrate-2024") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    console.log("Starting production database migration...");
    await db.execute(sql\`SELECT 1\`);
    await db.execute(sql\`
      CREATE TABLE IF NOT EXISTS plants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        species TEXT,
        status TEXT DEFAULT 'healthy',
        last_watered TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    \`);
    res.json({ success: true, message: "Database tables initialized." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
