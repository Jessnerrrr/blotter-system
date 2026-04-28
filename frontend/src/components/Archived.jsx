import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Calendar, Filter, ChevronDown, Folder, FileText, Gavel, Clock, Download, Printer, Search, ChevronRight } from 'lucide-react'; 
import { useLanguage } from './LanguageContext'; 
import { ArchivedButton } from './buttons/Buttons';
import { casesAPI, summonsAPI, curfewsAPI } from '../services/api';

const getTypeStyle = (type) => {
  switch (String(type).toUpperCase()) {
    case 'LUPON': return 'bg-green-600 text-white';
    case 'VAWC': return 'bg-purple-600 text-white';
    case 'BLOTTER': return 'bg-red-600 text-white';
    case 'COMPLAIN': return 'bg-blue-600 text-white';
    case 'CURFEW': return 'bg-pink-600 text-white';
    case 'ESCALATED': return 'bg-red-500 text-white border-red-600'; 
    default: return 'bg-gray-500 text-white';
  }
};

const decodeHTML = (html) => {
  if (!html) return '';
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  let decoded = txt.value;
  txt.innerHTML = decoded; 
  return txt.value;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch(e) { return dateStr; }
};

const formatBlacklistedDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d)) return dateTimeStr;
    return d.toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    });
  } catch(e) { 
    return dateTimeStr; 
  }
};

