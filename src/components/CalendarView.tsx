import React from 'react';
import type { CommuteRating } from '../models';

interface Props {
  monthDates: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  getRating: (d: Date) => CommuteRating | null;
}

const CalendarView: React.FC<Props> = ({
  monthDates,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  getRating,
}) => {
  const monthLabel = monthDates[0].toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="calendar">
      <header className="calendar-header">
        <button onClick={onPrevMonth}>{'<'}</button>
        <span>{monthLabel}</span>
        <button onClick={onNextMonth}>{'>'}</button>
      </header>

      <div className="calendar-grid">
        {monthDates.map(date => {
          const rating = getRating(date);
          const isSelected =
            date.toDateString() === selectedDate.toDateString();

          let bg = '#e0e0e0';
          if (rating === 'good') bg = '#c8f7c5';
          if (rating === 'bad') bg = '#f7c5c5';
          if (isSelected) bg = '#007aff';

          return (
            <button
              className={`calendar-cell ${isSelected ? 'selected' : ''}`}
              style={{ backgroundColor: bg }}
              onClick={() => onSelectDate(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;