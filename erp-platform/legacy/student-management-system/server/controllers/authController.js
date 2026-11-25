const jwt = require("jsonwebtoken");
const User = require("../models/User");



const generateToken = ({ id, role, institutionId, superAdmin }) => {
  return jwt.sign(
    {
      id,
      role,
      institutionId: institutionId ? String(institutionId) : null,
      superAdmin: !!superAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// @route POST /api/auth/login
// @access Public (used by both students and admins)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOneWithPassword({
      email: email.toLowerCase(),
    });

    if (!user) {
      console.warn("LOGIN failed: user not found for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordOk = await user.matchPassword(password);
    if (!passwordOk) {
      console.warn("LOGIN failed: password mismatch for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      console.warn("LOGIN failed: inactive account for email:", email);
      return res.status(403).json({ message: "This account has been deactivated" });
    }


    res.json({
      token: generateToken({
        id: user._id,
        role: user.role,
        institutionId: user.institutionId,
        superAdmin: user.superAdmin,
      }),
      user,
    });
  } catch (err) {
  console.error("LOGIN ERROR:");
  console.error(err);

  res.status(500).json({
    message: "Server error",
    error: err.message,
  });
}
};

// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, getMe };
