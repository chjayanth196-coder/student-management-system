const mongoose = require("mongoose");

const companyRegistrationSchema = new mongoose.Schema(
  {
    // the institute/school/college where this company event belongs
    institute: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },

    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // simple status flow
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },

    // optional event preferences
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

companyRegistrationSchema.index({ institute: 1, email: 1 }, { unique: false });

