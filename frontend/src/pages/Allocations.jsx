// TODO (Member A):
// - Allocate form -> POST /api/allocations { assetId, userId or departmentId, expectedReturnDate }
// - On 409 response, backend returns { currentlyHeldBy, allocationId, hint }.
//   Show: "Currently held by {currentlyHeldBy}" + a "Request Transfer" button that calls
//   POST /api/allocations/transfer-request { assetId, toUserId }
// - Approve transfer (Asset Manager/Dept Head) -> POST /api/allocations/transfer-request/:id/approve
// - Return flow -> POST /api/allocations/:id/return { conditionNotes }
// - Overdue list -> GET /api/allocations/overdue (also feeds the Dashboard banner)
export default function Allocations() {
  return (
    <div className="page">
      <h1>Asset Allocation &amp; Transfer</h1>
      <p>TODO: allocate form with conflict handling, transfer approvals, return flow</p>
    </div>
  );
}
