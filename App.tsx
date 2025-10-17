

import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Coffee, Droplets, FlaskConical, Trophy, Users, Search, BarChart, Lightbulb, Database, ClipboardCheck, Edit, Flame } from 'lucide-react';

import { UserRole, User, CuppingSessionType } from './types';
import { MOCK_DATA } from './constants';
import { DataContext } from './hooks/useDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar, Header } from './components/layout';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import ProcessorWorkbench from './components/processor/ProcessorWorkbench';
import CuppingHub from './components/cupper/CuppingHub';
import TraceabilityPage from './components/TraceabilityPage';
import CompetitionDashboard from './components/competition/CompetitionDashboard';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import HarvestLotDetail from './components/farmer/HarvestLotDetail';
import QualityInsights from './components/QualityInsights';
import CuppingSessionDetail from './components/cupper/CuppingSessionDetail';
import FarmerDataHub from './components/farmer/FarmerDataHub';
import GAPComplianceHelper from './components/farmer/GAPComplianceHelper';
import CupperScoringSheet from './components/cupper/CupperScoringSheet';
import TraceabilityHub from './components/TraceabilityHub';
import UserManagement from './components/UserManagement';
import RoasterWorkbench from './components/roaster/RoasterWorkbench';

// Protected routes component
const ProtectedRoutes: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [data, setData] = useState(MOCK_DATA);

  const contextValue = useMemo(() => ({ data, setData }), [data, setData]);

  const navItems = useMemo(() => {
    let competitionAdminHref = '/cupping'; // Default to hub

    if (currentUser) {
        const judgeSessions = data.cuppingSessions.filter(s =>
            s.type === CuppingSessionType.Competition &&
            s.judges.some(j => j.id === currentUser.id)
        );

        // Prioritize active sessions for the current user
        const activeSession = judgeSessions.find(s => s.status === 'Adjudication' || s.status === 'Scoring');

        if (activeSession) {
            competitionAdminHref = `/competition/${activeSession.id}`;
        } else if (judgeSessions.length > 0) {
            // Fallback to the most recent session they are part of
            const sortedSessions = [...judgeSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            competitionAdminHref = `/competition/${sortedSessions[0].id}`;
        }
    } else {
        // Fallback for when currentUser is not yet set, link to the first competition
        const firstCompetition = data.cuppingSessions.find(s => s.type === CuppingSessionType.Competition);
        if (firstCompetition) {
            competitionAdminHref = `/competition/${firstCompetition.id}`;
        }
    }

    return [
      // Main Dashboard
      { name: 'Dashboard', href: '/dashboard', icon: BarChart, roles: [UserRole.Farmer, UserRole.Processor, UserRole.Roaster, UserRole.Admin, UserRole.HeadJudge] },

      // Farmer Section
      { name: 'Farmer Dashboard', href: '/farmer-dashboard', icon: Coffee, roles: [UserRole.Farmer, UserRole.Admin] },
      { name: 'Data Hub', href: '/farmer-data-hub', icon: Database, roles: [UserRole.Farmer, UserRole.Admin] },
      { name: 'GAP Helper', href: '/gap-compliance', icon: ClipboardCheck, roles: [UserRole.Farmer, UserRole.Admin] },

      // Processor Section
      { name: 'Processor Workbench', href: '/processor', icon: Droplets, roles: [UserRole.Processor, UserRole.Admin] },

      // Quality & Cupping Section
      { name: 'Cupping Lab', href: '/cupping', icon: FlaskConical, roles: [UserRole.Processor, UserRole.Roaster, UserRole.HeadJudge, UserRole.Admin] },
      { name: 'Scoring Sheet', href: '/scoring', icon: Edit, roles: [UserRole.Cupper, UserRole.Admin] },
      { name: 'Competition Admin', href: competitionAdminHref, icon: Trophy, roles: [UserRole.HeadJudge, UserRole.Cupper, UserRole.Admin] },
      { name: 'Quality Insights', href: '/insights', icon: Lightbulb, roles: [UserRole.Roaster, UserRole.Processor, UserRole.Admin] },

      // Roaster Section
      { name: 'Roaster Workbench', href: '/roaster', icon: Flame, roles: [UserRole.Roaster, UserRole.Admin] },

      // Traceability & Admin
      { name: 'Traceability Hub', href: '/traceability', icon: Search, roles: [UserRole.Admin, UserRole.Processor] },
      { name: 'User Management', href: '/users', icon: Users, roles: [UserRole.Admin] },
    ];
  }, [currentUser, data.cuppingSessions]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DataContext.Provider value={contextValue}>
      <div className="flex h-screen bg-gray-50 text-gray-800">
        <Sidebar navItems={navItems} currentUserRole={currentUser?.role || UserRole.Farmer} />
        <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
          <Header currentUserRole={currentUser?.role || UserRole.Farmer} onRoleChange={() => {}} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 pt-16 lg:pt-4">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/processor" element={<ProcessorWorkbench currentUser={currentUser!} />} />
              <Route path="/roaster" element={<RoasterWorkbench currentUser={currentUser!} />} />
              <Route path="/cupping" element={<CuppingHub />} />
              <Route path="/cupping/:id" element={<CuppingSessionDetail currentUser={currentUser!} />} />
              <Route path="/scoring" element={<CupperScoringSheet currentUser={currentUser!} />} />
              <Route path="/insights" element={<QualityInsights />} />
              <Route path="/competition/:id" element={<CompetitionDashboard currentUserRole={currentUser?.role || UserRole.Farmer} />} />
              <Route path="/traceability" element={<TraceabilityHub />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer-dashboard/:lotId" element={<HarvestLotDetail />} />
              <Route path="/farmer-data-hub" element={<FarmerDataHub currentUser={currentUser!} />} />
              <Route path="/gap-compliance" element={<GAPComplianceHelper />} />
            </Routes>
          </main>
        </div>
      </div>
    </DataContext.Provider>
  );
};

const App: React.FC = () => {
  const [data] = useState(MOCK_DATA);
  const contextValue = useMemo(() => ({ data, setData: () => {} }), [data]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Public Route - ไม่ต้องล็อกอิน */}
        <Route
          path="/traceability/:lotId"
          element={
            <DataContext.Provider value={contextValue}>
              <TraceabilityPage />
            </DataContext.Provider>
          }
        />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;