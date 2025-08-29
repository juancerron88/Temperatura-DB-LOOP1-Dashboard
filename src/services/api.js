// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE;
const KEY  = import.meta.env.VITE_API_KEY;

const headers = () => (KEY ? { "x-api-key": KEY } : {});

export async function apiGet(path) {
  const r = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}

export async function getLatest(deviceId) {
  return apiGet(`/api/thermo/latest?deviceId=${encodeURIComponent(deviceId)}`);
}

export async function getHistory(deviceId, limit = 300) {
  return apiGet(`/api/thermo/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`);
}

// Futuro: actuadores
export async function sendActuator({ deviceId, target, action }) {
  const r = await fetch(`${BASE}/api/actuators`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers() },
    body: JSON.stringify({ deviceId, target, action }),
  });
  if (!r.ok) throw new Error(`POST /api/actuators -> ${r.status}`);
  return r.json();
}
