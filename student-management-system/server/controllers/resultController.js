const Result = require("../models/Result");

// @route POST /api/results               (admin only) - add a result entry
const addResult = async (req, res) => {
  try {
    const { student, term, year, subject, marksObtained, maxMarks, grade, remarks } = req.body;

    if (!student || !term || !year || !subject || marksObtained == null || !maxMarks) {
      return res.status(400).json({ message: "student, term, year, subject, marksObtained and maxMarks are required" });
    }

    const result = await Result.create({
      student, term, year, subject, marksObtained, maxMarks, grade, remarks, createdBy: req.user._id,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A result for this student/term/year/subject already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PUT /api/results/:id             (admin only) - edit a result
const updateResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/results/:id           (admin only)
const deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json({ message: "Result removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/results/student/:studentId   (admin only) - view a student's results
const getResultsForStudent = async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId }).sort({ year: -1, term: 1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/results/me               (student only) - own results + summary
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id }).sort({ year: -1, term: 1 });

    const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMax = results.reduce((sum, r) => sum + r.maxMarks, 0);
    const overallPercentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

    res.json({ results, summary: { totalObtained, totalMax, overallPercentage } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { addResult, updateResult, deleteResult, getResultsForStudent, getMyResults };
