const AcademicYear = require("../models/AcademicYear");
const Institution = require("../models/Institution");

const findAcademicYearCurrentConflict = async (institutionId, yearIdToExclude = null) => {
  const filter = { institutionId, isCurrent: true };
  if (yearIdToExclude) filter._id = { $ne: yearIdToExclude };
  return AcademicYear.findOne(filter);
};

const createAcademicYear = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const {
      name,
      startDate,
      endDate,
      isCurrent,
      status,
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: "Academic year name, startDate and endDate are required" });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    const existing = await AcademicYear.findOne({ institutionId, name: String(name).trim() });
    if (existing) return res.status(409).json({ message: "Academic year name already exists" });

    if (isCurrent) {
      const conflict = await findAcademicYearCurrentConflict(institutionId);
      if (conflict) {
        // We enforce the rule by deactivating existing current year
        await AcademicYear.updateMany({ institutionId, isCurrent: true }, { $set: { isCurrent: false } });
      }
    }

    const academicYear = await AcademicYear.create({
      institutionId,
      name: String(name).trim(),
      startDate,
      endDate,
      isCurrent: !!isCurrent,
      status: status || undefined,
    });

    return res.status(201).json(academicYear);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const listAcademicYears = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { q, status } = req.query;

    const filter = { institutionId };
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
      ];
    }

    const years = await AcademicYear.find(filter).sort({ createdAt: -1 });
    return res.json(years);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAcademicYear = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const year = await AcademicYear.findOne({ _id: req.params.id, institutionId });
    if (!year) return res.status(404).json({ message: "Academic year not found" });
    return res.json(year);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateAcademicYear = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const updates = { ...req.body };

    delete updates._id;
    delete updates.institutionId;

    if (typeof updates.name === "string") updates.name = updates.name.trim();

    if (updates.isCurrent) {
      const conflict = await findAcademicYearCurrentConflict(institutionId, req.params.id);
      if (conflict) {
        await AcademicYear.updateMany({ institutionId, isCurrent: true }, { $set: { isCurrent: false } });
      }
    }

    // duplicate prevention by name (optional but consistent)
    if (updates.name) {
      const dupe = await AcademicYear.findOne({ institutionId, name: updates.name, _id: { $ne: req.params.id } });
      if (dupe) return res.status(409).json({ message: "Academic year name already exists" });
    }

    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      updates,
      { new: true, runValidators: true }
    );

    if (!year) return res.status(404).json({ message: "Academic year not found" });
    return res.json(year);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setAcademicYearActive = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId;
    const { status, isCurrent } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (typeof isCurrent !== "undefined") updates.isCurrent = !!isCurrent;

    if (updates.isCurrent) {
      await AcademicYear.updateMany({ institutionId, isCurrent: true }, { $set: { isCurrent: false } });
    }

    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, institutionId },
      updates,
      { new: true, runValidators: true }
    );

    if (!year) return res.status(404).json({ message: "Academic year not found" });
    return res.json(year);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createAcademicYear,
  listAcademicYears,
  getAcademicYear,
  updateAcademicYear,
  setAcademicYearActive,
};

