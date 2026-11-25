const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Staff = require("../models/Staff");

const staffTypeRequiresDepartment = (staffType) => {
  // Teachers and teacher-like roles need department
  const types = new Set(["Teacher", "Class Teacher", "HOD", "Exam Cell", "Principal", "Vice Principal"]);
  return types.has(staffType);
};

const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
const validatePhoneFormat = (phone) => {
  const p = String(phone || "").trim();
  if (!p) return true; // optional
  return /^[0-9+\-()\s]{7,20}$/.test(p);
};

const validateJoiningDate = (joiningDate) => {
  if (!joiningDate) return true; // optional
  const d = new Date(joiningDate);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() <= Date.now();
};

// Simple employeeId generator: EMP-0001 style using Staff count.
// In production you’d typically use a separate counter collection to avoid race conditions.
const generateNextEmployeeId = async (institutionId) => {
  const prefix = "EMP";
  const count = await Staff.countDocuments({ institutionId, deletedAt: { $exists: false }, status: { $ne: "deleted" } });
  const nextNum = count + 1;
  const padded = String(nextNum).padStart(4, "0");
  return `${prefix}-${padded}`;
};

// GET /api/institutions/:institutionId/staff
const listStaff = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      staffType,
      status,
      departmentId,
    } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 10);

    const filter = {
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    };

    if (staffType) filter.staffType = staffType;
    if (status) filter.status = status;
    if (departmentId) filter.departmentId = departmentId;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Staff.countDocuments(filter);
    const items = await Staff.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l);

    res.json({
      items,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/institutions/:institutionId/staff/me
const getMyStaffProfile = async (req, res) => {
  try {
    // Teachers can only access their own profile
    const staff = await Staff.findOne({ userId: req.user._id, institutionId: req.staffInstitutionId });
    if (!staff || staff.deletedAt) {
      return res.status(404).json({ message: "Staff profile not found" });
    }
    if (staff.status === "inactive") {
      return res.status(403).json({ message: "Staff account is inactive" });
    }

    return res.json({
      ...staff.toObject(),
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/institutions/:institutionId/staff/:staffId
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.staffId,
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    return res.json({
      ...staff.toObject(),
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/institutions/:institutionId/staff
const createStaff = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      photo,
      gender,
      dob,
      phone,
      alternatePhone,
      address,
      qualification,
      specialization,
      experience,
      joiningDate,
      designation,
      staffType,
      departmentId,
      assignedClassId,
      assignedSectionId,
      assignedSubjectIds,
      classTeacher,
      salary,
      role, // role for User account (optional)
    } = req.body;

    if (!firstName || !lastName || !email || !password || !staffType) {
      return res.status(400).json({ message: "firstName, lastName, email, password and staffType are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (!validateEmailFormat(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePhoneFormat(phone) || !validatePhoneFormat(alternatePhone)) {
      return res.status(400).json({ message: "Invalid phone format" });
    }
    if (!validateJoiningDate(joiningDate)) {
      return res.status(400).json({ message: "joiningDate cannot be in the future or invalid" });
    }

    if (staffTypeRequiresDepartment(staffType) && !departmentId) {
      return res.status(400).json({ message: "departmentId is required for this staffType" });
    }

    // Duplicate email prevention within institution
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Validate class/section/subjects hierarchy is more complex and will be handled in assignment controller
    // for create we at least validate that section/class are present together if either exists.
    if ((assignedSectionId && !assignedClassId) || (!assignedSectionId && assignedClassId)) {
      return res.status(400).json({ message: "assignedClassId and assignedSectionId must be provided together" });
    }

    // Soft uniqueness for employeeId is generated immutably below.
    const employeeId = await generateNextEmployeeId(req.staffInstitutionId);

    const user = await User.create({
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      password,
      role: "admin", // institution staff logins behave like admin in this codebase
      institutionId: req.staffInstitutionId,
      isActive: true,
      superAdmin: false,
    });

    // Staff document
    const staff = await Staff.create({
      institutionId: req.staffInstitutionId,
      employeeId,
      firstName,
      lastName,
      photo,
      gender,
      dob,
      email: normalizedEmail,
      phone,
      alternatePhone,
      address,
      qualification,
      specialization,
      experience,
      joiningDate,
      designation,
      staffType,
      departmentId,
      assignedClassId,
      assignedSectionId,
      assignedSubjectIds: assignedSubjectIds || [],
      classTeacher: !!classTeacher,
      salary,
      userId: user._id,
      createdBy: req.user?._id,
      status: "active",
    });

    res.status(201).json({
      ...staff.toObject(),
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
    });
  } catch (err) {
    // Mongoose duplicate key errors
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate staff data" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/institutions/:institutionId/staff/:staffId
const updateStaff = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.employeeId; // immutable
    delete updates.institutionId;

    const staff = await Staff.findOne({
      _id: req.params.staffId,
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    if (updates.email) {
      const normalizedEmail = String(updates.email).toLowerCase().trim();
      if (!validateEmailFormat(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // If email is changing, prevent duplicates (User collection)
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: staff.userId } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      updates.email = normalizedEmail;
      await User.updateOne({ _id: staff.userId }, { $set: { email: normalizedEmail, name: `${updates.firstName || staff.firstName} ${updates.lastName || staff.lastName}`.trim() } });
    }

    if (updates.phone && !validatePhoneFormat(updates.phone)) {
      return res.status(400).json({ message: "Invalid phone format" });
    }
    if (updates.alternatePhone && !validatePhoneFormat(updates.alternatePhone)) {
      return res.status(400).json({ message: "Invalid alternatePhone format" });
    }
    if (updates.joiningDate && !validateJoiningDate(updates.joiningDate)) {
      return res.status(400).json({ message: "joiningDate cannot be in the future or invalid" });
    }

    Object.assign(staff, updates);
    await staff.save();

    return res.json({
      ...staff.toObject(),
      fullName: `${staff.firstName} ${staff.lastName}`.trim(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/institutions/:institutionId/staff/:staffId
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.staffId,
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.status = "inactive";
    staff.deletedAt = new Date();
    staff.deletedBy = req.user?._id;

    await staff.save();

    // Also deactivate the linked User
    await User.updateOne({ _id: staff.userId }, { $set: { isActive: false } });

    return res.json({ message: "Staff removed (soft deleted)" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/institutions/:institutionId/staff/:staffId/toggle
const toggleStaffStatus = async (req, res) => {
  try {
    const { status } = req.body; // expected "active"/"inactive"

    const staff = await Staff.findOne({
      _id: req.params.staffId,
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const nextStatus = status === "inactive" ? "inactive" : "active";
    staff.status = nextStatus;
    await staff.save();

    await User.updateOne({ _id: staff.userId }, { $set: { isActive: nextStatus === "active" } });

    return res.json({ message: `Staff status updated to ${nextStatus}` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/institutions/:institutionId/staff/:staffId/reset-password
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "newPassword is required (min length 6)" });
    }

    const staff = await Staff.findOne({
      _id: req.params.staffId,
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Ensure we hash via existing User pre-save hook
    const user = await User.findById(staff.userId);
    if (!user) return res.status(404).json({ message: "Linked user not found" });

    user.password = newPassword;
    await user.save();

    // Never return password
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  listStaff,
  getMyStaffProfile,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetPassword,
};