export default function Archived() {
  const { t } = useLanguage(); 
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedSummons, setSelectedSummons] = useState([]); 
  const [search, setSearch] = useState('');
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const allTypesText = t('all_types') || 'All Types';

  const [isTypeSortOpen, setIsTypeSortOpen] = useState(false);
  const [sortType, setSortType] = useState(allTypesText);

  // Custom Calendar Dropdown States
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const [filterYear, setFilterYear] = useState('All Years');
  const [filterMonth, setFilterMonth] = useState('All Months');
  const [filterDay, setFilterDay] = useState('All Days');

  const realToday = new Date();
  const currentYear = realToday.getFullYear();
  const currentMonth = realToday.getMonth();
  const currentDate = realToday.getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const typeOptions = [
    { label: allTypesText, color: 'bg-gray-400' },
    { label: 'LUPON', color: 'bg-green-600' },
    { label: 'VAWC', color: 'bg-purple-600' },
    { label: 'BLOTTER', color: 'bg-red-600' },
    { label: 'COMPLAIN', color: 'bg-blue-600' },
    { label: 'CURFEW', color: 'bg-pink-600' },
    { label: 'ESCALATED', color: 'bg-red-500' }, 
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        let allCases = [];
        let allCurfews = [];
        
        try { allCases = await casesAPI.getAll(); } catch (e) { console.error("Cases API error:", e); }
        try { allCurfews = await curfewsAPI.getAll(); } catch (e) { console.error("Curfews API error:", e); }
        
        const archivedCases = allCases.filter(c => {
    const s = String(c.status || '').toUpperCase();
    return s === 'SETTLED' || s === 'ESCALATED' || s === 'BLACKLISTED';
});
        
        const archivedCurfews = allCurfews.filter(c => {
            const s = String(c.status || '').toUpperCase();
            return s === 'RESOLVED' || s === 'SETTLED' || s === 'ESCALATED';
        }).map(c => {
            const isEscalated = String(c.status || '').toUpperCase() === 'ESCALATED';
            return {
                ...c,
                _id: c._id || c.id,
                type: 'CURFEW',
                caseNo: c.caseNo || `CV-166-${String(c._id || c.id).slice(-6).toUpperCase()}`,
                resident: c.residentName || c.resident,
                complainantName: 'Barangay Patrol',
                date: c.violationDate || c.date,
                status: isEscalated ? 'ESCALATED' : 'SETTLED',
                fullData: {
                    incidentDate: c.violationDate || c.date,
                    incidentLocation: c.location || c.address,
                    incidentDesc: `Curfew violation apprehended at ${c.violationTime || c.time}. Offender age: ${c.age}.`,
                    selectedRole: 'Patrol Officer'
                }
            };
        });
        
        // Sort strictly by updatedAt first so newly escalated cases sit at the VERY TOP
        const sorted = [...archivedCases, ...archivedCurfews].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.date || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.date || b.createdAt).getTime();
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });

        setRows(sorted);
      } catch (error) {
        console.error('Error loading archived records:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    const handleCaseUpdate = () => loadData();
    window.addEventListener('caseDataUpdated', handleCaseUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('caseDataUpdated', handleCaseUpdate);
    };
  }, []);

  const filteredRows = rows.filter((row) => {
    const searchLower = search.toLowerCase();
    
    // searchLower === '' ensures the row doesn't get hidden if fields are empty
    const matchesSearch = searchLower === '' || 
        (row.caseNo && String(row.caseNo).toLowerCase().includes(searchLower)) ||
        (row.resident && String(row.resident).toLowerCase().includes(searchLower)) ||
        (row.complainantName && String(row.complainantName).toLowerCase().includes(searchLower));

    let rowYear = '';
    let rowMonth = '';
    let rowDay = '';

    // Advanced Date Extraction for Filtering
    if (row.date) {
        const itemDateParts = row.date.split('-');
        if (itemDateParts.length === 3) {
            if (itemDateParts[2].length === 4) { // MM-DD-YYYY
                rowYear = itemDateParts[2];
                rowMonth = itemDateParts[0].padStart(2, '0');
                rowDay = itemDateParts[1].padStart(2, '0');
            } else { // YYYY-MM-DD
                rowYear = itemDateParts[0];
                rowMonth = itemDateParts[1].padStart(2, '0');
                rowDay = itemDateParts[2].padStart(2, '0');
            }
        } else {
            // Fallback
            const d = new Date(row.date);
            if (!isNaN(d.getTime())) {
                rowYear = d.getFullYear().toString();
                rowMonth = String(d.getMonth() + 1).padStart(2, '0');
                rowDay = String(d.getDate()).padStart(2, '0');
            }
        }
    }

    const matchesYear = filterYear === 'All Years' || rowYear === filterYear;
    const matchesMonth = filterMonth === 'All Months' || rowMonth === filterMonth.padStart(2, '0');
    const matchesDay = filterDay === 'All Days' || rowDay === filterDay.padStart(2, '0');
    
    let matchesType = true;
    if (sortType !== allTypesText) {
        if (sortType === 'ESCALATED') {
            matchesType = String(row.status || '').toUpperCase() === 'ESCALATED';
        } else {
            matchesType = String(row.type || '').toUpperCase() === sortType;
        }
    }

    return matchesSearch && matchesYear && matchesMonth && matchesDay && matchesType;
  });

  const handleViewDetails = async (row) => { 
    try {
      if (row.type !== 'CURFEW') {
          const allSummons = await summonsAPI.getAll();
          const caseSummons = allSummons.filter(s => s.caseNo === row.caseNo);
          setSelectedSummons(caseSummons);
      } else {
          setSelectedSummons([]); 
      }
      setSelected(row);
      setView('DETAILS');
    } catch (error) {
      console.error('Error loading case details:', error);
      Swal.fire('Error', 'Failed to load case details', 'error');
    }
  };
  
  const handleBackToTable = () => { 
    setSelected(null); 
    setSelectedSummons([]);
    setView('TABLE'); 
  };

  const handleRestore = (row) => {
    Swal.fire({
      title: t('swal_restore_title') || 'Restore Record?',
      text: `Restore ${row.caseNo} back to active status?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: t('Restore') || 'swal_yes_restore',
      cancelButtonText: t('Cancel') || 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (row.type === 'CURFEW') {
              await curfewsAPI.update(row._id, { status: 'ACTIVE' });
          } else {
              await casesAPI.update(row._id, { ...row, status: 'PENDING' });
          }
          
          window.dispatchEvent(new Event('caseDataUpdated'));
          
          if(view === 'DETAILS') setView('TABLE');
          Swal.fire(
            t('swal_restored') || 'Restored!', 
            t('swal_restored_text') || 'The record has been restored to active status.', 
            'success'
          );
        } catch (error) {
          console.error('Error restoring record:', error);
          Swal.fire('Error', 'Failed to restore record', 'error');
        }
      }
    });
  };

  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  const handleDownloadPDFClick = () => {
    Swal.fire({
      title: 'Download as PDF',
      html: `
        <p style="margin: 15px 0;">To save this document as PDF:</p>
        <ol style="text-align: left; margin-left: 30px;">
          <li>Click <b>"Open Print Preview"</b> below</li>
          <li>Click the blue <b>PRINT</b> button on the paper</li>
          <li>In the print dialog, select <b>"Save as PDF"</b> as the destination</li>
        </ol>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#0044CC',
      cancelButtonColor: '#999',
      confirmButtonText: 'Open Print Preview',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsPrintModalOpen(true);
      }
    });
  };

  const handleCancelPrint = () => {
    Swal.fire({
      title: t('discard_changes') || 'Discard Changes?', 
      text: t('unsaved_lost') || 'Any unsaved changes will be lost.', 
      icon: 'warning', 
      showCancelButton: true,
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6', 
      confirmButtonText: t('yes_discard') || 'Yes, discard', 
      cancelButtonText: t('cancel') || 'Cancel'
    }).then((result) => { if (result.isConfirmed) setIsPrintModalOpen(false); });
  };

  const handlePrintSubmit = () => {
    Swal.fire({
      title: t('confirm_print_title') || 'Print Report?', 
      text: t('confirm_print_text') || 'Are you sure you want to print this report?', 
      icon: 'question', 
      showCancelButton: true,
      confirmButtonColor: '#0066FF', 
      cancelButtonColor: '#d33', 
      confirmButtonText: t('yes_print') || 'Yes, print', 
      cancelButtonText: t('cancel') || 'Cancel'
    }).then((result) => { if (result.isConfirmed) setTimeout(() => { window.print(); }, 300); });
  };

  const getPrintContent = () => {
    const printDate = new Date();
    const monthYearStringForPrint = printDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

    // ==========================================
    // LAYOUT 1: SINGLE CASE DETAILED PRINT VIEW
    // ==========================================
    if (view === 'DETAILS' && selected) {
      const sortedSummons = [...selectedSummons].sort((a, b) => parseInt(a.summonType) - parseInt(b.summonType));
      const isEscalated = String(selected.status || '').toUpperCase() === 'ESCALATED';

      return (
        <div style={{ width: '100%', maxWidth: '100%', fontFamily: 'Arial, sans-serif', color: 'black', backgroundColor: 'white' }}>
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
                <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '900', color: '#111827' }}>CASE REPORT AND RESOLUTION</h3>
            </div>

            {/* Case Info Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', border: '1px solid black', backgroundColor: '#f9fafb', marginBottom: '24px', fontSize: '13px' }}>
                <div style={{ width: '48%' }}><span style={{ fontWeight: 'bold', color: '#4b5563', marginRight: '8px' }}>CASE NUMBER:</span> <b style={{ color: '#111827' }}>{selected.caseNo}</b></div>
                <div style={{ width: '48%' }}><span style={{ fontWeight: 'bold', color: '#4b5563', marginRight: '8px' }}>CASE TYPE:</span> <b style={{ color: '#1d4ed8' }}>{selected.type}</b></div>
                <div style={{ width: '48%' }}><span style={{ fontWeight: 'bold', color: '#4b5563', marginRight: '8px' }}>DATE FILED:</span> <b style={{ color: '#111827' }}>{formatDate(selected.date || selected.fullData?.dateFiled)}</b></div>
                <div style={{ width: '48%' }}><span style={{ fontWeight: 'bold', color: '#4b5563', marginRight: '8px' }}>STATUS:</span> <b style={{ color: isEscalated ? '#dc2626' : '#16a34a' }}>{isEscalated ? 'ESCALATED & ARCHIVED' : 'SETTLED & ARCHIVED'}</b></div>
            </div>

            {/* I. Parties Involved */}
            <h4 style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', textTransform: 'uppercase', borderBottom: '2px solid black', paddingBottom: '4px' }}>I. Parties Involved</h4>
            <div style={{ display: 'flex', marginBottom: '24px', fontSize: '13px' }}>
                <div style={{ width: '50%', paddingRight: '12px' }}>
                    <div style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>COMPLAINANT</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.complainantName || 'N/A'}</div></div>
                    <div style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>ADDRESS</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.fullData?.complainantAddress || 'N/A'}</div></div>
                    <div><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>CONTACT</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.contact || selected.fullData?.complainantContact || 'N/A'}</div></div>
                </div>
                <div style={{ width: '50%', paddingLeft: '12px' }}>
                    <div style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>RESPONDENT</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.resident || selected.fullData?.respondentName || 'N/A'}</div></div>
                    <div style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>ADDRESS</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.fullData?.respondentAddress || 'N/A'}</div></div>
                    <div><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>CONTACT</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.fullData?.respondentContact || 'N/A'}</div></div>
                </div>
            </div>

            {/* II. Incident Details */}
            <h4 style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', textTransform: 'uppercase', borderBottom: '2px solid black', paddingBottom: '4px' }}>II. Incident Details</h4>
            <div style={{ fontSize: '13px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                    <div style={{ width: '50%', paddingRight: '12px' }}><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>DATE OF INCIDENT</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px' }}>{formatDate(selected.fullData?.incidentDate || selected.date)}</div></div>
                    <div style={{ width: '50%', paddingLeft: '12px' }}><span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block' }}>LOCATION</span> <div style={{ borderBottom: '1px solid #9ca3af', fontWeight: 'bold', paddingBottom: '2px', textTransform: 'uppercase' }}>{selected.fullData?.incidentLocation || 'Barangay 166, Caloocan City'}</div></div>
                </div>
                <div>
                    <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>DESCRIPTION OF INCIDENT</span>
