import React, { useState } from 'react';

export default function LoginForm({ onSubmit }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!login.trim()) return;
    onSubmit(login.trim(), password);
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label>
        <span>Login</span>
        <input
          type="text"
          autoComplete="username"
          value={login}
          onChange={e => setLogin(e.target.value)}
          placeholder="Your login"
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
        />
      </label>
      <button type="submit" className="btn btn-primary">Sign in</button>
    </form>
  );
}
