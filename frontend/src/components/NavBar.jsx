import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "◉" },
  { to: "/bookings", label: "Bookings", icon: "🗓" },
  { to: "/maintenance", label: "Maintenance", icon: "🛠" },
  { to: "/audits", label: "Audits", icon: "✓" },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">AF</div>
        <div>
          <h2>AssetFlow</h2>
          <p>Operations Hub</p>
        </div>
      </div>

      <nav className="sidebar-links" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="sidebar-link">
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/assets" className="sidebar-link">
          <span className="sidebar-icon">📦</span>
          <span>Assets</span>
        </NavLink>
        <NavLink to="/allocations" className="sidebar-link">
          <span className="sidebar-icon">🔁</span>
          <span>Allocations</span>
        </NavLink>
        {user.role === "Admin" && (
          <NavLink to="/org-setup" className="sidebar-link">
            <span className="sidebar-icon">⚙️</span>
            <span>Org Setup</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-user">
        <div>
          <strong>{user.name}</strong>
          <p>{user.role}</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
