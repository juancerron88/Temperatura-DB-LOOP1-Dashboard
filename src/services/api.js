// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE;
const KEY  = import.meta.env.VITE_API_KEY;

// Cabecera de auth opcional
const auth = () => (KEY ? { "x-api-key": KEY } : {});

// Pequeño helper de parseo/errores
const parse = async (r, method, path) => {
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`${method} ${path} -> ${r.status} ${txt}`);
  }
  return r.json();
};

/* ---------- THERMO ---------- */
export const getLatest = (deviceId) =>
  fetch(`${BASE}/api/thermo/latest?deviceId=${encodeURIComponent(deviceId)}`, {
    headers: auth(),
  }).then((r) => parse(r, "GET", "/api/thermo/latest"));

export const getHistory = (deviceId, limit = 500) =>
  fetch(
    `${BASE}/api/thermo/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/thermo/history"));

export const getSensors = (deviceId) =>
  fetch(`${BASE}/api/thermo/sensors?deviceId=${encodeURIComponent(deviceId)}`, {
    headers: auth(),
  }).then((r) => parse(r, "GET", "/api/thermo/sensors"));

export const getSummary = (deviceId, windowSec = 600) =>
  fetch(
    `${BASE}/api/thermo/summary?deviceId=${encodeURIComponent(deviceId)}&windowSec=${windowSec}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/thermo/summary"));

/* ---------- RELAY (MANUAL) ---------- */
export const getRelayState = (deviceId) =>
  fetch(`${BASE}/api/relay/pull?deviceId=${encodeURIComponent(deviceId)}`, {
    headers: auth(),
  }).then((r) => parse(r, "GET", "/api/relay/pull"));

export const setRelay = (deviceId, relayId, { state, holdSec }) =>
  fetch(`${BASE}/api/relay/set`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ deviceId, relay: relayId, state, holdSec }),
  }).then((r) => parse(r, "POST", "/api/relay/set"));

/* ---------- RELAY (ESTADO REAL: AUTO + MANUAL) ---------- */
// Aquí consultamos siempre el estado real de los relés
// Ejemplo de respuesta esperada del backend:
// { "deviceId":"heltec-v3-01", "relays": { "R1":{ "state":true }, "R2":{ "state":false }, "R3":{ "state":true } } }
export const getRelayStatus = (deviceId) =>
  fetch(`${BASE}/api/relay/${encodeURIComponent(deviceId)}`, {
    headers: auth(),
  }).then((r) => parse(r, "GET", "/api/relay/:deviceId"));

/* ---------- CONTROL (AUTO/MANUAL + SP/H + duty) ---------- */
export const getControl = (deviceId) =>
  fetch(`${BASE}/api/control?deviceId=${encodeURIComponent(deviceId)}`, {
    headers: auth(),
  }).then((r) => parse(r, "GET", "/api/control"));

export const setControl = (deviceId, payload) =>
  fetch(`${BASE}/api/control`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ deviceId, ...payload }),
  }).then((r) => parse(r, "PUT", "/api/control"));
