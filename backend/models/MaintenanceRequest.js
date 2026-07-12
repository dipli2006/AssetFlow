const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    raisedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issue: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    photoUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Assigned", "InProgress", "Resolved"],
      default: "Pending",
    },
    technicianName: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
