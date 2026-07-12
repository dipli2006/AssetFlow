import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RoleRoute from "./components/RoleRoute";
import NavBar from "./components/NavBar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import OrgSetup from "./pages/OrgSetup";
import AssetDirectory from "./pages/AssetDirectory";
import Allocations from "./pages/Allocations";
import Bookings from "./pages/Bookings";
import Maintenance from "./pages/Maintenance";
import Audits from "./pages/Audits";

function Shell({ children }) {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">{children}</main>
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRoute><Shell><Dashboard /></Shell></RoleRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <RoleRoute>
                <Shell><Dashboard /></Shell>
              </RoleRoute>
            }
          />
          <Route
            path="/org-setup"
            element={
              <RoleRoute allow={["Admin"]}>
                <Shell><OrgSetup /></Shell>
              </RoleRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <RoleRoute>
                <Shell><AssetDirectory /></Shell>
              </RoleRoute>
            }
          />
          <Route
            path="/allocations"
            element={
              <RoleRoute>
                <Shell><Allocations /></Shell>
              </RoleRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <RoleRoute>
                <Shell><Bookings /></Shell>
              </RoleRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <RoleRoute>
                <Shell><Maintenance /></Shell>
              </RoleRoute>
            }
          />
          <Route
            path="/audits"
            element={
              <RoleRoute>
                <Shell><Audits /></Shell>
              </RoleRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
