import { Keys, readJson, writeJson } from "./storage.js";
import { clamp } from "./format.js";

function readCart() {
  return readJson(Keys.cart, { items: [] });
}

function writeCart(cart) {
  writeJson(Keys.cart, cart);
}

export function getCart() {
  return readCart();
}

export function getCartCount() {
  return readCart().items.reduce((a, it) => a + (it.qty || 0), 0);
}

export function addToCart(productId, qty = 1, variant = null) {
  const cart = readCart();
  const key = `${productId}::${variant || ""}`;
  const idx = cart.items.findIndex((x) => x.key === key);
  if (idx >= 0) {
    cart.items[idx].qty = clamp((cart.items[idx].qty || 0) + qty, 1, 99);
  } else {
    cart.items.push({
      key,
      productId,
      variant,
      qty: clamp(qty, 1, 99),
      addedAt: Date.now(),
    });
  }
  writeCart(cart);
  return cart;
}

export function updateQty(key, qty) {
  const cart = readCart();
  const idx = cart.items.findIndex((x) => x.key === key);
  if (idx < 0) return cart;
  if (qty <= 0) cart.items.splice(idx, 1);
  else cart.items[idx].qty = clamp(qty, 1, 99);
  writeCart(cart);
  return cart;
}

export function removeItem(key) {
  return updateQty(key, 0);
}

export function clearCart() {
  const cart = { items: [] };
  writeCart(cart);
  return cart;
}

