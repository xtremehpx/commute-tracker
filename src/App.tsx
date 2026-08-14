import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CommuteEntry } from './models';
import { exportEntries, getAllEntries, importEntries, replaceAllEntries, saveEntry } from './storage';
import { dayRating, generateMonthGrid, generateYearMonthStarts, getISODate, WEEKDAY_LABELS } from './calendarLogic';
import CalendarView from './components/CalendarView';
import DayDetailSheet from './components/DayDetailSheet';
import { summarizeProblemStations } from './stats';

type TabKey = 'calendar' | 'stats' | 'settings';

const App: React.FC = () => {
  const [entries, setEntries] = useState<CommuteEntry[]>([]);
  const [currentMonthBase, setCurrentMonthBase] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSheet, setShowSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [showYearOverview, setShowYearOverview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getAllEntries().then(setEntries);
  }, []);

  const shouldStackMonths = typeof window !== 'undefined' && window.innerHeight >= 760;
  const primaryMonth = currentMonthBase;
  const secondaryMonth = new Date(primaryMonth.getFullYear(), primaryMonth.getMonth() + 1, 1);

  const monthGrid = generateMonthGrid(primaryMonth);
  const monthDates = monthGrid.days.map(day => day.date);
  const secondaryMonthGrid = generateMonthGrid(secondaryMonth);
  const secondaryMonthDates = secondaryMonthGrid.days.map(day => day.date);
  const yearMonths = generateYearMonthStarts(currentMonthBase.getFullYear());

  const stats = useMemo(() => {
    const byDate = new Map<string, CommuteEntry[]>();

    entries.forEach(entry => {
      const list = byDate.get(entry.date) ?? [];
      list.push(entry);
      byDate.set(entry.date, list);
    });

    const trackedDays = byDate.size;
    const goodDays = [...byDate.values()].filter(dayEntries => dayEntries.some(entry => entry.rating === 'good')).length;
    const badDays = [...byDate.values()].filter(dayEntries => dayEntries.some(entry => entry.rating === 'bad')).length;
    const goodRate = goodDays + badDays > 0 ? Math.round((goodDays / (goodDays + badDays)) * 100) : 0;

    const stationCounts = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.station] = (acc[entry.station] ?? 0) + 1;
      return acc;
    }, {});
    const topStation = Object.entries(stationCounts).sort((a, b) => b[1] - a[1])[0];

    const periodCounts = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.period] = (acc[entry.period] ?? 0) + 1;
      return acc;
    }, {});
    const topPeriod = Object.entries(periodCounts).sort((a, b) => b[1] - a[1])[0];

    const today = new Date();
    let currentStreak = 0;
    const streakCursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (byDate.has(getISODate(streakCursor))) {
      currentStreak += 1;
      streakCursor.setDate(streakCursor.getDate() - 1);
    }

    const sortedDates = [...new Set(entries.map(entry => entry.date))].sort();
    let longestStreak = 0;
    let runningStreak = 0;
    let previousDate: Date | null = null;

    sortedDates.forEach(isoDate => {
      const currentDate = new Date(`${isoDate}T00:00:00`);

      if (!previousDate) {
        runningStreak = 1;
        longestStreak = 1;
        previousDate = currentDate;
        return;
      }

      const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);
      runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, runningStreak);
      previousDate = currentDate;
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthDays = monthEnd.getDate();
    const monthTrackedDays = [...byDate.keys()].filter(date => {
      const dateValue = new Date(`${date}T00:00:00`);
      return dateValue >= monthStart && dateValue <= monthEnd;
    }).length;

    const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekdayMap = new Map<string, { day: string; total: number; good: number; bad: number; neutral: number }>();

    weekdayOrder.forEach(day => {
      weekdayMap.set(day, { day, total: 0, good: 0, bad: 0, neutral: 0 });
    });

    entries.forEach(entry => {
      const dateValue = new Date(`${entry.date}T00:00:00`);
      const dayLabel = dateValue.toLocaleDateString('en-US', { weekday: 'short' });
      const summary = weekdayMap.get(dayLabel) ?? { day: dayLabel, total: 0, good: 0, bad: 0, neutral: 0 };
      summary.total += 1;

      if (entry.rating === 'good') summary.good += 1;
      else if (entry.rating === 'bad') summary.bad += 1;
      else summary.neutral += 1;

      weekdayMap.set(dayLabel, summary);
    });

    const weekdayBreakdown = weekdayOrder
      .map(day => weekdayMap.get(day)!)
      .filter(day => day.total > 0)
      .map(day => ({
        ...day,
        badRate: day.total > 0 ? Math.round((day.bad / day.total) * 100) : 0,
      }))
      .sort((a, b) => b.badRate - a.badRate || b.bad - a.bad);

    const dateRisk = [...new Set(entries.map(entry => entry.date))]
      .map(date => {
        const dateEntries = byDate.get(date) ?? [];
        const bad = dateEntries.filter(entry => entry.rating === 'bad').length;
        const good = dateEntries.filter(entry => entry.rating === 'good').length;
        const total = dateEntries.length;
        return {
          date,
          label: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }),
          bad,
          good,
          total,
          badRate: total > 0 ? Math.round((bad / total) * 100) : 0,
        };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.badRate - a.badRate || b.bad - a.bad || b.total - a.total)
      .slice(0, 5);

    const monthRisk = [...new Map(
      [...new Set(entries.map(entry => entry.date.slice(0, 7)))].map(monthKey => {
        const monthEntries = entries.filter(entry => entry.date.startsWith(monthKey));
        const bad = monthEntries.filter(entry => entry.rating === 'bad').length;
        const total = monthEntries.length;
        const label = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return [monthKey, {
          monthKey,
          label,
          bad,
          total,
          badRate: total > 0 ? Math.round((bad / total) * 100) : 0,
        }];
      })
    ).values()].sort((a, b) => b.badRate - a.badRate || b.bad - a.bad || b.total - a.total).slice(0, 4);

    const noteHighlights = entries
      .filter(entry => entry.note && entry.note.trim().length > 0)
      .map(entry => ({
        date: entry.date,
        text: entry.note!.trim(),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const badStations = summarizeProblemStations(entries);
    const maxBadStationCount = Math.max(...badStations.map(item => item.count), 1);

    return {
      totalEntries: entries.length,
      trackedDays,
      goodRate,
      streak: currentStreak,
      longestStreak,
      monthTrackedDays,
      monthProgress: monthDays > 0 ? Math.round((monthTrackedDays / monthDays) * 100) : 0,
      topStation: topStation ? topStation[0] : 'No station yet',
      topStationCount: topStation ? topStation[1] : 0,
      topPeriod: topPeriod ? topPeriod[0] : 'morning',
      topPeriodCount: topPeriod ? topPeriod[1] : 0,
      weekdayBreakdown,
      dateRisk,
      monthRisk,
      noteHighlights,
      badStations,
      maxBadStationCount,
    };
  }, [entries]);

  const handleSaveEntry = async (entry: CommuteEntry) => {
    await saveEntry(entry);

    setEntries(prev => {
      const others = prev.filter(e => e.id !== entry.id);
      return [...others, entry];
    });
  };

  const handleExport = async () => {
    const content = exportEntries(entries);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `commute-tracker-${currentMonthBase.getFullYear()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = importEntries(text);
      await replaceAllEntries(imported);
      setEntries(imported);
      alert('Data imported successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="app">
      {activeTab === 'calendar' && (
        <>
          <CalendarView
            monthDates={monthDates}
            secondaryMonthDates={shouldStackMonths ? secondaryMonthDates : undefined}
            secondaryMonthLabel={shouldStackMonths ? secondaryMonth.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            }) : undefined}
            monthLabel={currentMonthBase.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
            currentMonth={currentMonthBase}
            yearLabel={String(currentMonthBase.getFullYear())}
            selectedDate={selectedDate}
            weekdayLabels={WEEKDAY_LABELS}
            monthsInView={yearMonths}
            showYearOverview={showYearOverview}
            onToggleYearOverview={() => setShowYearOverview(value => !value)}
            onPrevYear={() => {
              const d = new Date(currentMonthBase);
              d.setFullYear(d.getFullYear() - 1);
              setCurrentMonthBase(d);
            }}
            onNextYear={() => {
              const d = new Date(currentMonthBase);
              d.setFullYear(d.getFullYear() + 1);
              setCurrentMonthBase(d);
            }}
            onSelectMonth={month => {
              setCurrentMonthBase(new Date(month.getFullYear(), month.getMonth(), 1));
              setShowYearOverview(false);
            }}
            onSelectDate={date => {
              setSelectedDate(date);
              setShowSheet(true);
            }}
            onPrevMonth={() => {
              const d = new Date(currentMonthBase);
              d.setMonth(d.getMonth() - 1);
              setCurrentMonthBase(d);
              setShowYearOverview(false);
            }}
            onNextMonth={() => {
              const d = new Date(currentMonthBase);
              d.setMonth(d.getMonth() + 1);
              setCurrentMonthBase(d);
              setShowYearOverview(false);
            }}
            getRating={date => dayRating(date, entries)}
          />
        </>
      )}

      {activeTab === 'stats' && (
        <div className="stats-page">
          <div className="stats-header">
            <h1>Stats</h1>
          </div>

          <div className="stats-grid">
            <div className="stat-card accent">
              <span className="stat-label">Tracked days</span>
              <strong>{stats.trackedDays}</strong>
              <small>{stats.monthProgress}% this month</small>
            </div>

            <div className="stat-card">
              <span className="stat-label">Good vs bad</span>
              <strong>{stats.goodRate}%</strong>
              <small>{stats.totalEntries} trips</small>
            </div>
          </div>

          <div className="stats-panel">
            <h2>Weekday signal</h2>
            <div className="weekday-list">
              {stats.weekdayBreakdown.map(day => (
                <div key={day.day} className="weekday-row-card">
                  <div className="weekday-row-top">
                    <span>{day.day}</span>
                    <strong>{day.good} good / {day.bad} bad</strong>
                  </div>
                  <div className="mini-count-row">
                    <span className="mini-pill good">Good {day.good}</span>
                    <span className="mini-pill bad">Bad {day.bad}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-panel">
            <h2>Problem stations</h2>
            {stats.badStations.length === 0 ? (
              <p className="stats-empty">No bad-experience stations yet.</p>
            ) : (
              <div className="bar-chart-group compact">
                {stats.badStations.slice(0, 5).map(item => (
                  <div key={item.station} className="bar-row">
                    <span>{item.station}</span>
                    <div className="bar-track">
                      <div className="bar-fill bad" style={{ width: `${(item.count / stats.maxBadStationCount) * 100}%` }} />
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stats-panel">
            <h2>Hotspots</h2>
            <div className="hotspot-grid">
              {stats.dateRisk.slice(0, 3).map(item => (
                <div key={item.date} className="hotspot-chip">
                  <div className="hotspot-label">{item.label}</div>
                  <div className="hotspot-value">{item.bad} bad / {item.good} good</div>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-panel highlight-panel">
            <h2>Notes</h2>
            {stats.noteHighlights.length === 0 ? (
              <p className="stats-empty">No notes yet.</p>
            ) : (
              <div className="note-list compact">
                {stats.noteHighlights.slice(0, 3).map(item => (
                  <div className="note-item" key={`${item.date}-${item.text}`}>
                    <span className="note-date">{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="note-text">{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-page">
          <div className="settings-header">
            <h1>Settings</h1>
          </div>

          <div className="settings-list">
            <button type="button" className="settings-item" onClick={handleExport}>
              <span>Export data</span>
              <span className="settings-arrow">›</span>
            </button>
            <button type="button" className="settings-item" onClick={() => fileInputRef.current?.click()}>
              <span>Import data</span>
              <span className="settings-arrow">›</span>
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} hidden />
          </div>
        </div>
      )}

      {showSheet && (
        <DayDetailSheet
          key={selectedDate.toISOString()}
          date={selectedDate}
          entries={entries.filter(e => e.date === getISODate(selectedDate))}
          onSave={handleSaveEntry}
          onClose={() => setShowSheet(false)}
        />
      )}

      <div className="bottom-menu">
        <button type="button" className={`bottom-menu-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <span>📅</span>
          <span>Calendar</span>
        </button>
        <button type="button" className={`bottom-menu-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <span>📊</span>
          <span>Stats</span>
        </button>
        <button type="button" className={`bottom-menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default App;
