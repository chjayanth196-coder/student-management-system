const mongoose = require("mongoose");

// Ensures required tenant-scope params exist for attendance queries/creates.
// Assumes protect() + academicTenantScope() has set req.academicInstitutionId.
const tenantAttendanceScope = (req, res, next) => {
  // We accept institutionId either from params or from academicTenantScope.
  const institutionId = req.academicInstitutionId || req.params.institutionId || req.body.institutionId;
  if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
    return res.status(400).json({ message: "Valid institutionId is required" });
  }

  req.attendanceInstitutionId = String(institutionId);
  return next();
};

module.exports = tenantAttendanceScope;

