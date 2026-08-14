import { describe, expect, it } from 'vitest';
import { summarizeProblemStations } from './stats';
import type { CommuteEntry } from './models';

describe('commute stats', () => {
  it('summarizes the most common bad-experience stations', () => {
    const entries: CommuteEntry[] = [
      { id: '1', date: '2026-08-03', period: 'morning', rating: 'bad', station: 'Delta Park/Vanport', time: '08:30', problemStation: 'Rose Quarter TC' },
      { id: '2', date: '2026-08-04', period: 'afternoon', rating: 'bad', station: 'Hillsboro Airport/Fairgrounds', time: '17:20', problemStation: 'Rose Quarter TC' },
      { id: '3', date: '2026-08-05', period: 'morning', rating: 'good', station: 'Delta Park/Vanport', time: '08:30' },
      { id: '4', date: '2026-08-06', period: 'afternoon', rating: 'bad', station: 'Hillsboro Airport/Fairgrounds', time: '17:15', problemStation: 'Beaverton Central' },
    ];

    expect(summarizeProblemStations(entries)).toEqual([
      { station: 'Rose Quarter TC', count: 2 },
      { station: 'Beaverton Central', count: 1 },
    ]);
  });
});
