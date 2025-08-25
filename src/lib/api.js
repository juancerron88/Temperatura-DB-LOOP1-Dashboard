import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const key = import.meta.env.VITE_API_KEY;
  if (key) config.headers["x-api-key"] = key; // opcional
  return config;
});

export async function getLatest(deviceId) {
  const res = await api.get("/api/thermo/latest", { params: { deviceId } });
  return res.data;
}

export async function getHistory(deviceId, limit = 200) {
  const res = await api.get("/api/thermo/history", { params: { deviceId, limit } });
  return res.data;
}
