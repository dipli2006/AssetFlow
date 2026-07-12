const mongoose = require("mongoose");

const assetCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    // e.g. { warrantyPeriodMonths: 24 } for Electronics
    extraFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssetCategory", assetCategorySchema);
