export const CURRENCY = "₹";

export const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Other"];

// Chart colours (checked for colour-blind safety), used in this fixed order.
export const CHART_COLORS = ["#b8506f", "#2c6db0", "#b97a1f", "#2f8a5b", "#8a3c9e", "#cf5b3a"];

export function money(value) {
  return `${CURRENCY}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// Sum expense amounts per category, largest first.
export function totalsByCategory(expenses) {
  const totals = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
  }
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

// The backend stores UTC times; SQLite drops the timezone, so add it back.
export function parseDate(dateString) {
  const hasZone = /Z|[+-]\d\d:\d\d$/.test(dateString);
  return new Date(hasZone ? dateString : dateString + "Z");
}

export function isThisMonth(dateString) {
  const d = parseDate(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
