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

export default function HousePanel({ deviceId = defaultDeviceId }) {
  const [inData, setIn] = useState(null);   // DHT_INT
  const [outData, setOut] = useState(null); // DHT_EXT
  const [edit, setEdit] = useState(false);
  const stageRef = useRef(null);

  // Posiciones (por defecto dentro/fuera). Se guardan por deviceId.
  const [posInt, setPosInt] = useBadgePos(`house_badge_int_${deviceId}`, { x: "50%", y: "62%" });
  const [posExt, setPosExt] = useBadgePos(`house_badge_ext_${deviceId}`, { x: "82%", y: "12%" });

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
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [deviceId]);

  return (
    <div className="house-wrap">
      <div className="house-controls">
        <button className={"btn " + (edit ? "is-on" : "")} onClick={() => setEdit(v => !v)}>
          {edit ? "Terminar" : "Mover etiquetas"}
        </button>
      </div>

      <div className="house-stage" ref={stageRef}>
        <img src="/images/house.png" alt="Casa" className="house-img" />

        <DraggableBadge
          edit={edit}
          containerRef={stageRef}
          pos={posExt}
          setPos={setPosExt}
          label="Exterior"
          t={outData?.celsius}
          h={outData?.meta?.humidity}
        />

        <DraggableBadge
          edit={edit}
          containerRef={stageRef}
          pos={posInt}
          setPos={setPosInt}
          label="Interior"
          t={inData?.celsius}
          h={inData?.meta?.humidity}
        />
      </div>
    </div>
  );
}
