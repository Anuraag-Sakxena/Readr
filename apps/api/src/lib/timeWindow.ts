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
 * Returns a label like: "2026-01-21 12:00–23:59"
 * Window rules:
 * - 00:00–11:59
 * - 12:00–23:59
 */
export function getCurrent12HourWindowLabel(now = new Date()): string {
  const start = new Date(now);
  const hour = start.getHours();

  if (hour < 12) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(12, 0, 0, 0);
  }

  const end = new Date(start);
  end.setHours(start.getHours() + 11, 59, 0, 0); // 11:59 or 23:59

  return `${fmtDate(start)} ${fmtTime(start)}–${fmtTime(end)}`;
}
