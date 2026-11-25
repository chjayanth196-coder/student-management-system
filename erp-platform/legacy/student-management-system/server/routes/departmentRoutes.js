const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  setDepartmentStatus,
} = require("../controllers/departmentController");

const router = express.Router({ mergeParams: true });

router.post("/", protect, adminOnly, academicTenantScope, createDepartment);
router.get("/", protect, adminOnly, academicTenantScope, listDepartments);
router.get("/:id", protect, adminOnly, academicTenantScope, getDepartment);
router.put("/:id", protect, adminOnly, academicTenantScope, updateDepartment);
router.patch("/:id/toggle", protect, adminOnly, academicTenantScope, setDepartmentStatus);

module.exports = router;

