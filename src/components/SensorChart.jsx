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

export default function SensorChart({ chartData, sensors, enabled, colors }) {
  // Qué serie está visible (por defecto true salvo que enabled[key] === false)
  const isVisible = (key) => enabled?.[key] !== false;

  // Dominios del eje Y (considera sensores + PV/SP)
  const yDomain = useMemo(() => {
    const vals = [];
    for (const p of chartData) {
      for (const k of Object.keys(p)) {
        if (k === "t" || k === "tsISO" || k === "ts") continue;
        const v = p[k];
        if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
      }
    }
    if (!vals.length) return [0, 350];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = 2;
    const lo = Math.max(0, Math.floor(min) - pad);
    const hi = Math.min(350, Math.ceil(max) + pad);
    return lo === hi ? [Math.max(0, lo - 1), Math.min(350, hi + 1)] : [lo, hi];
  }, [chartData]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="ts"
          type="number"
          domain={["dataMin", "dataMax"]}
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => dayjs(v).format("HH:mm:ss")}
        />
        <YAxis domain={yDomain} tick={{ fontSize: 12 }} unit="°C" />
        <Tooltip
          labelFormatter={(v) => dayjs(v).format("YYYY-MM-DD HH:mm:ss")}
        />
        <Legend />

        {/* Sensores K1..K8 */}
        {sensors.map((s, i) =>
          isVisible(s) ? (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={colors[s] || COLORS_FALLBACK[i % COLORS_FALLBACK.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ) : null
        )}

        {/* PV1/SP1 (lazo 1) */}
        {isVisible("PV1") && (
          <Line
            type="monotone"
            dataKey="PV1"
            name="PV1 (K1..K4)"
            stroke="#00d084"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        )}
        {isVisible("SP1") && (
          <Line
            type="monotone"
            dataKey="SP1"
            name="SP1"
            stroke="#ffffff"
            strokeDasharray="6 4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        )}

        {/* PV2/SP2 (lazo 2) */}
        {isVisible("PV2") && (
          <Line
            type="monotone"
            dataKey="PV2"
            name="PV2 (K5..K6)"
            stroke="#f39c12"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        )}
        {isVisible("SP2") && (
          <Line
            type="monotone"
            dataKey="SP2"
            name="SP2"
            stroke="#ffd166"
            strokeDasharray="6 4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
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
