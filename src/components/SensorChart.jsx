// src/components/SensorChart.jsx
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function SensorChart({
  chartData,
  sensors,
  active, setActive,
  colors
}) {
  const [rangeMin, setRangeMin] = useState(60);

  const filtered = useMemo(() => {
    if (!chartData?.length) return [];
    const maxTs = chartData[chartData.length-1].ts || Date.now();
    const minTs = maxTs - rangeMin*60*1000;
    return chartData.filter(p => (p.ts ?? 0) >= minTs);
  }, [chartData, rangeMin]);

  const yDomain = useMemo(() => {
    const vals = [];
    filtered.forEach(p => {
      for (const k of sensors) {
        const v = p[k];
        if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
      }
    });
    if (!vals.length) return [0, 350];
    const min = Math.min(...vals), max = Math.max(...vals);
    const pad = 2;
    const lo = Math.max(0, Math.floor(min) - pad);
    const hi = Math.min(350, Math.ceil(max) + pad);
    return lo === hi ? [Math.max(0, lo - 1), Math.min(350, hi + 1)] : [lo, hi];
  }, [filtered, sensors]);

  const toggle = (k) => setActive?.(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="chart-wrap">
      <div className="chart-toolbar">
        <div className="checks">
          {sensors.map(k => (
            <label key={k} className="chk">
              <input
                type="checkbox"
                checked={!!active?.[k]}
                onChange={() => toggle(k)}
              />
              <span style={{ color: colors?.[k] || "#17becf" }}>{k}</span>
            </label>
          ))}
        </div>
        <div className="ranges">
          {[15,60,360,1440].map(m => (
            <button
              key={m}
              className={"rng " + (rangeMin===m ? "is-active" : "")}
              onClick={() => setRangeMin(m)}
            >
              {m<60 ? `${m}m` : m===60 ? "1h" : m===360 ? "6h" : "24h"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => dayjs(v).format("HH:mm:ss")}
          />
          <YAxis domain={yDomain} tick={{ fontSize: 12 }} unit="°C" />
          <Tooltip labelFormatter={(v) => dayjs(v).format("YYYY-MM-DD HH:mm:ss")} />
          <Legend />
          {sensors.map((s, i) =>
            active?.[s] ? (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                name={s}
                stroke={colors?.[s] || FALL[i % FALL.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const FALL = [
  "#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd",
  "#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"
];
