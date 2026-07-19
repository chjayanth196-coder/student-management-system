const Institute = require("../models/Institute");

// @route POST /api/institutes/register
// @access admin only (protected)
const registerInstitute = async (req, res) => {

  try {
    const { name, type, code } = req.body;

    if (!name || !type || !code) {
      return res.status(400).json({ message: "name, type and code are required" });
    }

    const existing = await Institute.findOne({ code: code.trim() });
    if (existing) {
      return res.status(409).json({ message: "Institute code already exists" });
    }

    const institute = await Institute.create({
      name: name.trim(),
      type: type.trim(),
      code: code.trim(),
    });

    res.status(201).json(institute);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/institutes
// @access admin only
const listInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(institutes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { registerInstitute, listInstitutes };

