const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    term: { type: String, required: true, trim: true }, // e.g. "Mid-Term", "Final"
    year: { type: String, required: true, trim: true }, // e.g. "2025-2026"
    subject: { type: String, required: true, trim: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    grade: { type: String, trim: true },
    remarks: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Auto-compute a letter grade from percentage if not explicitly provided
resultSchema.pre("validate", function (next) {
  if (!this.grade && this.marksObtained != null && this.maxMarks) {
    const pct = (this.marksObtained / this.maxMarks) * 100;
    if (pct >= 90) this.grade = "A+";
    else if (pct >= 80) this.grade = "A";
    else if (pct >= 70) this.grade = "B";
    else if (pct >= 60) this.grade = "C";
    else if (pct >= 50) this.grade = "D";
    else this.grade = "F";
  }
  next();
});

resultSchema.index({ student: 1, term: 1, year: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);
