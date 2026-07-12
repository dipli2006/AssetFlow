// TODO (Member A):
// - Registration form -> POST /api/assets { name, categoryId, serialNumber,
//   acquisitionDate, acquisitionCost, condition, location, isBookable }
//   (assetTag is auto-generated server-side, don't collect it in the form)
// - Search/filter -> GET /api/assets?q=&categoryId=&status=&location=
// - Status badge per asset (Available/Allocated/Reserved/UnderMaintenance/Lost/Retired/Disposed)
// - Click into an asset -> GET /api/assets/:id/history for allocation + maintenance history
export default function AssetDirectory() {
  return (
    <div className="page">
      <h1>Asset Registration &amp; Directory</h1>
      <p>TODO: registration form + searchable/filterable asset table</p>
    </div>
  );
}
