import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import TeacherPortal from './components/TeacherPortal';
import ParentPortal from './components/ParentPortal';
import PrincipalPortal from './components/PrincipalPortal';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SchoolInfoModal from './components/SchoolInfoModal';
import type { Teacher, Student, Principal } from './types';

type Portal = 'landing' | 'teacher' | 'parent' | 'principal';
type User = Teacher | Student | Principal;

const App: React.FC = () => {
  const [activePortal, setActivePortal] = useState<Portal>('landing');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSchoolInfoVisible, setIsSchoolInfoVisible] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleShowSchoolInfo = useCallback(() => {
    setIsSchoolInfoVisible(true);
    closeSidebar();
  }, [closeSidebar]);

  const handleCloseSchoolInfo = useCallback(() => {
    setIsSchoolInfoVisible(false);
  }, []);

  const handlePortalSelect = useCallback((portal: Portal) => {
    setActivePortal(portal);
    setLoggedInUser(null); // Reset user on new portal selection
    closeSidebar();
  }, [closeSidebar]);

  const handleBackToHome = useCallback(() => {
    setActivePortal('landing');
    setLoggedInUser(null);
    closeSidebar();
  }, [closeSidebar]);

  const handleLoginSuccess = useCallback((user: User) => {
    setLoggedInUser(user);
    closeSidebar();
  }, [closeSidebar]);

  const renderPortal = () => {
    switch (activePortal) {
      case 'teacher':
        return loggedInUser ? 
            <TeacherPortal onBack={handleBackToHome} teacher={loggedInUser as Teacher} /> : 
            <Login portalType="teacher" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'parent':
        return loggedInUser ? 
            <ParentPortal onBack={handleBackToHome} student={loggedInUser as Student} /> : 
            <Login portalType="parent" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'principal':
        return loggedInUser ? 
            <PrincipalPortal onBack={handleBackToHome} principal={loggedInUser as Principal} /> : 
            <Login portalType="principal" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-cyan-100 to-white font-sans flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        onNavigate={handlePortalSelect}
        onGoHome={handleBackToHome}
        onShowSchoolInfo={handleShowSchoolInfo}
        isLoggedIn={!!loggedInUser}
        onLogout={handleBackToHome}
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 md:pl-64 min-h-screen">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
          {renderPortal()}
        </main>
      </div>
      {/* Modal Info Sekolah */}
      {isSchoolInfoVisible && <SchoolInfoModal onClose={handleCloseSchoolInfo} />}
    </div>
  );
};

export default App;