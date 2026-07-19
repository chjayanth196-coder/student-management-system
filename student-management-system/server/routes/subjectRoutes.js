const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const academicTenantScope = require("../middleware/academicTenantScope");

const {
  createSubject,
  listSubjects,
  getSubject,
  updateSubject,
  setSubjectStatus,
} = require("../controllers/subjectController");

const router = express.Router({ mergeParams: true });

router.post("/", protect, adminOnly, academicTenantScope, createSubject);
router.get("/", protect, adminOnly, academicTenantScope, listSubjects);
router.get("/:id", protect, adminOnly, academicTenantScope, getSubject);
router.put("/:id", protect, adminOnly, academicTenantScope, updateSubject);
router.patch("/:id/toggle", protect, adminOnly, academicTenantScope, setSubjectStatus);

module.exports = router;

