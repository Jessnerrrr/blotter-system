import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { LanguageProvider, useLanguage } from './components/LanguageContext'; 
import { MainButton } from './components/buttons/Buttons';

import Dashboard from './components/Dashboard'; 
import CaseLogs from './components/CaseLogs';
import Summons from './components/Summons';
import CurfewLogs from './components/CurfewLogs';
import Blacklisted from './components/Blacklisted';
import Archived from './components/Archived';

function MainLayout() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  const { language, setLanguage, t } = useLanguage();

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard />;
      case 'Case Logs': return <CaseLogs />;
      case 'Summons': return <Summons />;
      case 'Curfew Logs': return <CurfewLogs />;
      case 'Blacklisted': return <Blacklisted />;
      case 'Archived': return <Archived />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800" onClick={() => setIsLangOpen(false)}>
      
      {/* --- SIDEBAR --- */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        <div className="p-4 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-blue-50 mb-2 overflow-hidden shadow-sm">
            {/* Simple public folder path! */}
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {/* Simple public folder paths! */}
          <MainButton imageSrc="/analytics.png" label={t('dashboard') || 'Dashboard'} active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
<MainButton imageSrc="/icon-nav/case-logs.png" label={t('case_logs')} active={activePage === 'Case Logs'} onClick={() => setActivePage('Case Logs')} />
          <MainButton imageSrc="/summon.png" label={t('summons')} active={activePage === 'Summons'} onClick={() => setActivePage('Summons')} />
          <MainButton imageSrc="/curfew.png" label={t('curfew_logs')} active={activePage === 'Curfew Logs'} onClick={() => setActivePage('Curfew Logs')} />
          <MainButton imageSrc="/blacklisted.png" label={t('blacklisted')} active={activePage === 'Blacklisted'} onClick={() => setActivePage('Blacklisted')} />
          <MainButton imageSrc="/archived.png" label={t('archived')} active={activePage === 'Archived'} onClick={() => setActivePage('Archived')} />
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
                  <button onClick={() => { setLanguage('en'); setIsLangOpen(false); }} className={`w-full text-left px-5 py-3 text-sm transition-colors ${language === 'en' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}>English (ENG)</button>
                  <div className="h-px w-full bg-gray-100"></div>
                  <button onClick={() => { setLanguage('tl'); setIsLangOpen(false); }} className={`w-full text-left px-5 py-3 text-sm transition-colors ${language === 'tl' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}>Tagalog (TAG)</button>
                </div>
              )}
            </div>

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
      <MainLayout />
    </LanguageProvider>
  );
}