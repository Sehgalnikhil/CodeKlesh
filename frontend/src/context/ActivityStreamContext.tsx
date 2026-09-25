import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'CONFIRMATION' | 'REMINDER' | 'RECOVERY' | 'WAITLIST' | 'PREDICTION' | 'CALL_QUEUED';
  title: string;
  description: string;
  patientName?: string;
  doctorName?: string;
  badge?: string;
  badgeColor?: string;
}

interface ActivityStreamContextType {
  events: ActivityEvent[];
  emitEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  isConnected: boolean;
  latencyMs: number;
}

const ActivityStreamContext = createContext<ActivityStreamContextType | undefined>(undefined);

export const ActivityStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: 'e-1',
      timestamp: 'Just now',
      type: 'RECOVERY',
      title: 'Waitlist Match Qualified',
      description: 'Priya Kapoor matches unconfirmed 10:30 AM Cardiology slot for Dr. Sharma',
      patientName: 'Priya Kapoor',
      doctorName: 'Dr. Sharma',
      badge: 'Waitlist',
      badgeColor: '#4F8A70',
    },
    {
      id: 'e-2',
      timestamp: '4m ago',
      type: 'REMINDER',
      title: 'Automated 24h SMS Dispatched',
      description: 'Clinical confirmation link delivered to Aarav Mehta (+91 98765 43210)',
      patientName: 'Aarav Mehta',
      badge: 'SMS Sent',
      badgeColor: '#647A8A',
    },
    {
      id: 'e-3',
      timestamp: '18m ago',
      type: 'CONFIRMATION',
      title: 'Patient Confirmed Visit',
      description: 'Ashish Sharma confirmed 09:00 AM General Medicine appointment via WhatsApp',
      patientName: 'Ashish Sharma',
      doctorName: 'Dr. Das',
      badge: 'Confirmed',
      badgeColor: '#4F8A70',
    },
  ]);

  const [isConnected, setIsConnected] = useState(true);
  const [latencyMs, setLatencyMs] = useState(24);

  // Real-time Server-Sent Events (SSE) subscriber
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${API_BASE}/events/stream`);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'HEARTBEAT') {
              setLatencyMs(Math.floor(Math.random() * 8) + 18);
              return;
            }

            if (data.type === 'CONNECTION_ESTABLISHED') {
              setIsConnected(true);
              return;
            }

            const newEvent: ActivityEvent = {
              id: data.id || `e-${Date.now()}`,
              timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: data.type || 'RECOVERY',
              title: data.title || 'Clinical Update',
              description: data.description || '',
              patientName: data.patientName,
              doctorName: data.doctorName,
              badge: data.badge,
              badgeColor: data.badgeColor,
            };

            setEvents(prev => [newEvent, ...prev.slice(0, 49)]);

            // Broadcast global live sync event to instant-refresh active pages
            window.dispatchEvent(new CustomEvent('slotsure:live-sync', { detail: data }));
          } catch {
            // silent parse ignore
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) eventSource.close();
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };
      } catch {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const emitEvent = (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `e-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setEvents(prev => [newEvent, ...prev.slice(0, 49)]);

    // Broadcast across windows/tabs
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    fetch(`${API_BASE}/events/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    }).catch(() => {});
  };

  const clearEvents = () => setEvents([]);

  return (
    <ActivityStreamContext.Provider value={{ events, emitEvent, clearEvents, isConnected, latencyMs }}>
      {children}
    </ActivityStreamContext.Provider>
  );
};

export const useActivityStream = () => {
  const context = useContext(ActivityStreamContext);
  if (!context) {
    throw new Error('useActivityStream must be used within an ActivityStreamProvider');
  }
  return context;
};
