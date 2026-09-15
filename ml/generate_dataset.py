"""
CyberTrace AI - Synthetic Dataset Generator
=============================================
Generates a realistic, PATTERNED (not purely random) synthetic dataset that
mimics cybercrime complaint -> transaction -> withdrawal chains, so that a
downstream ML model can actually learn structure from it.

ALL DATA IS SYNTHETIC. No real people, accounts, or transactions are used.

Outputs CSVs files into backend/data/ :
  - locations.csv
  - accounts.csv
  - complaints.csv
  - transactions.csv
  - withdrawals.csv
  - ml_training_data.csv   (feature-engineered rows for model training)
"""

import numpy as np
import pandas as pd
import random
import uuid
from datetime import datetime, timedelta
import os

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
os.makedirs(OUT_DIR, exist_ok=True)

N_LOCATIONS = 100
N_ACCOUNTS = 500
N_COMPLAINTS = 1000
N_TRANSACTIONS = 10000
N_WITHDRAWALS = 300

CITIES = [
    ("Lucknow", "Uttar Pradesh", 26.8467, 80.9462),
    ("Delhi", "Delhi", 28.6139, 77.2090),
    ("Mumbai", "Maharashtra", 19.0760, 72.8777),
    ("Bengaluru", "Karnataka", 12.9716, 77.5946),
    ("Kanpur", "Uttar Pradesh", 26.4499, 80.3319),
    ("Jaipur", "Rajasthan", 26.9124, 75.7873),
    ("Patna", "Bihar", 25.5941, 85.1376),
    ("Hyderabad", "Telangana", 17.3850, 78.4867),
]

CHANNELS = ["UPI", "IMPS", "NEFT", "Card", "Wallet", "RTGS"]
COMPLAINT_TYPES = [
    "UPI Fraud", "Phishing", "OTP Fraud", "Fake Investment App",
    "Loan App Harassment", "SIM Swap Fraud", "Job Fraud", "Romance Scam",
    "Online Shopping Fraud", "Credit Card Fraud",
]
LOCATION_TYPES = ["ATM", "Bank Branch Cash Counter", "Merchant POS", "Cash Agent Point"]


def jitter(lat, lon, km=15):
    # ~0.009 degrees ~ 1 km
    dlat = np.random.uniform(-km, km) * 0.009
    dlon = np.random.uniform(-km, km) * 0.009
    return lat + dlat, lon + dlon


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlmb = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dlmb / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


# ---------------------------------------------------------------------------
# 1. LOCATIONS  (ATMs / withdrawal points). ~15% are "hotspot" locations that
#    repeatedly show up in fraud chains -> gives the model real signal.
# ---------------------------------------------------------------------------
locations = []
for i in range(N_LOCATIONS):
    city, state, base_lat, base_lon = random.choice(CITIES)
    lat, lon = jitter(base_lat, base_lon, km=20)
    is_hotspot = i < int(N_LOCATIONS * 0.15)
    locations.append({
        "location_id": f"ATM-{city[:3].upper()}-{i:03d}",
        "area": f"{city} Sector {random.randint(1, 40)}",
        "city": city,
        "state": state,
        "location_type": random.choice(LOCATION_TYPES),
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "is_hotspot": is_hotspot,
        "base_withdrawal_rate": 0.7 if is_hotspot else 0.15,
    })
loc_df = pd.DataFrame(locations)

# ---------------------------------------------------------------------------
# 2. ACCOUNTS. ~20% are "mule" accounts embedded in fraud rings; they have
#    higher connectivity, more devices, younger age, higher velocity.
# ---------------------------------------------------------------------------
accounts = []
n_mule = int(N_ACCOUNTS * 0.2)
for i in range(N_ACCOUNTS):
    is_mule = i < n_mule
    city, state, _, _ = random.choice(CITIES)
    accounts.append({
        "account_id": f"ACC{i:05d}",
        "account_type": "Mule/Suspicious" if is_mule else "Regular",
        "is_mule": is_mule,
        "city": city,
        "state": state,
        "account_age_days": int(np.random.exponential(60) + 5) if is_mule else int(np.random.uniform(180, 3000)),
        "linked_devices": np.random.randint(3, 9) if is_mule else np.random.randint(1, 3),
        "preferred_location_id": random.choice(loc_df[loc_df.is_hotspot]["location_id"].tolist()) if is_mule else random.choice(loc_df["location_id"].tolist()),
    })
acc_df = pd.DataFrame(accounts)
mule_ids = acc_df[acc_df.is_mule]["account_id"].tolist()
regular_ids = acc_df[~acc_df.is_mule]["account_id"].tolist()

