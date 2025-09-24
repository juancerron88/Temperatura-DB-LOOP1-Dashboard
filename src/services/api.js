// src/services/api.js

// ====== Config y valores por defecto (modo seguro) ======
const BASE   = import.meta.env.VITE_API_BASE || "";       // puede venir vacío en producción
const KEY    = import.meta.env.VITE_API_KEY   || "";
const DEF_ID = import.meta.env.VITE_DEVICE_ID || "heltec-v3-01";

// Cabecera de auth opcional
const auth = () => (KEY ? { "x-api-key": KEY } : {});

// Fetch que no rompe la app si BASE no está definido o la red falla
async function safeFetch(url, init) {
  // Si no hay BASE configurado devolvemos una “respuesta vacía OK”
  if (!BASE) {
    return { ok: true, json: async () => ({}), text: async () => "" };
  }
  try {
    return await fetch(url, init);
  } catch (e) {
    // Evita crash del render: simulamos OK vacío
    console.warn("safeFetch error:", e);
    return { ok: true, json: async () => ({}), text: async () => String(e || "") };
  }
}

// Parseo suave: no lanza excepciones para no tumbar el UI
const parse = async (r, method, path) => {
  if (!r || typeof r.ok !== "boolean") return {};
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.warn(`${method} ${path} -> ${r.status} ${txt}`);
    return {};
  }
  try {
    return await r.json();
  } catch {
    return {};
  }
};

/* ---------- THERMO ---------- */
export const getLatest = (deviceId) =>
  safeFetch(
    `${BASE}/api/thermo/latest?deviceId=${encodeURIComponent(deviceId || DEF_ID)}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/thermo/latest"));

export const getHistory = (deviceId, limit = 500) =>
  safeFetch(
    `${BASE}/api/thermo/history?deviceId=${encodeURIComponent(deviceId || DEF_ID)}&limit=${limit}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/thermo/history"));

export const getSensors = (deviceId) =>
  safeFetch(
    `${BASE}/api/thermo/sensors?deviceId=${encodeURIComponent(deviceId || DEF_ID)}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/thermo/sensors"));

export const getSummary = (deviceId, windowSec = 600) =>
  safeFetch(
    `${BASE}/api/thermo/summary?deviceId=${encodeURIComponent(deviceId || DEF_ID)}&windowSec=${windowSec}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/thermo/summary"));

/* ---------- RELAY (MANUAL: comandos y pull) ---------- */
export const getRelayState = (deviceId) =>
  safeFetch(
    `${BASE}/api/relay/pull?deviceId=${encodeURIComponent(deviceId || DEF_ID)}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/relay/pull"));

export const setRelay = (deviceId, relayId, { state, holdSec } = {}) =>
  safeFetch(`${BASE}/api/relay/set`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ deviceId: deviceId || DEF_ID, relay: relayId, state, holdSec }),
  }).then((r) => parse(r, "POST", "/api/relay/set"));

/* ---------- RELAY (ESTADO REAL: AUTO + MANUAL) ---------- */
/* Esperado: { deviceId, relays: { R1:{state}, R2:{state}, R3:{state} } } */
export const getRelayStatus = (deviceId) =>
  safeFetch(
    `${BASE}/api/relay/${encodeURIComponent(deviceId || DEF_ID)}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/relay/:deviceId"));

/* ---------- CONTROL (AUTO/MANUAL + SP/H + duty) ---------- */
export const getControl = (deviceId) =>
  safeFetch(
    `${BASE}/api/control?deviceId=${encodeURIComponent(deviceId || DEF_ID)}`,
    { headers: auth() }
  ).then((r) => parse(r, "GET", "/api/control"));

export const setControl = (deviceId, payload) =>
  safeFetch(`${BASE}/api/control`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ deviceId: deviceId || DEF_ID, ...payload }),
  }).then((r) => parse(r, "PUT", "/api/control"));

  // src/services/api.js
export const getLatestBySensor = (deviceId, sensor) =>
  safeFetch(
    `${BASE}/api/thermo/latest?deviceId=${encodeURIComponent(deviceId || DEF_ID)}&sensor=${encodeURIComponent(sensor)}`,
    { headers: auth() }
  ).then(r => parse(r, "GET", "/api/thermo/latest?sensor"));


/* ---------- Utilidades opcionales ---------- */
export const apiBase   = BASE;   // por si quieres mostrarlo en el footer
export const apiHasKey = !!KEY;
export const defaultDeviceId = DEF_ID;
