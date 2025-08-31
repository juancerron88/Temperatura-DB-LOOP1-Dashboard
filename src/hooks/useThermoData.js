import { useEffect, useMemo, useState } from "react";
import { getHistory, getLatest, getSensors, getSummary, getControl, getRelayState } from "../services/api";

export default function useThermoData(deviceId, limit = 800) {
  const [latest, setLatest] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [active, setActive] = useState({});
  const [hist, setHist] = useState([]); // crudo
  const [summary, setSummary] = useState(null); // {t1_avg, t2_avg, k7, k8}
  const [control, setControl] = useState(null); // {mode, sp1,h1,l1_on_ms,l1_off_ms,sp2,h2,...}
  const [relay, setRelay] = useState(null);     // {relays:{R1:{state}, ...}}
  const status = latest ? "ok" : "cargando";

  // Sensores y últimas lecturas
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const [s, l, h] = await Promise.all([
          getSensors(deviceId),
          getLatest(deviceId),
          getHistory(deviceId, limit),
        ]);
        if (stop) return;
        setSensors(s);
        setLatest(l);
        setHist(h.reverse()); // ascendente
        // activar por defecto primeros 6
        setActive(prev => Object.keys(prev).length ? prev :
          s.slice(0, 6).reduce((o, k) => (o[k] = true, o), {}));
      } catch (e) { console.error(e); }
    })();
    return () => { stop = true; };
  }, [deviceId, limit]);

  // Summary, control y relés (poll liviano)
  useEffect(() => {
    let timer;
    let stop = false;
    const tick = async () => {
      try {
        const [sum, ctl, rel] = await Promise.all([
          getSummary(deviceId, 900),
          getControl(deviceId),
          getRelayState(deviceId),
        ]);
        if (stop) return;
        setSummary(sum);
        setControl(ctl);
        setRelay(rel);
      } catch (e) { console.error(e); }
      timer = setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [deviceId]);

  // Dataset para el chart + PV/SP
  const chartData = useMemo(() => {
    if (!hist.length) return [];
    // group por timestamp
    const byTs = new Map();
    for (const r of hist) {
      const ts = +new Date(r.createdAt);
      if (!byTs.has(ts)) byTs.set(ts, { ts });
      const s = r.meta?.sensor || "default";
      byTs.get(ts)[s] = r.celsius;
    }
    const rows = Array.from(byTs.keys()).sort((a,b)=>a-b).map(ts => {
      const row = byTs.get(ts);
      // PV1: K1..K4
      const arr1 = ["K1","K2","K3","K4"].map(k => row[k]).filter(v => Number.isFinite(v));
      const pv1  = arr1.length ? arr1.reduce((a,b)=>a+b,0)/arr1.length : null;
      // PV2: K5..K6
      const arr2 = ["K5","K6"].map(k => row[k]).filter(v => Number.isFinite(v));
      const pv2  = arr2.length ? arr2.reduce((a,b)=>a+b,0)/arr2.length : null;
      return {
        time: new Date(ts),
        ...row,
        PV1: pv1,
        PV2: pv2,
        SP1: control?.sp1 ?? null,
        SP2: control?.sp2 ?? null,
      };
    });
    return rows;
  }, [hist, control?.sp1, control?.sp2]);

  return {
    latest, status, sensors, active, setActive,
    chartData,
    summary, control, relay,
  };
}
