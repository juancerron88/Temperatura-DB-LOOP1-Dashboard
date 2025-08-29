// src/components/ActuatorPanel.jsx
import { useEffect, useState } from "react";
import { getRelayState, setRelay } from "../services/api";

export default function ActuatorPanel({ deviceId }) {
  const [relays, setRelays] = useState({ R1:false, R2:false, R3:false });
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const data = await getRelayState(deviceId);
      setRelays({
        R1: data.relays?.R1?.state ?? false,
        R2: data.relays?.R2?.state ?? false,
        R3: data.relays?.R3?.state ?? false,
      });
    } catch (e) { console.error(e); }
  }

  async function send(relayId, state, holdSec) {
    try {
      setLoading(true);
      await setRelay(deviceId, relayId, { state, holdSec });
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Error enviando comando");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [deviceId]);

  return (
    <div className="card">
      <h3>Relés (R1–R3)</h3>
      {["R1","R2","R3"].map(r => (
        <div key={r} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <b style={{width:28}}>{r}</b>
          <span style={{width:48, display:"inline-block"}}>{relays[r] ? "ON" : "OFF"}</span>
          <button disabled={loading} onClick={() => send(r, true)}>ON</button>
          <button disabled={loading} onClick={() => send(r, false)}>OFF</button>
          <button disabled={loading} onClick={() => send(r, true, 300)}>ON 5min</button>
        </div>
      ))}
    </div>
  );
}
