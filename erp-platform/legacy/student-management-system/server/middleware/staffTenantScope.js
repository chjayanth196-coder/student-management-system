const mongoose = require("mongoose");

// Tenant scoping for Staff APIs.
// Institution Admin: uses req.tenantId from protect()
// Super Admin: requires req.params.institutionId
const staffTenantScope = (req, res, next) => {
  const { institutionId } = req.params;

  // protect() must have set req.superAdmin and req.tenantId
  if (req.superAdmin === true) {
    if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
      return res.status(400).json({ message: "Valid institutionId is required" });
    }
    req.staffInstitutionId = String(institutionId);
    return next();
  }

  if (!req.tenantId || !mongoose.Types.ObjectId.isValid(req.tenantId)) {
    return res.status(403).json({ message: "Institution scope missing" });
  }

  req.staffInstitutionId = String(req.tenantId);
  return next();
};

module.exports = staffTenantScope;

