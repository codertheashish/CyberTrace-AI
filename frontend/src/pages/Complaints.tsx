import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { Complaint } from '../types';

export default function Complaints() {
  const [urlParams] = useSearchParams();
  const [items, setItems] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(urlParams.get('search') || '');
  const [risk, setRisk] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  // Keep the search box in sync if the user arrives via the global header
  // search (e.g. /complaints?search=Lucknow) after already being on this page.
  useEffect(() => {
    const q = urlParams.get('search');
    if (q !== null && q !== search) {
      setPage(1);
      setSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams]);

  useEffect(() => {
    setLoading(true);
    api
      .complaints({ page, page_size: pageSize, search, risk, status })
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [page, search, risk, status]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Cybercrime Complaints</h1>
          <p className="text-sm text-slate-500">{total.toLocaleString()} complaints in the synthetic case pipeline.</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search complaint ID, type, city…"
            className="bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs w-64 outline-none focus:border-cyan-500/50"
          />
        </div>
        <select value={risk} onChange={(e) => { setPage(1); setRisk(e.target.value); }} className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
          <option value="">All Risk Levels</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
          <option value="">All Statuses</option>
          <option>Open</option>
          <option>Under Investigation</option>
          <option>Escalated</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-slate-400 text-left font-mono-tech uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Complaint ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading complaints…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No complaints match these filters.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.complaint_id} className="border-t border-white/5 hover:bg-cyan-500/5">
                  <td className="px-4 py-3">
                    <Link to={`/complaints/${c.complaint_id}`} className="text-cyan-400 font-mono-tech hover:underline">
                      {c.complaint_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(c.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{c.complaint_type}</td>
                  <td className="px-4 py-3 font-mono-tech">₹{c.reported_amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{c.city}</td>
                  <td className="px-4 py-3 text-slate-400">{c.channel}</td>
                  <td className="px-4 py-3 text-slate-400">{c.status}</td>
                  <td className="px-4 py-3"><RiskBadge level={c.risk_label} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-30">Previous</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-30">Next</button>
        </div>
      </div>
    </div>
  );
}
