import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowDown, Share2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.complaintDetail(id).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-slate-500 text-sm">Loading investigation record…</div>;
  if (error) return <div className="text-rose-400 text-sm">{error}</div>;
  if (!data) return null;

  const { complaint: c, transaction_timeline: timeline, behavior_analysis: behavior } = data;

  // Build a simple chain of accounts from the timeline
  const chain: string[] = [];
  if (c.victim_account) chain.push(c.victim_account);
  timeline.forEach((t: any) => {
    if (!chain.includes(t.sender_account)) chain.push(t.sender_account);
    if (!chain.includes(t.receiver_account)) chain.push(t.receiver_account);
  });

  return (
    <div className="space-y-6">
      <Link to="/complaints" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400">
        <ArrowLeft size={14} /> Back to complaints
      </Link>

      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white font-mono-tech">{c.complaint_id}</h1>
              <RiskBadge level={c.risk_label} />
            </div>
            <p className="text-sm text-slate-400 mt-1">{c.complaint_type} · {c.city}, {c.state} · {new Date(c.date).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/network?complaint=${c.complaint_id}`} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
              <Share2 size={14} /> View Network Graph
            </Link>
            <Link to={`/predictions?complaint=${c.complaint_id}`} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400">
              <Sparkles size={14} /> Run Prediction
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          {[
            ['Amount', `₹${c.reported_amount.toLocaleString()}`],
            ['Status', c.status],
            ['Risk Score', `${c.risk_score}/100`],
            ['Victim Account', c.victim_account],
            ['Suspected Account', c.suspected_account],
          ].map(([label, val]) => (
            <div key={label as string}>
              <div className="text-[10px] text-slate-500 uppercase font-mono-tech">{label}</div>
              <div className="text-sm text-white font-medium mt-0.5">{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Transaction Timeline</h2>
          <div className="flex flex-col items-start">
            {chain.map((acc, i) => (
              <div key={acc + i} className="flex flex-col items-center w-full">
                <div className={`px-4 py-2 rounded-lg border text-xs font-mono-tech ${
                  i === 0 ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                  : acc === c.suspected_account ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border-white/10 bg-white/5 text-slate-300'
                }`}>
                  {i === 0 ? 'Victim · ' : ''}{acc}
                </div>
                {i < chain.length - 1 && <ArrowDown size={16} className="my-1 text-slate-600" />}
              </div>
            ))}
            {chain.length > 0 && (
              <>
                <ArrowDown size={16} className="my-1 text-slate-600" />
                <div className="px-4 py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-mono-tech">
                  Cash Withdrawal (predicted — see Predictions tab)
                </div>
              </>
            )}
          </div>

          <h3 className="text-xs font-semibold text-slate-400 mt-6 mb-2 uppercase font-mono-tech">Raw transaction events</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {timeline.map((t: any) => (
              <div key={t.transaction_id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                <span className="font-mono-tech text-slate-400">{t.transaction_id}</span>
                <span>{t.sender_account} → {t.receiver_account}</span>
                <span className="font-mono-tech">₹{t.amount.toLocaleString()}</span>
                <span className="text-slate-500">{t.channel}</span>
                <RiskBadge level={t.risk_score >= 80 ? 'CRITICAL' : t.risk_score >= 60 ? 'HIGH' : t.risk_score >= 35 ? 'MEDIUM' : 'LOW'} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Behavior Analysis</h2>
          <div className="space-y-3 text-xs">
            {[
              ['Transaction Velocity', `${behavior.transaction_velocity} txns/hr`],
              ['Linked Accounts', behavior.linked_accounts],
              ['Amount Deviation', `${behavior.amount_deviation_pct}%`],
              ['Geographic Movement', `${behavior.geographic_movement} cities`],
              ['Device Count', behavior.device_count],
              ['Account Age', `${behavior.account_age_days} days`],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">{label}</span>
                <span className="text-white font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
