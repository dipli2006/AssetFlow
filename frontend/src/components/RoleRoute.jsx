import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a route with an allowlist of roles, e.g.
// <RoleRoute allow={["Admin"]}><OrgSetup /></RoleRoute>
// Omit `allow` to just require any logged-in user.
export default function RoleRoute({ children, allow }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) {
    return <div style={{ padding: 24 }}>You don't have access to this page.</div>;
  }
  return children;
}
