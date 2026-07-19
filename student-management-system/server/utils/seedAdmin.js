// Run once to create the first admin account:
//   npm run seed:admin
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = (process.env.ADMIN_EMAIL || "admin@school.com").toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    name: process.env.ADMIN_NAME || "Admin User",
    email,
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    role: "admin",
  });

  console.log(`Admin account created: ${email}`);
  console.log(`Password: ${process.env.ADMIN_PASSWORD || "Admin@123"} (change this after first login)`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
