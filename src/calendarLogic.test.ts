import { describe, expect, it } from 'vitest';
import { generateMonthGrid, getISODate } from './calendarLogic';

describe('calendar logic', () => {
  it('starts the week on Sunday and keeps weekday labels aligned', () => {
    const month = generateMonthGrid(new Date(2026, 0, 1));
    expect(month.weekdayLabels).toEqual(['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']);
    expect(month.days[0].date.getDate()).toBe(28);
    expect(month.days[0].date.getMonth()).toBe(11);
    expect(month.days[6].date.getDate()).toBe(3);
  });

  it('builds a full six-week month grid for consistent alignment', () => {
    const month = generateMonthGrid(new Date(2026, 6, 1));
    expect(month.days.length).toBe(42);
    expect(month.days.some(day => day.date.getMonth() === 6 && day.date.getDate() === 1)).toBe(true);
  });

  it('uses a stable ISO date key', () => {
    expect(getISODate(new Date('2026-08-14T12:00:00Z'))).toBe('2026-08-14');
  });
});
