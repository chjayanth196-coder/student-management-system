// Creates a Default Institution (single-tenant compatibility) and backfills
// existing User documents that have no institutionId.
//
// Run once:
//   npm run seed:default-institution
require("dotenv").config();

const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const User = require("../models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const DEFAULT_NAME = process.env.DEFAULT_INSTITUTION_NAME || "Default Institution";
  const DEFAULT_TYPE = process.env.DEFAULT_INSTITUTION_TYPE || "School";

  // 1) Ensure default institution exists
  let institution = await Institution.findOne({ name: DEFAULT_NAME });
  if (!institution) {
    institution = await Institution.create({
      name: DEFAULT_NAME,
      type: DEFAULT_TYPE,
      isActive: true,
      academicYear: process.env.DEFAULT_ACADEMIC_YEAR || "2024-2025",
    });
    console.log("Created default institution:", institution._id);
  } else {
    console.log("Default institution exists:", institution._id);
  }

  // 2) Backfill users that don't have institutionId
  const result = await User.updateMany(
    { institutionId: { $exists: false } },
    {
      $set: {
        institutionId: institution._id,
        superAdmin: false,
      },
    }
  );

  console.log("Backfill users complete.");
  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

