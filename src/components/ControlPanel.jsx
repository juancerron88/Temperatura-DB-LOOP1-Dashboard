// src/components/ControlPanel.jsx
import { useEffect, useState } from "react";
import { getControl, setControl } from "../services/api";

export default function ControlPanel({ deviceId }) {
  const [loading, setLoading] = useState(false);
  const [ctrl, setCtrl] = useState({
    mode: "manual",   // "manual" | "auto"
    sp1: 200,         // °C
    h1: 5,            // °C
    l1_on_ms: 300000, // ms (5 min)
    l1_off_ms: 180000,// ms (3 min)
    sp2: 40,          // °C
    h2: 3             // °C
  });

  // cargar config inicial desde backend
  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    getControl(deviceId)
      .then(data => {
        setCtrl({
          mode: data.mode || "manual",
          sp1: data.sp1 ?? 200,
          h1: data.h1 ?? 5,
          l1_on_ms: data.l1_on_ms ?? 300000,
          l1_off_ms: data.l1_off_ms ?? 180000,
          sp2: data.sp2 ?? 40,
          h2: data.h2 ?? 3,
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

        <h4>Lazo 1 (K1..K4 → R1/R2)</h4>
        <label>
          Set Point SP1 (°C):
          <input
            type="number"
            value={ctrl.sp1}
            onChange={(e) => handleChange("sp1", parseFloat(e.target.value))}
          />
        </label>
        <label>
          Histeresis H1 (°C):
          <input
            type="number"
            value={ctrl.h1}
            onChange={(e) => handleChange("h1", parseFloat(e.target.value))}
          />
        </label>
        <label>
          Tiempo ON (min):
          <input
            type="number"
            value={Math.round(ctrl.l1_on_ms / 60000)}
            onChange={(e) =>
              handleChange("l1_on_ms", parseInt(e.target.value) * 60000)
            }
          />
        </label>
        <label>
          Tiempo OFF (min):
          <input
            type="number"
            value={Math.round(ctrl.l1_off_ms / 60000)}
            onChange={(e) =>
              handleChange("l1_off_ms", parseInt(e.target.value) * 60000)
            }
          />
        </label>

        <h4>Lazo 2 (K5..K6 → R3)</h4>
        <label>
          Set Point SP2 (°C):
          <input
            type="number"
            value={ctrl.sp2}
            onChange={(e) => handleChange("sp2", parseFloat(e.target.value))}
          />
        </label>
        <label>
          Histeresis H2 (°C):
          <input
            type="number"
            value={ctrl.h2}
            onChange={(e) => handleChange("h2", parseFloat(e.target.value))}
          />
        </label>

        <button onClick={handleSave} disabled={loading}>
          Guardar
        </button>
      </div>
    </div>
  );
}
