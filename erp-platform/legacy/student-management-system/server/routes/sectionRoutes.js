const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const {
  createSection,
  listSections,
  getSection,
  updateSection,
  setSectionStatus,
} = require("../controllers/sectionController");

const router = express.Router({ mergeParams: true });

router.post("/", protect, adminOnly, academicTenantScope, createSection);
router.get("/", protect, adminOnly, academicTenantScope, listSections);
router.get("/:id", protect, adminOnly, academicTenantScope, getSection);
router.put("/:id", protect, adminOnly, academicTenantScope, updateSection);
router.patch("/:id/toggle", protect, adminOnly, academicTenantScope, setSectionStatus);

module.exports = router;

