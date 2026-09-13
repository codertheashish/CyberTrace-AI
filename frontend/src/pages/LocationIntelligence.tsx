import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { LocationRow } from '../types';

const RISK_COLOR: Record<string, string> = {
  LOW: '#34d399',
  MEDIUM: '#eab308',
  HIGH: '#fb923c',
  CRITICAL: '#f43f5e',
};

export default function LocationIntelligence() {
  const [items, setItems] = useState<LocationRow[]>([]);
  const [risk, setRisk] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.locations({ risk, city }).then((d) => setItems(d.items)).finally(() => setLoading(false));
  }, [risk, city]);

  const cities = Array.from(new Set(items.map((i) => i.city))).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Location Intelligence</h1>
          <p className="text-sm text-slate-500">Synthetic ATM / cash-withdrawal points, colored by predicted risk.</p>
        </div>
        <div className="flex gap-2">
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
            <option value="">All Risk Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
            <option value="">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden" style={{ height: 560 }}>
        {!loading && (
          <MapContainer center={[22.5, 79]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {items.map((loc) => (
              <CircleMarker
                key={loc.location_id}
                center={[loc.latitude, loc.longitude]}
                radius={6 + loc.risk_score / 12}
                pathOptions={{ color: RISK_COLOR[loc.risk_level], fillColor: RISK_COLOR[loc.risk_level], fillOpacity: 0.55 }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold">{loc.location_id}</div>
                    <div>{loc.area}</div>
                    <div>Type: {loc.location_type}</div>
                    <div>Historical Withdrawals: {loc.historical_withdrawal_count}</div>
                    <div>Risk Score: {loc.risk_score}/100</div>
                    <div>Risk Level: {loc.risk_level}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
          <div key={r} className="glass-panel rounded-xl p-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: RISK_COLOR[r] }} />
            <span className="text-xs text-slate-400">{r}</span>
            <RiskBadge level={r} />
          </div>
        ))}
      </div>
    </div>
  );
}
