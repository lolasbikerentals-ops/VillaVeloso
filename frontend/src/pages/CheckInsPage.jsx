import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCheckIns, createCheckIn, getVillas } from '../api/sheets';
import CheckInForm from '../components/CheckInForm';

export default function CheckInsPage() {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState([]);
  const [villas, setVillas] = useState([]);
  const [villaFilter, setVillaFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function loadData() {
    setLoading(true);
    setError('');
    Promise.all([
      getVillas(),
      getCheckIns(villaFilter || undefined),
    ])
      .then(([vList, cList]) => {
        setVillas(vList);
        setCheckIns(cList);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [villaFilter]);

  async function handleSubmit(data) {
    setSubmitting(true);
    setError('');
    try {
      await createCheckIn(data);
      setShowForm(false);
      loadData();
    } catch (e) {
      setError(e.message || 'Failed to add check-in');
    } finally {
      setSubmitting(false);
    }
  }

  const villaNames = Object.fromEntries(villas.map(v => [v.villa_id, v.villa_name || v.villa_id]));

  return (
    <div className="page check-ins-page">
      <header className="header">
        <button type="button" className="btn btn-text back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Check-ins</h1>
      </header>

      <div className="check-ins-controls">
        <label className="filter-label">
          <span>Villa</span>
          <select
            value={villaFilter}
            onChange={e => setVillaFilter(e.target.value)}
          >
            <option value="">All villas</option>
            {villas.map(v => (
              <option key={v.villa_id} value={v.villa_id}>
                {v.villa_name || v.villa_id}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add check-in'}
        </button>
      </div>

      {showForm && (
        <div className="check-in-form-wrapper">
          <CheckInForm
            villas={villas}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            submitting={submitting}
          />
        </div>
      )}

      {loading && <p className="loading">Loading check-ins…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="check-ins-list">
          {checkIns.length === 0 ? (
            <p className="empty">No check-ins found.</p>
          ) : (
            checkIns.map(ci => (
              <div key={ci.check_in_id} className="check-in-card">
                <div className="check-in-card-main">
                  <span className="check-in-name">{ci.name || '—'}</span>
                  <span className="check-in-villa">{villaNames[ci.villa_id] || ci.villa_id}</span>
                </div>
                <div className="check-in-card-dates">
                  <span>Check-in: {ci.check_in || '—'}</span>
                  <span>Check-out: {ci.check_out || '—'}</span>
                </div>
                <div className="check-in-card-meta">
                  {ci.number_of_nights && <span>{ci.number_of_nights} night(s)</span>}
                  {ci.booking_platform && <span>{ci.booking_platform}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
