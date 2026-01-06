// backend/controllers/authController.js
// Handles user registration, login, and profile

const pool = require("../config/database");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

// ============================================================================
// REGISTER NEW USER
// ============================================================================
exports.register = async (req, res) => {
  try {
    console.log("📝 [Auth] Register request received");
    console.log("   Headers:", req.headers);
    console.log("   Body:", req.body);
    console.log("   Body type:", typeof req.body);

    const { email, password, firstName, lastName, dateOfBirth } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({
        error: "All fields are required",
        missing: {
          email: !email,
          password: !password,
          firstName: !firstName,
          lastName: !lastName,
          dateOfBirth: !dateOfBirth,
        },
      });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    // Validate date of birth format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({
        error: "Date of birth must be in format YYYY-MM-DD",
      });
    }

    // Check if user already exists
    const checkQuery = "SELECT id FROM users WHERE email = $1";
    const checkResult = await pool.query(checkQuery, [email.toLowerCase()]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, date_of_birth, created_at
    `;

    const result = await pool.query(insertQuery, [
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      dateOfBirth,
    ]);

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user.id);

    console.log("✅ [Auth] User registered successfully:", user.id);

    // Return user data and token
    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("❌ [Auth] Register error:", error);
    res.status(500).json({
      error: "Failed to create account",
      message: error.message,
    });
  }
};

// ============================================================================
// LOGIN USER
// ============================================================================
exports.login = async (req, res) => {
  try {
    console.log("🔐 [Auth] Login request received");
    console.log("   Content-Type:", req.headers["content-type"]);
    console.log("   Body:", req.body);
    console.log("   Body keys:", Object.keys(req.body || {}));
    console.log("   Body is undefined?", req.body === undefined);
    console.log("   Body is null?", req.body === null);

    const { email, password } = req.body;

    console.log("   Extracted email:", email);
    console.log(
      "   Extracted password:",
      password ? "[PROVIDED]" : "[MISSING]"
    );

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user by email
    const query = `
      SELECT id, email, password_hash, first_name, last_name, date_of_birth, created_at
      FROM users
      WHERE email = $1
    `;
    const result = await pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check if user has a voice
    const voiceQuery =
      "SELECT id, status, created_at FROM voices WHERE user_id = $1";
    const voiceResult = await pool.query(voiceQuery, [user.id]);
    const voice = voiceResult.rows[0] || null;

    // Generate JWT token
    const token = generateToken(user.id);

    console.log("✅ [Auth] Login successful:", user.id);

    // Return user data and token
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth,
        createdAt: user.created_at,
        hasVoice: !!voice,
        voiceStatus: voice ? voice.status : null,
      },
      token,
    });
  } catch (error) {
    console.error("❌ [Auth] Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: error.message,
    });
  }
};

// ============================================================================
// GET USER PROFILE
// ============================================================================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId (matches auth middleware)

    console.log("👤 [Auth] Getting profile for user:", userId);

    // Get user data
    const userQuery = `
      SELECT id, email, first_name, last_name, date_of_birth, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Get voice data if exists
    const voiceQuery = `
      SELECT id, elevenlabs_voice_id, audio_file_url, duration_seconds, status, created_at, updated_at
      FROM voices
      WHERE user_id = $1
    `;
    const voiceResult = await pool.query(voiceQuery, [userId]);
    const voice = voiceResult.rows[0] || null;

    // Get audio count
    let audioCount = 0;
    if (voice) {
      const countQuery =
        "SELECT COUNT(*) as count FROM generated_audio WHERE voice_id = $1";
      const countResult = await pool.query(countQuery, [voice.id]);
      audioCount = parseInt(countResult.rows[0].count);
    }

    console.log("✅ [Auth] Profile retrieved successfully");

    // Return complete profile
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      voice: voice
        ? {
            id: voice.id,
            status: voice.status,
            durationSeconds: voice.duration_seconds,
            createdAt: voice.created_at,
            updatedAt: voice.updated_at,
          }
        : null,
      stats: {
        audioGenerated: audioCount,
      },
    });
  } catch (error) {
    console.error("❌ [Auth] Get profile error:", error);
    res.status(500).json({
      error: "Failed to get profile",
      message: error.message,
    });
  }
};
