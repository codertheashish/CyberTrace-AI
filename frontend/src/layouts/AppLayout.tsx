import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, FileWarning, ArrowLeftRight, Share2, MapPinned,
  Sparkles, Bell, BarChart3, Database, Info, ShieldCheck, Search, Radar, LogOut, Settings,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/complaints', label: 'Cybercrime Complaints', icon: FileWarning },
  { to: '/transactions', label: 'Transaction Intelligence', icon: ArrowLeftRight },
  { to: '/network', label: 'Network Graph', icon: Share2 },
  { to: '/locations', label: 'Location Intelligence', icon: MapPinned },
  { to: '/predictions', label: 'Predictions', icon: Sparkles },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/explorer', label: 'Data Explorer', icon: Database },
  { to: '/system', label: 'System Information', icon: Info },
  { to: '/admin-settings', label: 'Admin Settings', icon: Settings },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/complaints?search=${encodeURIComponent(q)}`);
  };

  const logout = () => {
    localStorage.removeItem('ct_authenticated');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex text-slate-200">
      <aside className="w-64 shrink-0 border-r border-cyan-500/10 glass-panel flex flex-col">
        <div className="px-5 py-5 border-b border-cyan-500/10 flex items-center gap-2">
          <Radar className="text-cyan-400" size={26} />
          <div>
            <div className="font-bold tracking-wide text-white leading-tight">CyberTrace AI</div>
            <div className="text-[10px] text-cyan-400/70 font-mono-tech">INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-colors ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-cyan-500/10 text-[11px] text-slate-500 leading-relaxed">
          <ShieldCheck size={14} className="inline mr-1 -mt-0.5 text-cyan-500/70" />
          Decision-support prototype. Synthetic demo data only. Predictions are probabilistic, not proof.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-cyan-500/10 glass-panel flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-mono-tech px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" /> SYSTEM ONLINE
            </span>
            <span className="text-xs font-mono-tech px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              DEMO DATA · SYNTHETIC
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search complaints, accounts, locations…"
                className="bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs w-72 outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
              />
            </div>
            <button className="relative text-slate-400 hover:text-white">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            <button onClick={logout} title="Log out" className="text-slate-400 hover:text-rose-400">
              <LogOut size={16} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {(localStorage.getItem('ct_investigator') || 'IV').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-medium text-white">{localStorage.getItem('ct_investigator') || 'Investigator'}</div>
                <div className="text-[10px] text-slate-500">Cyber Cell, Auth. Access</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scanline-grid">
          <div className="p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
