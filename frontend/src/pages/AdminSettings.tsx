import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, RotateCcw, LogOut } from 'lucide-react';
import { getCredentials, setCredentials, resetCredentials } from '../utils/auth';

export default function AdminSettings() {
  const navigate = useNavigate();
  const current = getCredentials();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(current.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { password: validPass } = getCredentials();
    if (currentPassword !== validPass) {
      setError('Current access key is incorrect.');
      return;
    }
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('New investigator ID and access key cannot be empty.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New access key and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New access key should be at least 6 characters.');
      return;
    }

    setCredentials(newUsername.trim(), newPassword);
    setSuccess('Credentials updated. You will be logged out — sign in again with the new details.');
    localStorage.removeItem('ct_authenticated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const restoreDefault = () => {
    resetCredentials();
    localStorage.removeItem('ct_authenticated');
    navigate('/login');
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <KeyRound size={20} className="text-cyan-400" /> Admin Settings
        </h1>
        <p className="text-sm text-slate-500">
          Change the investigator ID / access key used to log into this dashboard.
        </p>
      </div>

      <div className="glass-panel rounded-xl p-5 text-xs text-slate-400 leading-relaxed">
        Currently signed in as <span className="text-white font-mono-tech">{current.username}</span>.
        {current.isCustom
          ? ' A custom login has been set on this browser.'
          : ' Using the default demo credentials (set via VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD, or change them below).'}
      </div>

      <form onSubmit={save} className="glass-panel rounded-xl p-5 space-y-4">
        <div>
          <label className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-wide">Current Access Key</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Confirm your current password"
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-wide">New Investigator ID</label>
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-wide">New Access Key</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-wide">Confirm New Access Key</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
          />
        </div>

        {error && <div className="text-[11px] text-rose-400">{error}</div>}
        {success && <div className="text-[11px] text-emerald-400">{success}</div>}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          <ShieldCheck size={16} /> Update Credentials
        </button>
      </form>

      {success && (
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-xs text-cyan-400 hover:underline"
        >
          <LogOut size={13} /> Go to login now
        </button>
      )}

      <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Revert to the default demo credentials (removes any custom login saved on this browser).
        </div>
        <button
          onClick={restoreDefault}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 shrink-0 ml-3"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <p className="text-[10px] text-slate-600 leading-relaxed">
        Note: this credential gate is stored in this browser's local storage only — it's a UI-level
        demo gate, not real server-side authentication. Clearing browser data or using a different
        browser/device will reset access to the default (or env-configured) credentials.
      </p>
    </div>
  );
}
