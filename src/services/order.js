// src/services/order.js
import { authHeaders } from "./api";

export async function createOrder(items) {
  const r = await fetch("/orders", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ items }), // [{ menuId, quantity }]
  });
  const j = await r.json().catch(() => null);
  return { ok: r.ok, data: j, status: r.status };
}