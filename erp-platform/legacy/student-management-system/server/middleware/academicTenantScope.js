const mongoose = require("mongoose");

// Ensures all academic-structure queries are scoped by institutionId.
// - Institution Admin (role=admin, superAdmin=false): uses req.tenantId
// - Super Admin (superAdmin=true): requires explicit :institutionId in params
//
// Expected route param: req.params.institutionId
const academicTenantScope = (req, res, next) => {
  const { institutionId } = req.params;

  // protect() must have already set req.tenantId and req.superAdmin
  if (req.superAdmin) {
    if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
      return res.status(400).json({ message: "Valid institutionId is required" });
    }
    req.academicInstitutionId = String(institutionId);
    return next();
  }

  // Institution admin
  if (!req.tenantId || !mongoose.Types.ObjectId.isValid(req.tenantId)) {
    return res.status(403).json({ message: "Institution scope missing" });
  }
  req.academicInstitutionId = String(req.tenantId);
  return next();
};

module.exports = academicTenantScope;

