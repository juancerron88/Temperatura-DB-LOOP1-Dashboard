// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import useThermoData from "../hooks/useThermoData";
import { setControl, setRelay } from "../services/api";
import SensorChart from "../components/SensorChart";

/* Paleta */
const C = {
  bg: "#1e5166",
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
    active, setActive,
    chartData, curr,
    ctrl, setCtrl, refreshControl,
    rstate, refreshRelays
  } = useThermoData(deviceId);

  const saveControl = async () => {
    await setControl(deviceId, ctrl);
    await refreshControl();
    alert("Parámetros guardados");
  };

  const clickRelay = async (relay, state, holdSec) => {
    await setRelay(deviceId, relay, { state, holdSec });
    await refreshRelays();
  };

  const changeMode = async (mode) => {
    await setControl(deviceId, { ...ctrl, mode });
    await refreshControl();
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Header ordenado */}
      <header className="hdr">
        <h1>MONITOREO DE BATERÍA DE ARENA</h1>

        <div className="hdr-row">
          <div className="chip-group">
            <span className="chip">Device ID</span>
            <input
              value={deviceId}
              onChange={(e)=>setDeviceId(e.target.value.trim())}
              className="chip-input"
              placeholder="heltec-v3-01"
            />
          </div>

          <div className="chip-group">
            <span className="chip">Modo</span>
            <div className="mode">
              <button
                className={"mode-btn " + (ctrl.mode!=="manual" ? "is-on" : "")}
                onClick={() => changeMode("auto")}
              >Auto</button>
              <button
                className={"mode-btn " + (ctrl.mode==="manual" ? "is-on" : "")}
                onClick={() => changeMode("manual")}
              >Manual</button>
            </div>
          </div>

          <a
            href="https://docs.google.com/spreadsheets/d/1X5VU7hLeUMwdZlkq76fE4hrOM3po1YOUS1HqzHjaHdM/edit?usp=sharing"
            target="_blank" rel="noreferrer"
            className="chip-link"
          >
            Ir a historial
          </a>
        </div>
      </header>

      {/* SP/H */}
      <section className="top-grid">
        <div className="card">
          <div className="card-title">PV1 <small>(promedio de K1 al K4)</small></div>
          <div className="grid3">
            <ScadaField label="PV1" value={curr.PV1} />
            <NumField
              label="Tiempo ON (min)"
              value={msToMin(ctrl.l1_on_ms)}
              onCommit={(v)=>Number.isFinite(v) && setCtrl(p=>({...p, l1_on_ms: minToMs(v)}))}
            />
            <div />
            <NumField
              label="SP1 (°C)"
              value={ctrl.sp1}
              onCommit={(v)=>Number.isFinite(v) && setCtrl(p=>({...p, sp1: v}))}
            />
            <NumField
              label="Tiempo OFF (min)"
              value={msToMin(ctrl.l1_off_ms)}
              onCommit={(v)=>Number.isFinite(v) && setCtrl(p=>({...p, l1_off_ms: minToMs(v)}))}
            />
            <button className="btn" onClick={saveControl}>Aplicar</button>
            <NumField
              label="H1 (°C)"
              value={ctrl.h1}
              onCommit={(v)=>Number.isFinite(v) && setCtrl(p=>({...p, h1: v}))}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-title">PV2 <small>(promedio de K5 al K6)</small></div>
          <div className="grid3">
            <ScadaField label="PV2" value={curr.PV2} />
            <div /><div />
            <NumField
              label="SP2 (°C)"
              value={ctrl.sp2}
              onCommit={(v)=>Number.isFinite(v) && setCtrl(p=>({...p, sp2: v}))}
            />
            <div />
            <button className="btn" onClick={saveControl}>Aplicar</button>
            <NumField
              label="H2 (°C)"
              value={ctrl.h2}
              onCommit={(v)=>Number.isFinite(v) && setCtrl(p=>({...p, h2: v}))}
            />
          </div>
        </div>
      </section>

      {/* Escenas + manual + animaciones */}
      <section className="mid-grid">
        {/* Top view */}
        <div className="card big">
          <div className="scene">
            <img src="/images/mesa1.jpg" alt="top view" className="scene-img" />

            <TempBadge x="10%" y="46%" label="K1" value={curr.K1} />
            <TempBadge x="27%" y="46%" label="K2" value={curr.K2} />
            <TempBadge x="68%" y="46%" label="K3" value={curr.K3} />
            <TempBadge x="85%" y="46%" label="K4" value={curr.K4} />

            <div className={"heater h1 " + (rstate.R1 ? "on":"")} />
            <div className={"heater h2 " + (rstate.R2 ? "on":"")} />
          </div>

          <div className="manual-box">
            <h4>MANUAL</h4>
            <RelayRow
              name="R1" subtitle="Nicrom 1" on={!!rstate.R1}
              onClick={() => clickRelay("R1", true)} offClick={() => clickRelay("R1", false)}
            />
            <RelayRow
              name="R2" subtitle="Nicrom 2" on={!!rstate.R2}
              onClick={() => clickRelay("R2", true)} offClick={() => clickRelay("R2", false)}
            />
          </div>

          <div className="under">
            <span className="pill-line">Lazo 1 (K1..K4 → R1/R2)</span>
            <span className="pill-line">SP1/H1: {n(ctrl.sp1)} / {n(ctrl.h1)} °C</span>
            <span className="pill-line">Duty: {msToMin(ctrl.l1_on_ms)}m / {msToMin(ctrl.l1_off_ms)}m</span>
            <span className="pill-line">R1 {rstate.R1?"ON":"OFF"} | R2 {rstate.R2?"ON":"OFF"}</span>
          </div>
        </div>

        {/* 3D view */}
        <div className="card big">
          <div className="scene">
            <img src="/images/mesa2.jpg" alt="3d view" className="scene-img" />
            <TempBadge x="25%" y="22%" label="K5" value={curr.K5} />
            <TempBadge x="61%" y="22%" label="K6" value={curr.K6} />
            <TempBadge x="58%" y="64%" label="K7" value={curr.K7} />
            <TempBadge x="86%" y="64%" label="K8" value={curr.K8} />
            <div className={"fan f1 " + (rstate.R3 ? "on":"")} />
            <div className={"fan f2 " + (rstate.R3 ? "on":"")} />
          </div>

          <div className="manual-box">
            <h4>MANUAL</h4>
            <RelayRow
              name="R3" subtitle="Ventiladores" on={!!rstate.R3}
              onClick={() => clickRelay("R3", true)} offClick={() => clickRelay("R3", false)}
            />
          </div>

          <div className="under">
            <span className="pill-line">Lazo 2 (K5..K6 → R3)</span>
            <span className="pill-line">SP2/H2: {n(ctrl.sp2)} / {n(ctrl.h2)} °C</span>
            <span className="pill-line">R3 {rstate.R3?"ON":"OFF"}</span>
          </div>
        </div>
      </section>

      {/* Gráficas */}
      <section className="bot-grid">
        <div className="card">
          <h4 className="mt0">Historial</h4>
          <SensorChart
            chartData={chartData}
            sensors={["K1","K2","K3","K4","PV1","SP1"]}
            active={active} setActive={setActive}
            colors={C.k}
          />
        </div>
        <div className="card">
          <h4 className="mt0">Historial</h4>
          <SensorChart
            chartData={chartData}
            sensors={["K5","K6","K7","K8","PV2","SP2"]}
            active={active} setActive={setActive}
            colors={C.k}
          />
        </div>
      </section>

      <footer className="api-foot">
        API: {import.meta.env.VITE_API_BASE}
      </footer>
    </div>
  );
}

