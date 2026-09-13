import { useEffect, useState } from 'react';
import { Info, Server, Database, Cpu, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function SystemInfo() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => { api.health().then(setHealth); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Info size={20} className="text-cyan-400" /> System Information</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Server size={14} /> Backend Status</h2>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">API Status</span><span className="text-emerald-400">{health?.status?.toUpperCase() || '...'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">ML Model Available</span><span className="text-white">{health ? String(health.model_available) : '...'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Server Time</span><span className="text-white font-mono-tech">{health?.time}</span></div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Cpu size={14} /> Tech Stack</h2>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Frontend: React + Vite + TypeScript + Tailwind CSS + Recharts + Leaflet</div>
            <div>Backend: FastAPI + Pydantic + SQLite</div>
            <div>ML: scikit-learn, XGBoost, NetworkX, joblib, pandas, numpy</div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Database size={14} /> Dataset</h2>
          <div className="text-xs text-slate-400 space-y-1">
            <div>1,000 synthetic complaints</div>
            <div>10,000 synthetic transactions</div>
            <div>500 synthetic accounts</div>
            <div>100 synthetic locations</div>
            <div>300 synthetic withdrawals</div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><ShieldCheck size={14} /> Ethics & Disclaimer</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            CyberTrace AI is a decision-support prototype designed for authorized investigative use. Predictions
            represent statistical likelihoods and must not be treated as proof of criminal activity. The demonstration
            uses synthetic data and does not contain real personal financial information.
          </p>
        </div>
      </div>
    </div>
  );
}
