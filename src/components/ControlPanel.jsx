import { useEffect, useState } from "react";
import { getControl, setControl, getSummary } from "../services/api";

export default function ControlPanel({ deviceId }) {
  const [cfg, setCfg] = useState(null);
  const [sum, setSum] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([getControl(deviceId), getSummary(deviceId, 600)]);
        setCfg(c); setSum(s);
      } catch (e) { setErr(String(e.message)); }
    })();
  }, [deviceId]);

  const update = (patch) => setCfg(p => ({ ...p, ...patch }));

  async function save() {
    try {
      setSaving(true);
      await setControl(deviceId, {
        mode: cfg.mode,
        sp1: Number(cfg.sp1), h1: Number(cfg.h1),
        l1_on_ms: Number(cfg.l1_on_ms), l1_off_ms: Number(cfg.l1_off_ms),
        l1_alternate: !!cfg.l1_alternate,
        sp2: Number(cfg.sp2), h2: Number(cfg.h2)
      });
      setSaving(false);
    } catch (e) { setSaving(false); setErr(String(e.message)); }
  }

  if (!cfg) return <div className="card">Cargando control…</div>;

  return (
    <div className="card">
      <h3>Control (AUTO/MANUAL)</h3>
      {err && <div className="error">{err}</div>}

      <div className="grid">
        <label>Modo:
          <select value={cfg.mode} onChange={e => update({ mode: e.target.value })}>
            <option value="AUTO">AUTO</option>
            <option value="MANUAL">MANUAL</option>
          </select>
        </label>

        <label>SP1 (K1..K4):
          <input type="number" step="0.1" value={cfg.sp1} onChange={e => update({ sp1: e.target.value })}/>
        </label>
        <label>H1:
          <input type="number" step="0.1" value={cfg.h1} onChange={e => update({ h1: e.target.value })}/>
        </label>
        <label>Duty ON (ms):
          <input type="number" value={cfg.l1_on_ms} onChange={e => update({ l1_on_ms: e.target.value })}/>
        </label>
        <label>Duty OFF (ms):
          <input type="number" value={cfg.l1_off_ms} onChange={e => update({ l1_off_ms: e.target.value })}/>
        </label>
        <label className="row">
          <input type="checkbox" checked={!!cfg.l1_alternate} onChange={e => update({ l1_alternate: e.target.checked })}/>
          Alternar R1/R2 por ciclo
        </label>

        <label>SP2 (K5..K6):
          <input type="number" step="0.1" value={cfg.sp2} onChange={e => update({ sp2: e.target.value })}/>
        </label>
        <label>H2:
          <input type="number" step="0.1" value={cfg.h2} onChange={e => update({ h2: e.target.value })}/>
        </label>
      </div>

      {sum && (
        <div className="meta">
          <div>T1 avg (K1..K4): <b>{sum.t1_avg?.toFixed?.(2) ?? "—"} °C</b></div>
          <div>T2 avg (K5..K6): <b>{sum.t2_avg?.toFixed?.(2) ?? "—"} °C</b></div>
          <div>K7: {sum.k7 ?? "—"} °C · K8: {sum.k8 ?? "—"} °C</div>
        </div>
      )}

      <button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
    </div>
  );
}
