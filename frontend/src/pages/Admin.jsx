import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin() {
  const [reports, setReports] = useState([]);

  async function load() {
    const { data } = await api.get('/reports');
    setReports(data);
  }
  async function setStatus(id, status) {
    await api.post(`/reports/${id}/status`, { status });
    load();
  }
  async function del(id) {
    if (!confirm('Delete this report?')) return;
    await api.delete('/reports/' + id);
    load();
  }
  useEffect(()=>{ load(); }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Admin Dashboard</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Title</th><th>Author</th><th>Status</th><th>Upvotes</th><th>Actions</th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-t">
                <td>{r.title}</td>
                <td>{r.user?.name || 'Unknown'}</td>
                <td>{r.status}</td>
                <td>{r._count?.upvotes || 0}</td>
                <td className="space-x-2">
                  <button className="btn" onClick={() => setStatus(r.id, 'OPEN')}>OPEN</button>
                  <button className="btn" onClick={() => setStatus(r.id, 'IN_PROGRESS')}>IN PROGRESS</button>
                  <button className="btn" onClick={() => setStatus(r.id, 'RESOLVED')}>RESOLVED</button>
                  <button className="btn" onClick={() => del(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
