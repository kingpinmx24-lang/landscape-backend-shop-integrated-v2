import "dotenv/config";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { db } from "../db";
import { sql } from "drizzle-orm";

const app = express();

// CORS configuration for production
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Log requests for monitoring
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Migration endpoint for production stability
app.get("/api/migrate", async (req, res) => {
  const secret = req.query.secret;
  if (secret !== "landscape-migrate-2024") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting production database migration...");
    
    // Check DB connection
    await db.execute(sql\`SELECT 1\`);
    console.log("Database connection verified.");

    // Create tables if they don't exist
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
    
    console.log("Migration completed successfully.");
    res.json({ success: true, message: "Database tables initialized." });
  } catch (err: any) {
    console.error("Migration failed:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV });
});

// Export for Vercel Serverless
export default app;

// Local development server
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Development server running on http://localhost:${port}/`);
  });
}
