// src/components/SensorChart.jsx
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function SensorChart({ data, series, showToggles=false }) {
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(series.map(s => [s.key, true]))
  );

  const yDomain = useMemo(() => {
    const vals = [];
    data.forEach(p => {
      series.forEach(s => {
        const v = p[s.key];
        if (typeof v === "number" && !Number.isNaN(v)) vals.push(v);
      });
    });
    if (!vals.length) return [0, 350];
    const min = Math.min(...vals), max = Math.max(...vals);
    const pad = 2, lo = Math.max(0, Math.floor(min)-pad), hi = Math.min(350, Math.ceil(max)+pad);
    return lo===hi ? [Math.max(0,lo-1), Math.min(350,hi+1)] : [lo,hi];
  }, [data, series]);

  return (
    <>
      {showToggles && (
        <div className="chart-toggles">
          {series.map(s => (
            <label key={s.key} className="toggle-item">
              <input
                type="checkbox"
                checked={!!enabled[s.key]}
                onChange={(e)=>setEnabled(prev => ({...prev, [s.key]: e.target.checked}))}
              />
              <span style={{color:s.color}}>{s.key}</span>
            </label>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={["dataMin","dataMax"]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v)=>dayjs(v).format("HH:mm:ss")}
          />
          <YAxis domain={yDomain} tick={{ fontSize: 12 }} unit="°C" />
          <Tooltip labelFormatter={(v)=>dayjs(v).format("YYYY-MM-DD HH:mm:ss")} />
          <Legend />
          {series.map(s => enabled[s.key] && (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
              strokeDasharray={s.dashed ? "6 6" : undefined}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
