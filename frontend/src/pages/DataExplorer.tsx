import { useEffect, useState } from 'react';
import { Database, Download } from 'lucide-react';
import { api } from '../services/api';
import clsx from 'clsx';

const TABS = [
  { key: 'complaints', label: 'Complaints' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'locations', label: 'Locations' },
];

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DataExplorer() {
  const [tab, setTab] = useState('complaints');
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher =
      tab === 'complaints' ? api.complaints({ page_size: 50, search }) :
      tab === 'accounts' ? api.accounts({ page_size: 50 }) :
      tab === 'transactions' ? api.transactions({ page_size: 50 }) :
      api.locations({});
    fetcher.then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [tab, search]);

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Database size={20} className="text-cyan-400" /> Data Explorer</h1>
        <button
          onClick={() => download(`${tab}.csv`, toCSV(rows))}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              tab === t.key ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-white/10 text-slate-400 hover:bg-white/5'
            )}
          >
            {t.label}
          </button>
        ))}
        {tab === 'complaints' && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none ml-auto"
          />
        )}
      </div>

      <div className="glass-panel rounded-xl overflow-auto max-h-[600px]">
        <table className="w-full text-[11px]">
          <thead className="bg-white/5 text-slate-400 text-left font-mono-tech uppercase sticky top-0">
            <tr>{columns.map((c) => <th key={c} className="px-3 py-2 whitespace-nowrap">{c}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length || 1} className="px-3 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-cyan-500/5">
                  {columns.map((c) => <td key={c} className="px-3 py-1.5 whitespace-nowrap text-slate-300">{String(r[c])}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
