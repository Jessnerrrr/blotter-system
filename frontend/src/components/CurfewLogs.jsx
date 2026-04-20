import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext';
import { Plus, Folder, MoreVertical, X, Calendar, Clock, Eye, Trash2, ChevronLeft, Link as LinkIcon, Image as ImageIcon, Edit, Search, ChevronDown } from 'lucide-react';
import summonsFolderIcon from '/icon-summons/folder-summon.png';
import { CurfewButton } from './buttons/Buttons';
import { curfewsAPI, residentsAPI } from "../services/api";
import ResidentAutocomplete from './ResidentAutocomplete';

const DEFAULT_OVERVIEW = "The present case arises from the alleged violation of the city/state-imposed curfew, intended to maintain public safety and order. The petitioner contends that the respondent breached the curfew restrictions, thereby potentially endangering community welfare. The matter requires judicial consideration to determine whether the respondent's actions constitute a lawful exception or a contravention of the established curfew regulations.";

// 🔥 FIX 1: AGGRESSIVE DECODER TO FORCE HTML TO RENDER 🔥
function ensureHtml(text) {
  if (!text || typeof text !== 'string') return '<p></p>';
  let decoded = text;
  for(let i=0; i<3; i++) {
      const txt = document.createElement("textarea");
      txt.innerHTML = decoded;
      decoded = txt.value;
  }
  if (decoded.trim().startsWith('<')) return decoded;
  return '<p>' + decoded.replace(/\n/g, '</p><p>') + '</p>';
}

const SuccessAlert = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => { onClose(); }, 3000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#1a3a8a] to-[#1b9ad4] px-4 py-3 shadow-lg">
        <div className="flex-shrink-0"><svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
        <div className="flex-1"><p className="text-sm font-medium text-white">{message}</p></div>
        <button onClick={onClose} className="flex-shrink-0 text-white/80 hover:text-white"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
    </div>
  );
};

