const express = require("express");
const {
  createStudent, getStudents, getStudentById, updateStudent, deleteStudent, getMyProfile,
} = require("../controllers/studentController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Student's own profile
router.get("/me", protect, getMyProfile);

// Admin-managed student CRUD
router.post("/", protect, adminOnly, createStudent);
router.get("/", protect, adminOnly, getStudents);
router.get("/:id", protect, adminOnly, getStudentById);
router.put("/:id", protect, adminOnly, updateStudent);
router.delete("/:id", protect, adminOnly, deleteStudent);

module.exports = router;
