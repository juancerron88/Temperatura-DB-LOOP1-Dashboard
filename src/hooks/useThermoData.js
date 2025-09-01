// src/hooks/useThermoData.js
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getLatest,
  getHistory,
  getSensors,
  getSummary,
  getControl,
  getRelayStatus, // <-- usa /api/relay/:deviceId (estado real)
} from "../services/api";

export default function useThermoData(deviceId, limit = 800) {
  const [latest, setLatest]   = useState(null);
  const [status, setStatus]   = useState("idle");
  const [sensors, setSensors] = useState([]);
  const [active, setActive]   = useState({});
  const [rows, setRows]       = useState([]); // history crudo
  const [ctrl, setCtrl]       = useState({
    mode: "auto",
    sp1: 50, h1: 4, l1_on_ms: 5*60000, l1_off_ms: 3*60000, l1_alternate: false,
    sp2: 80, h2: 3
  });

  // Estado real de relés (refleja AUTO o MANUAL)
  const [rstate, setRstate]   = useState({ R1:false, R2:false, R3:false });

  /* ---------------- Loaders ---------------- */

  const refreshSensors = useCallback(async () => {
    try {
      const s = await getSensors(deviceId);
      setSensors(s);
      // por defecto todos visibles si aún no hay preferencias
      const init = {};
      s.forEach(k => (init[k] = true));
      if (!Object.keys(active).length) {
        // añadimos también PV/SP
        setActive({
          ...init,
          PV1: true, PV2: true,
          SP1: true, SP2: true,
        });
      }
    } catch {}
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshLatest = useCallback(async () => {
    try { setLatest(await getLatest(deviceId)); } catch {}
  }, [deviceId]);

  const refreshHistory = useCallback(async () => {
    try { setRows(await getHistory(deviceId, limit)); } catch {}
  }, [deviceId, limit]);

  const refreshSummary = useCallback(async () => {
    try { await getSummary(deviceId, 600); } catch {}
  }, [deviceId]);

  const refreshControl = useCallback(async () => {
    try { setCtrl(await getControl(deviceId)); } catch {}
  }, [deviceId]);

  // *** ESTADO REAL DE RELÉS (AUTO + MANUAL) ***
  const refreshRelays = useCallback(async () => {
    try {
      const doc = await getRelayStatus(deviceId); // /api/relay/:deviceId
      const rel = (doc && doc.relays) || {};
      setRstate({
        R1: !!(rel.R1 && rel.R1.state),
        R2: !!(rel.R2 && rel.R2.state),
        R3: !!(rel.R3 && rel.R3.state),
      });
    } catch {}
  }, [deviceId]);

  /* ---------------- First load + polling ---------------- */

  useEffect(() => {
    if (!deviceId) return;
    setStatus("loading");

    Promise.all([
      refreshSensors(),
      refreshLatest(),
      refreshHistory(),
      refreshSummary(),
      refreshControl(),
      refreshRelays(),
    ])
      .catch(() => {})
      .finally(() => setStatus("ok"));

    // Polling ligero
    const iv = setInterval(() => {
      refreshLatest();
      refreshHistory();
      refreshRelays();   // <-- refleja AUTO/MANUAL en tiempo real
      refreshControl();  // por si cambian SP/H/modo desde otro cliente
    }, 4000);

    return () => clearInterval(iv);
  }, [
    deviceId,
    refreshSensors,
    refreshLatest,
    refreshHistory,
    refreshSummary,
    refreshControl,
    refreshRelays,
  ]);

  /* ---------------- Derivados (PV1 / PV2) ---------------- */

  const pv1 = useMemo(() => {
    const last = lastBySensors(rows, ["K1","K2","K3","K4"]);
    return avg(last);
  }, [rows]);

  const pv2 = useMemo(() => {
    const last = lastBySensors(rows, ["K5","K6"]);
    return avg(last);
  }, [rows]);

  /* ---------------- chartData con PV/SP ---------------- */

  const chartData = useMemo(() => {
    // rows viene DESC desde el backend => invertimos a ASC
    const asc = [...rows].reverse();

    // pivot por timestamp
    const merged = asc
      .map((r) => ({
        ts: new Date(r.createdAt).getTime(),
        [r.meta?.sensor || "default"]: num(r.celsius),
      }))
      .reduce((acc, cur) => {
        const last = acc[acc.length - 1];
        if (last && last.ts === cur.ts) Object.assign(last, cur);
        else acc.push({ ...cur });
        return acc;
      }, []);

    // añade PV y SP a cada punto (cuando existan)
    return merged.map((p) => {
      const p1 = avg([p.K1, p.K2, p.K3, p.K4]);
      const p2 = avg([p.K5, p.K6]);
      return {
        ...p,
        PV1: finiteOrNull(p1),
        PV2: finiteOrNull(p2),
        SP1: finiteOrNull(ctrl?.sp1),
        SP2: finiteOrNull(ctrl?.sp2),
      };
    });
  }, [rows, ctrl?.sp1, ctrl?.sp2]);

  /* ---------------- API pública del hook ---------------- */

  return {
    latest, status,
    sensors, active, setActive,
    chartData, pv1, pv2,
    ctrl, setCtrl, refreshControl,
    rstate, setRstate, refreshRelays,
  };
}

/* ============ helpers ============ */
const num = (v) => (typeof v === "number" ? v : NaN);
const finiteOrNull = (v) => (Number.isFinite(v) ? v : null);

function lastBySensors(rows, list) {
  // extrae último valor por sensor en 'rows' (que viene DESC)
  const last = [];
  for (const s of list) {
    const r = rows.find((x) => x.meta?.sensor === s);
    if (r && Number.isFinite(r.celsius)) last.push(Number(r.celsius));
  }
  return last;
}

function avg(arr) {
  const v = arr.filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
