// backend/config/database.js
// PostgreSQL database configuration with SSL support

const { Pool } = require("pg");

// Create database pool with SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : process.env.DATABASE_URL?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : false,
});

// Test connection on startup
pool.on("connect", () => {
  console.log("✅ [Database] Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ [Database] Unexpected error:", err);
});

module.exports = pool;
