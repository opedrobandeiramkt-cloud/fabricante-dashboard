export type Period = "7d" | "30d" | "90d" | "12m";

export function getPeriodRange(period: Period): { start: Date; end: Date } {
  const end   = new Date();
  const start = new Date();

  switch (period) {
    case "7d":  start.setDate(start.getDate() - 7);    break;
    case "30d": start.setDate(start.getDate() - 30);   break;
    case "90d": start.setDate(start.getDate() - 90);   break;
    case "12m": start.setFullYear(start.getFullYear() - 1); break;
  }

  return { start, end };
}

export function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
  const current = getPeriodRange(period);
  const durationMs = current.end.getTime() - current.start.getTime();
  return {
    start: new Date(current.start.getTime() - durationMs),
    end:   new Date(current.start.getTime()),
  };
}
