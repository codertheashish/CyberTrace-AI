import { useEffect, useState } from 'react';
import { BarChart3, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { ModelMetrics } from '../types';

function MetricCard({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="text-[11px] text-slate-500 uppercase font-mono-tech">{label}</div>
      <div className={`${big ? 'text-3xl' : 'text-xl'} font-bold text-cyan-400 mt-1`}>{value}</div>
    </div>
  );
}

export default function Analytics() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [modelError, setModelError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .modelMetrics()
      .then((d) => {
        // The backend returns {"error": "..."} with a 200 status when the
        // model hasn't been trained yet (train_model.py not run) — handle
        // that shape explicitly instead of assuming full metrics are present.
        if (d && typeof d === 'object' && 'error' in d && !('top_3_location_accuracy' in d)) {
          setModelError(d.error || 'Model metrics unavailable.');
          return;
        }
        setMetrics(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 size={20} className="text-cyan-400" /> Model Performance</h1>
        <p className="text-sm text-slate-500">Real evaluation metrics computed on a held-out test split — never hardcoded.</p>
      </div>

      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {modelError && (
        <div className="glass-panel rounded-xl p-5 flex items-start gap-3 border-orange-500/20">
          <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm text-white font-medium">Model not trained yet on this backend</div>
            <p className="text-xs text-slate-400 mt-1">
              The prediction model hasn't been generated on this deployment. Run{' '}
              <code className="text-cyan-400 font-mono-tech">python ml/generate_dataset.py</code> then{' '}
              <code className="text-cyan-400 font-mono-tech">python ml/train_model.py</code> on the backend
              (or check your Render build logs — the build command should run both automatically).
            </p>
            <p className="text-[11px] text-slate-600 mt-2 font-mono-tech">Backend detail: {modelError}</p>
          </div>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Top-3 Location Accuracy" value={`${(metrics.top_3_location_accuracy * 100).toFixed(1)}%`} big />
            <MetricCard label="Top-5 Location Accuracy" value={`${(metrics.top_5_location_accuracy * 100).toFixed(1)}%`} big />
            <MetricCard label="Precision (weighted)" value={`${(metrics.test_precision_weighted * 100).toFixed(1)}%`} />
            <MetricCard label="Recall (weighted)" value={`${(metrics.test_recall_weighted * 100).toFixed(1)}%`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="F1 Score" value={`${(metrics.test_f1_weighted * 100).toFixed(1)}%`} />
            <MetricCard label="Top-1 Accuracy" value={`${(metrics.test_accuracy * 100).toFixed(1)}%`} />
            <MetricCard label="Test Set Size" value={`${metrics.n_test} rows`} />
            <MetricCard label="Location Classes" value={`${metrics.n_classes}`} />
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Target size={14} className="text-cyan-400" /> Model Selection</h2>
            <p className="text-xs text-slate-400 mb-3">
              Candidate models were trained on the same 60/20/20 train/validation/test split and compared on validation
              accuracy. The best performer, <span className="text-cyan-400 font-semibold">{metrics.selected_model}</span>,
              was selected and re-fit on train+validation before final test-set evaluation.
            </p>
            <div className="space-y-2">
              {Object.entries(metrics.validation_scores || {}).map(([name, score]) => (
                <div key={name} className="flex items-center gap-3 text-xs">
                  <span className="w-32 text-slate-400">{name}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${(score as number) * 100}%` }} />
                  </div>
                  <span className="w-14 text-right text-white font-mono-tech">{((score as number) * 100).toFixed(1)}%</span>
                  {name === metrics.selected_model && <CheckCircle size={14} className="text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 glass-panel rounded-xl p-4">
            Trained on {metrics.n_train} rows, validated on {metrics.n_val}, tested on {metrics.n_test} — split before any
            feature engineering that could leak information about the withdrawal location.
          </div>
        </>
      )}
    </div>
  );
}
