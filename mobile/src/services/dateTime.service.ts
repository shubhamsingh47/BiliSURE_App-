/**
 * Format a date and time cleanly as: "18 Nov 2026, 04:35 PM"
 */
export const formatCardDateTime = (val?: string | Date | null): string => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} ${month} ${year}, ${timeStr}`;
};
