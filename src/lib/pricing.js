// Fares in whole Egyptian pounds.
export const SERVICE_FEE = 15;
export const PROMO_CODES = { RIHLA10: 0.1 };

export function promoRate(code) {
  return PROMO_CODES[code?.trim().toUpperCase()] ?? 0;
}

export function priceBreakdown(fare, seats, promo = "") {
  const subtotal = fare * seats;
  const fee = SERVICE_FEE * seats;
  const discount = Math.round(subtotal * promoRate(promo));
  return { subtotal, fee, discount, total: subtotal + fee - discount };
}

// Keeps a seat selection within the number of passengers. Picking a new seat when
// the limit is reached does nothing; picking a selected seat releases it.
export function toggleSeat(selected, label, limit, taken = new Set()) {
  if (taken.has(label)) return selected;
  if (selected.includes(label)) return selected.filter((s) => s !== label);
  if (selected.length >= limit) return selected;
  return [...selected, label];
}
