import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVillas, getInventory, submitCheckRun } from '../api/sheets';
import { useAuth } from '../context/AuthContext';
import CheckRunView from '../components/CheckRunView';
import CheckRunSummary from '../components/CheckRunSummary';

export default function RunPage() {
  const { villaId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [villaName, setVillaName] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!villaId) return;
    Promise.all([getVillas(), getInventory(villaId)])
      .then(([villas, inv]) => {
        const villa = villas.find(v => String(v.villa_id) === String(villaId));
        setVillaName(villa?.villa_name || villaId);
        setInventory(inv);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [villaId]);

  async function handleSubmit(items) {
    setSubmitting(true);
    setError('');
    try {
      await submitCheckRun(villaId, items);
      setSubmitted(true);
    } catch (e) {
      const msg = e.message || 'Submit failed';
      if (msg === 'Session expired' || msg === 'Not authenticated') {
        logout();
        navigate('/login', { replace: true, state: { message: 'Session expired. Please log in again.' } });
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <CheckRunSummary
        villaName={villaName}
        onBack={() => navigate('/', { replace: true })}
      />
    );
  }

  return (
    <div className="page run-page">
      <header className="header">
        <button type="button" className="btn btn-text back" onClick={() => navigate('/')}>← Back</button>
        <h1>{villaName || 'Checklist'}</h1>
      </header>
      {loading && <p className="loading">Loading inventory…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <CheckRunView
          inventory={inventory}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
