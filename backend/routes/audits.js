const express = require("express");
const AuditCycle = require("../models/AuditCycle");
const AuditItem = require("../models/AuditItem");
const Asset = require("../models/Asset");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRole("Admin"), async (req, res) => {
  const { scopeDepartmentId, auditorIds, startDate, endDate, assetIds } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  const cycle = await AuditCycle.create({
    scopeDepartmentId,
    auditorIds,
    startDate,
    endDate,
    status: "Open",
  });

  // pre-create one AuditItem per asset in scope so auditors have a checklist
  if (Array.isArray(assetIds) && assetIds.length) {
    await AuditItem.insertMany(
      assetIds.map((assetId) => ({ auditCycleId: cycle._id, assetId, result: null }))
    );
  }

  res.status(201).json(cycle);
});

router.get("/", async (req, res) => {
  const cycles = await AuditCycle.find().populate("auditorIds", "name");
  res.json(cycles);
});

router.get("/:id/items", async (req, res) => {
  const items = await AuditItem.find({ auditCycleId: req.params.id }).populate(
    "assetId",
    "name assetTag status"
  );
  res.json(items);
});

// Auditor marks an item Verified / Missing / Damaged
router.put("/items/:itemId", async (req, res) => {
  const { result } = req.body;
  if (!["Verified", "Missing", "Damaged"].includes(result)) {
    return res.status(400).json({ error: "result must be Verified, Missing or Damaged" });
  }
  const item = await AuditItem.findByIdAndUpdate(req.params.itemId, { result }, { new: true });
  if (!item) return res.status(404).json({ error: "Audit item not found" });
  res.json(item);
});

// Discrepancy report - flagged items in a cycle
router.get("/:id/discrepancies", async (req, res) => {
  const items = await AuditItem.find({
    auditCycleId: req.params.id,
    result: { $in: ["Missing", "Damaged"] },
  }).populate("assetId", "name assetTag");
  res.json(items);
});

// Close cycle: locks it and flips confirmed-missing assets to Lost
router.post("/:id/close", requireRole("Admin"), async (req, res) => {
  const cycle = await AuditCycle.findById(req.params.id);
  if (!cycle) return res.status(404).json({ error: "Audit cycle not found" });

  const missingItems = await AuditItem.find({ auditCycleId: cycle._id, result: "Missing" });
  await Promise.all(
    missingItems.map((item) => Asset.findByIdAndUpdate(item.assetId, { status: "Lost" }))
  );

  cycle.status = "Closed";
  await cycle.save();
  res.json(cycle);
});

module.exports = router;
