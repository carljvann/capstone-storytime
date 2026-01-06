const jwt = require("jsonwebtoken");
console.log(
  "🔑 JWT_SECRET in generateToken:",
  !!process.env.JWT_SECRET,
  process.env.JWT_SECRET?.substring(0, 10) + "..."
);

/**
 * Generate a JWT token for a user
 * @param {number} userId - The user's database ID
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  // Create payload
  const payload = {
    id: userId,
  };

  // Sign token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token expires in 30 days
  });

  return token;
};

module.exports = generateToken;
