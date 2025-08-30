// src/components/ControlPanel.jsx
import { useEffect, useState } from "react";
import { getControl, setControl } from "../services/api";

export default function ControlPanel({ deviceId }) {
  const [loading, setLoading] = useState(false);
  const [ctrl, setCtrl] = useState({
    mode: "manual",     // "manual" | "auto"
    setPoint: 200,      // °C
    hysteresis: 5       // °C
  });

  // cargar config inicial desde backend
  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    getControl(deviceId)
      .then(data => {
        setCtrl({
          mode: data.mode || "manual",
          setPoint: data.setPoint || 200,
          hysteresis: data.hysteresis || 5,
        });
      })
      .catch(err => console.error("Error getControl", err))
      .finally(() => setLoading(false));
  }, [deviceId]);

  const handleChange = (field, value) => {
    setCtrl(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await setControl(deviceId, ctrl);
      alert("Parámetros guardados ✔️");
    } catch (e) {
      console.error(e);
      alert("Error guardando parámetros ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Control automático</h3>
      {loading && <p>Cargando...</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label>
          Modo:
          <select
            value={ctrl.mode}
            onChange={(e) => handleChange("mode", e.target.value)}
          >
            <option value="manual">Manual</option>
            <option value="auto">Automático</option>
          </select>
        </label>

        <label>
          Set Point (°C):
          <input
            type="number"
            value={ctrl.setPoint}
            onChange={(e) => handleChange("setPoint", parseFloat(e.target.value))}
          />
        </label>

        <label>
          Histeresis (°C):
          <input
            type="number"
            value={ctrl.hysteresis}
            onChange={(e) => handleChange("hysteresis", parseFloat(e.target.value))}
          />
        </label>

        <button onClick={handleSave} disabled={loading}>
          Guardar
        </button>
      </div>
    </div>
  );
}
