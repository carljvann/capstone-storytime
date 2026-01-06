// backend/routes/auth.js
// Authentication routes

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

// DEBUG ROUTE - Test if body parsing works
router.post("/test", (req, res) => {
  console.log("🧪 TEST ROUTE HIT");
  console.log("   Headers:", req.headers);
  console.log("   Body:", req.body);
  res.json({
    message: "Test route",
    body: req.body,
    bodyExists: !!req.body,
    bodyType: typeof req.body,
  });
});

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Register new user
// POST /api/auth/register
// Body: { email, password, firstName, lastName, dateOfBirth }
router.post("/register", authController.register);

// Login user
// POST /api/auth/login
// Body: { email, password }
router.post("/login", authController.login);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

// Get current user profile
// GET /api/auth/profile
// Headers: Authorization: Bearer <token>
router.get("/profile", requireAuth, authController.getProfile);

// Alternative route for getting user profile
// GET /api/users/me
router.get("/me", requireAuth, authController.getProfile);

module.exports = router;
