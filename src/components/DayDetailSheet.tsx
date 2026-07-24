import React, { useState, useEffect } from 'react';
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

  const createDefault = (period: CommutePeriod): CommuteEntry => ({
    id: `${iso}-${period}`,
    date: iso,
    period,
    rating: null,
    station: period === 'morning' ? 'Salmon Creek' : 'Vancouver Station',
    time: period === 'morning' ? '08:30' : '15:30',
    note: '',
  });

  const getOrCreate = (period: CommutePeriod): CommuteEntry => {
    return entries.find(e => e.period === period) || createDefault(period);
  };

  const [morning, setMorning] = useState<CommuteEntry>(getOrCreate('morning'));
  const [afternoon, setAfternoon] = useState<CommuteEntry>(getOrCreate('afternoon'));

  // FIX: Reset state when date changes
  useEffect(() => {
    setMorning(getOrCreate('morning'));
    setAfternoon(getOrCreate('afternoon'));
  }, [date]);

  const handleSave = (entry: CommuteEntry) => {
    onSave(entry);
  };

  return (
    <div className="sheet">
      <h2>{date.toDateString()}</h2>

      <CommuteRow
        title="Morning Train"
        entry={morning}
        onChange={updated => {
          setMorning(updated);
          handleSave(updated);
        }}
      />

      <CommuteRow
        title="Afternoon Train"
        entry={afternoon}
        onChange={updated => {
          setAfternoon(updated);
          handleSave(updated);
        }}
      />

      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default DayDetailSheet;
