// In local dev, Vite's proxy (vite.config.ts) forwards /api/* to localhost:8000.
// In production (e.g. deployed on Vercel), set VITE_API_BASE_URL to your
// deployed backend's URL, e.g. https://cybertrace-backend.onrender.com/api
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  health: () => fetch(`${BASE}/health`).then((r) => handle<any>(r)),
  dashboard: () => fetch(`${BASE}/dashboard`).then((r) => handle<any>(r)),
  complaints: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${BASE}/complaints?${qs}`).then((r) => handle<any>(r));
  },
  complaintDetail: (id: string) => fetch(`${BASE}/complaints/${id}`).then((r) => handle<any>(r)),
  transactions: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${BASE}/transactions?${qs}`).then((r) => handle<any>(r));
  },
  accounts: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${BASE}/accounts?${qs}`).then((r) => handle<any>(r));
  },
  locations: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/locations?${qs}`).then((r) => handle<any>(r));
  },
  alerts: () => fetch(`${BASE}/alerts`).then((r) => handle<any>(r)),
  reviewAlert: (id: string) =>
    fetch(`${BASE}/alerts/${id}/review`, { method: 'POST' }).then((r) => handle<any>(r)),
  network: (complaintId: string) => fetch(`${BASE}/network/${complaintId}`).then((r) => handle<any>(r)),
  predict: (complaint_id: string, account_id?: string) =>
    fetch(`${BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_id, account_id }),
    }).then((r) => handle<any>(r)),
  investigationSummary: (complaint_id: string) =>
    fetch(`${BASE}/investigation/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_id }),
    }).then((r) => handle<any>(r)),
  modelMetrics: () => fetch(`${BASE}/model/metrics`).then((r) => handle<any>(r)),
  runDemo: () => fetch(`${BASE}/demo/run`, { method: 'POST' }).then((r) => handle<any>(r)),
};
