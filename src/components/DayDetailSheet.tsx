import React from 'react';
import type { CommuteEntry, CommutePeriod } from '../models';
import { getISODate } from '../calendarLogic';
import CommuteRow from './CommuteRow';

interface Props {
  date: Date;
  entries: CommuteEntry[];
  onSave: (entry: CommuteEntry) => void;
  onClose: () => void;
}

const DayDetailSheet: React.FC<Props> = ({
  date,
  entries,
  onSave,
  onClose,
}) => {
  const iso = getISODate(date);

  const getOrCreate = (period: CommutePeriod): CommuteEntry => {
    const existing = entries.find(e => e.period === period);
    if (existing) return existing;
    return {
      id: `${iso}-${period}`,
      date: iso,
      period,
      rating: 'good',
      station: period === 'morning' ? 'Salmon Creek' : 'Vancouver Station',
      time: period === 'morning' ? '08:30' : '15:30',
      note: '',
    };
  };

  const morning = getOrCreate('morning');
  const afternoon = getOrCreate('afternoon');

  const handleSave = (entry: CommuteEntry) => {
    onSave(entry);
  };

  return (
    <div className="sheet">
      <h2>{date.toDateString()}</h2>

      <CommuteRow
        title="Morning Train"
        entry={morning}
        onChange={handleSave}
      />

      <CommuteRow
        title="Afternoon Train"
        entry={afternoon}
        onChange={handleSave}
      />

      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default DayDetailSheet;