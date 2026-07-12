const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    allocatedAt: { type: Date, default: Date.now },
    expectedReturnDate: { type: Date },
    returnedAt: { type: Date, default: null },
    returnConditionNotes: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Returned"], default: "Active" },
  },
  { timestamps: true }
);

// One asset can only have ONE Active allocation at a time.
// This partial-unique-index is the DB-level backstop for the conflict rule;
// the route-level check (see routes/allocations.js) is what gives the user
// the friendly "currently held by X" message before this index ever fires.
allocationSchema.index(
  { assetId: 1 },
  { unique: true, partialFilterExpression: { status: "Active" } }
);

module.exports = mongoose.model("Allocation", allocationSchema);
