const User = require("../models/User");

// @route POST /api/students        (admin only) - create a new student account
const createStudent = async (req, res) => {
  try {
    const {
      name, email, password, rollNo, class: className, section,
      dob, phone, address, parentName, parentPhone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const institutionId = req.tenantId;

    const student = await User.create({
      name,
      email,
      password,
      role: "student",
      institutionId,
      rollNo,
      className,
      section,
      dob,
      phone,
      address,
      parentName,
      parentPhone,
    });

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/students          (admin only) - list all students
const getStudents = async (req, res) => {
  try {
    const filter = { role: "student" };
    if (req.tenantId) filter.institutionId = req.tenantId;

    const students = await User.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/students/:id      (admin only) - get a single student
const getStudentById = async (req, res) => {
  try {
    const q = { _id: req.params.id, role: "student" };
    if (req.tenantId) q.institutionId = req.tenantId;

    const student = await User.findOne(q);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PUT /api/students/:id      (admin only) - update a student profile
const updateStudent = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.role; // role can never be changed via this route
    delete updates.password; // password changes are out of scope for this route

    const filter = { _id: req.params.id, role: "student" };
    if (req.tenantId) filter.institutionId = req.tenantId;

    const student = await User.findOneAndUpdate(
      filter,
      updates,
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/students/:id   (admin only) - remove a student
const deleteStudent = async (req, res) => {
  try {
    const filter = { _id: req.params.id, role: "student" };
    if (req.tenantId) filter.institutionId = req.tenantId;

    const student = await User.findOneAndDelete(filter);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/students/me       (student only) - own profile
const getMyProfile = async (req, res) => {
  res.json(req.user);
};

module.exports = {
  createStudent, getStudents, getStudentById, updateStudent, deleteStudent, getMyProfile,
};
