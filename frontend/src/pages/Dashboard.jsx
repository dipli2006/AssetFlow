import { useEffect, useState } from "react";
import api from "../api/client";

const KPI_FIELDS = [
  { key: "assetsAvailable", label: "Available Assets" },
  { key: "assetsAllocated", label: "Allocated Assets" },
  { key: "maintenanceToday", label: "Maintenance Today" },
  { key: "activeBookings", label: "Active Bookings" },
  { key: "pendingTransfers", label: "Pending Transfers" },
  { key: "upcomingReturns", label: "Upcoming Returns" },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchKpis = async () => {
      try {
        const { data } = await api.get("/dashboard/kpis");
        if (isMounted) {
          setKpis(data);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Unable to load dashboard metrics right now. Please try again shortly.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchKpis();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Operations overview</p>
          <h1>AssetFlow dashboard</h1>
          <p className="dashboard-subtitle">
            Track asset availability, maintenance, bookings, transfers, and returns from one view.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p>Loading dashboard metrics…</p>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {kpis && (
        <>
          <div className={`status-banner ${kpis.overdueReturns > 0 ? "warning" : "success"}`}>
            {kpis.overdueReturns > 0 ? (
              <>
                ⚠ There are {kpis.overdueReturns} overdue asset return{kpis.overdueReturns > 1 ? "s" : ""} requiring attention.
              </>
            ) : (
              <>✅ No overdue asset returns.</>
            )}
          </div>

          <div className="kpi-grid">
            {KPI_FIELDS.map(({ key, label }) => (
              <article className="kpi-card" key={key}>
                <div className="kpi-value">{kpis[key] ?? 0}</div>
                <div className="kpi-label">{label}</div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
