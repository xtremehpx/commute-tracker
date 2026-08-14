import type { CommuteEntry } from './models';

export interface ProblemStationSummary {
  station: string;
  count: number;
}

export function summarizeProblemStations(entries: CommuteEntry[]): ProblemStationSummary[] {
  const counts = new Map<string, number>();

  entries
    .filter(entry => entry.rating === 'bad' && entry.problemStation)
    .forEach(entry => {
      const station = entry.problemStation!;
      counts.set(station, (counts.get(station) ?? 0) + 1);
    });

  return [...counts.entries()]
    .map(([station, count]) => ({ station, count }))
    .sort((a, b) => b.count - a.count || a.station.localeCompare(b.station));
}
