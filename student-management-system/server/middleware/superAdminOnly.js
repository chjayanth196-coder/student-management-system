const superAdminOnly = (req, res, next) => {
  // protect() must have already loaded req.user + set req.superAdmin
  if (req.superAdmin === true) return next();
  return res.status(403).json({ message: "Super Admin access required" });
};

module.exports = superAdminOnly;

