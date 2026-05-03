import React, { useState, useEffect, useRef } from 'react';
import { Folder, List, MoreVertical, ChevronLeft, Plus, ClipboardList, Edit, Calendar, Save, Eye, ChevronDown, Bold, Italic, Underline, Search, Filter, Trash2, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext'; 

// --- CLEAN SINGLE-FILE IMPORT! ---
import { SummonsButton, SummonsAddNoteButton } from './buttons/Buttons';
import { summonsAPI, casesAPI } from "../services/api";

const gradientBgClass = "bg-gradient-to-r from-[#0044CC] to-[#0099FF]";

// --- GLOBAL CATEGORY COLORS ---
const getTypeStyle = (type) => {
  switch (type) {
    case 'LUPON': return 'bg-green-600 text-white';
    case 'VAWC': return 'bg-purple-600 text-white';
    case 'BLOTTER': return 'bg-red-600 text-white';
    case 'COMPLAIN': return 'bg-blue-600 text-white';
    case 'ESCALATED': return 'bg-red-500 text-white border-red-600'; // Added Escalated color style
    default: return 'bg-blue-600 text-white';
  }
};

export default function Summons() {
  const { t } = useLanguage(); 
  const [summonsList, setSummonsList] = useState([]);
  const [view, setView] = useState('LIST'); 
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSummon, setSelectedSummon] = useState(null);
  
  const [caseNotes, setCaseNotes] = useState([]); 
  const [selectedNote, setSelectedNote] = useState(null); 
  
  const [activeActionDropdown, setActiveActionDropdown] = useState(null);
  const [noteDropdownOpen, setNoteDropdownOpen] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, caseNo: null });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, data: null });
  const [previewEditing, setPreviewEditing] = useState(false); 
  const [tempStatus, setTempStatus] = useState(''); 

  const [editDate, setEditDate] = useState('');
  const editorRef = useRef(null);
  const [savedSummaryHtml, setSavedSummaryHtml] = useState('');
  
  // 🔥 FORMATTING INDICATORS STATE 🔥
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // FILTER STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All Years');
  const [filterMonth, setFilterMonth] = useState('All Months');
  const [filterDay, setFilterDay] = useState('All Days');
  
  // Custom Calendar Dropdown States
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const realToday = new Date();
  const currentYear = realToday.getFullYear();
  const currentMonth = realToday.getMonth();
  const currentDate = realToday.getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rawData, allCases] = await Promise.all([
          summonsAPI.getAll(),
          casesAPI.getAll()
        ]);

        // --- WORKFLOW RULE: Hide summons if parent case is Settled, Blacklisted, or Escalated ---
        const validSummons = rawData.filter(summon => 
            allCases.some(c => c.caseNo === summon.caseNo && 
              c.status !== 'SETTLED' && c.status !== 'BLACKLISTED' && c.status !== 'ESCALATED')
        );

        const normalizedData = validSummons.map(item => {
            let status = item.status || 'Pending';
            // Normalize all active/pending variations to 'Pending' for consistent UI
            if (status === 'Active' || status.toUpperCase() === 'PENDING') status = 'Pending';
            
            const matchedCase = allCases.find(c => c.caseNo === item.caseNo);
            const complainantName = matchedCase ? matchedCase.complainantName : (item.complainantName || item.residentName || 'N/A');
            const caseType = matchedCase ? matchedCase.type : 'LUPON'; // Grab type for colors
            const caseDate = matchedCase ? matchedCase.date : (item.date || '');

            return { ...item, status, complainantName, type: caseType, originalDate: caseDate };
        });
        
        setSummonsList(normalizedData);
      } catch (error) {
        console.error('Error loading summons data:', error);
        Swal.fire({ title: 'Error', text: 'Failed to load summons data.', icon: 'error', confirmButtonColor: '#d33' });
      }
    };

    loadData();
    
    // Refresh data every 10 seconds
    const refreshInterval = setInterval(loadData, 10000);
    
    // Listen for case updates from other components
    const handleCaseUpdate = () => {
      loadData();
    };
    window.addEventListener('caseDataUpdated', handleCaseUpdate);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('caseDataUpdated', handleCaseUpdate);
    };
  }, []);

  const uniqueCases = Object.values(summonsList.reduce((acc, current) => {
    if (!acc[current.caseNo]) {
      acc[current.caseNo] = current;
    }
    return acc;
  }, {}));

  // 🔥 FILTER LOGIC FOR SUMMONS TABLE 🔥
  const filteredData = uniqueCases.filter((item) => {
    // Uses summonDate (Date Assigned) first, falling back to originalDate if empty
    const dateToFilter = item.summonDate || item.originalDate || '';
    const itemDateParts = dateToFilter.split('-'); 
    let itemYear = '';
    let itemMonth = '';
    let itemDay = ''; 

    if (itemDateParts.length === 3) {
        if (itemDateParts[2].length === 4) { // MM-DD-YYYY
            itemYear = itemDateParts[2];
            itemMonth = itemDateParts[0].padStart(2, '0');
            itemDay = itemDateParts[1].padStart(2, '0');
        } else { // YYYY-MM-DD
            itemYear = itemDateParts[0];
            itemMonth = itemDateParts[1].padStart(2, '0');
            itemDay = itemDateParts[2].padStart(2, '0');
        }
    }

    const matchesYear = filterYear === 'All Years' || itemYear === filterYear;
    const matchesMonth = filterMonth === 'All Months' || itemMonth === filterMonth.padStart(2, '0');
    const matchesDay = filterDay === 'All Days' || itemDay === filterDay; 
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                          (item.caseNo && item.caseNo.toLowerCase().includes(searchLower)) ||
                          (item.complainantName && item.complainantName.toLowerCase().includes(searchLower)) ||
                          (item.residentName && item.residentName.toLowerCase().includes(searchLower));

    return matchesYear && matchesMonth && matchesDay && matchesSearch; 
  });

  const handleOpenFolder = (caseItem) => { setSelectedCase(caseItem); setView('FOLDER'); };
  
  const handleOpenSummonDetail = (summonItem) => { 
    setSelectedSummon(summonItem); 
    // Load existing notes from the summon data
    const existingNotes = summonItem.caseNotes || [];
    const noteIds = existingNotes.map(note => note.id).sort((a,b) => a - b);
    setCaseNotes(noteIds);
    setView('OVERVIEW'); 
  };
  
  const handleAddNote = () => { 
    const maxNote = caseNotes.length > 0 ? Math.max(...caseNotes) : 0; 
    setSelectedNote(maxNote + 1); 
    setEditDate(new Date().toISOString().split('T')[0]); 
    setSavedSummaryHtml('');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setView('NOTE_EDIT'); 
  };
  
  const handleOpenNoteDetail = (noteId) => { 
    setSelectedNote(noteId); 
    // Find the note content from the selected summon
    const note = selectedSummon?.caseNotes?.find(n => n.id === noteId);
    if (note) {
      setSavedSummaryHtml(note.content);
      setEditDate(note.date || new Date().toISOString().split('T')[0]);
    } else {
      setSavedSummaryHtml('This section provides an overview of the selected case.<br><br>It records the facts, responses of parties, and any next steps identified during mediation.');
      setEditDate(new Date().toISOString().split('T')[0]);
    }
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setView('NOTE_DETAIL'); 
  };
  
  const handleEditNote = () => { 
    setView('NOTE_EDIT'); 
    setTimeout(() => { 
      if (editorRef.current) {
        editorRef.current.innerHTML = savedSummaryHtml; 
        editorRef.current.focus();
        updateFormattingState();
      }
    }, 0); 
  };

  const handleSaveNote = async () => {
    const noteContent = editorRef.current ? editorRef.current.innerHTML : savedSummaryHtml;
    
    // Updated confirmation modal title
    Swal.fire({
      title: t('Add_Case_Notes?') || 'confirm_add_case_notes',
      text: t('Are you sure you want to save this case note?') || 'save_note_confirm',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0066FF',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes_save') || 'Yes, save it!',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Find the current summon
          const currentSummon = selectedSummon;
          
          // Prepare notes array (existing notes + new/updated note)
          const existingNotes = currentSummon.caseNotes || [];
          const noteIndex = existingNotes.findIndex(n => n.id === selectedNote);
          
          let updatedNotes;
          if (noteIndex >= 0) {
            // Update existing note
            updatedNotes = [...existingNotes];
            updatedNotes[noteIndex] = {
              ...updatedNotes[noteIndex],
              content: noteContent,
              date: editDate,
              updatedAt: new Date().toISOString()
            };
          } else {
            // Add new note
            updatedNotes = [...existingNotes, {
              id: selectedNote,
              content: noteContent,
              date: editDate,
              createdAt: new Date().toISOString()
            }];
          }
          
          // Save to database
          await summonsAPI.update(currentSummon._id, {
            ...currentSummon,
            caseNotes: updatedNotes
          });
          
          // Update local state
          setSavedSummaryHtml(noteContent);
          if (!caseNotes.includes(selectedNote)) {
            setCaseNotes(prev => [...prev, selectedNote].sort((a,b) => a - b));
          }
          
          // Update the selectedSummon with new notes
          setSelectedSummon({
            ...currentSummon,
            caseNotes: updatedNotes
          });
          
          Swal.fire({ 
            title: t('Saved!') || 'Save Successful', 
            text: t('Changes has been saved.') || 'Case notes saved to database.', 
            icon: 'success', 
            confirmButtonColor: '#0066FF' 
          });
          setView('OVERVIEW');
        } catch (error) {
          console.error('Error saving notes:', error);
          Swal.fire({ 
            title: 'Error', 
            text: 'Failed to save notes to database.', 
            icon: 'error', 
            confirmButtonColor: '#d33' 
          });
        }
      }
    });
  };

  const handleDeleteNote = (noteId, event) => {
    if (event) event.stopPropagation();
    
    Swal.fire({
      title: t('delete_note?') || 'Delete Note',
      text: t('Are you sure you want to delete this note? This action cannot be undone.') || 'delete_note_confirmation',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('yes_delete') || 'Yes, delete it!',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Find the current summon
          const currentSummon = selectedSummon;
          
          // Filter out the deleted note
          const updatedNotes = (currentSummon.caseNotes || []).filter(note => note.id !== noteId);
          
          // Save to database
          await summonsAPI.update(currentSummon._id, {
            ...currentSummon,
            caseNotes: updatedNotes
          });
          
          // Update local state
          const updatedNoteIds = caseNotes.filter(id => id !== noteId);
          setCaseNotes(updatedNoteIds);
          
          // Update the selectedSummon with new notes
          setSelectedSummon({
            ...currentSummon,
            caseNotes: updatedNotes
          });
          
          // If we're viewing the deleted note, go back to overview
          if (selectedNote === noteId) {
            setView('OVERVIEW');
          }
          
          Swal.fire(t('deleted') || 'Deleted!', t('note_deleted') || 'The note has been deleted.', 'success');
        } catch (error) {
          console.error('Error deleting note:', error);
          Swal.fire({ title: 'Error', text: 'Failed to delete note.', icon: 'error', confirmButtonColor: '#d33' });
        }
      }
    });
  };

  const handleCancelEdit = () => {
    Swal.fire({ title: t('Discard Changes?') || 'discard_changes', text: t('Any unsaved changes will be lost.') || "unsaved_lost", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('Discard') || 'Yes, discard', cancelButtonText: t('Keep') || 'No, keep editing' }).then((result) => { 
      if (result.isConfirmed) {
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setView('OVERVIEW');
      }
    });
  };

  const handleBackToList = () => { setSelectedCase(null); setView('LIST'); };
  const handleBackToFolder = () => { setSelectedSummon(null); setView('FOLDER'); };
  const handleCloseNote = () => { setView('OVERVIEW'); };
  const toggleActionDropdown = (caseNo) => { setActiveActionDropdown(activeActionDropdown === caseNo ? null : caseNo); };
  
  const handleActionSelect = (action, caseItem) => {
    // Allow action if status is Pending, Active, or any variation indicating not settled/blacklisted/escalated
    const statusLower = (caseItem.status || '').toLowerCase();
    if (statusLower !== 'pending' && statusLower !== 'active' && caseItem.status !== '') return; 
    setActiveActionDropdown(null); 
    setConfirmModal({ isOpen: true, action: action, caseNo: caseItem.caseNo }); 
  };

  const handleViewStatus = (caseItem) => {
    setActiveActionDropdown(null); setPreviewEditing(false); setTempStatus(caseItem.status || 'Pending'); setPreviewModal({ isOpen: true, data: caseItem });
  };

  const executeStatusUpdate = async () => {
    const { action, caseNo } = confirmModal;
    setConfirmModal({ isOpen: false, action: null, caseNo: null });

    try {
      // Update the case status (this is the main workflow)
      const allCases = await casesAPI.getAll();
      const caseToUpdate = allCases.find(c => c.caseNo === caseNo);
      if (caseToUpdate) {
        await casesAPI.update(caseToUpdate._id, { ...caseToUpdate, status: action.toUpperCase() });
      }

      // Only update summons status if action is 'Settled' (valid for Summons model)
      // For 'Blacklisted' and 'Escalated', we only update the Case, not the Summons
      if (action === 'Settled') {
        const summonsToUpdate = summonsList.filter(item => item.caseNo === caseNo);
        await Promise.all(summonsToUpdate.map(summon => 
          summonsAPI.update(summon._id, { ...summon, status: 'Settled' })
        ));
        
        // Update local state
        const updatedSummons = summonsList.map(item => item.caseNo === caseNo ? { ...item, status: 'Settled' } : item);
        setSummonsList(updatedSummons);
      } else {
        // For Blacklisted/Escalated, just remove from view (workflow rule will filter on next load)
        setSummonsList(summonsList.filter(item => item.caseNo !== caseNo));
      }

      // Notify other components about the update
      window.dispatchEvent(new Event('caseDataUpdated'));

      Swal.fire({ title: t('status_updated') || 'Status Updated!', text: `${t('case_no')} ${caseNo} ${t('marked_as')} ${action}.`, icon: 'success', confirmButtonColor: '#0066FF' });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({ title: 'Error', text: 'Failed to update status. ' + (error.response?.data?.message || error.message), icon: 'error', confirmButtonColor: '#d33' });
    }
  };

  const handlePreviewSaveClick = () => {
    Swal.fire({ title: t('Save Changes?') || 'confirm_status_update', text: t('are_you_sure_mark') + " " + previewModal.data.caseNo + " " + t('as') + " " + tempStatus + "?", icon: 'question', showCancelButton: true, confirmButtonColor: '#0066FF', cancelButtonColor: '#d33', confirmButtonText: t('Yes, update it!') || 'save_changes' }).then((result) => { if (result.isConfirmed) performSaveStatus(); });
  };

  const performSaveStatus = async () => {
    const newStatus = tempStatus;
    const caseNo = previewModal.data.caseNo;

    try {
      // Update the case status (this is the main workflow)
      const allCases = await casesAPI.getAll();
      const caseToUpdate = allCases.find(c => c.caseNo === caseNo);
      if (caseToUpdate) {
        await casesAPI.update(caseToUpdate._id, { ...caseToUpdate, status: newStatus.toUpperCase() });
      }

      // Only update summons status if newStatus is 'Settled' (valid for Summons model)
      // For 'Blacklisted' and 'Escalated', we only update the Case, not the Summons
      if (newStatus === 'Settled') {
        const summonsToUpdate = summonsList.filter(item => item.caseNo === caseNo);
        await Promise.all(summonsToUpdate.map(summon => 
          summonsAPI.update(summon._id, { ...summon, status: 'Settled' })
        ));
        
        // Update local state
        const updatedSummons = summonsList.map(item => item.caseNo === caseNo ? { ...item, status: 'Settled' } : item);
        setSummonsList(updatedSummons);
      } else {
        // For Blacklisted/Escalated, just remove from view (workflow rule will filter on next load)
        setSummonsList(summonsList.filter(item => item.caseNo !== caseNo));
      }

      // Notify other components about the update
      window.dispatchEvent(new Event('caseDataUpdated'));

      setPreviewModal({ isOpen: false, data: null }); setPreviewEditing(false);
      Swal.fire({ title: t('status_updated') || 'Updated!', text: `${t('case_no')} ${caseNo} ${t('marked_as')} ${newStatus}.`, icon: 'success', confirmButtonColor: '#0066FF' });
    } catch (error) {
      console.error('Error saving status:', error);
      Swal.fire({ title: 'Error', text: 'Failed to save status. ' + (error.response?.data?.message || error.message), icon: 'error', confirmButtonColor: '#d33' });
    }
  };

  const updateFormattingState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
  };

  const applyCommand = (e, command, value = null) => { 
    e.preventDefault(); 
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    updateFormattingState();
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

  const renderPreviewModal = () => {
    if (!previewModal.isOpen || !previewModal.data) return null;
    const { data } = previewModal;
    const isPending = data.status === 'Pending';
    const getStatusColor = (status) => {
        const s = status ? status.toLowerCase() : 'pending';
        if (s === 'settled') return 'bg-green-500 text-white';
        if (s === 'escalated') return 'bg-red-500 text-white';
        if (s === 'blacklisted') return 'bg-black text-white';
        return 'bg-yellow-500 text-white';
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-[#0066FF] transform scale-100 transition-all">
                <div className="p-10">
                    <h3 className="text-3xl font-bold text-[#0066FF] mb-8">{t('case_preview')}</h3>
                    <div className="bg-slate-50 rounded-xl p-8 border border-gray-100 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4"><span className="text-gray-500 font-medium text-lg">{t('case_no')}</span><span className="text-[#0066FF] font-bold text-xl tracking-wide">{data.caseNo}</span></div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4"><span className="text-gray-500 font-medium text-lg">{t('complainant_name')}</span><span className="text-gray-800 font-extrabold text-xl">{data.complainantName}</span></div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4"><span className="text-gray-500 font-medium text-lg">{t('date_filed')}</span><span className="text-gray-800 font-medium text-xl">{data.summonDate || 'N/A'}</span></div>
                        <div className="flex justify-between items-center pt-2 min-h-[50px]">
                            <span className="text-gray-500 font-medium text-lg">{t('current_status')}</span>
                            {previewEditing ? (
                                <div className="relative">
                                    <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} className="appearance-none bg-white border-2 border-[#0066FF] text-gray-900 font-bold text-lg py-2 pl-6 pr-12 rounded-lg cursor-pointer outline-none shadow-sm hover:bg-blue-50 transition-colors">
                                        {tempStatus === 'Pending' && <option value="Pending" disabled>{t('select_option') || 'Select...'}</option>}
                                        <option value="Settled">{t('settle')}</option><option value="Escalated">{t('escalate')}</option><option value="Blacklisted">{t('blacklist')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0066FF] pointer-events-none" size={20} strokeWidth={3} />
                                </div>
                            ) : ( <span className={`${getStatusColor(tempStatus || data.status)} px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm`}>{tempStatus || data.status || 'PENDING'}</span> )}
                        </div>
                    </div>
                    <div className="flex justify-center space-x-4 mt-10">
                        {previewEditing ? (
                            <>
                              <button onClick={() => { setPreviewEditing(false); setTempStatus(data.status); }} className="px-10 py-3 rounded-xl text-sm tracking-wide border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                              <button onClick={handlePreviewSaveClick} className="px-12 py-3 rounded-xl text-sm tracking-wide bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95 flex items-center"><Save size={18} className="mr-2"/> {t('save_changes')}</button>
                            </>
                        ) : isPending ? (
                            <>
                              <button onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-10 py-3 rounded-xl text-sm tracking-wide border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                              <button onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-12 py-3 rounded-xl text-sm tracking-wide bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('ok')}</button>
                            </>
                        ) : (
                            <>
                              <button onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-10 py-3 rounded-xl text-sm tracking-wide border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                              <button onClick={() => setPreviewEditing(true)} className="px-12 py-3 rounded-xl text-sm tracking-wide bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95 flex items-center"><Edit size={18} className="mr-2"/> {t('edit_status')}</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderConfirmationModal = () => {
    if (!confirmModal.isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-[#0066FF] transform scale-100 transition-all">
                <div className="p-8">
                    <h3 className="text-2xl font-bold text-[#0066FF] mb-4">{t('confirm_status_update')}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-4">{t('are_you_sure_mark')} <span className="font-bold text-[#0066FF] whitespace-nowrap">{confirmModal.caseNo}</span> {t('as')} <span className="font-bold text-gray-800">{confirmModal.action}</span>?</p>
                    {confirmModal.action === 'Settled' && <p className="text-green-600 font-bold text-sm bg-green-50 p-2 rounded-lg border border-green-100 mb-4 text-center">{t('moved_to_archive')}</p>}
                    {confirmModal.action === 'Escalated' && <p className="text-red-600 font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100 mb-4 text-center">{t('case_escalated_notice')}</p>}
                    {confirmModal.action === 'Blacklisted' && <p className="text-gray-800 font-bold text-sm bg-gray-200 p-2 rounded-lg border border-gray-300 mb-4 text-center">{t('moved_to_blacklist')}</p>}
                    <div className="flex justify-end space-x-3 mt-4">
                      <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-6 py-2.5 rounded-lg text-sm tracking-wide border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                      <button onClick={executeStatusUpdate} className="px-8 py-2.5 rounded-lg text-sm tracking-wide bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('confirm')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  if (view === 'NOTE_EDIT' && selectedNote) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10 flex items-center justify-center">
        <div className="max-w-[1200px] w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative">
          <div className="bg-gradient-to-br from-blue-800 to-blue-500 p-10 text-white">
            <h2 className="text-3xl font-extrabold tracking-wide uppercase mb-2">{t('case_overview_title')}</h2>
            <p className="text-blue-100 text-lg font-medium">{t('case_overview_subtitle')}</p>
          </div>
          <div className="p-10">
            <div className="flex items-center justify-between mb-8 px-2">
               <p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('case_no')}:</span> <span className="text-[#0066FF] ml-1">{selectedNote}</span></p>
<div className="flex items-center space-x-4"><span className="text-gray-400 font-bold text-sm uppercase tracking-wide">{t('date')}:</span><div className="relative"><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} disabled className="border-2 border-gray-200 rounded-lg py-1 px-3 text-gray-800 font-bold text-sm bg-gray-100 cursor-not-allowed opacity-75" /></div></div>         </div>
            <div className="mb-8">
               <h3 className="text-[#0066FF] font-bold text-sm uppercase mb-2 ml-1">{t('case_overview_title')}</h3>
               <div className="border-2 border-[#0066FF] rounded-lg overflow-hidden shadow-sm flex flex-col h-72">
                 <div className="relative flex-1 bg-white cursor-text" onClick={() => editorRef.current?.focus()}><div ref={editorRef} contentEditable onMouseUp={updateFormattingState} onKeyUp={updateFormattingState} className="w-full h-full p-6 text-base text-gray-700 focus:outline-none overflow-y-auto" style={{ minHeight: '100%' }} /></div>
                 <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center space-x-5 text-gray-500 shrink-0">
                   <button onMouseDown={(e) => applyCommand(e, 'bold')} className={`p-1.5 rounded transition-all ${isBold ? 'bg-blue-200 text-[#0066FF]' : 'hover:text-[#0066FF]'}`} title="Bold"><Bold size={18} strokeWidth={2.5} /></button>
                   <button onMouseDown={(e) => applyCommand(e, 'italic')} className={`p-1.5 rounded transition-all ${isItalic ? 'bg-blue-200 text-[#0066FF]' : 'hover:text-[#0066FF]'}`} title="Italic"><Italic size={18} strokeWidth={2.5} /></button>
                   <button onMouseDown={(e) => applyCommand(e, 'underline')} className={`p-1.5 rounded transition-all ${isUnderline ? 'bg-blue-200 text-[#0066FF]' : 'hover:text-[#0066FF]'}`} title="Underline"><Underline size={18} strokeWidth={2.5} /></button>
                   <div className="h-5 w-px bg-gray-300 mx-2"></div>
                 </div>
               </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={handleCancelEdit} className="px-8 py-2.5 rounded-lg text-xs tracking-wider border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button>
              <button onClick={handleSaveNote} className="px-10 py-2.5 rounded-lg text-xs tracking-wider bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('ok')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'NOTE_DETAIL' && selectedNote) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10 flex items-center justify-center">
        <div className="max-w-[1200px] w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-blue-800 to-blue-500 p-10 text-white">
            <h2 className="text-3xl font-extrabold tracking-wide uppercase mb-2">{t('case_overview_title')}</h2>
            <p className="text-blue-100 text-lg font-medium">{t('case_overview_subtitle')}</p>
          </div>
          <div className="p-10">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center space-x-6">
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('case_no')}:</span> <span className="text-[#0066FF] ml-1">{selectedNote}</span></p>
                <div className="w-px h-4 bg-gray-300"></div>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('date')}:</span> <span className="text-gray-800 ml-1">{editDate}</span></p>
              </div>
              <button onClick={handleEditNote} className="flex items-center text-[#0066FF] hover:text-blue-800 font-bold transition-colors text-sm uppercase tracking-wide">
                <Edit size={16} className="mr-1.5" /> {t('edit_case_overview')}
              </button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-10 h-64 shadow-inner text-gray-600 text-base leading-relaxed overflow-y-auto" dangerouslySetInnerHTML={{ __html: savedSummaryHtml }}></div>
            <div className="flex justify-end space-x-4">
              <button onClick={handleCloseNote} className="px-8 py-3 rounded-lg text-sm tracking-wider border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button>
              <button onClick={handleCloseNote} className="px-10 py-3 rounded-lg text-sm tracking-wider bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('ok')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'OVERVIEW' && selectedSummon && selectedCase) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10">
        <style>{`
          .rich-text-content b, .rich-text-content strong { font-weight: 900 !important; }
          .rich-text-content i, .rich-text-content em { font-style: italic !important; }
          .rich-text-content u { text-decoration: underline !important; }
        `}</style>
        
        {renderConfirmationModal()}
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
             <div className="flex items-center mb-6">
               <button onClick={handleBackToFolder} className="flex items-center text-gray-500 hover:text-blue-700 transition-colors mr-4">
                 <ChevronLeft size={32} />
               </button>
               <h2 className="text-4xl font-bold text-[#0066FF] tracking-wide uppercase">
                 {t('summon_overview')}
               </h2>
             </div>
             <div className="flex space-x-6 px-2"><p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('case_no')}:</span> <span className="text-gray-800 ml-1">{selectedCase.caseNo}</span></p><div className="w-px h-5 bg-gray-300"></div><p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('complainant_name')}:</span> <span className="text-gray-800 ml-1">{selectedCase.complainantName}</span></p></div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-10 shadow-sm relative">
            <h3 className="text-[#0066FF] font-extrabold text-lg uppercase mb-3">{t('summon_reason')} :</h3>
            
            {/* 🔥 FIX: RENDER BOLD/ITALIC TAGS USING dangerouslySetInnerHTML 🔥 */}
            <div 
              className="text-gray-700 text-base leading-relaxed font-medium rich-text-content"
              dangerouslySetInnerHTML={{ __html: selectedSummon.summonReason || "No reason provided." }}
            />
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6 gap-6">
               <div className="bg-gradient-to-br from-blue-800 to-blue-500 text-white py-3.5 px-8 rounded-xl shadow-sm flex-1">
                 <h3 className="text-xl font-bold tracking-wide uppercase">{t('case_folders')}</h3>
               </div>
               <button onClick={handleAddNote} className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white text-sm font-bold px-5 py-3 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2">
                 <Plus size={18} />
                 <span>{t('add_case_notes')}</span>
               </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 relative pb-24 z-0">
              <div className="divide-y divide-gray-100">
                {caseNotes.map((num) => (
                  <div key={num} className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer group transition-colors">
                    <div onClick={() => handleOpenNoteDetail(num)} className="flex items-center space-x-4 flex-1">
                      <ClipboardList size={28} className="text-[#0066FF]" strokeWidth={1.5} />
                      <span className="text-base font-bold text-gray-800 uppercase">{t('case_note')} {num}</span>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setNoteDropdownOpen(noteDropdownOpen === num ? null : num); }} 
                        className="text-gray-400 hover:text-[#0066FF] p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical size={24} />
                      </button>
                      {noteDropdownOpen === num && (
                        <div className="absolute right-0 top-full mt-1 z-20 flex flex-col gap-1 rounded-md border border-gray-200 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 w-40">
                          <button 
                            type="button" 
                            className="rounded-md px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors mx-1 flex items-center"
                            onClick={() => { handleOpenNoteDetail(num); setNoteDropdownOpen(null); }}
                          >
                            <Eye size={16} className="mr-2" /> {t('view')}
                          </button>
                          <div className="h-px bg-gray-100 w-full my-0.5"></div>
                          <button 
                            type="button" 
                            className="rounded-md px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors mx-1 flex items-center"
                            onClick={(e) => { handleDeleteNote(num, e); setNoteDropdownOpen(null); }}
                          >
                            <Trash2 size={16} className="mr-2" /> {t('delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-6 right-6">
                <button onClick={handleBackToFolder} className="px-6 py-2 rounded-lg text-xs tracking-wider border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">{t('back_to_summons')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'FOLDER' && selectedCase) {
    const rawSummons = summonsList.filter(s => s.caseNo === selectedCase.caseNo);
    const uniqueSummonsMap = new Map();
    rawSummons.forEach(s => { if (!uniqueSummonsMap.has(s.summonType)) uniqueSummonsMap.set(s.summonType, s); });
    const caseSummons = Array.from(uniqueSummonsMap.values()).sort((a, b) => a.summonType - b.summonType);

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10">
        {renderConfirmationModal()}
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
             <div className="flex items-center mb-6"><button onClick={handleBackToList} className="flex items-center text-gray-500 hover:text-blue-700 transition-colors mr-4"><ChevronLeft size={32} /></button><h2 className="text-4xl font-bold text-[#0066FF] tracking-wide uppercase">{t('summons_hearing')}</h2></div>
             <div className="flex space-x-6 px-2"><p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('case_no')}:</span> <span className="text-gray-800 ml-1">{selectedCase.caseNo}</span></p><div className="w-px h-5 bg-gray-300"></div><p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('complainant_name')}:</span> <span className="text-gray-800 ml-1">{selectedCase.complainantName}</span></p></div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[500px]">
            <div className="bg-gradient-to-br from-blue-800 to-blue-500 text-white px-6 py-4">
              <h3 className="text-lg font-bold tracking-wide uppercase">{t('summons_folder')}</h3>
            </div>
            <div className="p-4">
              {caseSummons.length > 0 ? (
                caseSummons.map((summon, index) => (
                  <div key={index} onClick={() => handleOpenSummonDetail(summon)} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 flex-shrink-0"><img src="/icon-summons/folder-summon.png" alt="Folder" className="w-full h-full object-contain drop-shadow-sm" onError={(e) => {e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/3767/3767084.png"}} /></div>
                      <div className="flex flex-col"><span className="text-base font-extrabold text-gray-800 tracking-wide uppercase group-hover:text-[#0066FF] transition-colors">{t('nav_summons')} {summon.summonType}</span><span className="text-[11px] text-gray-500 font-bold mt-0.5">{summon.summonDate} • {summon.summonTime}</span></div>
                    </div>
                  </div>
                ))
              ) : ( <div className="p-16 text-center text-gray-400 text-base font-medium">{t('no_summons_in_folder')}</div> )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8" onClick={() => {
        setActiveActionDropdown(null);
        setIsDateFilterOpen(false);
        setNoteDropdownOpen(null);
    }}>
      {renderConfirmationModal()}
      {renderPreviewModal()}
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 tracking-wide uppercase">SUMMON LOGS</h2>
            <p className="text-sm font-bold text-gray-700 whitespace-nowrap mt-1">{t('total_cases') || 'Total Records'}: {filteredData.length}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-64 mr-2" onClick={e => e.stopPropagation()}>
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 shadow-sm text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Beautiful Calendar Dropdown Filter */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => setIsDateFilterOpen(!isDateFilterOpen)} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <Calendar size={16} className="mr-2 text-blue-500" />
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{displayDate}</span>
                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform ${isDateFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDateFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-[340px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
                  
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

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-visible relative min-h-[600px] flex flex-col">
          <div className="bg-gradient-to-br from-blue-800 to-blue-500 text-white font-bold text-sm uppercase tracking-wider grid grid-cols-12 py-5 px-6 text-center items-center shadow-md rounded-t-lg w-full">
            <div className="col-span-4 text-left pl-6">{t('case_no')}</div><div className="col-span-4 text-left">{t('complainant_name')}</div><div className="col-span-2">{t('date_assigned')}</div><div className="col-span-2">{t('action')}</div>
          </div>
          <div className="divide-y divide-gray-100 flex-1 bg-white">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => {
                const statusLower = (item.status || '').toLowerCase();
                const isPending = !item.status || statusLower === 'pending' || statusLower === 'active';
                return (
                  <div key={index} onClick={() => handleOpenFolder(item)} className="grid grid-cols-12 py-4 px-6 text-center items-center hover:bg-blue-50/40 transition-colors group relative cursor-pointer">
                    <div className="col-span-4 flex items-center pl-2 space-x-4">
                      <img src="/icon-summons/folder-summon.png" alt="Folder" className="w-10 h-10 object-contain" onError={(e) => {e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/3767/3767084.png"}} />                     <span className="font-bold text-gray-700 text-base tracking-tight">{item.caseNo}</span>
                    </div>
                    <div className="col-span-4 text-left font-semibold text-gray-600 pl-1 text-base">{item.complainantName}</div>
                    <div className="col-span-2 text-gray-500 font-medium text-base">{item.summonDate}</div>
                    <div className="col-span-2 flex justify-center relative">
                      <button onClick={(e) => { e.stopPropagation(); toggleActionDropdown(item.caseNo); }} className="text-gray-400 hover:text-[#0066FF] p-2 rounded-full hover:bg-blue-50"><List size={24} strokeWidth={2.5} /></button>
                      {activeActionDropdown === item.caseNo && (
                        <div className="absolute top-12 right-10 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 cursor-default" onClick={e => e.stopPropagation()}>
                          <div onClick={(e) => { e.stopPropagation(); handleViewStatus(item); }} className="px-5 py-3 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer font-bold border-b border-gray-100 transition-colors flex items-center"><Eye size={16} className="mr-2"/> {t('view_status')}</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Escalated', item); }} className={`px-5 py-3 text-sm text-left font-bold border-b border-gray-100 transition-colors ${!isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer'}`}>{t('escalate')}</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Blacklisted', item); }} className={`px-5 py-3 text-sm text-left font-bold border-b border-gray-100 transition-colors ${!isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer'}`}>{t('blacklist')}</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Settled', item); }} className={`px-5 py-3 text-sm text-left font-bold transition-colors ${!isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}`}>{t('settle')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : ( <div className="py-24 text-center"><p className="text-gray-400 font-medium text-xl">{searchQuery ? `No records found matching "${searchQuery}"` : t('no_summons_found')}</p><p className="text-gray-300 text-base mt-2">{t('go_to_case_logs')}</p></div> )}
          </div>
          <div className="py-8 text-center bg-gray-50/50 border-t border-gray-100"><div className="flex items-center justify-center space-x-6"><div className="h-px w-32 bg-gray-300"></div><span className="text-gray-400 font-bold text-sm uppercase tracking-widest">{t('nothing_follows')}</span><div className="h-px w-32 bg-gray-300"></div></div></div>
        </div>
      </div>
    </div>
  );
}