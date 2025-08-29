// src/components/SensorChart.jsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import dayjs from "dayjs";
import { getColor } from "../utils/colors";

export default function SensorChart({ chartData, sensors, active, onToggle }) {
  return (
    <div className="card stretch">
      <h3>Historial (últimas {chartData.length})</h3>

      {/* filtros */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
        {sensors.map((s, idx) => (
          <label key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={!!active[s]} onChange={() => onToggle(s)} />
            <span style={{ color: getColor(s, idx), fontWeight: 600 }}>{s}</span>
          </label>
        ))}
      </div>

      <div className="chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="t" tick={{ fontSize: 12 }} />
            <YAxis domain={["auto","auto"]} tick={{ fontSize: 12 }} unit="°C" />
            <Tooltip
              labelFormatter={(_, payload) =>
                payload && payload[0] ? dayjs(payload[0].payload.tsISO).format("YYYY-MM-DD HH:mm:ss") : ""
              }
            />
            <Legend />
            {sensors.map((s, i) =>
              active[s] ? (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  name={s}
                  stroke={getColor(s, i)}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
