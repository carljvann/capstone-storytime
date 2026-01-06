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

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting database setup...\n");

    // Read schema.sql file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("📄 Reading schema.sql...");

    // Execute schema
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

    console.log("✅ Database setup complete!\n");
    console.log("📊 Tables created:");
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Show indexes
    const indexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY indexname;
    `;
    const indexes = await client.query(indexQuery);

    console.log("\n📑 Indexes created:");
    indexes.rows.forEach((row) => {
      console.log(`   - ${row.indexname}`);
    });

    // Show triggers
    const triggerQuery = `
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgisinternal = false 
      ORDER BY tgname;
    `;
    const triggers = await client.query(triggerQuery);

    console.log("\n⚡ Triggers created:");
    triggers.rows.forEach((row) => {
      console.log(`   - ${row.tgname}`);
    });

    console.log("\n🎉 Your database is ready to use!\n");
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check DATABASE_URL in .env file");
    console.error("2. Verify database connection is working");
    console.error("3. Check schema.sql for syntax errors");
    console.error("4. Ensure you have CREATE TABLE permissions\n");
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup
setupDatabase();
