const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const User = require("../models/User");

const normalizeEmail = (email) => (email ? String(email).toLowerCase().trim() : "");

// @route POST /api/institutes
// @access Super Admin only
// Body: full institution + institutionAdmin fields
const createInstitution = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // institution fields
      name,
      type,
      logo,
      address,
      city,
      state,
      country,
      email,
      phone,
      website,
      principal,
      academicYear,
      isActive,
      // institution admin fields
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      adminConfirmPassword,
    } = req.body;

    // Basic validation
    if (!name || !type) {
      return res.status(400).json({ message: "Institution name and type are required" });
    }
    if (!adminName || !adminEmail || !adminPassword || !adminConfirmPassword) {
      return res.status(400).json({ message: "Admin name, email, password and confirm password are required" });
    }

    if (adminPassword !== adminConfirmPassword) {
      return res.status(400).json({ message: "Admin password and confirm password do not match" });
    }

    const instEmail = normalizeEmail(email);
    const instAdminEmail = normalizeEmail(adminEmail);

    if (instAdminEmail) {
      const existingAdmin = await User.findOne({ email: instAdminEmail });
      if (existingAdmin) {
        return res.status(409).json({ message: "Admin email already exists" });
      }
    }

    const institution = await Institution.create(
      [
        {
          name: String(name).trim(),
          type: String(type).trim(),
          logo,
          address,
          city,
          state,
          country,
          email: instEmail || undefined,
          phone,
          website,
          principal,
          academicYear,
          isActive: isActive ?? true,
        },
      ],
      { session }
    );

    const createdInstitution = institution[0];

    await User.create(
      [
        {
          name: String(adminName).trim(),
          email: instAdminEmail,
          password: adminPassword,
          role: "admin",
          institutionId: createdInstitution._id,
          superAdmin: false,
          isActive: true,
          parentName: undefined,
          parentPhone: undefined,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Institution created successfully",
      institutionId: createdInstitution._id,
      institutionName: createdInstitution.name,
      adminEmail: instAdminEmail,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/institutes
// @access Super Admin only
// Supports search & filter via query params: q, status, type
const listInstitutions = async (req, res) => {
  try {
    const { q, status, type } = req.query;

    const filter = {};

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (type) filter.type = type;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { principal: { $regex: q, $options: "i" } },
      ];
    }

    const institutions = await Institution.find(filter).sort({ createdAt: -1 });
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/institutes/:id
// @access Super Admin only
const getInstitution = async (req, res) => {
  try {
    const inst = await Institution.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: "Institution not found" });
    res.json(inst);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PUT /api/institutes/:id
// @access Super Admin only
const updateInstitution = async (req, res) => {
  try {
    const updates = { ...req.body };

    // never allow changing mongo _id
    delete updates._id;

    // keep defaults: isActive defaults true in model but allow explicit updates
    const inst = await Institution.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!inst) return res.status(404).json({ message: "Institution not found" });
    res.json(inst);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/institutes/:id
// @access Super Admin only
// Hard delete
const deleteInstitution = async (req, res) => {
  try {
    const inst = await Institution.findByIdAndDelete(req.params.id);
    if (!inst) return res.status(404).json({ message: "Institution not found" });

    // Optionally deactivate admins/students; for now we keep data and rely on tenant scoping.
    // We only hard delete institution record.

    await User.updateMany(
      { institutionId: inst._id },
      { $set: { institutionId: null } }
    );

    res.json({ message: "Institution deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/institutes/:id/toggle
// @access Super Admin only
const setInstitutionActive = async (req, res) => {
  try {
    const { isActive } = req.body;
    const inst = await Institution.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!inst) return res.status(404).json({ message: "Institution not found" });
    res.json(inst);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createInstitution,
  listInstitutions,
  getInstitution,
  updateInstitution,
  deleteInstitution,
  setInstitutionActive,
};

