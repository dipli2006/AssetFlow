import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import LoadingState from "../components/ui/LoadingState";
import StatusMessage from "../components/ui/StatusMessage";
import "./Bookings.css";

const emptyForm = {
  assetId: "",
  startTime: "",
  endTime: "",
};

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClass(status) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "ongoing") return "badge badge-ongoing";
  if (normalized === "completed") return "badge badge-completed";
  if (normalized === "cancelled") return "badge badge-cancelled";
  return "badge badge-upcoming";
}

export default function Bookings() {
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState("");
  const [rescheduleForm, setRescheduleForm] = useState({ startTime: "", endTime: "" });
  const [isRescheduling, setIsRescheduling] = useState(false);

  const selectedAssetBookings = useMemo(() => {
    if (!selectedAssetId) return [];
    return bookings.filter((booking) => booking.assetId?._id === selectedAssetId || booking.assetId === selectedAssetId);
  }, [bookings, selectedAssetId]);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get("/assets");
      const bookableAssets = (data || []).filter((asset) => asset.isBookable !== false);
      setAssets(bookableAssets);
      if (!selectedAssetId && bookableAssets[0]) {
        setSelectedAssetId(bookableAssets[0]._id);
        setForm((current) => ({ ...current, assetId: bookableAssets[0]._id }));
      }
    } catch {
      setError("Unable to load assets for booking.");
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const fetchBookings = async (assetId) => {
    setIsLoadingBookings(true);
    try {
      const { data } = await api.get(`/bookings/asset/${assetId}`);
      setBookings(data || []);
    } catch {
      setError("Unable to load bookings right now.");
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (selectedAssetId) {
      fetchBookings(selectedAssetId);
    }
  }, [selectedAssetId]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.assetId || !form.startTime || !form.endTime) {
      setError("Please select an asset and pick both dates.");
      return;
    }

    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setError("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/bookings", {
        assetId: form.assetId,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setSuccess("Booking created successfully.");
      setForm(emptyForm);
      if (selectedAssetId) {
        fetchBookings(selectedAssetId);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const conflict = err.response?.data?.conflictingBooking;
        const conflictText = conflict
          ? `Conflicting booking exists from ${formatDateTime(conflict.startTime)} to ${formatDateTime(conflict.endTime)}.`
          : "The selected time overlaps with an existing booking.";
        setError(`This time slot overlaps an existing booking. ${conflictText}`);
      } else {
        setError(err.response?.data?.error || "Unable to create booking.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setError("");
    setSuccess("");
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setSuccess("Booking cancelled successfully.");
      fetchBookings(selectedAssetId);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to cancel booking.");
    }
  };

  const openReschedule = (booking) => {
    setActiveBookingId(booking._id);
    setRescheduleForm({
      startTime: booking.startTime ? new Date(booking.startTime).toISOString().slice(0, 16) : "",
      endTime: booking.endTime ? new Date(booking.endTime).toISOString().slice(0, 16) : "",
    });
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!rescheduleForm.startTime || !rescheduleForm.endTime) {
      setError("Please provide both new booking dates.");
      return;
    }

    if (new Date(rescheduleForm.endTime) <= new Date(rescheduleForm.startTime)) {
      setError("End time must be after start time.");
      return;
    }

    setIsRescheduling(true);
    try {
      await api.post(`/bookings/${activeBookingId}/reschedule`, {
        startTime: rescheduleForm.startTime,
        endTime: rescheduleForm.endTime,
      });
      setSuccess("Booking rescheduled successfully.");
      setIsRescheduleOpen(false);
      fetchBookings(selectedAssetId);
    } catch (err) {
      if (err.response?.status === 409) {
        setError("This time slot overlaps an existing booking.");
      } else {
        setError(err.response?.data?.error || "Unable to reschedule booking.");
      }
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <section className="bookings-page">
      <div className="bookings-header">
        <p className="bookings-eyebrow">Reservations</p>
        <h1>Book and manage resources</h1>
        <p className="bookings-subtitle">
          Create bookings, avoid scheduling conflicts, and manage existing reservations from one space.
        </p>
      </div>

      <div className="bookings-grid">
        <div className="card">
          <h2>Create a booking</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="assetId">Asset</label>
              <select id="assetId" name="assetId" value={form.assetId} onChange={handleFormChange}>
                <option value="">Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.name} ({asset.assetTag})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="startTime">Start date and time</label>
              <input id="startTime" name="startTime" type="datetime-local" value={form.startTime} onChange={handleFormChange} />
            </div>

            <div className="form-field">
              <label htmlFor="endTime">End date and time</label>
              <input id="endTime" name="endTime" type="datetime-local" value={form.endTime} onChange={handleFormChange} />
            </div>

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <span className="loader-inline"><span className="spinner" />Saving…</span> : "Book asset"}
              </button>
              <button className="secondary-btn" type="button" onClick={() => setForm(emptyForm)}>
                Clear
              </button>
            </div>
          </form>

          {error && <StatusMessage type="error">{error}</StatusMessage>}
          {success && <StatusMessage type="success">{success}</StatusMessage>}
          {isLoadingAssets && <LoadingState message="Loading assets…" />}
        </div>

        <div className="card">
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label htmlFor="assetFilter">View bookings for asset</label>
            <select id="assetFilter" value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)}>
              {assets.map((asset) => (
                <option key={asset._id} value={asset._id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>

          {isLoadingBookings ? (
            <LoadingState message="Loading bookings…" />
          ) : (
            <div className="table-wrap">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Booked By</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAssetBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="status-message">No bookings for this asset yet.</td>
                    </tr>
                  ) : (
                    selectedAssetBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>{booking.assetId?.name || "Asset"}</td>
                        <td>{booking.bookedByUserId?.name || "User"}</td>
                        <td>{formatDateTime(booking.startTime)}</td>
                        <td>{formatDateTime(booking.endTime)}</td>
                        <td><span className={getStatusClass(booking.status)}>{booking.status}</span></td>
                        <td className="actions-cell">
                          <button className="ghost-btn" type="button" onClick={() => handleCancel(booking._id)}>
                            Cancel
                          </button>
                          <button className="ghost-btn" type="button" onClick={() => openReschedule(booking)}>
                            Reschedule
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

      {isRescheduleOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Reschedule booking</h3>
            <form className="form-grid" onSubmit={handleRescheduleSubmit}>
              <div className="form-field">
                <label htmlFor="rescheduleStart">New start</label>
                <input id="rescheduleStart" name="startTime" type="datetime-local" value={rescheduleForm.startTime} onChange={(event) => setRescheduleForm((current) => ({ ...current, startTime: event.target.value }))} />
              </div>
              <div className="form-field">
                <label htmlFor="rescheduleEnd">New end</label>
                <input id="rescheduleEnd" name="endTime" type="datetime-local" value={rescheduleForm.endTime} onChange={(event) => setRescheduleForm((current) => ({ ...current, endTime: event.target.value }))} />
              </div>
              <div className="form-actions">
                <button className="primary-btn" type="submit" disabled={isRescheduling}>
                  {isRescheduling ? <span className="loader-inline"><span className="spinner" />Updating…</span> : "Save changes"}
                </button>
                <button className="secondary-btn" type="button" onClick={() => setIsRescheduleOpen(false)}>
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
