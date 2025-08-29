// src/pages/Dashboard.jsx
import { useState } from "react";
import useThermoData from "../hooks/useThermoData";
import LatestCard from "../components/LatestCard";
import SensorChart from "../components/SensorChart";
// import ActuatorPanel from "../components/ActuatorPanel";

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const { latest, status, sensors, active, setActive, chartData } = useThermoData(deviceId, 500);

  const COLORS = { K1: "#0074D9", K2: "#FF4136", default: "#2ECC40" };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Heltec Thermo Dashboard</h1>
        <div className="controls">
          <label>
            Device ID:&nbsp;
            <input value={deviceId} onChange={(e)=>setDeviceId(e.target.value.trim())} />
          </label>
        </div>
      </header>

      <section className="cards">
        <LatestCard latest={latest} status={status} />

        {/* Filtros por sensor */}
        <div className="card">
          <h3>Sensores</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {sensors.map(s => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={!!active[s]}
                  onChange={() => setActive(prev => ({ ...prev, [s]: !prev[s] }))}
                />
                <span style={{ color: COLORS[s] || "#8884d8", fontWeight: 600 }}>{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card stretch">
          <h3>Historial (últimas {chartData.length})</h3>
            <SensorChart
            chartData={chartData}
            sensors={sensors}
            enabled={active}
            colors={{ K1: "#0074D9", K2: "#FF4136", default: "#2ECC40" }}
            />

        </div>

        {/* Actuadores (cuando el backend esté listo) */}
        {/* <ActuatorPanel deviceId={deviceId} /> */}
      </section>

      <footer className="foot">
        API: {import.meta.env.VITE_API_BASE} · {import.meta.env.VITE_API_KEY ? "GET con API key" : "GET público"}
      </footer>
    </div>
  );
}
