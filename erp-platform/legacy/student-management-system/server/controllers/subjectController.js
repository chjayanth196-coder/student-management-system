const Subject = require("../models/Subject");

const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

const createSubject = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const {
      academicYearId,
      departmentId,
      classId,
      subjectName,
      subjectCode,
      credits,
      description,
      status,
    } = req.body;

    if (!academicYearId || !departmentId || !classId || !subjectName || !subjectCode) {
      return res.status(400).json({ message: "academicYearId, departmentId, classId, subjectName and subjectCode are required" });
    }

    const code = normalize(subjectCode);

    const dupe = await Subject.findOne({
      institutionId,
      academicYearId,
      departmentId,
      classId,
      subjectCode: code,
    });

    if (dupe) return res.status(409).json({ message: "Subject code already exists" });

    const subject = await Subject.create({
      institutionId,
      academicYearId,
      departmentId,
      classId,
      subjectName: normalize(subjectName),
      subjectCode: code,
      credits,
      description,
      status: status || undefined,
    });

    return res.status(201).json(subject);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const listSubjects = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { q, academicYearId, departmentId, classId, status } = req.query;

    const filter = { institutionId };
    if (academicYearId) filter.academicYearId = academicYearId;
    if (departmentId) filter.departmentId = departmentId;
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { subjectName: { $regex: q, $options: "i" } },
        { subjectCode: { $regex: q, $options: "i" } },
      ];
    }

    const subjects = await Subject.find(filter).sort({ createdAt: -1 });
    return res.json(subjects);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSubject = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const subject = await Subject.findOne({ _id: req.params.id, institutionId });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    return res.json(subject);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const updates = { ...req.body };

    delete updates._id;
    delete updates.institutionId;

    if (typeof updates.subjectName === "string") updates.subjectName = normalize(updates.subjectName);
    if (typeof updates.subjectCode === "string") updates.subjectCode = normalize(updates.subjectCode);

    const current = await Subject.findOne({ _id: req.params.id, institutionId });
    if (!current) return res.status(404).json({ message: "Subject not found" });

    const nextAcademicYearId = updates.academicYearId || current.academicYearId;
    const nextDepartmentId = updates.departmentId || current.departmentId;
    const nextClassId = updates.classId || current.classId;
    const nextSubjectCode = updates.subjectCode || current.subjectCode;

    const dupe = await Subject.findOne({
      institutionId,
      academicYearId: nextAcademicYearId,
      departmentId: nextDepartmentId,
      classId: nextClassId,
      subjectCode: nextSubjectCode,
      _id: { $ne: req.params.id },
    });

    if (dupe) return res.status(409).json({ message: "Subject code already exists" });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      updates,
      { new: true, runValidators: true }
    );

    return res.json(subject);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setSubjectStatus = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      { status },
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ message: "Subject not found" });
    return res.json(subject);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createSubject,
  listSubjects,
  getSubject,
  updateSubject,
  setSubjectStatus,
};

