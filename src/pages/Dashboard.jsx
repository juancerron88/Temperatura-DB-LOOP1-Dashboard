// src/pages/Dashboard.jsx
import { useState } from "react";
import useThermoData from "../hooks/useThermoData";
import { getControl, setControl, getRelayState, setRelay } from "../services/api";
import SensorChart from "../components/SensorChart";

/* Paleta */
const C = {
  bg: "#1e5166",
  card: "#1f5e75",
  cardAlt: "#1b4e62",
  pill: "#e8f3fb",
  ok: "#3cb371",
  bad: "#e74c3c",
  text: "#f2f6f9",
  textDim: "#cfe1eb",
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

  // Datos de sensores y líneas PV/SP ya listos para la gráfica
  const {
    latest,            // última lectura cruda (para tarjeta “Última lectura” si la quieres)
    status,            // estado API
    sensors,           // ["K1"..."K8"]
    active, setActive, // checkboxes de sensores
    chartData,         // arreglo para la gráfica (incluye PV1, PV2, SP1, SP2 cuando estén)
    pv1, pv2,          // promedios actuales (K1..K4 y K5..K6)
    ctrl, setCtrl,     // control actual (mode, sp1/h1/l1_on_ms/l1_off_ms, sp2/h2)
    refreshControl,    // fn para recargar control
    rstate, setRstate, // estado real de relés {R1,R2,R3}
    refreshRelays      // fn para recargar relés
  } = useThermoData(deviceId);

  // Guardar parámetros de control
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

  // Accionar relé (manual)
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>MONITOREO DE BATERÍA DE ARENA</h1>

        <div style={chipRow}>
          <span className="chip">Device ID</span>
          <input
            value={deviceId}
            onChange={(e)=>setDeviceId(e.target.value.trim())}
            className="chip-input"
            placeholder="heltec-v3-01"
          />
        </div>

        <div style={chipRow}>
          <span className="chip">Modo</span>
          <span className="chip pill" style={{ minWidth: 74, textAlign: "center" }}>
            {ctrl.mode === "manual" ? "Manual" : "Auto"}
          </span>
        </div>

        <a
          href="https://docs.google.com/spreadsheets/d/xxxxxxxx" // ← si tienes link del historial, ponlo aquí
          target="_blank" rel="noreferrer"
          className="chip-link"
        >
          Ir a historial
        </a>
      </div>

      {/* Bloque superior: SP/H lazo 1 y lazo 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "0 22px" }}>
        {/* Lazo 1 */}
        <div className="card">
          <div style={cardHeader}>PV1 <small style={miniText}>(promedio de K1 al K4)</small></div>
          <div className="grid3">
            <ScadaField label="PV1" value={pv1 ?? null} unit="°C" readonly />
            <NumField label="Tiempo ON (min)" value={msToMin(ctrl.l1_on_ms)} onChange={(v)=>setCtrl(p=>({...p, l1_on_ms: minToMs(v)}))} />
            <NumField label="" value={null} hidden />
            <NumField label="SP1" value={ctrl.sp1} onChange={(v)=>setCtrl(p=>({...p, sp1: v}))}/>
            <NumField label="Tiempo OFF (min)" value={msToMin(ctrl.l1_off_ms)} onChange={(v)=>setCtrl(p=>({...p, l1_off_ms: minToMs(v)}))}/>
            <button className="btn" onClick={saveControl}>Aplicar</button>
            <NumField label="H1" value={ctrl.h1} onChange={(v)=>setCtrl(p=>({...p, h1: v}))}/>
          </div>
        </div>

        {/* Lazo 2 */}
        <div className="card">
          <div style={cardHeader}>PV2 <small style={miniText}>(promedio de K5 al K6)</small></div>
          <div className="grid3">
            <ScadaField label="PV2" value={pv2 ?? null} unit="°C" readonly />
            <NumField label="" value={null} hidden />
            <NumField label="" value={null} hidden />
            <NumField label="SP2" value={ctrl.sp2} onChange={(v)=>setCtrl(p=>({...p, sp2: v}))}/>
            <NumField label="" value={null} hidden />
            <button className="btn" onClick={saveControl}>Aplicar</button>
            <NumField label="H2" value={ctrl.h2} onChange={(v)=>setCtrl(p=>({...p, h2: v}))}/>
          </div>
        </div>
      </div>

      {/* Bloque medio: Vistas + controles manuales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "18px 22px" }}>
        {/* Izquierda: top view K1..K4 + R1/R2 */}
        <div className="card big">
          <div className="scene">
            <img src="/img/bateria-top.jpg" alt="top view" className="scene-img" />
            {/* Sondas K1..K4 etiquetadas (posiciones aproximadas) */}
            <TempBadge x="10%" y="46%" label="K1" value={pick(latest, "K1")} />
            <TempBadge x="27%" y="46%" label="K2" value={pick(latest, "K2")} />
            <TempBadge x="68%" y="46%" label="K3" value={pick(latest, "K3")} />
            <TempBadge x="85%" y="46%" label="K4" value={pick(latest, "K4")} />
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

          {/* Estado bajo imagen: lectura de lazo 1 */}
          <div className="under">
            <span className="pill-line">Lazo 1 (K1..K4 → R1/R2)</span>
            <span className="pill-line">SP1/H1: {n(ctrl.sp1)} / {n(ctrl.h1)} °C</span>
            <span className="pill-line">Duty: {msToMin(ctrl.l1_on_ms)}m ON / {msToMin(ctrl.l1_off_ms)}m OFF</span>
            <span className="pill-line">Relés (estado real):&nbsp;
              <b>R1:</b> {rstate.R1 ? "ON" : "OFF"} &nbsp;|&nbsp;
              <b>R2:</b> {rstate.R2 ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Derecha: 3D view K5..K8 + R3 */}
        <div className="card big">
          <div className="scene">
            <img src="/img/bateria-3d.jpg" alt="3d view" className="scene-img" />
            <TempBadge x="25%" y="22%" label="K5" value={pick(latest, "K5")} />
            <TempBadge x="61%" y="22%" label="K6" value={pick(latest, "K6")} />
            <TempBadge x="58%" y="64%" label="K7" value={pick(latest, "K7")} />
            <TempBadge x="86%" y="64%" label="K8" value={pick(latest, "K8")} />
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
          </div>
        </div>
      </div>

      {/* Bloque inferior: Gráficas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "0 22px 24px" }}>
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
        API: {import.meta.env.VITE_API_BASE} · {import.meta.env.VITE_API_KEY ? "GET/PUT con API key" : "API pública"}
      </div>
    </div>
  );
}

/* ================== Helpers visuales ================== */

function ScadaField({ label, value, unit="°C", readonly }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="in ro"
        value={value==null ? "##" : value.toFixed(2)}
        readOnly
      />
      <span className="unit">{unit}</span>
    </label>
  );
}

function NumField({ label, value, onChange, hidden }) {
  if (hidden) return <div />;
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="in"
        type="number"
        value={value ?? ""}
        onChange={(e)=>onChange?.(parseFloat(e.target.value))}
      />
    </label>
  );
}

