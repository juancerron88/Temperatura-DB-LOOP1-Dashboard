// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE;
const KEY  = import.meta.env.VITE_API_KEY;

const headers = () => (KEY ? { "x-api-key": KEY } : {});

async function apiGet(path) {
  const r = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

async function apiJson(path, method, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers() },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}`);
  return r.json();
}

/* ---- THERMO ---- */
export const getLatest  = (deviceId) => apiGet(`/api/thermo/latest?deviceId=${encodeURIComponent(deviceId)}`);
export const getHistory = (deviceId, limit=500) => apiGet(`/api/thermo/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`);
export const getSensors = (deviceId) => apiGet(`/api/thermo/sensors?deviceId=${encodeURIComponent(deviceId)}`);

/* ---- RELAY ---- */
export const getRelayState = (deviceId) => apiGet(`/api/relay/${encodeURIComponent(deviceId)}`);
export const setRelay = (deviceId, relayId, { state, holdSec }) =>
  apiJson(`/api/relay/${encodeURIComponent(deviceId)}/${relayId}`, "PUT", { state, holdSec });
export const setRelays = (deviceId, relays) =>
  apiJson(`/api/relay/${encodeURIComponent(deviceId)}`, "PUT", { relays });

