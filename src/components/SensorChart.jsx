import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function SensorChart({ chartData, sensors, enabled, colors }) {
  // Dominio Y dinámico (0..350) con un pequeño margen
  const yDomain = useMemo(() => {
    const vals = [];
    chartData.forEach(p => {
      Object.keys(p).forEach(k => {
        if (k !== "t" && k !== "tsISO") {
          const v = p[k];
          if (typeof v === "number" && !Number.isNaN(v)) vals.push(v);
        }
      });
    });
    if (!vals.length) return [0, 350];

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = 2;
    const lo = Math.max(0, Math.floor(min) - pad);
    const hi = Math.min(350, Math.ceil(max) + pad);
    return lo === hi ? [Math.max(0, lo - 1), Math.min(350, hi + 1)] : [lo, hi];
  }, [chartData]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" tick={{ fontSize: 12 }} />
        <YAxis domain={yDomain} tick={{ fontSize: 12 }} unit="°C" />
        <Tooltip />
        <Legend />
        {sensors.map((s) =>
          enabled[s] ? (
            <Line
              key={s}
              type="monotone"
              dataKey={s}                 // <- columna ya pivoteada por el hook
              name={s}
              stroke={colors[s] || "#8884d8"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          ) : null
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
