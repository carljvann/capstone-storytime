require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const voiceRoutes = require("./routes/voices");
const audioRoutes = require("./routes/audio");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
  console.log(req.method + " " + req.path);
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "VoiceClone API",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/voices", voiceRoutes);
app.use("/api/audio", audioRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Cannot " + req.method + " " + req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log("\nServer running on port " + PORT);
  console.log("Environment: " + (process.env.NODE_ENV || "development"));
  console.log("Local: http://localhost:" + PORT);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

module.exports = app;
