// backend/routes/voices.js
// Voice clone routes - handles voice creation, retrieval, and deletion
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const voiceController = require("../controllers/voiceController");
const { requireAuth } = require("../middleware/auth");

// ============================================================================
// File Upload Middleware
// ============================================================================

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store in uploads/temp directory
    cb(null, "uploads/temp");
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random suffix
    // Note: req.user is not available here (auth happens after upload)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - only accept audio files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "audio/mpeg", // .mp3
    "audio/wav", // .wav
    "audio/mp4", // .m4a
    "audio/x-m4a", // .m4a alternative
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only MP3, WAV, and M4A files are allowed."),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// ============================================================================
// ROUTES - All routes require authentication
// ============================================================================

// Create voice clone
// POST /api/voices
// Headers: Authorization: Bearer <token>
// Body: multipart/form-data with 'audio' field containing audio file
// Description: Upload audio file to create a new voice clone (one per user)
router.post(
  "/",
  requireAuth,
  upload.single("audio"),
  voiceController.createVoice
);

// Get user's voice clone
// GET /api/voices/mine
// Headers: Authorization: Bearer <token>
// Description: Retrieve the authenticated user's voice clone details
router.get("/mine", requireAuth, voiceController.getMyVoice);

// Get voice status (for polling during processing)
// GET /api/voices/status
// Headers: Authorization: Bearer <token>
// Description: Check if user has a voice and its current processing status
router.get("/status", requireAuth, voiceController.getVoiceStatus);

// Delete user's voice clone
// DELETE /api/voices/mine
// Headers: Authorization: Bearer <token>
// Description: Delete the authenticated user's voice clone and all associated generated audio
router.delete("/mine", requireAuth, voiceController.deleteVoice);

// ============================================================================
// ERROR HANDLING FOR MULTER
// ============================================================================

// Multer error handler middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "Audio file must be under 10MB",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected field",
        message: "Please upload file with field name 'audio'",
      });
    }
    return res.status(400).json({
      error: "Upload error",
      message: err.message,
    });
  }

  // Handle other errors
  if (err.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: "Invalid file type",
      message: err.message,
    });
  }

  // Pass to global error handler
  next(err);
});

module.exports = router;