function RelayRow({ name, subtitle, on, onClick, offClick }) {
  return (
    <div className="rrow">
      <div className="rname">
        <div className="n">{name}</div>
        <div className="s">{subtitle}</div>
      </div>
      <button className={"pill-btn " + (on ? "is-on":"")} onClick={onClick}>ON</button>
      <button className={"pill-btn " + (!on ? "is-off":"")} onClick={offClick}>OFF</button>
    </div>
  );
}

function TempBadge({ x, y, label, value }) {
  return (
    <div className="badge" style={{ left: x, top: y }}>
      <div className="btext">{label}</div>
      <div className="bval">{ value==null ? "##" : value.toFixed(2)} °C</div>
    </div>
  );
}

/* ================== Utils ================== */
const chipRow = { display: "flex", gap: 8, alignItems: "center" };
const cardHeader = { fontWeight: 700, marginBottom: 10, letterSpacing: .2 };
const miniText = { fontSize: 12, opacity: .7, marginLeft: 6 };

const n = (v) => (v==null ? "##" : v);
const msToMin = (ms=0) => Math.round((ms||0)/60000);
const minToMs = (m=0) => Math.round((m||0)*60000);
function pick(latest, key){
  // latest no trae K1..K8 todos juntos; usamos chartData para badges en hook
  // aquí sólo dejamos placeholder por si quieres cambiar a otra fuente
  return latest?.meta?.sensor === key ? latest.celsius : null;
}
