import React from 'react';
import { getImageUrl } from '../api';

export default function ReportCard({ report, onOpen }) {
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{report.title}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{report.status}</span>
      </div>
      <div className="text-sm text-gray-600">{report.category} • {report.address || 'No address'}</div>
      {report.images?.length > 0 && <img
  src={getImageUrl(report.images?.[0]?.url)}
  alt="report" className="rounded-xl max-h-40 w-full object-cover" />}
      <p className="text-sm line-clamp-3">{report.description}</p>
      <div className="flex items-center justify-between text-sm">
        <div>👍 {report.upvotes}</div>
        <button className="btn" onClick={onOpen}>Open</button>
      </div>
    </div>
  );
}
