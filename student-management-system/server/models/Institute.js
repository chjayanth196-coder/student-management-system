const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // e.g. "school" | "college" | "university" (flexible)
    type: { type: String, required: true, trim: true },

    // short code used for login (SCH001 / CLG009 etc.)
    code: { type: String, required: true, unique: true, trim: true, index: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institute", instituteSchema);

