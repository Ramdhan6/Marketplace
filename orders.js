import { Keys, readJson, writeJson } from "./storage.js";

function readOrders() {
  return readJson(Keys.orders, []);
}

function writeOrders(orders) {
  writeJson(Keys.orders, orders);
}

function newId() {
  return `o-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16).slice(-6)}`;
}

export function listOrders() {
  return readOrders().sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrder(id) {
  return readOrders().find((o) => o.id === id) || null;
}

export function createOrder(payload) {
  const orders = readOrders();
  const order = {
    id: newId(),
    createdAt: Date.now(),
    status: "Menunggu Pembayaran",
    ...payload,
  };
  orders.push(order);
  writeOrders(orders);
  return order;
}

export function updateOrderStatus(id, status) {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], status, updatedAt: Date.now() };
  writeOrders(orders);
  return orders[idx];
}

