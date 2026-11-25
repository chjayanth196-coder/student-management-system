const express = require("express");
const {
  markAttendance,
  markAttendanceBulkForAll,
  getAttendanceForStudent,
  getMyAttendance,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const router = express.Router({ mergeParams: true });

// Tenant-aware attendance endpoints (Phase 5 starter):
// Keep this minimal but institution-aware so we can build daily/monthly/reports on top.
// Daily
router.post("/daily", protect, adminOnly, academicTenantScope, markAttendance);
router.post("/daily/bulk", protect, adminOnly, academicTenantScope, markAttendanceBulkForAll);

// CRUD helpers (tenant aware)
router.get("/student/:studentId", protect, adminOnly, academicTenantScope, getAttendanceForStudent);
router.get("/me", protect, getMyAttendance);
router.put("/:id", protect, adminOnly, updateAttendance);
router.delete("/:id", protect, adminOnly, deleteAttendance);

module.exports = router;

