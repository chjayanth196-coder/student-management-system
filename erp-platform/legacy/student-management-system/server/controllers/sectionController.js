const Section = require("../models/Section");

const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

const createSection = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const {
      classId,
      sectionName,
      roomNumber,
      capacity,
      status,
    } = req.body;

    if (!classId || !sectionName) {
      return res.status(400).json({ message: "classId and sectionName are required" });
    }

    const normalizedSection = normalize(sectionName);

    const dupe = await Section.findOne({ institutionId, classId, sectionName: normalizedSection });
    if (dupe) return res.status(409).json({ message: "Section name already exists in this class" });

    const section = await Section.create({
      institutionId,
      classId,
      sectionName: normalizedSection,
      roomNumber,
      capacity,
      status: status || undefined,
    });

    return res.status(201).json(section);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const listSections = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { q, classId, status } = req.query;

    const filter = { institutionId };
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    if (q) {
      filter.sectionName = { $regex: q, $options: "i" };
    }

    const sections = await Section.find(filter).sort({ createdAt: -1 });
    return res.json(sections);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSection = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const section = await Section.findOne({ _id: req.params.id, institutionId });
    if (!section) return res.status(404).json({ message: "Section not found" });
    return res.json(section);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const updates = { ...req.body };

    delete updates._id;
    delete updates.institutionId;

    if (typeof updates.sectionName === "string") updates.sectionName = normalize(updates.sectionName);

    const current = await Section.findOne({ _id: req.params.id, institutionId });
    if (!current) return res.status(404).json({ message: "Section not found" });

    const nextClassId = updates.classId || current.classId;
    const nextSectionName = updates.sectionName || current.sectionName;

    const dupe = await Section.findOne({
      institutionId,
      classId: nextClassId,
      sectionName: nextSectionName,
      _id: { $ne: req.params.id },
    });

    if (dupe) return res.status(409).json({ message: "Section name already exists in this class" });

    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      updates,
      { new: true, runValidators: true }
    );

    return res.json(section);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setSectionStatus = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      { status },
      { new: true, runValidators: true }
    );

    if (!section) return res.status(404).json({ message: "Section not found" });
    return res.json(section);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createSection,
  listSections,
  getSection,
  updateSection,
  setSectionStatus,
};

