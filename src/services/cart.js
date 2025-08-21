// src/services/cart.js
import { apiFetch, authHeaders } from "./api";

export async function fetchMyCart() {
  return apiFetch("/cart", { headers: authHeaders() }); // { ok, data }
}

export async function addCartItem(menuId, quantity = 1) {
  return apiFetch("/cart/items", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ menuId, quantity }),
  });
}

export async function changeCartQty(cartId, quantity) {
  return apiFetch(`/cart/items/${cartId}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(cartId) {
  return apiFetch(`/cart/items/${cartId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function clearCart() {
  return apiFetch("/cart", {
    method: "DELETE",
    headers: authHeaders(),
  });
}