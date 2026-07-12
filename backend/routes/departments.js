const express = require("express");
const Department = require("../models/Department");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const departments = await Department.find().populate("headUserId", "name email");
  res.json(departments);
});

router.post("/", requireRole("Admin"), async (req, res) => {
  const { name, headUserId, parentDepartmentId } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const dept = await Department.create({ name, headUserId, parentDepartmentId });
  res.status(201).json(dept);
});

router.put("/:id", requireRole("Admin"), async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!dept) return res.status(404).json({ error: "Department not found" });
  res.json(dept);
});

router.post("/:id/deactivate", requireRole("Admin"), async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, { status: "Inactive" }, { new: true });
  if (!dept) return res.status(404).json({ error: "Department not found" });
  res.json(dept);
});

module.exports = router;
