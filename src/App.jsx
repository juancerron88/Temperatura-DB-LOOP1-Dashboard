import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import dayjs from "dayjs";
import "modern-normalize";
import "./App.css";
import { getHistory, getLatest } from "./lib/api";

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";
const POLL_MS = 5000;

export default function App() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const [latest, setLatest] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");
  const [sensorList, setSensorList] = useState([]);      // ["K1","K2",...]
  const [active, setActive] = useState({});              // { K1:true, K2:false, ... }
  const timerRef = useRef(null);

  async function loadAll(dev = deviceId) {
    try {
      setStatus("cargando…");
      const [lt, hist] = await Promise.all([
        getLatest(dev).catch(() => null),
        getHistory(dev, 500), // subimos el límite para tener más puntos
      ]);
      if (lt) setLatest(lt);

      // Aseguramos 'sensor' aunque el backend no lo incluya
      const normalized = (hist || []).map(r => ({
        ...r,
        sensor: (r.meta && r.meta.sensor) ? r.meta.sensor : "default",
      }));
      setRows(normalized);

      // sensores únicos (orden alfabético, "default" al final)
      const uniq = Array.from(new Set(normalized.map(r => r.sensor)));
      uniq.sort((a,b) => (a==="default") - (b==="default") || a.localeCompare(b));
      setSensorList(uniq);

      // por defecto, todos activos (si ya había estado, lo preservamos)
      setActive(prev => {
        const next = { ...prev };
        uniq.forEach(s => { if (typeof next[s] === "undefined") next[s] = true; });
        // limpia sensores que ya no existen
        Object.keys(next).forEach(s => { if (!uniq.includes(s)) delete next[s]; });
        return next;
      });

      setStatus("ok");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadAll();
    timerRef.current = setInterval(loadAll, POLL_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Datos para el chart: orden cronológico ascendente
  const chartData = useMemo(
    () =>
      rows
        .slice()
        .reverse()
        .map((r) => ({
          tsISO: r.createdAt,
          t: dayjs(r.createdAt).format("HH:mm:ss"),
          c: Number(r.celsius),
          sensor: r.sensor,
        })),
    [rows]
  );

  const toggleSensor = (s) => setActive(prev => ({ ...prev, [s]: !prev[s] }));

  return (
    <div className="page">
      <header className="topbar">
        <h1>Heltec Thermo Dashboard</h1>
        <div className="controls">
          <label>
            Device ID:&nbsp;
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value.trim())}
              placeholder="heltec-v3-01"
            />
          </label>
          <button onClick={() => loadAll()} title="Refrescar ahora">↻</button>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <h3>Última lectura</h3>
          {latest ? (
            <div className="latest">
              <div className="temp">{latest.celsius.toFixed(2)} °C</div>
              <div className="meta">
                <div>Device: <b>{latest.deviceId}</b></div>
                <div>Hora: {dayjs(latest.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
              </div>
            </div>
          ) : (
            <p>Sin datos aún…</p>
          )}
          <div className={`status ${status}`}>estado: {status}</div>

          {/* Filtros por sensor */}
          {sensorList.length > 0 && (
            <>
              <hr style={{ margin: "10px 0", opacity: 0.3 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {sensorList.map((s, idx) => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={!!active[s]}
                      onChange={() => toggleSensor(s)}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card stretch">
          <h3>Historial (últimas {rows.length})</h3>
          <div className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} unit="°C" />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload && payload[0] ? dayjs(payload[0].payload.tsISO).format("YYYY-MM-DD HH:mm:ss") : ""
                  }
                />
                <Legend />

                {/* Una línea por sensor activado. 
                    Usamos dataKey como función: dibuja el valor cuando coincide el sensor; si no, null */}
                {sensorList.map((s, i) =>
                  active[s] ? (
                    <Line
                      key={s}
                      type="monotone"
                      dataKey={(row) => (row.sensor === s ? row.c : null)}
                      name={s}
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <footer className="foot">
        API: {import.meta.env.VITE_API_BASE} · {import.meta.env.VITE_API_KEY ? "GET con API key" : "GET público"}
      </footer>
    </div>
  );
}
