const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetCategory", required: true },
    assetTag: { type: String, required: true, unique: true }, // e.g. AF-0001, auto-generated
    serialNumber: { type: String, trim: true },
    acquisitionDate: { type: Date },
    acquisitionCost: { type: Number, default: 0 }, // reporting only, not linked to accounting
    condition: { type: String, default: "Good" },
    location: { type: String, trim: true },
    isBookable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "Available",
        "Allocated",
        "Reserved",
        "UnderMaintenance",
        "Lost",
        "Retired",
        "Disposed",
      ],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
