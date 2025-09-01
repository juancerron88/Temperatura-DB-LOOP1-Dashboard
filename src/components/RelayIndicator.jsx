// src/components/RelayIndicator.jsx
import React from "react";
import "./relay-anim.css";

/**
 * type: "heater" | "fan" | "led"
 * on: boolean
 * pos: {left, top, width, height}  (CSS absolute)
 * label?: string  (opcional)
 */
export default function RelayIndicator({ type, on, pos = {}, label }) {
  if (type === "heater") {
    return (
      <div className={`heater ${on ? "on" : ""}`} style={pos}>
        <div className="heat-wave wave1" />
        <div className="heat-wave wave2" />
        <div className="heat-wave wave3" />
      </div>
    );
  }
  if (type === "fan") {
    return (
      <div className={`fan ${on ? "on" : ""}`} style={pos} aria-label={label || "fan"}>
        <div className="blade b1" />
        <div className="blade b2" />
        <div className="blade b3" />
        <div className="hub" />
      </div>
    );
  }
  // LED
  return (
    <div className={`led ${on ? "on" : "off"}`} title={label} style={pos} />
  );
}
