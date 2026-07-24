import type { CommuteEntry, CommuteRating } from './models';

export function getISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function generateMonthDates(base: Date): Date[] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const dates: Date[] = [];
  let d = new Date(first);
  while (d.getMonth() === month) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function dayRating(date: Date, entries: CommuteEntry[]): CommuteRating | null {
  const iso = getISODate(date);
  const dayEntries = entries.filter(e => e.date === iso);
  if (dayEntries.length === 0) return null;
  return dayEntries.some(e => e.rating === 'bad') ? 'bad' : 'good';
}