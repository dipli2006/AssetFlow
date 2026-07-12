const express = require("express");
const Asset = require("../models/Asset");
const Booking = require("../models/Booking");
const Allocation = require("../models/Allocation");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const TransferRequest = require("../models/TransferRequest");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// All live counts - no hardcoded numbers.
router.get("/kpis", async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
  ] = await Promise.all([
    Asset.countDocuments({ status: "Available" }),
    Asset.countDocuments({ status: "Allocated" }),
    MaintenanceRequest.countDocuments({
      status: { $in: ["Approved", "Assigned", "InProgress"] },
      updatedAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Booking.countDocuments({ status: { $in: ["Upcoming", "Ongoing"] } }),
    TransferRequest.countDocuments({ status: "Requested" }),
    Allocation.countDocuments({
      status: "Active",
      expectedReturnDate: { $gte: new Date() },
    }),
    Allocation.countDocuments({
      status: "Active",
      expectedReturnDate: { $lt: new Date() },
    }),
  ]);

  res.json({
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
  });
});

module.exports = router;
