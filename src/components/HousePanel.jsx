// src/components/HousePanel.jsx
import { useEffect, useRef, useState } from "react";
import { getLatestBySensor, defaultDeviceId } from "../services/api";

const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : "—");

// Guarda/carga posiciones en localStorage
function useBadgePos(key, defPos) {
  const [pos, setPos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || defPos; }
    catch { return defPos; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(pos)); }, [key, pos]);
  return [pos, setPos];
}

// Etiqueta arrastrable (usa el mismo look de tus badges)
function DraggableBadge({ edit, containerRef, pos, setPos, label, t, h }) {
  const onPointerDown = (e) => {
    if (!edit) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();

    const rect = el.getBoundingClientRect();
    const move = (ev) => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      setPos({
        x: `${Math.max(0, Math.min(100, x))}%`,
        y: `${Math.max(0, Math.min(100, y))}%`,
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className={"badge hb " + (edit ? "is-edit" : "")}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
    >
      <div className="btext">{label}</div>
      <div className="bval">{fmt(t)} °C</div>
      <div className="bhum">{fmt(h, 0)} % HR</div>
    </div>
  );
}

/**
 * Props:
 * - deviceId?: string (default: .env)
 * - curr?: { DHT_INT, DHT_EXT, PV2? }  // si vienes del hook useThermoData
 * - l2?:   { hotEnough, batteryReady, outAvg } // flags del lazo 2 (opcional)
 */
export default function HousePanel({ deviceId = defaultDeviceId, curr, l2 = {} }) {
  const [inData, setIn] = useState(null);   // DHT_INT (usa para humedad y fallback de temp)
  const [outData, setOut] = useState(null); // DHT_EXT
  const [edit, setEdit] = useState(false);
  const stageRef = useRef(null);

  // Posiciones (por defecto dentro/fuera). Se guardan por deviceId.
  const [posInt, setPosInt] = useBadgePos(`house_badge_int_${deviceId}`, { x: "58%", y: "58%" });
  const [posExt, setPosExt] = useBadgePos(`house_badge_ext_${deviceId}`, { x: "10%", y: "15%" });

  // Pull periódico SOLO para humedad (y como fallback de temperatura)
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const [i, o] = await Promise.all([
        getLatestBySensor(deviceId, "DHT_INT"),
        getLatestBySensor(deviceId, "DHT_EXT"),
      ]);
      if (!alive) return;
      setIn(i || null);
      setOut(o || null);
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(id); };
  }, [deviceId]);

  // Temperaturas a mostrar:
  // - Si llega `curr` desde el hook, usarlo para temp (más fluido)
  // - Humedad siempre desde el endpoint (inData / outData)
  const insideTemp  = Number.isFinite(curr?.DHT_INT) ? curr.DHT_INT : inData?.celsius;
  const outsideTemp = Number.isFinite(curr?.DHT_EXT) ? curr.DHT_EXT : outData?.celsius;
  const insideHum   = inData?.meta?.humidity;
  const outsideHum  = outData?.meta?.humidity;

  return (
    <div className="house-wrap">
      <div className="house-controls">
        <button className={"btn " + (edit ? "is-on" : "")} onClick={() => setEdit(v => !v)}>
          {edit ? "Terminar" : "Mover etiquetas"}
        </button>
      </div>

      <div className="scene house-stage" ref={stageRef} style={{ position:"relative", minHeight: 260 }}>
        <img src="/images/house.png" alt="Casa" className="scene-img house-img" draggable={false} />

        <DraggableBadge
          edit={edit}
          containerRef={stageRef}
          pos={posExt}
          setPos={setPosExt}
          label="Exterior"
          t={outsideTemp}
          h={outsideHum}
        />

        <DraggableBadge
          edit={edit}
          containerRef={stageRef}
          pos={posInt}
          setPos={setPosInt}
          label="Interior"
          t={insideTemp}
          h={insideHum}
        />

        {/* Línea de estado del lazo 2 (opcional) */}
        <div style={{
          position:"absolute", left: 12, bottom: 12,
          display:"flex", gap:12, flexWrap:"wrap"
        }}>
          {typeof l2.hotEnough    === "boolean" && <Pill ok={!!l2.hotEnough}    text="Salida ≥ 50 °C" />}
          {typeof l2.batteryReady === "boolean" && <Pill ok={!!l2.batteryReady} text="Batería lista" />}
          {Number.isFinite(l2.outAvg) && <Pill ok text={`OutAvg ${l2.outAvg.toFixed(1)} °C`} />}
        </div>
      </div>
    </div>
  );
}

function Pill({ ok, text }) {
  return <span className={"pill-line " + (ok ? "" : "dim")}>{text}</span>;
}
