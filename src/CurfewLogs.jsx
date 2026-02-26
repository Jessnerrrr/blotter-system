import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext';
import { Plus, Folder, MoreVertical, X, Calendar, Clock, Eye, Trash2, ChevronLeft, Link as LinkIcon, Image as ImageIcon, Edit } from 'lucide-react';

const DEFAULT_OVERVIEW = "The present case arises from the alleged violation of the city/state-imposed curfew, intended to maintain public safety and order. The petitioner contends that the respondent breached the curfew restrictions, thereby potentially endangering community welfare. The matter requires judicial consideration to determine whether the respondent's actions constitute a lawful exception or a contravention of the established curfew regulations.";

function ensureHtml(text) {
  if (!text || typeof text !== 'string') return '<p></p>';
  if (text.trim().startsWith('<')) return text;
  return '<p>' + text.replace(/\n/g, '</p><p>') + '</p>';
}

// --- SUCCESS ALERT COMPONENT ---
const SuccessAlert = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#1a3a8a] to-[#1b9ad4] px-4 py-3 shadow-lg">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        <button onClick={onClose} className="flex-shrink-0 text-white/80 hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function CurfewLogs() {
  const { t } = useLanguage();
  const [view, setView] = useState('LIST'); 
  const [selectedResident, setSelectedResident] = useState(null);
  
  // --- GLOBALLY SYNCED STATE ---
  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('curfew_violations');
    if (saved && saved !== '[]') {
      return JSON.parse(saved);
    }
    return []; // No mock data! Start empty.
  });

  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('curfew_folders');
    if (saved && saved !== '[]') {
      return JSON.parse(saved);
    }
    return []; // No mock data! Start empty.
  });

  // Sync to LocalStorage and trigger Analytics updates whenever rows or folders change
  useEffect(() => {
    localStorage.setItem('curfew_violations', JSON.stringify(rows));
    window.dispatchEvent(new Event('storage')); // Triggers update in Analytics
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('curfew_folders', JSON.stringify(folders));
    window.dispatchEvent(new Event('storage')); // Triggers update in Analytics
  }, [folders]);

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderActionDropdown, setFolderActionDropdown] = useState(null);
  
  // Modals & Alerts
  const [showAddCurfewModal, setShowAddCurfewModal] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(null);

  // Forms
  const [curfewForm, setCurfewForm] = useState({ resident: '', address: '', age: '' });
  const [notesForm, setNotesForm] = useState({ content: '' });

  // --- OVERVIEW EDITOR STATE ---
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewHtml, setOverviewHtml] = useState(() => ensureHtml(DEFAULT_OVERVIEW));
  const [draftOverviewHtml, setDraftOverviewHtml] = useState(() => ensureHtml(DEFAULT_OVERVIEW));
  const [overviewDate, setOverviewDate] = useState('');
  const [formatActive, setFormatActive] = useState({ bold: false, italic: false, underline: false });

  const editorRef = useRef(null);
  const fileInputLinkRef = useRef(null);
  const fileInputImageRef = useRef(null);
  const savedSelectionRef = useRef(null);

  // --- REALTIME CLOCK STATE ---
  const [currentDateTime, setCurrentDateTime] = useState({
    time: '',
    date: '',
    rawDate: '',
    htmlDate: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateString = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const rawDateString = now.toISOString().split('T')[0];

      setCurrentDateTime({
        time: timeString,
        date: dateString,
        rawDate: rawDateString,
        htmlDate: rawDateString
      });
    };

    updateTime(); 
    const timer = setInterval(updateTime, 1000); 
    return () => clearInterval(timer); 
  }, []);

  // --- OVERVIEW EDITOR FUNCTIONS ---
  const syncContent = useCallback(() => {
    if (editorRef.current) setDraftOverviewHtml(editorRef.current.innerHTML);
  }, []);

  const updateFormatState = useCallback(() => {
    try {
      setFormatActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    } catch {
      // ignore when selection is outside editor
    }
  }, []);

  useEffect(() => {
    if (isEditingOverview && editorRef.current) {
      editorRef.current.innerHTML = ensureHtml(draftOverviewHtml);
    }
  }, [isEditingOverview]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel.rangeCount) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    const range = savedSelectionRef.current;
    if (range && editorRef.current) {
      sel.removeAllRanges();
      try {
        sel.addRange(range);
      } catch {
        // range may be invalid
      }
    }
  }, []);

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

  const handleToolbarMouseDown = (e) => {
    e.preventDefault();
    saveSelection();
  };

  const handleLinkClick = () => fileInputLinkRef.current?.click();
  const handleImageClick = () => fileInputImageRef.current?.click();

  const handleLinkFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    const url = URL.createObjectURL(file);
    const sel = window.getSelection();
    if (sel.toString()) {
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener">${file.name}</a>`);
    }
    syncContent();
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/') || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    const url = URL.createObjectURL(file);
    document.execCommand('insertImage', false, url);
    syncContent();
  };

  const handleEditOverviewClick = () => {
    setDraftOverviewHtml(overviewHtml);
    setIsEditingOverview(true);
  };

  const handleSaveOverview = () => {
    Swal.fire({
      title: t('confirm_save_title') || 'Save Changes?',
      text: t('confirm_save_text') || 'Are you sure you want to save this record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes_save') || 'Yes, save it!',
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        setOverviewHtml(draftOverviewHtml);
        
        // Update the notes in the specific folder
        const updatedFolders = folders.map(f => 
          f.id === selectedFolder.id ? { ...f, notes: draftOverviewHtml } : f
        );
        setFolders(updatedFolders);
        
        setIsEditingOverview(false);
        triggerAlert(t('case_overview_saved'));
      }
    });
  };

  const handleCancelOverview = () => {
    Swal.fire({
      title: t('discard_changes'),
      text: t('unsaved_lost'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('yes_discard'),
      cancelButtonText: t('no_keep')
    }).then((result) => {
      if (result.isConfirmed) {
        setDraftOverviewHtml(overviewHtml);
        setIsEditingOverview(false);
      }
    });
  };

  // --- HANDLERS ---
  const triggerAlert = (msg) => {
    setAlertMessage(msg);
    setShowSuccessAlert(true);
  };

  const handleAddCurfew = (e) => {
    e.preventDefault();
    if (!curfewForm.resident || !curfewForm.age || !curfewForm.address) {
        Swal.fire({
            title: t('incomplete_fields'),
            text: t('fill_all_required'),
            icon: 'error',
            confirmButtonColor: '#d33'
        });
        return;
    }
    
    Swal.fire({
      title: t('confirm_save_title') || 'Save Changes?',
      text: t('confirm_save_text') || 'Are you sure you want to save this record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes_save') || 'Yes, save it!',
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        // Find highest ID
        let maxId = 0;
        rows.forEach(r => {
            const num = parseInt(r.id, 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        });
        const newId = String(maxId + 1).padStart(2, '0');

        const newRecord = { 
            id: newId, 
            ...curfewForm, 
            time: currentDateTime.time, 
            date: currentDateTime.rawDate, // Using standardized ISO date format
            status: 'Unsettled' 
        };

        setRows([newRecord, ...rows]); // Add to top of list
        setCurfewForm({ resident: '', address: '', age: '' });
        setShowAddCurfewModal(false);
        Swal.fire('Added!', `${t('swal_added')} ${curfewForm.resident}`, 'success');
      }
    });
  };

  const handleCloseAddCurfewModal = () => {
    if (curfewForm.resident || curfewForm.age || curfewForm.address) {
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
            if (result.isConfirmed) {
                setCurfewForm({ resident: '', address: '', age: '' });
                setShowAddCurfewModal(false);
            }
        });
    } else {
        setShowAddCurfewModal(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setStatusMenuOpen(null);
    if (newStatus === 'Settled') {
        Swal.fire({
            title: t('swal_lift_restriction') || 'Settle & Archive?',
            text: t('swal_move_archives')?.replace('{name}', 'this record') || "Marking this as Settled will move the file to Archives.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: t('swal_yes_lift') || 'Yes, Settle it'
        }).then((result) => {
            if (result.isConfirmed) {
                // Update status to Settled (Archived), keep it in data for analytics but you can filter it out of active list if you want
                const updatedRows = rows.map(r => r.id === id ? { ...r, status: 'Settled' } : r);
                setRows(updatedRows);
                Swal.fire(t('swal_restriction_lifted') || 'Archived!', t('swal_record_moved') || 'Moved to Archives.', 'success');
            }
        });
    } else {
        const updatedRows = rows.map(r => r.id === id ? { ...r, status: newStatus } : r);
        setRows(updatedRows);
    }
  };

  const openAddNotesModal = () => {
      setNotesForm({ content: '' });
      setShowAddNotesModal(true);
  };

  const handleAddNotes = (e) => {
      e.preventDefault();
      if (!notesForm.content) {
          Swal.fire({
              title: t('incomplete_fields'),
              text: t('fill_all_required'),
              icon: 'error',
              confirmButtonColor: '#d33'
          });
          return;
      }
      
      Swal.fire({
        title: t('confirm_save_title') || 'Save Changes?',
        text: t('confirm_save_text') || 'Are you sure you want to save this record?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        confirmButtonText: t('yes_save') || 'Yes, save it!',
        cancelButtonText: t('cancel')
      }).then((result) => {
        if (result.isConfirmed) {
          const newFolderCount = folders.filter(f => f.residentId === selectedResident.id).length + 1;
          const newFolder = {
              id: Date.now().toString(),
              residentId: selectedResident.id,
              name: `CURFEW ${newFolderCount}`,
              date: currentDateTime.date,
              time: currentDateTime.time,
              notes: notesForm.content
          };
          setFolders([...folders, newFolder]);
          setShowAddNotesModal(false);
          triggerAlert(t('curfew_notes_added'));
        }
      });
  };

  const handleCloseAddNotesModal = () => {
    if (notesForm.content) {
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
            if (result.isConfirmed) {
                setNotesForm({ content: '' });
                setShowAddNotesModal(false);
            }
        });
    } else {
        setShowAddNotesModal(false);
    }
  };

  const handleDeleteFolder = (folderId) => {
      setFolderActionDropdown(null);
      Swal.fire({
          title: t('delete_folder_title'),
          text: t('delete_folder_text'),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: t('yes_delete'),
          cancelButtonText: t('cancel')
      }).then((result) => {
          if (result.isConfirmed) {
              setFolders(folders.filter(f => f.id !== folderId));
              Swal.fire(t('note_deleted'), '', 'success');
          }
      });
  };

  const handleViewFolder = (folder) => {
      setFolderActionDropdown(null);
      setSelectedFolder(folder);
      
      setOverviewHtml(folder.notes ? ensureHtml(folder.notes) : ensureHtml(DEFAULT_OVERVIEW));
      setOverviewDate(folder.date || currentDateTime.rawDate);
      setIsEditingOverview(false);
      setView('OVERVIEW');
  };

  const handlePageClick = () => {
      setStatusMenuOpen(null);
      setFolderActionDropdown(null);
  };

  const residentFolders = folders.filter(f => f.residentId === (selectedResident?.id || ''));
  // Optionally filter out 'Settled' records from the main view if they are considered "Archived"
  const activeRows = rows.filter(r => r.status !== 'Settled');

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={handlePageClick}>
      
      {/* Success Alert */}
      {showSuccessAlert && (
        <SuccessAlert 
          message={alertMessage} 
          onClose={() => setShowSuccessAlert(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        
        {/* --- VIEW: LIST --- */}
        {view === 'LIST' && (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="flex items-center justify-between rounded-t-2xl bg-[#2563eb] px-8 py-6 text-white shadow-md shrink-0">
              <h1 className="text-2xl font-bold uppercase tracking-wide">{t('curfew_violations')}</h1>
              <button onClick={(e) => { e.stopPropagation(); setShowAddCurfewModal(true); }} className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-bold shadow hover:bg-white/30 transition-all">
                {t('add_violation')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full p-4">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold uppercase text-[#2563eb] text-xs">{t('no')}</th>
                    <th className="px-6 py-4 text-left font-bold uppercase text-[#2563eb] text-xs">{t('resident_name_caps').replace(' :', '')}</th>
                    <th className="px-6 py-4 text-left font-bold uppercase text-[#2563eb] text-xs">{t('address')}</th>
                    <th className="px-6 py-4 text-center font-bold uppercase text-[#2563eb] text-xs">{t('age')}</th>
                    <th className="px-6 py-4 text-center font-bold uppercase text-[#2563eb] text-xs">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRows.length > 0 ? activeRows.map((row) => (
                    <tr key={row.id} onClick={() => { setSelectedResident(row); setView('FOLDERS'); }} className="cursor-pointer hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-5 text-center text-sm font-bold text-[#2563eb]">{row.id}</td>
                      <td className="px-6 py-5 font-bold text-gray-800">{row.resident}</td>
                      <td className="px-6 py-5 text-sm text-gray-500">{row.address}</td>
                      <td className="px-6 py-5 text-center font-bold text-gray-700">{row.age}</td>
                      <td className="relative px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => setStatusMenuOpen(statusMenuOpen === row.id ? null : row.id)}
                            className={`rounded-full px-5 py-1.5 text-xs font-bold text-white shadow-sm ${row.status === 'Settled' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#ef4444] hover:bg-red-600'} transition-colors`}
                        >
                            {row.status === 'Settled' ? t('settled').toUpperCase() : t('unsettled').toUpperCase()}
                        </button>
                        {statusMenuOpen === row.id && (
                            <div className="absolute right-1/4 top-12 z-20 flex flex-col gap-1 rounded-xl border bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 w-40">
                                <button onClick={() => handleStatusChange(row.id, 'Settled')} className="px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">{t('mark_settled')}</button>
                                <button onClick={() => handleStatusChange(row.id, 'Unsettled')} className="px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">{t('mark_unsettled')}</button>
                            </div>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">No active curfew records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* --- VIEW: FOLDERS --- */}
        {view === 'FOLDERS' && selectedResident && (
          <div className="flex-1 flex flex-col w-full h-full animate-in fade-in duration-300">
            
            <div className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#2563eb] cursor-pointer w-fit transition-colors" onClick={() => setView('LIST')}>
                <ChevronLeft size={20} />
                <span className="font-bold text-sm uppercase">{t('back')}</span>
            </div>

            <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm">
                  {t('curfew_no')} {selectedResident.id}
                </span>
                <span className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm">
                  {t('resident_name_caps')} {selectedResident.resident.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openAddNotesModal(); }}
                className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#1a3a8a] to-[#1b9ad4] px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
              >
                <Folder size={18} fill="currentColor" />
                <span>{t('add_curfew_notes')}</span>
              </button>
            </div>

            <section className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md flex flex-col">
              <div className="flex items-center justify-between bg-blue-700 px-6 py-4 text-white shadow-sm shrink-0">
                <span className="font-bold uppercase tracking-wide">{t('curfew_folders')}</span>
                <span className="font-bold uppercase tracking-wide">{t('actions')}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {residentFolders.length > 0 ? residentFolders.map((folder, i) => (
                    <li key={folder.id} className="flex items-center justify-between bg-white px-6 py-4 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-4">
                        <Folder size={28} fill="#60a5fa" className="text-[#3b82f6]" />
                        <span className="font-medium text-slate-800">{folder.name}</span>
                      </div>
                      
                      <div className="relative">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          onClick={(e) => { e.stopPropagation(); setFolderActionDropdown(folderActionDropdown === folder.id ? null : folder.id); }}
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {folderActionDropdown === folder.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-md border border-gray-200 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 w-40">
                            <button
                              type="button"
                              className="rounded-md px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors mx-1 flex items-center"
                              onClick={() => handleViewFolder(folder)}
                            >
                              <Eye size={16} className="mr-2" /> {t('view')}
                            </button>
                            <div className="h-px bg-gray-100 w-full my-0.5"></div>
                            <button
                              type="button"
                              className="rounded-md px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors mx-1 flex items-center"
                              onClick={() => handleDeleteFolder(folder.id)}
                            >
                              <Trash2 size={16} className="mr-2" /> {t('delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  )) : (
                    <div className="flex items-center justify-center h-40 text-gray-400 font-medium">
                      {t('no_folders')}
                    </div>
                  )}
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* --- VIEW: OVERVIEW EDITOR --- */}
        {view === 'OVERVIEW' && selectedFolder && (
            <div className="flex-1 flex flex-col w-full h-full animate-in fade-in duration-300">
                <section className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 flex-1 flex flex-col">
                    
                    <div className="rounded-t-2xl bg-blue-700 px-8 py-6 text-white shadow-md shrink-0">
                        <h1 className="text-2xl font-bold uppercase tracking-wide md:text-3xl">
                            {t('curfew_overview_title').replace('{num}', selectedFolder.name.replace('CURFEW ', ''))}
                        </h1>
                        <p className="mt-2 text-base text-white/95">
                            {t('curfew_overview_subtitle')}
                        </p>
                    </div>

                    <div className="space-y-5 p-6 md:p-8 flex-1 overflow-y-auto">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <span className="rounded-full border border-blue-700 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 uppercase">
                                {selectedFolder.name}
                            </span>

                            <div className="flex items-center gap-3">
                                {isEditingOverview ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-blue-700">{t('date')}</span>
                                        <input
                                            type="date"
                                            value={overviewDate}
                                            onChange={(e) => setOverviewDate(e.target.value)}
                                            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                                        />
                                    </div>
                                ) : (
                                    <span className="rounded-full border border-blue-700 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                                        {t('date')}: {overviewDate}
                                    </span>
                                )}

                                {!isEditingOverview && (
                                    <button
                                        type="button"
                                        onClick={handleEditOverviewClick}
                                        className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                    >
                                        <Edit size={16} />
                                        {t('edit_case_overview')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditingOverview ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                                    {t('curfew_overview_label')}
                                </h3>

                                <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-600 transition-colors">
                                    {/* Editor content area first */}
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={syncContent}
                                        onKeyUp={updateFormatState}
                                        onMouseUp={updateFormatState}
                                        data-placeholder={t('type_overview_here')}
                                        className="min-h-[14rem] w-full p-4 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                                    />
                                    
                                    {/* Toolbar moved to the bottom */}
                                    <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center gap-1 text-gray-500">
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyFormat('bold')} className={`rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors ${formatActive.bold ? 'bg-gray-200 text-blue-600' : ''}`} title="Bold">
                                            <span className="font-bold font-serif text-lg leading-none px-1">B</span>
                                        </button>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyFormat('italic')} className={`rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors ${formatActive.italic ? 'bg-gray-200 text-blue-600' : ''}`} title="Italic">
                                            <span className="italic font-serif text-lg leading-none px-1.5">I</span>
                                        </button>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyFormat('underline')} className={`rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors ${formatActive.underline ? 'bg-gray-200 text-blue-600' : ''}`} title="Underline">
                                            <span className="underline font-serif text-lg leading-none px-1">U</span>
                                        </button>
                                        <div className="w-px h-5 bg-gray-300 mx-2"></div>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={handleLinkClick} className="rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors" title="Attach Link">
                                            <LinkIcon size={18} />
                                        </button>
                                        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={handleImageClick} className="rounded p-1.5 hover:bg-gray-200 hover:text-gray-700 transition-colors" title="Insert Image">
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>
                                    
                                    <input ref={fileInputLinkRef} type="file" className="hidden" accept="*/*" onChange={handleLinkFileSelect} />
                                    <input ref={fileInputImageRef} type="file" className="hidden" accept="image/*" onChange={handleImageFileSelect} />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button onClick={handleCancelOverview} className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                        {t('cancel')}
                                    </button>
                                    <button onClick={handleSaveOverview} className="rounded-md bg-blue-600 px-8 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">
                                        {t('save')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg border-2 border-blue-600 bg-white p-6 shadow-sm">
                                    <div
                                        className="text-sm leading-relaxed text-gray-700 [&_p]:my-2 [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
                                        dangerouslySetInnerHTML={{ __html: ensureHtml(overviewHtml) }}
                                    />
                                </div>

                                <div className="flex flex-wrap justify-end gap-3 pt-6">
                                    <button onClick={() => setView('FOLDERS')} className="rounded-md bg-gray-400 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-500 transition-colors shadow-sm">
                                        {t('back_to_curfew_folders')}
                                    </button>
                                    <button onClick={() => setView('LIST')} className="rounded-md bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">
                                        {t('ok')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="border-t border-gray-200 px-6 py-5 md:px-8 flex justify-end bg-gray-50 shrink-0">
                        <button onClick={() => setView('LIST')} className="rounded-md bg-gray-400 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-500 transition-colors shadow-sm">
                            {t('back_to_curfew_logs')}
                        </button>
                    </div>
                </section>
            </div>
        )}

        {/* --- MODAL: ADD CURFEW NOTES --- */}
        {showAddNotesModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-[#2563eb] px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Folder className="text-white opacity-80" size={24} />
                            <h2 className="text-lg font-black text-white tracking-wider uppercase">{t('add_curfew_notes_title')}</h2>
                        </div>
                        <button onClick={handleCloseAddNotesModal} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <form onSubmit={handleAddNotes} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="mb-2 block text-sm font-extrabold text-[#1e293b]">{t('date')}</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={currentDateTime.date} 
                                        readOnly 
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 font-bold outline-none cursor-not-allowed bg-gray-50" 
                                    />
                                    <Calendar className="absolute right-4 top-3.5 text-gray-400" size={18} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="mb-2 block text-sm font-extrabold text-[#1e293b]">{t('time')}</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={currentDateTime.time} 
                                        readOnly 
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 font-bold outline-none cursor-not-allowed bg-gray-50" 
                                    />
                                    <Clock className="absolute right-4 top-3.5 text-gray-400" size={18} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-extrabold text-[#1e293b]">{t('notes')}</label>
                            <textarea 
                                placeholder={t('enter_curfew_notes')} 
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-700 font-medium placeholder-gray-400 focus:border-[#2563eb] outline-none transition-colors min-h-[140px] resize-y" 
                                value={notesForm.content} 
                                onChange={e => setNotesForm({...notesForm, content: e.target.value})} 
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleCloseAddNotesModal} className="rounded-xl border-2 border-gray-200 bg-white px-8 py-3 text-sm font-extrabold text-gray-600 hover:bg-gray-50 transition-colors">
                                {t('cancel')}
                            </button>
                            <button type="submit" className="rounded-xl bg-[#2563eb] px-8 py-3 text-sm font-extrabold text-white hover:bg-[#1d4ed8] shadow-md transition-colors">
                                {t('add_notes')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL: NEW CURFEW VIOLATION --- */}
        {showAddCurfewModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-6 py-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <Clock className="text-white" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-wide uppercase">{t('new_curfew')}</h2>
                        <button onClick={handleCloseAddCurfewModal} className="ml-auto text-white/70 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleAddCurfew} className="p-8 space-y-6">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8">
                                <label className="mb-2 block text-sm font-bold text-gray-700">{t('date')}</label>
                                <div className="relative">
                                    <input type="text" value={currentDateTime.date} readOnly className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 font-bold focus:outline-none cursor-not-allowed" />
                                    <Calendar className="absolute right-4 top-3.5 text-gray-400" size={18} />
                                </div>
                            </div>
                            <div className="col-span-4">
                                <label className="mb-2 block text-sm font-bold text-gray-700">{t('time')}</label>
                                <div className="relative">
                                    <input type="text" value={currentDateTime.time} readOnly className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 font-bold focus:outline-none cursor-not-allowed text-center" />
                                    <Clock className="absolute right-4 top-3.5 text-gray-400" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8">
                                <label className="mb-2 block text-sm font-bold text-gray-700">{t('resident_name_caps').replace(' :', '')}</label>
                                <input type="text" placeholder={t('full_name') || "Full Name"} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all" value={curfewForm.resident} onChange={e => setCurfewForm({...curfewForm, resident: e.target.value})} />
                            </div>
                            <div className="col-span-4">
                                <label className="mb-2 block text-sm font-bold text-gray-700">{t('age')}</label>
                                <input type="text" placeholder={t('input_age')} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all" value={curfewForm.age} onChange={e => setCurfewForm({...curfewForm, age: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">{t('address')}</label>
                            <input type="text" placeholder={t('input_full_address')} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all" value={curfewForm.address} onChange={e => setCurfewForm({...curfewForm, address: e.target.value})} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={handleCloseAddCurfewModal} className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                            <button type="submit" className="rounded-xl bg-[#2563eb] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#1d4ed8] transition-colors shadow-md">{t('create')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}