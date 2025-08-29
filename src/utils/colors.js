// src/utils/colors.js
export const SERIES_COLORS = {
  K1: "#1f77b4",   // azul
  K2: "#ff7f0e",   // naranja
  K3: "#2ca02c",   // verde
  K4: "#d62728",   // rojo
  default: "#9467bd"
};

const FALLBACK = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"];
export const getColor = (name, idx) => SERIES_COLORS[name] || FALLBACK[idx % FALLBACK.length];
