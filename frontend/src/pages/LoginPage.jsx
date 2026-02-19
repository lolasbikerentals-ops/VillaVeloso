import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const sessionMessage = location.state?.message;

  async function handleSubmit(loginName, password) {
    setError('');
    try {
      await login(loginName, password);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    }
  }

  return (
    <div className="page login-page">
      <div className="card">
        <h1>Villa Checklist</h1>
        <p className="subtitle">Sign in to continue</p>
        {sessionMessage && <p className="session-message">{sessionMessage}</p>}
        {error && <p className="error">{error}</p>}
        <LoginForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
