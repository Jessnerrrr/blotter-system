import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import Swal from 'sweetalert2'; 
import { LanguageProvider, useLanguage } from './components/LanguageContext'; 
import { MainButton } from './components/buttons/Buttons';

import Dashboard from './components/Dashboard'; 
import CaseLogs from './components/CaseLogs';
import Summons from './components/Summons';
import CurfewLogs from './components/CurfewLogs';
import Blacklisted from './components/Blacklisted';
import Archived from './components/Archived';
import Settings from './components/Settings'; 
import { LogoProvider, useLogo } from './components/LogoContext';

function MainLayout() {
  // Read from local storage first, default to Dashboard if empty
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem('saved_active_page') || 'Dashboard';
  });
  
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const { t } = useLanguage();
  const { logoUrl } = useLogo();

  // Save to local storage every time the page changes
  useEffect(() => {
    localStorage.setItem('saved_active_page', activePage);
  }, [activePage]);

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard />;
      case 'Case Logs': return <CaseLogs />;
      case 'Summons': return <Summons />;
      case 'Curfew Logs': return <CurfewLogs />;
      case 'Blacklisted': return <Blacklisted />;
      case 'Archived': return <Archived />;
      case 'Settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- SIDEBAR --- */}
      <div 
        className={`bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${isSidebarHovered ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className={`flex flex-col items-center justify-center transition-all duration-300 ${isSidebarHovered ? 'p-4 h-40' : 'p-2 h-24 mt-4'}`}>
          <div className={`rounded-full border-blue-50 overflow-hidden shadow-sm transition-all duration-300 ${isSidebarHovered ? 'w-28 h-28 border-4 mb-2' : 'w-10 h-10 border-2'}`}>
           <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-x-hidden flex flex-col">
          <div className="flex-1">
            <MainButton imageSrc="/analytics.png" label={t('dashboard') || 'Dashboard'} active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} isExpanded={isSidebarHovered} />
            <MainButton imageSrc="/icon-nav/case-logs.png" label={t('case_logs')} active={activePage === 'Case Logs'} onClick={() => setActivePage('Case Logs')} isExpanded={isSidebarHovered} />
            <MainButton imageSrc="/summon.png" label={t('summons')} active={activePage === 'Summons'} onClick={() => setActivePage('Summons')} isExpanded={isSidebarHovered} />
            <MainButton imageSrc="/curfew.png" label={t('curfew_logs')} active={activePage === 'Curfew Logs'} onClick={() => setActivePage('Curfew Logs')} isExpanded={isSidebarHovered} />
            <MainButton imageSrc="/blacklisted.png" label={t('blacklisted')} active={activePage === 'Blacklisted'} onClick={() => setActivePage('Blacklisted')} isExpanded={isSidebarHovered} />
            <MainButton imageSrc="/archived.png" label={t('archived')} active={activePage === 'Archived'} onClick={() => setActivePage('Archived')} isExpanded={isSidebarHovered} />
          </div>

          {/* Bottom actions (Logout & Settings) */}
          <div className="mt-auto border-t border-gray-100 pt-2 mb-2">
            
            {/* --- LOGOUT BUTTON --- */}
            <button 
              onClick={() => {
                Swal.fire({
                  title: 'Are you sure you want to logout?',
                  text: 'You will be returned to the login screen.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#d33',
                  cancelButtonColor: '#3085d6',
                  confirmButtonText: 'Yes, log out',
                  cancelButtonText: 'Cancel'
                }).then((result) => {
                  if (result.isConfirmed) {
                    // Clear the saved page
                    localStorage.removeItem('saved_active_page');
                    
                    // Redirect to the deployed system (replace current history entry)
                    window.location.replace('https://barangay-profiling-private.vercel.app/portal.html'); 
                  }
                });
              }}
              title={!isSidebarHovered ? "Logout" : ""}
              className="w-full flex items-center px-3 py-3 mb-1 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden text-red-600 hover:bg-red-50"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8">
                <LogOut className="w-6 h-6 transition-transform duration-300 hover:scale-110" strokeWidth={2.5} />
              </div>
              <span className={`text-sm font-bold transition-all duration-300 ease-in-out whitespace-nowrap ${isSidebarHovered ? 'opacity-100 ml-3 w-auto translate-x-0' : 'opacity-0 w-0 ml-0 -translate-x-4'}`}>
                Logout
              </span>
            </button>

            {/* --- EXISTING SETTINGS BUTTON --- */}
            <button 
              onClick={() => setActivePage('Settings')}
              title={!isSidebarHovered ? "Settings" : ""}
              className={`w-full flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden ${activePage === 'Settings' ? 'bg-blue-100 text-blue-900 shadow-sm border border-blue-200' : 'text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8">
                <SettingsIcon className={`w-6 h-6 transition-all duration-300 ${activePage === 'Settings' ? 'text-blue-600 opacity-100' : 'text-slate-600 opacity-80'}`} />
              </div>
              <span className={`text-sm transition-all duration-300 ease-in-out whitespace-nowrap ${activePage === 'Settings' ? 'font-extrabold' : 'font-bold'} ${isSidebarHovered ? 'opacity-100 ml-3 w-auto translate-x-0' : 'opacity-0 w-0 ml-0 -translate-x-4'}`}>
                Settings
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center">
            <h1 className="text-blue-600 font-bold text-lg tracking-wide whitespace-nowrap">
                {t('barangay_title')}
            </h1>
          </div>

          <div className="flex items-center space-x-6 flex-1 justify-end">
            <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-slate-700 transition shrink-0">A</div>
          </div>
        </header>

        {renderContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <LogoProvider>
        <MainLayout />
      </LogoProvider>
    </LanguageProvider>
  );
}