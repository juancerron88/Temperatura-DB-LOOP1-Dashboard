// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  getControl, setControl, getHistory, getLatest,
  getRelayState, setRelay
} from "../services/api";
import SensorChart from "../components/SensorChart";
import TempBadge from "../components/TempBadge";
import "./dashboard.css";

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);

  // Control global
  const [ctrl, setCtrl] = useState({
    mode: "auto",
    sp1: 45, h1: 5, l1_on_ms: 5 * 60_000, l1_off_ms: 3 * 60_000,
    sp2: 35, h2: 3
  });

  // Último snapshot e histórico
  const [latest, setLatest] = useState(null);
  const [histL1, setHistL1] = useState([]);
  const [histL2, setHistL2] = useState([]);

  // Estado real de relés
  const [relays, setRelays] = useState({ R1:{state:false}, R2:{state:false}, R3:{state:false} });

  // Carga inicial
  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      const c = await getControl(deviceId).catch(()=>null);
      if (c) setCtrl(prev => ({
        ...prev,
        mode: (c.mode || "auto").toLowerCase(),
        sp1: c.sp1 ?? prev.sp1, h1: c.h1 ?? prev.h1,
        l1_on_ms: c.l1_on_ms ?? prev.l1_on_ms,
        l1_off_ms: c.l1_off_ms ?? prev.l1_off_ms,
        sp2: c.sp2 ?? prev.sp2, h2: c.h2 ?? prev.h2
      }));

      const rel = await getRelayState(deviceId).catch(()=>null);
      if (rel?.relays) setRelays(rel.relays);

      const h = await getHistory(deviceId, 800).catch(()=>[]);
      const rows = h.map(r => ({
        ts: new Date(r.createdAt).getTime(),
        [r.meta?.sensor || "default"]: Number(r.celsius)
      }));
      const map = new Map();
      for (const r of rows) {
        if (!map.has(r.ts)) map.set(r.ts, { ts: r.ts });
        Object.keys(r).forEach(k => { if (k!=="ts") map.get(r.ts)[k] = r[k]; });
      }
      const arr = Array.from(map.values()).sort((a,b)=>a.ts-b.ts);
      const withPV = arr.map(p => {
        const pv1 = avg([p.K1,p.K2,p.K3,p.K4]);
        const pv2 = avg([p.K5,p.K6,p.K7,p.K8]);
        return { ...p, PV1: pv1, PV2: pv2, SP1: ctrl.sp1, SP2: ctrl.sp2 };
      });
      setHistL1(withPV.map(p => ({ ts:p.ts, K1:p.K1,K2:p.K2,K3:p.K3,K4:p.K4, PV1:p.PV1, SP1:p.SP1 })));
      setHistL2(withPV.map(p => ({ ts:p.ts, K5:p.K5,K6:p.K6,K7:p.K7,K8:p.K8, PV2:p.PV2, SP2:p.SP2 })));

      const last = await getLatest(deviceId).catch(()=>null);
      if (last) setLatest(last);
    })();
  }, [deviceId]);

  // Helpers
  const pick = (obj, key) => (obj && typeof obj[key] === "number" ? obj[key] : null);
  const dutyMin = useMemo(() => ({
    on : Math.round((ctrl.l1_on_ms  || 0)/60000),
    off: Math.round((ctrl.l1_off_ms || 0)/60000),
  }), [ctrl.l1_on_ms, ctrl.l1_off_ms]);

  function handleCtrl(field, value){ setCtrl(prev => ({ ...prev, [field]: value })); }

  async function handleApply(){
    const payload = {
      mode: ctrl.mode,
      sp1: ctrl.sp1, h1: ctrl.h1,
      l1_on_ms: ctrl.l1_on_ms, l1_off_ms: ctrl.l1_off_ms,
      sp2: ctrl.sp2, h2: ctrl.h2
    };
    try { await setControl(deviceId, payload); alert("Parámetros aplicados ✔"); }
    catch(e){ console.error(e); alert("No se pudo aplicar ❌"); }
  }

  // Toggle relés (manual)
  async function toggleRelay(relKey, next){
    try {
      await setRelay(deviceId, relKey, { state: next });
      setRelays(r => ({ ...r, [relKey]: { ...(r[relKey]||{}), state: next } }));
    } catch(e){ console.error(e); }
  }

  return (
    <div className="page">
      <header className="page-top">
        <h1>MONITOREO DE BATERÍA DE ARENA</h1>

        <div className="top-row">
          <div className="chip">
            <span>Device ID</span>
            <input value={deviceId} onChange={e=>setDeviceId(e.target.value)} />
          </div>

          <div className="chip">
            <span>Modo</span>
            <select value={ctrl.mode} onChange={e=>handleCtrl("mode", e.target.value)}>
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <button className="btn apply" onClick={handleApply}>Aplicar modo y SP/H/Duty</button>

          <a className="chip link" href={import.meta.env.VITE_HISTORY_URL || "#"} target="_blank">
            Ir a historial
          </a>
        </div>
      </header>

      {/* PV1 / PV2 */}
      <div className="top-cards">
        <div className="card dark">
          <h3>PV1 <small>(promedio K1..K4)</small></h3>

          <div className="row">
            <label>PV1</label>
            <input readOnly value={fmtC(avg([pick(latest,"K1"), pick(latest,"K2"), pick(latest,"K3"), pick(latest,"K4")]))} />
            <span className="unit">°C</span>
          </div>

          <div className="row">
            <label>SP1</label>
            <input type="number" value={ctrl.sp1} onChange={e=>handleCtrl("sp1", +e.target.value)} />
            <span className="unit">°C</span>
          </div>

          <div className="row">
            <label>H1</label>
            <input type="number" value={ctrl.h1} onChange={e=>handleCtrl("h1", +e.target.value)} />
            <span className="unit">°C</span>
          </div>

          <div className="row">
            <label>Tiempo ON (min)</label>
            <input type="number" value={dutyMin.on} onChange={e=>handleCtrl("l1_on_ms", (+e.target.value||0)*60000)} />
          </div>

          <div className="row">
            <label>Tiempo OFF (min)</label>
            <input type="number" value={dutyMin.off} onChange={e=>handleCtrl("l1_off_ms", (+e.target.value||0)*60000)} />
          </div>
        </div>

        <div className="card dark">
          <h3>PV2 <small>(promedio K5..K8)</small></h3>

          <div className="row">
            <label>PV2</label>
            <input readOnly value={fmtC(avg([pick(latest,"K5"), pick(latest,"K6"), pick(latest,"K7"), pick(latest,"K8")]))} />
            <span className="unit">°C</span>
          </div>

          <div className="row">
            <label>SP2</label>
            <input type="number" value={ctrl.sp2} onChange={e=>handleCtrl("sp2", +e.target.value)} />
            <span className="unit">°C</span>
          </div>

          <div className="row">
            <label>H2</label>
            <input type="number" value={ctrl.h2} onChange={e=>handleCtrl("h2", +e.target.value)} />
            <span className="unit">°C</span>
          </div>
        </div>
      </div>

      {/* Escenas + manual */}
      <div className="mid-grid">
        {/* Izquierda */}
        <div className="card big">
          <div className="scene">
            <img src="/images/mesa1.jpg" alt="top view" className="scene-img"/>
            {/* centra exacto con translate(-50%,-50%) */}
            <TempBadge x="19%" y="47%" label="K1" value={pick(latest,"K1")} />
            <TempBadge x="26%" y="47%" label="K2" value={pick(latest,"K2")} />
            <TempBadge x="60%" y="47%" label="K3" value={pick(latest,"K3")} />
            <TempBadge x="67%" y="47%" label="K4" value={pick(latest,"K4")} />
          </div>

          <div className="manual-box">
            <h4>MANUAL</h4>
            <div className="rel-row">
              <div><div className="rel-title">R1</div><small>Nicrom 1</small></div>
              <Toggle on={!!relays.R1?.state} onClick={()=>toggleRelay("R1", !relays.R1?.state)} />
            </div>
            <div className="rel-row">
              <div><div className="rel-title">R2</div><small>Nicrom 2</small></div>
              <Toggle on={!!relays.R2?.state} onClick={()=>toggleRelay("R2", !relays.R2?.state)} />
            </div>
          </div>
        </div>

        {/* Derecha */}
        <div className="card big">
          <div className="scene">
            <img src="/images/mesa2.jpg" alt="3d view" className="scene-img"/>
            <TempBadge x="47%" y="33%" label="K5" value={pick(latest,"K5")} />
            <TempBadge x="69%" y="34%" label="K6" value={pick(latest,"K6")} />
            <TempBadge x="67%" y="74%" label="K7" value={pick(latest,"K7")} />
            <TempBadge x="90%" y="76%" label="K8" value={pick(latest,"K8")} />
          </div>

          <div className="manual-box">
            <h4>MANUAL</h4>
            <div className="rel-row">
              <div><div className="rel-title">R3</div><small>Ventiladores</small></div>
              <Toggle on={!!relays.R3?.state} onClick={()=>toggleRelay("R3", !relays.R3?.state)} />
            </div>
          </div>
        </div>
      </div>

      {/* Chips de estado */}
      <div className="chips">
        <div className="chip">Lazo 1 (K1..K4 → R1/R2)</div>
        <div className="chip">SP1/H1: {ctrl.sp1} / {ctrl.h1} °C</div>
        <div className="chip">Duty: {Math.round(ctrl.l1_on_ms/60000)}m ON / {Math.round(ctrl.l1_off_ms/60000)}m OFF</div>
        <div className="chip">Relés: R1 {relays.R1?.state?"ON":"OFF"} | R2 {relays.R2?.state?"ON":"OFF"}</div>
      </div>
      <div className="chips">
        <div className="chip">Lazo 2 (K5..K6 → R3)</div>
        <div className="chip">SP2/H2: {ctrl.sp2} / {ctrl.h2} °C</div>
      </div>

      {/* Gráficas */}
      <div className="charts">
        <div className="card">
          <h4>Historial (últimas 800)</h4>
          <SensorChart
            data={histL1}
            series={[
              { key:"K1", color:"#4fc3f7" },
              { key:"K2", color:"#26c6da" },
              { key:"K3", color:"#66bb6a" },
              { key:"K4", color:"#8bc34a" },
              { key:"PV1", color:"#00bcd4" },
              { key:"SP1", color:"#ffc107", dashed:true }
            ]}
            showToggles
          />
        </div>
        <div className="card">
          <h4>Historial (últimas 800)</h4>
          <SensorChart
            data={histL2}
            series={[
              { key:"K5", color:"#fbc02d" },
              { key:"K6", color:"#ff9800" },
              { key:"K7", color:"#ff7043" },
              { key:"K8", color:"#ab47bc" },
              { key:"PV2", color:"#00bcd4" },
              { key:"SP2", color:"#ffc107", dashed:true }
            ]}
            showToggles
          />
        </div>
      </div>

      <footer className="foot-note">
        API: {import.meta.env.VITE_API_BASE} · GET/PUT con API key
      </footer>
    </div>
  );
}

/* Helpers */
function avg(arr){ const v=(arr||[]).filter(n=>Number.isFinite(n)); return v.length? v.reduce((a,b)=>a+b,0)/v.length : null; }
function fmtC(n){ return Number.isFinite(n) ? n.toFixed(2) : "##.##"; }

function Toggle({ on, onClick }){
  return (
    <div className={"toggle " + (on ? "on" : "off")} onClick={onClick} role="button" tabIndex={0}>
      <span>{on ? "ON" : "OFF"}</span>
    </div>
  );
}
