/**
 * Human-readable relative time from ISO date string.
 * No external deps.
 */
function timeLabel(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hozirgina";
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays === 1) return "1 kun oldin";
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

module.exports = { timeLabel };
