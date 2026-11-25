const mongoose = require("mongoose");
const Staff = require("../models/Staff");
const Department = require("../models/Department");
const Class = require("../models/Class");
const Section = require("../models/Section");
const Subject = require("../models/Subject");

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// (kept for future validation expansions)


// POST /api/institutions/:institutionId/staff/:staffId/assignments
// Tenant-scoped (req.staffInstitutionId)
const upsertStaffAssignments = async (req, res) => {
  try {
    const {
      departmentId,
      assignedClassId,
      assignedSectionId,
      assignedSubjectIds,
      classTeacher,
    } = req.body;

    const staff = await Staff.findOne({
      _id: req.params.staffId,
      institutionId: req.staffInstitutionId,
      deletedAt: { $exists: false },
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Validate email/phone/etc are handled in staffController.
    // Here we validate relationships.

    if (departmentId && !validateObjectId(departmentId)) {
      return res.status(400).json({ message: "Invalid departmentId" });
    }

    if (assignedClassId && !validateObjectId(assignedClassId)) {
      return res.status(400).json({ message: "Invalid assignedClassId" });
    }

    if (assignedSectionId && !validateObjectId(assignedSectionId)) {
      return res.status(400).json({ message: "Invalid assignedSectionId" });
    }

    // assignedSubjectIds validation
    const subjectIds = Array.isArray(assignedSubjectIds) ? assignedSubjectIds : [];
    for (const sid of subjectIds) {
      if (!validateObjectId(sid)) {
        return res.status(400).json({ message: "Invalid subject id" });
      }
    }

    // Validate Department belongs to institution
    if (departmentId) {
      const dept = await Department.findOne({ _id: departmentId, institutionId: req.staffInstitutionId });
      if (!dept) return res.status(400).json({ message: "departmentId is invalid for this institution" });
    }

    // If class/section exist, ensure section belongs to class and both belong to institution
    if (assignedClassId) {
      const cls = await Class.findOne({ _id: assignedClassId, institutionId: req.staffInstitutionId });
      if (!cls) return res.status(400).json({ message: "assignedClassId is invalid for this institution" });
    }

    if (assignedSectionId) {
      const sec = await Section.findOne({ _id: assignedSectionId, institutionId: req.staffInstitutionId });
      if (!sec) return res.status(400).json({ message: "assignedSectionId is invalid for this institution" });
    }

    if (assignedClassId && assignedSectionId) {
      const sec = await Section.findOne({
        _id: assignedSectionId,
        institutionId: req.staffInstitutionId,
        classId: assignedClassId,
      });
      if (!sec) return res.status(400).json({ message: "assignedSectionId must belong to the assigned class" });
    }

    // Validate subjectIds belong to the assignedClassId (via Class relation in Subject model)
    if (assignedClassId && subjectIds.length > 0) {
      const invalidCount = await Subject.countDocuments({
        _id: { $in: subjectIds },
        institutionId: req.staffInstitutionId,
        classId: assignedClassId,
      });

      if (invalidCount !== subjectIds.length) {
        return res.status(400).json({ message: "assigned subjects must belong to the assigned class" });
      }
    }

    // If this assignment sets classTeacher=true, enforce one teacher per section.
    if (classTeacher === true && assignedSectionId) {
      const existingClassTeacher = await Staff.findOne({
        institutionId: req.staffInstitutionId,
        assignedSectionId,
        classTeacher: true,
        deletedAt: { $exists: false },
        _id: { $ne: staff._id },
      });
      if (existingClassTeacher) {
        return res.status(409).json({ message: "Only one Class Teacher is allowed per section" });
      }
    }

    // Prevent duplicate assignment records in same teacher: this controller updates fields on a single Staff doc.
    // Duplicates are prevented by the classTeacher constraint and by schema unique constraints.

    const updated = await Staff.findOneAndUpdate(
      { _id: staff._id },
      {
        ...(departmentId ? { departmentId } : {}),
        ...(assignedClassId ? { assignedClassId } : {}),
        ...(assignedSectionId ? { assignedSectionId } : {}),
        ...(Array.isArray(assignedSubjectIds) ? { assignedSubjectIds: subjectIds } : {}),
        ...(typeof classTeacher === "boolean" ? { classTeacher } : {}),
      },
      { new: true }
    );

    return res.json({
      ...updated.toObject(),
      fullName: `${updated.firstName} ${updated.lastName}`.trim(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  upsertStaffAssignments,
};

