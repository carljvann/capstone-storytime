const pool = require("../config/database");
const elevenLabsService = require("../services/elevenLabsService");
const storageService = require("../services/storageService");
const fs = require("fs").promises;

// Create voice clone from uploaded audio
exports.createVoice = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has a voice
    const existingVoice = await pool.query(
      "SELECT * FROM voices WHERE user_id = $1",
      [userId]
    );

    if (existingVoice.rows.length > 0) {
      return res.status(400).json({
        message:
          "You already have a voice clone. Please delete it first to create a new one.",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const audioFile = req.file;
    console.log("📁 Uploaded file:", audioFile.filename);
    console.log("📊 File size:", (audioFile.size / 1024).toFixed(2), "KB");

    // Get audio duration (rough estimate based on file size)
    // Average MP3 bitrate is ~128kbps, so 1 minute ≈ 960KB
    const durationSeconds = Math.ceil(audioFile.size / 1024 / 16);

    // Upload to ElevenLabs for voice cloning
    console.log("🎙️ Sending to ElevenLabs for voice cloning...");
    const voiceData = await elevenLabsService.cloneVoice(
      audioFile.path,
      `Voice_${userId}`
    );

    // Upload original audio to permanent storage
    const audioUrl = await storageService.uploadFile(
      audioFile.path,
      `voices/${userId}_${Date.now()}.mp3`
    );

    // Delete temp file
    await fs.unlink(audioFile.path);

    // Save to database
    const result = await pool.query(
      `INSERT INTO voices 
       (user_id, elevenlabs_voice_id, audio_file_url, duration_seconds, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, voiceData.voiceId, audioUrl, durationSeconds, "ready"]
    );

    console.log("✅ Voice clone created successfully:", result.rows[0].id);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error("Error deleting temp file:", e);
      }
    }

    console.error("Error creating voice:", error);
    res.status(500).json({
      message: "Failed to create voice clone",
      error: error.message,
    });
  }
};

// Get user's voice clone
exports.getMyVoice = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query("SELECT * FROM voices WHERE user_id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No voice clone found" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting voice:", error);
    res.status(500).json({ message: "Failed to get voice" });
  }
};

// Get voice status
exports.getVoiceStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT status, elevenlabs_voice_id, created_at FROM voices WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: "none",
        message: "No voice clone found",
      });
    }

    const voice = result.rows[0];

    res.json({
      success: true,
      status: voice.status,
      voiceId: voice.elevenlabs_voice_id,
      createdAt: voice.created_at,
    });
  } catch (error) {
    console.error("Error getting voice status:", error);
    res.status(500).json({ message: "Failed to get voice status" });
  }
};

// Delete voice clone
exports.deleteVoice = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get voice
    const voiceResult = await pool.query(
      "SELECT * FROM voices WHERE user_id = $1",
      [userId]
    );

    if (voiceResult.rows.length === 0) {
      return res.status(404).json({ message: "No voice clone found" });
    }

    const voice = voiceResult.rows[0];

    // Delete from ElevenLabs
    console.log(
      "🗑️ Deleting voice from ElevenLabs:",
      voice.elevenlabs_voice_id
    );
    try {
      await elevenLabsService.deleteVoice(voice.elevenlabs_voice_id);
    } catch (error) {
      console.error("Error deleting from ElevenLabs:", error);
      // Continue with database deletion even if ElevenLabs fails
    }

    // Delete audio file from storage
    if (voice.audio_file_url) {
      try {
        await storageService.deleteFile(voice.audio_file_url);
      } catch (error) {
        console.error("Error deleting audio file:", error);
        // Continue with database deletion
      }
    }

    // Delete from database (CASCADE will delete all generated audio)
    await pool.query("DELETE FROM voices WHERE id = $1", [voice.id]);

    console.log("✅ Voice clone deleted successfully");

    res.json({
      success: true,
      message: "Voice clone deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting voice:", error);
    res.status(500).json({
      message: "Failed to delete voice clone",
      error: error.message,
    });
  }
};
