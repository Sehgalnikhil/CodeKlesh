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
    {
      id: 'e-4',
      timestamp: '42m ago',
      type: 'PREDICTION',
      title: 'High-Risk Booking Ingested',
      description: 'New booking evaluated: 82% no-show probability flagged due to 14d lead time',
      badge: '82% Risk',
      badgeColor: '#C9685B',
    },
  ]);

  const emitEvent = (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `e-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setEvents(prev => [newEvent, ...prev.slice(0, 40)]);
  };

  const clearEvents = () => setEvents([]);

  return (
    <ActivityStreamContext.Provider value={{ events, emitEvent, clearEvents }}>
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
