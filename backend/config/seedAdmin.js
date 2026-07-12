// Run with: npm run seed
// This is the ONLY way an Admin account should ever be created.
// The signup endpoint (routes/auth.js) never accepts a role - it always
// creates an Employee. This script is a one-time bootstrap.
require("dotenv").config();
const bcrypt = require("bcrypt");
const connectDB = require("./db");
const User = require("../models/User");

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: "admin@assetflow.local" });
  if (existing) {
    console.log("Admin already exists, skipping.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await User.create({
    name: "System Admin",
    email: "admin@assetflow.local",
    passwordHash,
    role: "Admin",
    status: "Active",
  });

  console.log("Admin created: admin@assetflow.local / Admin@123 (change this before any real use)");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
