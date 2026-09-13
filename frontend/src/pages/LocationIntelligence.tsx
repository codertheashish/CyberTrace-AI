import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import L from 'leaflet';
import { Flame, MapPin } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import type { LocationRow } from '../types';

const RISK_COLOR: Record<string, string> = {
  LOW: '#34d399',
  MEDIUM: '#eab308',
  HIGH: '#fb923c',
  CRITICAL: '#f43f5e',
};

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    // @ts-ignore - leaflet.heat attaches heatLayer to the L namespace at runtime
    const layer = L.heatLayer(points, { radius: 28, blur: 22, maxZoom: 10, minOpacity: 0.35 });
    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [points, map]);
  return null;
}

export default function LocationIntelligence() {
  const [items, setItems] = useState<LocationRow[]>([]);
  const [risk, setRisk] = useState('');
  const [city, setCity] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [crimeTypes, setCrimeTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>([]);

  useEffect(() => {
    api.crimeTypes().then((d) => setCrimeTypes(d.items));
    api.locationsHeatmap().then((d) => setHeatPoints(d.points));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .locations({ risk, city, crime_type: crimeType, date_from: dateFrom, date_to: dateTo })
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, [risk, city, crimeType, dateFrom, dateTo]);

  const cities = Array.from(new Set(items.map((i) => i.city))).sort();
  const drillDownActive = !!(crimeType || dateFrom || dateTo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Location Intelligence</h1>
          <p className="text-sm text-slate-500">GIS risk heatmap of synthetic ATM / cash-withdrawal points, with drill-down by time, location, and crime category.</p>
        </div>
        <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setViewMode('markers')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${viewMode === 'markers' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            <MapPin size={13} /> Markers
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${viewMode === 'heatmap' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            <Flame size={13} /> Heatmap
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center gap-2">
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
        <select value={crimeType} onChange={(e) => setCrimeType(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
          <option value="">All Crime Categories</option>
          {crimeTypes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none" />
          <span>To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none" />
        </div>
        {(risk || city || crimeType || dateFrom || dateTo) && (
          <button
            onClick={() => { setRisk(''); setCity(''); setCrimeType(''); setDateFrom(''); setDateTo(''); }}
            className="text-xs text-cyan-400 hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {drillDownActive && (
        <div className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
          Showing {items.length} location(s) linked to complaints matching this crime category / time range
          (via real account→location relationships in the synthetic dataset).
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden" style={{ height: 560 }}>
        {!loading && (
          <MapContainer center={[22.5, 79]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {viewMode === 'heatmap' ? (
              <HeatLayer points={heatPoints} />
            ) : (
              items.map((loc) => (
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
                      {drillDownActive && <div>Linked Complaints: {(loc as any).linked_complaints}</div>}
                      <div>Risk Score: {loc.risk_score}/100</div>
                      <div>Risk Level: {loc.risk_level}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))
            )}
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
