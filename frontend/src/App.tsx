import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpatialNav, SpatialTab } from './components/layout/SpatialNav';
import { SpatialHeader } from './components/layout/SpatialHeader';
import { ToastContainer } from './components/ui/ToastContainer';
import { SpatialStoryPage } from './pages/SpatialStoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PatientDetailDrawer } from './pages/PatientDetailDrawer';
import { RiskPredictorPage } from './pages/RiskPredictorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PatientsPage } from './pages/PatientsPage';
import { SlotRecoveryPage } from './pages/SlotRecoveryPage';
import { RiskQueuePage } from './pages/RiskQueuePage';
import { PricingPlansPage } from './pages/PricingPlansPage';
import { DemoScenarioModal } from './components/demo/DemoScenarioModal';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { SendReminderModal } from './components/modals/SendReminderModal';
import { AddPatientModal } from './components/modals/AddPatientModal';
import { BookAppointmentModal } from './components/modals/BookAppointmentModal';
import { Appointment, Patient, AnalyticsResponse } from './types';
import { api } from './api/client';
import { ActivityStreamProvider } from './context/ActivityStreamContext';
import { ClinicLiveWire } from './components/ui/ClinicLiveWire';
import { PatientMobileSimulator } from './components/modals/PatientMobileSimulator';
import { ExecutiveROIReportModal } from './components/modals/ExecutiveROIReportModal';
import { AIVoiceCallingModal } from './components/modals/AIVoiceCallingModal';
import { OutboundAICallModal } from './components/modals/OutboundAICallModal';
import { LiveInteractiveVoiceAgentModal } from './components/modals/LiveInteractiveVoiceAgentModal';
import { WhatsAppNegotiationModal } from './components/modals/WhatsAppNegotiationModal';
import { PatientJourneyRadarModal } from './components/modals/PatientJourneyRadarModal';
import { DoctorDelayBroadcastModal } from './components/modals/DoctorDelayBroadcastModal';
import { ReceptionistRunSheetModal } from './components/modals/ReceptionistRunSheetModal';
import { AzureDocScannerModal } from './components/modals/AzureDocScannerModal';

