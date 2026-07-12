require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/departments");
const categoryRoutes = require("./routes/categories");
const employeeRoutes = require("./routes/employees");
const assetRoutes = require("./routes/assets");
const allocationRoutes = require("./routes/allocations");
const bookingRoutes = require("./routes/bookings");
const maintenanceRoutes = require("./routes/maintenance");
const auditRoutes = require("./routes/audits");
const dashboardRoutes = require("./routes/dashboard");
const notificationRoutes = require("./routes/notifications");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`AssetFlow backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
