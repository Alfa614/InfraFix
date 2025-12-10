import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../api';

export default function ReportDetail({ id, onBack, user }) { 
  const [report, setReport] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDesc, setBidDesc] = useState('');

  async function load() {
    const { data } = await api.get('/reports/' + id);
    setReport(data);
    const bidsRes = await api.get(`/reports/${id}/bids`);
    setBids(bidsRes.data);
  }
  useEffect(()=>{ load(); }, [id]);

  async function upvote() {
    try {
      const { data } = await api.post(`/reports/${id}/upvote`);
      setReport(data);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed');
    }
  }

  async function addComment() {
    try {
      await api.post(`/reports/${id}/comment`, { text: comment });
      setComment('');
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed');
    }
  }

  async function submitBid() {
    try {
      await api.post(`/reports/${id}/bids`, { amount: bidAmount, description: bidDesc });
      setBidAmount('');
      setBidDesc('');
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to bid');
    }
  }

  if (!report) return <div className="card">Loading...</div>;

  const shareText = encodeURIComponent(`${report.title} - via InfraFix`);
  const shareUrl = encodeURIComponent(window.location.href);

  const hasUpvoted = report.upvotes?.some(u => u.userId === user?.id); 

  return (
    <div className="space-y-4">
      <button className="btn" onClick={onBack}>← Back</button>
      
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{report.title}</h2>
          <div className="flex gap-2">
            {report.severity && (
  <span
    className={`px-2 py-1 text-xs rounded-full ${
      report.severity === 'HIGH'
        ? 'bg-red-200 text-red-800'
        : 'bg-yellow-200 text-yellow-800'
    }`}
  >
    {report.severity}
  </span>
)}

            {report.urgency && <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">{report.urgency}</span>}
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{report.status}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {report.category} • {report.address || 'No address'}
        </div>

    <div className="grid md:grid-cols-2 gap-2">
      {}
      {report.category?.toLowerCase() === 'road' && report.processedImage ? (
        <div className="relative">
          <img
            src={getImageUrl(report.processedImage)}
            alt="AI Analyzed Result"
            className="rounded-xl w-full object-cover border-2 border-blue-400"
          />
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            AI Processed View
          </span>
        </div>
      ) : (
        report.images?.map((img) => (
          <img
            key={img.id}
            src={getImageUrl(img.url)}
            alt={report.title}
            className="rounded-xl w-full object-cover"
          />
        ))
      )}
    </div>



        <p>{report.description}</p>

        <div className="flex items-center gap-2">
          <button
            className={`btn ${hasUpvoted ? 'bg-blue-100 text-blue-600' : ''}`}
            onClick={upvote}
          >
            {hasUpvoted ? '✅ Upvoted' : '👍 Upvote'} ({report._count?.upvotes || 0})
          </button>
          <a className="btn" target="_blank" rel="noreferrer"
             href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}>
             Share on X
          </a>
          <a className="btn" target="_blank" rel="noreferrer"
             href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}>
             Share on Facebook
          </a>
        </div>

      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Comments</h3>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2">
          <input
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <button className="btn" onClick={addComment}>Post</button>
        </div>
        <div className="space-y-2">
          {report.comments?.map(c => (
            <div key={c.id} className="border rounded-xl p-2">
              <div className="text-sm text-gray-600">
                {new Date(c.createdAt).toLocaleString()} • {c.user?.name}
              </div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Bids</h3>
        {bids.length === 0 && <div className="text-sm text-gray-500">No bids yet</div>}
        <div className="space-y-2">
          {bids.map(b => (
            <div key={b.id} className="border rounded-xl p-2">
              <div className="text-sm text-gray-600">
                {new Date(b.createdAt).toLocaleString()} • {b.contractor?.name}
              </div>
              <div>💰 {b.amount} — {b.description}</div>
              {b.aiEvaluation && (
              <div className={`text-sm ${b.aiEvaluation === 'Reasonable' ? 'text-green-600' : 'text-red-600'}`}>
                AI evaluation: {b.aiEvaluation}
              </div>
              )}
            </div>
          ))}
        </div>

        {}
        {user?.role === 'CONTRACTOR' && (
          <div className="space-y-2">
            <input 
              type="number" 
              placeholder="Bid amount" 
              value={bidAmount} 
              onChange={e=>setBidAmount(e.target.value)} 
            />
            <textarea 
              placeholder="Description" 
              value={bidDesc} 
              onChange={e=>setBidDesc(e.target.value)} 
            />
            <button className="btn btn-primary" onClick={submitBid}>Submit Bid</button>

          </div>
        )}
      </div>
      
    </div>
  );
}
