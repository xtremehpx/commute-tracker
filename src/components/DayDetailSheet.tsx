import React, { useState, useEffect, useRef } from 'react';
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
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);

  const createDefault = (period: CommutePeriod): CommuteEntry => ({
    id: `${iso}-${period}`,
    date: iso,
    period,
    rating: null,
    station: period === 'morning' ? 'Delta Park/Vanport' : 'Hillsboro Airport/Fairgrounds',
    problemStation: undefined,
    time: period === 'morning' ? '08:30' : '15:30',
    note: '',
  });

  const getOrCreate = (period: CommutePeriod): CommuteEntry => {
    return entries.find(e => e.period === period) || createDefault(period);
  };

  const [morning, setMorning] = useState<CommuteEntry>(getOrCreate('morning'));
  const [afternoon, setAfternoon] = useState<CommuteEntry>(getOrCreate('afternoon'));

  useEffect(() => {
    setMorning(getOrCreate('morning'));
    setAfternoon(getOrCreate('afternoon'));
  }, [date]);

  const handleSave = (entry: CommuteEntry) => {
    onSave(entry);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    startYRef.current = touch.clientY;
    startXRef.current = touch.clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null || startXRef.current === null) return;

    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - startYRef.current;
    const deltaX = touch.clientX - startXRef.current;

    if (deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX)) {
      onClose();
    }

    startYRef.current = null;
    startXRef.current = null;
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        onClick={event => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sheet-grabber" aria-hidden="true" />
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
    </div>
  );
};

export default DayDetailSheet;
