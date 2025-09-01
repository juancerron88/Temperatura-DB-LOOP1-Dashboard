// src/hooks/useThermoData.js
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getLatest, getHistory, getSensors, getSummary,
  getControl, getRelayState, getRelayStatus
} from "../services/api";

export default function useThermoData(deviceId, limit = 800) {
  const [latest, setLatest]   = useState(null);
  const [status, setStatus]   = useState("idle");
  const [sensors, setSensors] = useState([]);
  const [active, setActive]   = useState({});
  const [rows, setRows]       = useState([]); // history crudo (DESC)
  const [ctrl, setCtrl]       = useState({
    mode: "auto",
    sp1: 50, h1: 4, l1_on_ms: 5*60000, l1_off_ms: 3*60000, l1_alternate: false,
    sp2: 80, h2: 3
  });
  const [rstate, setRstate]   = useState({ R1:false, R2:false, R3:false });

  // ====== loaders ======
  const refreshSensors = useCallback(async () => {
    try {
      const s = await getSensors(deviceId);
      setSensors(s);
      // activa todo por defecto la primera vez
      const init = {}; s.forEach(k => init[k] = true);
      setActive(a => (Object.keys(a).length ? a : {
        ...init, PV1:true, PV2:true, SP1:true, SP2:true
      }));
    } catch {}
  }, [deviceId]);

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

  // lee estado real (válido para AUTO y MANUAL)
  const refreshRelays = useCallback(async () => {
    try {
      // si tienes /api/relay/:deviceId usa getRelayStatus; si no, conserva getRelayState
      const doc = await getRelayStatus(deviceId).catch(() => null);
      const source = doc?.relays
        ? doc
        : await getRelayState(deviceId).catch(() => null);

      const rel = source && source.relays ? source.relays : {};
      setRstate({
        R1: !!(rel.R1 && rel.R1.state),
        R2: !!(rel.R2 && rel.R2.state),
        R3: !!(rel.R3 && rel.R3.state)
      });
    } catch {}
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
      refreshRelays()
    ]).finally(() => setStatus("ok"));

    const t = setInterval(() => {
      refreshLatest();
      refreshHistory();
      refreshControl();
      refreshRelays();
    }, 4000);
    return () => clearInterval(t);
  }, [deviceId, refreshSensors, refreshLatest, refreshHistory, refreshSummary, refreshControl, refreshRelays]);

  // ====== valores actuales por sensor (para badges) ======
  const curr = useMemo(() => {
    // rows viene DESC; para cada sensor toma la PRIMERA aparición
    const map = {};
    for (const r of rows) {
      const s = r?.meta?.sensor;
      if (!s) continue;
      if (map[s] == null && Number.isFinite(r.celsius)) {
        map[s] = Number(r.celsius);
      }
    }
    // PV1/PV2 del último instante disponible
    const lastAsc = [...rows].reverse();
    const lastTs = lastAsc[lastAsc.length-1]?.createdAt;
    if (lastTs) {
      // recolecta valores en ese ts
      const bucket = lastAsc.filter(x => x.createdAt === lastTs);
      const v = (k) => {
        const item = bucket.find(b => b.meta?.sensor === k);
        return Number.isFinite(item?.celsius) ? Number(item.celsius) : null;
      };
      const p1 = avg([v("K1"), v("K2"), v("K3"), v("K4")]);
      const p2 = avg([v("K5"), v("K6")]);
      if (Number.isFinite(p1)) map.PV1 = p1;
      if (Number.isFinite(p2)) map.PV2 = p2;
    }
    return map; // {K1:xx, ..., PV1:xx, PV2:xx}
  }, [rows]);

  // ====== datos para gráficas (ASC) con PV/SP ======
  const chartData = useMemo(() => {
    const asc = [...rows].reverse();
    return asc.map(r => ({
      ts: new Date(r.createdAt).getTime(),
      [r.meta?.sensor || "default"]: num(r.celsius),
    })).reduce((acc, cur) => {
      const last = acc[acc.length-1];
      if (last && last.ts === cur.ts) Object.assign(last, cur);
      else acc.push({ ...cur });
      return acc;
    }, []).map(p => {
      const p1 = avg([p.K1, p.K2, p.K3, p.K4]);
      const p2 = avg([p.K5, p.K6]);
      return {
        ...p,
        PV1: Number.isFinite(p1) ? p1 : null,
        PV2: Number.isFinite(p2) ? p2 : null,
        SP1: Number.isFinite(ctrl?.sp1) ? ctrl.sp1 : null,
        SP2: Number.isFinite(ctrl?.sp2) ? ctrl.sp2 : null,
      };
    });
  }, [rows, ctrl?.sp1, ctrl?.sp2]);

  return {
    latest, status, sensors,
    active, setActive,
    chartData, curr,
    ctrl, setCtrl, refreshControl,
    rstate, setRstate, refreshRelays,
  };
}

/* ===== helpers ===== */
const num = (v) => (typeof v === "number" ? v : NaN);
function avg(arr){
  const v = arr.filter(x => Number.isFinite(x));
  if (!v.length) return NaN;
  return v.reduce((a,b)=>a+b,0)/v.length;
}
