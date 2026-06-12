export function parseDate(value) {
  if (!value) return null;
  const s = typeof value === "string" ? value : String(value);
  const d = new Date(s.length <= 10 ? `${s}T12:00:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(value, opts) {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", opts || { month: "short", day: "numeric" });
}

export function fmtDateFull(value) {
  return fmtDate(value, { weekday: "short", month: "short", day: "numeric" });
}

export function fmtTime(value) {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function daysUntil(value) {
  const d = parseDate(value);
  if (!d) return null;
  const now = new Date();
  return Math.round(
    (new Date(d.toDateString()) - new Date(now.toDateString())) / 86400000
  );
}

export function relDay(value) {
  const n = daysUntil(value);
  if (n === null) return "—";
  if (n < 0) return `${-n}d overdue`;
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n < 14) return `in ${n}d`;
  return fmtDate(value);
}

export function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* Convert a date value to a yyyy-mm-dd string for <input type="date"> */
export function toInputDate(value) {
  if (!value) return "";
  const d = parseDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* yyyy-mm-dd key for a Date object (local) */
export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function todayInputDate() {
  return ymd(new Date());
}
