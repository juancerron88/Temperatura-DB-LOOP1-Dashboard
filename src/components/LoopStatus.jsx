export default function LoopStatus({ control, relay }) {
  const mode = (control?.mode || "manual").toLowerCase(); // "auto" | "manual"
  const msToMin = (ms) => (typeof ms === "number" ? (ms/60000).toFixed(1) : "-");

  const r = relay?.relays || {};
  const r1 = r.R1?.state ? "ON" : "OFF";
  const r2 = r.R2?.state ? "ON" : "OFF";
  const r3 = r.R3?.state ? "ON" : "OFF";

  return (
    <div className="card">
      <h3>Estado de control</h3>
      <div className="grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        <div>
          <div><b>Modo:</b> <span className={`pill ${mode}`}>{mode.toUpperCase()}</span></div>
          <div style={{marginTop:8}}><b>Lazo 1</b> (K1..K4 → R1/R2)</div>
          <div>SP1/H1: <b>{control?.sp1 ?? "-"}</b> / <b>{control?.h1 ?? "-"}</b> °C</div>
          <div>Duty: <b>{msToMin(control?.l1_on_ms)}m ON</b> / <b>{msToMin(control?.l1_off_ms)}m OFF</b>{control?.l1_alternate ? " · alterna R1/R2" : ""}</div>
        </div>
        <div>
          <div><b>Lazo 2</b> (K5..K6 → R3)</div>
          <div>SP2/H2: <b>{control?.sp2 ?? "-"}</b> / <b>{control?.h2 ?? "-"}</b> °C</div>
          <div style={{marginTop:8}}><b>Relés (estado real):</b></div>
          <div>R1: <span className={`pill ${r1==="ON"?"on":"off"}`}>{r1}</span></div>
          <div>R2: <span className={`pill ${r2==="ON"?"on":"off"}`}>{r2}</span></div>
          <div>R3: <span className={`pill ${r3==="ON"?"on":"off"}`}>{r3}</span></div>
        </div>
      </div>
      <style>{`
        .pill{padding:2px 8px;border-radius:999px;font-weight:700}
        .pill.auto{background:#1e90ff20;border:1px solid #1e90ff;color:#1e90ff}
        .pill.manual{background:#ff8c0020;border:1px solid #ff8c00;color:#ff8c00}
        .pill.on{background:#00d08420;border:1px solid #00d084;color:#00d084}
        .pill.off{background:#ff475720;border:1px solid #ff4757;color:#ff4757}
      `}</style>
    </div>
  );
}
