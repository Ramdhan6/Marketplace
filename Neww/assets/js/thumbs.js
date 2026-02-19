import { escapeHtml } from "./ui.js";

const palettes = [
  ["#7c5cff", "#28d1ff"],
  ["#2ee59d", "#7c5cff"],
  ["#ffd34d", "#ff4d6d"],
  ["#28d1ff", "#2ee59d"],
  ["#ff4d6d", "#7c5cff"],
  ["#ffd34d", "#28d1ff"],
];

export function renderThumb(variantId, label) {
  const n = Number(String(variantId || "grad-1").split("-")[1] || 1);
  const [a, b] = palettes[(n - 1) % palettes.length];
  const safe = escapeHtml(label || "");

  return `
  <svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label="${safe}">
    <defs>
      <linearGradient id="g${n}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="${b}" stop-opacity="0.75"/>
      </linearGradient>
      <radialGradient id="r${n}" cx="30%" cy="25%" r="70%">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="8" y="8" width="94" height="94" rx="18" fill="url(#g${n})" />
    <rect x="8" y="8" width="94" height="94" rx="18" fill="url(#r${n})" />
    <path d="M22 70c16-18 25-8 33-18s20-18 33-8" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="4" stroke-linecap="round"/>
    <circle cx="76" cy="40" r="7" fill="rgba(255,255,255,.70)"/>
  </svg>
  `;
}

