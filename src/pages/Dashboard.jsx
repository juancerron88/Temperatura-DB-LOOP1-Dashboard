// src/pages/Dashboard.jsx
import { useState } from "react";
import useThermoData from "../hooks/useThermoData";
import LatestCard from "../components/LatestCard";
import SensorChart from "../components/SensorChart";
import ControlPanel from "../components/ControlPanel";   // 👈 importa ControlPanel
import ActuatorPanel from "../components/ActuatorPanel"; // (manual relés)

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";

const COLORS = {
  K1:"#4ea1ff", K2:"#6dd5ed", K3:"#7ee787", K4:"#2ecc71",
  K5:"#f1c40f", K6:"#e67e22", K7:"#fd79a8", K8:"#e056fd",
  default:"#17becf",
};

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const { latest, status, sensors, active, setActive, chartData } =
    useThermoData(deviceId, 800);

  return (
    <div className="page">
      <header className="topbar">
        <h1>SCADA de Baterías de Arena</h1>
        <div className="controls">
          <label>
            Device ID:&nbsp;
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value.trim())}
              placeholder="heltec-v3-01"
            />
          </label>
        </div>
      </header>

      <section className="cards">
        <LatestCard latest={latest} status={status} />

        {/* 👇 Panel AUTOMÁTICO (setpoints/histeresis) */}
        <ControlPanel deviceId={deviceId} />

        {/* Selector de sensores */}
        <div className="card">
          <h3>Sensores</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {sensors.map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={!!active[s]}
                  onChange={() => setActive((prev) => ({ ...prev, [s]: !prev[s] }))}
                />
                <span style={{ color: COLORS[s] || "#8884d8", fontWeight: 600 }}>{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gráfico histórico */}
        <div className="card stretch">
          <h3>Historial (últimas {chartData.length})</h3>
          <SensorChart chartData={chartData} sensors={sensors} enabled={active} colors={COLORS} />
        </div>

        {/* 👇 Panel MANUAL de relés */}
        <ActuatorPanel deviceId={deviceId} />
      </section>

      <footer className="foot">
        API: {import.meta.env.VITE_API_BASE} · {import.meta.env.VITE_API_KEY ? "GET/PUT con API key" : "API pública"}
      </footer>
    </div>
  );
}
