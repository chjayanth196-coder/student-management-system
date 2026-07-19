require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const resultRoutes = require("./routes/resultRoutes");
const instituteRoutes = require("./routes/instituteRoutes");

const academicYearRoutes = require("./routes/academicYearRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const classRoutes = require("./routes/classRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const staffRoutes = require("./routes/staffRoutes");
const institutionAttendanceRoutes = require("./routes/institutionAttendanceRoutes");


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

// Institution-specific academic structure (Phase 3)
app.use("/api/institutions/:institutionId/academic-years", academicYearRoutes);
app.use("/api/institutions/:institutionId/departments", departmentRoutes);
app.use("/api/institutions/:institutionId/classes", classRoutes);
app.use("/api/institutions/:institutionId/sections", sectionRoutes);
app.use("/api/institutions/:institutionId/subjects", subjectRoutes);

// Institution-scoped staff & teacher management (Phase 4)
app.use("/api/institutions/:institutionId/staff", staffRoutes);

// Institution-scoped attendance (Phase 5 starter)
app.use("/api/institutions/:institutionId/attendance", institutionAttendanceRoutes);

// Institution-scoped attendance reports & analytics (Phase 5)
const institutionAttendanceReportsRoutes = require("./routes/institutionAttendanceReportsRoutes");
app.use("/api/institutions/:institutionId/attendance/reports", institutionAttendanceReportsRoutes);



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
