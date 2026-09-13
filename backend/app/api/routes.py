from datetime import datetime
import math

from fastapi import APIRouter, HTTPException, Query

from app.database.db import query_df
from app.ml.predictor import predict_locations, model_available, get_metrics
from app.graph.network import build_complaint_network
from app.services.investigation import generate_summary
from app.services import alerts as alerts_service
from app.schemas.schemas import PredictRequest, InvestigationSummaryRequest

router = APIRouter(prefix="/api")


def clean(rows):
    """Replace NaN/inf so JSON serialization never breaks."""
    out = []
    for r in rows:
        d = dict(r)
        for k, v in d.items():
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                d[k] = None
        out.append(d)
    return out


@router.get("/health")
def health():
    return {"status": "ok", "model_available": model_available(), "time": datetime.utcnow().isoformat()}


@router.get("/dashboard")
def dashboard():
    total_complaints = query_df("SELECT COUNT(*) c FROM complaints")[0]["c"]
    high_risk = query_df("SELECT COUNT(*) c FROM complaints WHERE risk_label IN ('HIGH','CRITICAL')")[0]["c"]
    suspicious_txns = query_df("SELECT COUNT(*) c FROM transactions WHERE is_suspicious = 1")[0]["c"]
    amount_under_investigation = query_df(
        "SELECT SUM(reported_amount) s FROM complaints WHERE status != 'Closed'"
    )[0]["s"] or 0
    predicted_high_risk_locations = query_df(
        "SELECT COUNT(*) c FROM locations WHERE is_hotspot = 1"
    )[0]["c"]
    alerts_service.ensure_alerts_seeded()
    active_alerts = query_df("SELECT COUNT(*) c FROM alerts WHERE status = 'Open'")[0]["c"]

    trend = query_df(
        "SELECT substr(date,1,7) as month, COUNT(*) as c FROM complaints GROUP BY month ORDER BY month"
    )

    return {
        "kpis": {
            "total_complaints": total_complaints,
            "high_risk_complaints": high_risk,
            "suspicious_transactions": suspicious_txns,
            "amount_under_investigation": round(amount_under_investigation, 2),
            "predicted_high_risk_locations": predicted_high_risk_locations,
            "active_alerts": active_alerts,
        },
        "monthly_trend": trend,
        "model_status": "ONLINE" if model_available() else "UNAVAILABLE",
    }


