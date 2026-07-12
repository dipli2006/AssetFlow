const mongoose = require("mongoose");

const auditCycleSchema = new mongoose.Schema(
  {
    scopeDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    auditorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditCycle", auditCycleSchema);
