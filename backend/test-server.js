// Minimal test server to diagnose body parsing
require("dotenv").config();
const express = require("express");

const app = express();
const PORT = 5002; // Different port to avoid conflicts

console.log("Starting minimal test server...");

// Body parser middleware
app.use(express.json());

console.log("express.json() middleware registered");

// Test route
app.post("/test", (req, res) => {
  console.log("Test route hit!");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("Body type:", typeof req.body);

  res.json({
    success: true,
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyIsUndefined: req.body === undefined,
  });
});

app.listen(PORT, () => {
  console.log(`\nMinimal test server running on http://localhost:${PORT}`);
  console.log("Test with: POST http://localhost:${PORT}/test");
  console.log('Body: {"email": "test@test.com", "password": "test123"}\n');
});