# ---------------------------------------------------------------------------
# 3. COMPLAINTS
# ---------------------------------------------------------------------------
start_date = datetime(2025, 1, 1)
complaints = []
for i in range(N_COMPLAINTS):
    dt = start_date + timedelta(days=int(np.random.uniform(0, 260)), hours=int(np.random.uniform(0, 24)))
    city, state, _, _ = random.choice(CITIES)
    victim_acc = random.choice(regular_ids)
    suspected_acc = random.choice(mule_ids) if random.random() < 0.85 else random.choice(regular_ids)
    amount = round(float(np.random.lognormal(mean=8.5, sigma=1.1)), 2)  # skewed, INR-like
    amount = min(amount, 500000)
    is_high_risk = suspected_acc in mule_ids and amount > 10000
    risk_score = int(np.clip(np.random.normal(75 if is_high_risk else 35, 12), 5, 99))
    status = random.choices(
        ["Open", "Under Investigation", "Escalated", "Closed"],
        weights=[0.35, 0.35, 0.15, 0.15],
    )[0]
    complaints.append({
        "complaint_id": f"CMP-{1000 + i}",
        "date": dt.isoformat(),
        "complaint_type": random.choice(COMPLAINT_TYPES),
        "reported_amount": amount,
        "victim_account": victim_acc,
        "suspected_account": suspected_acc,
        "transaction_id": f"TXN{100000 + i}",
        "channel": random.choice(CHANNELS),
        "city": city,
        "state": state,
        "status": status,
        "risk_score": risk_score,
        "risk_label": "CRITICAL" if risk_score >= 85 else "HIGH" if risk_score >= 65 else "MEDIUM" if risk_score >= 40 else "LOW",
    })
comp_df = pd.DataFrame(complaints)

# ---------------------------------------------------------------------------
# 4. TRANSACTIONS. Build realistic chains: victim -> mule1 -> mule2 -> mule3
#    -> withdrawal, interleaved with a lot of background "normal" noise
#    transactions so the model has to learn to separate signal from noise.
# ---------------------------------------------------------------------------
transactions = []
txn_counter = 0


def new_txn(sender, receiver, amount, ts, channel, is_suspicious, complaint_id=None):
    global txn_counter
    txn_counter += 1
    city, state, _, _ = random.choice(CITIES)
    velocity = np.random.uniform(3, 12) if is_suspicious else np.random.uniform(0.1, 2)
    risk = int(np.clip(np.random.normal(80 if is_suspicious else 20, 10), 1, 99))
    return {
        "transaction_id": f"TXN{200000 + txn_counter}",
        "complaint_id": complaint_id,
        "timestamp": ts.isoformat(),
        "sender_account": sender,
        "receiver_account": receiver,
        "amount": round(amount, 2),
        "channel": channel,
        "city": city,
        "state": state,
        "is_suspicious": is_suspicious,
        "risk_score": risk,
        "transaction_velocity": round(velocity, 2),
    }


# 4a. Fraud chains tied to complaints
for _, c in comp_df.iterrows():
    if c.suspected_account not in mule_ids:
        continue
    ts = datetime.fromisoformat(c.date)
    chain_len = random.randint(2, 4)
    hop_accounts = [c.victim_account, c.suspected_account] + random.sample(
        [m for m in mule_ids if m != c.suspected_account], min(chain_len - 1, len(mule_ids) - 1)
    )
    remaining = c.reported_amount
    for h in range(len(hop_accounts) - 1):
        ts = ts + timedelta(minutes=int(np.random.uniform(5, 90)))
        hop_amt = remaining * np.random.uniform(0.6, 0.95)
        transactions.append(new_txn(
            hop_accounts[h], hop_accounts[h + 1], hop_amt, ts,
            random.choice(CHANNELS), True, c.complaint_id,
        ))
        remaining -= hop_amt * 0.05  # small skim/fees

# 4b. Background noise: normal, non-suspicious transactions between regular accounts
n_noise = max(0, N_TRANSACTIONS - len(transactions))
for _ in range(n_noise):
    sender, receiver = random.sample(regular_ids + mule_ids, 2)
    ts = start_date + timedelta(days=int(np.random.uniform(0, 260)), minutes=int(np.random.uniform(0, 1440)))
    amount = float(np.random.lognormal(mean=7.5, sigma=1.0))
    transactions.append(new_txn(sender, receiver, amount, ts, random.choice(CHANNELS), False, None))

txn_df = pd.DataFrame(transactions)

# ---------------------------------------------------------------------------
# 5. WITHDRAWALS. Mule accounts withdraw disproportionately at their
#    "preferred_location_id" (hotspot) -> the core learnable pattern.
# ---------------------------------------------------------------------------
withdrawals = []
acc_lookup = acc_df.set_index("account_id").to_dict("index")
for i in range(N_WITHDRAWALS):
    acc = random.choice(mule_ids) if random.random() < 0.7 else random.choice(regular_ids)
    info = acc_lookup[acc]
    if random.random() < info.get("linked_devices", 1) / 10 + 0.5 and acc in mule_ids:
        loc_id = info["preferred_location_id"]
    else:
        loc_id = random.choice(loc_df["location_id"].tolist())
    ts = start_date + timedelta(days=int(np.random.uniform(0, 260)), minutes=int(np.random.uniform(0, 1440)))
    amount = float(np.random.lognormal(mean=8.0, sigma=0.8))
    withdrawals.append({
        "withdrawal_id": f"WD{i:05d}",
        "account_id": acc,
        "location_id": loc_id,
        "timestamp": ts.isoformat(),
        "amount": round(amount, 2),
    })
