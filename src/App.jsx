import React, { useState } from 'react';
import { Search } from 'lucide-react';

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

export default function App() {
  const [activePage, setActivePage] = useState('Analytics');

  const renderContent = () => {
    switch (activePage) {
      case 'Analytics': return <Analytics />;
      case 'Case Logs': return <CaseLogs />;
      case 'Summons': return <Summons />;
      case 'Curfew Logs': return <CurfewLogs />;
      case 'Blacklisted': return <Blacklisted />;
      case 'Archived': return <Archived />;
      default: return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- SIDEBAR --- */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        
        {/* Logo Section */}
        <div className="p-4 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-blue-50 mb-2 overflow-hidden shadow-sm">
            <img src="/icon-nav/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <SidebarItem imageSrc="/icon-nav/analytics.png" label="Analytics" active={activePage === 'Analytics'} onClick={() => setActivePage('Analytics')} />
          <SidebarItem imageSrc="/icon-nav/case-logs.png" label="Case Logs" active={activePage === 'Case Logs'} onClick={() => setActivePage('Case Logs')} />
          <SidebarItem imageSrc="/icon-nav/summon.png" label="Summons" active={activePage === 'Summons'} onClick={() => setActivePage('Summons')} />
          <SidebarItem imageSrc="/icon-nav/curfew.png" label="Curfew Logs" active={activePage === 'Curfew Logs'} onClick={() => setActivePage('Curfew Logs')} />
          <SidebarItem imageSrc="/icon-nav/blacklisted.png" label="Blacklisted" active={activePage === 'Blacklisted'} onClick={() => setActivePage('Blacklisted')} />
          <SidebarItem imageSrc="/icon-nav/archived.png" label="Archived" active={activePage === 'Archived'} onClick={() => setActivePage('Archived')} />
        </nav>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* GLOBAL HEADER */}
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
          
          {/* Left Side: Barangay Name ONLY */}
          <div className="flex items-center">
            <h1 className="text-blue-600 font-bold text-lg tracking-wide whitespace-nowrap">Barangay 166, Caybiga, Caloocan City</h1>
          </div>

          {/* Right Side: Search Bar + Profile Icon */}
          <div className="flex items-center space-x-6 flex-1 justify-end">
            
            {/* CONDITIONAL SEARCH BAR: Hidden on Analytics page */}
            {activePage !== 'Analytics' && (
              <div className="relative w-full max-w-md">
                <input 
                  type="text" 
                  placeholder="" 
                  className="w-full bg-slate-50 border border-blue-100 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm transition-all shadow-inner" 
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} />
              </div>
            )}

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