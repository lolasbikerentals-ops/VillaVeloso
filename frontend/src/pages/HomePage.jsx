import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVillas } from '../api/sheets';
import VillaSelector from '../components/VillaSelector';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    getVillas()
      .then(setVillas)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleStartCheck(villaId) {
    navigate('/run/' + encodeURIComponent(villaId), { replace: false });
  }

  return (
    <div className="page home-page">
      <header className="header">
        <h1>Villa Checklist</h1>
        <div className="user-row">
          <span className="user-name">{user?.name || user?.login}</span>
          <button type="button" className="btn btn-text" onClick={logout}>Log out</button>
        </div>
      </header>
      {loading && <p className="loading">Loading villas…</p>}
      {err && <p className="error">{err}</p>}
      {!loading && !err && (
        <div className="home-actions">
          <section className="home-action-section">
            <h2 className="home-action-title">Run checklist</h2>
            <VillaSelector villas={villas} onSelect={handleStartCheck} />
          </section>
          <section className="home-action-section">
            <h2 className="home-action-title">Check-ins</h2>
            <p className="hint">Input and view guest check-ins</p>
            <button
              type="button"
              className="btn btn-primary home-action-btn"
              onClick={() => navigate('/check-ins')}
            >
              Manage check-ins →
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
