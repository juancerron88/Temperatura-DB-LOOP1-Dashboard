// src/pages/Dashboard.jsx
import { useState } from "react";
import useThermoData from "../hooks/useThermoData";
import LatestCard from "../components/LatestCard";
import SensorChart from "../components/SensorChart";
import ActuatorPanel from "../components/ActuatorPanel";

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const { latest, status, sensors, active, setActive, chartData } = useThermoData(deviceId, 500);

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
        <SensorChart
          chartData={chartData}
          sensors={sensors}
          active={active}
          onToggle={(s)=>setActive(prev=>({ ...prev, [s]: !prev[s] }))}
        />
        {/* Actuadores (cuando el backend esté listo) */}
        {/* <ActuatorPanel deviceId={deviceId} /> */}
      </section>

      <footer className="foot">
        API: {import.meta.env.VITE_API_BASE} · {import.meta.env.VITE_API_KEY ? "GET con API key" : "GET público"}
      </footer>
    </div>
  );
}
