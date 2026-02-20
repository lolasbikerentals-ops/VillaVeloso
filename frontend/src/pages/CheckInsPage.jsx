import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCheckIns, createCheckIn, getVillas } from '../api/sheets';
import CheckInForm from '../components/CheckInForm';

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function extractDate(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, 10);
}

function getDateBadges(ci, todayStr, tomorrowStr) {
  const ciDate = extractDate(ci.check_in);
  const coDate = extractDate(ci.check_out);
  const badges = [];
  if (ciDate === todayStr || ciDate === tomorrowStr) {
    badges.push(ciDate === todayStr ? 'Arriving today' : 'Arriving tomorrow');
  }
  if (coDate === todayStr || coDate === tomorrowStr) {
    badges.push(coDate === todayStr ? 'Departing today' : 'Departing tomorrow');
  }
  return badges;
}

export default function CheckInsPage() {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState([]);
  const [villas, setVillas] = useState([]);
  const [villaFilter, setVillaFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'upcoming' | 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const tomorrowStr = useMemo(() => toDateStr(tomorrowDate), [tomorrowDate]);

  const filteredCheckIns = useMemo(() => {
    if (dateFilter === 'all') return checkIns;
    if (dateFilter === 'today' || dateFilter === 'tomorrow') {
      const target = dateFilter === 'today' ? todayStr : tomorrowStr;
      return checkIns.filter(ci => {
        const ciDate = extractDate(ci.check_in);
        const coDate = extractDate(ci.check_out);
        return ciDate === target || coDate === target;
      });
    }
    if (dateFilter === 'upcoming') {
      return checkIns.filter(ci => {
        const ciDate = extractDate(ci.check_in);
        return ciDate && ciDate > todayStr;
      });
    }
    if (dateFilter === 'completed') {
      return checkIns.filter(ci => {
        const coDate = extractDate(ci.check_out);
        return coDate && coDate < todayStr;
      });
    }
    return checkIns;
  }, [checkIns, dateFilter, todayStr, tomorrowStr]);

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

      <div className="check-ins-date-filters">
        <span className="filter-label-text">Show:</span>
        <button
          type="button"
          className={`btn btn-date-filter ${dateFilter === 'all' ? 'active' : ''}`}
          onClick={() => setDateFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`btn btn-date-filter ${dateFilter === 'today' ? 'active' : ''}`}
          onClick={() => setDateFilter('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={`btn btn-date-filter ${dateFilter === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setDateFilter('tomorrow')}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={`btn btn-date-filter ${dateFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setDateFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={`btn btn-date-filter ${dateFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setDateFilter('completed')}
        >
          Completed
        </button>
      </div>

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
          {filteredCheckIns.length === 0 ? (
            <p className="empty">
              {{
              all: 'No check-ins found.',
              today: 'No arrivals or departures today.',
              tomorrow: 'No arrivals or departures tomorrow.',
              upcoming: 'No upcoming check-ins.',
              completed: 'No completed stays.',
            }[dateFilter] || 'No check-ins found.'}
            </p>
          ) : (
            filteredCheckIns.map(ci => {
              const badges = getDateBadges(ci, todayStr, tomorrowStr);
              return (
                <div key={ci.check_in_id} className="check-in-card">
                  {badges.length > 0 && (
                    <div className="check-in-badges">
                      {badges.map(b => (
                        <span key={b} className="check-in-badge">{b}</span>
                      ))}
                    </div>
                  )}
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
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
