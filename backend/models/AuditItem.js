const mongoose = require("mongoose");

const auditItemSchema = new mongoose.Schema(
  {
    auditCycleId: { type: mongoose.Schema.Types.ObjectId, ref: "AuditCycle", required: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    result: { type: String, enum: ["Verified", "Missing", "Damaged"], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditItem", auditItemSchema);
