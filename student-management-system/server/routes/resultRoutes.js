const express = require("express");
const {
  addResult, updateResult, deleteResult, getResultsForStudent, getMyResults,
} = require("../controllers/resultController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Student's own results
router.get("/me", protect, getMyResults);

// Admin-managed results
router.post("/", protect, adminOnly, addResult);
router.put("/:id", protect, adminOnly, updateResult);
router.delete("/:id", protect, adminOnly, deleteResult);
router.get("/student/:studentId", protect, adminOnly, getResultsForStudent);

module.exports = router;
