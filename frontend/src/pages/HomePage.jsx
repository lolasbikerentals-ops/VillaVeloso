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
        <VillaSelector villas={villas} onSelect={handleStartCheck} />
      )}
    </div>
  );
}
