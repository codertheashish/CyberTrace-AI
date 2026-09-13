import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Share2, Zap } from 'lucide-react';
import { api } from '../services/api';
import type { NetworkGraph } from '../types';

interface PositionedNode {
  id: string;
  type: string;
  risk: number;
  importance: number;
  x: number;
  y: number;
}

const TYPE_COLOR: Record<string, string> = {
  victim: '#3b82f6',
  suspected: '#f43f5e',
  account: '#22d3ee',
};

function layoutNodes(nodes: NetworkGraph['nodes'], width: number, height: number): PositionedNode[] {
  const n = nodes.length || 1;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 60;
  return nodes.map((node, i) => {
    const angle = (i / n) * Math.PI * 2;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

export default function NetworkGraphPage() {
  const [params] = useSearchParams();
  const [complaintId, setComplaintId] = useState(params.get('complaint') || '');
  const [graph, setGraph] = useState<NetworkGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [traced, setTraced] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 900, h: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: 520 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const load = (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setTraced(false);
    api.network(id).then(setGraph).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (complaintId) load(complaintId);
    else {
      api.complaints({ risk: 'CRITICAL', page_size: 1 }).then((d) => {
        const id = d.items?.[0]?.complaint_id;
        if (id) { setComplaintId(id); load(id); }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const positioned = graph ? layoutNodes(graph.nodes, dims.w, dims.h) : [];
  const posById = Object.fromEntries(positioned.map((n) => [n.id, n]));
  const tracePairs = new Set<string>();
  if (graph && traced) {
    for (let i = 0; i < graph.trace_path.length - 1; i++) {
      tracePairs.add(`${graph.trace_path[i]}->${graph.trace_path[i + 1]}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Transaction Network Graph</h1>
          <p className="text-sm text-slate-500">Money-flow topology from victim to suspected cash-out accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(complaintId)}
            placeholder="CMP-1024"
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs w-36 outline-none focus:border-cyan-500/50 font-mono-tech"
          />
          <button onClick={() => load(complaintId)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5">Load</button>
          <button
            onClick={() => setTraced((t) => !t)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
          >
            <Zap size={14} /> Trace Money Flow
          </button>
        </div>
      </div>

      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {graph && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 glass-panel rounded-xl p-2" ref={containerRef}>
            <svg width="100%" height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`}>
              {graph.edges.map((e, i) => {
                const s = posById[e.source];
                const t = posById[e.target];
                if (!s || !t) return null;
                const isTraced = tracePairs.has(`${e.source}->${e.target}`);
                return (
                  <g key={i}>
                    <line
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke={isTraced ? '#22d3ee' : 'rgba(148,163,184,0.25)'}
                      strokeWidth={isTraced ? 2.5 : 1}
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="rgba(148,163,184,0.4)" />
                </marker>
              </defs>
              {positioned.map((n) => (
                <g key={n.id}>
                  <circle
                    cx={n.x} cy={n.y}
                    r={10 + n.importance * 25}
                    fill={TYPE_COLOR[n.type] || '#94a3b8'}
                    fillOpacity={0.25}
                    stroke={TYPE_COLOR[n.type] || '#94a3b8'}
                    strokeWidth={2}
                  />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={9} fill="#e2e8f0" className="font-mono-tech">
                    {n.id.replace('ACC', '')}
                  </text>
                  <text x={n.x} y={n.y + (18 + n.importance * 25)} textAnchor="middle" fontSize={8} fill="#64748b">
                    {n.type}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2"><Share2 size={14} /> Graph Stats</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Nodes</span><span className="text-white">{graph.stats.node_count}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Edges</span><span className="text-white">{graph.stats.edge_count}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Clusters</span><span className="text-white">{graph.stats.clusters}</span></div>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white mb-3">Trace Path</h3>
              <div className="flex flex-col gap-1 text-[11px] font-mono-tech">
                {graph.trace_path.map((p, i) => (
                  <div key={i} className={`px-2 py-1 rounded ${traced ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>{p}</div>
                ))}
              </div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed">
              Node size reflects degree centrality (importance) in the transaction graph. Red = suspected account, blue = victim, cyan = intermediate accounts.
            </div>
          </div>
        </div>
      )}

      {loading && <div className="text-slate-500 text-sm">Building network graph…</div>}
    </div>
  );
}
