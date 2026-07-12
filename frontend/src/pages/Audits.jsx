import { useEffect, useState } from "react";
import api from "../api/client";
import LoadingState from "../components/ui/LoadingState";
import StatusMessage from "../components/ui/StatusMessage";
import "./Audits.css";

const emptyForm = {
  departmentId: "",
  auditorIds: "",
  startDate: "",
  endDate: "",
  assetIds: "",
};

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default function Audits() {
  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [items, setItems] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [isLoadingCycles, setIsLoadingCycles] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSetup = async () => {
    try {
      const [departmentsRes, usersRes, assetsRes] = await Promise.all([
        api.get("/departments"),
        api.get("/employees"),
        api.get("/assets"),
      ]);
      setDepartments(departmentsRes.data || []);
      setUsers(usersRes.data || []);
      setAssets(assetsRes.data || []);
    } catch {
      setError("Unable to load audit setup data.");
    } finally {
      setIsLoadingSetup(false);
    }
  };

  const loadCycles = async () => {
    setIsLoadingCycles(true);
    try {
      const { data } = await api.get("/audits");
      setCycles(data || []);
      if (!selectedCycleId && data?.[0]) {
        setSelectedCycleId(data[0]._id);
      }
    } catch {
      setError("Unable to load audit cycles.");
    } finally {
      setIsLoadingCycles(false);
    }
  };

  const loadCycleDetails = async (cycleId) => {
    if (!cycleId) return;
    setIsLoadingItems(true);
    try {
      const [itemsRes, discrepanciesRes] = await Promise.all([
        api.get(`/audits/${cycleId}/items`),
        api.get(`/audits/${cycleId}/discrepancies`),
      ]);
      setItems(itemsRes.data || []);
      setDiscrepancies(discrepanciesRes.data || []);
    } catch {
      setError("Unable to load selected audit cycle details.");
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    loadSetup();
    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      loadCycleDetails(selectedCycleId);
    }
  }, [selectedCycleId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.startDate || !form.endDate) {
      setError("Please provide start and end dates.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        scopeDepartmentId: form.departmentId || undefined,
        auditorIds: form.auditorIds ? form.auditorIds.split(",").map((value) => value.trim()).filter(Boolean) : [],
        startDate: form.startDate,
        endDate: form.endDate,
        assetIds: form.assetIds ? form.assetIds.split(",").map((value) => value.trim()).filter(Boolean) : [],
      };
      await api.post("/audits", payload);
      setSuccess("Audit cycle created successfully.");
      setForm(emptyForm);
      loadCycles();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to create audit cycle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markItem = async (itemId, result) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/audits/items/${itemId}`, { result });
      setSuccess(`Item marked as ${result}.`);
      if (selectedCycleId) {
        loadCycleDetails(selectedCycleId);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update audit item.");
    }
  };

  const closeCycle = async () => {
    if (!selectedCycleId) return;
    setError("");
    setSuccess("");
    setIsClosing(true);
    try {
      await api.post(`/audits/${selectedCycleId}/close`);
      setSuccess("Audit cycle closed successfully.");
      loadCycles();
      if (selectedCycleId) {
        loadCycleDetails(selectedCycleId);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Unable to close audit cycle.");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <section className="audits-page">
      <div className="audits-header">
        <p className="audits-eyebrow">Compliance</p>
        <h1>Audit management</h1>
        <p className="audits-subtitle">
          Create audit cycles, review assets, capture discrepancies, and close the audit workflow.
        </p>
      </div>

      <div className="audits-grid">
        <div className="card">
          <h2>Create audit cycle</h2>
          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-field">
              <label htmlFor="departmentId">Department</label>
              <select id="departmentId" name="departmentId" value={form.departmentId} onChange={handleChange}>
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>{department.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="auditorIds">Auditors (comma separated IDs)</label>
              <input id="auditorIds" name="auditorIds" value={form.auditorIds} onChange={handleChange} placeholder="userId1, userId2" />
            </div>

            <div className="form-field">
              <label htmlFor="startDate">Start date</label>
              <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label htmlFor="endDate">End date</label>
              <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label htmlFor="assetIds">Assets (comma separated IDs)</label>
              <input id="assetIds" name="assetIds" value={form.assetIds} onChange={handleChange} placeholder="assetId1, assetId2" />
            </div>

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <span className="loader-inline"><span className="spinner" />Creating…</span> : "Create audit"}
              </button>
            </div>
          </form>

          {error && <StatusMessage type="error">{error}</StatusMessage>}
          {success && <StatusMessage type="success">{success}</StatusMessage>}
          {isLoadingSetup && <LoadingState message="Loading setup data…" />}
        </div>

        <div className="card">
          <h2>Audit cycles</h2>
          {isLoadingCycles ? (
            <LoadingState message="Loading audit cycles…" />
          ) : (
            <div className="list-wrap">
              {cycles.map((cycle) => (
                <div key={cycle._id} className="audit-card">
                  <div>
                    <strong>{cycle.scopeDepartmentId?.name || "Department scope"}</strong>
                    <div className="audit-meta">
                      {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
                    </div>
                    <div className="audit-meta">
                      Auditors: {(cycle.auditorIds || []).map((auditor) => auditor.name).filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                  <div className="actions-row">
                    <span className={`badge ${cycle.status === "Closed" ? "badge-closed" : "badge-open"}`}>{cycle.status}</span>
                    <button className="ghost-btn" type="button" onClick={() => setSelectedCycleId(cycle._id)}>
                      View items
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="actions-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Audit items</h2>
          <button className="primary-btn" type="button" onClick={closeCycle} disabled={isClosing || !selectedCycleId}>
            {isClosing ? <span className="loader-inline"><span className="spinner" />Closing…</span> : "Close audit cycle"}
          </button>
        </div>

        {isLoadingItems ? (
          <LoadingState message="Loading audit items…" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="audit-items-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="status-message">Select an audit cycle to see items.</td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item._id}>
                        <td>{item.assetId?.name || "Asset"}</td>
                        <td>{item.assetId?.status || "—"}</td>
                        <td>{item.result || "Pending"}</td>
                        <td className="actions-row">
                          <button className="ghost-btn" type="button" onClick={() => markItem(item._id, "Verified")}>Verified</button>
                          <button className="ghost-btn" type="button" onClick={() => markItem(item._id, "Missing")}>Missing</button>
                          <button className="ghost-btn" type="button" onClick={() => markItem(item._id, "Damaged")}>Damaged</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 20 }}>Discrepancies</h3>
            <div className="table-wrap">
              <table className="discrepancies-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="status-message">No discrepancies found.</td>
                    </tr>
                  ) : (
                    discrepancies.map((item) => (
                      <tr key={item._id}>
                        <td>{item.assetId?.name || "Asset"}</td>
                        <td>{item.result}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
