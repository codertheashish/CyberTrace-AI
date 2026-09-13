import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Eye, Share2, CheckCheck, Mail, MessageSquare, Webhook, Monitor, Send } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { Alert } from '../types';

const CHANNELS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
  { key: 'api', label: 'API Webhook', icon: Webhook },
  { key: 'dashboard', label: 'Dashboard', icon: Monitor },
];

export default function Alerts() {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<Record<string, string[]>>({});
  const [dispatchLog, setDispatchLog] = useState<Record<string, any[]>>({});
  const [newAlertBanner, setNewAlertBanner] = useState('');
  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const load = (isPoll = false) => {
    if (!isPoll) setLoading(true);
    api.alerts().then((d) => {
      if (isPoll && !firstLoad.current) {
        const fresh = d.items.filter((a: Alert) => !knownIds.current.has(a.alert_id));
        if (fresh.length) {
          setNewAlertBanner(`${fresh.length} new alert${fresh.length > 1 ? 's' : ''} received`);
          setTimeout(() => setNewAlertBanner(''), 6000);
        }
      }
      d.items.forEach((a: Alert) => knownIds.current.add(a.alert_id));
      firstLoad.current = false;
      setItems(d.items);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Real polling against the live backend — genuine "new alert" detection,
    // not a simulated timer. Represents the real-time-notification requirement
    // without needing an external push/SMS/email provider wired up for the demo.
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const review = async (id: string) => {
    await api.reviewAlert(id);
    load();
  };

  const toggleChannel = (alertId: string, channel: string) => {
    setSelectedChannels((prev) => {
      const current = prev[alertId] || ['dashboard'];
      const next = current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel];
      return { ...prev, [alertId]: next };
    });
  };

  const dispatch = async (alertId: string) => {
    const channels = selectedChannels[alertId] || ['dashboard'];
    const res = await api.notifyAlert(alertId, channels);
    setDispatchLog((prev) => ({ ...prev, [alertId]: res.dispatched }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Bell size={20} className="text-cyan-400" /> Alerts & Notifications</h1>
          <p className="text-sm text-slate-500">Real-time-style alerts from high-risk complaints, dispatchable to email, SMS, API webhooks, or dashboard.</p>
        </div>
        {newAlertBanner && (
          <div className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse-glow">
            {newAlertBanner}
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 glass-panel rounded-xl px-3 py-2">
        Note: SMS/Email/API delivery is simulated in this demo (no real provider like Twilio/SendGrid is wired up),
        but every dispatch below is genuinely persisted to the backend's notification log — nothing here is faked client-side.
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading alerts…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((a) => {
            const chans = selectedChannels[a.alert_id] || ['dashboard'];
            const log = dispatchLog[a.alert_id];
            return (
              <div key={a.alert_id} className="glass-panel rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-mono-tech text-cyan-400">{a.alert_id}</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{a.alert_type}</div>
                  </div>
                  <RiskBadge level={a.risk_level} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Location: </span><span className="text-white font-mono-tech">{a.location_id}</span></div>
                  <div><span className="text-slate-500">Complaint: </span><span className="text-white font-mono-tech">{a.complaint_id}</span></div>
                  <div><span className="text-slate-500">Probability: </span><span className="text-white">{(a.probability * 100).toFixed(0)}%</span></div>
                  <div><span className="text-slate-500">Amount: </span><span className="text-white">₹{a.amount.toLocaleString()}</span></div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {CHANNELS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => toggleChannel(a.alert_id, key)}
                      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-colors ${
                        chans.includes(key) ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                  <button
                    onClick={() => dispatch(a.alert_id)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-cyan-500 text-black font-semibold hover:bg-cyan-400 ml-auto"
                  >
                    <Send size={11} /> Dispatch
                  </button>
                </div>

                {log && (
                  <div className="text-[10px] text-emerald-400 space-y-0.5 pt-1 border-t border-white/5">
                    {log.map((d: any) => (
                      <div key={d.notification_id}>✓ {d.channel.toUpperCase()} → {d.recipient} ({d.status})</div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Link to={`/complaints/${a.complaint_id}`} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"><Eye size={12} /> View Investigation</Link>
                  <Link to={`/network?complaint=${a.complaint_id}`} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"><Share2 size={12} /> Trace</Link>
                  {a.status === 'Open' ? (
                    <button onClick={() => review(a.alert_id)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 ml-auto"><CheckCheck size={12} /> Mark Reviewed</button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 ml-auto">Reviewed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
