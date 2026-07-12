const express = require("express");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(notifications);
});

router.post("/:id/read", async (req, res) => {
  const note = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { isRead: true },
    { new: true }
  );
  if (!note) return res.status(404).json({ error: "Notification not found" });
  res.json(note);
});

// Helper other routes can import to push a notification (e.g. from allocations.js, bookings.js)
async function notify(userId, message) {
  return Notification.create({ userId, message });
}

module.exports = router;
module.exports.notify = notify;
