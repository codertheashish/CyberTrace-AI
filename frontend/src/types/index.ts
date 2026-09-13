export interface Complaint {
  complaint_id: string;
  date: string;
  complaint_type: string;
  reported_amount: number;
  victim_account: string;
  suspected_account: string;
  transaction_id: string;
  channel: string;
  city: string;
  state: string;
  status: string;
  risk_score: number;
  risk_label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Transaction {
  transaction_id: string;
  complaint_id: string | null;
  timestamp: string;
  sender_account: string;
  receiver_account: string;
  amount: number;
  channel: string;
  city: string;
  state: string;
  is_suspicious: number;
  risk_score: number;
  transaction_velocity: number;
}

export interface LocationRow {
  location_id: string;
  area: string;
  city: string;
  state: string;
  location_type: string;
  latitude: number;
  longitude: number;
  is_hotspot: number;
  historical_withdrawal_count: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PredictedLocation {
  location_id: string;
  area: string;
  latitude: number;
  longitude: number;
  probability: number;
  risk_score: number;
}

export interface PredictionResult {
  prediction_id: string;
  complaint_id: string;
  account_id: string;
  risk_level: string;
  top_locations: PredictedLocation[];
  explanation: string[];
  risk_breakdown: Record<string, number>;
  disclaimer: string;
}

export interface Alert {
  alert_id: string;
  alert_type: string;
  location_id: string;
  complaint_id: string;
  probability: number;
  amount: number;
  risk_level: string;
  created_at: string;
  status: string;
}

export interface NetworkNode {
  id: string;
  type: string;
  risk: number;
  importance: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  amount: number;
  channel: string;
  timestamp: string;
  risk: number;
  transaction_id: string;
}

export interface NetworkGraph {
  complaint_id: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  trace_path: string[];
  stats: { node_count: number; edge_count: number; clusters: number };
}

export interface DashboardData {
  kpis: {
    total_complaints: number;
    high_risk_complaints: number;
    suspicious_transactions: number;
    amount_under_investigation: number;
    predicted_high_risk_locations: number;
    active_alerts: number;
  };
  monthly_trend: { month: string; c: number }[];
  model_status: string;
}

export interface ModelMetrics {
  selected_model: string;
  test_accuracy: number;
  test_precision_weighted: number;
  test_recall_weighted: number;
  test_f1_weighted: number;
  top_3_location_accuracy: number;
  top_5_location_accuracy: number;
  n_train: number;
  n_val: number;
  n_test: number;
  n_classes: number;
  validation_scores: Record<string, number>;
}

export interface InvestigationSummary {
  complaint_id: string;
  risk_level: string;
  amount: number;
  key_findings: string[];
  predicted_locations: PredictedLocation[];
  recommended_priority: string;
  disclaimer: string;
}
