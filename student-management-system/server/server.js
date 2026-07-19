require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const resultRoutes = require("./routes/resultRoutes");
const instituteRoutes = require("./routes/instituteRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Student Management System API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/institutes", instituteRoutes);

// 404 handler (API routes)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Serve React build (single complete link)
// Build folder should exist after: client npm run build
const path = require("path");
const fs = require("fs");
const buildDir = path.join(__dirname, "..", "client", "build");

if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));

  // SPA fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildDir, "index.html"));
  });
}


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
