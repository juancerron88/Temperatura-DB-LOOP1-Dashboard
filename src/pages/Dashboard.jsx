// src/pages/Dashboard.jsx
import { useMemo, useState } from "react";
import useThermoData from "../hooks/useThermoData";
import { setControl, setRelay } from "../services/api";
import SensorChart from "../components/SensorChart";

/* Paleta */
const C = {
  bg: "#1e5166",
  card: "#1f5e75",
  pill: "#e8f3fb",
  ok: "#3cb371",
  bad: "#e74c3c",
  text: "#f2f6f9",
  k: {
    K1:"#4ea1ff", K2:"#6dd5ed", K3:"#7ee787", K4:"#2ecc71",
    K5:"#f1c40f", K6:"#e67e22", K7:"#fd79a8", K8:"#e056fd",
    PV1:"#00d1ff", PV2:"#00ffa7", SP1:"#ffffff", SP2:"#ffffff",
    default:"#17becf"
  }
};

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);

  const {
    status,
    chartData,
    pv1, pv2,
    ctrl, setCtrl, refreshControl,
    rstate, refreshRelays,
  } = useThermoData(deviceId);

  /* último punto de la serie para badges */
  const last = useMemo(
    () => (chartData && chartData.length ? chartData[chartData.length - 1] : {}),
    [chartData]
  );
  const pick = (k) => (Number.isFinite(last?.[k]) ? last[k] : null);

  /* Guardar parámetros de control (incluye modo) */
  const saveControl = async () => {
    try {
      await setControl(deviceId, ctrl);
      await refreshControl();
      alert("Parámetros guardados");
    } catch (e) {
      console.error(e);
      alert("Error guardando control");
    }
  };

  /* Cambiar sólo el modo y guardar */
  const setMode = async (mode) => {
    try {
      await setControl(deviceId, { ...ctrl, mode });
      await refreshControl();
    } catch (e) {
      console.error(e);
      alert("Error cambiando modo");
    }
  };

  /* Accionar relé (manual) */
  const clickRelay = async (relay, state, holdSec) => {
    try {
      await setRelay(deviceId, relay, { state, holdSec });
      await refreshRelays();
    } catch (e) {
      console.error(e);
      alert("Error enviando comando");
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* CSS embebido: animaciones + responsive */}
      <style>{`
        @keyframes pulseHeat {
          0% { box-shadow: 0 0 0 rgba(255,130,0,.0); }
          50%{ box-shadow: 0 0 18px rgba(255,130,0,.55); }
          100%{ box-shadow: 0 0 0 rgba(255,130,0,.0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .page-grid { display:grid; grid-template-columns: 1fr 1fr; gap:18px; padding:18px 22px; }
        .page-grid.top { padding-top:0; }
        @media (max-width: 980px){
          .page-grid { grid-template-columns: 1fr; }
        }
        .card{ background:${C.card}; border-radius:12px; padding:14px; }
        .big { position:relative; overflow:hidden; }
        .scene{ position:relative; width:100%; }
        .scene-img{ width:100%; height:auto; display:block; border-radius:8px; }
        .badge{
          position:absolute; transform:translate(-50%,-50%);
          background:${C.pill}; color:#0b2a36; padding:6px 10px; border-radius:12px;
          font-weight:600; font-size:12px; text-align:center; min-width:56px;
          box-shadow:0 1px 4px rgba(0,0,0,.2);
        }
        .badge .bval{ font-weight:700; }
        .manual-box{
          position:absolute; top:12px; right:12px; background:rgba(0,0,0,.25);
          border:1px solid rgba(255,255,255,.25); border-radius:12px; padding:12px 12px 6px;
          backdrop-filter: blur(2px);
        }
        .manual-box h4{ margin:0 0 8px 0; }
        .rrow{ display:flex; align-items:center; gap:8px; margin:6px 0; }
        .rname{ min-width:68px; }
        .rname .n{ font-weight:700; }
        .pill-btn{
          border:none; border-radius:14px; padding:6px 12px; cursor:pointer;
          color:#fff; font-weight:700;
          background:#557a89;
        }
        .pill-btn.is-on{ background:${C.ok}; }
        .pill-btn.is-off{ background:${C.bad}; }

        .under{ display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
        .pill-line{
          background:rgba(255,255,255,.12); padding:6px 10px; border-radius:999px; font-size:12px;
        }

        /* Indicadores */
        .heater {
          position:absolute; border-radius:8px; background:rgba(255,130,0,.25);
          border:1px solid rgba(255,130,0,.35);
        }
        .heater.on { animation:pulseHeat 1.4s ease-in-out infinite; background:rgba(255,130,0,.18); }
        .fan {
          position:absolute; width:50px; height:50px; border-radius:50%;
          display:grid; place-items:center; color:#fff;
          background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.3);
        }
        .fan .blade{
          width:26px; height:26px; border:2px solid rgba(255,255,255,.85); border-radius:50%;
          border-top-color: transparent; border-right-color: transparent;
        }
        .fan.on .blade{ animation:spin .9s linear infinite; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 22px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>MONITOREO DE BATERÍA DE ARENA</h1>

        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span className="chip">Device ID</span>
          <input
            value={deviceId}
            onChange={(e)=>setDeviceId(e.target.value.trim())}
            className="chip-input"
            placeholder="heltec-v3-01"
            style={{
              background:"rgba(255,255,255,.15)", color:"#fff",
              border:"1px solid rgba(255,255,255,.25)", borderRadius:8, padding:"6px 10px"
            }}
          />
        </div>

        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button
            className="pill-btn"
            style={{ background: ctrl.mode === "auto" ? C.ok : "#557a89" }}
            onClick={() => setMode("auto")}
          >
            Auto
          </button>
          <button
            className="pill-btn"
            style={{ background: ctrl.mode === "manual" ? C.bad : "#557a89" }}
            onClick={() => setMode("manual")}
          >
            Manual
          </button>
        </div>
      </div>

      {/* Bloque superior: SP/H lazo 1 y lazo 2 */}
      <div className="page-grid top">
        {/* Lazo 1 */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>PV1 <small style={{ opacity:.7, fontSize:12 }}>(promedio K1..K4)</small></h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
            <ScadaField label="PV1" value={pv1} unit="°C" readonly />
            <NumField label="Tiempo ON (min)" value={msToMin(ctrl.l1_on_ms)} onChange={(v)=>setCtrl(p=>({...p, l1_on_ms:minToMs(v)}))}/>
            <div />
            <NumField label="SP1 (°C)" value={ctrl.sp1} onChange={(v)=>setCtrl(p=>({...p, sp1:v}))}/>
            <NumField label="Tiempo OFF (min)" value={msToMin(ctrl.l1_off_ms)} onChange={(v)=>setCtrl(p=>({...p, l1_off_ms:minToMs(v)}))}/>
            <button className="pill-btn is-on" onClick={saveControl}>Aplicar</button>
            <NumField label="H1 (°C)" value={ctrl.h1} onChange={(v)=>setCtrl(p=>({...p, h1:v}))}/>
          </div>
        </div>

        {/* Lazo 2 */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>PV2 <small style={{ opacity:.7, fontSize:12 }}>(promedio K5..K6)</small></h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
            <ScadaField label="PV2" value={pv2} unit="°C" readonly />
            <div />
            <div />
            <NumField label="SP2 (°C)" value={ctrl.sp2} onChange={(v)=>setCtrl(p=>({...p, sp2:v}))}/>
            <div />
            <button className="pill-btn is-on" onClick={saveControl}>Aplicar</button>
            <NumField label="H2 (°C)" value={ctrl.h2} onChange={(v)=>setCtrl(p=>({...p, h2:v}))}/>
          </div>
        </div>
      </div>

      {/* Bloque medio: Vistas + controles manuales */}
      <div className="page-grid">
        {/* Izquierda: top view K1..K4 + R1/R2 */}
        <div className="card big">
          <div className="scene">
            <img src="/images/mesa1.jpg" alt="top view" className="scene-img" />

            {/* Badges K1..K4 */}
            <TempBadge x="11%" y="46%" label="K1" value={pick("K1")} />
            <TempBadge x="27%" y="46%" label="K2" value={pick("K2")} />
            <TempBadge x="69%" y="46%" label="K3" value={pick("K3")} />
            <TempBadge x="85%" y="46%" label="K4" value={pick("K4")} />

            {/* Indicadores de resistencia (sobre las barras) */}
            <HeatIndicator on={!!rstate.R1} style={{ left:"36%", top:"23%", width:"6%", height:"47%" }} />
            <HeatIndicator on={!!rstate.R2} style={{ left:"54%", top:"23%", width:"6%", height:"47%" }} />
          </div>

          <div className="manual-box">
            <h4>MANUAL</h4>
            <RelayRow
              name="R1"
              subtitle="Nicrom 1"
              on={!!rstate.R1}
              onClick={() => clickRelay("R1", true)}
              offClick={() => clickRelay("R1", false)}
            />
            <RelayRow
              name="R2"
              subtitle="Nicrom 2"
              on={!!rstate.R2}
              onClick={() => clickRelay("R2", true)}
              offClick={() => clickRelay("R2", false)}
            />
          </div>

          <div className="under">
            <span className="pill-line">Lazo 1 (K1..K4 → R1/R2)</span>
            <span className="pill-line">SP1/H1: {n(ctrl.sp1)} / {n(ctrl.h1)} °C</span>
            <span className="pill-line">Duty: {msToMin(ctrl.l1_on_ms)}m ON / {msToMin(ctrl.l1_off_ms)}m OFF</span>
            <span className="pill-line">
              Relés:&nbsp;<b>R1</b> {rstate.R1 ? "ON" : "OFF"} | <b>R2</b> {rstate.R2 ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Derecha: 3D view K5..K8 + R3 */}
        <div className="card big">
          <div className="scene">
            <img src="/images/mesa2.jpg" alt="3d view" className="scene-img" />

            {/* Badges K5..K8 */}
            <TempBadge x="25%" y="22%" label="K5" value={pick("K5")} />
            <TempBadge x="61%" y="22%" label="K6" value={pick("K6")} />
            <TempBadge x="58%" y="64%" label="K7" value={pick("K7")} />
            <TempBadge x="86%" y="64%" label="K8" value={pick("K8")} />

            {/* Indicador de ventilador */}
            <FanIndicator on={!!rstate.R3} style={{ right:"12%", top:"8%" }} />
          </div>

          <div className="manual-box">
            <h4>MANUAL</h4>
            <RelayRow
              name="R3"
              subtitle="Ventiladores"
              on={!!rstate.R3}
              onClick={() => clickRelay("R3", true)}
              offClick={() => clickRelay("R3", false)}
            />
          </div>

          <div className="under">
            <span className="pill-line">Lazo 2 (K5..K6 → R3)</span>
            <span className="pill-line">SP2/H2: {n(ctrl.sp2)} / {n(ctrl.h2)} °C</span>
            <span className="pill-line">R3: {rstate.R3 ? "ON" : "OFF"}</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="page-grid" style={{ paddingBottom: 24 }}>
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Historial (últimas {chartData.length})</h4>
          <SensorChart
            chartData={chartData}
            sensors={["K1","K2","K3","K4","PV1","SP1"]}
            enabled={{ K1:true,K2:true,K3:true,K4:true, PV1:true, SP1:true }}
            colors={C.k}
          />
        </div>
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Historial (últimas {chartData.length})</h4>
          <SensorChart
            chartData={chartData}
            sensors={["K5","K6","K7","K8","PV2","SP2"]}
            enabled={{ K5:true,K6:true,K7:true,K8:true, PV2:true, SP2:true }}
            colors={C.k}
          />
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, padding: "0 22px 14px" }}>
        Estado: {status} · API: {import.meta.env.VITE_API_BASE}
      </div>
    </div>
  );
}

/* ---------- Subcomponentes locales ---------- */

function ScadaField({ label, value, unit="°C", readonly }) {
  return (
    <label className="field" style={{ display:"grid", gap:6 }}>
      <span>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input
          className="in"
          readOnly={readonly}
          value={value==null ? "##" : Number(value).toFixed(2)}
          style={{
            flex:"1 1 auto", background:"rgba(255,255,255,.15)", color:"#fff",
            border:"1px solid rgba(255,255,255,.25)", borderRadius:8, padding:"6px 10px"
          }}
        />
        <span style={{ opacity:.8 }}>{unit}</span>
      </div>
    </label>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <label className="field" style={{ display:"grid", gap:6 }}>
      <span>{label}</span>
      <input
        className="in"
        type="number"
        value={value ?? ""}
        onChange={(e)=>onChange?.(parseFloat(e.target.value))}
        style={{
          background:"rgba(255,255,255,.15)", color:"#fff",
          border:"1px solid rgba(255,255,255,.25)", borderRadius:8, padding:"6px 10px"
        }}
      />
    </label>
  );
}

function RelayRow({ name, subtitle, on, onClick, offClick }) {
  return (
    <div className="rrow">
      <div className="rname">
        <div className="n">{name}</div>
        <div className="s" style={{ opacity:.8 }}>{subtitle}</div>
      </div>
      <button className={"pill-btn " + (on ? "is-on":"")} onClick={onClick}>ON</button>
      <button className={"pill-btn " + (!on ? "is-off":"")} onClick={offClick}>OFF</button>
    </div>
  );
}

function TempBadge({ x, y, label, value }) {
  return (
    <div className="badge" style={{ left: x, top: y }}>
      <div>{label}</div>
      <div className="bval">{ value==null ? "##" : Number(value).toFixed(2)} °C</div>
    </div>
  );
}

/* Indicadores animados */
function HeatIndicator({ on, style }) {
  return (
    <div
      className={`heater ${on ? "on" : ""}`}
      style={style}
      title={on ? "R encendida" : "R apagada"}
    />
  );
}
function FanIndicator({ on, style }) {
  return (
    <div className={`fan ${on ? "on" : ""}`} style={style} title={on ? "Ventilador ON" : "Ventilador OFF"}>
      <div className="blade" />
    </div>
  );
}

/* ---------- Utils ---------- */
const n = (v) => (v==null ? "##" : v);
const msToMin = (ms=0) => Math.round((ms||0)/60000);
const minToMs = (m=0) => Math.round((m||0)*60000);
