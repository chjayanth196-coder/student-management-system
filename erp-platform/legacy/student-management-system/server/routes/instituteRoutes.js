const express = require("express");
const { protect } = require("../middleware/auth");
const superAdminOnly = require("../middleware/superAdminOnly");
const {
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getInstitution,
  listInstitutions,
  setInstitutionActive,
} = require("../controllers/institutionController");

const router = express.Router();

// Platform-level Institution Management (Super Admin only)
router.post("/", protect, superAdminOnly, createInstitution);
router.get("/", protect, superAdminOnly, listInstitutions);
router.get("/:id", protect, superAdminOnly, getInstitution);
router.put("/:id", protect, superAdminOnly, updateInstitution);
router.delete("/:id", protect, superAdminOnly, deleteInstitution);
router.patch("/:id/toggle", protect, superAdminOnly, setInstitutionActive);

module.exports = router;


