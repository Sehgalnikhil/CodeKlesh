import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PatientDetailDrawer } from './pages/PatientDetailDrawer';
import { RiskPredictorPage } from './pages/RiskPredictorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelInsightsPage } from './pages/ModelInsightsPage';
import { PatientsPage } from './pages/PatientsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { SlotRecoveryPage } from './pages/SlotRecoveryPage';
import { RiskQueuePage } from './pages/RiskQueuePage';
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

const MainAppContent: React.FC = () => {
  const { showToast } = useAuth();
  const [isLandingMode, setIsLandingMode] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');

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

      // If drawer is open, keep selected appointment updated
      if (selectedAppointment) {
        const updated = apptsData.find(a => a.id === selectedAppointment.id);
        if (updated) setSelectedAppointment(updated);
      }
    } catch (err: any) {
      console.error('Error fetching clinical data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [appointmentTab, currentDateFilter, searchQuery]);

  // Real-time live synchronization (every 5 seconds in background)
  useEffect(() => {
    const liveSyncInterval = setInterval(async () => {
      try {
        const [apptsData, analyticsData] = await Promise.all([
          api.getAppointments({
            tab: appointmentTab,
            date_filter: currentDateFilter,
            search: searchQuery,
          }),
          api.getAnalytics(),
        ]);
        setAppointments(apptsData);
        setAnalytics(analyticsData);

        if (selectedAppointment) {
          const updated = apptsData.find(a => a.id === selectedAppointment.id);
          if (updated) setSelectedAppointment(updated);
        }
      } catch (err) {
        // silent background fail on brief network blips
      }
    }, 5000);

    return () => clearInterval(liveSyncInterval);
  }, [appointmentTab, currentDateFilter, searchQuery, selectedAppointment]);

  // Global ⌘K Spotlight shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
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

  const handleBookDirectlyFromPredictor = (predData: any) => {
    // Open appointment modal with prefilled data
    setIsBookApptOpen(true);
  };

  const handleViewPatientInDirectory = (patientId: number) => {
    setCurrentTab('patients');
  };

  // If user is on landing page view
  if (isLandingMode) {
    return (
      <LandingPage
        onOpenDashboard={() => setIsLandingMode(false)}
        onOpenDemoModal={() => {
          setIsLandingMode(false);
          setIsDemoModalOpen(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F7] dark:bg-[#0C0C0E] overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Left Sidebar - Apple Floating Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab === 'appointments') setAppointmentTab('All');
        }}
        onOpenLanding={() => setIsLandingMode(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onSearch={q => setSearchQuery(q)}
          onOpenAddPatient={() => setIsAddPatientOpen(true)}
          onOpenBookAppointment={() => {
            setBookPatientId(undefined);
            setIsBookApptOpen(true);
          }}
          onSelectDateFilter={date => setCurrentDateFilter(date)}
          currentDateFilter={currentDateFilter}
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onOpenMobileSimulator={() => setIsMobileSimulatorOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
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
            />
          )}

          {currentTab === 'appointments' && (
            <AppointmentsPage
              appointments={appointments}
              currentTab={appointmentTab}
              onSelectTab={tab => setAppointmentTab(tab)}
              onSelectAppointment={handleSelectAppointment}
              onOpenSendReminder={handleOpenSendReminder}
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
            <SlotRecoveryPage
              onRefreshData={loadAllData}
            />
          )}

          {currentTab === 'patients' && (
            <PatientsPage
              patients={patients}
              onOpenAddPatient={() => setIsAddPatientOpen(true)}
              onBookForPatient={handleBookForPatient}
            />
          )}

          {currentTab === 'predictor' && (
            <RiskPredictorPage
              onBookDirectly={handleBookDirectlyFromPredictor}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage analytics={analytics} />
          )}

          {currentTab === 'models' && (
            <ModelInsightsPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Patient Detail Drawer (Side Panel) */}
      <PatientDetailDrawer
        appointment={selectedAppointment}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenSendReminder={app => {
          setReminderModalApp(app);
        }}
        onNavigateToRecovery={() => {
          setIsDrawerOpen(false);
          setCurrentTab('recovery');
        }}
        onViewPatientDirectory={handleViewPatientInDirectory}
        onRefreshData={loadAllData}
      />

      {/* Reminder Modal */}
      <SendReminderModal
        appointment={reminderModalApp}
        isOpen={!!reminderModalApp}
        onClose={() => setReminderModalApp(null)}
        onReminderSent={() => {
          loadAllData();
        }}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientCreated={() => {
          loadAllData();
        }}
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

      {/* Interactive 2-Minute Demo Scenario Modal */}
      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onDemoCompleted={() => {
          loadAllData();
        }}
      />

      {/* Apple Spotlight Command Palette (⌘K) */}
      <CommandPaletteModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        patients={patients}
        appointments={appointments}
        onSelectAppointment={handleSelectAppointment}
        onSelectPatient={patientId => {
          handleBookForPatient(patientId);
        }}
        onNavigateTab={tab => {
          setCurrentTab(tab);
        }}
        onOpenBookAppointment={() => {
          setBookPatientId(undefined);
          setIsBookApptOpen(true);
        }}
        onOpenAddPatient={() => {
          setIsAddPatientOpen(true);
        }}
        onOpenDemoModal={() => {
          setIsDemoModalOpen(true);
        }}
      />

      {/* Clinic LiveWire Real-Time Stream */}
      <ClinicLiveWire />

      {/* Patient Mobile Simulator */}
      <PatientMobileSimulator
        isOpen={isMobileSimulatorOpen}
        onClose={() => setIsMobileSimulatorOpen(false)}
        appointments={appointments}
        onRefreshClinicData={loadAllData}
      />

      {/* Executive ROI & Capacity Operations Report */}
      <ExecutiveROIReportModal
        isOpen={isROIReportOpen}
        onClose={() => setIsROIReportOpen(false)}
        analytics={analytics}
      />

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
