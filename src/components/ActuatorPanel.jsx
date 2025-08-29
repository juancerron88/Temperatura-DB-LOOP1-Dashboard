// src/components/ActuatorPanel.jsx
import { sendActuator } from "../services/api";

export default function ActuatorPanel({ deviceId }) {
  const click = async (target, action) => {
    try { await sendActuator({ deviceId, target, action }); }
    catch (e) { console.error(e); alert("Error enviando comando"); }
  };

  return (
    <div className="card">
      <h3>Actuadores</h3>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn" onClick={() => click("R1","ON")}>R1 ON</button>
        <button className="btn" onClick={() => click("R1","OFF")}>R1 OFF</button>
      </div>
    </div>
  );
}
