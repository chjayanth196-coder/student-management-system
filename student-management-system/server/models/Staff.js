const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    // Tenant
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },

    // Immutable per institution
    employeeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },

    // Personal details
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    photo: { type: String, trim: true }, // store URL/path only

    gender: { type: String, trim: true },
    dob: { type: Date },

    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    address: { type: String, trim: true },

    qualification: { type: String, trim: true },
    specialization: { type: String, trim: true },
    experience: { type: Number },

    joiningDate: { type: Date },
    designation: { type: String, trim: true },

    staffType: {
      type: String,
      required: true,
      enum: [
        "Principal",
        "Vice Principal",
        "HOD",
        "Teacher",
        "Class Teacher",
        "Exam Cell",
        "Librarian",
        "Accountant",
        "Receptionist",
        "HR",
        "Transport Manager",
        "Other",
      ],
      index: true,
    },

    // Foreign refs (tenant-scoped)
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },

    assignedClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },

    assignedSectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      index: true,
    },

    assignedSubjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    classTeacher: { type: Boolean, default: false },

    salary: { type: Number },

    // User integration
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Status / soft delete
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    deletedAt: { type: Date },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Only one Class Teacher per section (enforced in controller)

// Soft delete: keep existing staff records but mark inactive.

// Indexes for faster filtering
staffSchema.index({ institutionId: 1, staffType: 1 });
staffSchema.index({ institutionId: 1, departmentId: 1 });
staffSchema.index({ institutionId: 1, assignedSectionId: 1, classTeacher: 1 });

module.exports = mongoose.model("Staff", staffSchema);

