const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Department = require("../models/Department");
const Class = require("../models/Class");
const Section = require("../models/Section");

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getCanonicalSubjectName = async ({ institutionId, subjectId, subject }) => {
  // Phase 5: prefer subjectId, but keep legacy subject string.
  if (subjectId) {
    const subj = await Subject.findOne({ _id: subjectId, institutionId });
    if (!subj) throw new Error("Invalid subjectId for this institution");
    return subj.subjectName || subj.subjectCode || subject || "General";
  }
  return subject || "General";
};

const teacherCanMark = async ({ teacherId, institutionId, academicYearId, departmentId, classId, sectionId, subjectId }) => {
  const teacher = await Staff.findOne({
    _id: teacherId,
    institutionId,
    deletedAt: { $exists: false },
    status: "active",
  });
  if (!teacher) return false;

  // Must match assigned scopes if provided.
  if (academicYearId && teacher.assignedAcademicYearId && String(teacher.assignedAcademicYearId) !== String(academicYearId)) return false;
  if (departmentId && teacher.departmentId && String(teacher.departmentId) !== String(departmentId)) return false;
  if (classId && teacher.assignedClassId && String(teacher.assignedClassId) !== String(classId)) return false;
  if (sectionId && teacher.assignedSectionId && String(teacher.assignedSectionId) !== String(sectionId)) return false;

  if (subjectId && Array.isArray(teacher.assignedSubjectIds) && teacher.assignedSubjectIds.length > 0) {
    if (!teacher.assignedSubjectIds.map(String).includes(String(subjectId))) return false;
  }

  return true;
};

// @route POST /api/attendance             (admin only) - mark attendance (single student) [BACKWARD COMPAT]
const markAttendance = async (req, res) => {
  try {
    const { student, date, status, subject, remarks, subjectId, teacherId, institutionId, academicYearId, departmentId, classId, sectionId } = req.body;

    if (!student || !date || !status) {
      return res.status(400).json({ message: "student, date and status are required" });
    }

    // Backward compat: accept institution scope from either body or tenant middleware.
    const instId = institutionId || (req.academicInstitutionId ? String(req.academicInstitutionId) : (req.tenantId ? String(req.tenantId) : null));
    if (!instId || !validateObjectId(instId)) {
      return res.status(403).json({ message: "Institution scope missing" });
    }


    // Validate student belongs to institution (if User is institution-scoped)
    // If User model doesn't have institutionId, this still passes without cross-tenant protection.
    const studentDoc = await User.findOne({ _id: student, role: "student", isActive: true });
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    const canonicalSubject = await getCanonicalSubjectName({
      institutionId: instId,
      subjectId,
      subject,
    });

    // Teacher authorization: if teacherId is supplied, enforce; otherwise keep old behaviour.
    const markById = teacherId || req.user._id;
    if (teacherId) {
      const ok = await teacherCanMark({
        teacherId: markById,
        institutionId: instId,
        academicYearId,
        departmentId,
        classId,
        sectionId,
        subjectId,
      });
      if (!ok) return res.status(403).json({ message: "Unauthorized attendance marking" });
    }

    const record = await Attendance.create({
      institutionId: instId,
      academicYearId,
      departmentId,
      classId,
      sectionId,
      subjectId: subjectId || null,
      teacherId: teacherId || null,

      student,
      date,
      status,
      subject: canonicalSubject,
      remarks,
      markedBy: req.user._id,
    });

    res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Attendance for this institution/student/date/subject already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// @route POST /api/attendance/bulk       (admin only) - mark attendance for all students
// Body: { date, status, subject, remarks }
// Creates attendance records for every student. If a slot already exists for a student/date/subject, it will be skipped.
const markAttendanceBulkForAll = async (req, res) => {
  try {
    const {
      date,
      status,
      subject,
      remarks,
      subjectId,
      institutionId,
      academicYearId,
      departmentId,
      classId,
      sectionId,
      teacherId,
    } = req.body;

    if (!date || !status) {
      return res.status(400).json({ message: "date and status are required" });
    }

    const instId = institutionId || (req.tenantId ? String(req.tenantId) : null);
    if (!instId || !validateObjectId(instId)) {
      return res.status(403).json({ message: "Institution scope missing" });
    }

    // Backward compatibility: if User model isn't institution-scoped, we cannot enforce isolation here.
    // However, the new tenant-aware endpoints (Phase 5) will enforce it via scoped queries.
    const students = await require("../models/User")
      .find({ role: "student", isActive: true })
      .select("_id");

    const canonicalSubject = await getCanonicalSubjectName({
      institutionId: instId,
      subjectId,
      subject,
    });

    const teacherOrMarkBy = teacherId || req.user._id;

    const docs = students.map((s) => ({
      institutionId: instId,
      academicYearId,
      departmentId,
      classId,
      sectionId,
      subjectId: subjectId || null,
      teacherId: teacherId || null,

      student: s._id,
      date,
      status,
      subject: canonicalSubject,
      remarks,
      markedBy: req.user._id,
    }));

    const result = await Attendance.insertMany(docs, { ordered: false });

    res.status(201).json({ created: result.length, skippedDuplicates: 0 });
  } catch (err) {
    if (err && err.writeErrors && Array.isArray(err.writeErrors)) {
      const duplicateCount = err.writeErrors.filter((e) => e.code === 11000).length;
      const createdCount = err.insertedDocs ? err.insertedDocs.length : 0;
      return res.status(201).json({ created: createdCount, skippedDuplicates: duplicateCount });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PUT /api/attendance/:id           (admin only) - edit a record
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/attendance/:id         (admin only)
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });
    res.json({ message: "Attendance record removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/attendance/student/:studentId   (admin only) - view a student's attendance
const getAttendanceForStudent = async (req, res) => {
  try {
    const instId = req.academicInstitutionId ? String(req.academicInstitutionId) : null;
    if (!instId || !validateObjectId(instId)) {
      return res.status(403).json({ message: "Institution scope missing" });
    }

    if (!validateObjectId(req.params.studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const records = await Attendance.find({
      institutionId: instId,
      student: req.params.studentId,
    }).sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/attendance/me             (student only) - own attendance + summary
const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).sort({ date: -1 });

    const total = records.length;
    const present = records.filter((r) => r.status === "Present").length;
    const absent = records.filter((r) => r.status === "Absent").length;
    const late = records.filter((r) => r.status === "Late").length;
    const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

    res.json({ records, summary: { total, present, absent, late, percentage } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  markAttendance,
  markAttendanceBulkForAll,
  updateAttendance,
  deleteAttendance,
  getAttendanceForStudent,
  getMyAttendance,
};

