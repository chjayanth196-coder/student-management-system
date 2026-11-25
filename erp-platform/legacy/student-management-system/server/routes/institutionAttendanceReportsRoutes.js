const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const {
  getDailySummary,
  getMonthlySummary,
  listAttendanceRecords,
  getTeacherAttendance,
  getStudentAttendance,
  getClassAttendance,
  getSectionAttendance,
  getSubjectAttendance,
  getAttendanceCalendar,
  getAttendanceStatistics,
  exportAttendanceCsv,
} = require("../controllers/attendanceReportsController");


const router = express.Router({ mergeParams: true });

// Reports & statistics (tenant-aware)
router.get("/daily/summary", protect, academicTenantScope, getDailySummary);
router.get("/monthly/summary", protect, academicTenantScope, getMonthlySummary);

// Generic records listing for reports
router.get("/reports/records", protect, academicTenantScope, listAttendanceRecords);

// Phase 5 (Batch 2) - Attendance views
router.get("/reports/teacher/:teacherId", protect, academicTenantScope, getTeacherAttendance);
router.get("/reports/student/:studentId", protect, academicTenantScope, getStudentAttendance);
router.get("/reports/class/:classId", protect, academicTenantScope, getClassAttendance);
router.get("/reports/section/:sectionId", protect, academicTenantScope, getSectionAttendance);
router.get("/reports/subject/:subjectId", protect, academicTenantScope, getSubjectAttendance);

// Calendar + statistics + export
router.get("/calendar", protect, academicTenantScope, getAttendanceCalendar);
router.get("/statistics", protect, academicTenantScope, getAttendanceStatistics);
router.get("/export/csv", protect, academicTenantScope, exportAttendanceCsv);


module.exports = router;

