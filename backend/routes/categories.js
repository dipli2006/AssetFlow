const express = require("express");
const AssetCategory = require("../models/AssetCategory");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const categories = await AssetCategory.find();
  res.json(categories);
});

router.post("/", requireRole("Admin"), async (req, res) => {
  const { name, extraFields } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const category = await AssetCategory.create({ name, extraFields });
  res.status(201).json(category);
});

router.put("/:id", requireRole("Admin"), async (req, res) => {
  const category = await AssetCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

module.exports = router;
