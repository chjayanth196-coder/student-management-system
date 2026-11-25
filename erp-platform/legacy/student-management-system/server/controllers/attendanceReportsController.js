const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");
const Subject = require("../models/Subject");
const User = require("../models/User");

const { validateObjectId } = require("../utils/validateMongo");
const { paginateQuery } = require("../utils/pagination");
const { buildDateRange } = require("../utils/dateRange");

const teacherCanAccess = async ({ teacherId, institutionId, staffScopeFilter }) => {
  const teacher = await Staff.findOne({
    _id: teacherId,
    institutionId,
    status: "active",
    deletedAt: { $exists: false },
  });

  if (!teacher) return false;

  // Optional assignment validation
  // If the request includes classId/sectionId/departmentId/academicYearId/subjectId,
  // enforce it only when those filters are present.
  if (staffScopeFilter) {
    const { academicYearId, departmentId, classId, sectionId, subjectId } = staffScopeFilter;

    if (academicYearId && teacher.assignedAcademicYearId && String(teacher.assignedAcademicYearId) !== String(academicYearId)) return false;
    if (departmentId && teacher.departmentId && String(teacher.departmentId) !== String(departmentId)) return false;
    if (classId && teacher.assignedClassId && String(teacher.assignedClassId) !== String(classId)) return false;
    if (sectionId && teacher.assignedSectionId && String(teacher.assignedSectionId) !== String(sectionId)) return false;

    if (subjectId && Array.isArray(teacher.assignedSubjectIds) && teacher.assignedSubjectIds.length > 0) {
      if (!teacher.assignedSubjectIds.map(String).includes(String(subjectId))) return false;
    }
  }

  return true;
};

