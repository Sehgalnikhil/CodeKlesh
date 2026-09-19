import {
  Patient,
  Appointment,
  Prediction,
  Reminder,
  WaitlistEntry,
  SlotRecoveryItem,
  AnalyticsResponse,
  ModelMetricsResponse,
  User
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('attendai_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = `API Error ${response.status}: ${response.statusText}`;
    try {
      const err = await response.json();
      if (err.detail) errorDetail = err.detail;
    } catch {}
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<User> {
    return request('/auth/me');
  },

  // Patients
  async getPatients(search?: string): Promise<Patient[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/patients${q}`);
  },

  async getPatient(id: number): Promise<Patient> {
    return request(`/patients/${id}`);
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    return request('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  },

  // Appointments
  async getAppointments(params?: {
    tab?: string;
    doctor?: string;
    department?: string;
    risk_level?: string;
    status?: string;
    search?: string;
    date_filter?: string;
  }): Promise<Appointment[]> {
    const searchParams = new URLSearchParams();
    if (params?.tab && params.tab !== 'All') searchParams.append('tab', params.tab);
    if (params?.doctor) searchParams.append('doctor', params.doctor);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.risk_level) searchParams.append('risk_level', params.risk_level);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.date_filter) searchParams.append('date_filter', params.date_filter);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/appointments${query}`);
  },

  async getAppointment(id: number): Promise<Appointment> {
    return request(`/appointments/${id}`);
  },

  async createAppointment(appointment: any): Promise<Appointment> {
    return request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  },

  async updateAppointmentStatus(id: number, params: {
    status?: string;
    confirmation_status?: string;
    sms_reminder_sent?: boolean;
    recovery_status?: string;
    notes?: string;
  } | string, sms_reminder_sent?: boolean): Promise<Appointment> {
    const searchParams = new URLSearchParams();
    if (typeof params === 'string') {
      searchParams.append('status', params);
      if (sms_reminder_sent !== undefined) searchParams.append('sms_reminder_sent', String(sms_reminder_sent));
    } else {
      if (params.status) searchParams.append('status', params.status);
      if (params.confirmation_status) searchParams.append('confirmation_status', params.confirmation_status);
      if (params.sms_reminder_sent !== undefined) searchParams.append('sms_reminder_sent', String(params.sms_reminder_sent));
      if (params.recovery_status) searchParams.append('recovery_status', params.recovery_status);
      if (params.notes) searchParams.append('notes', params.notes);
    }
    return request(`/appointments/${id}?${searchParams.toString()}`, {
      method: 'PATCH',
    });
  },

  // Predict
  async predictRisk(data: any): Promise<Prediction> {
    return request('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reminders
  async dispatchReminder(data: {
    appointment_id: number;
    patient_id: number;
    channel?: string;
    strategy?: string;
    scheduled_for?: string;
    notes?: string;
  }): Promise<Reminder> {
    return request('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReminders(): Promise<Reminder[]> {
    return request('/reminders');
  },

  // Waitlist
  async getWaitlist(params?: { doctor?: string; department?: string; status?: string }): Promise<WaitlistEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.doctor) searchParams.append('doctor', params.doctor);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/waitlist${query}`);
  },

  async createWaitlistEntry(data: Partial<WaitlistEntry>): Promise<WaitlistEntry> {
    return request('/waitlist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async offerWaitlistSlot(waitlistId: number, appointmentId?: number): Promise<{ success: boolean; message: string }> {
    const q = appointmentId ? `?appointment_id=${appointmentId}` : '';
    return request(`/waitlist/${waitlistId}/offer${q}`, {
      method: 'POST',
    });
  },

  // Slot Recovery Center
  async getSlotRecovery(status?: string): Promise<SlotRecoveryItem[]> {
    const q = status ? `?status=${status}` : '';
    return request(`/slot-recovery${q}`);
  },

  async executeSlotRecovery(data: {
    recovery_id: number;
    action: string;
    waitlist_candidate_id?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; revenue_protected: number; recovery_id: number }> {
    return request('/slot-recovery/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics & Model
  async getAnalytics(): Promise<AnalyticsResponse> {
    return request('/analytics');
  },

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    return request('/model/metrics');
  },

  // Voice AI Dialogue
  async voiceDialogue(payload: {
    user_speech: string;
    conversation_history?: Array<{ role: string; content: string }>;
    pending_slot?: any;
    patient_id?: number;
    preferred_language?: 'auto' | 'hi' | 'en';
  }): Promise<{
    ai_response: string;
    status: 'GREETING' | 'COLLECTING_INFO' | 'AWAITING_CONFIRMATION' | 'CONFIRMED';
    language: 'hi' | 'en';
    pending_slot?: any;
    booked_appointment?: any;
  }> {
    return request('/voice/ai-dialogue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Outbound AI Phone Calling
  async initiateOutboundCall(payload: {
    appointment_id: number;
    phone_number: string;
    mode?: 'simulator' | 'twilio';
    language?: 'en' | 'hi';
    twilio_sid?: string;
    twilio_token?: string;
    twilio_from?: string;
  }): Promise<{
    call_sid: string;
    status: string;
    appointment_id: number;
    patient_name: string;
    doctor_name: string;
    department: string;
    appointment_date: string;
    appointment_time: string;
    phone_number: string;
    missed_appointments_count: number;
    script: string;
    twilio_dispatched: boolean;
    twilio_error?: string;
    mode: string;
  }> {
    return request('/voice/outbound-call', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async saveTelephonyConfig(data: {
    twilio_sid: string;
    twilio_token: string;
    twilio_from: string;
  }): Promise<{ success: boolean; message: string }> {
    return request('/voice/telephony-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTelephonyConfig(): Promise<{
    is_configured: boolean;
    twilio_sid_masked: string;
    twilio_from: string;
  }> {
    return request('/voice/telephony-config');
  },

  async recordCallResult(payload: {
    appointment_id: number;
    phone_number: string;
    digits_pressed: '1' | '2';
    duration_seconds: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    outcome: 'CONFIRMED' | 'CANCELLED_FREED' | 'NO_RESPONSE';
    outcome_label: string;
    spoken_response: string;
    appointment_id: number;
    patient_name: string;
    doctor_name: string;
    department: string;
    confirmation_status: string;
    recovery_status: string;
    phone_number: string;
    digits_pressed: string;
    duration_seconds: number;
    capacity_action: string;
    revenue_protected: number;
    timestamp: string;
  }> {
    return request('/voice/record-call-result', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getCallStatus(appointmentId: number, callSid?: string): Promise<{
    call_sid: string;
    appointment_id: number;
    is_completed: boolean;
    twilio_status: string;
    duration_seconds: number;
    digits_pressed?: string;
    outcome: string;
    confirmation_status: string;
    recovery_status: string;
  }> {
    const q = callSid ? `?call_sid=${callSid}` : '';
    return request(`/voice/call-status/${appointmentId}${q}`);
  },
};
