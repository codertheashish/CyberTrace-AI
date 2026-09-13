import { Link } from 'react-router-dom';
import {
  Radar, ArrowRight, PlayCircle, Share2, MapPinned, Brain, ShieldCheck, Network, Sparkles,
} from 'lucide-react';

const SECTIONS = [
  { icon: Brain, title: 'AI Intelligence', text: 'A trained supervised model — not rules-of-thumb — learns from complaint, transaction, and behavioral patterns.' },
  { icon: MapPinned, title: 'Location Prediction', text: 'Ranks the most likely cash-withdrawal points with calibrated probabilities, shown on an interactive map.' },
  { icon: Network, title: 'Transaction Network', text: 'NetworkX-powered graph traces money flow from victim to suspected cash-out accounts.' },
  { icon: ShieldCheck, title: 'Explainable AI', text: 'Every prediction ships with human-readable reasons — never a black box.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen text-slate-200 scanline-grid">
      <header className="flex items-center justify-between px-8 py-5 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <Radar className="text-cyan-400" size={24} />
          <span className="font-bold text-white">CyberTrace AI</span>
        </div>
        <Link to="/login" className="text-sm text-cyan-400 hover:underline">Launch Dashboard →</Link>
      </header>

      <section className="max-w-4xl mx-auto text-center py-24 px-6">
        <div className="inline-flex items-center gap-2 text-[11px] font-mono-tech px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-6">
          <Sparkles size={12} /> PREDICTIVE CYBERCRIME INTELLIGENCE
        </div>
        <h1 className="text-5xl font-extrabold text-white tracking-tight">CyberTrace AI</h1>
        <p className="text-xl text-cyan-400 font-mono-tech mt-3">Predict. Trace. Investigate.</p>
        <p className="text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          An AI-powered predictive intelligence platform for analyzing cybercrime transactions and forecasting likely
          cash withdrawal locations — built to help authorized investigators prioritize where to look next.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/login" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-lg">
            Launch Intelligence Dashboard <ArrowRight size={16} />
          </Link>
          <Link to="/login" state={{ from: '/demo' }} className="flex items-center gap-2 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 px-6 py-3 rounded-lg">
            <PlayCircle size={16} /> Explore Live Demo
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 px-6 pb-16">
        {SECTIONS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass-panel rounded-xl p-6">
            <Icon className="text-cyan-400 mb-3" size={22} />
            <h3 className="text-white font-semibold mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="glass-panel rounded-xl p-6 flex items-start gap-3">
          <Share2 className="text-cyan-400 shrink-0 mt-1" size={18} />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-semibold">Ethics & scope: </span>
            CyberTrace AI is a decision-support prototype designed for authorized investigative use. Predictions
            represent statistical likelihoods and must not be treated as proof of criminal activity. This demonstration
            uses entirely synthetic data and does not contain any real personal financial information.
          </p>
        </div>
      </section>
    </div>
  );
}
