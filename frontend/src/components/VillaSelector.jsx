import React from 'react';

export default function VillaSelector({ villas, onSelect }) {
  if (!villas.length) {
    return <p className="empty">No villas found.</p>;
  }
  return (
    <div className="villa-selector">
      <p className="hint">Select a villa to start the checklist</p>
      <div className="villa-list">
        {villas.map(v => (
          <button
            key={v.villa_id}
            type="button"
            className="villa-card"
            onClick={() => onSelect(v.villa_id)}
          >
            <span className="villa-name">{v.villa_name || v.villa_id}</span>
            {v.notes && <span className="villa-notes">{v.notes}</span>}
            <span className="villa-action">Start check →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
