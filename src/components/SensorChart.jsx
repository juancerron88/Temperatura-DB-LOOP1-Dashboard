import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function SensorChart({ rows, enabled, colors }) {
  // Pivot de datos: convierte [{createdAt, sensor, celsius}, ...] => [{t, K1: val, K2: val, ...}, ...]
  const chartData = useMemo(() => {
    const grouped = {};

    rows.forEach(r => {
      const t = new Date(r.createdAt).toLocaleTimeString();
      if (!grouped[t]) grouped[t] = { t };

      // forzar valores numéricos y limitar entre 0–350
      const val = Math.min(350, Math.max(0, Number(r.celsius)));
      grouped[t][r.sensor || "default"] = val;
    });

    return Object.values(grouped);
  }, [rows]);

  // Calcular dominio Y dinámico con límite 0–350
  const yDomain = useMemo(() => {
    const vals = [];
    chartData.forEach(p => {
      Object.keys(p).forEach(k => {
        if (k !== "t") {
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

        {Object.keys(enabled).map(
          key =>
            enabled[key] && (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                dot={false}
                strokeWidth={2}
                stroke={colors[key] || "#8884d8"} // color por sensor
              />
            )
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

