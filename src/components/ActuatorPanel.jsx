import { useEffect, useState } from "react";
import { getRelayState, setRelay } from "../services/api";

export default function ActuatorPanel({ deviceId, disabled=false }) {
  const [relays, setRelays] = useState({ R1:false, R2:false, R3:false });
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const data = await getRelayState(deviceId);
      setRelays({
        R1: !!data?.relays?.R1?.state,
        R2: !!data?.relays?.R2?.state,
        R3: !!data?.relays?.R3?.state,
      });
    } catch(e){ console.error(e); }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [deviceId]);

  async function send(relayId, state, holdSec) {
    try {
      setLoading(true);
      await setRelay(deviceId, relayId, { state, holdSec });
      await refresh();
    } catch(e){ console.error(e); alert("Error enviando comando"); }
    finally { setLoading(false); }
  }

  const Btn = ({ children, ...p }) => (
    <button {...p} className="btn" disabled={loading || disabled || p.disabled}>{children}</button>
  );

  return (
    <div className="card">
      <h3>Relés (R1–R3)</h3>
      {["R1","R2","R3"].map(r => (
        <div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <b style={{width:24}}>{r}</b>
          <span style={{width:40}}>{relays[r] ? "ON" : "OFF"}</span>
          <Btn onClick={()=>send(r, false)}>OFF</Btn>
          <Btn onClick={()=>send(r, true)}>ON</Btn>
          <Btn onClick={()=>send(r, true, 300)}>ON 5min</Btn>
        </div>
      ))}
    </div>
  );
}
