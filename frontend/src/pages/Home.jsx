import React, { useEffect, useState } from 'react';
import { api } from '../api';
import ReportCard from '../components/ReportCard';

export default function Home({ onOpen }) {
  const [reports, setReports] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  async function load() {
    const { data } = await api.get('/reports', { params: { q, status, category } });
    setReports(data);
  }
  useEffect(()=>{ load(); }, [q, status, category]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3">
        <div className="grow">
          <label>Search</label>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="pothole, streetlight, ..."/>
        </div>
        <div>
          <label>Status</label>
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All</option>
            <option>OPEN</option>
            <option>IN_PROGRESS</option>
            <option>RESOLVED</option>
          </select>
        </div>
        <div>
          <label>Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">All</option>
            <option>Road</option>
            <option>Lighting</option>
            <option>Water</option>
            <option>Garbage</option>
            <option>Safety</option>
            <option>Other</option>
          </select>
        </div>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => <ReportCard key={r.id} report={r} onOpen={()=> onOpen(r.id)} />)}
      </div>
    </div>
  );
}
