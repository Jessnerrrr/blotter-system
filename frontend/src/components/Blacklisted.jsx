import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Calendar, Filter, ChevronDown, Search, ChevronRight, Gavel, Plus, Folder, X, Edit, Bold, Italic, Underline } from 'lucide-react';
import { useLanguage } from './LanguageContext'; 
import { blacklistAPI, casesAPI, summonsAPI } from "../services/api"; 
import { BlacklistedButton } from './buttons/Buttons';

// Helper function to ensure HTML renders properly
const ensureHtml = (text) => {
  if (!text || typeof text !== 'string') return '<p></p>';
  let decoded = text;
  for(let i = 0; i < 3; i++) {
    const txt = document.createElement("textarea");
    txt.innerHTML = decoded;
    decoded = txt.value;
  }
  if (decoded.trim().startsWith('<')) return decoded;
  return '<p>' + decoded.replace(/\n/g, '</p><p>') + '</p>';
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'LUPON': return 'bg-green-600 text-white';
    case 'VAWC': return 'bg-purple-600 text-white';
    case 'BLOTTER': return 'bg-red-600 text-white';
    case 'COMPLAIN': return 'bg-blue-600 text-white';
    case 'CURFEW': return 'bg-gray-800 text-white';
    default: return 'bg-gray-600 text-white';
  }
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

const LOCAL_STORAGE_NOTES_KEY = 'blacklisted_additional_notes';

const loadSavedNotes = () => {
  if (typeof window === 'undefined') return [];
  try {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
    return Array.isArray(parsedNotes) ? parsedNotes : [];
  } catch (error) {
    console.error('Failed to load saved notes:', error);
    return [];
  }
};

const saveNotesToLocalStorage = (notes) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
};

