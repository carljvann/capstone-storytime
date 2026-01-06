// Audio Routes
// Handles text-to-speech generation and audio history

const express = require("express");
const router = express.Router();
const audioController = require("../controllers/audioController");
const { requireAuth } = require("../middleware/auth");

// ============================================================================
// ROUTES - All routes require authentication
// ============================================================================

/**
 * @route   POST /api/audio
 * @desc    Generate audio from text using user's voice clone
 * @access  Private
 *
 * Body: {
 *   text: string (required, max 5000 chars),
 *   stability?: number (optional, 0-1, default 0.75),
 *   similarityBoost?: number (optional, 0-1, default 0.75)
 * }
 */
router.post("/", requireAuth, audioController.generateAudio);

/**
 * @route   GET /api/audio/history
 * @desc    Get user's audio generation history (paginated)
 * @access  Private
 *
 * Query params:
 *   limit?: number (default 50)
 *   offset?: number (default 0)
 */
router.get("/history", requireAuth, audioController.getHistory);

/**
 * @route   GET /api/audio/:id
 * @desc    Get a specific audio file by ID
 * @access  Private
 */
router.get("/:id", requireAuth, audioController.getAudio);

/**
 * @route   DELETE /api/audio/:id
 * @desc    Delete a specific audio file
 * @access  Private
 */
router.delete("/:id", requireAuth, audioController.deleteAudio);

module.exports = router;
