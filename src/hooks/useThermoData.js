// src/hooks/useThermoData.js
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { getHistory, getLatest } from "../services/api";

const POLL_MS = 5000;

export default function useThermoData(deviceId, limit = 500) {
  const [latest, setLatest] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");
  const [sensors, setSensors] = useState([]);
  const [active, setActive] = useState({});
  const timerRef = useRef(null);

  async function load() {
    try {
      setStatus("cargando…");
      const [lt, hist] = await Promise.all([
        getLatest(deviceId).catch(() => null),
        getHistory(deviceId, limit),
      ]);
      if (lt) setLatest(lt);

      // Normalizar lecturas
      const normalized = (hist || []).map(r => ({
        ...r,
        sensor: (r.meta && r.meta.sensor) ? r.meta.sensor : "default",
      }));
      setRows(normalized);

      // Identificar sensores únicos
      const uniq = Array.from(new Set(normalized.map(r => r.sensor))).sort();
      const i = uniq.indexOf("default");
      if (i >= 0) {
        uniq.splice(i, 1);
        uniq.push("default"); // siempre al final
      }
      setSensors(uniq);

      // Inicializar checkboxes activos
      setActive(prev => {
        const next = { ...prev };
        uniq.forEach(s => {
          if (typeof next[s] === "undefined") next[s] = true;
        });
        Object.keys(next).forEach(s => {
          if (!uniq.includes(s)) delete next[s];
        });
        return next;
      });

      setStatus("ok");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Pivot para Recharts
  const chartData = useMemo(() => {
    const asc = rows.slice().reverse();
    const useSensors = sensors.length
      ? sensors
      : Array.from(new Set(asc.map(r => r.sensor)));

    return asc.map(r => {
      const ts = new Date(r.createdAt).getTime(); // numérico para eje X
      const p = {
        tsISO: r.createdAt,
        ts,
        t: dayjs(r.createdAt).format("HH:mm:ss"),
      };

      // Inicializa todos los sensores en null
      useSensors.forEach(s => {
        p[s] = null;
      });

      // Forzar número y limitar a rango válido
      const val = Math.min(350, Math.max(0, Number(r.celsius)));
      p[r.sensor] = val;

      return p;
    });
  }, [rows, sensors]);

  return { latest, status, sensors, active, setActive, chartData };
}
