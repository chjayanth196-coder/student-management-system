const mongoose = require("mongoose");

const validateObjectId = (id) => {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
};

module.exports = { validateObjectId };

