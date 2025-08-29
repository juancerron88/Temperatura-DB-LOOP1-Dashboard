// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE;
const KEY  = import.meta.env.VITE_API_KEY;

// headers comunes
function authHeaders() {
  return KEY ? { "x-api-key": KEY } : {};
}

// helpers
async function apiGet(path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { ...authHeaders() },
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`GET ${path} -> ${r.status} ${txt}`);
  }
  return r.json();
}

async function apiJson(path, method, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`${method} ${path} -> ${r.status} ${txt}`);
  }
  return r.json();
}

/* ---------- THERMO ---------- */
export const getLatest  = (deviceId) =>
  apiGet(`/api/thermo/latest?deviceId=${encodeURIComponent(deviceId)}`);

export const getHistory = (deviceId, limit = 500) =>
  apiGet(`/api/thermo/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`);

export const getSensors = (deviceId) =>
  apiGet(`/api/thermo/sensors?deviceId=${encodeURIComponent(deviceId)}`);

/* ---------- RELAY (coincide con tu backend) ---------- */
// Lo que usa la placa para leer estados
export const getRelayState = (deviceId) =>
  apiGet(`/api/relay/pull?deviceId=${encodeURIComponent(deviceId)}`);

// Cambiar un relé (modo manual desde UI)
export const setRelay = (deviceId, relayId, { state, holdSec }) =>
  apiJson(`/api/relay/set`, "POST", {
    deviceId,
    relay: relayId,   // "R1" | "R2" | "R3"
    state,            // true / false
    holdSec,          // opcional (segundos)
  });

// Si quieres “bulk”, no hay endpoint en tu backend: haz varios setRelay en paralelo
export async function setRelays(deviceId, relaysObj /* {R1:{state,holdSec}, ...} */) {
  const tasks = Object.entries(relaysObj).map(([relay, payload]) =>
    setRelay(deviceId, relay, payload)
  );
  // devuelve el último estado leído tras aplicar todos
  await Promise.all(tasks);
  return getRelayState(deviceId);
}
