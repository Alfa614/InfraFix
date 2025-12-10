import React, { useState } from 'react';
import { api } from '../api';

export default function Register({ onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { name, email, password, role });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed');
    }
  }

  return (
    <form className="card max-w-md mx-auto space-y-3" onSubmit={submit}>
      <h2 className="text-xl font-semibold">Create account</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <div>
        <label>Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="USER">User</option>
          <option value="CONTRACTOR">Contractor</option>
        </select>
      </div>
      <button className="btn btn-primary w-full">Register</button>
    </form>
  );
}
