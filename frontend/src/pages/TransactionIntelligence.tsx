import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Percent, Gauge } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { Transaction } from '../types';

function riskLabel(score: number) {
  return score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-[11px] text-slate-500 font-mono-tech uppercase">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

export default function TransactionIntelligence() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  useEffect(() => {
    setLoading(true);
    api
      .transactions({ page, page_size: pageSize, suspicious_only: suspiciousOnly ? 'true' : 'false' })
      .then((d) => { setItems(d.items); setTotal(d.total); setStats(d.stats); })
      .finally(() => setLoading(false));
  }, [page, suspiciousOnly]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Transaction Intelligence</h1>
        <p className="text-sm text-slate-500">Volume, velocity, and risk analytics across the synthetic transaction ledger.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Total Volume" value={stats.total_volume.toLocaleString()} />
          <StatCard icon={Percent} label="Suspicious %" value={`${stats.suspicious_pct}%`} />
          <StatCard icon={TrendingUp} label="Avg Amount" value={`₹${stats.avg_amount.toLocaleString()}`} />
          <StatCard icon={Gauge} label="Avg Velocity" value={`${stats.avg_velocity} txns/hr`} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={suspiciousOnly} onChange={(e) => { setPage(1); setSuspiciousOnly(e.target.checked); }} className="accent-cyan-500" />
          Suspicious transactions only
        </label>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-slate-400 text-left font-mono-tech uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Receiver</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading transactions…</td></tr>
            ) : (
              items.map((t) => (
                <tr key={t.transaction_id} className="border-t border-white/5 hover:bg-cyan-500/5">
                  <td className="px-4 py-3 font-mono-tech text-cyan-400">{t.transaction_id}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(t.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{t.sender_account}</td>
                  <td className="px-4 py-3">{t.receiver_account}</td>
                  <td className="px-4 py-3 font-mono-tech">₹{t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{t.channel}</td>
                  <td className="px-4 py-3 text-slate-400">{t.city}</td>
                  <td className="px-4 py-3"><RiskBadge level={riskLabel(t.risk_score)} /></td>
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