wd_df = pd.DataFrame(withdrawals)

# ---------------------------------------------------------------------------
# 6. ML TRAINING TABLE - one row per (suspicious transaction / mule account
#    event), with the engineered features listed in the spec, and the target
#    = the location_id that account actually withdrew at (its most-used loc).
# ---------------------------------------------------------------------------
rows = []
loc_lookup = loc_df.set_index("location_id").to_dict("index")
wd_by_acc = wd_df.groupby("account_id")

all_loc_ids = loc_df["location_id"].tolist()
hotspot_ids = loc_df[loc_df.is_hotspot]["location_id"].tolist()

for _, c in comp_df[comp_df.suspected_account.isin(mule_ids)].iterrows():
    acc = c.suspected_account
    info = acc_lookup[acc]
    acc_txns = txn_df[(txn_df.sender_account == acc) | (txn_df.receiver_account == acc)]
    acc_wds = wd_by_acc.get_group(acc) if acc in wd_by_acc.groups else pd.DataFrame()

    # Realistic uncertainty: the account's preferred hotspot is only the eventual
    # withdrawal point ~65% of the time; otherwise it lands at another hotspot or
    # a random location. This avoids trivial 1:1 account->location memorization
    # and forces the model to rely on genuine behavioral/transaction signal.
    roll = random.random()
    if roll < 0.72:
        label_loc = info["preferred_location_id"]
    elif roll < 0.94:
        label_loc = random.choice(hotspot_ids)
    else:
        label_loc = random.choice(all_loc_ids)

    prev_loc = random.choice(all_loc_ids)
    prev = loc_lookup[prev_loc]
    lab = loc_lookup[label_loc]
    distance = haversine(prev["latitude"], prev["longitude"], lab["latitude"], lab["longitude"])

    # Add measurement-style noise to account-level features so they aren't a
    # perfect per-account fingerprint (real telemetry is noisy).
    noisy_age = max(1, int(info["account_age_days"] + np.random.normal(0, 8)))
    noisy_devices = max(1, int(info["linked_devices"] + np.random.choice([-1, 0, 0, 1])))
    noisy_velocity = max(0.0, (acc_txns.transaction_velocity.mean() if len(acc_txns) else 1.0) + np.random.normal(0, 1.5))
    noisy_linked = max(0, len(set(acc_txns.sender_account.tolist() + acc_txns.receiver_account.tolist())) - 1 + np.random.randint(-1, 2))

    ts = datetime.fromisoformat(c.date)
    rows.append({
        "transaction_id": c.transaction_id,
        "complaint_id": c.complaint_id,
        "account_id": acc,
        "amount": c.reported_amount,
        "timestamp": c.date,
        "hour": ts.hour,
        "day_of_week": ts.weekday(),
        "transaction_type": random.choice(CHANNELS),
        "sender_account": c.victim_account,
        "receiver_account": acc,
        "previous_withdrawal_location": prev_loc,
        "distance_from_previous_location": round(distance, 2),
        "withdrawal_frequency": len(acc_wds) + np.random.randint(0, 2),
        "average_withdrawal_amount": round((acc_wds.amount.mean() if len(acc_wds) else 5000.0) * np.random.uniform(0.85, 1.15), 2),
        "account_age_days": noisy_age,
        "transaction_velocity": round(noisy_velocity, 2),
        "linked_accounts": noisy_linked,
        "device_count": noisy_devices,
        "location_id": label_loc,
        "latitude": lab["latitude"],
        "longitude": lab["longitude"],
        "historical_location_frequency": len(wd_df[wd_df.location_id == label_loc]) + np.random.randint(0, 3),
        "time_since_last_withdrawal": round(np.random.uniform(0.5, 72), 2),
        "is_hotspot_location": lab["is_hotspot"],
        "risk_label": c.risk_label,
    })

ml_df = pd.DataFrame(rows)

# ---------------------------------------------------------------------------
# Save everything
# ---------------------------------------------------------------------------
loc_df.to_csv(os.path.join(OUT_DIR, "locations.csv"), index=False)
acc_df.to_csv(os.path.join(OUT_DIR, "accounts.csv"), index=False)
comp_df.to_csv(os.path.join(OUT_DIR, "complaints.csv"), index=False)
txn_df.to_csv(os.path.join(OUT_DIR, "transactions.csv"), index=False)
wd_df.to_csv(os.path.join(OUT_DIR, "withdrawals.csv"), index=False)
ml_df.to_csv(os.path.join(OUT_DIR, "ml_training_data.csv"), index=False)

print("Synthetic dataset generated:")
print(f"  locations.csv          : {len(loc_df)} rows")
print(f"  accounts.csv           : {len(acc_df)} rows")
print(f"  complaints.csv         : {len(comp_df)} rows")
print(f"  transactions.csv       : {len(txn_df)} rows")
print(f"  withdrawals.csv        : {len(wd_df)} rows")
print(f"  ml_training_data.csv   : {len(ml_df)} rows (target = location_id, {ml_df.location_id.nunique()} unique classes)")
