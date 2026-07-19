const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and attaches the user (without password) to req.user
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // For backward compatibility: older tokens may not include tenant claims.
    // Always treat DB-loaded user as source of truth.


    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Not authorized, user not found or inactive" });
    }

    req.user = user;
    req.tenantId = user.institutionId ? String(user.institutionId) : null;
    req.superAdmin = !!user.superAdmin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

// Restricts a route to admin accounts only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

module.exports = { protect, adminOnly };
