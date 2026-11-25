const express = require("express");
const {
  markAttendance,
  markAttendanceBulkForAll,
  updateAttendance,
  deleteAttendance,
  getAttendanceForStudent,
  getMyAttendance,
} = require("../controllers/attendanceController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Student's own attendance
router.get("/me", protect, getMyAttendance);

// Admin-managed attendance
router.post("/", protect, adminOnly, markAttendance);
router.post("/bulk", protect, adminOnly, markAttendanceBulkForAll);
router.put("/:id", protect, adminOnly, updateAttendance);
router.delete("/:id", protect, adminOnly, deleteAttendance);
router.get("/student/:studentId", protect, adminOnly, getAttendanceForStudent);

module.exports = router;

