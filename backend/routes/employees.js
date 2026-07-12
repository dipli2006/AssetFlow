const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", requireRole("Admin", "AssetManager", "DepartmentHead"), async (req, res) => {
  const employees = await User.find().select("-passwordHash").populate("departmentId", "name");
  res.json(employees);
});

router.put("/:id", requireRole("Admin"), async (req, res) => {
  const { name, departmentId, status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, departmentId, status },
    { new: true }
  ).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "Employee not found" });
  res.json(user);
});

// The ONLY place a role gets assigned, other than the initial Admin seed.
router.post("/:id/promote", requireRole("Admin"), async (req, res) => {
  const { role } = req.body;
  if (!["DepartmentHead", "AssetManager"].includes(role)) {
    return res.status(400).json({ error: "role must be DepartmentHead or AssetManager" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
    "-passwordHash"
  );
  if (!user) return res.status(404).json({ error: "Employee not found" });
  res.json(user);
});

module.exports = router;