@router.get("/complaints")
def list_complaints(
    search: str = "", status: str = "", risk: str = "",
    page: int = 1, page_size: int = 20,
):
    where = []
    params = []
    if search:
        where.append("(complaint_id LIKE ? OR complaint_type LIKE ? OR city LIKE ?)")
        params += [f"%{search}%"] * 3
    if status:
        where.append("status = ?")
        params.append(status)
    if risk:
        where.append("risk_label = ?")
        params.append(risk)
    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    total = query_df(f"SELECT COUNT(*) c FROM complaints {where_sql}", params)[0]["c"]
    offset = (page - 1) * page_size
    rows = query_df(
        f"SELECT * FROM complaints {where_sql} ORDER BY date DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    )
    return {"total": total, "page": page, "page_size": page_size, "items": clean(rows)}


@router.get("/complaints/{complaint_id}")
def complaint_detail(complaint_id: str):
    rows = query_df("SELECT * FROM complaints WHERE complaint_id = ?", [complaint_id])
    if not rows:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint = clean(rows)[0]

    txns = query_df(
        "SELECT * FROM transactions WHERE complaint_id = ? ORDER BY timestamp ASC", [complaint_id]
    )
    account = query_df("SELECT * FROM accounts WHERE account_id = ?", [complaint["suspected_account"]])
    account = clean(account)[0] if account else None

    behavior = {
        "transaction_velocity": round(sum(t["transaction_velocity"] for t in txns) / len(txns), 2) if txns else 0,
        "linked_accounts": len({t["sender_account"] for t in txns} | {t["receiver_account"] for t in txns}),
        "amount_deviation_pct": round(((complaint["reported_amount"] - 15000) / 15000) * 100, 1),
        "geographic_movement": len({t["city"] for t in txns}),
        "withdrawal_frequency": account["linked_devices"] if account else 0,
        "device_count": account["linked_devices"] if account else 0,
        "account_age_days": account["account_age_days"] if account else None,
    }

    return {
        "complaint": complaint,
        "account": account,
        "transaction_timeline": clean(txns),
        "behavior_analysis": behavior,
    }


@router.get("/transactions")
def list_transactions(complaint_id: str = "", suspicious_only: bool = False, page: int = 1, page_size: int = 25):
    where = []
    params = []
    if complaint_id:
        where.append("complaint_id = ?")
        params.append(complaint_id)
    if suspicious_only:
        where.append("is_suspicious = 1")
    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    total = query_df(f"SELECT COUNT(*) c FROM transactions {where_sql}", params)[0]["c"]
    offset = (page - 1) * page_size
    rows = query_df(
        f"SELECT * FROM transactions {where_sql} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    )
    agg = query_df(
        "SELECT COUNT(*) total, SUM(is_suspicious) suspicious, AVG(amount) avg_amt, AVG(transaction_velocity) avg_vel FROM transactions"
    )[0]
    return {
        "total": total, "page": page, "page_size": page_size, "items": clean(rows),
        "stats": {
            "total_volume": agg["total"],
            "suspicious_pct": round(100 * (agg["suspicious"] or 0) / max(agg["total"], 1), 2),
            "avg_amount": round(agg["avg_amt"] or 0, 2),
            "avg_velocity": round(agg["avg_vel"] or 0, 2),
        },
    }


@router.get("/accounts")
def list_accounts(is_mule: bool = None, page: int = 1, page_size: int = 25):
    where_sql = ""
    params = []
    if is_mule is not None:
        where_sql = "WHERE is_mule = ?"
        params.append(1 if is_mule else 0)
    total = query_df(f"SELECT COUNT(*) c FROM accounts {where_sql}", params)[0]["c"]
    offset = (page - 1) * page_size
    rows = query_df(f"SELECT * FROM accounts {where_sql} LIMIT ? OFFSET ?", params + [page_size, offset])
    return {"total": total, "page": page, "page_size": page_size, "items": clean(rows)}


@router.get("/locations")
def list_locations(risk: str = "", city: str = ""):
    where = []
    params = []
    if city:
        where.append("city = ?")
        params.append(city)
    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    rows = clean(query_df(f"SELECT * FROM locations {where_sql}", params))

    wd_counts = {r["location_id"]: r["c"] for r in query_df(
        "SELECT location_id, COUNT(*) c FROM withdrawals GROUP BY location_id"
    )}
    for r in rows:
        hist = wd_counts.get(r["location_id"], 0)
        base_score = 20 + hist * 8 + (25 if r["is_hotspot"] else 0)
        r["historical_withdrawal_count"] = hist
        r["risk_score"] = min(99, base_score)
        r["risk_level"] = (
            "CRITICAL" if r["risk_score"] >= 80 else
            "HIGH" if r["risk_score"] >= 60 else
            "MEDIUM" if r["risk_score"] >= 35 else "LOW"
        )
    if risk:
        rows = [r for r in rows if r["risk_level"] == risk]
    return {"items": rows}


@router.get("/alerts")
def get_alerts():
    alerts_service.ensure_alerts_seeded()
    return {"items": clean(alerts_service.list_alerts())}


@router.post("/alerts/{alert_id}/review")
def review_alert(alert_id: str):
    return alerts_service.mark_reviewed(alert_id)


@router.get("/predictions")
def list_predictions(page: int = 1, page_size: int = 25):
    total = query_df("SELECT COUNT(*) c FROM predictions")[0]["c"]
    offset = (page - 1) * page_size
    rows = query_df(
        "SELECT * FROM predictions ORDER BY created_at DESC LIMIT ? OFFSET ?", [page_size, offset]
    )
    return {"total": total, "items": clean(rows)}


@router.get("/network/{complaint_id}")
def network(complaint_id: str):
    try:
        return build_complaint_network(complaint_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/predict")
def predict(req: PredictRequest):
    if not model_available():
        raise HTTPException(status_code=503, detail="Prediction model unavailable. Run ml/train_model.py first.")
    try:
        result = predict_locations(req.complaint_id, req.account_id)
        result["disclaimer"] = (
            "This is a probabilistic, AI-generated forecast for investigation "
            "prioritization only. It is not proof of criminal activity and must "
            "be independently verified by an authorized investigator."
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/investigation/summary")
def investigation_summary(req: InvestigationSummaryRequest):
    try:
        return generate_summary(req.complaint_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/model/metrics")
def model_metrics():
    return get_metrics()


@router.post("/demo/run")
def run_demo():
    """Runs the full demo pipeline server-side and returns everything the
    frontend needs to animate through, in one call."""
    if not model_available():
        raise HTTPException(status_code=503, detail="Prediction model unavailable. Run ml/train_model.py first.")

    complaint_rows = query_df(
        "SELECT * FROM complaints WHERE risk_label = 'CRITICAL' ORDER BY reported_amount DESC LIMIT 1"
    )
    if not complaint_rows:
        complaint_rows = query_df("SELECT * FROM complaints ORDER BY risk_score DESC LIMIT 1")
    complaint = clean(complaint_rows)[0]

    txns = clean(query_df(
        "SELECT * FROM transactions WHERE complaint_id = ? ORDER BY timestamp ASC", [complaint["complaint_id"]]
    ))
    net = build_complaint_network(complaint["complaint_id"])
    pred = predict_locations(complaint["complaint_id"])
    summary = generate_summary(complaint["complaint_id"])

    return {
        "complaint": complaint,
        "transactions": txns,
        "network": net,
        "prediction": pred,
        "summary": summary,
    }
