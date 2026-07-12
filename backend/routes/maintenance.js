const express = require("express");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const Asset = require("../models/Asset");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  const { assetId, issue, priority, photoUrl } = req.body;
  if (!assetId || !issue) {
    return res.status(400).json({ error: "assetId and issue are required" });
  }
  const request = await MaintenanceRequest.create({
    assetId,
    raisedByUserId: req.user.id,
    issue,
    priority,
    photoUrl,
    status: "Pending",
  });
  res.status(201).json(request);
});

router.get("/", async (req, res) => {
  const requests = await MaintenanceRequest.find()
    .populate("assetId", "name assetTag status")
    .populate("raisedByUserId", "name")
    .sort({ createdAt: -1 });
  res.json(requests);
});

// Approve -> asset flips to UnderMaintenance
router.post("/:id/approve", requireRole("Admin", "AssetManager"), async (req, res) => {
  const request = await MaintenanceRequest.findByIdAndUpdate(
    req.params.id,
    { status: "Approved" },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: "Request not found" });
  await Asset.findByIdAndUpdate(request.assetId, { status: "UnderMaintenance" });
  res.json(request);
});

router.post("/:id/reject", requireRole("Admin", "AssetManager"), async (req, res) => {
  const request = await MaintenanceRequest.findByIdAndUpdate(
    req.params.id,
    { status: "Rejected" },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: "Request not found" });
  res.json(request);
});

router.post("/:id/assign", requireRole("Admin", "AssetManager"), async (req, res) => {
  const { technicianName } = req.body;
  const request = await MaintenanceRequest.findByIdAndUpdate(
    req.params.id,
    { status: "Assigned", technicianName },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: "Request not found" });
  res.json(request);
});

router.post("/:id/start", requireRole("Admin", "AssetManager"), async (req, res) => {
  const request = await MaintenanceRequest.findByIdAndUpdate(
    req.params.id,
    { status: "InProgress" },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: "Request not found" });
  res.json(request);
});

// Resolve -> asset flips back to Available
router.post("/:id/resolve", requireRole("Admin", "AssetManager"), async (req, res) => {
  const request = await MaintenanceRequest.findByIdAndUpdate(
    req.params.id,
    { status: "Resolved" },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: "Request not found" });
  await Asset.findByIdAndUpdate(request.assetId, { status: "Available" });
  res.json(request);
});

module.exports = router;
