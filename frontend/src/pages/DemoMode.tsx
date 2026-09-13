import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

const STEPS = [
  'Loading sample cybercrime complaint…',
  'Identifying suspicious transaction…',
  'Animating money movement through linked accounts…',
  'Rendering transaction network graph…',
  'Running prediction model…',
  'Ranking top 5 likely withdrawal locations…',
  'Focusing map on highest-risk location…',
  'Generating explainability report…',
  'Compiling investigation summary…',
];

export default function DemoMode() {
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const runDemo = async () => {
    clearTimers();
    setRunning(true);
    setResult(null);
    setError('');
    setStepIndex(0);

    try {
      const dataPromise = api.runDemo();
      // animate through the steps over ~6 seconds while the (fast) real API call resolves
      STEPS.forEach((_, i) => {
        const t = window.setTimeout(() => setStepIndex(i), i * 650);
        timers.current.push(t);
      });
      const data = await dataPromise;
      const finalDelay = STEPS.length * 650 + 300;
      const t = window.setTimeout(() => {
        setResult(data);
        setStepIndex(STEPS.length);
        setRunning(false);
      }, finalDelay);
      timers.current.push(t);
    } catch (e: any) {
      setError(e.message);
      setRunning(false);
    }
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Live Demo Mode</h1>
          <p className="text-sm text-slate-500">One-click end-to-end walkthrough: complaint → transactions → network → prediction → summary.</p>
        </div>
        <button
          onClick={runDemo}
          disabled={running}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold text-sm px-4 py-2 rounded-lg"
        >
          {result ? <RotateCcw size={16} /> : <PlayCircle size={16} />} {running ? 'Running…' : 'RUN LIVE DEMO'}
        </button>
      </div>

      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {stepIndex >= 0 && (
        <div className="glass-panel rounded-xl p-5">
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 text-xs transition-opacity ${i <= stepIndex ? 'opacity-100' : 'opacity-30'}`}>
                {i < stepIndex || result ? (
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                ) : i === stepIndex ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={i <= stepIndex ? 'text-slate-200' : 'text-slate-600'}>STEP {i + 1}: {s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="grid xl:grid-cols-2 gap-6">
          <div className="glass-panel rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Complaint: {result.complaint.complaint_id}</h2>
            <div className="flex items-center gap-2">
              <RiskBadge level={result.complaint.risk_label} />
              <span className="text-xs text-slate-400">₹{result.complaint.reported_amount.toLocaleString()} · {result.complaint.complaint_type}</span>
            </div>
            <div className="text-xs text-slate-400">
              {result.transactions.length} transactions traced across {result.network.stats.node_count} accounts
              in {result.network.stats.clusters} cluster(s).
            </div>
            <Link to={`/network?complaint=${result.complaint.complaint_id}`} className="inline-block text-xs text-cyan-400 hover:underline">
              View full network graph →
            </Link>
          </div>

          <div className="glass-panel rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Top Predicted Withdrawal Location</h2>
            {result.prediction.top_locations[0] && (
              <>
                <div className="text-lg font-bold text-cyan-400 font-mono-tech">{result.prediction.top_locations[0].location_id}</div>
                <div className="text-xs text-slate-400">{result.prediction.top_locations[0].area}</div>
                <div className="text-2xl font-bold text-white">{(result.prediction.top_locations[0].probability * 100).toFixed(1)}%</div>
                <RiskBadge level={result.prediction.risk_level} />
              </>
            )}
            <Link to={`/predictions?complaint=${result.complaint.complaint_id}`} className="inline-block text-xs text-cyan-400 hover:underline">
              View all 5 predictions & explanation →
            </Link>
          </div>

          <div className="xl:col-span-2 glass-panel rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-white">Investigation Summary</h2>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {result.summary.key_findings.map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
            <div className="text-xs text-cyan-400 mt-2">{result.summary.recommended_priority}</div>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-white/5 mt-2">{result.summary.disclaimer}</div>
          </div>
        </div>
      )}
    </div>
  );
}
