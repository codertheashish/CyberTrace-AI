"""
Builds a transaction network graph (accounts as nodes, transactions as edges)
for a given complaint using NetworkX, and serializes it for the frontend's
force-directed graph visualization.
"""
import networkx as nx

from app.database.db import query_df


def build_complaint_network(complaint_id: str):
    comp_rows = query_df("SELECT * FROM complaints WHERE complaint_id = ?", [complaint_id])
    if not comp_rows:
        raise ValueError(f"Complaint {complaint_id} not found")
    complaint = comp_rows[0]

    txns = query_df(
        "SELECT * FROM transactions WHERE complaint_id = ? ORDER BY timestamp ASC",
        [complaint_id],
    )

    G = nx.DiGraph()
    G.add_node(complaint["victim_account"], node_type="victim", risk=20)

    for t in txns:
        G.add_node(t["sender_account"], node_type=G.nodes.get(t["sender_account"], {}).get("node_type", "account"),
                    risk=max(G.nodes.get(t["sender_account"], {}).get("risk", 0), t["risk_score"]))
        G.add_node(t["receiver_account"], node_type="account", risk=max(
            G.nodes.get(t["receiver_account"], {}).get("risk", 0), t["risk_score"]))
        G.add_edge(t["sender_account"], t["receiver_account"], amount=t["amount"],
                   channel=t["channel"], timestamp=t["timestamp"], risk=t["risk_score"],
                   transaction_id=t["transaction_id"])

    # Mark the suspected account explicitly
    if complaint["suspected_account"] in G.nodes:
        G.nodes[complaint["suspected_account"]]["node_type"] = "suspected"
    if complaint["victim_account"] in G.nodes:
        G.nodes[complaint["victim_account"]]["node_type"] = "victim"

    # centrality -> importance for node sizing
    try:
        centrality = nx.degree_centrality(G)
    except Exception:  # noqa: BLE001
        centrality = {n: 0.1 for n in G.nodes}

    nodes = []
    for n, data in G.nodes(data=True):
        nodes.append({
            "id": n,
            "type": data.get("node_type", "account"),
            "risk": data.get("risk", 10),
            "importance": round(centrality.get(n, 0.1), 3),
        })

    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({
            "source": u,
            "target": v,
            "amount": data.get("amount"),
            "channel": data.get("channel"),
            "timestamp": data.get("timestamp"),
            "risk": data.get("risk"),
            "transaction_id": data.get("transaction_id"),
        })

    # Money-flow trace path: victim -> ... -> suspected account (longest simple path proxy)
    try:
        path = nx.shortest_path(G, source=complaint["victim_account"], target=complaint["suspected_account"])
    except Exception:  # noqa: BLE001
        path = [complaint["victim_account"], complaint["suspected_account"]]

    return {
        "complaint_id": complaint_id,
        "nodes": nodes,
        "edges": edges,
        "trace_path": path,
        "stats": {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "clusters": nx.number_weakly_connected_components(G),
        },
    }
