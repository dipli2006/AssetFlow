import { useState } from "react";

// TODO (Member A):
// Tab A - Departments: list from GET /api/departments, create via POST, deactivate via
//         POST /:id/deactivate. Fields: name, headUserId, parentDepartmentId, status.
// Tab B - Asset Categories: GET/POST /api/categories. Fields: name, extraFields (e.g.
//         warrantyPeriodMonths for Electronics).
// Tab C - Employee Directory: GET /api/employees, promote via POST /:id/promote
//         with { role: "DepartmentHead" | "AssetManager" }. This is the ONLY place
//         roles get assigned in the UI.
export default function OrgSetup() {
  const [tab, setTab] = useState("departments");

  return (
    <div className="page">
      <h1>Organization Setup</h1>
      <div className="tabs">
        <button className={tab === "departments" ? "active" : ""} onClick={() => setTab("departments")}>
          Departments
        </button>
        <button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")}>
          Asset Categories
        </button>
        <button className={tab === "employees" ? "active" : ""} onClick={() => setTab("employees")}>
          Employee Directory
        </button>
      </div>

      {tab === "departments" && <p>TODO: department list + create form</p>}
      {tab === "categories" && <p>TODO: category list + create form</p>}
      {tab === "employees" && <p>TODO: employee table + promote buttons</p>}
    </div>
  );
}
