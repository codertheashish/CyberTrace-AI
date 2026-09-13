import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FileWarning, AlertTriangle, ArrowLeftRight, IndianRupee, MapPinned, Bell, TrendingUp, PlayCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardData } from '../types';

function KpiCard({ icon: Icon, label, value, accent, trend }: any) {
  return (
    <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-slate-400 font-mono-tech uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold text-white mt-1">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400">
          <TrendingUp size={12} /> {trend}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 text-sm">Loading intelligence dashboard…</div>;
  if (error) return <div className="text-rose-400 text-sm">Error loading dashboard: {error}</div>;
  if (!data) return null;

  const k = data.kpis;
  const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Cyber Crime Intelligence Command Center</h1>
          <p className="text-sm text-slate-500">Real-time synthesis of complaints, transactions, and predictive location intelligence.</p>
        </div>
        <Link
          to="/demo"
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <PlayCircle size={16} /> RUN LIVE DEMO
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={FileWarning} label="Total Complaints" value={k.total_complaints.toLocaleString()} accent="bg-cyan-500/15 text-cyan-400" trend="+ new this month" />
        <KpiCard icon={AlertTriangle} label="High-Risk Complaints" value={k.high_risk_complaints.toLocaleString()} accent="bg-orange-500/15 text-orange-400" />
        <KpiCard icon={ArrowLeftRight} label="Suspicious Transactions" value={k.suspicious_transactions.toLocaleString()} accent="bg-rose-500/15 text-rose-400" />
        <KpiCard icon={IndianRupee} label="Amount Under Investigation" value={inr(k.amount_under_investigation)} accent="bg-yellow-500/15 text-yellow-400" />
        <KpiCard icon={MapPinned} label="Predicted High-Risk Locations" value={k.predicted_high_risk_locations} accent="bg-blue-500/15 text-blue-400" />
        <KpiCard icon={Bell} label="Active Alerts" value={k.active_alerts} accent="bg-cyan-500/15 text-cyan-400" />
      </div>

      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Complaint Volume Trend</h2>
          <span className="text-[11px] text-slate-500 font-mono-tech">MONTHLY · SYNTHETIC DATASET</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.monthly_trend}>
            <defs>
              <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid rgba(56,189,248,0.2)', fontSize: 12 }} />
            <Area type="monotone" dataKey="c" stroke="#22d3ee" fill="url(#colorC)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-500 glass-panel rounded-xl p-4 border-cyan-500/10">
        CyberTrace AI is a decision-support prototype designed for authorized investigative use. Predictions represent
        statistical likelihoods and must not be treated as proof of criminal activity. The demonstration uses synthetic
        data and does not contain real personal financial information.
      </div>
    </div>
  );
}
