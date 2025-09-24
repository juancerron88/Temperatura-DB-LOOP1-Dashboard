import { useEffect, useState } from "react";
import { getLatestBySensor, defaultDeviceId } from "../services/api";

const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const colorByComfort = (t) => {
  if (!Number.isFinite(t)) return "#888";
  if (t < 15) return "#3b82f6";     // frío
  if (t > 25) return "#ef4444";     // calor
  return "#22c55e";                 // confort
};

export default function HousePanel({ deviceId = defaultDeviceId }) {
  const [inD, setInD] = useState(null);   // DHT_INT
  const [outD, setOutD] = useState(null); // DHT_EXT

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const [i, o] = await Promise.all([
        getLatestBySensor(deviceId, "DHT_INT"),
        getLatestBySensor(deviceId, "DHT_EXT"),
      ]);
      if (!alive) return;
      setInD(i || null);
      setOutD(o || null);
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [deviceId]);

  const ti = inD?.celsius, hi = inD?.meta?.humidity;
  const te = outD?.celsius, he = outD?.meta?.humidity;

  return (
    <div className="house-wrap card p-3">
      <h3 className="mb-2">Temperatura de la Casa</h3>
      <div className="house-stage">
        <img className="house-img" src="/images/house.png" alt="Casa" />
        {/* Exterior */}
        <div className="house-badge house-badge-ext" style={{borderColor: colorByComfort(te)}}>
          <div className="b-title">Exterior</div>
          <div className="b-temp">{fmt(te)}°C</div>
          <div className="b-hum">{fmt(he,0)}% HR</div>
        </div>
        {/* Interior */}
        <div className="house-badge house-badge-int" style={{borderColor: colorByComfort(ti)}}>
          <div className="b-title">Interior</div>
          <div className="b-temp">{fmt(ti)}°C</div>
          <div className="b-hum">{fmt(hi,0)}% HR</div>
        </div>
      </div>

      <div className="house-legend">
        <span className="dot" style={{background:"#3b82f6"}} /> &lt; 15°C
        <span className="dot" style={{background:"#22c55e"}} /> 15–25°C
        <span className="dot" style={{background:"#ef4444"}} /> &gt; 25°C
      </div>
    </div>
  );
}