export default function Blacklisted() {
  const { t } = useLanguage(); 
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedSummons, setSelectedSummons] = useState([]); 
  const [search, setSearch] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(() => loadSavedNotes());
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Editor states for notes modal
  const addNotesEditorRef = useRef(null);
  const [addNotesHtml, setAddNotesHtml] = useState('');
  const [addNotesFormat, setAddNotesFormat] = useState({ bold: false, italic: false, underline: false });

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
  ];

  // Save notes to localStorage whenever they change
  useEffect(() => {
    saveNotesToLocalStorage(additionalNotes);
  }, [additionalNotes]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedCases, manualBlacklists] = await Promise.all([
          casesAPI.getAll(),
          blacklistAPI.getAll()
        ]);
        
        const blacklistedCases = storedCases.filter(c => c.status === 'BLACKLISTED');
        const combined = [...blacklistedCases, ...manualBlacklists].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRows(combined);
      } catch (error) {
        console.error('Error loading blacklist data:', error);
        Swal.fire({ title: 'Error', text: 'Failed to load blacklist data.', icon: 'error', confirmButtonColor: '#d33' });
      }
    };

    loadData();
    
    const refreshInterval = setInterval(loadData, 10000);
    const handleCaseUpdate = () => loadData();
    window.addEventListener('caseDataUpdated', handleCaseUpdate);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('caseDataUpdated', handleCaseUpdate);
    };
  }, []);

  // Sync content for notes editor
  const syncAddNotesContent = useCallback(() => { 
    if (addNotesEditorRef.current) setAddNotesHtml(addNotesEditorRef.current.innerHTML); 
  }, []);
  
  const updateAddNotesFormatState = useCallback(() => { 
    try { 
      setAddNotesFormat({ 
        bold: document.queryCommandState('bold'), 
        italic: document.queryCommandState('italic'), 
        underline: document.queryCommandState('underline') 
      }); 
    } catch {} 
  }, []);

  const applyAddNotesFormat = (type) => {
    const editor = addNotesEditorRef.current;
    if (!editor) return;
    editor.focus();
    if (type === 'bold') document.execCommand('bold', false, null);
    else if (type === 'italic') document.execCommand('italic', false, null);
    else if (type === 'underline') document.execCommand('underline', false, null);
    syncAddNotesContent();
    setTimeout(updateAddNotesFormatState, 0);
  };
  useEffect(() => {
  if (showAddNotesModal && addNotesEditorRef.current) {
    if (editingNote) {
      addNotesEditorRef.current.innerHTML = editingNote.content;
    } else {
      addNotesEditorRef.current.innerHTML = '';
    }
  }
}, [showAddNotesModal, editingNote]);

  const filteredRows = rows.filter((row) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
        (row.caseNo && row.caseNo.toLowerCase().includes(searchLower)) ||
        (row.resident && row.resident.toLowerCase().includes(searchLower)) ||
        (row.complainantName && row.complainantName.toLowerCase().includes(searchLower));

    let rowYear = '';
    let rowMonth = '';
    let rowDay = '';

    if (row.date) {
        const itemDateParts = row.date.split('-');
        if (itemDateParts.length === 3) {
            if (itemDateParts[2].length === 4) {
                rowYear = itemDateParts[2];
                rowMonth = itemDateParts[0].padStart(2, '0');
                rowDay = itemDateParts[1].padStart(2, '0');
            } else {
                rowYear = itemDateParts[0];
                rowMonth = itemDateParts[1].padStart(2, '0');
                rowDay = itemDateParts[2].padStart(2, '0');
            }
        } else {
            const d = new Date(row.date);
            if (!isNaN(d)) {
                rowYear = d.getFullYear().toString();
                rowMonth = String(d.getMonth() + 1).padStart(2, '0');
                rowDay = String(d.getDate()).padStart(2, '0');
            }
        }
    }

    const matchesYear = filterYear === 'All Years' || rowYear === filterYear;
    const matchesMonth = filterMonth === 'All Months' || rowMonth === filterMonth.padStart(2, '0');
    const matchesDay = filterDay === 'All Days' || rowDay === filterDay.padStart(2, '0');
    const matchesType = (sortType === allTypesText) || row.type === sortType;

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

  const handleBackToTable = () => { setSelected(null); setView('TABLE'); };

  const handleRestore = (row) => {
    Swal.fire({
      title: t('swal_restore_title') || 'Restore Record?',
      text: `Restore ${row.caseNo} back to active Case Logs?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: t('swal_yes_restore') || 'Yes, restore',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (row.type === 'CURFEW') {
            await blacklistAPI.delete(row._id);
          } else {
            await casesAPI.update(row._id, { ...row, status: 'PENDING' });
          }
          
          const [storedCases, manualBlacklists] = await Promise.all([
            casesAPI.getAll(),
            blacklistAPI.getAll()
          ]);
          const blacklistedCases = storedCases.filter(c => c.status === 'BLACKLISTED');
          const combined = [...blacklistedCases, ...manualBlacklists].sort((a, b) => new Date(b.date) - new Date(a.date));
          setRows(combined);
          
          window.dispatchEvent(new Event('caseDataUpdated'));
          
          if(view === 'DETAILS') setView('TABLE');
          Swal.fire('Restored!', 'The record has been restored to active logs.', 'success');
        } catch (error) {
          console.error('Error restoring record:', error);
          Swal.fire({ title: 'Error', text: 'Failed to restore record.', icon: 'error', confirmButtonColor: '#d33' });
        }
      }
    });
  };

  const handleArchive = (row) => {
    Swal.fire({
      title: 'Move to Archives?',
      text: `Are you sure you want to archive ${row.caseNo}? It will be marked as Settled.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b', 
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (row.type === 'CURFEW') {
              await blacklistAPI.delete(row._id);
          } else {
              await casesAPI.update(row._id, { ...row, status: 'SETTLED' });
              
              const allSummons = await summonsAPI.getAll();
              const summonsToArchive = allSummons.filter(s => s.caseNo === row.caseNo);
              await Promise.all(summonsToArchive.map(s => summonsAPI.update(s._id, { ...s, status: 'Settled' })));
          }

          const [storedCases, manualBlacklists] = await Promise.all([
            casesAPI.getAll(),
            blacklistAPI.getAll()
          ]);
          const blacklistedCases = storedCases.filter(c => c.status === 'BLACKLISTED');
          const combined = [...blacklistedCases, ...manualBlacklists].sort((a, b) => new Date(b.date) - new Date(a.date));
          setRows(combined);

          window.dispatchEvent(new Event('caseDataUpdated'));

          if(view === 'DETAILS') setView('TABLE');
          Swal.fire('Archived!', 'The record has been safely moved to Archives.', 'success');
        } catch (error) {
          console.error('Error archiving record:', error);
          Swal.fire({ title: 'Error', text: 'Failed to archive record.', icon: 'error', confirmButtonColor: '#d33' });
        }
      }
    });
  };

  // Open Add Notes Modal
  const openAddNotesModal = () => {
    setEditingNote(null);
    setAddNotesHtml('');
    setShowAddNotesModal(true);
  };

  // Open Edit Notes Modal
  const openEditNotesModal = (note) => {
    setEditingNote(note);
    setAddNotesHtml(note.content);
    setShowAddNotesModal(true);
  };

  // Handle Save/Update Additional Notes
  const handleAddNotesSubmit = () => {
    if (!addNotesHtml || addNotesHtml.trim() === '') { 
      Swal.fire({ title: 'Incomplete Fields', text: 'Please add some notes before saving.', icon: 'error', confirmButtonColor: '#d33' }); 
      return; 
    }
    
    Swal.fire({ 
      title: editingNote ? 'Update Additional Notes?' : 'Save Additional Notes?', 
      icon: 'question',
      showCancelButton: true, 
      confirmButtonColor: '#2563eb', 
      cancelButtonColor: '#d33', 
      confirmButtonText: editingNote ? 'Update' : 'Save', 
      cancelButtonText: 'Cancel' 
    }).then((result) => {
      if (result.isConfirmed) {
        if (editingNote) {
          // Update existing note
          const updatedNotes = additionalNotes.map(note => 
            note.id === editingNote.id 
              ? { 
                  ...note, 
                  content: addNotesHtml,
                  lastEdited: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                  lastEditedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                }
              : note
          );
          setAdditionalNotes(updatedNotes);
          Swal.fire('Updated!', 'The note has been updated.', 'success');
        } else {
          // Create new note
          const newNote = {
            id: Date.now().toString(),
            caseNo: selected.caseNo,
            content: addNotesHtml,
            date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
          setAdditionalNotes([...additionalNotes, newNote]);
          Swal.fire('Success!', 'Additional notes have been added.', 'success');
        }
        setShowAddNotesModal(false);
        setAddNotesHtml('');
        setEditingNote(null);
      }
    });
  };

  const handleCloseAddNotesModal = () => {
    if (addNotesHtml && addNotesHtml.trim() !== '') {
      Swal.fire({ 
        title: 'Discard Changes?', 
        text: 'Your notes will not be saved.', 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6', 
        confirmButtonText: 'Discard', 
        cancelButtonText: 'Cancel' 
      }).then((result) => {
        if (result.isConfirmed) { 
          setAddNotesHtml(''); 
          setShowAddNotesModal(false); 
          setEditingNote(null);
        }
      });
    } else { 
      setShowAddNotesModal(false); 
      setEditingNote(null);
    }
  };

  const handleDeleteNote = (noteId) => {
    Swal.fire({ 
      title: 'Delete Note?', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6', 
      confirmButtonText: 'Delete', 
      cancelButtonText: 'Cancel' 
    }).then((result) => {
      if (result.isConfirmed) {
        setAdditionalNotes(additionalNotes.filter(n => n.id !== noteId));
        Swal.fire('Deleted!', 'The note has been removed.', 'success');
      }
    });
  };

  const getNotesForCurrentCase = () => {
    return additionalNotes.filter(note => note.caseNo === selected?.caseNo);
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

  const truncateReason = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={() => { setIsDateFilterOpen(false); setIsTypeSortOpen(false); }}>
      
      <style>{`
  .rich-text-content b, .rich-text-content strong { font-weight: 900 !important; }
  .rich-text-content i, .rich-text-content em { font-style: italic !important; }
  .rich-text-content u { text-decoration: underline !important; }
  .rich-text-content { 
    word-wrap: break-word !important;
    word-break: break-word !important;
    white-space: normal !important;
    overflow-wrap: break-word !important;
  }
`}</style>

      <div className="flex-1 flex flex-col h-full min-h-0 w-full max-w-[1600px] mx-auto">
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-[#0044CC] px-6 py-4 text-white shadow-md shrink-0 rounded-t-xl flex items-center gap-3">
              <button onClick={handleBackToTable} className="hover:bg-blue-600 p-1.5 rounded-full transition-colors flex items-center justify-center -ml-2"><ChevronLeft size={26} strokeWidth={2.5} /></button>
              <h1 className="text-xl font-bold uppercase">{t('blacklisted_case_details') || 'Blacklisted Case Details'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC] uppercase">{t('case_summary')}</h3></div>
                <div className="flex gap-2 mb-6">
                    <span className={`${getTypeStyle(selected.type)} text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide`}>{selected.type}</span>
                    <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">{t('blacklisted')}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.caseNo}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('resident_name')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_filed')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.fullData?.selectedRole || 'Admin'}</p></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC] uppercase">{t('case_details_title')}</h3></div>
                <div className="grid grid-cols-2 gap-y-6 mb-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('complainant')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.complainantName || 'N/A'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('respondents')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('incident_date')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.fullData?.incidentDate || selected.date}</p></div>
                    {selected.blacklistedAt && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Blacklisted Date & Time</p>
                        <p className="text-sm font-bold text-gray uppercase">{formatBlacklistedDateTime(selected.blacklistedAt)}</p>
                      </div>
                    )}
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('location')}</p><p className="text-sm font-bold text-gray-800 uppercase">{selected.fullData?.incidentLocation || '166, Caloocan City'}</p></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium uppercase">
                    {selected.fullData?.incidentDesc || t('default_reason_desc') || 'Resident was permanently blacklisted.'}
                  </div>
                </div>
              </div>
              
              {selected && selected.type !== 'CURFEW' && (
                <>
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
                                <h4 className="font-bold text-gray-900 uppercase">
                                  {summon.summonType === '1' ? '1st Summon' : summon.summonType === '2' ? '2nd Summon' : '3rd Summon'}
                                </h4>
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
                                <div className="text-xs text-gray-700 bg-white p-2 rounded uppercase" dangerouslySetInnerHTML={{ __html: decodeHTML(summon.summonReason) }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic py-4 uppercase">NO SUMMONS WERE ISSUED FOR THIS CASE.</p>
                    )}
                  </div>
                    {/* Button at bottom right of Summons section */}
                    <div className="flex justify-end mt-6">
                      <button 
                        onClick={openAddNotesModal}
                        className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 uppercase"
                      >
                        <Plus size={18} />
                        <span>Add Additional Notes</span>
                      </button>
                    </div>

                  {/* Additional Notes Section - ONLY appears if notes exist */}
                  {getNotesForCurrentCase().length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Folder size={20} className="text-blue-600" />
                        <h3 className="text-lg font-bold text-[#0044CC] uppercase">
                          Additional Notes ({getNotesForCurrentCase().length})
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {getNotesForCurrentCase().map((note) => (
                          <div key={note.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-xs font-bold text-gray-500 uppercase">
                                Added on {note.date} at {note.time}
                                {note.lastEdited && (
                                  <span className="ml-2 text-gray-400">
                                    (Edited on {note.lastEdited} at {note.lastEditedTime})
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => openEditNotesModal(note)}
                                  className="text-blue-500 hover:text-blue-700 transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                            <div 
                              className="rich-text-content text-sm text-gray-700 uppercase"
                              dangerouslySetInnerHTML={{ __html: ensureHtml(note.content) }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-5 text-white shadow-md shrink-0">
              <h1 className="text-2xl font-bold uppercase">{t('blacklisted_case_records') || 'BLACKLISTED CASES'}</h1>
              <p className="text-sm text-white/80">{t('blacklisted_subtitle') || 'View residents permanently blacklisted from the community.'}</p>
            </div>

            <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 shrink-0 relative z-20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('total_blacklisted') || 'Total Blacklisted'}: {filteredRows.length}</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  
                  <div className="relative w-full sm:w-auto" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => { setIsDateFilterOpen(!isDateFilterOpen); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-blue-500" /><span>{displayDate}</span></div>
                      <ChevronDown size={16} className={`ml-3 text-gray-400 transition-transform ${isDateFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDateFilterOpen && (
                      <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-[340px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-5">
                          <button onClick={() => setCalendarViewDate(new Date(calYear, calMonth - 1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-gray-500 hover:text-blue-600 transition-colors">
                            <ChevronLeft size={18} strokeWidth={2.5} />
                          </button>
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <select value={calMonth} onChange={(e) => { const newMonth = parseInt(e.target.value); setCalendarViewDate(new Date(calYear, newMonth, 1)); }} className="appearance-none bg-white border border-gray-200 hover:border-blue-400 text-gray-800 font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm">
                                {monthNames.map((m, i) => (<option key={m} value={i} disabled={calYear === currentYear && i > currentMonth}>{m}</option>))}
                              </select>
                              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="relative group">
                              <select value={calYear} onChange={(e) => { const newYear = parseInt(e.target.value); let newMonth = calMonth; if (newYear === currentYear && newMonth > currentMonth) { newMonth = currentMonth; } setCalendarViewDate(new Date(newYear, newMonth, 1)); }} className="appearance-none bg-white border border-gray-200 hover:border-blue-400 text-gray-800 font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm">
                                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(y => (<option key={y} value={y}>{y}</option>))}
                              </select>
                              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                          <button onClick={() => setCalendarViewDate(new Date(calYear, calMonth + 1, 1))} disabled={calYear === currentYear && calMonth === currentMonth} className={`p-2 rounded-xl transition-colors ${calYear === currentYear && calMonth === currentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-slate-100 hover:text-blue-600'}`}>
                            <ChevronRight size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 mb-3 gap-1">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (<div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = filterYear === String(calYear) && filterMonth === String(calMonth + 1).padStart(2, '0') && filterDay === String(day).padStart(2, '0');
                            const isToday = currentYear === calYear && currentMonth === calMonth && currentDate === day;
                            const isFuture = calYear === currentYear && calMonth === currentMonth && day > currentDate;
                            return (<button key={day} disabled={isFuture} onClick={() => handleDateSelect(day)} className={`h-10 w-full rounded-xl text-sm font-bold transition-all duration-200 ${isFuture ? 'opacity-30 cursor-not-allowed text-gray-400' : isSelected ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200 scale-105' : isToday ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'}`}>{day}</button>);
                          })}
                        </div>
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <button onClick={clearDateFilter} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50">Clear</button>
                          <button onClick={() => { setFilterYear(String(calYear)); setFilterMonth(String(calMonth + 1).padStart(2, '0')); setFilterDay('All Days'); setIsDateFilterOpen(false); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50">{t('whole_month') || 'Whole Month'}</button>
                          <button onClick={() => { setCalendarViewDate(realToday); handleDateSelect(realToday.getDate(), realToday.getMonth(), realToday.getFullYear()); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-md hover:bg-blue-50">Today</button>
                        </div>
                      </div>
                    )}
                  </div>
                  
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
                  
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input type="text" placeholder={t('search_placeholder') || 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8 md:px-8">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="border-b-2 border-blue-100 text-blue-900">
                    <th className="px-4 py-4 text-left font-bold uppercase w-[12%]">{t('report_type')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[15%]">{t('case_number')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">{t('resident_name')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">{t('Reason')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id || row.caseNo} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-5"><span className={`inline-block rounded px-3 py-1 text-[10px] font-bold shadow-sm uppercase tracking-wide ${getTypeStyle(row.type)}`}>{row.type}</span></td>
                      <td className="px-4 py-5 font-bold text-gray-700 uppercase">{row.caseNo}</td>
                      <td className="px-4 py-5 font-medium text-gray-600 uppercase">{row.complainantName || row.resident}</td>
                      <td className="px-4 py-5">
                        <div className="max-w-xs break-words">
                          <span className="text-gray-600 uppercase text-sm" title={row.reason || row.fullData?.incidentDesc || 'N/A'}>
                            {truncateReason(row.reason || row.fullData?.incidentDesc, 5)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex gap-2">
                          <BlacklistedButton actionType="restore" onClick={() => handleRestore(row)}>{t('restore')}</BlacklistedButton>
                          <BlacklistedButton actionType="view" onClick={() => handleViewDetails(row)}>{t('view')}</BlacklistedButton>
                          <button onClick={() => handleArchive(row)} className="px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all shadow-sm border border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100 uppercase tracking-wide">
                            {t('archive') || 'Archive'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-bold uppercase">{t('no_blacklisted_found') || 'No blacklisted records found.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Add/Edit Additional Notes Modal */}
      {showAddNotesModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCloseAddNotesModal}>
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#2563eb] px-8 py-6 shrink-0">
              <h2 className="text-2xl font-bold text-white tracking-wide uppercase">
                {editingNote ? 'Edit Additional Notes' : 'Additional Notes'}
              </h2>
              <p className="text-sm font-medium text-white/90 mt-1 uppercase">
                {editingNote ? 'Edit supplementary information for this case' : 'Add supplementary information for this case'}
              </p>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto flex flex-col bg-white">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500 uppercase">Case No.:</span>
                  <span className="text-sm font-bold text-blue-600 uppercase">{selected?.caseNo}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 uppercase">Date:</span>
                  <div className="border border-gray-200 bg-gray-50 rounded-md py-1.5 px-4 text-gray-700 font-bold select-none text-sm uppercase min-w-[120px] text-center">
                    {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-[300px]">
                <h3 className="text-sm font-bold text-blue-600 uppercase mb-2">Notes Content</h3>
                <div className="flex-1 flex flex-col border border-blue-500 ring-1 ring-blue-500 rounded-lg overflow-hidden transition-colors">
                  <div
                    ref={addNotesEditorRef}
                    contentEditable
                    onInput={syncAddNotesContent}
                    onKeyUp={updateAddNotesFormatState}
                    onMouseUp={updateAddNotesFormatState}
                    data-placeholder="Type your additional notes here..."
                    className="rich-text-content flex-1 w-full p-4 text-sm outline-none uppercase text-gray-700 bg-white overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                  />
                  <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2 text-gray-500 shrink-0">
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); }} onClick={() => applyAddNotesFormat('bold')} className={`rounded p-1 hover:bg-gray-100 hover:text-gray-800 transition-colors ${addNotesFormat.bold ? 'bg-gray-200 text-blue-600' : ''}`}><Bold size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); }} onClick={() => applyAddNotesFormat('italic')} className={`rounded p-1 hover:bg-gray-100 hover:text-gray-800 transition-colors ${addNotesFormat.italic ? 'bg-gray-200 text-blue-600' : ''}`}><Italic size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); }} onClick={() => applyAddNotesFormat('underline')} className={`rounded p-1 hover:bg-gray-100 hover:text-gray-800 transition-colors ${addNotesFormat.underline ? 'bg-gray-200 text-blue-600' : ''}`}><Underline size={16} /></button>
                    <div className="w-px h-5 bg-gray-300 mx-2"></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 shrink-0">
                <button onClick={handleCloseAddNotesModal} className="rounded-lg px-8 py-2.5 text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors uppercase">Cancel</button>
                <button onClick={handleAddNotesSubmit} className="rounded-lg px-10 py-2.5 text-sm font-bold bg-[#2563eb] text-white hover:bg-blue-700 transition-colors shadow-sm uppercase">
                  {editingNote ? 'Update Notes' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}