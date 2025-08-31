// src/components/SensorChart.jsx
import { useMemo } from "react";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function SensorChart({ chartData, sensors, enabled, colors }) {
  const yDomain = useMemo(() => {
    const vals = [];
    chartData.forEach(p => {
      Object.keys(p).forEach(k => {
        if (["t","ts","tsISO"].includes(k)) return;
        const v = p[k];
        if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
      });
    });
    if (!vals.length) return [0, 60];
    const min = Math.min(...vals), max = Math.max(...vals);
    const pad = 2;
    return [Math.floor(min)-pad, Math.ceil(max)+pad];
  }, [chartData]);

  return (
    <ResponsiveContainer width="100%" height={300}>
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
        <Tooltip labelFormatter={(v) => dayjs(v).format("YYYY-MM-DD HH:mm:ss")} />
        <Legend />
        {sensors.map((s, i) =>
          enabled[s] ? (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={colors[s] || fallback[i % fallback.length]}
              strokeWidth={ s.startsWith("SP") ? 1.2 : 2.4 }
              dot={false}
              isAnimationActive={false}
              connectNulls={true}
              strokeDasharray={ s.startsWith("SP") ? "6 6" : undefined }
            />
          ) : null
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

const fallback = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd",
  "#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"];
