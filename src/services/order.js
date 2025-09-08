// src/services/order.js
import { apiFetch, authHeaders } from "./api";

export async function createOrder(items, extras = {}) {
  return apiFetch("/orders", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      items,     // [{ menuId, quantity }]
      ...extras, // { merchantUid, discountCoupon, discountPoints, shippingFee, userCouponId }
    }),
  });
}