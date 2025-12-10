import React, { useState } from 'react';
import { api, setToken } from '../api';

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('admin@infrafix.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    }
  }

  return (
    <form className="card max-w-md mx-auto space-y-3" onSubmit={submit}>
      <h2 className="text-xl font-semibold">Login</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary w-full">Login</button>
      <p className="text-sm text-gray-500"></p>
    </form>
  );
}
