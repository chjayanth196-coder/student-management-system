const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["admin", "student"], default: "student" },
    isActive: { type: Boolean, default: true },

    // Multi-tenant fields
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      index: true,
    },
    superAdmin: { type: Boolean, default: false },

    // Student profile fields (admin can fill)
    rollNo: { type: String, trim: true },
    className: { type: String, trim: true },
    section: { type: String, trim: true },

    parentName: { type: String, trim: true },
    parentPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

// Hash password before saving (only if modified)
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare plaintext password to stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  // password is selected:false, so fetch it if needed
  const passwordHash = this.password;
  if (!passwordHash) return false;
  return bcrypt.compare(enteredPassword, passwordHash);
};

// Convenience: ensure findOne for login includes password
userSchema.statics.findOneWithPassword = function (query) {
  return this.findOne(query).select("+password");
};

module.exports = mongoose.model("User", userSchema);

