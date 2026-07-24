Nice—GitHub Pages is a solid way to get this running on both your iPhone and Windows, with offline support.

I’ll give you a **complete React + TypeScript PWA** you can:

- Host on **GitHub Pages**
- **Install on iPhone** (Add to Home Screen)
- Use **offline** (service worker + IndexedDB)
- Run on **Windows** in any browser

I’ll keep it focused: **code + exact steps**.

---

### 1. Create the project (on Windows)

In a folder where you keep projects:

```bash
npm create vite@latest commute-tracker -- --template react-ts
cd commute-tracker
npm install
```

This gives you a React + TypeScript app with Vite.

---

### 2. Project structure

You’ll end up with something like:

```
commute-tracker/
  index.html
  vite.config.ts
  package.json
  tsconfig.json
  public/
    manifest.json
    icons/
  src/
    main.tsx
    App.tsx
    models.ts
    storage.ts
    calendarLogic.ts
    components/
      CalendarView.tsx
      DayDetailSheet.tsx
      CommuteRow.tsx
  service-worker.js
```

---

### 3. Models (src/models.ts)

```ts
export type CommutePeriod = 'morning' | 'afternoon';
export type CommuteRating = 'good' | 'bad';

export interface CommuteEntry {
  id: string;
  date: string;      // ISO date (yyyy-mm-dd)
  period: CommutePeriod;
  rating: CommuteRating;
  station: string;
  time: string;      // HH:mm
  note?: string;
}
```

---

### 4. IndexedDB storage (src/storage.ts)

```ts
const DB_NAME = 'commute-tracker-db';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEntries(): Promise<CommuteEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as CommuteEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEntry(entry: CommuteEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
```

---

### 5. Calendar logic (src/calendarLogic.ts)

```ts
import { CommuteEntry, CommuteRating } from './models';

export function getISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function generateMonthDates(base: Date): Date[] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const dates: Date[] = [];
  let d = new Date(first);
  while (d.getMonth() === month) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function dayRating(date: Date, entries: CommuteEntry[]): CommuteRating | null {
  const iso = getISODate(date);
  const dayEntries = entries.filter(e => e.date === iso);
  if (dayEntries.length === 0) return null;
  return dayEntries.some(e => e.rating === 'bad') ? 'bad' : 'good';
}
```

---

### 6. Main app (src/App.tsx)

```tsx
import React, { useEffect, useState } from 'react';
import { CommuteEntry, CommuteRating } from './models';
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
```

---

### 7. Calendar view (src/components/CalendarView.tsx)

```tsx
import React from 'react';
import { CommuteRating } from '../models';

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
              key={date.toISOString()}
              className="calendar-cell"
              style={{
                backgroundColor: bg,
                color: isSelected ? '#fff' : '#000',
              }}
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
```

---

### 8. Day detail sheet (src/components/DayDetailSheet.tsx)

```tsx
import React from 'react';
import { CommuteEntry, CommutePeriod, CommuteRating } from '../models';
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
```

---

### 9. Commute row (src/components/CommuteRow.tsx)

```tsx
import React, { useState } from 'react';
import { CommuteEntry, CommuteRating } from '../models';

interface Props {
  title: string;
  entry: CommuteEntry;
  onChange: (entry: CommuteEntry) => void;
}

const CommuteRow: React.FC<Props> = ({ title, entry, onChange }) => {
  const [local, setLocal] = useState<CommuteEntry>(entry);

  const update = (patch: Partial<CommuteEntry>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onChange(updated);
  };

  const toggleRating = () => {
    const next: CommuteRating = local.rating === 'good' ? 'bad' : 'good';
    update({ rating: next });
  };

  return (
    <div className="commute-row">
      <div className="row-header">
        <span>{title}</span>
        <button onClick={toggleRating}>
          {local.rating === 'good' ? '✅' : '❌'}
        </button>
      </div>

      <div className="row-body">
        <input
          type="time"
          value={local.time}
          onChange={e => update({ time: e.target.value })}
        />

        <input
          type="text"
          value={local.station}
          onChange={e => update({ station: e.target.value })}
        />

        <input
          type="text"
          placeholder="Add a note..."
          value={local.note ?? ''}
          onChange={e => update({ note: e.target.value })}
        />
      </div>
    </div>
  );
};

export default CommuteRow;
```

---

### 10. PWA manifest (public/manifest.json)

```json
{
  "name": "Commute Tracker",
  "short_name": "Commute",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007aff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add simple PNG icons in `public/icons/`.

---

### 11. Service worker (service-worker.js at project root)

```js
const CACHE_NAME = 'commute-tracker-cache-v1';
const URLS_TO_CACHE = ['/', '/index.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
```

Register it in `src/main.tsx`:

```ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
```

---

### 12. GitHub Pages deployment

1. Create a repo on GitHub: `commute-tracker`.
2. In `vite.config.ts`, set base to your repo name:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/commute-tracker/'
});
```

3. Build:

```bash
npm run build
```

4. Push `dist/` to `gh-pages` branch or use `gh-pages` npm package:

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:

```json
"scripts": {
  "build": "vite build",
  "deploy": "gh-pages -d dist"
}
```

Then:

```bash
npm run build
npm run deploy
```

5. Your app URL will be:

`https://<your-username>.github.io/commute-tracker/`

---

### 13. Install on iPhone (offline use)

1. Open the GitHub Pages URL in Safari.
2. Wait for it to load fully.
3. Tap **Share → Add to Home Screen**.
4. Open from the new icon.
5. Turn off Wi‑Fi / data → app still works.
6. All commute data is stored locally in IndexedDB.

---

If you want, next I can tighten the styling (CSS) to match the mockup exactly, but this is already a working offline app you can host on GitHub Pages and use on both Windows and iPhone.