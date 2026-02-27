import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { LanguageProvider, useLanguage } from './LanguageContext'; // IMPORT THE CONTEXT

// Import all your pages
import Analytics from './Analytics';
import CaseLogs from './CaseLogs';
import Summons from './Summons';
import CurfewLogs from './CurfewLogs';
import Blacklisted from './Blacklisted';
import Archived from './Archived';

// --- SIDEBAR ITEM COMPONENT ---
const SidebarItem = ({ imageSrc, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      flex items-center space-x-3 px-3 py-3 rounded-lg cursor-pointer transition-all mb-2
      ${active 
        ? 'bg-blue-100 text-blue-900 shadow-sm border border-blue-200' 
        : 'text-gray-900 hover:bg-gray-100'}
    `}>
    <img 
      src={imageSrc} 
      alt={label} 
      className={`w-8 h-8 object-contain ${active ? 'opacity-100' : 'opacity-80'}`} 
    />
    <span className={`text-sm ${active ? 'font-extrabold' : 'font-bold'}`}>{label}</span>
  </div>
);

// --- MAIN APP COMPONENT (Where the logic lives) ---
function MainLayout() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  // Pull language tools from context
  const { language, setLanguage, t } = useLanguage();

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard': return <Analytics />;
      case 'Case Logs': return <CaseLogs />;
      case 'Summons': return <Summons />;
      case 'Curfew Logs': return <CurfewLogs />;
      case 'Blacklisted': return <Blacklisted />;
      case 'Archived': return <Archived />;
      default: return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800" onClick={() => setIsLangOpen(false)}>
      
      {/* --- SIDEBAR --- */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        
        {/* Logo Section */}
        <div className="p-4 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-blue-50 mb-2 overflow-hidden shadow-sm">
            <img src="/icon-nav/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Navigation (Using Translation Context) */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {/* UPDATED: Changed from Analytics to Dashboard */}
          <SidebarItem imageSrc="/icon-nav/analytics.png" label={t('dashboard') || 'Dashboard'} active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
          <SidebarItem imageSrc="/icon-nav/case-logs.png" label={t('case_logs')} active={activePage === 'Case Logs'} onClick={() => setActivePage('Case Logs')} />
          <SidebarItem imageSrc="/icon-nav/summon.png" label={t('summons')} active={activePage === 'Summons'} onClick={() => setActivePage('Summons')} />
          <SidebarItem imageSrc="/icon-nav/curfew.png" label={t('curfew_logs')} active={activePage === 'Curfew Logs'} onClick={() => setActivePage('Curfew Logs')} />
          <SidebarItem imageSrc="/icon-nav/blacklisted.png" label={t('blacklisted')} active={activePage === 'Blacklisted'} onClick={() => setActivePage('Blacklisted')} />
          <SidebarItem imageSrc="/icon-nav/archived.png" label={t('archived')} active={activePage === 'Archived'} onClick={() => setActivePage('Archived')} />
        </nav>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* GLOBAL HEADER */}
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
          
          {/* Left Side: Barangay Name (Translated) */}
          <div className="flex items-center">
            <h1 className="text-blue-600 font-bold text-lg tracking-wide whitespace-nowrap">
                {t('barangay_title')}
            </h1>
          </div>

          {/* Right Side: Language + Profile Icon (Search Bar Removed) */}
          <div className="flex items-center space-x-6 flex-1 justify-end">

            {/* --- LANGUAGE DROPDOWN --- */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsLangOpen(!isLangOpen); }}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-bold text-sm transition-colors p-2 rounded-lg hover:bg-slate-50"
              >
                <Globe size={20} />
                <span className="uppercase tracking-wider">
                    {language === 'en' ? 'ENG' : 'TAG'}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-3 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => { setLanguage('en'); setIsLangOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${language === 'en' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}
                  >
                    English (ENG)
                  </button>
                  <div className="h-px w-full bg-gray-100"></div>
                  <button
                    onClick={() => { setLanguage('tl'); setIsLangOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${language === 'tl' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}
                  >
                    Tagalog (TAG)
                  </button>
                </div>
              )}
            </div>

            {/* Profile Icon (Letter A) */}
            <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-slate-700 transition shrink-0">
              A
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        {renderContent()}
      </div>
    </div>
  );
}

// --- APP WRAPPER (Injects the Translation Data into the App) ---
export default function App() {
  return (
    <LanguageProvider>
      <MainLayout />
    </LanguageProvider>
  );
}