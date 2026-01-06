const pool = require("../config/database");
const elevenLabsService = require("../services/elevenLabsService");
const storageService = require("../services/storageService");
const fs = require("fs").promises;
const path = require("path");

// Generate audio from text using voice clone
exports.generateAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, stability, similarityBoost } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Text is required" });
    }

    if (text.length > 5000) {
      return res
        .status(400)
        .json({ message: "Text must be less than 5000 characters" });
    }

    // Get user's voice
    const voiceResult = await pool.query(
      "SELECT * FROM voices WHERE user_id = $1",
      [userId]
    );

    if (voiceResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No voice clone found. Please create one first." });
    }

    const voice = voiceResult.rows[0];

    if (voice.status !== "ready") {
      return res
        .status(400)
        .json({ message: "Voice clone is still processing" });
    }

    console.log("🎵 Generating audio for user:", userId);
    console.log("📝 Text:", text.substring(0, 50) + "...");

    // Generate speech using ElevenLabs
    const audioBuffer = await elevenLabsService.generateSpeech(
      voice.elevenlabs_voice_id,
      text,
      {
        stability: stability || 0.75,
        similarity_boost: similarityBoost || 0.75,
      }
    );

    // Save audio file to storage
    const timestamp = Date.now();
    const filename = `audio_${userId}_${timestamp}.mp3`;
    const tempPath = path.join(__dirname, "../uploads/temp", filename);

    // Write buffer to temporary file
    await fs.writeFile(tempPath, audioBuffer);

    // Upload to permanent storage
    const audioUrl = await storageService.uploadFile(
      tempPath,
      `audio/${filename}`
    );

    // Clean up temp file
    await fs.unlink(tempPath);

    // Estimate duration (rough estimate: ~150 words per minute, ~5 chars per word)
    const estimatedWords = text.length / 5;
    const estimatedMinutes = estimatedWords / 150;
    const durationSeconds = Math.ceil(estimatedMinutes * 60);

    // Save to database
    const result = await pool.query(
      `INSERT INTO generated_audio 
       (voice_id, input_text, audio_url, character_count, duration_seconds) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [voice.id, text, audioUrl, text.length, durationSeconds]
    );

    console.log("✅ Audio generated and saved:", result.rows[0].id);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    res.status(500).json({
      message: "Failed to generate audio",
      error: error.message,
    });
  }
};

// Get audio generation history for user
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Get user's voice first
    const voiceResult = await pool.query(
      "SELECT id FROM voices WHERE user_id = $1",
      [userId]
    );

    if (voiceResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { limit, offset, total: 0 },
      });
    }

    const voiceId = voiceResult.rows[0].id;

    // Get audio history
    const result = await pool.query(
      `SELECT * FROM generated_audio 
       WHERE voice_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [voiceId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM generated_audio WHERE voice_id = $1",
      [voiceId]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Error getting audio history:", error);
    res.status(500).json({ message: "Failed to get audio history" });
  }
};

// Get single audio by ID
exports.getAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const audioId = req.params.id;

    // Verify audio belongs to user
    const result = await pool.query(
      `SELECT a.* FROM generated_audio a
       JOIN voices v ON a.voice_id = v.id
       WHERE a.id = $1 AND v.user_id = $2`,
      [audioId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Audio not found" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting audio:", error);
    res.status(500).json({ message: "Failed to get audio" });
  }
};

// Delete audio
exports.deleteAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const audioId = req.params.id;

    // Get audio and verify ownership
    const audioResult = await pool.query(
      `SELECT a.* FROM generated_audio a
       JOIN voices v ON a.voice_id = v.id
       WHERE a.id = $1 AND v.user_id = $2`,
      [audioId, userId]
    );

    if (audioResult.rows.length === 0) {
      return res.status(404).json({ message: "Audio not found" });
    }

    const audio = audioResult.rows[0];

    // Delete from storage
    await storageService.deleteFile(audio.audio_url);

    // Delete from database
    await pool.query("DELETE FROM generated_audio WHERE id = $1", [audioId]);

    console.log("✅ Audio deleted:", audioId);

    res.json({
      success: true,
      message: "Audio deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting audio:", error);
    res.status(500).json({ message: "Failed to delete audio" });
  }
};
