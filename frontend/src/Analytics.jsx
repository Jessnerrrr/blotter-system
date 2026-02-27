import React, { useState, useEffect } from 'react';
import { FileText, UserX, Download, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext'; // TRANSLATION HOOK

// Mock data for charts
const BAR_DATA = [
  { month: 'JAN', LUPON: 35, VAWC: 20, BLOTTER: 25, COMPLAIN: 20 },
  { month: 'FEB', LUPON: 40, VAWC: 15, BLOTTER: 30, COMPLAIN: 15 },
  { month: 'MAR', LUPON: 30, VAWC: 25, BLOTTER: 25, COMPLAIN: 20 },
  { month: 'APR', LUPON: 45, VAWC: 20, BLOTTER: 20, COMPLAIN: 15 },
  { month: 'MAY', LUPON: 38, VAWC: 22, BLOTTER: 25, COMPLAIN: 15 },
  { month: 'JUN', LUPON: 42, VAWC: 18, BLOTTER: 22, COMPLAIN: 18 },
  { month: 'JUL', LUPON: 35, VAWC: 20, BLOTTER: 28, COMPLAIN: 17 },
  { month: 'AUG', LUPON: 33, VAWC: 22, BLOTTER: 27, COMPLAIN: 18 },
  { month: 'SEP', LUPON: 40, VAWC: 19, BLOTTER: 26, COMPLAIN: 15 },
  { month: 'OCT', LUPON: 37, VAWC: 21, BLOTTER: 24, COMPLAIN: 18 },
];

const PIE_DATA = [
  { label: 'LUPON', percentage: 35, color: 'bg-blue-800', hexColor: '#1e40af', startAngle: 0, endAngle: 126 }, 
  { label: 'VAWC', percentage: 20, color: 'bg-red-500', hexColor: '#ef4444', startAngle: 126, endAngle: 198 }, 
  { label: 'BLOTTER', percentage: 25, color: 'bg-yellow-400', hexColor: '#eab308', startAngle: 198, endAngle: 288 }, 
  { label: 'COMPLAIN', percentage: 20, color: 'bg-green-500', hexColor: '#22c55e', startAngle: 288, endAngle: 360 }, 
];

const activityColors = [
  'bg-[#dca41b]', 'bg-[#109f61]', 'bg-[#2157d6]', 'bg-[#1f2937]', 'bg-[#0aa4df]', 'bg-[#dc2626]', 'bg-[#109f61]',
];

const getSafeTimestamp = (dateStr, timeStr = '') => {
  if (!dateStr) return Date.now();
  try {
      let parsed = new Date(`${dateStr} ${timeStr}`).getTime();
      if (isNaN(parsed)) parsed = new Date(dateStr).getTime();
      return isNaN(parsed) ? Date.now() : parsed;
  } catch (e) {
      return Date.now();
  }
};

const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

export default function Analytics() {
  const { t } = useLanguage(); 
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPieSegment, setHoveredPieSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState(null);
  
  const [tick, setTick] = useState(0);
  const [casesData, setCasesData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadAllData = () => {
      const storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      const storedSummons = JSON.parse(localStorage.getItem('summons') || '[]');
      const storedCurfews = JSON.parse(localStorage.getItem('curfew_violations') || '[]'); 
      const storedCurfewNotes = JSON.parse(localStorage.getItem('curfew_folders') || '[]'); 
      
      setCasesData(storedCases);

      // --- SMART DELTA TRACKER (History Engine) ---
      let history = JSON.parse(localStorage.getItem('activity_history') || '[]');
      let historyChanged = false;

      // --- LOGICAL FIX: HISTORY AUTO-CLEANER ---
      const originalHistoryLength = history.length;
      history = history.filter(h => !h.title.includes('11111'));
      if (history.length !== originalHistoryLength) {
          historyChanged = true;
      }

      const lastSeenCases = JSON.parse(localStorage.getItem('analytics_seen_cases') || '{}');
      const lastSeenSummons = JSON.parse(localStorage.getItem('analytics_seen_summons') || '{}');
      const lastSeenCurfews = JSON.parse(localStorage.getItem('analytics_seen_curfews') || '{}');
      const lastSeenNotes = JSON.parse(localStorage.getItem('analytics_seen_notes') || '{}');

      const currentSeenCases = {};
      const currentSeenSummons = {};
      const currentSeenCurfews = {};
      const currentSeenNotes = {};

      // 1. Evaluate Cases
      storedCases.forEach(c => {
          currentSeenCases[c.caseNo] = c.status;

          if (!lastSeenCases[c.caseNo]) {
              history.push({
                  id: `case_new_${c.caseNo}_${Date.now()}_${Math.random()}`,
                  title: `${c.caseNo} - NEW CASE LOGGED`,
                  actionText: `Created by ${c.fullData?.selectedRole || 'System'}`,
                  editor: c.fullData?.selectedRole || 'System',
                  timestamp: getSafeTimestamp(c.date)
              });
              historyChanged = true;
          } else if (lastSeenCases[c.caseNo] !== c.status) {
              let actionLabel = `CASE ${c.status}`;
              if (c.status === 'SETTLED') actionLabel = 'CASE SETTLED & ARCHIVED';

              history.push({
                  id: `case_update_${c.caseNo}_${Date.now()}_${Math.random()}`,
                  title: `${c.caseNo} - ${actionLabel}`,
                  actionText: `Status updated from ${lastSeenCases[c.caseNo]} to ${c.status}`,
                  editor: c.fullData?.selectedRole || 'System',
                  timestamp: Date.now()
              });
              historyChanged = true;
          }
      });

      // 2. Evaluate Summons
      storedSummons.forEach(s => {
          const sKey = `${s.caseNo}_${s.summonType}`;
          currentSeenSummons[sKey] = true;

          if (!lastSeenSummons[sKey]) {
              history.push({
                  id: `summon_${sKey}_${Date.now()}_${Math.random()}`,
                  title: `${s.caseNo} - SUMMON NO. ${s.summonType} ISSUED`,
                  actionText: `Assigned to ${s.residentName}`,
                  editor: s.notedBy || 'System',
                  timestamp: s.id || Date.now()
              });
              historyChanged = true;
          }
      });

      // 3. Evaluate Curfews
      storedCurfews.forEach(cv => {
          currentSeenCurfews[cv.id] = cv.status;

          if (!lastSeenCurfews[cv.id]) {
              history.push({
                  id: `curfew_new_${cv.id}_${Date.now()}_${Math.random()}`,
                  title: `CURFEW - NEW VIOLATION LOGGED`,
                  actionText: `Resident: ${cv.resident.toUpperCase()}`,
                  editor: 'Patrol Officer',
                  timestamp: getSafeTimestamp(cv.date, cv.time)
              });
              historyChanged = true;
          } else if (lastSeenCurfews[cv.id] !== cv.status) {
              history.push({
                  id: `curfew_update_${cv.id}_${Date.now()}_${Math.random()}`,
                  title: `CURFEW - CASE ${cv.status.toUpperCase()}`,
                  actionText: `Status updated to ${cv.status}`,
                  editor: 'Admin',
                  timestamp: Date.now()
              });
              historyChanged = true;
          }
      });

      // 4. Evaluate Curfew Notes
      storedCurfewNotes.forEach(note => {
          currentSeenNotes[note.id] = true;
          if (!lastSeenNotes[note.id]) {
              history.push({
                  id: `note_${note.id}_${Date.now()}_${Math.random()}`,
                  title: `CURFEW NOTE ADDED - ${note.name.toUpperCase()}`,
                  actionText: `For Resident ID ${note.residentId}`,
                  editor: 'Admin',
                  timestamp: getSafeTimestamp(note.date, note.time)
              });
              historyChanged = true;
          }
      });

      localStorage.setItem('analytics_seen_cases', JSON.stringify(currentSeenCases));
      localStorage.setItem('analytics_seen_summons', JSON.stringify(currentSeenSummons));
      localStorage.setItem('analytics_seen_curfews', JSON.stringify(currentSeenCurfews));
      localStorage.setItem('analytics_seen_notes', JSON.stringify(currentSeenNotes));

      if (historyChanged) {
          localStorage.setItem('activity_history', JSON.stringify(history));
      }

      history.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(history.slice(0, 7));
    };

    loadAllData();
    window.addEventListener('storage', loadAllData);
    return () => window.removeEventListener('storage', loadAllData);
  }, []);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthYearString = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const calendarGrid = [];
  for (let i = 0; i < firstDayIndex; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);
  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) calendarGrid.push(null);

  const handleOpenPrint = () => setIsPrintModalOpen(true);
  
  const handleCancelPrint = () => {
    Swal.fire({
      title: t('discard_changes'),
      text: t('unsaved_lost'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('yes_discard'),
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) setIsPrintModalOpen(false);
    });
  };

  const handlePrintSubmit = () => {
    Swal.fire({
      title: t('confirm_print_title'),
      text: t('confirm_print_text'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0066FF',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes_print'),
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) setTimeout(() => { window.print(); }, 300);
    });
  };

  const handleMouseMove = (event) => setTooltipPosition({ x: event.clientX, y: event.clientY });

  // Compute total cases per category from real casesData
  const getCategoryTotal = (category) => {
    const map = { LUPON: 'LUPON', VAWC: 'VAWC', BLOTTER: 'BLOTTER', COMPLAIN: 'COMPLAINT' };
    const key = map[category] || category;
    const count = casesData.filter(c => c.caseType && c.caseType.toUpperCase().includes(key)).length;
    return count > 0 ? count : BAR_DATA.reduce((sum, m) => sum + (m[category] || 0), 0);
  };

  // Returns per-user case counts for a given category
  const getCasesPerUser = (category) => {
    const map = { LUPON: 'LUPON', VAWC: 'VAWC', BLOTTER: 'BLOTTER', COMPLAIN: 'COMPLAINT' };
    const key = map[category] || category;
    const filtered = casesData.filter(c => c.caseType && c.caseType.toUpperCase().includes(key));

    if (filtered.length === 0) {
      // Fallback mock users when no real data
      return [
        { user: 'Admin', count: Math.round(BAR_DATA.reduce((s, m) => s + (m[category] || 0), 0) * 0.5) },
        { user: 'Secretary', count: Math.round(BAR_DATA.reduce((s, m) => s + (m[category] || 0), 0) * 0.3) },
        { user: 'Officer', count: Math.round(BAR_DATA.reduce((s, m) => s + (m[category] || 0), 0) * 0.2) },
      ];
    }

    const userMap = {};
    filtered.forEach(c => {
      const user = c.fullData?.selectedRole || c.createdBy || 'Unknown';
      userMap[user] = (userMap[user] || 0) + 1;
    });
    return Object.entries(userMap)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count);
  };

  const handleBarHover = (monthIndex, category, percentage, event) => {
    const total = getCategoryTotal(category);
    const usersBreakdown = getCasesPerUser(category);
    setHoveredBar({ month: BAR_DATA[monthIndex].month, category, percentage });
    setTooltipContent({ month: BAR_DATA[monthIndex].month, category, percentage, total, usersBreakdown });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handlePieHover = (segment, event) => {
    const total = getCategoryTotal(segment.label);
    const usersBreakdown = getCasesPerUser(segment.label);
    setHoveredPieSegment(segment);
    setTooltipContent({ label: segment.label, percentage: segment.percentage, total, usersBreakdown });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    setHoveredPieSegment(null);
    setTooltipContent(null);
  };

  const SVG_SIZE = 200;
  const OUTER_R = 90;
  const INNER_R = 58;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const buildDonutPath = (startAngle, endAngle, outerR, innerR) => {
    const sweep = endAngle - startAngle;
    const clampedEnd = sweep >= 360 ? startAngle + 359.999 : endAngle;
    const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;
    const o1 = polarToCartesian(CX, CY, outerR, startAngle);
    const o2 = polarToCartesian(CX, CY, outerR, clampedEnd);
    const i1 = polarToCartesian(CX, CY, innerR, clampedEnd);
    const i2 = polarToCartesian(CX, CY, innerR, startAngle);
    return [ `M ${o1.x} ${o1.y}`, `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`, `L ${i1.x} ${i1.y}`, `A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x} ${i2.y}`, 'Z'].join(' ');
  };

  const renderPrintModal = () => {
    if (!isPrintModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex justify-center overflow-y-auto font-sans py-10 print:p-0 print:overflow-visible print:block">
        <div id="printable-content" className="bg-white shadow-2xl relative flex flex-col justify-between text-black font-sans shrink-0 border-[3px] border-blue-500 print:border-none print:shadow-none print:w-full print:h-full print:m-0" style={{ width: '210mm', height: '297mm', padding: '15mm 20mm' }}>
            <div>
                <div className="flex flex-col items-center text-center mb-8 w-full">
                    <div className="h-24 w-24 mb-2 flex items-center justify-center">
                        <img src="/icon-analytics/analyticsprint logo.png" alt="Republic Logo" className="h-full w-full object-contain" />
                    </div>
                    <p className="text-sm font-normal text-gray-900">Republic of the Philippines</p>
                    <h1 className="text-2xl font-black text-blue-700 uppercase tracking-wide mt-1 print:text-blue-700">BARANGAY 166, CAYBIGA</h1>
                    <p className="text-xs font-bold text-gray-600 uppercase">ZONE 15 DISTRICT I, CALOOCAN CITY</p>
                    <p className="text-xs font-bold text-gray-600 uppercase">#1 GEN LUIS. ST, CAYBIGA CALOOCAN CITY</p>
                </div>
                <div className="text-center mb-10 w-full">
                    <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">TANGGAPAN NG LUPON TAGAMAPAYAMAPA</h2>
                    <div className="w-full flex justify-end mt-6"><p className="text-xs font-bold text-gray-800 uppercase">{monthYearString}</p></div>
                </div>
                <div className="text-center mb-8 w-full">
                    <h3 className="text-xl font-black text-gray-900 uppercase">MONTHLY TRANSMITTAL OF FINAL REPORTS</h3>
                </div>
                <div className="mb-6 text-sm text-gray-900 w-full">
                    <div className="flex gap-4 mb-6 pl-4">
                        <span className="font-bold w-8">TO:</span>
                        <div className="flex flex-col"><p className="font-bold">City / Municipal Judge</p><p className="font-normal">Caloocan City</p></div>
                    </div>
                    <p className="text-justify leading-relaxed indent-12">Enclosed herewith are the final reports of settlement of disputes and arbitration awards made by the Barangay Captain / Pangkat Tagapagkasundo in the following case:</p>
                </div>
                <div className="mb-12 w-full font-sans">
                    <table className="w-full border-collapse border border-black">
                        <thead>
                            <tr className="bg-gray-300 print:bg-gray-300">
                                <th className="border border-black py-2 px-4 text-center font-bold text-sm w-1/3 align-middle text-black print:text-black">Barangay Case No.</th>
                                <th className="border border-black py-2 px-4 text-center font-bold text-sm align-middle text-black print:text-black">Official Case Record<span className="block text-[10px] font-normal italic">(Complainant vs Respondent)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {casesData.length > 0 ? casesData.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-black py-3 px-4 text-center text-sm font-bold align-middle">{item.caseNo}</td>
                                    <td className="border border-black py-3 px-4 text-center text-sm font-medium align-middle uppercase">{item.complainantName || 'N/A'} VS {item.resident || 'N/A'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="2" className="border border-black py-6 px-4 text-center text-sm font-bold text-gray-500">No cases recorded yet.</td></tr>
                            )}
                            <tr><td className="border border-black py-3 px-4">&nbsp;</td><td className="border border-black py-3 px-4">&nbsp;</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <div className="w-full flex justify-end mb-8"><div className="text-center w-64"><div className="border-b border-black mb-2"></div><p className="font-bold text-sm">Clerk of Court</p></div></div>
                <div className="w-full relative">
                    <div className="text-[10px] text-gray-700 w-full mb-4"><p className="font-bold">IMPORTANT: <span className="font-normal">The Lupon / Pangkat Secretary shall transmit, not later than the first day for preceding month.</span></p></div>
                    <div className="flex items-end justify-center relative h-24 w-full">
                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 z-10"><img src="/icon-analytics/analytics footerprint.png" alt="Bagong Pilipinas" className="h-16 object-contain" /></div>
                        <div className="absolute right-0 bottom-4 flex gap-2 print:hidden z-20">
                            <button onClick={handleCancelPrint} className="px-6 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded shadow-sm hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                            <button onClick={handlePrintSubmit} className="px-8 py-1.5 bg-[#007bff] text-white text-xs font-bold rounded shadow-sm hover:bg-blue-600 transition-colors uppercase tracking-wide">PRINT</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  // Tooltip component
  const renderTooltip = () => {
    if (!tooltipContent) return null;
    const isBar = !!tooltipContent.month;
    return (
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{ left: tooltipPosition.x + 16, top: tooltipPosition.y - 20 }}
      >
        <div
          className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 min-w-[190px]"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {/* Header */}
          {isBar ? (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{tooltipContent.month}</p>
              <p className="text-sm font-extrabold text-white">{tooltipContent.category}</p>
            </>
          ) : (
            <p className="text-sm font-extrabold text-white">{tooltipContent.label}</p>
          )}

          {/* Divider */}
          <div className="border-t border-white/10 my-2" />

          {/* Total */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-400 font-semibold">Total Cases</span>
            <span className="text-base font-black text-yellow-400">{tooltipContent.total}</span>
          </div>

 
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 font-sans">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-content, #printable-content * { visibility: visible; }
          #printable-content { position: fixed; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 20mm !important; border: none !important; box-shadow: none !important; background: white !important; z-index: 9999; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      {renderPrintModal()}
      {renderTooltip()}

      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex justify-between items-center h-40 border border-blue-800">
            <div className="z-10">
              <h3 className="text-5xl font-bold tracking-tight">{casesData.length || '0'}</h3>
              <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mt-2">{t('total_cases')}</p>
            </div>
            <div className="p-4"><FileText size={40} className="text-blue-100" /></div>
          </div>
          <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex justify-between items-center h-40 border border-emerald-600">
            <div className="z-10">
              <h3 className="text-5xl font-bold tracking-tight">{casesData.filter(c => c.status === 'BLACKLISTED').length || '0'}</h3>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider mt-2">{t('total_blacklisted')}</p>
            </div>
            <div className="p-4"><UserX size={40} className="text-emerald-100" /></div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-8">
            <div><h3 className="text-2xl font-bold text-blue-900">{t('total_cases_trend')}</h3><p className="text-sm text-gray-500 font-medium mt-1">{t('cases_reported_per_month')}</p></div>
            <button onClick={handleOpenPrint} className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors border border-blue-950"><Download size={16} /><span>{t('export_pdf')}</span></button>
          </div>
          <div className="relative h-80 w-full pl-12 pb-8">
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs font-bold text-gray-400"><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span></div>
            <div className="absolute left-10 right-0 top-0 bottom-8 flex flex-col justify-between z-0">{[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-200 w-full h-0"></div>)}</div>
            <div className="absolute inset-0 left-10 bottom-8 flex items-end justify-between px-4 z-10">
              {BAR_DATA.map((monthData, monthIndex) => (
                <div key={monthData.month} className="flex flex-col items-center flex-1 h-full justify-end group space-y-2">
                  <div className="flex space-x-1.5 items-end h-full w-full justify-center">
                    {/* LUPON */}
                    <div
                      className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                      style={{
                        height: `${monthData.LUPON}%`,
                        backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'LUPON' ? '#1d4ed8' : '#2563eb',
                        transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'LUPON' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                        transformOrigin: 'bottom',
                        filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'LUPON' ? 'brightness(1.2) drop-shadow(0 0 4px #3b82f6)' : 'none',
                      }}
                      onMouseEnter={(e) => handleBarHover(monthIndex, 'LUPON', monthData.LUPON, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                    {/* VAWC */}
                    <div
                      className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                      style={{
                        height: `${monthData.VAWC}%`,
                        backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'VAWC' ? '#dc2626' : '#ef4444',
                        transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'VAWC' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                        transformOrigin: 'bottom',
                        filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'VAWC' ? 'brightness(1.2) drop-shadow(0 0 4px #f87171)' : 'none',
                      }}
                      onMouseEnter={(e) => handleBarHover(monthIndex, 'VAWC', monthData.VAWC, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                    {/* BLOTTER */}
                    <div
                      className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                      style={{
                        height: `${monthData.BLOTTER}%`,
                        backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'BLOTTER' ? '#ca8a04' : '#eab308',
                        transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'BLOTTER' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                        transformOrigin: 'bottom',
                        filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'BLOTTER' ? 'brightness(1.2) drop-shadow(0 0 4px #facc15)' : 'none',
                      }}
                      onMouseEnter={(e) => handleBarHover(monthIndex, 'BLOTTER', monthData.BLOTTER, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                    {/* COMPLAIN */}
                    <div
                      className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                      style={{
                        height: `${monthData.COMPLAIN}%`,
                        backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'COMPLAIN' ? '#16a34a' : '#22c55e',
                        transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'COMPLAIN' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                        transformOrigin: 'bottom',
                        filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'COMPLAIN' ? 'brightness(1.2) drop-shadow(0 0 4px #4ade80)' : 'none',
                      }}
                      onMouseEnter={(e) => handleBarHover(monthIndex, 'COMPLAIN', monthData.COMPLAIN, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute left-10 right-0 bottom-0 flex justify-between px-4">{BAR_DATA.map((monthData) => (<div key={monthData.month} className="flex-1 text-center text-xs font-bold text-gray-500 pt-2">{monthData.month}</div>))}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Pie Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
               <h3 className="text-xl font-bold text-blue-900 mb-8">{t('case_analytics_category')}</h3>
               <div className="flex items-center justify-center space-x-16">
                 <svg
                   width={SVG_SIZE}
                   height={SVG_SIZE}
                   viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                   className="shrink-0 drop-shadow-md"
                   style={{ overflow: 'visible' }}
                 >
                   {PIE_DATA.map((segment) => {
                     const isHovered = hoveredPieSegment?.label === segment.label;
                     return (
                       <path
                         key={segment.label}
                         d={buildDonutPath(segment.startAngle, segment.endAngle, OUTER_R, INNER_R)}
                         fill={segment.hexColor}
                         stroke="white"
                         strokeWidth="2"
                         className="cursor-pointer"
                         style={{
                           opacity: hoveredPieSegment && !isHovered ? 0.45 : 1,
                           transform: isHovered ? 'scale(1.07)' : 'scale(1)',
                           transformOrigin: `${CX}px ${CY}px`,
                           filter: isHovered ? `drop-shadow(0 0 6px ${segment.hexColor})` : 'none',
                           transition: 'all 0.15s ease',
                         }}
                         onMouseEnter={(e) => handlePieHover(segment, e)}
                         onMouseMove={handleMouseMove}
                         onMouseLeave={handleMouseLeave}
                       />
                     );
                   })}
                   <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="middle" className="font-bold" style={{ fontSize: 13, fill: '#1e3a5f', fontWeight: 700 }}>
                     {hoveredPieSegment ? hoveredPieSegment.percentage + '%' : 'CASES'}
                   </text>
                   <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: '#6b7280', fontWeight: 600 }}>
                     {hoveredPieSegment ? hoveredPieSegment.label : 'BY TYPE'}
                   </text>
                 </svg>

                 {/* Right-side legend — percentages retained */}
                 <div className="space-y-4 w-full max-w-[160px]">
                    {PIE_DATA.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-sm font-bold text-gray-600 cursor-help transition-opacity duration-150"
                        style={{ opacity: hoveredPieSegment && hoveredPieSegment.label !== item.label ? 0.45 : 1 }}
                        onMouseEnter={(e) => handlePieHover(item, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center"><span className={`w-4 h-4 ${item.color} mr-3 rounded-md`}></span>{item.label}</div>
                        <div className="flex flex-col items-end ml-2">
                          <span className="text-xs text-gray-400">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            {/* Calendar */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-blue-900">{t('daily_cases_overview')}</h3>
                 <span className="text-xl font-bold text-blue-900 uppercase tracking-wide">{monthYearString}</span>
               </div>
               <div className="border-t border-l border-slate-300">
                 <div className="grid grid-cols-7 text-center bg-blue-700 text-white">
                   {[t('sun'),t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat')].map(d => <div key={d} className="py-3 text-xs font-bold border-r border-b border-slate-300">{d}</div>)}
                 </div>
                 <div className="grid grid-cols-7">
                   {calendarGrid.map((day, i) => (
                     <div key={i} className="h-24 border-r border-b border-slate-300 bg-white relative p-2">
                       {day !== null && (<span className={`text-sm font-bold ${day === currentDate.getDate() ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>)}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Resolution Overview */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-blue-900 mb-8">{t('case_resolution_overview')}</h3>
               <div className="space-y-8">
                 {[{l:t('settled'),v:'80%',c:'bg-green-600'},{l:t('escalated'),v:'50%',c:'bg-red-600'},{l:t('blacklisted'),v:'40%',c:'bg-gray-900'}].map(x => (
                   <div key={x.l}>
                     <div className="flex justify-between text-sm font-bold text-gray-700 mb-2"><span>{x.l}</span><span>{x.v}</span></div>
                     <div className="w-full bg-gray-100 rounded-full h-3"><div className={`${x.c} h-3 rounded-full`} style={{width:x.v}}></div></div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center mb-6">
                 <h3 className="text-xl font-extrabold text-[#1a3a8a] mr-3">{t('recent_activities')}</h3>
                 <User size={24} className="text-[#1a3a8a]" strokeWidth={2.5} />
               </div>
               
               <div className="space-y-3 relative">
                 {recentActivities.length > 0 ? (
                   recentActivities.map((activity, i) => (
                     <div 
                        key={activity.id} 
                        className={`${activityColors[i % activityColors.length]} text-white p-4 rounded-xl shadow-md animate-in slide-in-from-top-4 fade-in duration-500 ease-out`}
                     >
                       <div className="flex justify-between items-start">
                         <p className="text-[15px] font-bold tracking-wide uppercase">{activity.title}</p>
                         <span className="text-[10px] font-black tracking-widest opacity-80 uppercase ml-4 whitespace-nowrap bg-black/20 px-2 py-1 rounded">
                           {formatTimeAgo(activity.timestamp)}
                         </span>
                       </div>
                       <p className="text-[11px] opacity-90 mt-1 font-medium italic">
                         {activity.actionText} • Edited by {activity.editor}
                       </p>
                     </div>
                   ))
                 ) : (
                   <div className="text-center text-gray-400 py-6 font-medium">
                     Waiting for recent activities...
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}