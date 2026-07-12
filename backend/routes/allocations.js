const express = require("express");
const Allocation = require("../models/Allocation");
const TransferRequest = require("../models/TransferRequest");
const Asset = require("../models/Asset");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Allocate an asset to a user/department.
// Conflict rule: if the asset already has an Active allocation, block it,
// tell the caller who holds it, and let the frontend offer a transfer request.
router.post("/", async (req, res) => {
  try {
    const { assetId, userId, departmentId, expectedReturnDate } = req.body;
    if (!assetId || (!userId && !departmentId)) {
      return res.status(400).json({ error: "assetId and (userId or departmentId) are required" });
    }

    const existingActive = await Allocation.findOne({ assetId, status: "Active" }).populate(
      "userId",
      "name email"
    );

    if (existingActive) {
      return res.status(409).json({
        error: "Asset already allocated",
        currentlyHeldBy: existingActive.userId
          ? existingActive.userId.name
          : "another department",
        allocationId: existingActive._id,
        hint: "Use POST /api/allocations/transfer-request to request a transfer instead.",
      });
    }

    const allocation = await Allocation.create({
      assetId,
      userId,
      departmentId,
      expectedReturnDate,
      status: "Active",
    });

    await Asset.findByIdAndUpdate(assetId, { status: "Allocated" });

    return res.status(201).json(allocation);
  } catch (err) {
    // The partial unique index on Allocation is the DB-level backstop -
    // if two requests race past the check above, Mongo rejects the second insert.
    if (err.code === 11000) {
      return res.status(409).json({ error: "Asset already allocated (race condition caught by DB index)" });
    }
    console.error(err);
    return res.status(500).json({ error: "Allocation failed" });
  }
});

// Request a transfer of an already-allocated asset to a new holder.
router.post("/transfer-request", async (req, res) => {
  try {
    const { assetId, toUserId } = req.body;
    const current = await Allocation.findOne({ assetId, status: "Active" });

    const transfer = await TransferRequest.create({
      assetId,
      fromUserId: current ? current.userId : null,
      toUserId,
      status: "Requested",
    });

    return res.status(201).json(transfer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Transfer request failed" });
  }
});

// Approve a transfer: closes the old allocation, opens a new one, updates history.
router.post("/transfer-request/:id/approve", async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer request not found" });

    await Allocation.updateMany(
      { assetId: transfer.assetId, status: "Active" },
      { status: "Returned", returnedAt: new Date() }
    );

    const newAllocation = await Allocation.create({
      assetId: transfer.assetId,
      userId: transfer.toUserId,
      status: "Active",
    });

    transfer.status = "Approved";
    await transfer.save();

    return res.json({ transfer, newAllocation });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Transfer approval failed" });
  }
});

// Return an asset - status reverts to Available.
router.post("/:id/return", async (req, res) => {
  try {
    const { conditionNotes } = req.body;
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ error: "Allocation not found" });

    allocation.status = "Returned";
    allocation.returnedAt = new Date();
    allocation.returnConditionNotes = conditionNotes || "";
    await allocation.save();

    await Asset.findByIdAndUpdate(allocation.assetId, { status: "Available" });

    return res.json(allocation);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Return failed" });
  }
});

// Overdue allocations - past expectedReturnDate, still Active. Feeds Dashboard + Notifications.
router.get("/overdue", async (req, res) => {
  const overdue = await Allocation.find({
    status: "Active",
    expectedReturnDate: { $lt: new Date() },
  })
    .populate("assetId", "name assetTag")
    .populate("userId", "name email");
  return res.json(overdue);
});

module.exports = router;
