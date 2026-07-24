import React, { useState } from 'react';
import type { CommuteEntry, CommuteRating } from '../models';

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