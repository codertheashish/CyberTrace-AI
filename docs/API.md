# API Reference

Base URL (local dev): `http://localhost:8000`

Interactive Swagger UI: `http://localhost:8000/docs`

All responses are JSON. All predictive/analytical responses include a
disclaimer that results are probabilistic forecasts, not proof of criminal
activity.

---

## Health & Dashboard

### `GET /api/health`
Returns API status and whether the ML model loaded successfully.

### `GET /api/dashboard`
Returns dashboard KPIs (total complaints, high-risk complaints, suspicious
transactions, amount under investigation, predicted high-risk locations,
active alerts) and a monthly complaint-volume trend.

---

## Complaints

### `GET /api/complaints`
Query params: `search`, `status`, `risk`, `page`, `page_size`.
Returns a paginated list of complaints.

### `GET /api/complaints/{complaint_id}`
Returns complaint details, the suspected account, the full transaction
timeline for that complaint, and a behavior-analysis summary (velocity,
linked accounts, amount deviation, geographic movement, device count,
account age).

---

## Transactions

### `GET /api/transactions`
Query params: `complaint_id`, `suspicious_only`, `page`, `page_size`.
Returns a paginated list plus aggregate stats (total volume, suspicious %,
average amount, average velocity).

---

## Accounts

### `GET /api/accounts`
Query params: `is_mule` (bool), `page`, `page_size`.

---

## Locations

### `GET /api/locations`
Query params: `risk`, `city`.
Returns all synthetic ATM/withdrawal locations enriched with a computed
historical-withdrawal count, risk score (0–99), and risk level
(LOW/MEDIUM/HIGH/CRITICAL).

---

## Alerts

### `GET /api/alerts`
Returns real-time-style alerts seeded from high-risk complaints.

### `POST /api/alerts/{alert_id}/review`
Marks an alert as reviewed.

---

## Network Graph

### `GET /api/network/{complaint_id}`
Builds a NetworkX transaction graph for the complaint and returns:
```json
{
  "complaint_id": "CMP-1024",
  "nodes": [{ "id": "ACC00123", "type": "suspected", "risk": 91, "importance": 0.42 }],
  "edges": [{ "source": "ACC001", "target": "ACC002", "amount": 12500.0, "channel": "UPI", "risk": 88 }],
  "trace_path": ["ACC_victim", "ACC_mule1", "ACC_mule2"],
  "stats": { "node_count": 5, "edge_count": 4, "clusters": 1 }
}
```

---

## Prediction Engine

### `POST /api/predict`
Request body:
```json
{ "complaint_id": "CMP-1024", "account_id": null, "current_location": null }
```
Response:
```json
{
  "prediction_id": "PRED-AB12CD34",
  "complaint_id": "CMP-1024",
  "account_id": "ACC00055",
  "risk_level": "HIGH",
  "top_locations": [
    { "location_id": "ATM-LKO-042", "area": "Lucknow Sector 12", "latitude": 26.85, "longitude": 80.94, "probability": 0.82, "risk_score": 82 }
  ],
  "explanation": [
    "High historical withdrawal frequency for this account",
    "Elevated transaction velocity in recent activity window"
  ],
  "risk_breakdown": {
    "transaction_risk": 91, "network_risk": 84, "behavior_risk": 88, "location_risk": 82, "velocity_risk": 90
  },
  "disclaimer": "This is a probabilistic, AI-generated forecast for investigation prioritization only. It is not proof of criminal activity and must be independently verified by an authorized investigator."
}
```
Returns `503` if the model artifacts haven't been trained yet (run
`ml/train_model.py`), `404` if the complaint/account isn't found.

---

## Investigation Summary

### `POST /api/investigation/summary`
Request body: `{ "complaint_id": "CMP-1024" }`
Returns key findings, top-3 predicted locations, a recommended investigation
priority sentence, and a mandatory disclaimer.

---

## Model Metrics

### `GET /api/model/metrics`
Returns the real metrics computed by `ml/train_model.py` on the held-out test
set: selected model, validation scores per candidate, test accuracy/precision/
recall/F1, top-3 and top-5 location accuracy, and split sizes.

---

## Demo Mode

### `POST /api/demo/run`
Runs the entire pipeline server-side for the highest-risk sample complaint and
returns the complaint, its transactions, network graph, prediction, and
investigation summary in one payload — used by the frontend's animated Demo
Mode page.

---

## Error Handling

- `404` — entity not found (complaint/account/complaint network).
- `503` — ML model unavailable (not yet trained).
- `500` — unhandled server error; the response body never contains a raw
  stack trace, only `{"detail": "Internal server error. Please try again."}`.
