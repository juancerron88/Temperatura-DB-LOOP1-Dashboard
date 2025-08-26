import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import dayjs from "dayjs";
import "modern-normalize"; // opcional
import "./App.css";
import { getHistory, getLatest } from "./lib/api";

const DEFAULT_DEVICE = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";
const POLL_MS = 5000;

export default function App() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const [latest, setLatest] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);

  async function loadAll(dev = deviceId) {
    try {
      setStatus("cargando…");
      const [lt, hist] = await Promise.all([
        getLatest(dev).catch(() => null),
        getHistory(dev, 300),
      ]);
      if (lt) setLatest(lt);
      setRows(hist || []);
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

  const chartData = useMemo(
    () =>
      rows
        .slice()
        .reverse()
        .map((r) => ({
          t: dayjs(r.createdAt).format("HH:mm:ss"),
          c: Number(r.celsius),
        })),
    [rows]
  );

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
        </div>

        <div className="card stretch">
          <h3>Historial (últimas {rows.length})</h3>
                        <a
                className="download"
                href={`${import.meta.env.VITE_API_BASE}/api/thermo/export?deviceId=${encodeURIComponent(deviceId)}&limit=20000&format=csv${import.meta.env.VITE_API_KEY ? `&key=${encodeURIComponent(import.meta.env.VITE_API_KEY)}` : ""}`}
              >
                Descargar CSV
              </a>
              &nbsp;|&nbsp;
              <a
                className="download"
                href={`${import.meta.env.VITE_API_BASE}/api/thermo/export?deviceId=${encodeURIComponent(deviceId)}&limit=20000&format=xlsx${import.meta.env.VITE_API_KEY ? `&key=${encodeURIComponent(import.meta.env.VITE_API_KEY)}` : ""}`}
              >
                Descargar XLSX
              </a>
          <div className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 12 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} unit="°C" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="c" name="°C" dot={false} strokeWidth={2} />
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
