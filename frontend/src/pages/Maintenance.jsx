import { useEffect, useState } from "react";
import api from "../api/client";
import LoadingState from "../components/ui/LoadingState";
import StatusMessage from "../components/ui/StatusMessage";
import "./Maintenance.css";

const emptyForm = {
  assetId: "",
  issue: "",
  priority: "Medium",
  photoUrl: "",
};

function getStatusClass(status) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return "badge badge-approved";
  if (normalized === "assigned") return "badge badge-assigned";
  if (normalized === "inprogress") return "badge badge-inprogress";
  if (normalized === "rejected") return "badge badge-rejected";
  if (normalized === "resolved") return "badge badge-resolved";
  return "badge badge-pending";
}

export default function Maintenance() {
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeRequestId, setActiveRequestId] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get("/assets");
      setAssets(data || []);
    } catch {
      setError("Unable to load assets for maintenance requests.");
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const { data } = await api.get("/maintenance");
      setRequests(data || []);
    } catch {
      setError("Unable to load maintenance requests.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchRequests();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.assetId || !form.issue) {
      setError("Please select an asset and describe the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/maintenance", {
        assetId: form.assetId,
        issue: form.issue,
        priority: form.priority,
        photoUrl: form.photoUrl,
      });
      setSuccess("Maintenance request raised successfully.");
      setForm(emptyForm);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to raise maintenance request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAction = async (action, requestId) => {
    setError("");
    setSuccess("");
    setIsActionLoading(true);

    try {
      await api.post(`/maintenance/${requestId}/${action}`.replace(/\s+/g, ""), action === "assign" ? { technicianName } : undefined);
      setSuccess(`Request ${action}d successfully.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || `Unable to ${action} request.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openAssignDialog = (requestId) => {
    setActiveRequestId(requestId);
    setTechnicianName("");
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (event) => {
    event.preventDefault();
    if (!technicianName.trim()) {
      setError("Please provide a technician name.");
      return;
    }
    await runAction("assign", activeRequestId);
    setIsAssignOpen(false);
  };

  return (
    <section className="maintenance-page">
      <div className="maintenance-header">
        <p className="maintenance-eyebrow">Operations</p>
        <h1>Maintenance management</h1>
        <p className="maintenance-subtitle">
          Raise service requests, approve work, assign technicians, and track maintenance progress in real time.
        </p>
      </div>

      <div className="maintenance-grid">
        <div className="card">
          <h2>Raise a maintenance request</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="assetId">Asset</label>
              <select id="assetId" name="assetId" value={form.assetId} onChange={handleChange}>
                <option value="">Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.name} ({asset.assetTag})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="issue">Issue</label>
              <textarea id="issue" name="issue" value={form.issue} onChange={handleChange} placeholder="Describe the problem" />
            </div>

            <div className="form-field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="photoUrl">Photo URL</label>
              <input id="photoUrl" name="photoUrl" type="url" value={form.photoUrl} onChange={handleChange} placeholder="https://" />
            </div>

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <span className="loader-inline"><span className="spinner" />Submitting…</span> : "Raise request"}
              </button>
            </div>
          </form>

          {error && <StatusMessage type="error">{error}</StatusMessage>}
          {success && <StatusMessage type="success">{success}</StatusMessage>}
          {isLoadingAssets && <LoadingState message="Loading assets…" />}
        </div>

        <div className="card">
          <h2>Maintenance requests</h2>
          {isLoadingRequests ? (
            <LoadingState message="Loading requests…" />
          ) : (
            <div className="table-wrap">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Issue</th>
                    <th>Priority</th>
                    <th>Raised By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="status-message">No maintenance requests yet.</td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.assetId?.name || "Asset"}</td>
                        <td>{request.issue}</td>
                        <td>{request.priority || "Medium"}</td>
                        <td>{request.raisedByUserId?.name || "User"}</td>
                        <td><span className={getStatusClass(request.status)}>{request.status}</span></td>
                        <td className="actions-cell">
                          <button className="ghost-btn" type="button" onClick={() => runAction("approve", request._id)} disabled={isActionLoading}>
                            Approve
                          </button>
                          <button className="ghost-btn" type="button" onClick={() => runAction("reject", request._id)} disabled={isActionLoading}>
                            Reject
                          </button>
                          <button className="ghost-btn" type="button" onClick={() => openAssignDialog(request._id)} disabled={isActionLoading}>
                            Assign Technician
                          </button>
                          <button className="ghost-btn" type="button" onClick={() => runAction("start", request._id)} disabled={isActionLoading}>
                            Start Work
                          </button>
                          <button className="ghost-btn" type="button" onClick={() => runAction("resolve", request._id)} disabled={isActionLoading}>
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isAssignOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Assign technician</h3>
            <form className="form-grid" onSubmit={handleAssignSubmit}>
              <div className="form-field">
                <label htmlFor="technicianName">Technician name</label>
                <input id="technicianName" value={technicianName} onChange={(event) => setTechnicianName(event.target.value)} />
              </div>
              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  Save assignment
                </button>
                <button className="secondary-btn" type="button" onClick={() => setIsAssignOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
