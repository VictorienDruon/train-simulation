export function formatTime(time: number): string {
  const baseDate = new Date(2025, 10, 17, 0, 0, 0, 0);
  const date = new Date(baseDate.getTime() + time / 1_000_000);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
