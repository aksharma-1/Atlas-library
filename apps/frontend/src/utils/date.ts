/**
 * Universal date formatter ensuring Indian Standard DD/MM/YYYY formatting
 * across the entire StudySpace OS platform.
 */
export function formatDate(dateStringOrObj?: string | Date | null): string {
  if (!dateStringOrObj) return '—';
  try {
    const d = typeof dateStringOrObj === 'string' ? new Date(dateStringOrObj) : dateStringOrObj;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB'); // en-GB format is strictly DD/MM/YYYY
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStringOrObj?: string | Date | null): string {
  if (!dateStringOrObj) return '—';
  try {
    const d = typeof dateStringOrObj === 'string' ? new Date(dateStringOrObj) : dateStringOrObj;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}
