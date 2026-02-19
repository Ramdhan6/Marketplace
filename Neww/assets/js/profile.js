import { Keys, readJson, writeJson } from "./storage.js";

const defaultProfile = { role: "buyer", sellerId: "s-aurora" };

export function getProfile() {
  return readJson(Keys.profile, defaultProfile);
}

export function setRole(role) {
  const p = getProfile();
  writeJson(Keys.profile, { ...p, role });
}

export function toggleRole() {
  const p = getProfile();
  const next = p.role === "seller" ? "buyer" : "seller";
  setRole(next);
  return next;
}

