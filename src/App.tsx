import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { AuthModal } from './components/AuthModal';
import { UserProfileDrawer } from './components/auth/UserProfileDrawer';
import { AgencyRoute } from './components/auth/AgencyRoute';
import { DashboardView } from './components/views/DashboardView';
import { JobsExplorerView } from './components/views/JobsExplorerView';
import { QualificationChecker } from './components/views/QualificationChecker';
import { AICenterView } from './components/views/AICenterView';
import { TrackerView } from './components/views/TrackerView';
import { CalendarView } from './components/views/CalendarView';
import { ProfileView } from './components/views/ProfileView';
import { AdminPortalView } from './components/views/AdminPortalView';
import { NotificationServiceView } from './components/views/NotificationServiceView';
import { SubscriptionView } from './components/views/SubscriptionView';
import { TestRunnerView } from './components/views/TestRunnerView';
import { DeploymentView } from './components/views/DeploymentView';
import { SourceRegistryView } from './components/views/SourceRegistryView';
import { CrawlerEngineView } from './components/views/CrawlerEngineView';
import { DocumentDownloaderView } from './components/views/DocumentDownloaderView';
import { GeminiExtractorView } from './components/views/GeminiExtractorView';
import { JobValidationView } from './components/views/JobValidationView';
import { CoverageDashboardView } from './components/views/CoverageDashboardView';
import { DataGovernanceView } from './components/views/DataGovernanceView';
import { AuditReportView } from './components/views/AuditReportView';
import { OperationsDashboardView } from './components/views/OperationsDashboardView';
import { Phase7OperationsDashboardView } from './components/views/Phase7OperationsDashboardView';
import { ProductionHardeningView } from './components/views/ProductionHardeningView';
import { PremiumDashboardView } from './components/views/PremiumDashboardView';
import { JobListing } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const handleNavigateToAI = (job: JobListing) => {
    setSelectedJob(job);
    setActiveTab('ai-center');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex relative overflow-hidden">
        {/* Task 7: Ambient Lighting Floating Glow Orbs */}
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />

        {/* Fixed Desktop Sidebar & Mobile Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative z-10 w-full max-w-full overflow-x-hidden">
          {/* Top Bar Header */}
          <TopBar
            activeTab={activeTab}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
          />

          {/* Dynamic Views Viewport with Framer Motion Page Transition */}
          <main className="flex-1 p-3 sm:p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onNavigate={setActiveTab}
                    onSelectJob={setSelectedJob}
                  />
                )}
                {activeTab === 'career-intelligence' && <PremiumDashboardView />}
                {activeTab === 'jobs' && (
                  <JobsExplorerView
                    selectedJobFromDash={selectedJob}
                    onNavigateToAI={handleNavigateToAI}
                  />
                )}
                {activeTab === 'checker' && <QualificationChecker />}
                {activeTab === 'ai-center' && (
                  <AICenterView initialJob={selectedJob} />
                )}
                {activeTab === 'tracker' && <TrackerView />}
                {activeTab === 'calendar' && <CalendarView />}
                {activeTab === 'coverage' && <CoverageDashboardView />}
                {activeTab === 'data-governance' && <DataGovernanceView />}
                {activeTab === 'operations' && <ProductionHardeningView />}
                {activeTab === 'phase7-operations' && <ProductionHardeningView />}
                {activeTab === 'production-hardening' && <ProductionHardeningView />}
                {activeTab === 'audit' && <AuditReportView />}
                {activeTab === 'sources' && <SourceRegistryView />}
                {activeTab === 'crawler' && <CrawlerEngineView />}
                {activeTab === 'downloader' && <DocumentDownloaderView />}
                {activeTab === 'extractor' && <GeminiExtractorView />}
                {activeTab === 'validator' && <JobValidationView />}
                {activeTab === 'profile' && <ProfileView />}
                {activeTab === 'notifications' && <NotificationServiceView />}
                {activeTab === 'subscription' && <SubscriptionView />}
                {activeTab === 'tests' && <TestRunnerView />}
                {activeTab === 'deployment' && <DeploymentView />}
                {activeTab === 'admin-portal' && (
                  <AgencyRoute>
                    <AdminPortalView />
                  </AgencyRoute>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global Auth Modal & Profile Drawer */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

        <UserProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
        />
      </div>
    </AuthProvider>
  );
}
