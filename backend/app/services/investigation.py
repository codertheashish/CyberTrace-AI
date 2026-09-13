from app.database.db import query_df
from app.ml.predictor import predict_locations
from app.graph.network import build_complaint_network


def generate_summary(complaint_id: str):
    comp_rows = query_df("SELECT * FROM complaints WHERE complaint_id = ?", [complaint_id])
    if not comp_rows:
        raise ValueError(f"Complaint {complaint_id} not found")
    complaint = comp_rows[0]

    network = build_complaint_network(complaint_id)
    prediction = predict_locations(complaint_id)

    key_findings = []
    n_accounts = len({n["id"] for n in network["nodes"]})
    if n_accounts > 2:
        key_findings.append(f"Rapid movement of funds across {n_accounts - 1} linked accounts")
    if network["stats"]["edge_count"] >= 3:
        key_findings.append("Unusual transaction velocity detected across the withdrawal chain")
    if prediction["top_locations"] and prediction["top_locations"][0]["probability"] > 0.5:
        key_findings.append("Strong historical similarity to previously flagged suspicious withdrawal patterns")
    if not key_findings:
        key_findings.append("Limited suspicious activity detected relative to comparable complaints")

    top_locs = prediction["top_locations"][:3]
    priority_line = (
        f"Investigate locations {', '.join(l['location_id'].split('-')[-1] for l in top_locs)} first."
        if top_locs else "No high-confidence locations identified; recommend manual review."
    )

    return {
        "complaint_id": complaint_id,
        "risk_level": prediction["risk_level"],
        "amount": complaint["reported_amount"],
        "key_findings": key_findings,
        "predicted_locations": top_locs,
        "recommended_priority": priority_line,
        "disclaimer": (
            "This is an AI-generated analytical recommendation based on synthetic "
            "demonstration data and must be independently verified by an authorized investigator."
        ),
    }
