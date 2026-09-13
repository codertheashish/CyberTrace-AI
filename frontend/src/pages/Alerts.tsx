import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Eye, Share2, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { Alert } from '../types';

export default function Alerts() {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.alerts().then((d) => setItems(d.items)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string) => {
    await api.reviewAlert(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Bell size={20} className="text-cyan-400" /> Alerts</h1>
        <p className="text-sm text-slate-500">Real-time-style alerts generated from high-risk complaints and predicted withdrawal locations.</p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading alerts…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((a) => (
            <div key={a.alert_id} className="glass-panel rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono-tech text-cyan-400">{a.alert_id}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{a.alert_type}</div>
                </div>
                <RiskBadge level={a.risk_level} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Location: </span><span className="text-white font-mono-tech">{a.location_id}</span></div>
                <div><span className="text-slate-500">Complaint: </span><span className="text-white font-mono-tech">{a.complaint_id}</span></div>
                <div><span className="text-slate-500">Probability: </span><span className="text-white">{(a.probability * 100).toFixed(0)}%</span></div>
                <div><span className="text-slate-500">Amount: </span><span className="text-white">₹{a.amount.toLocaleString()}</span></div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Link to={`/complaints/${a.complaint_id}`} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"><Eye size={12} /> View Investigation</Link>
                <Link to={`/network?complaint=${a.complaint_id}`} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"><Share2 size={12} /> Trace</Link>
                {a.status === 'Open' ? (
                  <button onClick={() => review(a.alert_id)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 ml-auto"><CheckCheck size={12} /> Mark Reviewed</button>
                ) : (
                  <span className="text-[11px] text-emerald-400 ml-auto">Reviewed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
