// src/components/TempBadge.jsx
export default function TempBadge({ x="50%", y="50%", label, value }) {
  return (
    <div className="temp-badge" style={{ left:x, top:y }}>
      <div className="tlabel">{label}</div>
      <div className="tval">{fmt(value)} °C</div>
    </div>
  );
}
function fmt(n){ return Number.isFinite(n) ? n.toFixed(2) : "##.#"; }
