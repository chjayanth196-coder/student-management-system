const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const staffTenantScope = require("../middleware/staffTenantScope");

const {
  listStaff,
  getMyStaffProfile,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetPassword,
} = require("../controllers/staffController");

const { upsertStaffAssignments } = require("../controllers/staffAssignmentController");

const router = express.Router();

// Teacher profile (self)
router.get("/me", protect, staffTenantScope, getMyStaffProfile);

// Institution Admin / Super Admin Staff CRUD
router.get("/", protect, adminOnly, staffTenantScope, listStaff);
router.get("/:staffId", protect, adminOnly, staffTenantScope, getStaff);
router.post("/", protect, adminOnly, staffTenantScope, createStaff);
router.put("/:staffId", protect, adminOnly, staffTenantScope, updateStaff);
router.delete("/:staffId", protect, adminOnly, staffTenantScope, deleteStaff);
router.patch("/:staffId/toggle", protect, adminOnly, staffTenantScope, toggleStaffStatus);

router.post("/:staffId/reset-password", protect, adminOnly, staffTenantScope, resetPassword);

router.post("/:staffId/assignments", protect, adminOnly, staffTenantScope, upsertStaffAssignments);

module.exports = router;

