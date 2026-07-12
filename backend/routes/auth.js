const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Signup ALWAYS creates an Employee. No role field is ever read from the
// request body here - this is the "no self-assigned admin roles" rule.
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "Employee", // hardcoded, not from req.body, on purpose
    });

    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.status !== "Active") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET || "dev-secret-change-me",
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Stub - logs a reset token instead of sending real email (see build plan: out of scope)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
  if (user) {
    console.log(`[forgot-password] reset requested for ${email} - stub, no email sent`);
  }
  // Always respond the same way so we don't leak which emails exist
  return res.json({ message: "If that email exists, a reset link would be sent." });
});

module.exports = router;
