export function formatRupiah(amount) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
  }
}

export function formatDateTime(ts) {
  const d = new Date(ts);
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