// GET /daily/summary
const getDailySummary = async (req, res) => {
  try {
    // institutionId validated above

    const { date, studentId, teacherId, classId, sectionId, subjectId } = req.query;
    if (!date) return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });

    const day = new Date(date);
    if (Number.isNaN(day.getTime())) return res.status(400).json({ message: "Invalid date" });

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    // Teacher least-privilege: teacherId defaults to logged-in user if teacher is making the call
    // We treat non-super-admin adminOnly user as "admin" (existing system doesn't model teacher role separately here)
    const requester = req.user;
    const reqTeacherId = teacherId || requester?._id;

    const staffScopeFilter = {
      academicYearId: req.query.academicYearId,
      departmentId: req.query.departmentId,
      classId: classId || req.query.classId,
      sectionId: sectionId || req.query.sectionId,
      subjectId: subjectId || req.query.subjectId,
    };

    if (req.user && req.user.role !== "admin" && reqTeacherId) {
      const ok = await teacherCanAccess({ teacherId: reqTeacherId, institutionId, staffScopeFilter });
      if (!ok) return res.status(403).json({ message: "Unauthorized" });
    }

    const match = {
      institutionId,
      date: { $gte: start, $lte: end },
    };

    if (studentId && validateObjectId(studentId)) match.student = studentId;
    if (reqTeacherId && validateObjectId(reqTeacherId)) match.teacherId = reqTeacherId;
    if (classId && validateObjectId(classId)) match.classId = classId;
    if (sectionId && validateObjectId(sectionId)) match.sectionId = sectionId;
    if (subjectId && validateObjectId(subjectId)) match.subjectId = subjectId;

    // Aggregation
    const [result] = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
        },
      },
    ]);

    const total = result?.total || 0;
    const present = result?.present || 0;
    const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

    res.json({ total, present, absent: result?.absent || 0, late: result?.late || 0, percentage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /monthly/summary
const getMonthlySummary = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const { month, year, studentId, teacherId, classId, sectionId, subjectId } = req.query;
    if (!month || !year) return res.status(400).json({ message: "month and year are required" });

    const monthNum = Number.parseInt(month, 10);
    const yearNum = Number.parseInt(year, 10);
    if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return res.status(400).json({ message: "Invalid month" });
    if (!Number.isFinite(yearNum) || yearNum < 1970) return res.status(400).json({ message: "Invalid year" });

    const start = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const reqTeacherId = teacherId || req.user?._id;

    const staffScopeFilter = {
      academicYearId: req.query.academicYearId,
      departmentId: req.query.departmentId,
      classId: classId || req.query.classId,
      sectionId: sectionId || req.query.sectionId,
      subjectId: subjectId || req.query.subjectId,
    };

    if (req.user && req.user.role !== "admin" && reqTeacherId) {
      const ok = await teacherCanAccess({ teacherId: reqTeacherId, institutionId, staffScopeFilter });
      if (!ok) return res.status(403).json({ message: "Unauthorized" });
    }

    const match = {
      institutionId,
      date: { $gte: start, $lte: end },
    };

    if (studentId && validateObjectId(studentId)) match.student = studentId;
    if (reqTeacherId && validateObjectId(reqTeacherId)) match.teacherId = reqTeacherId;
    if (classId && validateObjectId(classId)) match.classId = classId;
    if (sectionId && validateObjectId(sectionId)) match.sectionId = sectionId;
    if (subjectId && validateObjectId(subjectId)) match.subjectId = subjectId;

    const [result] = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
        },
      },
    ]);

    const total = result?.total || 0;
    const present = result?.present || 0;
    const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

    res.json({ total, present, absent: result?.absent || 0, late: result?.late || 0, percentage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /reports/records - tenant-scoped search/filter/sort/pagination for attendance records
const listAttendanceRecords = async (req, res) => {
  const institutionId = req.academicInstitutionId || req.params.institutionId;
  if (!validateObjectId(institutionId)) {
    return res.status(400).json({ message: "Valid institutionId is required" });
  }
  try {


    const { page, limit, search, status, teacherId, studentId, classId, sectionId, subjectId, sortBy, sortDir, startDate, endDate } = req.query;
    const { skip, limit: lim } = paginateQuery({ page, limit });

    const dateRange = buildDateRange({ startDate, endDate });

    const match = { institutionId };

    if (status && ["Present", "Absent", "Late"].includes(status)) match.status = status;
    if (teacherId && validateObjectId(teacherId)) match.teacherId = teacherId;
    if (studentId && validateObjectId(studentId)) match.student = studentId;
    if (classId && validateObjectId(classId)) match.classId = classId;
    if (sectionId && validateObjectId(sectionId)) match.sectionId = sectionId;
    if (subjectId && validateObjectId(subjectId)) match.subjectId = subjectId;

    if (dateRange) match.date = dateRange;

    const sortField = sortBy || "date";
    const sortDirection = sortDir === "asc" ? 1 : -1;

    const filter = { ...match };

    // Basic text search on subject/remarks/student name not implemented here (would require lookups)
    // We'll support search over subject/remarks fields for now.
    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      filter.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const [total, records] = await Promise.all([
      Attendance.countDocuments(filter),
      Attendance.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(lim)
    ]);

    res.json({ total, page: Math.max(1, Number.parseInt(page || "1", 10)), limit: lim, records });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getBaseAttendanceAggregation = async ({ institutionId, match, req, page, limit, sortBy, sortDir }) => {
  const { skip, limit: lim } = paginateQuery({ page, limit });
  const sortField = sortBy || "date";
  const sortDirection = sortDir === "asc" ? 1 : -1;

  const [total, records] = await Promise.all([
    Attendance.countDocuments(match),
    Attendance.find(match)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(lim),
  ]);

  return { total, records, page: Math.max(1, Number.parseInt(page || "1", 10)), limit: lim };
};

const applyTeacherAuth = async ({ req, institutionId, requestedTeacherId, staffScopeFilter }) => {
  // Teacher can only access own attendance unless admin.
  // Current project model uses req.user.role === 'admin'. Teachers are in Staff collection.
  if (!requestedTeacherId || !validateObjectId(requestedTeacherId)) {
    return { authorized: false, message: "Valid teacherId is required" };
  }

  const isAdmin = req.user && req.user.role === "admin";
  if (isAdmin) return { authorized: true };

  // If caller is a teacher, they should match teacherId
  const okOwn = String(req.user?._id) === String(requestedTeacherId);
  if (!okOwn) return { authorized: false, message: "Unauthorized" };

  // Additionally enforce staff assignment validation when we can
  // (best-effort; if staff scope filters are not provided, we'll still allow own access)
  if (staffScopeFilter) {
    const accessOk = await teacherCanAccess({ teacherId: requestedTeacherId, institutionId, staffScopeFilter });
    if (!accessOk) return { authorized: false, message: "Unauthorized" };
  }

  return { authorized: true };
};

const computeTotals = async ({ institutionId, match }) => {
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
      },
    },
  ];

  const [result] = await Attendance.aggregate(pipeline);
  const total = result?.total || 0;
  const present = result?.present || 0;
  const absent = result?.absent || 0;
  const late = result?.late || 0;
  const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

  return { total, present, absent, late, percentage };
};

const getTeacherAttendance = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const requestedTeacherId = req.params.teacherId;
    const { startDate, endDate, date, search, classId, sectionId, subjectId, page, limit, sortBy, sortDir } = req.query;

    const staffScopeFilter = {
      academicYearId: req.query.academicYearId,
      departmentId: req.query.departmentId,
      classId,
      sectionId,
      subjectId,
    };

    const auth = await applyTeacherAuth({
      req,
      institutionId,
      requestedTeacherId,
      staffScopeFilter,
    });
    if (!auth.authorized) return res.status(403).json({ message: auth.message || "Unauthorized" });

    const match = { institutionId, teacherId: requestedTeacherId };

    if (date) {
      const day = new Date(date);
      if (Number.isNaN(day.getTime())) return res.status(400).json({ message: "Invalid date" });
      const start = new Date(day); start.setHours(0,0,0,0);
      const end = new Date(day); end.setHours(23,59,59,999);
      match.date = { $gte: start, $lte: end };
    }

    if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    if (classId && validateObjectId(classId)) match.classId = classId;
    if (sectionId && validateObjectId(sectionId)) match.sectionId = sectionId;
    if (subjectId && validateObjectId(subjectId)) match.subjectId = subjectId;

    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      match.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const totals = await computeTotals({ institutionId, match });
    const listing = await getBaseAttendanceAggregation({ institutionId, match, req, page, limit, sortBy, sortDir });

    res.json({ ...totals, records: listing.records, totalRecords: listing.total, page: listing.page, limit: listing.limit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const requestedStudentId = req.params.studentId;
    if (!validateObjectId(requestedStudentId)) return res.status(400).json({ message: "Invalid studentId" });

    const { startDate, endDate, month, year, page, limit, search, sortBy, sortDir } = req.query;

    const match = { institutionId, student: requestedStudentId };

    if (month && year) {
      const monthNum = Number.parseInt(month, 10);
      const yearNum = Number.parseInt(year, 10);
      if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return res.status(400).json({ message: "Invalid month" });
      const start = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      match.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      match.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const totals = await computeTotals({ institutionId, match });
    const listing = await getBaseAttendanceAggregation({ institutionId, match, req, page, limit, sortBy, sortDir });

    res.json({ ...totals, records: listing.records, totalRecords: listing.total, page: listing.page, limit: listing.limit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getClassAttendance = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const classId = req.params.classId;
    if (!validateObjectId(classId)) return res.status(400).json({ message: "Invalid classId" });

    const { startDate, endDate, page, limit, search, sortBy, sortDir, sectionId } = req.query;
    const match = { institutionId, classId };

    if (sectionId && validateObjectId(sectionId)) match.sectionId = sectionId;

    if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      match.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const totals = await computeTotals({ institutionId, match });
    const listing = await getBaseAttendanceAggregation({ institutionId, match, req, page, limit, sortBy, sortDir });

    res.json({ ...totals, records: listing.records, totalRecords: listing.total, page: listing.page, limit: listing.limit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSectionAttendance = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const sectionId = req.params.sectionId;
    if (!validateObjectId(sectionId)) return res.status(400).json({ message: "Invalid sectionId" });

    const { startDate, endDate, page, limit, search, sortBy, sortDir } = req.query;
    const match = { institutionId, sectionId };

    if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      match.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const totals = await computeTotals({ institutionId, match });
    const listing = await getBaseAttendanceAggregation({ institutionId, match, req, page, limit, sortBy, sortDir });

    res.json({ ...totals, records: listing.records, totalRecords: listing.total, page: listing.page, limit: listing.limit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSubjectAttendance = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const subjectId = req.params.subjectId;
    if (!validateObjectId(subjectId)) return res.status(400).json({ message: "Invalid subjectId" });

    const { startDate, endDate, page, limit, search, sortBy, sortDir } = req.query;
    const match = { institutionId, subjectId };

    if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      match.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const totals = await computeTotals({ institutionId, match });
    const listing = await getBaseAttendanceAggregation({ institutionId, match, req, page, limit, sortBy, sortDir });

    // Additional breakdown for requirement: teacher/class/section presence counts
    const breakdown = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { teacherId: "$teacherId", classId: "$classId", sectionId: "$sectionId" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ ...totals, breakdown, records: listing.records, totalRecords: listing.total, page: listing.page, limit: listing.limit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAttendanceCalendar = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "month and year are required" });

    const monthNum = Number.parseInt(month, 10);
    const yearNum = Number.parseInt(year, 10);
    if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return res.status(400).json({ message: "Invalid month" });

    const start = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Calendar requirements mention Holiday/Leave integration.
    // Those models/routes are not present in Phase 5 baseline, so we return placeholders.
    const daily = await Attendance.aggregate([
      { $match: { institutionId, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const byDay = {};
    for (const d of daily) {
      const day = d._id.day;
      byDay[day] = byDay[day] || { Present: 0, Absent: 0, Late: 0, Holiday: 0, Leave: 0 };
      if (d._id.status === "Present") byDay[day].Present = d.count;
      if (d._id.status === "Absent") byDay[day].Absent = d.count;
      if (d._id.status === "Late") byDay[day].Late = d.count;
    }

    res.json({ year: yearNum, month: monthNum, days: byDay });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAttendanceStatistics = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const { startDate, endDate } = req.query;
    const match = { institutionId };
    if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    // Institution totals
    const institutionTotals = await computeTotals({ institutionId, match });

    const classTotals = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$classId",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        },
      },
      {
        $project: {
          classId: "$_id",
          total: 1,
          present: 1,
          percentage: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }],
          },
        },
      },
    ]);

    const teacherTotals = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: "$teacherId", total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } } } },
      { $project: { teacherId: "$_id", total: 1, present: 1, percentage: { $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }] } } }
    ]);

    const studentTotals = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: "$student", total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } } } },
      { $project: { studentId: "$_id", total: 1, present: 1, percentage: { $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }] } } }
    ]);

    const subjectTotals = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: "$subjectId", total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } } } },
      { $project: { subjectId: "$_id", total: 1, present: 1, percentage: { $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }] } } }
    ]);

    res.json({ institutionTotals, classTotals, teacherTotals, studentTotals, subjectTotals });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const exportAttendanceCsv = async (req, res) => {
  try {
    const institutionId = req.academicInstitutionId || req.params.institutionId;
    if (!validateObjectId(institutionId)) return res.status(400).json({ message: "Valid institutionId is required" });

    const { startDate, endDate, status, teacherId, studentId, classId, sectionId, subjectId, search } = req.query;

    const match = { institutionId };
    if (status && ["Present", "Absent", "Late"].includes(status)) match.status = status;
    if (teacherId && validateObjectId(teacherId)) match.teacherId = teacherId;
    if (studentId && validateObjectId(studentId)) match.student = studentId;
    if (classId && validateObjectId(classId)) match.classId = classId;
    if (sectionId && validateObjectId(sectionId)) match.sectionId = sectionId;
    if (subjectId && validateObjectId(subjectId)) match.subjectId = subjectId;

    if (startDate || endDate) {
      const dr = buildDateRange({ startDate, endDate });
      if (dr) match.date = dr;
    }

    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      match.$or = [
        { subject: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const records = await Attendance.find(match).sort({ date: -1 }).lean();

    const header = [
      "date",
      "status",
      "subject",
      "remarks",
      "studentId",
      "teacherId",
      "classId",
      "sectionId",
      "subjectId",
    ];

    const escapeCsv = (v) => {
      const s = v === null || v === undefined ? "" : String(v);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = records.map((r) => [
      new Date(r.date).toISOString().slice(0, 10),
      r.status,
      r.subject,
      r.remarks || "",
      String(r.student),
      r.teacherId ? String(r.teacherId) : "",
      r.classId ? String(r.classId) : "",
      r.sectionId ? String(r.sectionId) : "",
      r.subjectId ? String(r.subjectId) : "",
    ].map(escapeCsv));

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=attendance_${institutionId}_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getDailySummary,
  getMonthlySummary,
  listAttendanceRecords,
  getTeacherAttendance,
  getStudentAttendance,
  getClassAttendance,
  getSectionAttendance,
  getSubjectAttendance,
  getAttendanceCalendar,
  getAttendanceStatistics,
  exportAttendanceCsv,
};


