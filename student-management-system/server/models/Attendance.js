const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // Tenant / academic scope (Phase 5)
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      index: true,
    },

    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      index: true,
    },

    // Canonical subject id (Phase 5)
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },

    // Teacher who marked this attendance (Phase 5)
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      index: true,
    },

    // Existing fields (backward compatible)
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Present", "Absent", "Late"], required: true },
    subject: { type: String, trim: true, default: "General" },
    remarks: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Prevent duplicate attendance entries for canonical scope (Phase 5)
// If subjectId is null/undefined (legacy records), it will fall back to legacy unique index below.
attendanceSchema.index(
  { institutionId: 1, student: 1, date: 1, subjectId: 1 },
  { unique: true, sparse: true }
);

// Legacy duplicate prevention (keeps existing behaviour)
attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });


module.exports = mongoose.model("Attendance", attendanceSchema);
