const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

async function resetDatabase() {
  const client = await pool.connect();

  try {
    console.log("⚠️  WARNING: This will DELETE ALL DATA in your database!\n");
    console.log("Starting database reset in 3 seconds...");
    console.log("Press Ctrl+C to cancel\n");

    // Give user 3 seconds to cancel
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("🗑️  Dropping existing tables...\n");

    // Drop tables in correct order (respecting foreign keys)
    await client.query("DROP TABLE IF EXISTS generated_audio CASCADE;");
    console.log("   ✓ Dropped generated_audio");

    await client.query("DROP TABLE IF EXISTS voices CASCADE;");
    console.log("   ✓ Dropped voices");

    await client.query("DROP TABLE IF EXISTS users CASCADE;");
    console.log("   ✓ Dropped users");

    // Drop triggers and functions
    await client.query(
      "DROP TRIGGER IF EXISTS update_users_updated_at ON users;"
    );
    await client.query(
      "DROP TRIGGER IF EXISTS update_voices_updated_at ON voices;"
    );
    await client.query("DROP FUNCTION IF EXISTS update_updated_at_column();");
    console.log("   ✓ Dropped triggers and functions");

    console.log("\n📄 Reading schema.sql...");

    // Read and execute schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("⚙️  Creating tables, indexes, and triggers...\n");
    await client.query(schema);

    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const result = await client.query(tablesQuery);

    console.log("✅ Database reset complete!\n");
    console.log("📊 Tables recreated:");
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log("\n🎉 Your database has been reset and is ready to use!\n");
  } catch (error) {
    console.error("❌ Error resetting database:", error.message);
    console.error("\nDetails:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run reset
resetDatabase();
