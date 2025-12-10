import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Contractor() {
  const [reports, setReports] = useState([]);

  async function load() {
    const { data } = await api.get('/reports');
    setReports(data);
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div className="space-y-4">
      <h2 className="page-title text-2xl">Contractor Dashboard</h2>
      <div className="grid gap-4">
        {reports.map(r => (
          <div key={r.id} className="card">
            <h3 className="font-semibold">{r.title}</h3>
            <p className="text-sm text-gray-600">{r.category} • {r.address}</p>
            <p>{r.description}</p>
            <a href={`#report:${r.id}`} className="btn btn-primary mt-2">View & Bid</a>
          </div>
        ))}
      </div>
    </div>
  );
}
