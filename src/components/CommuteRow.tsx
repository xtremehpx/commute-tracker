import React, { useState, useEffect } from 'react';
import type { CommuteEntry } from '../models';
import { STATIONS } from "../config/stations";


interface Props {
  title: string;
  entry: CommuteEntry;
  onChange: (entry: CommuteEntry) => void;
}

const CommuteRow: React.FC<Props> = ({ title, entry, onChange }) => {
  const [local, setLocal] = useState<CommuteEntry>(entry);

  useEffect(() => {
    setLocal(entry);
  }, [entry]);

  const update = (patch: Partial<CommuteEntry>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <div className="commute-row">
      <div className="row-title">{title}</div>

      <div className="row-main">
        <div className="rating-group">
          <button
            className={`rating-btn ${local.rating === 'good' ? 'active-good' : ''}`}
            onClick={() => update({ rating: 'good', problemStation: undefined })}
          >
            ✔
          </button>

          <button
            className={`rating-btn ${local.rating === 'bad' ? 'active-bad' : ''}`}
            onClick={() => update({ rating: 'bad', problemStation: local.problemStation ?? local.station })}
          >
            ✖
          </button>

        </div>

        <div className="row-field time-field">
          <label>Time</label>
          <input
            type="time"
            value={local.time}
            onChange={e => update({ time: e.target.value })}
          />
        </div>


        <div className="row-field station-field">
          <label>Starting Station</label>
          <select
            value={local.station}
            onChange={e => update({ station: e.target.value })}
          >
            {STATIONS.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="row-field station-field problem-station-field">
          <label>Problem Station</label>
          <select
            value={local.problemStation ?? ''}
            onChange={e => update({ problemStation: e.target.value || undefined })}
          >
            <option value="">No issue</option>
            {STATIONS.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

      </div>

      <div className="note-wrapper">
        <input
          className="note-input"
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
