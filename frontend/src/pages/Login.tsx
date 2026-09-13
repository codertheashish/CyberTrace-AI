import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, Lock, User, ShieldCheck, Terminal } from 'lucide-react';

// Demo-only credential gate. This is a client-side check for UI/demo purposes —
// it is NOT real authentication (anyone can read these values from the built
// JS bundle). For a production deployment, replace this with a real backend
// login endpoint that issues a session token.
const VALID_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const VALID_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'cybertrace@2026';

const BOOT_LINES = [
  'INITIALIZING CYBERTRACE AI SECURE TERMINAL…',
  'CONNECTING TO INTELLIGENCE DATABASE… OK',
  'LOADING PREDICTION ENGINE… OK',
  'VERIFYING INVESTIGATOR CREDENTIALS…',
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as any)?.from || '/dashboard';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [bootLine, setBootLine] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Enter an investigator ID and access key to continue.');
      return;
    }
    if (username.trim() !== VALID_USERNAME || password !== VALID_PASSWORD) {
      setError('ACCESS DENIED — invalid investigator ID or access key.');
      return;
    }
    setError('');
    setAuthenticating(true);
    setBootLine(0);
    BOOT_LINES.forEach((_, i) => {
      setTimeout(() => setBootLine(i + 1), (i + 1) * 450);
    });
    setTimeout(() => {
      localStorage.setItem('ct_authenticated', 'true');
      localStorage.setItem('ct_investigator', username.trim());
      navigate(destination);
    }, BOOT_LINES.length * 450 + 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center scanline-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm glass-panel rounded-2xl p-8 z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
            <Radar className="text-cyan-400" size={28} />
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">CyberTrace AI</h1>
          <p className="text-[11px] text-cyan-400/70 font-mono-tech tracking-widest">RESTRICTED ACCESS · CYBER CELL</p>
        </div>

        {!authenticating ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-wide">Investigator ID</label>
              <div className="relative mt-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={inputRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. investigator_01"
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-wide">Access Key</label>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {error && <div className="text-[11px] text-rose-400">{error}</div>}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              <ShieldCheck size={16} /> Authenticate
            </button>

            <p className="text-[10px] text-slate-600 text-center leading-relaxed pt-1">
              Demo credentials: <span className="text-slate-400 font-mono-tech">admin / cybertrace@2026</span>
              <br />(configurable via VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD)
            </p>
          </form>
        ) : (
          <div className="font-mono-tech text-xs text-emerald-400 space-y-2 py-4">
            {BOOT_LINES.slice(0, bootLine).map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <Terminal size={12} /> {line}
              </div>
            ))}
            {bootLine >= BOOT_LINES.length && (
              <div className="flex items-center gap-2 text-cyan-400 pt-1">
                <ShieldCheck size={12} /> ACCESS GRANTED — welcome, {username}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
