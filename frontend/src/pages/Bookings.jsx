// TODO (Member B):
// - Booking form -> POST /api/bookings { assetId, startTime, endTime }
// - On 409 response, backend returns { conflictingBooking: { startTime, endTime } } -
//   show that clearly so the user understands why it was rejected
// - Calendar/list view -> GET /api/bookings/asset/:assetId
// - Cancel -> POST /api/bookings/:id/cancel
// - Reschedule -> POST /api/bookings/:id/reschedule { startTime, endTime } (re-checked for overlap)
export default function Bookings() {
  return (
    <div className="page">
      <h1>Resource Booking</h1>
      <p>TODO: booking form with overlap validation, calendar view, cancel/reschedule</p>
    </div>
  );
}
