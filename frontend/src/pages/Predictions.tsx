import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { PredictionResult } from '../types';

export default function Predictions() {
  const [params] = useSearchParams();
  const [complaintId, setComplaintId] = useState(params.get('complaint') || '');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    api.predict(id).then(setResult).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (complaintId) run(complaintId);
    else {
      api.complaints({ risk: 'CRITICAL', page_size: 1 }).then((d) => {
        const id = d.items?.[0]?.complaint_id;
        if (id) { setComplaintId(id); run(id); }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breakdown = result?.risk_breakdown || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Predicted Cash Withdrawal Locations</h1>
          <p className="text-sm text-slate-500">Probabilistic forecasts from the trained location-prediction model.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(complaintId)}
            placeholder="CMP-1024"
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs w-36 outline-none focus:border-cyan-500/50 font-mono-tech"
          />
          <button onClick={() => run(complaintId)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400">
            <Sparkles size={14} /> Run Prediction
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-500 text-sm">Running prediction model…</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {result && (
        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-white">Top 5 Predicted Locations</h2>
            {result.top_locations.map((loc, i) => (
              <div key={loc.location_id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-mono-tech text-sm font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white font-mono-tech">{loc.location_id}</div>
                    <div className="text-xs text-slate-500">{loc.area}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-mono-tech">Probability</div>
                    <div className="text-lg font-bold text-cyan-400">{(loc.probability * 100).toFixed(1)}%</div>
                  </div>
                  <RiskBadge level={loc.risk_score >= 80 ? 'CRITICAL' : loc.risk_score >= 60 ? 'HIGH' : loc.risk_score >= 35 ? 'MEDIUM' : 'LOW'} />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">Overall Risk</h3>
                <RiskBadge level={result.risk_level} />
              </div>
              <div className="space-y-2">
                {Object.entries(breakdown).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span className="capitalize">{k.replace(/_/g, ' ')}</span><span>{v}/100</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-rose-500" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <ShieldAlert size={14} className="text-cyan-400" /> Why this prediction?
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.explanation.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" /> {e}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[11px] text-slate-500 glass-panel rounded-xl p-3">{result.disclaimer}</div>
          </div>
        </div>
      )}
    </div>
  );
}
