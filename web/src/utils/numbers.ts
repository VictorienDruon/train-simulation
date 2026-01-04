export function formatDelay(delayMinutes: number) {
  const rounded = Math.round(delayMinutes);
  if (rounded === 0) return "0";

  const absRounded = Math.abs(rounded);
  if (absRounded >= 60) {
    const hours = Math.floor(absRounded / 60);
    const minutes = absRounded % 60;
    const sign = rounded > 0 ? "+" : "-";
    if (minutes === 0) {
      return `${sign}${hours}h`;
    }
    return `${sign}${hours}h${minutes}`;
  }

  return rounded > 0 ? `+${rounded}min` : `${rounded}min`;
}
