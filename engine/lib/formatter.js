// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Formatter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Uptime ──
export function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || !parts.length) parts.push(`${s}s`);

  return parts.join(" ");
}

// ── Greeting ──
export function getTimeGreeting() {
  const jam = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    hour12: false
  });
  const h = parseInt(jam);
  if (h >= 4 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 18) return "Selamat sore";
  return "Selamat malam";
}