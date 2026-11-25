const MINUS = '−';
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,72,000 (Indian digit grouping). */
export function rupees(n: number): string {
  const sign = n < 0 ? MINUS : '';
  return `${sign}₹${inr.format(Math.abs(Math.round(n)))}`;
}

/** Signed full amount: +₹42,000 / −₹52,000. */
export function signedRupees(n: number): string {
  return n > 0 ? `+${rupees(n)}` : rupees(n);
}

/** ₹17.2L / ₹19.25L — up to two decimals, trailing zeros dropped. */
export function lakhs(n: number): string {
  const v = Math.round((n / 100000) * 100) / 100;
  return `₹${v.toString()}L`;
}

/** +5.0% / −2.1% */
export function pct(n: number, digits = 1): string {
  const s = Math.abs(n).toFixed(digits);
  if (Number(s) === 0) return `${s}%`;
  return `${n > 0 ? '+' : MINUS}${s}%`;
}

export function plainPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function num(n: number): string {
  return inr.format(Math.round(n));
}

const istDate = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const istLong = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** "2026-11-19" → "Thu, 19 Nov" in IST. Dates are calendar days in IST. */
export function dayLabel(iso: string): string {
  return istDate.format(new Date(`${iso}T00:00:00+05:30`)).replace(',', '');
}

export function longDate(iso: string): string {
  return istLong.format(new Date(`${iso}T00:00:00+05:30`));
}

export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
