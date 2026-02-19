import React from 'react';

export default function CheckRunSummary({ villaName, onBack }) {
  return (
    <div className="page summary-page">
      <div className="card success-card">
        <h1>Check complete</h1>
        <p>{villaName} checklist has been saved.</p>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Back to villas
        </button>
      </div>
    </div>
  );
}
