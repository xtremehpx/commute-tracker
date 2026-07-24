import React, { useEffect, useState } from 'react';
import type { CommuteEntry } from './models';
import { getAllEntries, saveEntry } from './storage';
import { generateMonthDates, dayRating, getISODate } from './calendarLogic';
import CalendarView from './components/CalendarView';
import DayDetailSheet from './components/DayDetailSheet';

const App: React.FC = () => {
  const [entries, setEntries] = useState<CommuteEntry[]>([]);
  const [currentMonthBase, setCurrentMonthBase] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    getAllEntries().then(setEntries);
  }, []);

  const monthDates = generateMonthDates(currentMonthBase);

  const handleSaveEntry = async (entry: CommuteEntry) => {
    await saveEntry(entry);
    setEntries(prev => {
      const others = prev.filter(e => e.id !== entry.id);
      return [...others, entry];
    });
  };

  return (
    <div className="app">
      <CalendarView
        monthDates={monthDates}
        selectedDate={selectedDate}
        onSelectDate={date => {
          setSelectedDate(date);
          setShowSheet(true);
        }}
        onPrevMonth={() => {
          const d = new Date(currentMonthBase);
          d.setMonth(d.getMonth() - 1);
          setCurrentMonthBase(d);
        }}
        onNextMonth={() => {
          const d = new Date(currentMonthBase);
          d.setMonth(d.getMonth() + 1);
          setCurrentMonthBase(d);
        }}
        getRating={date => dayRating(date, entries)}
      />

      {showSheet && (
        <DayDetailSheet
          date={selectedDate}
          entries={entries.filter(e => e.date === getISODate(selectedDate))}
          onSave={handleSaveEntry}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  );
};

export default App;
