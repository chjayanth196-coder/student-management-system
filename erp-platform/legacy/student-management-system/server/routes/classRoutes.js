const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const {
  createClass,
  listClasses,
  getClass,
  updateClass,
  setClassStatus,
} = require("../controllers/classController");

const router = express.Router({ mergeParams: true });

router.post("/", protect, adminOnly, academicTenantScope, createClass);
router.get("/", protect, adminOnly, academicTenantScope, listClasses);
router.get("/:id", protect, adminOnly, academicTenantScope, getClass);
router.put("/:id", protect, adminOnly, academicTenantScope, updateClass);
router.patch("/:id/toggle", protect, adminOnly, academicTenantScope, setClassStatus);

module.exports = router;

