const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("🌱 Seeding database with test data...\n");

    // Check if data already exists
    const checkQuery = "SELECT COUNT(*) FROM users";
    const checkResult = await client.query(checkQuery);
    const userCount = parseInt(checkResult.rows[0].count);

    if (userCount > 0) {
      console.log("⚠️  Database already has data. Skipping seed.");
      console.log(`   Found ${userCount} existing user(s)\n`);
      console.log("To reset and seed, run: npm run db:reset\n");
      process.exit(0);
    }

    // Hash password for test users
    const password = "password123";
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("👤 Creating test users...");

    // Create test user 1
    const user1Query = `
      INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name;
    `;
    const user1 = await client.query(user1Query, [
      "john.doe@example.com",
      passwordHash,
      "John",
      "Doe",
      "1990-01-15",
    ]);
    console.log(`   ✓ Created: ${user1.rows[0].email}`);

    // Create test user 2
    const user2 = await client.query(user1Query, [
      "jane.smith@example.com",
      passwordHash,
      "Jane",
      "Smith",
      "1985-05-20",
    ]);
    console.log(`   ✓ Created: ${user2.rows[0].email}`);

    // Create test user 3 (no voice)
    const user3 = await client.query(user1Query, [
      "bob.wilson@example.com",
      passwordHash,
      "Bob",
      "Wilson",
      "1992-08-10",
    ]);
    console.log(`   ✓ Created: ${user3.rows[0].email}`);

    console.log("\n🎤 Creating test voice clones...");

    // Create voice for user 1 (ready)
    const voice1Query = `
      INSERT INTO voices (user_id, elevenlabs_voice_id, audio_file_url, duration_seconds, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, status;
    `;
    const voice1 = await client.query(voice1Query, [
      user1.rows[0].id,
      "TEST_VOICE_ID_123ABC",
      "https://example.com/voices/john-voice-recording.mp3",
      18,
      "ready",
    ]);
    console.log(
      `   ✓ Created voice for ${user1.rows[0].first_name} (status: ready)`
    );

    // Create voice for user 2 (processing)
    const voice2 = await client.query(voice1Query, [
      user2.rows[0].id,
      "TEST_VOICE_ID_456DEF",
      "https://example.com/voices/jane-voice-recording.mp3",
      22,
      "processing",
    ]);
    console.log(
      `   ✓ Created voice for ${user2.rows[0].first_name} (status: processing)`
    );

    console.log("\n🔊 Creating test generated audio...");

    // Create generated audio for user 1
    const audioQuery = `
      INSERT INTO generated_audio (voice_id, input_text, audio_url, character_count, duration_seconds)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, input_text;
    `;

    const audio1 = await client.query(audioQuery, [
      voice1.rows[0].id,
      "Hello! This is a test of my voice clone. It sounds pretty good!",
      "https://example.com/audio/audio-001.mp3",
      63,
      4,
    ]);
    console.log(
      `   ✓ Generated: "${audio1.rows[0].input_text.substring(0, 30)}..."`
    );

    const audio2 = await client.query(audioQuery, [
      voice1.rows[0].id,
      "Testing the voice clone with a different sentence. Amazing technology!",
      "https://example.com/audio/audio-002.mp3",
      72,
      5,
    ]);
    console.log(
      `   ✓ Generated: "${audio2.rows[0].input_text.substring(0, 30)}..."`
    );

    const audio3 = await client.query(audioQuery, [
      voice1.rows[0].id,
      "One more test to see how well this works. I love hearing my own voice!",
      "https://example.com/audio/audio-003.mp3",
      74,
      5,
    ]);
    console.log(
      `   ✓ Generated: "${audio3.rows[0].input_text.substring(0, 30)}..."`
    );

    // Summary
    console.log("\n📊 Seed Summary:");

    const userCountResult = await client.query("SELECT COUNT(*) FROM users");
    console.log(`   Users: ${userCountResult.rows[0].count}`);

    const voiceCountResult = await client.query("SELECT COUNT(*) FROM voices");
    console.log(`   Voices: ${voiceCountResult.rows[0].count}`);

    const audioCountResult = await client.query(
      "SELECT COUNT(*) FROM generated_audio"
    );
    console.log(`   Generated Audio: ${audioCountResult.rows[0].count}`);

    console.log("\n🔑 Test Credentials:");
    console.log("   Email: john.doe@example.com");
    console.log("   Email: jane.smith@example.com");
    console.log("   Email: bob.wilson@example.com");
    console.log(`   Password (all): ${password}`);

    console.log("\n✅ Database seeded successfully!\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    console.error("\nDetails:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seedDatabase();
