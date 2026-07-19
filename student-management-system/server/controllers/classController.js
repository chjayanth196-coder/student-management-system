const ClassModel = require("../models/Class");

const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

const createClass = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const {
      academicYearId,
      departmentId,
      className,
      classCode,
      semesterOrGrade,
      capacity,
      status,
    } = req.body;

    if (!academicYearId || !departmentId || !className || !classCode) {
      return res.status(400).json({ message: "academicYearId, departmentId, className and classCode are required" });
    }

    const code = normalize(classCode);

    const dupe = await ClassModel.findOne({ institutionId, academicYearId, departmentId, classCode: code });
    if (dupe) return res.status(409).json({ message: "Class code already exists" });

    const classObj = await ClassModel.create({
      institutionId,
      academicYearId,
      departmentId,
      className: normalize(className),
      classCode: code,
      semesterOrGrade,
      capacity,
      status: status || undefined,
    });

    return res.status(201).json(classObj);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const listClasses = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { q, academicYearId, departmentId, status } = req.query;

    const filter = { institutionId };
    if (academicYearId) filter.academicYearId = academicYearId;
    if (departmentId) filter.departmentId = departmentId;
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { className: { $regex: q, $options: "i" } },
        { classCode: { $regex: q, $options: "i" } },
      ];
    }

    const classes = await ClassModel.find(filter).sort({ createdAt: -1 });
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getClass = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const classObj = await ClassModel.findOne({ _id: req.params.id, institutionId });
    if (!classObj) return res.status(404).json({ message: "Class not found" });
    return res.json(classObj);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const updates = { ...req.body };

    delete updates._id;
    delete updates.institutionId;

    if (typeof updates.className === "string") updates.className = normalize(updates.className);
    if (typeof updates.classCode === "string") updates.classCode = normalize(updates.classCode);

    const current = await ClassModel.findOne({ _id: req.params.id, institutionId });
    if (!current) return res.status(404).json({ message: "Class not found" });

    const nextAcademicYearId = updates.academicYearId || current.academicYearId;
    const nextDepartmentId = updates.departmentId || current.departmentId;
    const nextClassCode = updates.classCode || current.classCode;

    const dupe = await ClassModel.findOne({
      institutionId,
      academicYearId: nextAcademicYearId,
      departmentId: nextDepartmentId,
      classCode: nextClassCode,
      _id: { $ne: req.params.id },
    });

    if (dupe) return res.status(409).json({ message: "Class code already exists" });

    const classObj = await ClassModel.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      updates,
      { new: true, runValidators: true }
    );

    return res.json(classObj);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setClassStatus = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const classObj = await ClassModel.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      { status },
      { new: true, runValidators: true }
    );

    if (!classObj) return res.status(404).json({ message: "Class not found" });
    return res.json(classObj);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createClass,
  listClasses,
  getClass,
  updateClass,
  setClassStatus,
};

