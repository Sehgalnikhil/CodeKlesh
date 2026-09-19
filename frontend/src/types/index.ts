export interface FactorDetail {
  factor: string;
  label: string;
  impact_direction: 'positive' | 'negative';
  contribution: number;
  percentage: number;
}

export interface Patient {
  id: number;
  patient_code: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  chronic_condition: boolean;
  distance_km: number;
  insurance_type: string;
  total_appointments: number;
  missed_appointments: number;
  attendance_rate: number;
  avg_confirm_hours: number;
  reminder_response_rate: number;
  behavior_pattern: string;
  preferred_channel: string;
  created_at: string;
}

export interface Prediction {
  id?: number;
  appointment_id?: number;
  risk_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  top_factors: FactorDetail[];
  recommended_action: string;
  recommended_strategy?: string;
  estimated_impact_prob: number;
  created_at?: string;
}

export interface WaitlistEntry {
  id: number;
  patient_id: number;
  doctor_name: string;
  department: string;
  preferred_date: string;
  preferred_time_range: string;
  appointment_type: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Waiting' | 'Offered' | 'Booked' | 'Expired';
  contact_status: string;
  notes?: string;
  created_at: string;
  patient?: Patient;
}

export interface SlotRecoveryItem {
  id: number;
  appointment_id: number;
  risk_probability: number;
  recommendation: string;
  reasoning: string;
  action_type: 'WAITLIST' | 'DOUBLE_BOOK' | 'RELEASE' | 'MONITOR';
  status: 'Proposed' | 'Executed' | 'Dismissed';
  candidate_waitlist_id?: number;
  revenue_protected: number;
  executed_at?: string;
  created_at: string;
  appointment?: Appointment;
  candidate_waitlist?: WaitlistEntry;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  booking_date: string;
  days_in_advance: number;
  sms_reminder_sent: boolean;
  email_reminder_sent: boolean;
  status: string;
  confirmation_status: 'Confirmed' | 'Not confirmed' | 'Pending_Reply' | string;
  is_double_booked: boolean;
  recovery_status: 'Normal' | 'At_Risk' | 'Recovered' | 'Double_Booked' | 'Released' | string;
  estimated_slot_value: number;
  notes?: string;
  created_at: string;
  patient?: Patient;
  prediction?: Prediction;
  slot_recovery?: SlotRecoveryItem;
}

export interface Reminder {
  id: number;
  appointment_id: number;
  patient_id: number;
  channel: string;
  strategy?: string;
  status: string;
  scheduled_for: string;
  sent_at?: string;
  notes?: string;
  created_at: string;
  patient?: Patient;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'Admin' | 'Doctor' | 'Receptionist';
  clinic_name: string;
  created_at: string;
}

export interface KPIData {
  today_appointments: number;
  high_risk_appointments: number;
  predicted_no_shows: number;
  slots_at_risk: number;
  capacity_recovered_inr: number;
  revenue_protected_inr: number;
  today_appointments_change: string;
  high_risk_change: string;
  predicted_no_shows_change: string;
  slots_at_risk_change: string;
  capacity_recovered_change: string;
}

export interface BusinessImpactData {
  appointments_analyzed: number;
  high_risk_appointments: number;
  no_shows_prevented: number;
  slots_recovered: number;
  waitlist_matches: number;
  additional_appointments_filled: number;
  estimated_capacity_value_protected_inr: number;
  recovery_success_rate_pct: number;
}

export interface AnalyticsResponse {
  kpis: KPIData;
  business_impact: BusinessImpactData;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    total: number;
  };
  no_show_rate_over_time: Array<{
    date: string;
    no_show_rate: number;
    total_appointments: number;
    attended: number;
    missed: number;
  }>;
  by_department: Array<{
    name: string;
    no_show_rate: number;
    total: number;
  }>;
  by_appointment_type: Array<{
    name: string;
    no_show_rate: number;
    total: number;
  }>;
  by_day_of_week: Array<{
    name: string;
    no_show_rate: number;
    total: number;
  }>;
  time_heatmap: Array<{
    time_slot: string;
    day: string;
    rate: number;
  }>;
  model_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
}

export interface ModelMetricsResponse {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: number[][];
  feature_importances: Array<{
    feature: string;
    label: string;
    importance: number;
    percentage: number;
    rank: number;
  }>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ recall: number; precision: number }>;
  disclaimer: string;
}
