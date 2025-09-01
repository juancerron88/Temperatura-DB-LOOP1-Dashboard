// src/hooks/useThermoData.js
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getLatest,
  getHistory,
  getSensors,
  getSummary,
  getControl,
  getRelayState,
} from "../services/api";

/* Defaults robustos para que el UI no se caiga si la API devuelve {} */
const CTRL_DEFAULTS = {
  mode: "auto",
  sp1: 50,
  h1: 4,
  l1_on_ms: 5 * 60000,
  l1_off_ms: 3 * 60000,
  l1_alternate: false,
  sp2: 80,
  h2: 3,
};

export default function useThermoData(deviceId, limit = 800) {
  const [latest, setLatest] = useState(null);
  const [status, setStatus] = useState("idle");
  const [sensors, setSensors] = useState([]);
  const [active, setActive] = useState({});
  const [rows, setRows] = useState([]); // history crudo (siempre array)
  const [ctrl, setCtrl] = useState(CTRL_DEFAULTS);
  const [rstate, setRstate] = useState({ R1: false, R2: false, R3: false });

  // --- loaders con normalización defensiva ---
  const refreshSensors = useCallback(async () => {
    try {
      const s = await getSensors(deviceId);
      const list = Array.isArray(s) ? s : [];
      setSensors(list);
      const init = {};
      list.forEach((k) => (init[k] = true));
      setActive((a) => (Object.keys(a).length ? a : init));
    } catch {}
  }, [deviceId]);

  const refreshLatest = useCallback(async () => {
    try {
      const l = await getLatest(deviceId);
      setLatest(l && typeof l === "object" ? l : null);
    } catch {}
  }, [deviceId]);

  const refreshHistory = useCallback(async () => {
    try {
      const h = await getHistory(deviceId, limit);
      setRows(Array.isArray(h) ? h : []); // <-- siempre array
    } catch {
      setRows([]);
    }
  }, [deviceId, limit]);

  const refreshSummary = useCallback(async () => {
    try {
      await getSummary(deviceId, 600);
    } catch {}
  }, [deviceId]);

  const refreshControl = useCallback(async () => {
    try {
      const c = await getControl(deviceId);
      // merge con defaults
      setCtrl((prev) => ({ ...CTRL_DEFAULTS, ...(c || {}) }));
    } catch {
      setCtrl(CTRL_DEFAULTS);
    }
  }, [deviceId]);

  const refreshRelays = useCallback(async () => {
    try {
      const rs = await getRelayState(deviceId);
      const rel = rs && rs.relays ? rs.relays : {};
      setRstate({
        R1: !!(rel.R1 && rel.R1.state),
        R2: !!(rel.R2 && rel.R2.state),
        R3: !!(rel.R3 && rel.R3.state),
      });
    } catch {
      setRstate({ R1: false, R2: false, R3: false });
    }
  }, [deviceId]);

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

    const t = setInterval(() => {
      refreshLatest();
      refreshHistory();
      refreshRelays();
      refreshControl();
    }, 4000);
    return () => clearInterval(t);
  }, [
    deviceId,
    refreshSensors,
    refreshLatest,
    refreshHistory,
    refreshSummary,
    refreshControl,
    refreshRelays,
  ]);

  // --- PV1/PV2 a partir de history (rows SIEMPRE array) ---
  const pv1 = useMemo(() => {
    const last = lastBySensors(rows, ["K1", "K2", "K3", "K4"]);
    return avg(last);
  }, [rows]);

  const pv2 = useMemo(() => {
    const last = lastBySensors(rows, ["K5", "K6"]);
    return avg(last);
  }, [rows]);

  // --- chartData robusto: pivotea history -> ASC y añade PV/SP ---
  const chartData = useMemo(() => {
    const asc = Array.isArray(rows) ? [...rows].reverse() : [];
    const compact = asc
      .map((r) => ({
        ts: new Date(r?.createdAt || 0).getTime(),
        [(r?.meta?.sensor ?? "default")]: num(r?.celsius),
      }))
      .reduce((acc, cur) => {
        const last = acc[acc.length - 1];
        if (last && last.ts === cur.ts) Object.assign(last, cur);
        else acc.push({ ...cur });
        return acc;
      }, []);

    return compact.map((p) => {
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

  return {
    latest,
    status,
    sensors,
    active,
    setActive,
    chartData,
    pv1,
    pv2,
    ctrl,
    setCtrl,
    refreshControl,
    rstate,
    setRstate,
    refreshRelays,
  };
}

/* ============ helpers ============ */
const num = (v) => (typeof v === "number" ? v : NaN);
const finiteOrNull = (v) => (Number.isFinite(v) ? v : null);

function lastBySensors(rows, list) {
  const rws = Array.isArray(rows) ? rows : [];
  const last = [];
  for (const s of list) {
    const r = rws.find((x) => x?.meta?.sensor === s);
    if (r && Number.isFinite(r.celsius)) last.push(Number(r.celsius));
  }
  return last;
}
function avg(arr) {
  const v = (arr || []).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