/* ====== helpers visuales ====== */
function ScadaField({ label, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="in ro" value={value==null ? "##" : value.toFixed(2)} readOnly />
      <span className="unit">°C</span>
    </label>
  );
}

/* =========== INPUT NUMÉRICO “AMABLE” =========== */
function NumField({ label, value, onCommit }) {
  const [text, setText] = useState(value ?? "");
  const [editing, setEditing] = useState(false);
  const prevRef = useRef(value ?? "");

  // Si no estamos editando, sincroniza con valor externo
  useEffect(() => {
    if (!editing) {
      setText(value ?? "");
      prevRef.current = value ?? "";
    }
  }, [value, editing]);

  const commit = () => {
    const v = parseFloat(text);
    if (Number.isFinite(v)) {
      onCommit?.(v);
      prevRef.current = v;
      setText(String(v));
    } else {
      setText(prevRef.current === "" ? "" : String(prevRef.current));
    }
    setEditing(false);
  };

  return (
    <label className="field">
      <span>{label}</span>
      {/* permite vacío mientras escribes */}
      <input
        className="in"
        inputMode="decimal"
        value={text}
        onFocus={() => setEditing(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
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

/* ====== utils ====== */
const n = (v) => (v==null ? "##" : v);
const msToMin = (ms=0) => Math.round((ms||0)/60000);
const minToMs = (m=0) => Math.round((m||0)*60000);
