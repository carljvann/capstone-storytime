// backend/middleware/auth.js
// JWT authentication middleware
const jwt = require("jsonwebtoken");

// ============================================================================
// REQUIRE AUTHENTICATION
// Verifies JWT token and attaches user to request
// ============================================================================
exports.requireAuth = (req, res, next) => {
  try {
    // Get token from Authorization header
    // Expected format: "Bearer TOKEN_HERE"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "No authorization header",
        message: "Please provide a valid token",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format",
        message: 'Authorization header must start with "Bearer "',
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
        message: "Token is missing from Authorization header",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("🔐 [Auth] Token decoded, user ID:", decoded.id);

    // Attach user ID to request object (both id and userId for compatibility)
    req.user = {
      id: decoded.id,
      userId: decoded.id,
    };

    console.log("✅ [Auth] req.user set:", req.user);

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please login again.",
      });
    }

    // Generic error
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Invalid or expired token",
    });
  }
};

// ============================================================================
// OPTIONAL AUTHENTICATION
// Attaches user if token is valid, but doesn't require it
// ============================================================================
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      userId: decoded.id,
    };

    next();
  } catch (error) {
    // Token invalid - continue without user
    req.user = null;
    next();
  }
};
