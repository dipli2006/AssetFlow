// TODO (Member B):
// - Raise request form -> POST /api/maintenance { assetId, issue, priority, photoUrl }
// - List -> GET /api/maintenance
// - Workflow buttons (Asset Manager only):
//     Approve -> POST /:id/approve   (asset flips to UnderMaintenance)
//     Reject  -> POST /:id/reject
//     Assign  -> POST /:id/assign { technicianName }
//     Start   -> POST /:id/start
//     Resolve -> POST /:id/resolve  (asset flips back to Available)
export default function Maintenance() {
  return (
    <div className="page">
      <h1>Maintenance Management</h1>
      <p>TODO: raise-request form + status workflow board</p>
    </div>
  );
}
