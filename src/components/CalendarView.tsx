import React from 'react';
import type { CommuteRating } from '../models';

interface Props {
  monthDates: Date[];
  secondaryMonthDates?: Date[];
  secondaryMonthLabel?: string;
  monthLabel: string;
  currentMonth: Date;
  yearLabel?: string;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear?: () => void;
  onNextYear?: () => void;
  getRating: (d: Date) => CommuteRating | null;
  weekdayLabels: string[];
  monthsInView?: Date[];
  showYearOverview?: boolean;
  onSelectMonth?: (month: Date) => void;
  onToggleYearOverview?: () => void;
}

const CalendarView: React.FC<Props> = ({
  monthDates,
  secondaryMonthDates,
  secondaryMonthLabel,
  monthLabel,
  currentMonth,
  yearLabel,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  getRating,
  weekdayLabels,
  monthsInView = [],
  showYearOverview = false,
  onSelectMonth,
  onToggleYearOverview,
}) => {
  const today = new Date();

  const renderMonth = (dates: Date[], label: string, isSecondary = false) => {
    const monthStart = new Date(dates[0]);
    const monthIndex = monthStart.getMonth();
    const monthYear = monthStart.getFullYear();

    return (
      <div key={`${label}-${monthYear}-${monthIndex}`} className={`month-panel ${isSecondary ? 'secondary' : ''}`}>
        <div className="month-panel-header">{label}</div>
        <div className="weekday-row" aria-label="Weekday labels">
          {weekdayLabels.map(labelItem => (
            <span key={`${label}-${labelItem}`} className="weekday-label">{labelItem}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {dates.map((date, index) => {
            const rating = getRating(date);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isCurrentMonth = date.getMonth() === monthIndex;

            let bg = '#e9e9ee';
            if (rating === 'good') bg = '#c8f7c5';
            if (rating === 'bad') bg = '#f7c5c5';
            if (isSelected) bg = '#007aff';

            return (
              <button
                key={`${date.toISOString()}-${index}`}
                type="button"
                className={`calendar-cell ${isSelected ? 'selected' : ''} ${isCurrentMonth ? '' : 'muted'}`}
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

  return (
    <div className="calendar">
      <header className="calendar-header">
        <button className="nav-button" type="button" onClick={onPrevMonth} aria-label="Previous month">&#8249;</button>
        <button className="month-label-button" type="button" onClick={onToggleYearOverview}>
          {monthLabel}
        </button>
        <button className="nav-button" type="button" onClick={onNextMonth} aria-label="Next month">&#8250;</button>
      </header>

      {showYearOverview && monthsInView.length > 0 && (
        <div className="year-overview-backdrop" onClick={onToggleYearOverview}>
          <div className="year-overview" onClick={event => event.stopPropagation()} aria-label="Year overview">
            <div className="year-overview-header">
              <button className="nav-button" type="button" onClick={onPrevYear} aria-label="Previous year">&#8249;</button>
              <span>{yearLabel}</span>
              <button className="nav-button" type="button" onClick={onNextYear} aria-label="Next year">&#8250;</button>
            </div>
            <div className="year-overview-grid">
              {monthsInView.map(month => {
                const monthName = month.toLocaleString('default', { month: 'short' });
                const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
                const gridStart = new Date(monthStart);
                gridStart.setDate(monthStart.getDate() - monthStart.getDay());

                const monthDatesForCard = Array.from({ length: 42 }, (_, index) => {
                  const date = new Date(gridStart);
                  date.setDate(gridStart.getDate() + index);
                  return date;
                });
                const isCurrentMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
                const isSelectedMonth = month.getFullYear() === currentMonth.getFullYear() && month.getMonth() === currentMonth.getMonth();

                return (
                  <button
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    type="button"
                    className={`year-month-card ${isSelectedMonth ? 'selected-month' : ''}`}
                    onClick={() => {
                      onSelectMonth?.(month);
                      onToggleYearOverview?.();
                    }}
                  >
                    <div className="year-month-header">
                      <span>{monthName}</span>
                    </div>
                    <div className="mini-weekdays">
                      {weekdayLabels.map(label => (
                        <span key={`${monthName}-${label}`}>{label}</span>
                      ))}
                    </div>
                    <div className="mini-grid">
                      {monthDatesForCard.map((date, index) => {
                        const isCurrentDay = date.toDateString() === today.toDateString();
                        const isCurrentMonthDay = date.getMonth() === month.getMonth();
                        const rating = getRating(date);
                        const statusStyle = rating === 'good'
                          ? { backgroundColor: '#c8f7c5' }
                          : rating === 'bad'
                            ? { backgroundColor: '#f7c5c5' }
                            : undefined;

                        return (
                          <span
                            key={`${monthName}-${date.toISOString()}-${index}`}
                            className={[
                              'mini-day',
                              isCurrentMonthDay ? '' : 'dimmed',
                              isCurrentDay ? 'today' : '',
                            ].filter(Boolean).join(' ')}
                            style={statusStyle}
                          >
                            {date.getDate()}
                          </span>
                        );
                      })}
                    </div>
                    {isCurrentMonth && <span className="today-pill">Today</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {secondaryMonthDates && secondaryMonthLabel ? (
        <div className="stacked-months">
          {renderMonth(monthDates, monthLabel)}
          {renderMonth(secondaryMonthDates, secondaryMonthLabel, true)}
        </div>
      ) : (
        renderMonth(monthDates, monthLabel)
      )}
    </div>
  );
};

export default CalendarView;