const MainAppContent: React.FC = () => {
  const { showToast } = useAuth();
  // Clinical Operations Dashboard is the default entry surface
  const [isStoryMode, setIsStoryMode] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<SpatialTab>('dashboard');

  // Modal and Drawer States
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reminderModalApp, setReminderModalApp] = useState<Appointment | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isBookApptOpen, setIsBookApptOpen] = useState(false);
  const [bookPatientId, setBookPatientId] = useState<number | undefined>(undefined);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);
  const [isROIReportOpen, setIsROIReportOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isOutboundCallOpen, setIsOutboundCallOpen] = useState(false);
  const [outboundAppointment, setOutboundAppointment] = useState<Appointment | null>(null);
  const [isLiveVoiceAgentOpen, setIsLiveVoiceAgentOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppAppointment, setWhatsAppAppointment] = useState<Appointment | null>(null);
  const [isJourneyRadarOpen, setIsJourneyRadarOpen] = useState(false);
  const [journeyRadarAppointment, setJourneyRadarAppointment] = useState<Appointment | null>(null);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isRunSheetOpen, setIsRunSheetOpen] = useState(false);
  const [isAzureDocScannerOpen, setIsAzureDocScannerOpen] = useState(false);

  // Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [appointmentTab, setAppointmentTab] = useState<string>('All');
  const [currentDateFilter, setCurrentDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [apptsData, patientsData, analyticsData] = await Promise.all([
        api.getAppointments({
          tab: appointmentTab,
          date_filter: currentDateFilter,
          search: searchQuery,
        }),
        api.getPatients(),
        api.getAnalytics(),
      ]);

      setAppointments(apptsData);
      setPatients(patientsData);
      setAnalytics(analyticsData);

      if (selectedAppointment) {
        const updated = apptsData.find((a) => a.id === selectedAppointment.id);
        if (updated) setSelectedAppointment(updated);
      }
    } catch (err: any) {
      console.error('Error fetching clinical data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search query (avoids spamming backend on every keystroke)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadAllData();
  }, [appointmentTab, currentDateFilter, debouncedSearch]);

  // Real-time synchronization (every 4 seconds, paused when tab is inactive)
  useEffect(() => {
    const liveSyncInterval = setInterval(async () => {
      // Don't poll if browser tab is hidden/backgrounded
      if (document.hidden) return;

      try {
        const [apptsData, analyticsData] = await Promise.all([
          api.getAppointments({
            tab: appointmentTab,
            date_filter: currentDateFilter,
            search: debouncedSearch,
          }),
          api.getAnalytics(),
        ]);
        setAppointments(apptsData);
        setAnalytics(analyticsData);

        if (selectedAppointment) {
          const updated = apptsData.find((a) => a.id === selectedAppointment.id);
          if (updated) setSelectedAppointment(updated);
        }
      } catch (err) {
        // silent background fail on brief network blips
      }
    }, 4500);

    // Instant real-time listener for incoming SSE broadcasts
    const handleLiveSync = () => {
      loadAllData();
    };
    window.addEventListener('slotsure:live-sync', handleLiveSync);

    return () => {
      clearInterval(liveSyncInterval);
      window.removeEventListener('slotsure:live-sync', handleLiveSync);
    };
  }, [appointmentTab, currentDateFilter, debouncedSearch, selectedAppointment]);

  // Global ⌘K Spotlight shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectAppointment = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsDrawerOpen(true);
  };

  const handleOpenSendReminder = (app: Appointment) => {
    setReminderModalApp(app);
  };

  const handleBookForPatient = (patientId: number) => {
    setBookPatientId(patientId);
    setIsBookApptOpen(true);
  };

  const atRiskCount = appointments.filter((a) => a.prediction?.risk_level === 'HIGH').length;
  const recoveryCount = analytics?.kpis?.slots_at_risk || 11;

  // MODE 1: CINEMATIC SPATIAL STORYTELLING EXPERIENCE
  if (isStoryMode) {
    return (
      <div className="min-h-screen bg-porcelain-100 text-graphite-900 selection:bg-charcoal-800 selection:text-white">
        <SpatialStoryPage
          onOpenLiveOperations={() => setIsStoryMode(false)}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onSelectAppointment={(app) => {
            setSelectedAppointment(app);
            setIsDrawerOpen(true);
          }}
          onRefreshGlobalData={loadAllData}
        />

        {/* 2-Minute Guided Demo Modal */}
        <DemoScenarioModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
          onDemoCompleted={loadAllData}
        />

        {/* Patient Detail Drawer */}
        <PatientDetailDrawer
          appointment={selectedAppointment}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenSendReminder={(app) => setReminderModalApp(app)}
          onNavigateToRecovery={() => {
            setIsDrawerOpen(false);
            setIsStoryMode(false);
            setCurrentTab('recovery');
          }}
          onViewPatientDirectory={() => {
            setIsDrawerOpen(false);
            setIsStoryMode(false);
            setCurrentTab('patients');
          }}
          onRefreshData={loadAllData}
        />

        {/* Toast Container */}
        <ToastContainer />
      </div>
    );
  }

  // MODE 2: LIVE OPERATIONS COMMAND CENTER (No generic sidebar + card dashboard)
  return (
    <div className="min-h-screen bg-porcelain-100 text-graphite-900 selection:bg-charcoal-800 selection:text-white relative">
      {/* Floating visionOS-style Glass Rail Navigation */}
      <SpatialNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenStory={() => setIsStoryMode(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        riskCount={atRiskCount}
        recoveryCount={recoveryCount}
      />

      {/* Main Operations Canvas (with margin for floating dock on desktop) */}
      <div className="lg:pl-20 min-h-screen flex flex-col">
        {/* Top Spatial Header */}
        <SpatialHeader
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onOpenStory={() => setIsStoryMode(true)}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onOpenBookAppointment={() => {
            setBookPatientId(undefined);
            setIsBookApptOpen(true);
          }}
          onOpenAddPatient={() => setIsAddPatientOpen(true)}
          onSearch={(q) => setSearchQuery(q)}
          searchQuery={searchQuery}
          onRefreshData={loadAllData}
          onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
          onOpenOutboundCall={() => {
            const highRisk = appointments.find((a) => a.prediction?.risk_level === 'HIGH') || appointments[0] || null;
            setOutboundAppointment(highRisk);
            setIsOutboundCallOpen(true);
          }}
          onOpenWhatsApp={() => {
            const highRisk = appointments.find((a) => a.prediction?.risk_level === 'HIGH') || appointments[0] || null;
            setWhatsAppAppointment(highRisk);
            setIsWhatsAppOpen(true);
          }}
          onOpenRadar={() => {
            const highRisk = appointments.find((a) => a.prediction?.risk_level === 'HIGH') || appointments[0] || null;
            setJourneyRadarAppointment(highRisk);
            setIsJourneyRadarOpen(true);
          }}
          onOpenAzureDocScanner={() => setIsAzureDocScannerOpen(true)}
        />

        {/* Dynamic Spatial Operational Pages */}
        <main className="flex-1 pb-20 lg:pb-10">
          {currentTab === 'dashboard' && (
            <DashboardPage
              analytics={analytics}
              todayAppointments={appointments}
              onSelectAppointment={handleSelectAppointment}
              onOpenSendReminder={handleOpenSendReminder}
              onNavigateToRecovery={() => setCurrentTab('recovery')}
              onOpenDemoModal={() => setIsDemoModalOpen(true)}
              onRefreshData={loadAllData}
              onOpenROIReport={() => setIsROIReportOpen(true)}
              onOpenWhatsApp={(app) => {
                setWhatsAppAppointment(app);
                setIsWhatsAppOpen(true);
              }}
              onOpenRadar={(app) => {
                setJourneyRadarAppointment(app);
                setIsJourneyRadarOpen(true);
              }}
              onOpenDelayBroadcast={() => setIsDelayModalOpen(true)}
              onOpenRunSheet={() => setIsRunSheetOpen(true)}
            />
          )}

          {currentTab === 'appointments' && (
            <AppointmentsPage
              appointments={appointments}
              currentTab={appointmentTab}
              onSelectTab={(tab) => setAppointmentTab(tab)}
              onSelectAppointment={handleSelectAppointment}
              onOpenSendReminder={handleOpenSendReminder}
              onOpenWhatsApp={(app) => {
                setWhatsAppAppointment(app);
                setIsWhatsAppOpen(true);
              }}
              onOpenRadar={(app) => {
                setJourneyRadarAppointment(app);
                setIsJourneyRadarOpen(true);
              }}
            />
          )}

          {currentTab === 'risk-queue' && (
            <RiskQueuePage
              appointments={appointments}
              onSelectAppointment={handleSelectAppointment}
              onOpenSendReminder={handleOpenSendReminder}
              onNavigateToRecovery={() => setCurrentTab('recovery')}
            />
          )}

          {currentTab === 'recovery' && (
            <SlotRecoveryPage onRefreshData={loadAllData} />
          )}

          {currentTab === 'patients' && (
            <PatientsPage
              patients={patients}
              onOpenAddPatient={() => setIsAddPatientOpen(true)}
              onBookForPatient={handleBookForPatient}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsPage analytics={analytics} />}

          {currentTab === 'plans' && (
            <PricingPlansPage
              onOpenLiveOperations={() => setCurrentTab('dashboard')}
              onOpenStory={() => setIsStoryMode(true)}
            />
          )}
        </main>
      </div>

      {/* Patient Detail Drawer */}
      <PatientDetailDrawer
        appointment={selectedAppointment}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenSendReminder={(app) => setReminderModalApp(app)}
        onNavigateToRecovery={() => {
          setIsDrawerOpen(false);
          setCurrentTab('recovery');
        }}
        onViewPatientDirectory={() => {
          setIsDrawerOpen(false);
          setCurrentTab('patients');
        }}
        onRefreshData={loadAllData}
        onOpenOutboundCall={(app) => {
          setOutboundAppointment(app);
          setIsOutboundCallOpen(true);
        }}
        onOpenWhatsAppNegotiation={(app) => {
          setWhatsAppAppointment(app);
          setIsWhatsAppOpen(true);
        }}
        onOpenJourneyRadar={(app) => {
          setJourneyRadarAppointment(app);
          setIsJourneyRadarOpen(true);
        }}
        onOpenAzureDocScanner={() => setIsAzureDocScannerOpen(true)}
      />

      {/* Send Reminder Modal */}
      <SendReminderModal
        appointment={reminderModalApp}
        isOpen={!!reminderModalApp}
        onClose={() => setReminderModalApp(null)}
        onReminderSent={() => loadAllData()}
        onTriggerCall={(app) => {
          setReminderModalApp(null);
          setOutboundAppointment(app);
          setIsOutboundCallOpen(true);
        }}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientCreated={() => loadAllData()}
      />

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookApptOpen}
        onClose={() => {
          setIsBookApptOpen(false);
          setBookPatientId(undefined);
        }}
        onAppointmentBooked={() => {
          loadAllData();
          setCurrentTab('appointments');
        }}
        preselectedPatientId={bookPatientId}
      />

      {/* Interactive 2-Minute Live Demo Scenario Modal */}
      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onDemoCompleted={loadAllData}
      />

      {/* ⌘K Spotlight Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        patients={patients}
        appointments={appointments}
        onSelectAppointment={handleSelectAppointment}
        onSelectPatient={(patientId) => handleBookForPatient(patientId)}
        onNavigateTab={(tab: any) => setCurrentTab(tab)}
        onOpenBookAppointment={() => {
          setBookPatientId(undefined);
          setIsBookApptOpen(true);
        }}
        onOpenAddPatient={() => setIsAddPatientOpen(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* Executive ROI Report Modal */}
      <ExecutiveROIReportModal
        isOpen={isROIReportOpen}
        onClose={() => setIsROIReportOpen(false)}
        analytics={analytics}
      />

      {/* AI Voice Calling Desk Modal */}
      <AIVoiceCallingModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        onAppointmentBooked={loadAllData}
      />

      {/* Outbound AI Call Modal */}
      <OutboundAICallModal
        isOpen={isOutboundCallOpen}
        onClose={() => {
          setIsOutboundCallOpen(false);
          setOutboundAppointment(null);
        }}
        appointment={outboundAppointment}
        onRefreshData={loadAllData}
      />

      {/* Patient Mobile Simulator */}
      <PatientMobileSimulator
        isOpen={isMobileSimulatorOpen}
        onClose={() => setIsMobileSimulatorOpen(false)}
        appointments={appointments}
        onRefreshClinicData={loadAllData}
      />

      {/* Live Interactive Web Audio Voice Reception Agent */}
      <LiveInteractiveVoiceAgentModal
        isOpen={isLiveVoiceAgentOpen}
        onClose={() => setIsLiveVoiceAgentOpen(false)}
        patientName={(() => {
          const highRisk = appointments.find((a) => a.prediction?.risk_level === 'HIGH');
          return highRisk?.patient ? `${highRisk.patient.first_name} ${highRisk.patient.last_name}` : 'Aarav Mehta';
        })()}
        doctorName={appointments.find((a) => a.prediction?.risk_level === 'HIGH')?.doctor_name || 'Dr. Sharma'}
        appointmentTime={appointments.find((a) => a.prediction?.risk_level === 'HIGH')?.appointment_time || '10:30 AM'}
        initialRisk={87}
        onSlotRecovered={loadAllData}
      />

      {/* WhatsApp AI Negotiation Concierge Modal */}
      <WhatsAppNegotiationModal
        isOpen={isWhatsAppOpen}
        onClose={() => {
          setIsWhatsAppOpen(false);
          setWhatsAppAppointment(null);
        }}
        appointment={whatsAppAppointment}
        onRefreshClinicData={loadAllData}
        onOpenAzureDocScanner={() => setIsAzureDocScannerOpen(true)}
      />

      {/* Patient Live Journey Radar Modal (Swiggy/Uber-Style) */}
      <PatientJourneyRadarModal
        isOpen={isJourneyRadarOpen}
        onClose={() => {
          setIsJourneyRadarOpen(false);
          setJourneyRadarAppointment(null);
        }}
        appointment={journeyRadarAppointment}
        onRefreshClinicData={loadAllData}
      />

      {/* Doctor Delay Wave Broadcast Modal */}
      <DoctorDelayBroadcastModal
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        appointments={appointments}
        onRefreshClinicData={loadAllData}
      />

      {/* Receptionist Morning Run-Sheet Modal */}
      <ReceptionistRunSheetModal
        isOpen={isRunSheetOpen}
        onClose={() => setIsRunSheetOpen(false)}
        appointments={appointments}
      />

      {/* Azure AI Document Intelligence Scanner Modal */}
      <AzureDocScannerModal
        isOpen={isAzureDocScannerOpen}
        onClose={() => setIsAzureDocScannerOpen(false)}
        patientName={
          selectedAppointment?.patient
            ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}`
            : 'Aarav Mehta'
        }
        onRefreshData={loadAllData}
      />

      {/* Clinic LiveWire Real-Time Stream */}
      <ClinicLiveWire />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ActivityStreamProvider>
        <MainAppContent />
      </ActivityStreamProvider>
    </AuthProvider>
  );
}
