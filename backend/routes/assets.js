const express = require("express");
const Asset = require("../models/Asset");
const Allocation = require("../models/Allocation");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

async function nextAssetTag() {
  const count = await Asset.countDocuments();
  return `AF-${String(count + 1).padStart(4, "0")}`;
}

router.post("/", requireRole("Admin", "AssetManager"), async (req, res) => {
  try {
    const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable } =
      req.body;
    if (!name || !categoryId) {
      return res.status(400).json({ error: "name and categoryId are required" });
    }

    const assetTag = await nextAssetTag();
    const asset = await Asset.create({
      name,
      categoryId,
      assetTag,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      isBookable: !!isBookable,
      status: "Available",
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Asset registration failed" });
  }
});

// Search/filter by tag, serial number, category, status, location
router.get("/", async (req, res) => {
  const { q, categoryId, status, location } = req.query;
  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (status) filter.status = status;
  if (location) filter.location = new RegExp(location, "i");
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { assetTag: new RegExp(q, "i") },
      { serialNumber: new RegExp(q, "i") },
    ];
  }
  const assets = await Asset.find(filter).populate("categoryId", "name");
  res.json(assets);
});

router.put("/:id", requireRole("Admin", "AssetManager"), async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
});

// Per-asset history: allocation history + maintenance history
router.get("/:id/history", async (req, res) => {
  const [allocations, maintenance] = await Promise.all([
    Allocation.find({ assetId: req.params.id }).populate("userId", "name").sort({ createdAt: -1 }),
    MaintenanceRequest.find({ assetId: req.params.id }).sort({ createdAt: -1 }),
  ]);
  res.json({ allocations, maintenance });
});

module.exports = router;
