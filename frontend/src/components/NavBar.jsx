import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">AssetFlow</div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/assets">Assets</Link>
        <Link to="/allocations">Allocations</Link>
        <Link to="/bookings">Bookings</Link>
        <Link to="/maintenance">Maintenance</Link>
        <Link to="/audits">Audits</Link>
        {user.role === "Admin" && <Link to="/org-setup">Org Setup</Link>}
      </div>
      <div className="navbar-user">
        <span>{user.name} ({user.role})</span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
