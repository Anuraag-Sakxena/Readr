export type TimeWindow = {
  windowStart: Date;
  windowEnd: Date;
  label: string; // e.g. "2026-01-21 12:00–23:59"
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Local, deterministic 12-hour window:
 * - 00:00–11:59
 * - 12:00–23:59
 */
export function getCurrent12HourWindow(now = new Date()): TimeWindow {
  const start = new Date(now);
  const hour = start.getHours();

  if (hour < 12) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(12, 0, 0, 0);
  }

  const end = new Date(start);
  end.setHours(start.getHours() + 11, 59, 59, 999);

  const label = `${fmtDate(start)} ${fmtTime(start)}–${fmtTime(end)}`;
  return { windowStart: start, windowEnd: end, label };
}

/**
 * Back-compat helper (your controllers already import this).
 */
export function getCurrent12HourWindowLabel(now = new Date()): string {
  return getCurrent12HourWindow(now).label;
}