export default function CurfewLogs() {
  const { t } = useLanguage();
  const [view, setView] = useState('LIST'); 
  const [selectedResident, setSelectedResident] = useState(null);
  
  const [rows, setRows] = useState([]);
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('curfew_folders');
    if (saved && saved !== '[]') return JSON.parse(saved);
    return []; 
  });

  // 🔥 NEW FILTER STATE WITH DAY 🔥
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All Years');
  const [filterMonth, setFilterMonth] = useState('All Months');
  const [filterDay, setFilterDay] = useState('All Days');
  
  const [isYearSortOpen, setIsYearSortOpen] = useState(false);
  const [isMonthSortOpen, setIsMonthSortOpen] = useState(false);
  const [isDaySortOpen, setIsDaySortOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = ['All Years', ...Array.from({length: 7}, (_, i) => (currentYear - i).toString())];
  const monthOptions = ['All Months', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayOptions = ['All Days', ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))];

  useEffect(() => {
    const loadCurfews = async () => {
      try {
        const data = await curfewsAPI.getAll();
        setRows(data);
      } catch (error) {
        console.error('Error loading curfews:', error);
        Swal.fire({ title: 'Error', text: 'Failed to load curfew violations.', icon: 'error', confirmButtonColor: '#d33' });
      }
    };
    loadCurfews();
  }, []);

  useEffect(() => {
    localStorage.setItem('curfew_folders', JSON.stringify(folders));
    window.dispatchEvent(new Event('storage')); 
  }, [folders]);

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderActionDropdown, setFolderActionDropdown] = useState(null);
  
  const [showAddCurfewModal, setShowAddCurfewModal] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(null);

  const [curfewForm, setCurfewForm] = useState({ resident: '', address: '', age: '' });
  const [notesForm, setNotesForm] = useState({ content: '' });
  const [ageLoading, setAgeLoading] = useState(false);

  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewHtml, setOverviewHtml] = useState(() => ensureHtml(DEFAULT_OVERVIEW));
  const [draftOverviewHtml, setDraftOverviewHtml] = useState(() => ensureHtml(DEFAULT_OVERVIEW));
  const [overviewDate, setOverviewDate] = useState('');
  const [formatActive, setFormatActive] = useState({ bold: false, italic: false, underline: false });

  const editorRef = useRef(null);
  const fileInputLinkRef = useRef(null);
  const fileInputImageRef = useRef(null);
  const savedSelectionRef = useRef(null);

  const [currentDateTime, setCurrentDateTime] = useState({ time: '', date: '', rawDate: '', htmlDate: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime({
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        rawDate: now.toISOString().split('T')[0],
        htmlDate: now.toISOString().split('T')[0]
      });
    };
    updateTime(); 
    const timer = setInterval(updateTime, 1000); 
    return () => clearInterval(timer); 
  }, []);

  const calculateAge = (birthdate) => {
    if (!birthdate) return '';
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return Math.max(age, 0);
  };

  const fetchCurfewResidentAge = async (name) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) return '';
    try {
      const data = await residentsAPI.getAgeByName(name.trim());
      if (!data) return '';
      if (data.age !== undefined && data.age !== null) return String(data.age);
      if (data.birthdate) return String(calculateAge(data.birthdate));
      return '';
    } catch (error) {
      console.error('Error fetching curfew resident age:', error);
      return '';
    }
  };

  const handleResidentChange = (value) => {
    setCurfewForm((prev) => ({ ...prev, resident: value, age: '' }));
  };

  const handleResidentSelect = async (resident) => {
    const fullName = resident.full_name;
    setCurfewForm((prev) => ({ ...prev, resident: fullName, address: resident.address_text || '', age: '' }));

    setAgeLoading(true);
    try {
      const resolvedAge = await fetchCurfewResidentAge(fullName);
      setCurfewForm((prev) => ({ ...prev, age: resolvedAge }));
    } catch (error) {
      setCurfewForm((prev) => ({ ...prev, age: '' }));
      console.error('Error loading selected resident birthdate:', error);
    } finally {
      setAgeLoading(false);
    }
  };

  const handleResidentBlur = async (value) => {
    const normalizedValue = value?.trim();
    if (!normalizedValue) return;
    if (curfewForm.resident === normalizedValue && curfewForm.age) return;

    setAgeLoading(true);
    const resolvedAge = await fetchCurfewResidentAge(normalizedValue);
    setCurfewForm((prev) => ({ ...prev, age: resolvedAge }));
    setAgeLoading(false);
  };


  const syncContent = useCallback(() => { if (editorRef.current) setDraftOverviewHtml(editorRef.current.innerHTML); }, []);
  const updateFormatState = useCallback(() => { try { setFormatActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline') }); } catch {} }, []);

  useEffect(() => { if (isEditingOverview && editorRef.current) { editorRef.current.innerHTML = ensureHtml(draftOverviewHtml); } }, [isEditingOverview]);

  const saveSelection = useCallback(() => { const sel = window.getSelection(); if (sel.rangeCount) savedSelectionRef.current = sel.getRangeAt(0).cloneRange(); }, []);
  const restoreSelection = useCallback(() => { const sel = window.getSelection(); const range = savedSelectionRef.current; if (range && editorRef.current) { sel.removeAllRanges(); try { sel.addRange(range); } catch {} } }, []);

  const applyFormat = (type) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (type === 'bold') document.execCommand('bold', false, null);
    else if (type === 'italic') document.execCommand('italic', false, null);
    else if (type === 'underline') document.execCommand('underline', false, null);
    syncContent();
    setTimeout(updateFormatState, 0);
  };

  const handleToolbarMouseDown = (e) => { e.preventDefault(); saveSelection(); };
  const handleLinkClick = () => fileInputLinkRef.current?.click();
  const handleImageClick = () => fileInputImageRef.current?.click();

  const handleLinkFileSelect = (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !editorRef.current) return;
    editorRef.current.focus(); restoreSelection();
    const url = URL.createObjectURL(file);
    const sel = window.getSelection();
    if (sel.toString()) document.execCommand('createLink', false, url);
    else document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener">${file.name}</a>`);
    syncContent();
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !file.type.startsWith('image/') || !editorRef.current) return;
    editorRef.current.focus(); restoreSelection();
    const url = URL.createObjectURL(file);
    document.execCommand('insertImage', false, url);
    syncContent();
  };

  const handleEditOverviewClick = () => { setDraftOverviewHtml(overviewHtml); setIsEditingOverview(true); };

  const handleSaveOverview = () => {
    Swal.fire({ title: t('Save_Changes?') || 'confirm_save?', text: t('Are you sure you want to save this record?') || 'confirm_save_text', icon: 'question', showCancelButton: true, confirmButtonColor: '#2563eb', cancelButtonColor: '#d33', confirmButtonText: t('Save') || 'Yes, save it!', cancelButtonText: t('Cancel') }).then((result) => {
      if (result.isConfirmed) {
        setOverviewHtml(draftOverviewHtml);
        const updatedFolders = folders.map(f => f.id === selectedFolder.id ? { ...f, notes: draftOverviewHtml } : f);
        setFolders(updatedFolders);
        setIsEditingOverview(false);
        triggerAlert(t('case_overview_saved'));
      }
    });
  };

  const handleCancelOverview = () => {
    Swal.fire({ title: t('discard_changes?'), text: t('This will not be saved'), icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('Discard'), cancelButtonText: t('Keep') }).then((result) => {
      if (result.isConfirmed) { setDraftOverviewHtml(overviewHtml); setIsEditingOverview(false); }
    });
  };

  const triggerAlert = (msg) => { setAlertMessage(msg); setShowSuccessAlert(true); };

  const handleAddCurfew = async (e) => {
    e.preventDefault();
    const ageValue = curfewForm.age !== '' ? Number(curfewForm.age) : null;
    if (!curfewForm.resident || ageValue === null || isNaN(ageValue) || !curfewForm.address) {
      Swal.fire({ title: t('incomplete_fields'), text: t('fill_all_required'), icon: 'error', confirmButtonColor: '#d33' });
      return;
    }

    Swal.fire({ title: t('Create a_Curfew?') || 'Confirm_Curfew',  icon: 'question', showCancelButton: true, confirmButtonColor: '#2563eb', cancelButtonColor: '#d33', confirmButtonText: t('Save') || 'Yes, save it!', cancelButtonText: t('Cancel') }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const newRecord = { residentName: curfewForm.resident, location: curfewForm.address, age: ageValue, violationTime: currentDateTime.time, violationDate: currentDateTime.rawDate, status: 'ACTIVE' };
          const savedRecord = await curfewsAPI.create(newRecord);
          setRows(prevRows => [savedRecord || { ...newRecord, _id: Date.now() }, ...prevRows]); 
          setFilterYear('All Years');
          setFilterMonth('All Months');
          setFilterDay('All Days');
          setCurfewForm({ resident: '', address: '', age: '' }); setShowAddCurfewModal(false);
          Swal.fire({title: 'Successfully Added!', icon: 'success'});
        } catch (error) { Swal.fire({ title: 'Error', text: 'Failed to save curfew violation.', icon: 'error', confirmButtonColor: '#d33' }); }
      }
    });
  };

  const handleCloseAddCurfewModal = () => {
    if (curfewForm.resident || curfewForm.age || curfewForm.address) {
        Swal.fire({ title: t('discard_changes?'), text: t('This will not be saved'), icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: t('Discard'), cancelButtonText: t('Cancel') }).then((result) => {
            if (result.isConfirmed) { setCurfewForm({ resident: '', address: '', age: '' }); setShowAddCurfewModal(false); }
        });
    } else { setShowAddCurfewModal(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    setStatusMenuOpen(null);
    if (newStatus === 'RESOLVED') {
        Swal.fire({ title: t('Settle_Curfew_Violation?') || 'settle_curfew_title', text: t('Marking this as Settled will move the record to Archives.') || "settle_curfew_text", icon: 'info', showCancelButton: true, confirmButtonColor: '#10b981', confirmButtonText: t('Settle') || 'Yes, Settle it' }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await curfewsAPI.update(id, { status: 'RESOLVED' });
                    const updatedRows = rows.map(r => (r._id === id || r.id === id) ? { ...r, status: 'RESOLVED' } : r);
                    setRows(updatedRows);
                    Swal.fire(t('Archived!') || 'archived_title', t('Curfew violation moved to Archives.') || 'curfew_moved_archives', 'success');
                } catch (error) { Swal.fire('Error', 'Failed to save the status to the database.', 'error'); }
            }
        });
    } else {
        try {
            await curfewsAPI.update(id, { status: newStatus });
            const updatedRows = rows.map(r => (r._id === id || r.id === id) ? { ...r, status: newStatus } : r);
            setRows(updatedRows);
        } catch (error) { Swal.fire('Error', 'Failed to save the status to the database.', 'error'); }
    }
  };

  const openAddNotesModal = () => { setNotesForm({ content: '' }); setShowAddNotesModal(true); };

  const handleAddNotes = (e) => {
      e.preventDefault();
      if (!notesForm.content) { Swal.fire({ title: t('incomplete_fields'), text: t('fill_all_required'), icon: 'error', confirmButtonColor: '#d33' }); return; }
      Swal.fire({ title: t('Save_Note?') || 'confirm_save_title', text: t('Are you sure you want to save this Note?') || 'confirm_save_text', icon: 'question', showCancelButton: true, confirmButtonColor: '#2563eb', cancelButtonColor: '#d33', confirmButtonText: t('Save') || 'Yes, save it!', cancelButtonText: t('Cancel') }).then((result) => {
        if (result.isConfirmed) {
          const resId = selectedResident._id || selectedResident.id;
          const newFolderCount = folders.filter(f => f.residentId === resId).length + 1;
          const newFolder = { id: Date.now().toString(), residentId: resId, name: `CURFEW ${newFolderCount}`, date: currentDateTime.date, time: currentDateTime.time, notes: notesForm.content };
          setFolders([...folders, newFolder]); setShowAddNotesModal(false); triggerAlert(t('curfew_notes_added'));
        }
      });
  };

  const handleCloseAddNotesModal = () => {
    if (notesForm.content) {
        Swal.fire({ title: t('discard_changes?'), text: t('This will not be saved'), icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('Discard'), cancelButtonText: t('cancel') }).then((result) => {
            if (result.isConfirmed) { setNotesForm({ content: '' }); setShowAddNotesModal(false); }
        });
    } else { setShowAddNotesModal(false); }
  };

  const handleDeleteFolder = (folderId) => {
      setFolderActionDropdown(null);
      Swal.fire({ title: t('delete_folder'), icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('yes_delete'), cancelButtonText: t('cancel') }).then((result) => {
          if (result.isConfirmed) { setFolders(folders.filter(f => f.id !== folderId)); Swal.fire(t('note_deleted'), '', 'success'); }
      });
  };

  const handleViewFolder = (folder) => {
      setFolderActionDropdown(null); setSelectedFolder(folder);
      setOverviewHtml(folder.notes ? ensureHtml(folder.notes) : ensureHtml(DEFAULT_OVERVIEW));
      setOverviewDate(folder.date || currentDateTime.rawDate); setIsEditingOverview(false); setView('OVERVIEW');
  };

  const handlePageClick = () => { 
    setStatusMenuOpen(null); 
    setFolderActionDropdown(null); 
    setIsYearSortOpen(false);
    setIsMonthSortOpen(false);
    setIsDaySortOpen(false);
  };

  // 🔥 FILTER LOGIC FOR CURFEW TABLE WITH DAY 🔥
  const activeRows = rows.filter((r) => {
    if (r.status === 'RESOLVED' || r.status === 'Settled') return false;
    
    const itemDateParts = r.violationDate || r.date || r.createdAt ? (r.violationDate || r.date || r.createdAt).split('-') : []; 
    let itemYear = '';
    let itemMonth = '';
    let itemDay = '';

    // Extract year, month, and day assuming YYYY-MM-DD for curfews (adjust if it's MM-DD-YYYY)
    if (itemDateParts.length === 3) {
        if (itemDateParts[0].length === 4) { // YYYY-MM-DD
            itemYear = itemDateParts[0];
            itemMonth = itemDateParts[1].padStart(2, '0');
            itemDay = itemDateParts[2].padStart(2, '0');
        } else { // MM-DD-YYYY
            itemYear = itemDateParts[2];
            itemMonth = itemDateParts[0].padStart(2, '0');
            itemDay = itemDateParts[1].padStart(2, '0');
        }
    }

    const matchesYear = filterYear === 'All Years' || itemYear === filterYear;
    const matchesMonth = filterMonth === 'All Months' || itemMonth === filterMonth.padStart(2, '0');
    const matchesDay = filterDay === 'All Days' || itemDay === filterDay.padStart(2, '0');
    
    const searchLower = searchQuery.toLowerCase();
    const resName = r.residentName || r.resident || '';
    const loc = r.location || r.address || '';
    const matchesSearch = searchQuery === '' || 
                          resName.toLowerCase().includes(searchLower) ||
                          loc.toLowerCase().includes(searchLower);

    return matchesYear && matchesMonth && matchesDay && matchesSearch;
  });

  const selectedResId = selectedResident ? (selectedResident._id || selectedResident.id) : '';
  const residentFolders = folders.filter(f => f.residentId === selectedResId);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={handlePageClick}>
      
      {/* 🔥 FIX 1: AGGRESSIVE CSS RULE TO ENSURE HTML DISPLAYS IN EDITORS 🔥 */}
      <style>{`
        .rich-text-content b, .rich-text-content strong { font-weight: 900 !important; }
        .rich-text-content i, .rich-text-content em { font-style: italic !important; }
        .rich-text-content u { text-decoration: underline !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {showSuccessAlert && ( <SuccessAlert message={alertMessage} onClose={() => setShowSuccessAlert(false)} /> )}

      <div className="flex-1 flex flex-col h-full min-h-0 w-full max-w-[1600px] mx-auto">
        
        {view === 'LIST' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-[#0066FF] tracking-wide uppercase">{t('curfew_violations')}</h2>
                <p className="text-sm font-bold text-gray-700 whitespace-nowrap mt-1">{t('total_cases') || 'Total Records'}: {activeRows.length}</p>
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

                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => { setIsYearSortOpen(!isYearSortOpen); setIsMonthSortOpen(false); setIsDaySortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Calendar size={16} className="mr-2 text-gray-500" /> 
                    <span className="text-xs font-bold text-gray-700 w-16 text-left">{filterYear}</span> 
                    <ChevronDown size={14} className="ml-1 text-gray-400" />
                  </button>
                  {isYearSortOpen && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {yearOptions.map(y => (
                        <div key={y} onClick={() => { setFilterYear(y); setIsYearSortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer ${filterYear === y ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>{y}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => { setIsMonthSortOpen(!isMonthSortOpen); setIsYearSortOpen(false); setIsDaySortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Calendar size={16} className="mr-2 text-gray-500" /> 
                    <span className="text-xs font-bold text-gray-700 w-20 text-left">{filterMonth === 'All Months' ? 'All Months' : monthNames[parseInt(filterMonth)-1] || filterMonth}</span> 
                    <ChevronDown size={14} className="ml-1 text-gray-400" />
                  </button>
                  {isMonthSortOpen && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {monthOptions.map((m, i) => (
                        <div key={m} onClick={() => { setFilterMonth(m); setIsMonthSortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer ${filterMonth === m ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                          {m === 'All Months' ? m : monthNames[parseInt(m)-1] || m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔥 NEW DAY FILTER 🔥 */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => { setIsDaySortOpen(!isDaySortOpen); setIsMonthSortOpen(false); setIsYearSortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Calendar size={16} className="mr-2 text-gray-500" /> 
                    <span className="text-xs font-bold text-gray-700 w-16 text-left">{filterDay}</span> 
                    <ChevronDown size={14} className="ml-1 text-gray-400" />
                  </button>
                  {isDaySortOpen && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {dayOptions.map(d => (
                        <div key={d} onClick={() => { setFilterDay(d); setIsDaySortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer ${filterDay === d ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>{d}</div>
                      ))}
                    </div>
                  )}
                </div>

                <CurfewButton variant="primary" onClick={(e) => { e.stopPropagation(); setShowAddCurfewModal(true); }} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ml-2">
                  <div className="relative w-8 h-9 mr-2 flex items-center justify-center">
                    <div className="absolute w-6 h-7 bg-white/30 rounded-[2px] rotate-6"></div>
                    <div className="absolute w-6 h-7 bg-white rounded-[2px] flex items-center justify-center shadow-sm z-10">
                      <Plus className="text-[#0066FF]" size={18} strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-xl font-bold pt-1">{t('add_violation')}</span>
                </CurfewButton>
              </div>
            </div>

            <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
              <div className="flex-1 overflow-y-auto w-full">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gradient-to-br from-blue-800 to-blue-500 text-white z-10">
                    <tr>
                      <th className="px-6 py-5 text-center font-bold uppercase text-sm">{t('no')}</th>
                      <th className="px-6 py-5 text-left font-bold uppercase text-sm">{t('resident_name_caps').replace(' :', '')}</th>
                      <th className="px-6 py-5 text-left font-bold uppercase text-sm">{t('address')}</th>
                      <th className="px-6 py-5 text-center font-bold uppercase text-sm">{t('age')}</th>
                      <th className="px-6 py-5 text-center font-bold uppercase text-sm">{t('status')}</th>
                      <th className="px-6 py-5 text-center font-bold uppercase text-sm">{t('action') || 'ACTION'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeRows.length > 0 ? activeRows.map((row, index) => {
                      const rowId = row._id || row.id; const resName = row.residentName || row.resident; const loc = row.location || row.address;
                      return (
                      <tr key={rowId} onClick={() => { setSelectedResident(row); setView('FOLDERS'); }} className="cursor-pointer hover:bg-blue-50/50 transition-colors group">
                        <td className="px-6 py-5 text-center text-sm font-bold text-[#2563eb]">{String(index + 1).padStart(2, '0')}</td>
                        <td className="px-6 py-5 font-bold text-gray-800">{resName}</td>
                        <td className="px-6 py-5 text-sm text-gray-500">{loc}</td>
                        <td className="px-6 py-5 text-center font-bold text-gray-700">{row.age}</td>
                        <td className="px-6 py-5 text-center font-extrabold text-sm">
                          <span className={row.status === 'RESOLVED' || row.status === 'Settled' ? 'text-emerald-500' : 'text-[#ef4444]'}>{row.status === 'RESOLVED' || row.status === 'Settled' ? t('settled').toUpperCase() : t('unsettled').toUpperCase()}</span>
                        </td>
                        <td className="relative px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setStatusMenuOpen(statusMenuOpen === rowId ? null : rowId)} className="text-gray-400 hover:text-[#2563eb] p-2 rounded-full hover:bg-blue-50 transition-colors inline-flex items-center justify-center"><MoreVertical size={20} /></button>
                          {statusMenuOpen === rowId && (
                            <div className="absolute right-10 top-12 z-20 flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 w-40">
                                <button onClick={() => handleStatusChange(rowId, 'RESOLVED')} className="px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">{t('mark_settled')}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}) : ( <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">{searchQuery ? `No records found matching "${searchQuery}"` : 'No active curfew records found.'}</td></tr> )}
                  </tbody>
                </table>
              </div>
              {activeRows.length > 0 && (<div className="flex items-center justify-center my-6 opacity-50 shrink-0"><div className="h-px bg-gray-300 w-24"></div><span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t('nothing_follows')}</span><div className="h-px bg-gray-300 w-24"></div></div>)}
            </section>
          </>
        )}

        {view === 'FOLDERS' && selectedResident && (
          <div className="flex-1 flex flex-col w-full h-full animate-in fade-in duration-300">
            <div className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#2563eb] cursor-pointer w-fit transition-colors" onClick={() => setView('LIST')}><ChevronLeft size={20} /><span className="font-bold text-sm uppercase">{t('back')}</span></div>
            <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 pl-1">
              <span className="text-gray-400 font-bold text-sm">
CURFEW NO.: <span className="text-gray-900 text-base">{String(rows.filter(r => r.status !== 'RESOLVED' && r.status !== 'Settled').findIndex(r => (r._id || r.id) === (selectedResident._id || selectedResident.id)) + 1).padStart(2, '0')}</span>             </span>
              <span className="text-gray-400 font-bold text-sm ml-6">
                RESIDENT NAME: <span className="text-gray-900 text-base">{(selectedResident.residentName || selectedResident.resident).toUpperCase()}</span>
              </span>
            </div><button 
  onClick={(e) => { e.stopPropagation(); openAddNotesModal(); }} 
  className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white text-sm font-bold px-5 py-3 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
>
  <Folder size={18} />
  <span>{t('add_curfew_notes')}</span>
</button>            
</div>
            <section className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md flex flex-col">
              <div className="flex items-center justify-between bg-blue-700 px-6 py-4 text-white shadow-sm shrink-0"><span className="font-bold uppercase tracking-wide">{t('curfew_folders')}</span><span className="font-bold uppercase tracking-wide">{t('actions')}</span></div>
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {residentFolders.length > 0 ? residentFolders.map((folder, i) => (
                    <li 
                      key={folder.id} 
                      className="flex items-center justify-between bg-white px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      onClick={() => handleViewFolder(folder)}
                    >
                      <div className="flex items-center gap-4">
                        <img 
  src="/icon-summons/folder-summon.png" 
  alt="Folder" 
  className="w-10 h-10 object-contain" 
  onError={(e) => {
    e.target.onerror = null; 
    e.target.src = "https://cdn-icons-png.flaticon.com/512/3767/3767084.png"
  }} 
/>
                        <span className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{folder.name}</span>
                      </div>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={(e) => { e.stopPropagation(); setFolderActionDropdown(folderActionDropdown === folder.id ? null : folder.id); }}>
                          <MoreVertical size={20} />
                        </button>
                        {folderActionDropdown === folder.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-md border border-gray-200 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 w-40">
                            <button type="button" className="rounded-md px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors mx-1 flex items-center" onClick={() => handleViewFolder(folder)}>
                              <Eye size={16} className="mr-2" /> {t('view')}
                            </button>
                            <div className="h-px bg-gray-100 w-full my-0.5"></div>
                            <button type="button" className="rounded-md px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors mx-1 flex items-center" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                              <Trash2 size={16} className="mr-2" /> {t('delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  )) : ( <div className="flex items-center justify-center h-40 text-gray-400 font-medium">{t('no_folders')}</div> )}
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* --- VIEW: OVERVIEW EDITOR --- */}
        {view === 'OVERVIEW' && selectedFolder && (
            <div className="flex-1 flex flex-col w-full h-full animate-in fade-in duration-300">
                <section className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 flex-1 flex flex-col">
                    <div className="rounded-t-2xl bg-blue-700 px-8 py-6 text-white shadow-md shrink-0"><h1 className="text-2xl font-bold uppercase tracking-wide md:text-3xl">{t('curfew_overview_title').replace('{num}', selectedFolder.name.replace('CURFEW ', ''))}</h1><p className="mt-2 text-base text-white/95">{t('curfew_overview_subtitle')}</p></div>

                    <div className="space-y-5 p-6 md:p-8 flex-1 overflow-y-auto">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <span className="rounded-full border border-blue-700 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 uppercase">{selectedFolder.name}</span>
                            <div className="flex items-center gap-3">
                                {isEditingOverview ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-blue-700">{t('date')}</span>
                                        
                                        {/* 🔥 FIX 2: COMPLETELY DELETED DATE INPUT! CALENDAR IS IMPOSSIBLE NOW. 🔥 */}
                                        <div className="border border-gray-300 bg-gray-100 rounded-md py-1.5 px-4 text-gray-500 font-bold cursor-not-allowed select-none text-sm inline-block min-w-[120px] text-center">
                                            {overviewDate || currentDateTime.rawDate}
                                        </div>

                                    </div>
                                ) : (
                                    <span className="rounded-full border border-blue-700 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">{t('date')}: {overviewDate}</span>
                                )}

                                {!isEditingOverview && ( <CurfewButton variant="primary" onClick={handleEditOverviewClick} className="gap-2 rounded-md px-4 py-2.5 text-sm font-semibold"><Edit size={16} />{t('edit_case_overview')}</CurfewButton> )}
                            </div>
                        </div>

                        {isEditingOverview ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">{t('curfew_overview_label')}</h3>
                                <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-600 transition-colors">
                                    
                                    {/* 🔥 FIX 1: ADDED rich-text-content CLASS SO BOLD/ITALIC WORKS AS YOU TYPE 🔥 */}
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={syncContent}
                                        onKeyUp={updateFormatState}
                                        onMouseUp={updateFormatState}
                                        data-placeholder={t('type_overview_here')}
                                        className="rich-text-content min-h-[14rem] w-full p-4 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                                    />
                                    
                                    <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center gap-1 text-gray-500">
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyFormat('bold')} className={`rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors ${formatActive.bold ? 'bg-gray-200 text-blue-600' : ''}`} title="Bold"><span className="font-bold font-serif text-lg leading-none px-1">B</span></button>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyFormat('italic')} className={`rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors ${formatActive.italic ? 'bg-gray-200 text-blue-600' : ''}`} title="Italic"><span className="italic font-serif text-lg leading-none px-1.5">I</span></button>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyFormat('underline')} className={`rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors ${formatActive.underline ? 'bg-gray-200 text-blue-600' : ''}`} title="Underline"><span className="underline font-serif text-lg leading-none px-1">U</span></button>
                                        <div className="w-px h-5 bg-gray-300 mx-2"></div>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={handleLinkClick} className="rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors" title="Attach Link"><LinkIcon size={18} /></button>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={handleImageClick} className="rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors" title="Insert Image"><ImageIcon size={18} /></button>
                                    </div>
                                    <input ref={fileInputLinkRef} type="file" className="hidden" accept="*/*" onChange={handleLinkFileSelect} />
                                    <input ref={fileInputImageRef} type="file" className="hidden" accept="image/*" onChange={handleImageFileSelect} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4"><CurfewButton variant="outlineLight" onClick={handleCancelOverview} className="rounded-md px-6 py-2 text-sm font-semibold">{t('cancel')}</CurfewButton><CurfewButton variant="primary" onClick={handleSaveOverview} className="rounded-md px-8 py-2 text-sm font-semibold shadow-sm">{t('save')}</CurfewButton></div>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg border-2 border-blue-600 bg-white p-6 shadow-sm">
                                    
                                    {/* 🔥 FIX 1: ADDED rich-text-content CLASS SO IT RENDERS AS BOLD/ITALIC AFTER SAVING 🔥 */}
                                    <div
                                        className="rich-text-content text-sm leading-relaxed text-gray-700 [&_p]:my-2 [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2"
                                        dangerouslySetInnerHTML={{ __html: ensureHtml(overviewHtml) }}
                                    />

                                </div>
                                <div className="flex flex-wrap justify-end gap-3 pt-6"><CurfewButton variant="secondary" onClick={() => setView('FOLDERS')} className="rounded-md px-6 py-2.5 text-sm font-semibold shadow-sm">{t('back_to_curfew_folders')}</CurfewButton><CurfewButton variant="primary" onClick={() => setView('LIST')} className="rounded-md px-8 py-2.5 text-sm font-semibold shadow-sm">{t('ok')}</CurfewButton></div>
                            </>
                        )}
                    </div>
                    <div className="border-t border-gray-200 px-6 py-5 md:px-8 flex justify-end bg-gray-50 shrink-0"><CurfewButton variant="secondary" onClick={() => setView('LIST')} className="rounded-md px-6 py-2.5 text-sm font-semibold shadow-sm">{t('back_to_curfew_logs')}</CurfewButton></div>
                </section>
            </div>
        )}

        {/* --- MODAL: ADD CURFEW NOTES --- */}
        {showAddNotesModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-[#2563eb] px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3"><Folder className="text-white opacity-80" size={24} /><h2 className="text-lg font-black text-white tracking-wider uppercase">{t('add_curfew_notes_title')}</h2></div>
                        <button onClick={handleCloseAddNotesModal} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20} strokeWidth={3} /></button>
                    </div>
                    <form onSubmit={handleAddNotes} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="mb-2 block text-sm font-extrabold text-[#1e293b]">{t('date')}</label><div className="relative"><input type="text" value={currentDateTime.date} readOnly className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 font-bold outline-none cursor-not-allowed bg-gray-50" /><Calendar className="absolute right-4 top-3.5 text-gray-400" size={18} /></div></div>
                            <div><label className="mb-2 block text-sm font-extrabold text-[#1e293b]">{t('time')}</label><div className="relative"><input type="text" value={currentDateTime.time} readOnly className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 font-bold outline-none cursor-not-allowed bg-gray-50" /><Clock className="absolute right-4 top-3.5 text-gray-400" size={18} /></div></div>
                        </div>
                        <div><label className="mb-2 block text-sm font-extrabold text-[#1e293b]">{t('notes')}</label><textarea placeholder={t('enter_curfew_notes')} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 font-medium placeholder-gray-400 focus:border-[#2563eb] outline-none transition-colors min-h-[140px] resize-y" value={notesForm.content} onChange={e => setNotesForm({...notesForm, content: e.target.value})} /></div>
                        <div className="flex justify-end gap-3 pt-2"><CurfewButton variant="outline" onClick={handleCloseAddNotesModal} className="rounded-xl px-8 py-3 text-sm font-extrabold">{t('cancel')}</CurfewButton><CurfewButton variant="primary" type="submit" className="rounded-xl px-8 py-3 text-sm font-extrabold">{t('add_notes')}</CurfewButton></div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL: NEW CURFEW VIOLATION --- */}
        {showAddCurfewModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
<div className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-6 py-5 flex items-center gap-3">
  <Clock className="text-white" size={24} />
  <h2 className="text-xl font-bold text-white tracking-wide uppercase">{t('new_curfew')}</h2>
  <button onClick={handleCloseAddCurfewModal} className="ml-auto text-white/70 hover:text-white"><X size={24} /></button>
</div>
                    <form onSubmit={handleAddCurfew} className="p-8 space-y-6">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8"><label className="mb-2 block text-sm font-bold text-gray-700">{t('date')}</label><div className="relative"><input type="text" value={currentDateTime.date} readOnly className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 font-bold focus:outline-none cursor-not-allowed" /><Calendar className="absolute right-4 top-3.5 text-gray-400" size={18} /></div></div>
                            <div className="col-span-4"><label className="mb-2 block text-sm font-bold text-gray-700">{t('time')}</label><div className="relative"><input type="text" value={currentDateTime.time} readOnly className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 font-bold focus:outline-none cursor-not-allowed text-center" /><Clock className="absolute right-4 top-3.5 text-gray-400" size={18} /></div></div>
                        </div>
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8"><ResidentAutocomplete value={curfewForm.resident} onChange={handleResidentChange} onSelect={handleResidentSelect} onBlur={handleResidentBlur} placeholder={t('full_name') || "Full Name"} label={t('resident_name_caps').replace(' :', '')} required={false} /></div>
                            <div className="col-span-4"><label className="mb-2 block text-sm font-bold text-gray-700">{t('age')}</label><input type="text" placeholder={ageLoading ? t('fetching_age') || 'Calculating age...' : t('age') || 'Age will be populated automatically'} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all cursor-not-allowed" value={curfewForm.age} readOnly /></div>
                        </div>
                        <div><label className="mb-2 block text-sm font-bold text-gray-700">{t('address')}</label><input type="text" placeholder={t('input_full_address')} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all" value={curfewForm.address} onChange={e => setCurfewForm({...curfewForm, address: e.target.value})} /></div>
                        <div className="flex justify-end gap-3 pt-4"><CurfewButton variant="outlineLight" onClick={handleCloseAddCurfewModal} className="rounded-xl px-6 py-2.5 text-sm font-bold">{t('cancel')}</CurfewButton><CurfewButton variant="primary" type="submit" className="rounded-xl px-8 py-2.5 text-sm font-bold">{t('create')}</CurfewButton></div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}