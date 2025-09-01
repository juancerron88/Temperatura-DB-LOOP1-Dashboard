// src/components/SensorChart.jsx
import { useMemo } from "react";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function SensorChart({
  chartData,
  sensors,
  enabled,
  colors,
}) {
  const data = Array.isArray(chartData) ? chartData : [];
  const sens = Array.isArray(sensors) ? sensors : [];
  const en = enabled && typeof enabled === "object" ? enabled : {};

  const yDomain = useMemo(() => {
    const vals = [];
    data.forEach((p) => {
      Object.keys(p || {}).forEach((k) => {
        if (k !== "t" && k !== "tsISO" && k !== "ts") {
          const v = p[k];
          if (typeof v === "number" && !Number.isNaN(v)) vals.push(v);
        }
      });
    });
    if (!vals.length) return [0, 350];
    const min = Math.min(...vals),
      max = Math.max(...vals);
    const pad = 2;
    const lo = Math.max(0, Math.floor(min) - pad);
    const hi = Math.min(350, Math.ceil(max) + pad);
    return lo === hi ? [Math.max(0, lo - 1), Math.min(350, hi + 1)] : [lo, hi];
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="ts"
          type="number"
          domain={["dataMin", "dataMax"]}
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => (v ? dayjs(v).format("HH:mm:ss") : "")}
        />
        <YAxis domain={yDomain} tick={{ fontSize: 12 }} unit="°C" />
        <Tooltip
          labelFormatter={(v) =>
            v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : ""
          }
        />
        <Legend />
        {sens.map((s, i) =>
          en[s] ? (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={colors?.[s] || COLORS_FALLBACK[i % COLORS_FALLBACK.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={true}
            />
          ) : null
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

const COLORS_FALLBACK = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];
