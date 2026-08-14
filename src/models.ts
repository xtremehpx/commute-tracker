export type CommutePeriod = 'morning' | 'afternoon';
export type CommuteRating = 'good' | 'bad' | null;

export interface CommuteEntry {
  id: string;
  date: string;      // ISO date (yyyy-mm-dd)
  period: CommutePeriod;
  rating: CommuteRating;
  station: string;
  problemStation?: string;
  time: string;      // HH:mm
  note?: string;
}