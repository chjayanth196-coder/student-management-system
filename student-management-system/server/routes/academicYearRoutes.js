const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const {
  createAcademicYear,
  listAcademicYears,
  getAcademicYear,
  updateAcademicYear,
  setAcademicYearActive,
} = require("../controllers/academicYearController");

const router = express.Router({ mergeParams: true });

// Institution Admin + Super Admin (scoped by institutionId param)
router.post("/", protect, adminOnly, academicTenantScope, createAcademicYear);
router.get("/", protect, adminOnly, academicTenantScope, listAcademicYears);
router.get("/:id", protect, adminOnly, academicTenantScope, getAcademicYear);
router.put("/:id", protect, adminOnly, academicTenantScope, updateAcademicYear);
router.patch("/:id/toggle", protect, adminOnly, academicTenantScope, setAcademicYearActive);

module.exports = router;

