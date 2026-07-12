import { useEffect, useState } from "react";
import api from "../api/client";
import KPICard from "../components/KPICard";
import LoadingState from "../components/ui/LoadingState";
import StatusMessage from "../components/ui/StatusMessage";

const KPI_FIELDS = [
  { key: "assetsAvailable", label: "Available Assets", icon: "📦", color: "#2563eb", description: "Ready for allocation" },
  { key: "assetsAllocated", label: "Allocated Assets", icon: "🔐", color: "#7c3aed", description: "Currently assigned" },
  { key: "maintenanceToday", label: "Maintenance Today", icon: "🛠", color: "#ea580c", description: "Open service work" },
  { key: "activeBookings", label: "Active Bookings", icon: "🗓", color: "#0f766e", description: "Live reservations" },
  { key: "pendingTransfers", label: "Pending Transfers", icon: "🔁", color: "#db2777", description: "Awaiting movement" },
  { key: "upcomingReturns", label: "Upcoming Returns", icon: "↩", color: "#0891b2", description: "Due soon" },
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

      {isLoading && <LoadingState message="Loading dashboard metrics…" />}

      {error && <StatusMessage type="error">{error}</StatusMessage>}

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
            {KPI_FIELDS.map(({ key, label, icon, color, description }) => (
              <KPICard key={key} title={label} value={kpis[key] ?? 0} icon={icon} color={color} description={description} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
