// src/components/LatestCard.jsx
import dayjs from "dayjs";

export default function LatestCard({ latest, status }) {
  return (
    <div className="card">
      <h3>Última lectura</h3>
      {latest ? (
        <div className="latest">
          <div className="temp">{Number(latest.celsius).toFixed(2)} °C</div>
          <div className="meta">
            <div>Device: <b>{latest.deviceId}</b></div>
            <div>Hora: {dayjs(latest.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
          </div>
        </div>
      ) : (<p>Sin datos aún…</p>)}
      <div className={`status ${status}`}>estado: {status}</div>
    </div>
  );
}
