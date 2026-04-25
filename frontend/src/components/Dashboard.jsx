import React, { useState, useEffect } from 'react';
import { FileText, UserX, Download, User, TrendingUp, Clock, CheckCircle, TriangleAlert, Calendar, Folder, X, Printer } from 'lucide-react';
import Swal from 'sweetalert2';

import { useLanguage } from './LanguageContext'; 
import { DashboardButton } from "./buttons/Buttons"; 
import { casesAPI, summonsAPI, curfewsAPI, blacklistAPI } from "../services/api";

const activityColors = [
  'bg-[#dca41b]', 'bg-[#109f61]', 'bg-[#2157d6]', 'bg-[#1f2937]', 'bg-[#0aa4df]', 'bg-[#dc2626]', 'bg-[#109f61]',
];

const getSafeTimestamp = (dateStr, timeStr = '') => {
  if (!dateStr) return Date.now();
  try {
      let parsed = new Date(`${dateStr} ${timeStr}`).getTime();
      if (isNaN(parsed)) parsed = new Date(dateStr).getTime();
      
      // Fallback: If date contains hyphens and failed to parse, force it to parse
      if (isNaN(parsed) && typeof dateStr === 'string' && dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts.length === 3 && parts[2].length === 4) {
              parsed = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`).getTime();
          }
      }
      return isNaN(parsed) ? Date.now() : parsed;
  } catch (e) {
      return Date.now();
  }
};

const formatTimeAgo = (timestamp) => {
  // Math.max(0, ...) prevents negative seconds if timezone sync is slightly off
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

// Calculate real-time analytics from MongoDB data
const calculateAnalytics = (cases, summons, curfews) => {
  const currentYear = new Date().getFullYear();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  // Initialize monthly data for current year
  const monthlyData = monthNames.map(month => ({
    month, LUPON: 0, VAWC: 0, BLOTTER: 0, COMPLAIN: 0, CURFEW: 0, total: 0
  }));

  // Count regular cases
  cases.forEach(caseItem => {
    const caseDate = new Date(caseItem.date || caseItem.createdAt);
    if (caseDate.getFullYear() === currentYear) {
      const monthIndex = caseDate.getMonth();
      const type = caseItem.type?.toUpperCase();
      
      if (monthlyData[monthIndex]) {
        if (type === 'LUPON') monthlyData[monthIndex].LUPON++;
        else if (type === 'VAWC') monthlyData[monthIndex].VAWC++;
        else if (type === 'BLOTTER') monthlyData[monthIndex].BLOTTER++;
        else if (type === 'COMPLAIN') monthlyData[monthIndex].COMPLAIN++;
        monthlyData[monthIndex].total++;
      }
    }
  });

  // Count curfews as a category!
  curfews.forEach(curfewItem => {
    const curfDate = new Date(curfewItem.violationDate || curfewItem.date || curfewItem.createdAt);
    if (curfDate.getFullYear() === currentYear) {
      const monthIndex = curfDate.getMonth();
      if (monthlyData[monthIndex]) {
        monthlyData[monthIndex].CURFEW++;
        monthlyData[monthIndex].total++;
      }
    }
  });

  const maxMonthlyTotal = Math.max(...monthlyData.map(m => m.total), 1);

  monthlyData.forEach(month => {
    const monthTotal = month.LUPON + month.VAWC + month.BLOTTER + month.COMPLAIN + month.CURFEW;
    if (monthTotal > 0) {
      month.LUPON = Math.round((month.LUPON / maxMonthlyTotal) * 100);
      month.VAWC = Math.round((month.VAWC / maxMonthlyTotal) * 100);
      month.BLOTTER = Math.round((month.BLOTTER / maxMonthlyTotal) * 100);
      month.COMPLAIN = Math.round((month.COMPLAIN / maxMonthlyTotal) * 100);
      month.CURFEW = Math.round((month.CURFEW / maxMonthlyTotal) * 100);
    }
  });

  const categoryTotals = {
    LUPON: cases.filter(c => c.type === 'LUPON').length,
    VAWC: cases.filter(c => c.type === 'VAWC').length,
    BLOTTER: cases.filter(c => c.type === 'BLOTTER').length,
    COMPLAIN: cases.filter(c => c.type === 'COMPLAIN').length,
    CURFEW: curfews.length // Add curfews to pie chart!
  };

  const totalCases = cases.length + curfews.length; // Combine both databases for Total!
  const categoryData = [];
  let currentAngle = 0;

  if (totalCases > 0) {
    Object.entries(categoryTotals).forEach(([label, count]) => {
      if (count === 0) return; // Don't show empty slices
      const percentage = Math.round((count / totalCases) * 100);
      const degrees = (percentage / 100) * 360;
      
      const colors = {
        LUPON: { bg: 'bg-green-500', hex: '#22c55e' },
        VAWC: { bg: 'bg-purple-500', hex: '#a855f7' },
        BLOTTER: { bg: 'bg-red-500', hex: '#ef4444' },
        COMPLAIN: { bg: 'bg-blue-500', hex: '#3b82f6' },
        CURFEW: { bg: 'bg-pink-500', hex: '#e03b96' }
      };

      categoryData.push({
        label, count, percentage,
        color: colors[label].bg, hexColor: colors[label].hex,
        startAngle: currentAngle, endAngle: currentAngle + degrees
      });

      currentAngle += degrees;
    });
  } else {
    categoryData.push({ label: 'NO DATA', count: 0, percentage: 100, color: 'bg-gray-300', hexColor: '#d1d5db', startAngle: 0, endAngle: 360 });
  }

  // Combine Active and Resolved from BOTH cases and curfews
  const resolvedCases = cases.filter(c => c.status === 'RESOLVED' || c.status === 'SETTLED').length 
                      + curfews.filter(c => c.status === 'RESOLVED' || c.status === 'SETTLED').length;
  
  const pendingCases = cases.filter(c => c.status === 'PENDING' || c.status === 'ONGOING').length
                     + curfews.filter(c => c.status === 'ACTIVE' || c.status === 'PENDING').length;
                     
  const blacklistedCases = cases.filter(c => c.status === 'BLACKLISTED').length;
  const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

  let totalDuration = 0;
  let resolvedCount = 0;
  cases.forEach(c => {
    if (c.status === 'RESOLVED' || c.status === 'SETTLED') {
      const created = new Date(c.createdAt || c.date);
      const updated = new Date(c.updatedAt);
      const duration = Math.floor((updated - created) / (1000 * 60 * 60 * 24)); 
      if (duration >= 0) {
        totalDuration += duration;
        resolvedCount++;
      }
    }
  });
  const avgCaseDuration = resolvedCount > 0 ? Math.round(totalDuration / resolvedCount) : 0;

  return {
    monthlyData, categoryData, totalCases, resolvedCases, pendingCases, blacklistedCases, resolutionRate, avgCaseDuration, categoryTotals
  };
};

export default function Dashboard() {
  const { t } = useLanguage(); 
  
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPieSegment, setHoveredPieSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState(null);
  
  // State to hold the day's cases for the Modal
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);
  
  const [tick, setTick] = useState(0);
  const [casesData, setCasesData] = useState([]);
  const [summonsData, setSummonsData] = useState([]);
  const [curfewsData, setCurfewsData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [analytics, setAnalytics] = useState({
    monthlyData: [], categoryData: [], totalCases: 0, resolvedCases: 0, pendingCases: 0, blacklistedCases: 0, resolutionRate: 0, avgCaseDuration: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [storedCases, storedSummons, storedCurfews] = await Promise.all([
          casesAPI.getAll(), summonsAPI.getAll(), curfewsAPI.getAll()
        ]);
        
        setCasesData(storedCases);
        setSummonsData(storedSummons);
        setCurfewsData(storedCurfews);

        const calculatedAnalytics = calculateAnalytics(storedCases, storedSummons, storedCurfews);
        setAnalytics(calculatedAnalytics);

        let history = JSON.parse(localStorage.getItem('activity_history') || '[]');
        let historyChanged = false;

        const originalHistoryLength = history.length;
        history = history.filter(h => !h.title.includes('11111'));
        if (history.length !== originalHistoryLength) historyChanged = true;

        const lastSeenCases = JSON.parse(localStorage.getItem('analytics_seen_cases') || '{}');
        const lastSeenSummons = JSON.parse(localStorage.getItem('analytics_seen_summons') || '{}');
        const lastSeenCurfews = JSON.parse(localStorage.getItem('analytics_seen_curfews') || '{}');
        const lastSeenNotes = JSON.parse(localStorage.getItem('analytics_seen_notes') || '{}');

        const currentSeenCases = {};
        const currentSeenSummons = {};
        const currentSeenCurfews = {};
        const currentSeenNotes = {};

        storedCases.forEach(c => {
            currentSeenCases[c.caseNo] = c.status;
            if (!lastSeenCases[c.caseNo]) {
                history.push({
                    id: `case_new_${c.caseNo}_${Date.now()}_${Math.random()}`,
                    title: `${c.caseNo} - NEW CASE LOGGED`,
                    actionText: `Created by ${c.fullData?.selectedRole || 'System'}`,
                    editor: c.fullData?.selectedRole || 'System',
                    // 🔥 REALTIME FIX: Prioritize exact database creation time
                    timestamp: c.createdAt ? new Date(c.createdAt).getTime() : getSafeTimestamp(c.date)
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
                  // 🔥 REALTIME FIX: Prioritize exact database update time
                  timestamp: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now()
              });
              historyChanged = true;
          }
        });

        storedSummons.forEach(s => {
            const sKey = `${s.caseNo}_${s.summonType}`;
            currentSeenSummons[sKey] = true;
            if (!lastSeenSummons[sKey]) {
                history.push({
                    id: `summon_${sKey}_${Date.now()}_${Math.random()}`,
                    title: `${s.caseNo} - SUMMON NO. ${s.summonType} ISSUED`,
                    actionText: `Assigned to ${s.residentName}`,
                    editor: s.notedBy || 'System',
                    // 🔥 REALTIME FIX
                    timestamp: s.createdAt ? new Date(s.createdAt).getTime() : Date.now()
                });
                historyChanged = true;
            }
        });

        storedCurfews.forEach(cv => {
            const curfId = cv._id || cv.id;
            const curfResident = cv.residentName || cv.resident || 'Unknown';
            const curfDate = cv.violationDate || cv.date;
            const curfTime = cv.violationTime || cv.time;
            const curfStatus = cv.status || 'ACTIVE';
            
            const displayCode = cv.caseNo || `CV-166-${String(curfId).slice(-6).toUpperCase()}`;

            currentSeenCurfews[curfId] = curfStatus;
            
            if (!lastSeenCurfews[curfId]) {
                history.push({
                    id: `curfew_new_${curfId}_${Date.now()}_${Math.random()}`,
                    title: `${displayCode} - NEW VIOLATION LOGGED`,
                    actionText: `Resident: ${curfResident.toUpperCase()}`,
                    editor: 'Patrol Officer',
                    // 🔥 REALTIME FIX
                    timestamp: cv.createdAt ? new Date(cv.createdAt).getTime() : getSafeTimestamp(curfDate, curfTime)
                });
                historyChanged = true;
            } else if (lastSeenCurfews[curfId] !== curfStatus) {
                history.push({
                    id: `curfew_update_${curfId}_${Date.now()}_${Math.random()}`,
                    title: `${displayCode} - CASE ${curfStatus.toUpperCase()}`,
                    actionText: `Status updated to ${curfStatus}`,
                    editor: 'Admin',
                    // 🔥 REALTIME FIX
                    timestamp: cv.updatedAt ? new Date(cv.updatedAt).getTime() : Date.now()
                });
                historyChanged = true;
            }
        });

        const storedCurfewNotes = JSON.parse(localStorage.getItem('curfew_folders') || '[]');
        storedCurfewNotes.forEach(note => {
            currentSeenNotes[note.id] = true;
            if (!lastSeenNotes[note.id]) {
                history.push({
                    id: `note_${note.id}_${Date.now()}_${Math.random()}`,
                    title: `CURFEW NOTE ADDED - ${note.name.toUpperCase()}`,
                    actionText: `For Resident ID ${note.residentId}`,
                    editor: 'Admin',
                    // 🔥 REALTIME FIX
                    timestamp: note.createdAt ? new Date(note.createdAt).getTime() : getSafeTimestamp(note.date, note.time)
                });
                historyChanged = true;
            }
        });

        localStorage.setItem('analytics_seen_cases', JSON.stringify(currentSeenCases));
        localStorage.setItem('analytics_seen_summons', JSON.stringify(currentSeenSummons));
        localStorage.setItem('analytics_seen_curfews', JSON.stringify(currentSeenCurfews));
        localStorage.setItem('analytics_seen_notes', JSON.stringify(currentSeenNotes));

        if (historyChanged) {
            // Keep array size manageable so it doesn't freeze the browser over time
            history.sort((a, b) => b.timestamp - a.timestamp);
            const trimmedHistory = history.slice(0, 50);
            localStorage.setItem('activity_history', JSON.stringify(trimmedHistory));
            setRecentActivities(trimmedHistory.slice(0, 10));
        } else {
            history.sort((a, b) => b.timestamp - a.timestamp);
            setRecentActivities(history.slice(0, 10));
        }
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadAllData();
    window.addEventListener('storage', loadAllData);
    window.addEventListener('caseDataUpdated', loadAllData);
    return () => {
      window.removeEventListener('storage', loadAllData);
      window.removeEventListener('caseDataUpdated', loadAllData);
    };
  }, []);
  
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthYearStringForPrint = new Date(calendarYear, calendarMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const calendarGrid = [];
  for (let i = 0; i < firstDayIndex; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);
  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) calendarGrid.push(null);

  const handleOpenPrint = () => setIsPrintModalOpen(true);
  
  const handleCancelPrint = () => {
    Swal.fire({
      title: t('discard_changes'), text: t('unsaved_lost'), icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('yes_discard'), cancelButtonText: t('cancel')
    }).then((result) => { if (result.isConfirmed) setIsPrintModalOpen(false); });
  };

  const handlePrintSubmit = () => {
    Swal.fire({
      title: t('confirm_print_title'), text: t('confirm_print_text'), icon: 'question', showCancelButton: true,
      confirmButtonColor: '#0066FF', cancelButtonColor: '#d33', confirmButtonText: t('yes_print'), cancelButtonText: t('cancel')
    }).then((result) => { if (result.isConfirmed) setTimeout(() => { window.print(); }, 300); });
  };

  const handleMouseMove = (event) => setTooltipPosition({ x: event.clientX, y: event.clientY });

  const handleBarHover = (monthIndex, category, percentage, count, event) => {
    const month = analytics.monthlyData[monthIndex]?.month || '';
    const usersBreakdown = getCasesPerUser(category);
    setHoveredBar({ month, category, percentage });
    setTooltipContent({ month, category, percentage, total: count, usersBreakdown });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handlePieHover = (segment, event) => {
    const usersBreakdown = getCasesPerUser(segment.label);
    setHoveredPieSegment(segment);
    setTooltipContent({ label: segment.label, percentage: segment.percentage, total: segment.count, usersBreakdown });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const getCasesPerUser = (category) => {
    let filtered = [];
    if (category.toUpperCase() === 'CURFEW') {
      filtered = curfewsData;
    } else {
      filtered = casesData.filter(c => c.type?.toUpperCase() === category.toUpperCase());
    }
    if (filtered.length === 0) return [{ user: 'No data', count: 0 }];
    const userMap = {};
    filtered.forEach(c => {
      const user = c.fullData?.selectedRole || c.createdBy || c.residentName || 'Unknown';
      userMap[user] = (userMap[user] || 0) + 1;
    });
    return Object.entries(userMap).map(([user, count]) => ({ user, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const handleMouseLeave = () => { setHoveredBar(null); setHoveredPieSegment(null); setTooltipContent(null); };

  const SVG_SIZE = 180; const OUTER_R = 80; const INNER_R = 52; const CX = SVG_SIZE / 2; const CY = SVG_SIZE / 2;

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

  // 🔥 PURE HTML PRINT COMPONENT - Uses inline styles to guarantee perfection 🔥
  const combinedPrintData = [
    ...casesData.map(c => ({
        caseNo: c.caseNo,
        title: `${c.complainantName || 'N/A'} VS ${c.resident || c.respondentName || 'N/A'}`,
        date: c.date || c.createdAt
    })),
    ...curfewsData.map(c => ({
        caseNo: c.caseNo || `CV-166-${String(c._id || c.id).slice(-6).toUpperCase()}`,
        title: `BARANGAY PATROL VS ${c.residentName || c.resident || 'N/A'}`,
        date: c.violationDate || c.date || c.createdAt
    }))
  ].filter(item => {
    const d = new Date(item.date);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const StandardPrintDocument = (
    <div style={{ width: '100%', maxWidth: '100%', fontFamily: 'Arial, sans-serif', color: 'black', backgroundColor: 'white' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, tableLayout: 'fixed', wordWrap: 'break-word' }}>
        
        {/* --- STICKY PRINT HEADER --- */}
        <thead style={{ display: 'table-header-group' }}>
          <tr>
            <th colSpan="2" style={{ border: 'none', paddingBottom: '20px', fontWeight: 'normal' }}>
              <div style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                  <img src="/icon-analytics/analyticsprint logo.png" alt="Republic Logo" style={{ width: '80px', height: '80px', margin: '0 auto 10px auto', display: 'block', objectFit: 'contain' }} />
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Republic of the Philippines</p>
                  <h1 style={{ margin: '4px 0', fontSize: '24px', fontWeight: '900', color: '#1d4ed8' }}>BARANGAY 166, CAYBIGA</h1>
                  <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>ZONE 15 DISTRICT I, CALOOCAN CITY</p>
                  <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>#1 GEN LUIS. ST, CAYBIGA CALOOCAN CITY</p>
              </div>
              
              <div style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', letterSpacing: '0.05em' }}>TANGGAPAN NG LUPON TAGAMAPAYAMAPA</h2>
                  <div style={{ textAlign: 'right', marginTop: '15px' }}>
                    <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#1f2937' }}>{monthYearStringForPrint}</p>
                  </div>
              </div>
              
              <div style={{ textAlign: 'center', width: '100%', marginBottom: '20px', borderTop: '4px double black', borderBottom: '4px double black', padding: '8px 0' }}>
                  <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '900', color: '#111827' }}>MONTHLY TRANSMITTAL OF FINAL REPORTS</h3>
              </div>
              
              <div style={{ textAlign: 'left', fontSize: '14px', color: '#111827', marginBottom: '20px' }}>
                  <div style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '20px' }}>TO:</span>
                      <span style={{ display: 'inline-block', verticalAlign: 'top' }}>
                        <p style={{ margin: '0', fontWeight: 'bold' }}>City / Municipal Judge</p>
                        <p style={{ margin: '0' }}>Caloocan City</p>
                      </span>
                  </div>
                  <p style={{ margin: '0', textIndent: '40px', lineHeight: '1.6' }}>
                    Enclosed herewith are the final reports of settlement of disputes and arbitration awards made by the Barangay Captain / Pangkat Tagapagkasundo in the following case:
                  </p>
              </div>
            </th>
          </tr>
          
          <tr style={{ backgroundColor: '#d1d5db' }}>
              <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', width: '35%', color: 'black' }}>
                Barangay Case No.
              </th>
              <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', width: '65%', color: 'black' }}>
                Official Case Record
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'normal', fontStyle: 'italic', marginTop: '4px' }}>(Complainant vs Respondent)</span>
              </th>
          </tr>
        </thead>

        {/* --- DYNAMIC TABLE ROWS --- */}
        <tbody style={{ display: 'table-row-group' }}>
            {combinedPrintData.length > 0 ? combinedPrintData.map((item, index) => (
                <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ border: '1px solid black', padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>{item.caseNo}</td>
                    <td style={{ border: '1px solid black', padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>{item.title}</td>
                </tr>
            )) : (
                <tr style={{ pageBreakInside: 'avoid' }}><td colSpan="2" style={{ border: '1px solid black', padding: '30px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>No cases recorded for {monthYearStringForPrint}.</td></tr>
            )}
        </tbody>
      </table>

      {/* --- FOOTER HERE SO IT ONLY PRINTS ON THE LAST PAGE --- */}
      <div style={{ paddingTop: '50px', paddingBottom: '20px', pageBreakInside: 'avoid' }}>
          <div style={{ textAlign: 'right', marginBottom: '30px', width: '100%' }}>
              <div style={{ display: 'inline-block', textAlign: 'center', width: '250px' }}>
                  <div style={{ borderBottom: '1px solid black', marginBottom: '8px', width: '100%' }}></div>
                  <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Clerk of Court</p>
              </div>
          </div>
          <div style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
              <p style={{ margin: '0', fontSize: '10px', color: '#374151', fontWeight: 'bold' }}>
                IMPORTANT: <span style={{ fontWeight: 'normal' }}>The Lupon / Pangkat Secretary shall transmit, not later than the first day for preceding month.</span>
              </p>
          </div>
          <div style={{ width: '100%', textAlign: 'center', marginTop: '20px' }}>
              <img src="/icon-analytics/analytics footerprint.png" alt="Bagong Pilipinas" style={{ height: '70px', objectFit: 'contain', display: 'inline-block' }} />
          </div>
      </div>

    </div>
  );

  const renderPrintModal = () => {
    if (!isPrintModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto py-10 print-hide">
        <div className="bg-white relative flex flex-col shrink-0 w-[210mm] min-h-[297mm] p-[15mm_20mm] mx-auto shadow-2xl">
            
            {StandardPrintDocument}
            
            <div className="mt-12 flex justify-end gap-4 z-[1060] print-hide w-full border-t border-gray-200 pt-4">
                <button 
                  onClick={handleCancelPrint} 
                  className="px-6 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 shadow-md font-bold transition-colors"
                >
                    {t('cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={handlePrintSubmit} 
                  className="px-8 py-2.5 text-sm rounded-xl tracking-wide shadow-md font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
                >
                    <Printer size={16} /> PRINT REPORT
                </button>
            </div>
        </div>
      </div>
    );
  };
        
  const renderTooltip = () => {
    if (!tooltipContent) return null;
    const isBar = !!tooltipContent.month;
    return (
      <div className="fixed z-[1070] pointer-events-none" style={{ left: tooltipPosition.x + 16, top: tooltipPosition.y - 20 }}>
        <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 min-w-[190px]" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          {isBar ? (
            <><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{tooltipContent.month}</p><p className="text-sm font-extrabold text-white">{tooltipContent.category}</p></>
          ) : (<p className="text-sm font-extrabold text-white">{tooltipContent.label}</p>)}
          <div className="border-t border-white/10 my-2" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-400 font-semibold">Total Cases</span>
            <span className="text-base font-black text-yellow-400">{tooltipContent.total}</span>
          </div>
        </div>
      </div>
    );
  };

  const peakMonthData = [...(analytics.monthlyData || [])].sort((a,b) => b.total - a.total)[0] || { month: 'JAN', total: 0 };
  
  const passedMonths = [...(analytics.monthlyData || [])].slice(0, new Date().getMonth() + 1);
  const lowestMonthData = passedMonths.sort((a,b) => a.total - b.total)[0] || { month: 'JAN', total: 0 };

  const topCategoryEntry = Object.entries(analytics.categoryTotals || {}).sort((a,b) => b[1] - a[1])[0] || ['Complain', 0];
  
  const validMonthsForAvg = [...(analytics.monthlyData || [])].filter(m => m.total > 0);
  const avgWorkload = Math.round((analytics.totalCases || 0) / Math.max(validMonthsForAvg.length, 1));

  const currentSystemYear = new Date().getFullYear();
  const spikeMap = {};
  
  const monthNamesShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  casesData.forEach(c => {
    const d = new Date(c.date || c.createdAt);
    if (d.getFullYear() === currentSystemYear) {
      const type = c.type?.toUpperCase() || 'COMPLAIN';
      const mStr = monthNamesShort[d.getMonth()];
      const key = `${type} (${mStr})`; 
      spikeMap[key] = (spikeMap[key] || 0) + 1;
    }
  });

  curfewsData.forEach(cv => {
    const d = new Date(cv.violationDate || cv.date || cv.createdAt);
    if (d.getFullYear() === currentSystemYear) {
      const mStr = monthNamesShort[d.getMonth()];
      const key = `CURFEW (${mStr})`; 
      spikeMap[key] = (spikeMap[key] || 0) + 1;
    }
  });
  
  let maxSpikeCount = 0;
  let maxSpikeLabel = 'None';
  Object.entries(spikeMap).forEach(([k, v]) => {
    if (v > maxSpikeCount) { maxSpikeCount = v; maxSpikeLabel = k; }
  });

  const currentIdx = new Date().getMonth();
  const thisMonthCases = analytics.monthlyData[currentIdx]?.total || 0;
  const lastMonthCases = currentIdx > 0 ? (analytics.monthlyData[currentIdx - 1]?.total || 0) : 0;
  const trendDirection = thisMonthCases >= lastMonthCases ? 'Increasing' : 'Decreasing';

  const riskLevel = analytics.resolutionRate < 50 ? 'High' : (analytics.resolutionRate < 75 ? 'Medium' : 'Low');
  const riskColor = riskLevel === 'High' ? 'text-red-500' : (riskLevel === 'Medium' ? 'text-amber-500' : 'text-green-500'); 
  const riskBorder = riskLevel === 'High' ? 'border-t-red-500' : (riskLevel === 'Medium' ? 'border-t-amber-500' : 'border-t-green-500');

  const escalatedCount = analytics.pendingCases + analytics.blacklistedCases;
  const escalatedRate = analytics.totalCases > 0 ? Math.round((escalatedCount / analytics.totalCases) * 100) : 0;
  const resolutionText = analytics.resolutionRate >= escalatedRate
      ? `Settled cases are higher than escalated (${escalatedRate}%), suggesting strong closure performance.`
      : `Escalated cases (${escalatedRate}%) outpace settled cases, requiring immediate review of workflows.`;

  const topCatName = topCategoryEntry[0]?.toUpperCase() || 'COMPLAIN';
  let topCatColors = { borderL: 'border-l-[#3b82f6]', text: 'text-[#3b82f6]' }; 
  
  if (topCatName === 'LUPON') {
    topCatColors = { borderL: 'border-l-[#10b981]', text: 'text-[#10b981]' };
  } else if (topCatName === 'VAWC') {
    topCatColors = { borderL: 'border-l-[#a855f7]', text: 'text-[#a855f7]' };
  } else if (topCatName === 'BLOTTER') {
    topCatColors = { borderL: 'border-l-[#ef4444]', text: 'text-[#ef4444]' };
  } else if (topCatName === 'CURFEW') {
    topCatColors = { borderL: 'border-l-[#e03b96]', text: 'text-[#e03b96]' }; 
  }

  return (
    <>
      {/* 🔥 THE ACTUAL PRINT DOCUMENT: ONLY VISIBLE DURING PRINTING 🔥 */}
      <div id="real-print-doc" className="hidden print:block w-full m-0 p-0 absolute top-0 left-0 bg-white z-[99999]">
        {StandardPrintDocument}
      </div>

      {/* 🔥 THE DASHBOARD APP: COMPLETELY HIDDEN DURING PRINTING 🔥 */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6 font-sans h-screen print-hide">
        
        {/* 🔥 THE CRITICAL CSS FIX FOR RESPONSIVE, MULTI-PAGE PRINTING WITH DEFAULT 100% SCALE 🔥 */}
        <style>{`
          @media print {
            /* 1. Nuke React's layout locks and force 100% widths everywhere to disable browser "Shrink to Fit" */
            html, body, #root {
              display: block !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
            }
            
            /* 2. Hide everything by default, use visibility so we don't break DOM */
            body * {
              visibility: hidden !important;
            }
            
            /* 3. Target the print doc and make it visible */
            #real-print-doc, #real-print-doc * {
              visibility: visible !important;
              box-sizing: border-box !important;
            }

            /* 4. Force the print document to the top left corner, breaking out of layout */
            #real-print-doc {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* 5. Ensure the table natively repeats headers and footers without pushing past 100% width */
            table { 
              width: 100% !important; 
              max-width: 100% !important; 
              border-collapse: collapse !important; 
              page-break-inside: auto !important; 
              table-layout: fixed !important; 
            }
            tr { page-break-inside: avoid !important; page-break-after: auto !important; }
            td, th { 
              page-break-inside: avoid !important; 
              word-wrap: break-word !important; 
              overflow-wrap: break-word !important;
            }
            thead { display: table-header-group !important; }
            tfoot { display: table-footer-group !important; }
            
            .print-hide { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            /* 6. By removing the specific 'size' property, Chrome brings the Paper Size dropdown back! */
            @page {
              size: auto;
              margin: 8mm; /* LESS MARGIN OPTION. Change to 0mm for NO margin. */
            }
          }
          
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
        
        {renderPrintModal()}
        {renderTooltip()}

        {selectedDateInfo && (
          <div className="fixed inset-0 z-[1040] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 print-hide" onClick={() => setSelectedDateInfo(null)}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-200" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex items-center justify-between text-white shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="opacity-90" />
                  <h2 className="font-bold text-lg tracking-wide uppercase">
                    {monthNamesFull[selectedDateInfo.month]} {selectedDateInfo.day}, {selectedDateInfo.year}
                  </h2>
                </div>
                <button onClick={() => setSelectedDateInfo(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20} strokeWidth={3} /></button>
              </div>
              <div className="bg-slate-50 px-6 py-3 border-b border-gray-200 shrink-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Records Logged: {selectedDateInfo.items.length}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-50">
                {selectedDateInfo.items.map((item, idx) => {
                  if (item.isCurfew) {
                    const displayCode = item.data.caseNo || `CV-166-${String(item.data._id || item.data.id).slice(-6).toUpperCase()}`;
                    return (
                      <div key={idx} className="bg-white border-l-4 border-l-pink-500 p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Curfew Violation</span>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">#{displayCode}</span>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock size={12}/> {item.data.violationTime || item.data.time || 'N/A'}</span>
                          </div>
                        </div>
                        <span className="font-bold text-gray-800 text-sm mb-1 uppercase">{item.data.residentName || item.data.resident}</span>
                        <span className="text-xs text-gray-500 line-clamp-1 uppercase">{item.data.location || item.data.address}</span>
                      </div>
                    );
                  } else {
                    let badgeColor = 'bg-gray-100 text-gray-700';
                    let borderColor = 'border-l-gray-500';
                    const type = item.data.type?.toUpperCase();
                    if (type === 'LUPON') { badgeColor = 'bg-green-100 text-green-700'; borderColor = 'border-l-green-500'; }
                    else if (type === 'VAWC') { badgeColor = 'bg-purple-100 text-purple-700'; borderColor = 'border-l-purple-500'; }
                    else if (type === 'BLOTTER') { badgeColor = 'bg-red-100 text-red-700'; borderColor = 'border-l-red-500'; }
                    else if (type === 'COMPLAIN') { badgeColor = 'bg-blue-100 text-blue-700'; borderColor = 'border-l-blue-500'; }

                    return (
                      <div key={idx} className={`bg-white border-l-4 ${borderColor} p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>{type || 'CASE'}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">#{item.data.caseNo}</span>
                        </div>
                        <span className="font-bold text-gray-800 text-sm mb-1 uppercase">{item.data.complainantName} <span className="text-gray-400 font-medium mx-1 text-xs lowercase">vs</span> {item.data.resident || item.data.respondentName}</span>
                        <span className="text-xs text-gray-500 font-semibold uppercase">{item.data.status || 'PENDING'}</span>
                      </div>
                    );
                  }
                })}
              </div>
              <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex justify-end">
                 <button onClick={() => setSelectedDateInfo(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[1600px] mx-auto space-y-5 print-hide">
          
          {/* Primary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-blue-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-28 border border-blue-800">
              <div className="flex items-start justify-between">
                <div className="z-10">
                  <h3 className="text-3xl font-bold tracking-tight">{analytics.totalCases}</h3>
                  <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mt-1">{t('total_cases')}</p>
                </div>
                <FileText size={24} className="text-blue-300 opacity-80" />
              </div>
            </div>

            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-28 border border-emerald-700">
              <div className="flex items-start justify-between">
                <div className="z-10">
                  <h3 className="text-3xl font-bold tracking-tight">{analytics.resolvedCases}</h3>
                  <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider mt-1">{t('settled_cases')}</p>
                </div>
                <CheckCircle size={24} className="text-emerald-300 opacity-80" />
              </div>
              <div className="text-[10px] text-emerald-200 font-semibold">
                {analytics.resolutionRate}% {t('resolution_rate')}
              </div>
            </div>

            <div className="bg-amber-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-28 border border-amber-600">
              <div className="flex items-start justify-between">
                <div className="z-10">
                  <h3 className="text-3xl font-bold tracking-tight">{analytics.pendingCases}</h3>
                  <p className="text-amber-100 text-[10px] font-bold uppercase tracking-wider mt-1">{t('pending_cases')}</p>
                </div>
                <Clock size={24} className="text-amber-200 opacity-80" />
              </div>
              <div className="text-[10px] text-amber-100 font-semibold">
                {t('avg_days_to_resolve')}: {analytics.avgCaseDuration}
              </div>
            </div>

            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-28 border border-black-700">
              <div className="flex items-start justify-between">
                <div className="z-10">
                  <h3 className="text-3xl font-bold tracking-tight">{analytics.blacklistedCases}</h3>
                  <p className="text-white-100 text-[10px] font-bold uppercase tracking-wider mt-1">{t('total_blacklisted')}</p>
                </div>
                <UserX size={24} className="text-white-300 opacity-80" />
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-xl font-bold text-blue-900">{t('total_cases_trend')}</h3><p className="text-xs text-gray-500 font-medium">{t('cases_reported_per_month')}</p></div>
              
              <div className="flex gap-4">
                <div className="flex items-center text-[10px] font-bold gap-3 uppercase text-gray-500 pr-4 mt-1">
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-green-500"></div>Lupon</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-purple-500"></div>VAWC</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-500"></div>Blotter</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-blue-500"></div>Complain</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-pink-500"></div>Curfew</span>
                </div>
                <DashboardButton variant="export" onClick={handleOpenPrint} className="px-4 py-2 rounded-xl text-xs space-x-2">
                    <Download size={14} /><span>{t('export_pdf')}</span>
                </DashboardButton>
              </div>

            </div>
            <div className="relative h-48 w-full pl-10 pb-6">
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-gray-400"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
              <div className="absolute left-10 right-0 top-0 bottom-6 flex flex-col justify-between z-0">{[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-200 w-full h-0"></div>)}</div>
              <div className="absolute inset-0 left-10 bottom-6 flex items-end justify-between px-2 z-10">
                {analytics.monthlyData.slice(0, 10).map((monthData, monthIndex) => {
                  const luponCount = analytics.categoryTotals?.LUPON || 0;
                  const vawcCount = analytics.categoryTotals?.VAWC || 0;
                  const blotterCount = analytics.categoryTotals?.BLOTTER || 0;
                  const complainCount = analytics.categoryTotals?.COMPLAIN || 0;
                  const curfewCount = analytics.categoryTotals?.CURFEW || 0;

                  return (
                    <div key={monthData.month} className="flex flex-col items-center flex-1 h-full justify-end group space-y-2">
                      <div className="flex space-x-1.5 items-end h-full w-full justify-center">
                        <div
                          className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                          style={{
                            height: `${monthData.LUPON}%`,
                            backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'LUPON' ? '#16a34a' : '#22c55e', 
                            transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'LUPON' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                            transformOrigin: 'bottom',
                            filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'LUPON' ? 'brightness(1.2) drop-shadow(0 0 4px #4ade80)' : 'none',
                          }}
                          onMouseEnter={(e) => handleBarHover(monthIndex, 'LUPON', monthData.LUPON, luponCount, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        />
                        <div
                          className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                          style={{
                            height: `${monthData.VAWC}%`,
                            backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'VAWC' ? '#7e22ce' : '#a855f7', 
                            transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'VAWC' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                            transformOrigin: 'bottom',
                            filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'VAWC' ? 'brightness(1.2) drop-shadow(0 0 4px #c084fc)' : 'none',
                          }}
                          onMouseEnter={(e) => handleBarHover(monthIndex, 'VAWC', monthData.VAWC, vawcCount, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        />
                        <div
                          className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                          style={{
                            height: `${monthData.BLOTTER}%`,
                            backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'BLOTTER' ? '#b91c1c' : '#ef4444', 
                            transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'BLOTTER' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                            transformOrigin: 'bottom',
                            filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'BLOTTER' ? 'brightness(1.2) drop-shadow(0 0 4px #f87171)' : 'none',
                          }}
                          onMouseEnter={(e) => handleBarHover(monthIndex, 'BLOTTER', monthData.BLOTTER, blotterCount, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        />
                        <div
                          className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                          style={{
                            height: `${monthData.COMPLAIN}%`,
                            backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'COMPLAIN' ? '#1d4ed8' : '#3b82f6', 
                            transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'COMPLAIN' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                            transformOrigin: 'bottom',
                            filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'COMPLAIN' ? 'brightness(1.2) drop-shadow(0 0 4px #60a5fa)' : 'none',
                          }}
                          onMouseEnter={(e) => handleBarHover(monthIndex, 'COMPLAIN', monthData.COMPLAIN, complainCount, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        />
                        <div
                          className="w-2.5 rounded-t-sm cursor-pointer transition-all duration-150 relative"
                          style={{
                            height: `${monthData.CURFEW}%`,
                            backgroundColor: hoveredBar?.month === monthData.month && hoveredBar?.category === 'CURFEW' ? '#db2777' : '#e03b96', 
                            transform: hoveredBar?.month === monthData.month && hoveredBar?.category === 'CURFEW' ? 'scaleY(1.08) scaleX(1.3)' : 'scale(1)',
                            transformOrigin: 'bottom',
                            filter: hoveredBar?.month === monthData.month && hoveredBar?.category === 'CURFEW' ? 'brightness(1.2) drop-shadow(0 0 4px #f472b6)' : 'none',
                          }}
                          onMouseEnter={(e) => handleBarHover(monthIndex, 'CURFEW', monthData.CURFEW, curfewCount, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="absolute left-10 right-0 bottom-0 flex justify-between px-2">{analytics.monthlyData.slice(0, 10).map((monthData) => (<div key={monthData.month} className="flex-1 text-center text-[10px] font-bold text-gray-500 pt-2">{monthData.month}</div>))}</div>
            </div>
          </div>

          {/* 🔥 ROW 3: PIE CHART | CASE RESOLUTION | RECENT ACTIVITIES (PERFECTLY ALIGNED HEIGHTS) 🔥 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[380px]">
               <h3 className="text-lg font-bold text-blue-900 mb-2">{t('case_analytics_category')}</h3>
               <div className="flex items-center justify-center space-x-6 flex-1">
                 <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="shrink-0 drop-shadow-md" style={{ overflow: 'visible' }}>
                   {analytics.categoryData.map((segment) => {
                     const isHovered = hoveredPieSegment?.label === segment.label;
                     return (
                       <path
                         key={segment.label}
                         d={buildDonutPath(segment.startAngle, segment.endAngle, OUTER_R, INNER_R)}
                         fill={segment.hexColor}
                         stroke="white" strokeWidth="2" className="cursor-pointer"
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

                 <div className="space-y-3 w-full max-w-[140px]">
                    {analytics.categoryData.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-xs font-bold text-gray-600 cursor-help transition-opacity duration-150"
                        style={{ opacity: hoveredPieSegment && hoveredPieSegment.label !== item.label ? 0.45 : 1 }}
                        onMouseEnter={(e) => handlePieHover(item, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center"><span className={`w-3 h-3 ${item.color} mr-2 rounded-md`}></span>{item.label}</div>
                        <div className="flex flex-col items-end ml-1">
                          <span className="text-[10px] font-bold text-gray-700">{item.count}</span>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            {/* Resolution Overview */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[380px]">
               <h3 className="text-lg font-bold text-blue-900 mb-4">{t('case_resolution_overview')}</h3>
               <div className="space-y-5 flex-1 flex flex-col justify-center">
                 {(() => {
                   const settledCount = casesData.filter(c => c.status === 'SETTLED').length + curfewsData.filter(c => c.status === 'SETTLED' || c.status === 'RESOLVED').length;
                   const pendingCount = casesData.filter(c => c.status === 'PENDING' || c.status === 'ONGOING').length + curfewsData.filter(c => c.status === 'ACTIVE' || c.status === 'PENDING').length;
                   const escalatedCount = casesData.filter(c => c.status === 'ESCALATED').length;
                   const blacklistedCount = analytics.blacklistedCases;
                   const total = analytics.totalCases || 1;
                   
                   const settledPct = Math.round((settledCount / total) * 100);
                   const pendingPct = Math.round((pendingCount / total) * 100);
                   const escalatedPct = Math.round((escalatedCount / total) * 100);
                   const blacklistedPct = Math.round((blacklistedCount / total) * 100);
                   
                   return [
                     {l:t('settled') || 'Settled',v:`${settledPct}%`,c:'bg-green-600', count: settledCount},
                     {l:t('pending') || 'Pending',v:`${pendingPct}%`,c:'bg-amber-500', count: pendingCount},
                     {l:t('escalated') || 'Escalated',v:`${escalatedPct}%`,c:'bg-red-600', count: escalatedCount},
                     {l:t('blacklisted') || 'Blacklisted',v:`${blacklistedPct}%`,c:'bg-gray-900', count: blacklistedCount}
                   ];
                 })().map(x => (
                   <div key={x.l}>
                     <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                       <span>{x.l}</span>
                       <span>{x.v} ({x.count} cases)</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-3"><div className={`${x.c} h-3 rounded-full`} style={{width:x.v}}></div></div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[380px]">
               <div className="flex items-center mb-4 shrink-0">
                 <h3 className="text-lg font-extrabold text-[#1a3a8a] mr-2">{t('recent_activities')}</h3>
                 <User size={20} className="text-[#1a3a8a]" strokeWidth={2.5} />
               </div>
               
               <div className="relative flex-1 overflow-hidden">
                 <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                   {recentActivities.length > 0 ? (
                     recentActivities.map((activity, i) => {
                       // Format the activity title if it's a curfew to ensure correct code display
                       let displayTitle = activity.title;
                       if (displayTitle.includes("CURFEW - NEW VIOLATION") || displayTitle.includes("CURFEW - CASE")) {
                           const parts = displayTitle.split(" - ");
                           if (parts.length > 1 && parts[0] === "CURFEW") {
                               const curfId = activity.id.split("_")[2];
                               displayTitle = `CV-166-${String(curfId).slice(-6).toUpperCase()} - ${parts[1]}`;
                           }
                       }

                       return (
                       <div key={activity.id} className={`${activityColors[i % activityColors.length]} text-white p-3 rounded-xl shadow-md animate-in slide-in-from-top-4 fade-in duration-500 ease-out`}>
                         <div className="flex justify-between items-start">
                           <p className="text-[12px] font-bold tracking-wide uppercase">{displayTitle}</p>
                           <span className="text-[8px] font-black tracking-widest opacity-80 uppercase ml-2 whitespace-nowrap bg-black/20 px-1.5 py-0.5 rounded">
                             {formatTimeAgo(activity.timestamp)}
                           </span>
                         </div>
                         <p className="text-[10px] opacity-90 mt-1 font-medium italic">
                           {activity.actionText} • Edited by {activity.editor}
                         </p>
                       </div>
                     )})
                   ) : (
                     <div className="text-center text-gray-400 py-6 font-medium text-xs">
                       Waiting for recent activities...
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </div>

          {/* 🔥 ROW 4: CALENDAR & INSIGHTS (MODIFIED CALENDAR) 🔥 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-8">
            
            {/* Calendar */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
               <div className="flex justify-between items-center mb-4 shrink-0">
                 <h3 className="text-lg font-bold text-blue-900">{t('daily_cases_overview')}</h3>
                 
                 <div className="flex items-center">
                   <select 
                     value={calendarMonth} 
                     onChange={(e) => setCalendarMonth(Number(e.target.value))}
                     className="bg-transparent border-none outline-none focus:ring-0 focus:border-none text-sm font-bold text-blue-900 uppercase tracking-wide cursor-pointer hover:opacity-70 transition-opacity py-0 pl-0 pr-4"
                     style={{ boxShadow: 'none' }}
                   >
                     {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                       <option key={i} value={i} className="text-xs font-bold text-gray-800">{m.toUpperCase()}</option>
                     ))}
                   </select>
                   <select 
                     value={calendarYear} 
                     onChange={(e) => setCalendarYear(Number(e.target.value))}
                     className="bg-transparent border-none outline-none focus:ring-0 focus:border-none text-sm font-bold text-blue-900 uppercase tracking-wide cursor-pointer hover:opacity-70 transition-opacity py-0 pl-1 pr-4"
                     style={{ boxShadow: 'none' }}
                   >
                     {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                       <option key={year} value={year} className="text-xs font-bold text-gray-800">{year}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div className="border-t border-l border-slate-300 flex-1 flex flex-col mt-2">
                 <div className="grid grid-cols-7 text-center bg-blue-700 text-white shrink-0">
                   {[t('sun'),t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat')].map(d => <div key={d} className="py-2 text-[10px] font-bold border-r border-b border-slate-300">{d}</div>)}
                 </div>
                 
                 <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                   {calendarGrid.map((day, i) => {
                     const dayCases = day ? casesData.filter(c => {
                       const d = new Date(c.date || c.createdAt);
                       return d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
                     }) : [];
                     
                     const dayCurfews = day ? curfewsData.filter(c => {
                        const d = new Date(c.violationDate || c.date || c.createdAt);
                        return d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
                     }) : [];

                     const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();

                     const allItems = [
                       ...dayCases.map(c => ({ data: c, isCurfew: false })),
                       ...dayCurfews.map(cv => ({ data: cv, isCurfew: true }))
                     ];
                     const displayItems = allItems.slice(0, 3); 
                     const extraCount = allItems.length - 3;

                     return (
                       <div 
                          key={i} 
                          onClick={() => allItems.length > 0 && setSelectedDateInfo({ day, month: calendarMonth, year: calendarYear, items: allItems })}
                          className={`min-h-[4rem] border-r border-b border-slate-300 bg-white relative p-1 flex flex-col overflow-hidden ${allItems.length > 0 ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}
                        >
                         {day !== null && (
                           <>
                             <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center mb-0.5 shrink-0 ${isToday ? 'bg-blue-600 text-white rounded-full shadow-sm' : 'text-gray-700'}`}>
                               {day}
                             </span>
                             <div className="absolute inset-0 mt-6 flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scrollbar pr-0.5 p-1 pointer-events-none">
                               {displayItems.map((item, idx) => {
                                 if (item.isCurfew) {
                                   const displayCode = item.data.caseNo || `CV-166-${String(item.data._id || item.data.id).slice(-6).toUpperCase()}`;
                                   return (
                                     <div key={`curfew-${idx}`} className="bg-pink-500 text-white text-[8px] font-bold px-1 py-px rounded-sm truncate shadow-sm uppercase" title={`Curfew: ${displayCode}`}>
                                       CURFEW
                                     </div>
                                   );
                                 } else {
                                   let bgColor = 'bg-gray-500';
                                   const type = item.data.type?.toUpperCase();
                                   if (type === 'LUPON') bgColor = 'bg-green-500';
                                   else if (type === 'VAWC') bgColor = 'bg-purple-500';
                                   else if (type === 'BLOTTER') bgColor = 'bg-red-500';
                                   else if (type === 'COMPLAIN') bgColor = 'bg-blue-500';

                                   return (
                                     <div key={`case-${idx}`} className={`${bgColor} text-white text-[8px] font-bold px-1 py-px rounded-sm truncate shadow-sm uppercase`} title={`Case No: ${item.data.caseNo}`}>
                                       {type || 'CASE'}
                                     </div>
                                   );
                                 }
                               })}
                               {extraCount > 0 && (
                                 <div className="text-[8px] font-bold text-gray-500 text-center bg-gray-100 border border-gray-200 rounded-sm py-px mt-0.5">
                                   +{extraCount} more
                                 </div>
                               )}
                             </div>
                           </>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>

            {/* Insights */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="mb-3 shrink-0">
                <h3 className="text-lg font-bold text-[#1a365d] mb-0.5">Insights</h3>
              </div>

              <div className="flex flex-col gap-2 flex-1 justify-between">
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div className="border border-gray-200 rounded-xl p-3 border-t-[3px] border-t-[#3b82f6] bg-white">
                    <p className="text-[9px] font-bold text-[#3b82f6] tracking-wider mb-1 uppercase">TREND DIRECTION</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight leading-none mb-1">{trendDirection}</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Compares volume to previous month.</p>
                  </div>

                  <div className={`border border-gray-200 rounded-xl p-3 border-t-[3px] ${riskBorder} bg-white`}>
                    <p className={`text-[9px] font-bold ${riskColor} tracking-wider mb-1 uppercase`}>RISK LEVEL</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight leading-none mb-1">{riskLevel}</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Based on resolution rates.</p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-3 border-t-[3px] border-t-[#3b82f6] bg-white">
                    <p className="text-[9px] font-bold text-[#3b82f6] tracking-wider mb-1 uppercase">BUSIEST SPIKE</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight capitalize leading-none mb-1">{maxSpikeLabel}</p>
                    <p className="text-[9px] text-gray-500 leading-tight">{maxSpikeCount} cases strictly in one category.</p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-3 border-t-[3px] border-t-[#3b82f6] bg-white">
                    <p className="text-[9px] font-bold text-[#3b82f6] tracking-wider mb-1 uppercase">AVG WORKLOAD</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight leading-none mb-1">{avgWorkload} / mo</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Avg cases handled per month.</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 border-l-[4px] border-l-[#3b82f6] bg-white flex items-start gap-3">
                  <div className="bg-blue-50/70 w-6 h-6 rounded-lg shrink-0 mt-0.5"></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5 uppercase">PEAK MONTH</p>
                    <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1">{peakMonthData.month} • {peakMonthData.total} cases</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Busiest month combined across all categories.</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 border-l-[4px] border-l-[#34d399] bg-white flex items-start gap-3">
                  <div className="bg-emerald-50/70 w-6 h-6 rounded-lg shrink-0 mt-0.5"></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5 uppercase">LOWEST MONTH</p>
                    <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1">{lowestMonthData.month} • {lowestMonthData.total} cases</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Smallest case volume recorded this year.</p>
                  </div>
                </div>

                <div className={`border border-gray-200 rounded-xl p-3 border-l-[4px] ${topCatColors.borderL} bg-white flex items-start gap-3`}>
                  <div className="bg-slate-50 w-6 h-6 rounded-lg shrink-0 mt-0.5"></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5 uppercase">TOP CATEGORY</p>
                    <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1">{topCategoryEntry[0]} • {topCategoryEntry[1]} cases</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Largest share of recorded cases.</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 border-l-[4px] border-l-[#10b981] bg-white flex items-start gap-3">
                  <div className="bg-green-50/70 w-6 h-6 rounded-lg shrink-0 mt-0.5"></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5 uppercase">RESOLUTION STATUS</p>
                    <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1">{analytics.resolutionRate}% Settled</p>
                    <p className="text-[9px] text-gray-500 leading-tight">{resolutionText}</p>
                  </div>
                </div>

                <div className="mt-auto bg-[#f4f7fa] border border-blue-50/50 rounded-xl p-3">
                  <p className="text-[10px] text-[#334155] leading-relaxed">
                    <span className="font-bold text-[#1e3a8a]">Executive Summary: </span>
                    {topCategoryEntry[0]} is the most frequent case type, {peakMonthData.month} is the peak month, and the overall case trend is {trendDirection.toLowerCase()}. With an {analytics.resolutionRate}% settlement rate, the dashboard provides automatic interpretation to guide immediate barangay action.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}