export const Keys = {
  products: "mp_products_v1",
  cart: "mp_cart_v1",
  orders: "mp_orders_v1",
  profile: "mp_profile_v1",
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureOnce(key, factory) {
  const existing = readJson(key, null);
  if (existing !== null) return existing;
  const created = factory();
  writeJson(key, created);
  return created;
}

