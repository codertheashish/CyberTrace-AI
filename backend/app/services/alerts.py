import json
import random
import uuid
from datetime import datetime, timedelta

from app.database.db import get_conn, query_df

ALERT_TYPES = [
    "High-risk location prediction",
    "Unusual transaction velocity",
    "Suspicious account cluster",
    "Rapid fund movement",
    "Multiple linked accounts",
]


def ensure_alerts_seeded(n=25):
    existing = query_df("SELECT COUNT(*) as c FROM alerts")[0]["c"]
    if existing >= n:
        return
    high_risk = query_df(
        "SELECT * FROM complaints WHERE risk_label IN ('HIGH','CRITICAL') ORDER BY date DESC LIMIT ?",
        [n],
    )
    locations = query_df("SELECT * FROM locations WHERE is_hotspot = 1")
    conn = get_conn()
    for c in high_risk:
        loc = random.choice(locations) if locations else None
        alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
        conn.execute(
            "INSERT OR REPLACE INTO alerts (alert_id, alert_type, location_id, complaint_id, "
            "probability, amount, risk_level, created_at, status) VALUES (?,?,?,?,?,?,?,?,?)",
            [
                alert_id, random.choice(ALERT_TYPES), loc["location_id"] if loc else None,
                c["complaint_id"], round(random.uniform(0.55, 0.95), 2), c["reported_amount"],
                c["risk_label"], (datetime.utcnow() - timedelta(hours=random.randint(0, 72))).isoformat(),
                "Open",
            ],
        )
    conn.commit()
    conn.close()


def list_alerts():
    return query_df("SELECT * FROM alerts ORDER BY created_at DESC")


def mark_reviewed(alert_id: str):
    conn = get_conn()
    conn.execute("UPDATE alerts SET status = 'Reviewed' WHERE alert_id = ?", [alert_id])
    conn.commit()
    conn.close()
    return {"alert_id": alert_id, "status": "Reviewed"}


VALID_CHANNELS = {"email", "sms", "api", "dashboard"}


def send_notification(alert_id: str, channels: list[str]):
    """Simulates dispatching an alert over the requested channels (email/SMS/
    API webhook/dashboard). No real email/SMS provider is wired up in this
    demo — each dispatch is logged to notification_log so the UI can show a
    real, persisted delivery history rather than a fake toast that vanishes.
    """
    alert_rows = query_df("SELECT * FROM alerts WHERE alert_id = ?", [alert_id])
    if not alert_rows:
        raise ValueError(f"Alert {alert_id} not found")

    conn = get_conn()
    results = []
    for ch in channels:
        ch = ch.lower()
        if ch not in VALID_CHANNELS:
            continue
        notif_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        recipient = {
            "email": "cybercell-alerts@i4c.gov.in (simulated)",
            "sms": "+91-XXXXXXXXXX (simulated)",
            "api": "https://partner-bank.example/webhook (simulated)",
            "dashboard": "Investigator Dashboard",
        }[ch]
        conn.execute(
            "INSERT INTO notification_log (notification_id, alert_id, channel, recipient, sent_at, status) "
            "VALUES (?,?,?,?,?,?)",
            [notif_id, alert_id, ch, recipient, datetime.utcnow().isoformat(), "Delivered"],
        )
        results.append({"notification_id": notif_id, "channel": ch, "recipient": recipient, "status": "Delivered"})
    conn.commit()
    conn.close()
    return results


def notification_history(alert_id: str = None):
    if alert_id:
        return query_df("SELECT * FROM notification_log WHERE alert_id = ? ORDER BY sent_at DESC", [alert_id])
    return query_df("SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 100")
