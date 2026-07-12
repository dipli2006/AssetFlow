// TODO (Member B):
// - Create Audit Cycle form (Admin) -> POST /api/audits { scopeDepartmentId, auditorIds,
//   startDate, endDate, assetIds } — assetIds is the list of assets in scope, one
//   AuditItem gets pre-created per asset so auditors have a checklist
// - Cycle list -> GET /api/audits
// - Auditor checklist -> GET /api/audits/:id/items, mark each via
//   PUT /api/audits/items/:itemId { result: "Verified" | "Missing" | "Damaged" }
// - Discrepancy report -> GET /api/audits/:id/discrepancies (Missing/Damaged items only)
// - Close cycle (Admin) -> POST /api/audits/:id/close
//   (locks the cycle, flips confirmed-Missing assets to Lost server-side)
export default function Audits() {
  return (
    <div className="page">
      <h1>Asset Audit</h1>
      <p>TODO: create cycle, auditor checklist, discrepancy report, close cycle</p>
    </div>
  );
}
