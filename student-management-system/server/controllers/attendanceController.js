const Attendance = require("../models/Attendance");

// @route POST /api/attendance             (admin only) - mark attendance (single student)
const markAttendance = async (req, res) => {
  try {
    const { student, date, status, subject, remarks } = req.body;

    if (!student || !date || !status) {
      return res.status(400).json({ message: "student, date and status are required" });
    }

    const record = await Attendance.create({
      student, date, status, subject, remarks, markedBy: req.user._id,
    });

    res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Attendance for this student/date/subject already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route POST /api/attendance/bulk       (admin only) - mark attendance for all students
// Body: { date, status, subject, remarks }
// Creates attendance records for every student. If a slot already exists for a student/date/subject, it will be skipped.
const markAttendanceBulkForAll = async (req, res) => {
  try {
    const { date, status, subject, remarks } = req.body;

    if (!date || !status) {
      return res.status(400).json({ message: "date and status are required" });
    }

    const students = await require("../models/User").find({ role: "student", isActive: true }).select("_id");

    const docs = students.map((s) => ({
      student: s._id,
      date,
      status,
      subject: subject || "General",
      remarks,
      markedBy: req.user._id,
    }));

    // Use insertMany with ordered:false so duplicates don't stop the whole batch
    const result = await Attendance.insertMany(docs, { ordered: false });

    res.status(201).json({ created: result.length, skippedDuplicates: 0 });
  } catch (err) {
    // For duplicates, Mongo throws a BulkWriteError. We'll still compute how many were created.
    if (err && err.writeErrors && Array.isArray(err.writeErrors)) {
      // Best-effort: count documents that caused duplicate key error
      const duplicateCount = err.writeErrors.filter((e) => e.code === 11000).length;
      const createdCount = (err.insertedDocs ? err.insertedDocs.length : 0);
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
    const records = await Attendance.find({ student: req.params.studentId }).sort({ date: -1 });
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

