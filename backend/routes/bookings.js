const express = require("express");
const Booking = require("../models/Booking");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Overlap validation: two bookings for the same asset overlap if
// existing.startTime < newEnd AND existing.endTime > newStart.
// A booking that starts exactly when another ends is NOT an overlap.
async function hasOverlap(assetId, startTime, endTime, excludeBookingId = null) {
  const query = {
    assetId,
    status: { $in: ["Upcoming", "Ongoing"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  return Booking.findOne(query);
}

router.post("/", async (req, res) => {
  try {
    const { assetId, startTime, endTime } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!assetId || !startTime || !endTime) {
      return res.status(400).json({ error: "assetId, startTime and endTime are required" });
    }
    if (end <= start) {
      return res.status(400).json({ error: "endTime must be after startTime" });
    }

    const conflict = await hasOverlap(assetId, start, end);
    if (conflict) {
      return res.status(409).json({
        error: "This time slot overlaps an existing booking",
        conflictingBooking: { startTime: conflict.startTime, endTime: conflict.endTime },
      });
    }

    const booking = await Booking.create({
      assetId,
      bookedByUserId: req.user.id,
      startTime: start,
      endTime: end,
      status: "Upcoming",
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Booking failed" });
  }
});

router.post("/:id/cancel", async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: "Cancelled" },
    { new: true }
  );
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  return res.json(booking);
});

// Reschedule - re-runs the same overlap check against the new time.
router.post("/:id/reschedule", async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return res.status(400).json({ error: "endTime must be after startTime" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const conflict = await hasOverlap(booking.assetId, start, end, booking._id);
    if (conflict) {
      return res.status(409).json({ error: "New time slot overlaps an existing booking" });
    }

    booking.startTime = start;
    booking.endTime = end;
    await booking.save();
    return res.json(booking);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Reschedule failed" });
  }
});

router.get("/asset/:assetId", async (req, res) => {
  const bookings = await Booking.find({ assetId: req.params.assetId }).sort({ startTime: 1 });
  return res.json(bookings);
});

module.exports = router;