<div style={{ border: '1px solid #9ca3af', padding: '12px', backgroundColor: '#f9fafb', minHeight: '60px', borderRadius: '4px', fontWeight: '500', textTransform: 'uppercase', wordBreak: 'break-all', whiteSpace: 'normal' }}>                        {selected.fullData?.incidentDesc || 'CASE HAS BEEN RESOLVED AND ARCHIVED.'}
                    </div>
                </div>
            </div>

            {/* III. Summons Issued */}
            {selected.type !== 'CURFEW' && (
                <>
                    <h4 style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', textTransform: 'uppercase', borderBottom: '2px solid black', paddingBottom: '4px' }}>III. Summons Issued</h4>
                    <div style={{ marginBottom: '24px' }}>
                        {sortedSummons.length > 0 ? sortedSummons.map((summon, idx) => (
                            <div key={idx} style={{ border: '1px solid #9ca3af', padding: '12px', marginBottom: '8px', backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316', borderRadius: '4px', pageBreakInside: 'avoid' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '6px', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>{summon.summonType === '1' ? 'First' : summon.summonType === '2' ? 'Second' : 'Third'} Summon</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: summon.status === 'Active' ? '#15803d' : '#1d4ed8' }}>{summon.status}</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: '12px', color: '#1f2937' }}>
                                    <div style={{ width: '50%', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', color: '#6b7280', marginRight: '4px' }}>TO:</span> <b style={{ textTransform: 'uppercase' }}>{summon.residentName}</b></div>
                                    <div style={{ width: '50%', marginBottom: '4px' }}><span style={{ fontWeight: 'bold', color: '#6b7280', marginRight: '4px' }}>DATE:</span> {formatDate(summon.summonDate)} at {summon.summonTime}</div>
                                    <div style={{ width: '100%' }}><span style={{ fontWeight: 'bold', color: '#6b7280', marginRight: '4px' }}>NOTED BY:</span> <span style={{ textTransform: 'uppercase' }}>{summon.notedBy}</span></div>
                                </div>
                                {summon.summonReason && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #d1d5db', fontSize: '12px' }}>
                                        <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#6b7280', fontSize: '10px' }}>REASON:</span>
<div style={{ textTransform: 'uppercase', wordBreak: 'break-all', whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: decodeHTML(summon.summonReason) }} />                                    </div>
                                )}
                            </div>
                        )) : <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#6b7280', padding: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>NO SUMMONS WERE ISSUED FOR THIS CASE.</p>}
                    </div>
                </>
            )}

            {/* Timeline */}
            <h4 style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', textTransform: 'uppercase', borderBottom: '2px solid black', paddingBottom: '4px', pageBreakInside: 'avoid' }}>{selected.type !== 'CURFEW' ? 'IV.' : 'III.'} Case Timeline</h4>
            <div style={{ marginBottom: '24px', paddingLeft: '16px', borderLeft: '2px solid #d1d5db', marginLeft: '8px', fontSize: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', backgroundColor: '#2563eb', borderRadius: '50%', border: '2px solid white' }}></div>
                    <b style={{ display: 'block', color: '#111827', fontSize: '13px', textTransform: 'uppercase' }}>{selected.type === 'CURFEW' ? 'VIOLATION RECORDED' : 'CASE FILED'}</b>
                    <span style={{ color: '#4b5563', fontSize: '11px', textTransform: 'uppercase' }}>{formatDate(selected.date)}</span>
                </div>
                {sortedSummons.map((summon, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', backgroundColor: '#f97316', borderRadius: '50%', border: '2px solid white' }}></div>
                        <b style={{ display: 'block', color: '#111827', fontSize: '13px', textTransform: 'uppercase' }}>{summon.summonType === '1' ? '1ST' : summon.summonType === '2' ? '2ND' : '3RD'} SUMMON ISSUED</b>
                        <span style={{ color: '#4b5563', fontSize: '11px', textTransform: 'uppercase' }}>{formatDate(summon.summonDate)} AT {summon.summonTime}</span>
                    </div>
                ))}
                {selected.blacklistedAt && (
    <div style={{ marginBottom: '16px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#000000' }}></div>
        <b style={{ display: 'block', color: '#111827', fontSize: '13px', textTransform: 'uppercase' }}>CASE BLACKLISTED</b>
        <span style={{ color: '#4b5563', fontSize: '11px', textTransform: 'uppercase' }}>{formatBlacklistedDateTime(selected.blacklistedAt)}</span>
    </div>
)}
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', backgroundColor: isEscalated ? '#dc2626' : '#16a34a' }}></div>
                    <b style={{ display: 'block', color: '#111827', fontSize: '13px', textTransform: 'uppercase' }}>{isEscalated ? 'CASE ESCALATED' : 'CASE SETTLED'}</b>
                    <span style={{ color: '#4b5563', fontSize: '11px', textTransform: 'uppercase' }}>{formatDate(selected.updatedAt || selected.date)}</span>
                </div>
            </div>

            {/* Resolution Text */}
            <h4 style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', textTransform: 'uppercase', borderBottom: '2px solid black', paddingBottom: '4px', pageBreakInside: 'avoid' }}>{selected.type !== 'CURFEW' ? 'V.' : 'IV.'} Resolution</h4>
            <div style={{ border: '2px solid black', padding: '16px', fontSize: '13px', textAlign: 'justify', lineHeight: '1.6', marginBottom: '24px', backgroundColor: 'white', fontWeight: '500', pageBreakInside: 'avoid', textTransform: 'uppercase' }}>
                {isEscalated 
                  ? "THIS IS TO CERTIFY THAT THE ABOVE-MENTIONED CASE HAS NOT BEEN SUCCESSFULLY MEDIATED AND SETTLED THROUGH THE KATARUNGANG PAMBARANGAY PROCEEDINGS. THE CASE IS HEREBY ESCALATED AND RECORDED IN THE BARANGAY ARCHIVES FOR FURTHER LEGAL ACTION AND REFERENCE."
                  : "THIS IS TO CERTIFY THAT THE ABOVE-MENTIONED CASE HAS BEEN SUCCESSFULLY MEDIATED AND SETTLED THROUGH THE KATARUNGANG PAMBARANGAY PROCEEDINGS IN ACCORDANCE WITH THE PROVISIONS OF THE LOCAL GOVERNMENT CODE OF 1991. BOTH PARTIES HAVE AGREED TO THE TERMS OF SETTLEMENT AND HAVE COMMITTED TO ABIDE BY THE RESOLUTION REACHED DURING THE MEDIATION PROCESS."
                }
            </div>

            {/* Footer with Signatures */}
            <div style={{ marginTop: '24px', paddingTop: '16px', width: '100%', pageBreakInside: 'avoid', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid #d1d5db' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', textAlign: 'center', fontSize: '12px', marginBottom: '32px', marginTop: '8px' }}>
                    <div style={{ width: '40%' }}>
                        <div style={{ borderBottom: '1px solid black', fontWeight: 'bold', paddingBottom: '4px', height: '20px', textTransform: 'uppercase' }}>{selected.complainantName || ''}</div>
                        <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px', color: '#4b5563' }}>Complainant's Signature</div>
                    </div>
                    <div style={{ width: '40%' }}>
                        <div style={{ borderBottom: '1px solid black', fontWeight: 'bold', paddingBottom: '4px', height: '20px', textTransform: 'uppercase' }}>{selected.resident || selected.fullData?.respondentName || ''}</div>
                        <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px', color: '#4b5563' }}>Respondent's Signature</div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', textAlign: 'center', fontSize: '12px', marginBottom: '32px' }}>
                    <div style={{ width: '40%' }}>
                        <div style={{ borderBottom: '1px solid black', fontWeight: 'bold', paddingBottom: '4px', height: '20px', textTransform: 'uppercase' }}>{selected.fullData?.selectedRole || 'LUPON TAGAPAMAYAPA'}</div>
                        <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px', color: '#4b5563' }}>Barangay Official</div>
                    </div>
                    <div style={{ width: '40%' }}>
                        <div style={{ borderBottom: '1px solid black', fontWeight: 'bold', paddingBottom: '4px', height: '20px' }}></div>
                        <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px', color: '#4b5563' }}>Punong Barangay</div>
                    </div>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                        <div style={{ borderBottom: '1px solid black', marginBottom: '6px' }}></div>
                        <p style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>CLERK OF COURT</p>
                    </div>
                </div>

                <div style={{ fontSize: '9px', color: '#6b7280', width: '100%', marginBottom: '8px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>DOCUMENT GENERATED ON {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</p>
                    <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>BARANGAY 166, CALOOCAN CITY | OFFICIAL BARANGAY RECORDS</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '48px', width: '100%' }}>
                    <img src="/icon-analytics/analytics footerprint.png" alt="Bagong Pilipinas" style={{ height: '40px', objectFit: 'contain', zIndex: 10 }} />
                </div>
            </div>
        </div>
      );
    } 

    // ==========================================
    // LAYOUT 2: MONTHLY TRANSMITTAL LIST VIEW
    // ==========================================
    const combinedPrintData = filteredRows.map(item => ({
      caseNo: item.caseNo,
      title: item.type === 'CURFEW' ? `BARANGAY PATROL VS ${item.resident || 'N/A'}` : `${item.complainantName || 'N/A'} VS ${item.resident || item.respondentName || 'N/A'}`,
      date: item.date || item.createdAt
    }));

    return (
      <div style={{ width: '100%', maxWidth: '100%', fontFamily: 'Arial, sans-serif', color: 'black', backgroundColor: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, tableLayout: 'fixed', wordWrap: 'break-word' }}>
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
  
          <tbody style={{ display: 'table-row-group' }}>
              {combinedPrintData.length > 0 ? combinedPrintData.map((item, index) => (
                  <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                      <td style={{ border: '1px solid black', padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>{item.caseNo}</td>
                      <td style={{ border: '1px solid black', padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>{item.title}</td>
                  </tr>
              )) : (
                  <tr style={{ pageBreakInside: 'avoid' }}><td colSpan="2" style={{ border: '1px solid black', padding: '30px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>No cases recorded for the selected filter period.</td></tr>
              )}
          </tbody>
  
          <tfoot style={{ display: 'table-footer-group' }}>
            <tr>
              <td colSpan="2" style={{ border: 'none', paddingTop: '50px', paddingBottom: '20px' }}>
                  <div style={{ textAlign: 'right', marginBottom: '30px', width: '100%' }}>
                      <div style={{ display: 'inline-block', textAlign: 'center', width: '250px' }}>
                          <div style={{ borderBottom: '1px solid black', marginBottom: '8px', width: '100%' }}></div>
                          <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>Clerk of Court</p>
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
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderPrintModal = () => {
    if (!isPrintModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto py-10 print-hide">
        <div className="bg-white relative flex flex-col shrink-0 w-[210mm] min-h-[297mm] p-[15mm_20mm] mx-auto shadow-2xl">
            
            {getPrintContent()}
            
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

  // Calendar Calculation logic
  const calYear = calendarViewDate.getFullYear();
  const calMonth = calendarViewDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();

  const handleDateSelect = (day, m = calMonth, y = calYear) => {
    setFilterYear(String(y));
    setFilterMonth(String(m + 1).padStart(2, '0'));
    setFilterDay(String(day).padStart(2, '0'));
    setIsDateFilterOpen(false);
  };

  const clearDateFilter = () => {
    setFilterYear('All Years');
    setFilterMonth('All Months');
    setFilterDay('All Days');
    setIsDateFilterOpen(false);
  };

  let displayDate = `${monthNames[realToday.getMonth()]} ${realToday.getDate()}, ${realToday.getFullYear()}`;
  if (filterYear !== 'All Years' && filterMonth !== 'All Months') {
    if (filterDay === 'All Days') {
      displayDate = `${monthNames[parseInt(filterMonth) - 1]} ${filterYear}`;
    } else {
      displayDate = `${monthNames[parseInt(filterMonth) - 1]} ${parseInt(filterDay)}, ${filterYear}`;
    }
  } else if (filterYear !== 'All Years' && filterMonth === 'All Months') {
    displayDate = filterYear;
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={() => { setIsDateFilterOpen(false); setIsTypeSortOpen(false); }}>
      
      {/* 🔥 THE ACTUAL PRINT DOCUMENT: ONLY VISIBLE DURING PRINTING 🔥 */}
      <div id="real-print-doc" className="hidden print:block w-full m-0 p-0 absolute top-0 left-0 bg-white z-[99999]">
        {getPrintContent()}
      </div>

      {renderPrintModal()}

      {/* 🔥 THE CRITICAL CSS FIX FOR RESPONSIVE, MULTI-PAGE PRINTING WITH DEFAULT 100% SCALE 🔥 */}
      <style>{`
          @media print {
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
            body * {
              visibility: hidden !important;
            }
            #real-print-doc, #real-print-doc * {
              visibility: visible !important;
              box-sizing: border-box !important;
            }
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
               #real-print-doc div, 
    #real-print-doc p, 
    #real-print-doc span,
    #real-print-doc td,
    #real-print-doc th {
      word-break: break-all !important;
      word-wrap: break-word !important;
      white-space: normal !important;
      overflow-wrap: break-word !important;
    }
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
  word-break: break-all !important;
}
            thead { display: table-header-group !important; }
            tfoot { display: table-footer-group !important; }
            .print-hide { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page {
              size: auto;
              margin: 8mm; 
            }
          }
      `}</style>

      <div className="flex-1 flex flex-col h-full min-h-0 w-full print-hide">
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-[#0044CC] px-6 py-4 text-white shadow-md shrink-0 rounded-t-xl flex items-center gap-3 z-30 relative">
              <button onClick={handleBackToTable} className="hover:bg-blue-600 p-1.5 rounded-full transition-colors flex items-center justify-center -ml-2"><ChevronLeft size={26} strokeWidth={2.5} /></button>
              <h1 className="text-xl font-bold">{t('archived_case_details') || 'Archived Case Details'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <Folder size={32} className="text-blue-600" strokeWidth={2.5} />
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900 uppercase">{selected.caseNo}</h2>
                    <p className="text-sm text-blue-700 font-medium uppercase">Case Folder - All Documents & Records</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`${getTypeStyle(selected.type)} text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide`}>{selected.type}</span>
                  {String(selected.status || '').toUpperCase() === 'ESCALATED' 
                    ? <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">! ESCALATED</span>
                    : <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">✓ SETTLED</span>
                  }
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0044CC] uppercase">{t('case_summary')}</h3>
                </div>
               <div className="grid grid-cols-2 gap-y-6">
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.caseNo}</p></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('complainant')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.complainantName || 'N/A'}</p></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('resident_name')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.resident}</p></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_filed')}</p><p className="text-sm font-bold text-gray-800 uppercase">{formatDate(selected.date)}</p></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('incident_date')}</p><p className="text-sm font-bold text-gray-800 uppercase">{formatDate(selected.fullData?.incidentDate || selected.date)}</p></div>
    {selected.blacklistedAt && (
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Blacklisted Date & Time</p>
        <p className="text-sm font-bold text-black uppercase">{formatBlacklistedDateTime(selected.blacklistedAt)}</p>
      </div>
    )}
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('location')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.fullData?.incidentLocation || 'Barangay 166, Caloocan City'}</p></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.fullData?.selectedRole || 'Lupon Tagapamayapa'}</p></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Status</p>
      {String(selected.status || '').toUpperCase() === 'ESCALATED' 
        ? <p className="text-sm font-bold text-red-600 uppercase">ESCALATED & ARCHIVED</p>
        : <p className="text-sm font-bold text-green-600 uppercase">SETTLED & ARCHIVED</p>
      }
    </div>
</div>
                <div className="mt-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium uppercase">
                    {selected.fullData?.incidentDesc || 'CASE HAS BEEN RESOLVED AND ARCHIVED.'}
                  </div>
                </div>
              </div>

              {selected.type !== 'CURFEW' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Gavel size={20} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-[#0044CC] uppercase">Summons Records ({selectedSummons.length})</h3>
                  </div>
                  {selectedSummons.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSummons.sort((a, b) => parseInt(a.summonType) - parseInt(b.summonType)).map((summon, idx) => (
                        <div key={idx} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 uppercase">{summon.summonType === '1' ? '1st Summon' : summon.summonType === '2' ? '2nd Summon' : '3rd Summon'}</h4>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Resident: {summon.residentName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              summon.status === 'Active' ? 'bg-green-100 text-green-700' : 
                              summon.status === 'Settled' ? 'bg-blue-100 text-blue-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>{summon.status}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs uppercase">
                            <div><span className="font-bold text-gray-600">Date:</span> <span className="text-gray-800">{formatDate(summon.summonDate)}</span></div>
                            <div><span className="font-bold text-gray-600">Time:</span> <span className="text-gray-800">{summon.summonTime}</span></div>
                            <div className="col-span-2"><span className="font-bold text-gray-600">Noted By:</span> <span className="text-gray-800">{summon.notedBy}</span></div>
                          </div>
                          {summon.summonReason && (
                            <div className="mt-3 pt-3 border-t border-orange-200">
                              <p className="text-[10px] font-bold text-gray-600 mb-1 uppercase">SUMMON REASON:</p>
                              <div className="text-xs text-gray-700 bg-white p-2 rounded uppercase [&_b]:font-bold [&_i]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: decodeHTML(summon.summonReason) }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic py-4 uppercase">NO SUMMONS WERE ISSUED FOR THIS CASE.</p>
                  )}
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0044CC] uppercase">Case Timeline</h3>
                </div>
                <div className="space-y-4 relative pl-6 border-l-2 border-blue-200">
                  <div className="relative">
                    <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                    <div className="text-xs uppercase">
                      <p className="font-bold text-gray-900">{selected.type === 'CURFEW' ? 'VIOLATION RECORDED' : 'CASE FILED'}</p>
                      <p className="text-gray-600">{formatDate(selected.date)}</p>
                    </div>
                  </div>
                  {selectedSummons.sort((a, b) => parseInt(a.summonType) - parseInt(b.summonType)).map((summon, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                      <div className="text-xs uppercase">
                        <p className="font-bold text-gray-900">{summon.summonType === '1' ? '1st' : summon.summonType === '2' ? '2nd' : '3rd'} SUMMON ISSUED</p>
                        <p className="text-gray-600">{formatDate(summon.summonDate)} AT {summon.summonTime}</p>
                      </div>
                    </div>
                  ))}
                  {selected.blacklistedAt && (
    <div className="relative">
      <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-black border-2 border-white"></div>
      <div className="text-xs uppercase">
        <p className="font-bold text-gray-900">CASE BLACKLISTED</p>
        <p className="text-gray-600">{formatBlacklistedDateTime(selected.blacklistedAt)}</p>
      </div>
    </div>
  )}
                  <div className="relative">
                    <div className={`absolute -left-[27px] w-4 h-4 rounded-full border-2 border-white ${String(selected.status || '').toUpperCase() === 'ESCALATED' ? 'bg-red-600' : 'bg-green-600'}`}></div>
                    <div className="text-xs uppercase">
                      <p className="font-bold text-gray-900">{String(selected.status || '').toUpperCase() === 'ESCALATED' ? 'CASE ESCALATED' : 'CASE SETTLED'}</p>
                      <p className="text-gray-600">{new Date(selected.updatedAt || selected.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RESTORE BUTTON */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Folder size={20} className="text-green-600" />
                  <h3 className="text-lg font-bold text-[#0044CC] uppercase">Restore Case</h3>
                </div>
                <button onClick={() => handleRestore(selected)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg uppercase">
                  Restore to Active
                </button>
              </div>

              {/* EXPORT CASE FOLDER HERE */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Download size={20} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0044CC] uppercase">Export Case Folder</h3>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDownloadPDFClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase">
                    <Download size={18} />
                    Download as PDF
                  </button>
                  <button onClick={handleOpenPrintModal} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase">
                    <Printer size={18} />
                    Print Case Report
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-5 text-white shadow-md shrink-0">
              <div className="flex items-center gap-2">
                <Folder size={24} className="text-white" strokeWidth={2} />
                <h1 className="text-2xl font-bold uppercase tracking-wide text-white">{t('archived_cases') || 'Archived Cases'}</h1>
              </div>
              <p className="text-sm font-medium text-white/80 mt-1">{t('archived_subtitle') || 'Browse settled cases'}</p>
            </div>

            <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 shrink-0 relative z-20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('total_settled') || 'Total Records'}: {filteredRows.length}</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  
                  {/* Beautiful Calendar Dropdown Filter */}
                  <div className="relative w-full sm:w-auto" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => { setIsDateFilterOpen(!isDateFilterOpen); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-blue-500" /><span>{displayDate}</span></div>
                      <ChevronDown size={16} className={`ml-3 text-gray-400 transition-transform ${isDateFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDateFilterOpen && (
                      <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-[340px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="flex justify-between items-center mb-5">
                          <button 
                            onClick={() => setCalendarViewDate(new Date(calYear, calMonth - 1, 1))} 
                            className="p-2 hover:bg-slate-100 rounded-xl text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <select
                                value={calMonth}
                                onChange={(e) => {
                                  const newMonth = parseInt(e.target.value);
                                  setCalendarViewDate(new Date(calYear, newMonth, 1));
                                }}
                                className="appearance-none bg-white border border-gray-200 hover:border-blue-400 text-gray-800 font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
                              >
                                {monthNames.map((m, i) => (
                                  <option key={m} value={i} disabled={calYear === currentYear && i > currentMonth}>{m}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>
                            
                            <div className="relative group">
                              <select
                                value={calYear}
                                onChange={(e) => {
                                  const newYear = parseInt(e.target.value);
                                  let newMonth = calMonth;
                                  if (newYear === currentYear && newMonth > currentMonth) {
                                    newMonth = currentMonth;
                                  }
                                  setCalendarViewDate(new Date(newYear, newMonth, 1));
                                }}
                                className="appearance-none bg-white border border-gray-200 hover:border-blue-400 text-gray-800 font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
                              >
                                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(y => (
                                   <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>

                          <button 
                            onClick={() => setCalendarViewDate(new Date(calYear, calMonth + 1, 1))} 
                            disabled={calYear === currentYear && calMonth === currentMonth}
                            className={`p-2 rounded-xl transition-colors ${calYear === currentYear && calMonth === currentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-slate-100 hover:text-blue-600'}`}
                          >
                            <ChevronRight size={18} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 mb-3 gap-1">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = filterYear === String(calYear) && filterMonth === String(calMonth + 1).padStart(2, '0') && filterDay === String(day).padStart(2, '0');
                            const isToday = currentYear === calYear && currentMonth === calMonth && currentDate === day;
                            const isFuture = calYear === currentYear && calMonth === currentMonth && day > currentDate;

                            return (
                              <button
                                key={day}
                                disabled={isFuture}
                                onClick={() => handleDateSelect(day)}
                                className={`h-10 w-full rounded-xl text-sm font-bold transition-all duration-200 
                                  ${isFuture ? 'opacity-30 cursor-not-allowed text-gray-400' : 
                                    isSelected ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200 scale-105' : 
                                    isToday ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
                                  }`}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <button onClick={clearDateFilter} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50">
                            Clear
                          </button>
                          
                          <button 
                            onClick={() => {
                              setFilterYear(String(calYear));
                              setFilterMonth(String(calMonth + 1).padStart(2, '0'));
                              setFilterDay('All Days');
                              setIsDateFilterOpen(false);
                            }} 
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50"
                          >
                            {t('whole_month') || 'Whole Month'}
                          </button>

                          <button onClick={() => {
                              setCalendarViewDate(realToday);
                              handleDateSelect(realToday.getDate(), realToday.getMonth(), realToday.getFullYear());
                          }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-md hover:bg-blue-50">
                            Today
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Type Filter */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsTypeSortOpen(!isTypeSortOpen); setIsDateFilterOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Filter size={18} className="mr-2 text-gray-500" /><span>{sortType}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" />
                    </button>
                    {isTypeSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {typeOptions.map(o => (<div key={o.label} onClick={() => { setSortType(o.label); setIsTypeSortOpen(false); }} className="px-4 py-3 text-sm font-bold hover:bg-blue-50 cursor-pointer flex items-center text-gray-700 border-b last:border-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${o.color} mr-3`} />{o.label}
                      </div>))}
                    </div>)}
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input type="text" placeholder={t('search_placeholder') || 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full z-10 relative bg-white">
              <div className="px-6 md:px-8 py-6">
                <table className="w-full border-collapse text-sm relative">
                  <thead className="sticky top-0 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                    <tr className="border-b-2 border-blue-100 text-blue-900 bg-white">
                      <th className="px-4 py-4 text-left font-bold uppercase w-[12%] bg-white">{t('report_type')}</th>
                      <th className="px-4 py-4 text-left font-bold uppercase w-[18%] bg-white">{t('case_number')}</th>
                      <th className="px-4 py-4 text-left font-bold uppercase w-[30%] bg-white">{t('complainant_name') || 'Complainant / Resident'}</th>
                      <th className="px-4 py-4 text-left font-bold uppercase w-[40%] bg-white">{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRows.map((row) => {
                      const isEscalated = String(row.status || '').toUpperCase() === 'ESCALATED';
                      return (
                      <tr key={row.id || row.caseNo} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-5">
                          <span className={`inline-block rounded px-3 py-1 text-[10px] font-bold shadow-sm uppercase tracking-wide ${isEscalated ? 'bg-red-500 text-white' : getTypeStyle(row.type)}`}>
                            {isEscalated ? 'ESCALATED' : row.type}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <Folder size={18} className={`${isEscalated ? 'text-red-600' : 'text-blue-600'}`} strokeWidth={2} />
                            <span className={`font-bold uppercase ${isEscalated ? 'text-red-700' : 'text-gray-700'}`}>{row.caseNo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-5 font-medium text-gray-600 uppercase">
                            {row.type === 'CURFEW' ? row.resident : (row.complainantName || row.resident)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex gap-2">
                            <ArchivedButton actionType="restore" onClick={() => handleRestore(row)}>
                              {t('restore') || 'Restore'}
                            </ArchivedButton>
                            <ArchivedButton actionType="view" onClick={() => handleViewDetails(row)}>
                              {t('view_folder') || 'Open Folder'}
                            </ArchivedButton>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400 font-bold bg-white uppercase">
                          {t('no_settled_cases') || 'No archived folders found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}