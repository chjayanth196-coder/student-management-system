const Department = require("../models/Department");

const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

const createDepartment = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const {
      academicYearId,
      name,
      code,
      description,
      hodName,
      status,
    } = req.body;

    if (!academicYearId || !name || !code) {
      return res.status(400).json({ message: "academicYearId, name and code are required" });
    }

    const deptCode = normalize(code);

    const dupe = await Department.findOne({ institutionId, academicYearId, code: deptCode });
    if (dupe) return res.status(409).json({ message: "Department code already exists" });

    const department = await Department.create({
      institutionId,
      academicYearId,
      name: normalize(name),
      code: deptCode,
      description,
      hodName: hodName || undefined,
      status: status || undefined,
    });

    return res.status(201).json(department);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const listDepartments = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { q, academicYearId, status } = req.query;

    const filter = { institutionId };
    if (academicYearId) filter.academicYearId = academicYearId;
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }

    const departments = await Department.find(filter).sort({ createdAt: -1 });
    return res.json(departments);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getDepartment = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const department = await Department.findOne({ _id: req.params.id, institutionId });
    if (!department) return res.status(404).json({ message: "Department not found" });
    return res.json(department);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const updates = { ...req.body };

    delete updates._id;
    delete updates.institutionId;

    if (typeof updates.name === "string") updates.name = normalize(updates.name);
    if (typeof updates.code === "string") updates.code = normalize(updates.code);

    const current = await Department.findOne({ _id: req.params.id, institutionId });
    if (!current) return res.status(404).json({ message: "Department not found" });

    const nextAcademicYearId = updates.academicYearId || current.academicYearId;
    const nextCode = updates.code || current.code;

    const dupe = await Department.findOne({
      institutionId,
      academicYearId: nextAcademicYearId,
      code: nextCode,
      _id: { $ne: req.params.id },
    });
    if (dupe) return res.status(409).json({ message: "Department code already exists" });

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      updates,
      { new: true, runValidators: true }
    );

    return res.json(department);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setDepartmentStatus = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      { status },
      { new: true, runValidators: true }
    );

    if (!department) return res.status(404).json({ message: "Department not found" });
    return res.json(department);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  setDepartmentStatus,
};

