import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Calendar, Filter, ChevronDown, Folder, FileText, Gavel, Clock, Download, Printer, Search } from 'lucide-react'; 
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

export default function Archived() {
  const { t } = useLanguage(); 
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedSummons, setSelectedSummons] = useState([]); 
  const [search, setSearch] = useState('');
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const allYearsText = t('all_years') || 'All Years';
  const allMonthsText = t('all_months') || 'All Months';
  const allTypesText = t('all_types') || 'All Types';

  const [isYearSortOpen, setIsYearSortOpen] = useState(false);
  const [isMonthSortOpen, setIsMonthSortOpen] = useState(false);
  const [isDaySortOpen, setIsDaySortOpen] = useState(false); // Added Day Dropdown State
  const [isTypeSortOpen, setIsTypeSortOpen] = useState(false);
  
  const [sortYear, setSortYear] = useState(allYearsText);
  const [sortMonth, setSortMonth] = useState(allMonthsText);
  const [filterDay, setFilterDay] = useState('All Days'); // Added Day Filter State
  const [sortType, setSortType] = useState(allTypesText);

  const currentYear = new Date().getFullYear();
  const yearOptions = [allYearsText, ...Array.from({length: 7}, (_, i) => (currentYear - i).toString())];
  
  const monthOptions = [
    { label: allMonthsText, value: 'all', number: 0 },
    { label: 'JANUARY', value: '01', number: 0 },
    { label: 'FEBRUARY', value: '02', number: 1 },
    { label: 'MARCH', value: '03', number: 2 },
    { label: 'APRIL', value: '04', number: 3 },
    { label: 'MAY', value: '05', number: 4 },
    { label: 'JUNE', value: '06', number: 5 },
    { label: 'JULY', value: '07', number: 6 },
    { label: 'AUGUST', value: '08', number: 7 },
    { label: 'SEPTEMBER', value: '09', number: 8 },
    { label: 'OCTOBER', value: '10', number: 9 },
    { label: 'NOVEMBER', value: '11', number: 10 },
    { label: 'DECEMBER', value: '12', number: 11 }
  ];
  
  const dayOptions = ['All Days', ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))]; // Added Day Options

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
            return s === 'SETTLED' || s === 'ESCALATED';
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
                caseNo: `CRF-${String(c._id || c.id).slice(-6)}`,
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
        
        // 🔥 FIX: Sort strictly by updatedAt first so newly escalated cases sit at the VERY TOP 🔥
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
    
    // 🔥 FIX: searchLower === '' ensures the row doesn't get hidden if fields are empty 🔥
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

    const matchesYear = (sortYear === allYearsText) || rowYear === sortYear;
    
    const selectedMonth = monthOptions.find(m => m.label === sortMonth);
    const matchesMonth = (sortMonth === allMonthsText) || rowMonth === selectedMonth?.value;
    
    const matchesDay = (filterDay === 'All Days') || rowDay === filterDay; // Added Day matching
    
    let matchesType = true;
    if (sortType !== allTypesText) {
        if (sortType === 'ESCALATED') {
            matchesType = String(row.status || '').toUpperCase() === 'ESCALATED';
        } else {
            matchesType = String(row.type || '').toUpperCase() === sortType;
        }
    }

    return matchesSearch && matchesYear && matchesMonth && matchesDay && matchesType; // Included Day matching in return
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

  const executeBrowserPrint = () => {
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const renderPrintModal = () => {
    if (!isPrintModalOpen || !selected) return null;
    
    const printDate = new Date();
    const monthYearString = printDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const sortedSummons = [...selectedSummons].sort((a, b) => parseInt(a.summonType) - parseInt(b.summonType));
    const isEscalated = String(selected.status || '').toUpperCase() === 'ESCALATED';

    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto py-10 print:p-0 print:bg-transparent print:block w-full h-full">

        {/* The A4 Paper Content */}
        <div id="printable-content" className="bg-white shadow-2xl relative flex flex-col text-black font-sans shrink-0 border border-gray-300 w-[210mm] min-h-[297mm] p-[15mm_20mm]" style={{ margin: '0 auto' }}>
            
            {/* Header */}
            <div>
                <div className="flex flex-col items-center text-center mb-4 w-full">
                    <div className="h-16 w-16 mb-1 flex items-center justify-center">
                        <img src="/icon-analytics/analyticsprint logo.png" alt="Republic Logo" className="h-full w-full object-contain" />
                    </div>
                    <p className="text-xs font-normal text-gray-900">Republic of the Philippines</p>
                    <h1 className="text-xl font-black text-blue-700 uppercase tracking-wide mt-1">BARANGAY 166, CAYBIGA</h1>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">ZONE 15 DISTRICT I, CALOOCAN CITY</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">#1 GEN LUIS. ST, CAYBIGA CALOOCAN CITY</p>
                </div>
                
                <div className="text-center mb-4 w-full">
                    <h2 className="text-base font-bold text-gray-800 uppercase tracking-widest">TANGGAPAN NG LUPON TAGAMAPAYAMAPA</h2>
                    <div className="w-full flex justify-end mt-2"><p className="text-[10px] font-bold text-gray-800 uppercase">{monthYearString}</p></div>
                </div>

                <div className="text-center mb-6 w-full border-t-4 border-b-4 border-double border-black py-1.5">
                    <h3 className="text-lg font-black text-gray-900 uppercase">CASE REPORT AND RESOLUTION</h3>
                </div>

                {/* Case Info Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 border border-black bg-gray-50 mb-4 text-xs">
                    <div><span className="font-bold text-gray-600 mr-2">CASE NUMBER:</span> <span className="font-bold text-gray-900">{selected.caseNo}</span></div>
                    <div><span className="font-bold text-gray-600 mr-2">CASE TYPE:</span> <span className="font-bold text-blue-700">{selected.type}</span></div>
                    <div><span className="font-bold text-gray-600 mr-2">DATE FILED:</span> <span className="font-bold text-gray-900">{formatDate(selected.date || selected.fullData?.dateFiled)}</span></div>
                    <div><span className="font-bold text-gray-600 mr-2">STATUS:</span> <span className={`font-extrabold ${isEscalated ? 'text-red-600' : 'text-green-600'}`}>{isEscalated ? 'ESCALATED & ARCHIVED' : 'SETTLED & ARCHIVED'}</span></div>
                </div>

                {/* Parties Involved */}
                <h4 className="font-bold text-sm mb-2 uppercase tracking-wide border-b-2 border-black pb-1">I. Parties Involved</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-xs">
                    <div>
                        <div className="mb-1.5"><span className="font-bold block text-[10px] text-gray-500 mb-0.5">COMPLAINANT</span> <div className="border-b border-gray-400 font-bold pb-0.5 text-sm uppercase">{selected.complainantName || 'N/A'}</div></div>
                        <div className="mb-1.5"><span className="font-bold block text-[10px] text-gray-500 mb-0.5">ADDRESS</span> <div className="border-b border-gray-400 font-bold pb-0.5 uppercase">{selected.fullData?.complainantAddress || 'N/A'}</div></div>
                        <div><span className="font-bold block text-[10px] text-gray-500 mb-0.5">CONTACT</span> <div className="border-b border-gray-400 font-bold pb-0.5 uppercase">{selected.contact || selected.fullData?.complainantContact || 'N/A'}</div></div>
                    </div>
                    <div>
                        <div className="mb-1.5"><span className="font-bold block text-[10px] text-gray-500 mb-0.5">RESPONDENT</span> <div className="border-b border-gray-400 font-bold pb-0.5 text-sm uppercase">{selected.resident || selected.fullData?.respondentName || 'N/A'}</div></div>
                        <div className="mb-1.5"><span className="font-bold block text-[10px] text-gray-500 mb-0.5">ADDRESS</span> <div className="border-b border-gray-400 font-bold pb-0.5 uppercase">{selected.fullData?.respondentAddress || 'N/A'}</div></div>
                        <div><span className="font-bold block text-[10px] text-gray-500 mb-0.5">CONTACT</span> <div className="border-b border-gray-400 font-bold pb-0.5 uppercase">{selected.fullData?.respondentContact || 'N/A'}</div></div>
                    </div>
                </div>

                {/* Incident Details */}
                <h4 className="font-bold text-sm mb-2 uppercase tracking-wide border-b-2 border-black pb-1 mt-4">II. Incident Details</h4>
                <div className="text-xs mb-6">
                    <div className="grid grid-cols-2 gap-6 mb-3">
                        <div><span className="font-bold block text-[10px] text-gray-500 mb-0.5">DATE OF INCIDENT</span> <div className="border-b border-gray-400 font-bold pb-0.5">{formatDate(selected.fullData?.incidentDate || selected.date)}</div></div>
                        <div><span className="font-bold block text-[10px] text-gray-500 mb-0.5">LOCATION</span> <div className="border-b border-gray-400 font-bold pb-0.5 uppercase">{selected.fullData?.incidentLocation || 'Barangay 166, Caloocan City'}</div></div>
                    </div>
                    <div>
                        <span className="font-bold block text-[10px] text-gray-500 mb-1">DESCRIPTION OF INCIDENT</span>
                        <div className="border border-gray-400 p-3 bg-gray-50 min-h-[60px] rounded text-gray-800 leading-relaxed font-medium text-justify">
                            {selected.fullData?.incidentDesc || 'Case has been resolved and archived.'}
                        </div>
                    </div>
                </div>

                {/* Summons Issued */}
                {selected.type !== 'CURFEW' && (
                    <>
                        <h4 className="font-bold text-sm mb-2 uppercase tracking-wide border-b-2 border-black pb-1 mt-4">III. Summons Issued</h4>
                        <div className="mb-6">
                            {sortedSummons.length > 0 ? sortedSummons.map((summon, idx) => (
                                <div key={idx} className="border border-gray-400 p-3 mb-2 bg-orange-50/50 border-l-4 border-l-orange-500 rounded break-inside-avoid">
                                    <div className="flex justify-between border-b border-gray-300 pb-1 mb-1.5">
                                        <span className="font-bold text-xs text-gray-900">{summon.summonType === '1' ? 'First' : summon.summonType === '2' ? 'Second' : 'Third'} Summon</span>
                                        <span className={`font-bold text-[10px] ${summon.status === 'Active' ? 'text-green-700' : 'text-blue-700'}`}>{summon.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-800">
                                        <div><span className="font-bold text-gray-500 mr-1">TO:</span> <span className="uppercase font-bold">{summon.residentName}</span></div>
                                        <div><span className="font-bold text-gray-500 mr-1">DATE:</span> {formatDate(summon.summonDate)} at {summon.summonTime}</div>
                                        <div className="col-span-2"><span className="font-bold text-gray-500 mr-1">NOTED BY:</span> {summon.notedBy}</div>
                                    </div>
                                    {summon.summonReason && (
                                        <div className="mt-2 pt-2 border-t border-gray-300 text-[11px]">
                                            <span className="font-bold block mb-0.5 text-gray-500 text-[9px]">REASON:</span>
                                            <div className="text-gray-800 [&_b]:font-bold [&_i]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: decodeHTML(summon.summonReason) }} />
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-xs italic text-gray-500 p-2 border border-gray-200 bg-gray-50">No summons were issued for this case.</p>}
                        </div>
                    </>
                )}

                {/* Case Timeline */}
                <h4 className="font-bold text-sm mb-2 uppercase tracking-wide border-b-2 border-black pb-1 mt-4 break-inside-avoid">{selected.type !== 'CURFEW' ? 'IV.' : 'III.'} Case Timeline</h4>
                <div className="mb-6 pl-4 border-l-2 border-gray-300 ml-2 text-[11px] break-inside-avoid">
                    <div className="mb-3 relative">
                        <div className="absolute -left-[22px] top-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                        <span className="font-bold block text-gray-900">{selected.type === 'CURFEW' ? 'Violation Recorded' : 'Case Filed'}</span>
                        <span className="text-gray-600 text-[10px]">{formatDate(selected.date)}</span>
                    </div>
                    {sortedSummons.map((summon, idx) => (
                        <div key={idx} className="mb-3 relative">
                            <div className="absolute -left-[22px] top-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                            <span className="font-bold block text-gray-900">{summon.summonType === '1' ? '1st' : summon.summonType === '2' ? '2nd' : '3rd'} Summon Issued</span>
                            <span className="text-gray-600 text-[10px]">{formatDate(summon.summonDate)} at {summon.summonTime}</span>
                        </div>
                    ))}
                    <div className="relative">
                        <div className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white ${isEscalated ? 'bg-red-600' : 'bg-green-600'}`}></div>
                        <span className="font-bold block text-gray-900">{isEscalated ? 'Case Escalated' : 'Case Settled'}</span>
                        <span className="text-gray-600 text-[10px]">{formatDate(selected.updatedAt || selected.date)}</span>
                    </div>
                </div>

                {/* Resolution Text */}
                <h4 className="font-bold text-sm mb-2 uppercase tracking-wide border-b-2 border-black pb-1 mt-4 break-inside-avoid">{selected.type !== 'CURFEW' ? 'V.' : 'IV.'} Resolution</h4>
                <div className="border-2 border-black p-4 text-[11px] text-justify leading-relaxed mb-6 bg-white font-medium break-inside-avoid">
                    {isEscalated 
                      ? "This is to certify that the above-mentioned case has NOT been successfully mediated and settled through the Katarungang Pambarangay proceedings. The case is hereby ESCALATED and recorded in the Barangay Archives for further legal action and reference."
                      : "This is to certify that the above-mentioned case has been successfully mediated and settled through the Katarungang Pambarangay proceedings in accordance with the provisions of the Local Government Code of 1991. Both parties have agreed to the terms of settlement and have committed to abide by the resolution reached during the mediation process."
                    }
                </div>
            </div>

            {/* Footer with Signatures */}
            <div className="mt-6 pt-4 w-full break-inside-avoid relative flex flex-col items-center border-t border-gray-300">
                <div className="grid grid-cols-2 gap-12 text-center text-xs mb-8 w-full mt-2">
                    <div>
                        <div className="border-b border-black font-bold pb-1 h-5 uppercase">{selected.complainantName || ''}</div>
                        <div className="text-[10px] italic mt-1 text-gray-600">Complainant's Signature</div>
                    </div>
                    <div>
                        <div className="border-b border-black font-bold pb-1 h-5 uppercase">{selected.resident || selected.fullData?.respondentName || ''}</div>
                        <div className="text-[10px] italic mt-1 text-gray-600">Respondent's Signature</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 text-center text-xs mb-8 w-full">
                    <div>
                        <div className="border-b border-black font-bold pb-1 h-5 uppercase">{selected.fullData?.selectedRole || 'Lupon Tagapamayapa'}</div>
                        <div className="text-[10px] italic mt-1 text-gray-600">Barangay Official</div>
                    </div>
                    <div>
                        <div className="border-b border-black font-bold pb-1 h-5"></div>
                        <div className="text-[10px] italic mt-1 text-gray-600">Punong Barangay</div>
                    </div>
                </div>

                <div className="w-full flex justify-end mb-4">
                    <div className="text-center w-48">
                        <div className="border-b border-black mb-1"></div>
                        <p className="font-bold text-[10px]">Clerk of Court</p>
                    </div>
                </div>

                <div className="text-[9px] text-gray-500 w-full mb-2 text-center">
                    <p className="font-bold uppercase tracking-wide">Document Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="font-bold uppercase tracking-wide mt-0.5">BARANGAY 166, CALOOCAN CITY | OFFICIAL BARANGAY RECORDS</p>
                </div>
                
                <div className="flex items-end justify-center relative h-12 w-full">
                    <img src="/icon-analytics/analytics footerprint.png" alt="Bagong Pilipinas" className="h-10 object-contain z-10" />
                </div>

                {/* ACTION BUTTONS */}
                <div className="absolute right-0 bottom-0 flex gap-2 print:hidden z-20">
                    <button onClick={() => setIsPrintModalOpen(false)} className="px-5 py-1.5 text-[11px] rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm font-bold transition-all">
                        Cancel
                    </button>
                    <button onClick={executeBrowserPrint} className="px-6 py-1.5 text-[11px] rounded-xl tracking-wide shadow-sm bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all">
                        PRINT
                    </button>
                </div>
            </div>
        </div>

        {/* 🔥 CSS THAT UNLOCKS THE HEIGHT LIMIT DURING ACTUAL PRINTING 🔥 */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-content, #printable-content * { visibility: visible; }
            #printable-content {
              display: flex !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white;
              box-shadow: none !important;
              border: none !important;
            }
            @page { size: portrait; margin: 10mm; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={() => { setIsYearSortOpen(false); setIsMonthSortOpen(false); setIsDaySortOpen(false); setIsTypeSortOpen(false); }}>
      
      {renderPrintModal()}

      <div className="flex-1 flex flex-col h-full min-h-0 w-full print:hidden">
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-[#0044CC] px-6 py-4 text-white shadow-md shrink-0 rounded-t-xl flex items-center gap-3">
              <button onClick={handleBackToTable} className="hover:bg-blue-600 p-1.5 rounded-full transition-colors flex items-center justify-center -ml-2"><ChevronLeft size={26} strokeWidth={2.5} /></button>
              <h1 className="text-xl font-bold">{t('archived_case_details') || 'Archived Case Details'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <Folder size={32} className="text-blue-600" strokeWidth={2.5} />
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900">{selected.caseNo}</h2>
                    <p className="text-sm text-blue-700 font-medium">Case Folder - All Documents & Records</p>
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
                  <h3 className="text-lg font-bold text-[#0044CC]">{t('case_summary')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p><p className="text-sm font-bold text-gray-800">{selected.caseNo}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('resident_name')}</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('complainant')}</p><p className="text-sm font-bold text-gray-800">{selected.complainantName || 'N/A'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_filed')}</p><p className="text-sm font-bold text-gray-800">{formatDate(selected.date)}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('incident_date')}</p><p className="text-sm font-bold text-gray-800">{formatDate(selected.fullData?.incidentDate || selected.date)}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('location')}</p><p className="text-sm font-bold text-gray-800">{selected.fullData?.incidentLocation || 'Barangay 166, Caloocan City'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p><p className="text-sm font-bold text-gray-800">{selected.fullData?.selectedRole || 'Lupon Tagapamayapa'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                      {String(selected.status || '').toUpperCase() === 'ESCALATED' 
                        ? <p className="text-sm font-bold text-red-600">ESCALATED & ARCHIVED</p>
                        : <p className="text-sm font-bold text-green-600">SETTLED & ARCHIVED</p>
                      }
                    </div>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium">
                    {selected.fullData?.incidentDesc || 'Case has been resolved and archived.'}
                  </div>
                </div>
              </div>

              {selected.type !== 'CURFEW' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Gavel size={20} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-[#0044CC]">Summons Records ({selectedSummons.length})</h3>
                  </div>
                  {selectedSummons.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSummons.sort((a, b) => parseInt(a.summonType) - parseInt(b.summonType)).map((summon, idx) => (
                        <div key={idx} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900">{summon.summonType === '1' ? '1st Summon' : summon.summonType === '2' ? '2nd Summon' : '3rd Summon'}</h4>
                              <p className="text-xs text-gray-600 font-semibold">Resident: {summon.residentName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              summon.status === 'Active' ? 'bg-green-100 text-green-700' : 
                              summon.status === 'Settled' ? 'bg-blue-100 text-blue-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>{summon.status}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="font-bold text-gray-600">Date:</span> <span className="text-gray-800">{formatDate(summon.summonDate)}</span></div>
                            <div><span className="font-bold text-gray-600">Time:</span> <span className="text-gray-800">{summon.summonTime}</span></div>
                            <div className="col-span-2"><span className="font-bold text-gray-600">Noted By:</span> <span className="text-gray-800">{summon.notedBy}</span></div>
                          </div>
                          {summon.summonReason && (
                            <div className="mt-3 pt-3 border-t border-orange-200">
                              <p className="text-[10px] font-bold text-gray-600 mb-1">SUMMON REASON:</p>
                              <div className="text-xs text-gray-700 bg-white p-2 rounded [&_b]:font-bold [&_i]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: decodeHTML(summon.summonReason) }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic py-4">No summons were issued for this case.</p>
                  )}
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0044CC]">Case Timeline</h3>
                </div>
                <div className="space-y-4 relative pl-6 border-l-2 border-blue-200">
                  <div className="relative">
                    <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                    <div className="text-xs">
                      <p className="font-bold text-gray-900">{selected.type === 'CURFEW' ? 'Violation Recorded' : 'Case Filed'}</p>
                      <p className="text-gray-600">{formatDate(selected.date)}</p>
                    </div>
                  </div>
                  {selectedSummons.sort((a, b) => parseInt(a.summonType) - parseInt(b.summonType)).map((summon, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">{summon.summonType === '1' ? '1st' : summon.summonType === '2' ? '2nd' : '3rd'} Summon Issued</p>
                        <p className="text-gray-600">{formatDate(summon.summonDate)} at {summon.summonTime}</p>
                      </div>
                    </div>
                  ))}
                  <div className="relative">
                    <div className={`absolute -left-[27px] w-4 h-4 rounded-full border-2 border-white ${String(selected.status || '').toUpperCase() === 'ESCALATED' ? 'bg-red-600' : 'bg-green-600'}`}></div>
                    <div className="text-xs">
                      <p className="font-bold text-gray-900">{String(selected.status || '').toUpperCase() === 'ESCALATED' ? 'Case Escalated' : 'Case Settled'}</p>
                      <p className="text-gray-600">{new Date(selected.updatedAt || selected.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Download size={20} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0044CC]">Export Case Folder</h3>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDownloadPDFClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <Download size={18} />
                    Download as PDF
                  </button>
                  <button onClick={handleOpenPrintModal} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
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
                  {/* Year Filter */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsYearSortOpen(!isYearSortOpen); setIsMonthSortOpen(false); setIsDaySortOpen(false); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{sortYear}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" />
                    </button>
                    {isYearSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {yearOptions.map(y => (<div key={y} onClick={() => { setSortYear(y); setIsYearSortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">{y}</div>))}
                    </div>)}
                  </div>
                  
                  {/* Month Filter */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsMonthSortOpen(!isMonthSortOpen); setIsYearSortOpen(false); setIsDaySortOpen(false); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{sortMonth}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" />
                    </button>
                    {isMonthSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                      {monthOptions.map(m => (<div key={m.label} onClick={() => { setSortMonth(m.label); setIsMonthSortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">{m.label}</div>))}
                    </div>)}
                  </div>

                  {/* 🔥 NEW DAY FILTER 🔥 */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsDaySortOpen(!isDaySortOpen); setIsMonthSortOpen(false); setIsYearSortOpen(false); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{filterDay}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" />
                    </button>
                    {isDaySortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 custom-scrollbar">
                      {dayOptions.map(d => (<div key={d} onClick={() => { setFilterDay(d); setIsDaySortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">{d}</div>))}
                    </div>)}
                  </div>
                  
                  {/* Type Filter */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsTypeSortOpen(!isTypeSortOpen); setIsYearSortOpen(false); setIsMonthSortOpen(false); setIsDaySortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
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

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6 md:px-8 w-full z-10 relative">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="border-b-2 border-blue-100 text-blue-900">
                    <th className="px-4 py-4 text-left font-bold uppercase w-[12%]">{t('report_type')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[18%]">{t('case_number')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[30%]">{t('resident_name')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[40%]">{t('action')}</th>
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
                          <span className={`font-bold ${isEscalated ? 'text-red-700' : 'text-gray-700'}`}>{row.caseNo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-600">{row.resident || row.complainantName}</td>
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
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-bold">
                        {t('no_settled_cases') || 'No archived folders found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}