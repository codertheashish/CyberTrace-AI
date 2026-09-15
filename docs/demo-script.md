# CyberTrace AI — Demo Script (3–5 minutes)

## 1. Hook (30s)
"Every year, cybercrime victims lose money that gets funneled through mule
accounts and cashed out at an ATM within hours. By the time an FIR is filed,
investigators are chasing a trail that's already gone cold. The hard question
isn't 'who did it' — it's 'where will they cash out next?' That's what
CyberTrace AI is built to forecast."

## 2. The Problem (30s)
- Thousands of complaints, tens of thousands of transactions, hundreds of
  possible cash-out points.
- Manually tracing account chains and guessing likely ATMs doesn't scale.
- Existing systems flag *that* fraud happened — not *where* the cash will
  surfaces.

## 3. Introduce CyberTrace AI (20s)
"CyberTrace AI takes a cybercrime complaint, traces the transaction network
behind it, and uses a trained machine learning model to rank the most likely
cash-withdrawal locations — with a clear, explainable reason for every
prediction. It's a decision-support tool: it prioritizes where investigators
should look first. It never claims certainty, and everything you'll see runs
on synthetic demo data."

## 4. Open the Dashboard (20s)
- Show the KPI cards: total complaints, high-risk complaints, suspicious
  transactions, amount under investigation.
- Point out the "SYSTEM ONLINE" and "DEMO DATA" indicators — this is a live
  backend, not mocked screens.

## 5. Select a Complaint (20s)
- Go to Cybercrime Complaints, filter by CRITICAL risk.
- Open one complaint's detail page — show the amount, victim/suspected
  accounts, and the visual transaction timeline.

## 6. Show the Transaction Chain (20s)
- Point to the victim → account A → account B → account C chain.
- Highlight the behavior-analysis panel: transaction velocity, linked
  accounts, geographic movement.

## 7. Show the Suspicious Network (30s)
- Open Network Graph for the same complaint.
- Click "Trace Money Flow" — the path from victim to the suspected account
  lights up.
- Note node sizing = importance (degree centrality) in the graph.

## 8. Run the Prediction (30s)
- Open Predictions for the complaint (or just click "RUN LIVE DEMO" from the
  dashboard for the full guided flow).
- The model returns its top 5 ranked locations with probabilities — this is a
  real RandomForest model trained on the synthetic dataset, not a random
  number generator.

## 9. Show Top Predicted Locations (15s)
- Call out the #1 location's probability and risk score.

## 10. Open the Map (20s)
- Location Intelligence page — the predicted top location is a colored marker
  (orange/red = high risk).
- Filter by risk level to show the full hotspot landscape.

## 11. Explain Why (20s)
- Point to the "Why this prediction?" panel — human-readable reasons drawn
  from the model's real feature importances (withdrawal frequency, transaction
  velocity, historical location frequency, etc.)

## 12. Show the Risk Score (15s)
- Point to the composite Overall Risk Score and its five components
  (transaction / network / behavior / location / velocity risk).

## 13. Generate the Investigation Summary (20s)
- Click through to the investigation summary — key findings, ranked
  locations, and a recommended priority line, ending with the mandatory
  disclaimer that this must be independently verified.

## 14. Close: Impact & Scalability (20s)
"This whole pipeline — complaint to network graph to ranked prediction to
investigation summary — runs in under a second per case. At scale, this means
a cyber cell can triage hundreds of open complaints and know exactly which
five ATMs to watch first, instead of reading transaction logs by hand. And
because the architecture is model-agnostic and API-first, it's built to grow
into real-time feeds, graph neural networks, and multi-agency data sharing —
without changing the frontend at all."

---

**Total runtime: ~4 minutes.** The "RUN LIVE DEMO" button collapses steps 5–13
into one guided, animated ~15–30 second sequence for a faster version of this
story if time is tight.
