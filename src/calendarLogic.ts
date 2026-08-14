import type { CommuteEntry, CommuteRating } from './models';

export const WEEKDAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

export interface CalendarDay {
  date: Date;
  inMonth: boolean;
}

export interface MonthGrid {
  monthStart: Date;
  weekdayLabels: string[];
  days: CalendarDay[];
}

export function getISODate(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
}

export function generateMonthDates(base: Date): Date[] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const dayOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - dayOffset);

  const dates: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const next = new Date(gridStart);
    next.setDate(gridStart.getDate() + i);
    dates.push(next);
  }

  return dates;
}

export function generateMonthGrid(base: Date): MonthGrid {
  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const days = generateMonthDates(monthStart).map(date => ({
    date: new Date(date),
    inMonth: date.getMonth() === monthStart.getMonth(),
  }));

  return {
    monthStart,
    weekdayLabels: WEEKDAY_LABELS,
    days,
  };
}

export function generateYearMonthStarts(year: number): Date[] {
  return Array.from({ length: 12 }, (_, monthIndex) => new Date(year, monthIndex, 1));
}

export function dayRating(date: Date, entries: CommuteEntry[]): CommuteRating | null {
  const iso = getISODate(date);
  const dayEntries = entries.filter(e => e.date === iso);
  if (dayEntries.length === 0) return null;

  if (dayEntries.some(e => e.rating === 'bad')) return 'bad';
  if (dayEntries.some(e => e.rating === 'good')) return 'good';

  return null;
}