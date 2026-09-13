import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowDown, Share2, Sparkles, FileText, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

const NOTE_CATEGORIES = ['Evidence', 'Finding', 'Action Taken', 'Note'];

function EvidenceLog({ complaintId }: { complaintId: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Evidence');
  const [author, setAuthor] = useState(localStorage.getItem('ct_investigator') || 'Investigator');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.notes(complaintId).then((d) => setNotes(d.items));

  useEffect(() => { load(); }, [complaintId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.addNote(complaintId, author, category, content);
      setContent('');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (noteId: string) => {
    await api.deleteNote(noteId);
    load();
  };

  const catColor: Record<string, string> = {
    Evidence: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    Finding: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    'Action Taken': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    Note: 'border-white/10 bg-white/5 text-slate-300',
  };

  return (
    <div className="glass-panel rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <FileText size={15} className="text-cyan-400" /> Evidence & Investigation Log
      </h2>

      <form onSubmit={submit} className="space-y-2 mb-4">
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none"
          >
            {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Investigator name"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Log evidence found, an investigative finding, or an action taken on this case…"
          rows={2}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none resize-none focus:border-cyan-500/50"
        />
        {error && <div className="text-[11px] text-rose-400">{error}</div>}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-40"
        >
          <Plus size={13} /> Add Entry
        </button>
      </form>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-xs text-slate-500">No evidence or notes logged yet for this complaint.</div>
        ) : (
          notes.map((n) => (
            <div key={n.note_id} className="bg-white/5 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${catColor[n.category] || catColor.Note}`}>{n.category}</span>
                  <span className="text-[10px] text-slate-500">{n.author} · {new Date(n.created_at).toLocaleString()}</span>
                </div>
                <button onClick={() => remove(n.note_id)} className="text-slate-600 hover:text-rose-400">
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-xs text-slate-300">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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

      <EvidenceLog complaintId={c.complaint_id} />
    </div>
  );
}
