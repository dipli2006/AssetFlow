const mongoose = require("mongoose");

const transferRequestSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Requested", "Approved", "Rejected"], default: "Requested" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TransferRequest", transferRequestSchema);
