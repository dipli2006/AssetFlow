import { useEffect, useState } from "react";
import api from "../api/client";

const KPI_LABELS = {
  assetsAvailable: "Assets Available",
  assetsAllocated: "Assets Allocated",
  maintenanceToday: "Maintenance Today",
  activeBookings: "Active Bookings",
  pendingTransfers: "Pending Transfers",
  upcomingReturns: "Upcoming Returns",
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/kpis")
      .then(({ data }) => setKpis(data))
      .catch(() => setError("Could not load dashboard data"));
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      {error && <p className="form-error">{error}</p>}
      {!kpis && !error && <p>Loading...</p>}

      {kpis && (
        <>
          <div className="kpi-grid">
            {Object.entries(KPI_LABELS).map(([key, label]) => (
              <div className="kpi-card" key={key}>
                <div className="kpi-value">{kpis[key]}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))}
          </div>

          {kpis.overdueReturns > 0 && (
            <div className="alert-banner">
              {kpis.overdueReturns} overdue return{kpis.overdueReturns > 1 ? "s" : ""} need attention
            </div>
          )}
        </>
      )}

      {/* TODO (Member B): Quick action buttons - Register Asset / Book Resource / Raise Maintenance Request */}
    </div>
  );
}
