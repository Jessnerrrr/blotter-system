import React, { useState, useEffect, useRef } from 'react';
import { Folder, List, MoreVertical, ChevronLeft, Plus, ClipboardList, Edit, Calendar, Save, X, Bold, Italic, Underline, Link, Clock, Eye, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

// Reusable Gradient Class
const gradientBgClass = "bg-gradient-to-r from-[#0066FF] to-[#0099FF]";

export default function Summons() {
  // --- STATE ---
  const [summonsList, setSummonsList] = useState([]);
  const [view, setView] = useState('LIST'); // 'LIST', 'FOLDER', 'OVERVIEW', 'NOTE_DETAIL', 'NOTE_EDIT'
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSummon, setSelectedSummon] = useState(null);
  
  // NOTE LOGIC STATE
  // We initialize with the existing notes shown in your screenshots (1, 2, 4, 5, 6)
  const [caseNotes, setCaseNotes] = useState([1, 2, 4, 5, 6]); 
  const [selectedNote, setSelectedNote] = useState(null); 
  
  const [activeActionDropdown, setActiveActionDropdown] = useState(null);

  // Modal State for Action Confirmation
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, caseNo: null });
  
  // Modal State for View Status
  const [previewModal, setPreviewModal] = useState({ isOpen: false, data: null });
  const [previewEditing, setPreviewEditing] = useState(false); 
  const [tempStatus, setTempStatus] = useState(''); 

  // Form State for Editing Notes
  const [editDate, setEditDate] = useState('');
  
  // Ref for the contentEditable div
  const editorRef = useRef(null);
  const [savedSummaryHtml, setSavedSummaryHtml] = useState('');

  // --- LOAD DATA & NORMALIZE STATUS ---
  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('summons') || '[]');
    const normalizedData = rawData.map(item => {
        let status = item.status || 'Pending';
        if (status === 'Active' || status === 'PENDING') status = 'Pending';
        return { ...item, status };
    });
    setSummonsList(normalizedData);
  }, []);

  // --- LOGIC: GROUP BY CASE NUMBER ---
  const uniqueCases = Object.values(summonsList.reduce((acc, current) => {
    if (!acc[current.caseNo]) {
      acc[current.caseNo] = current;
    }
    return acc;
  }, {}));

  // --- HANDLERS ---
  const handleOpenFolder = (caseItem) => {
    setSelectedCase(caseItem);
    setView('FOLDER');
  };

  const handleOpenSummonDetail = (summonItem) => {
    setSelectedSummon(summonItem);
    setView('OVERVIEW');
  };

  // --- AUTO-INCREMENT ADD NOTE LOGIC ---
  const handleAddNote = () => {
    // Calculate the next number: Max existing number + 1
    const maxNote = caseNotes.length > 0 ? Math.max(...caseNotes) : 0;
    const nextId = maxNote + 1;

    setSelectedNote(nextId); // Set the new ID (e.g., 7)
    
    // Set Realtime Date
    const today = new Date().toISOString().split('T')[0]; 
    setEditDate(today); 
    
    setSavedSummaryHtml(''); // Start blank
    setView('NOTE_EDIT');
  };

  // Handler for VIEWING an existing note
  const handleOpenNoteDetail = (noteId) => {
    setSelectedNote(noteId);
    // Default date if none exists
    if (!editDate) {
        const today = new Date().toISOString().split('T')[0];
        setEditDate(today);
    }
    // Mock content if empty
    if (!savedSummaryHtml || selectedNote !== noteId) {
        setSavedSummaryHtml('This section provides an overview of the selected case.<br><br>It records the facts, responses of parties, and any next steps identified during mediation.');
    }
    setView('NOTE_DETAIL');
  };

  const handleEditNote = () => {
    setView('NOTE_EDIT');
    setTimeout(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = savedSummaryHtml;
        }
    }, 0);
  };

  const handleSaveNote = () => {
    if (editorRef.current) {
        setSavedSummaryHtml(editorRef.current.innerHTML);
    }

    // If this is a new note (not in the list yet), add it
    if (!caseNotes.includes(selectedNote)) {
        setCaseNotes(prev => [...prev, selectedNote].sort((a,b) => a - b));
    }

    Swal.fire({
      title: 'Saved!',
      text: 'Case note has been saved.',
      icon: 'success',
      confirmButtonColor: '#0066FF'
    });
    // Go back to overview after saving (acting as OK)
    setView('OVERVIEW'); 
  };

  const handleCancelEdit = () => {
    Swal.fire({
      title: 'Discard Changes?',
      text: "Any unsaved changes will be lost.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, discard',
      cancelButtonText: 'No, keep editing'
    }).then((result) => {
      if (result.isConfirmed) {
        // If it was a new note that wasn't saved, we don't add it to the list
        setView('OVERVIEW'); 
      }
    });
  };

  const handleBackToList = () => { setSelectedCase(null); setView('LIST'); };
  const handleBackToFolder = () => { setSelectedSummon(null); setView('FOLDER'); };
  
  // Simple Back handler for View Mode
  const handleCloseNote = () => { setView('OVERVIEW'); };

  const toggleActionDropdown = (caseNo) => {
    if (activeActionDropdown === caseNo) {
      setActiveActionDropdown(null);
    } else {
      setActiveActionDropdown(caseNo);
    }
  };

  // --- MODAL HANDLERS ---
  const handleActionSelect = (action, caseItem) => {
    if (caseItem.status !== 'Pending') return; 
    setActiveActionDropdown(null); 
    setConfirmModal({ isOpen: true, action: action, caseNo: caseItem.caseNo }); 
  };

  const handleViewStatus = (caseItem) => {
    setActiveActionDropdown(null);
    setPreviewEditing(false); 
    setTempStatus(caseItem.status || 'Pending');
    setPreviewModal({ isOpen: true, data: caseItem });
  };

  // --- ARCHIVE LOGIC ---
  const archiveCase = (caseNo) => {
    const caseToArchive = summonsList.find(item => item.caseNo === caseNo);
    if (!caseToArchive) return;

    const currentArchives = JSON.parse(localStorage.getItem('archived_cases') || '[]');
    const archivedRecord = { 
        ...caseToArchive, 
        status: 'Settled', 
        archivedDate: new Date().toLocaleDateString() 
    };
    localStorage.setItem('archived_cases', JSON.stringify([...currentArchives, archivedRecord]));

    const updatedList = summonsList.filter(item => item.caseNo !== caseNo);
    setSummonsList(updatedList);
    localStorage.setItem('summons', JSON.stringify(updatedList));
  };

  // --- EXECUTE STATUS UPDATE ---
  const executeStatusUpdate = () => {
    setConfirmModal({ isOpen: false, action: null, caseNo: null });

    if (confirmModal.action === 'Settled') {
        archiveCase(confirmModal.caseNo);
        Swal.fire({
            title: 'Case Settled!',
            text: `Case ${confirmModal.caseNo} has been moved to the Archive.`,
            icon: 'success',
            confirmButtonColor: '#0066FF'
        });
    } else {
        const updatedList = summonsList.map(item => 
            item.caseNo === confirmModal.caseNo ? { ...item, status: confirmModal.action } : item
        );
        setSummonsList(updatedList);
        localStorage.setItem('summons', JSON.stringify(updatedList));

        Swal.fire({
            title: 'Status Updated!',
            text: `Case ${confirmModal.caseNo} marked as ${confirmModal.action}.`,
            icon: 'success',
            confirmButtonColor: '#0066FF'
        });
    }
  };

  const handlePreviewSaveClick = () => {
    Swal.fire({
      title: 'Save Changes?',
      text: "Are you sure you want to update the case status?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0066FF',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!'
    }).then((result) => {
      if (result.isConfirmed) {
        performSaveStatus();
      }
    });
  };

  const performSaveStatus = () => {
    if (tempStatus === 'Settled') {
        archiveCase(previewModal.data.caseNo);
        setPreviewModal({ isOpen: false, data: null }); 
        Swal.fire({
            title: 'Case Settled!',
            text: 'The case has been successfully settled and moved to the Archive.',
            icon: 'success',
            confirmButtonColor: '#0066FF'
        });
    } else {
        const updatedList = summonsList.map(item => 
            item.caseNo === previewModal.data.caseNo ? { ...item, status: tempStatus } : item
        );
        setSummonsList(updatedList);
        localStorage.setItem('summons', JSON.stringify(updatedList));
        setPreviewModal({ ...previewModal, data: { ...previewModal.data, status: tempStatus }});
        setPreviewEditing(false);
        Swal.fire({
            title: 'Updated!',
            text: 'Case status has been successfully modified.',
            icon: 'success',
            confirmButtonColor: '#0066FF'
        });
    }
  };

  // --- EDITOR TOOLBAR FUNCTIONS ---
  const applyCommand = (e, command, value = null) => {
    e.preventDefault(); 
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    const url = prompt("Enter the link URL:");
    if (url) document.execCommand('createLink', false, url);
  };

  const handleInsertTime = (e) => {
    e.preventDefault();
    const now = new Date().toLocaleString();
    document.execCommand('insertText', false, `${now} `);
  };

  // ============================
  // RENDER: STATUS PREVIEW MODAL
  // ============================
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
                    <h3 className="text-3xl font-bold text-[#0066FF] mb-8">Case Preview</h3>
                    <div className="bg-slate-50 rounded-xl p-8 border border-gray-100 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <span className="text-gray-500 font-medium text-lg">Case Number</span>
                            <span className="text-[#0066FF] font-bold text-xl tracking-wide">{data.caseNo}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <span className="text-gray-500 font-medium text-lg">Resident Name</span>
                            <span className="text-gray-800 font-extrabold text-xl">{data.residentName}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <span className="text-gray-500 font-medium text-lg">Filed Date</span>
                            <span className="text-gray-800 font-medium text-xl">{data.summonDate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 min-h-[50px]">
                            <span className="text-gray-500 font-medium text-lg">Current Status</span>
                            {previewEditing ? (
                                <div className="relative">
                                    <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} className="appearance-none bg-white border-2 border-[#0066FF] text-gray-900 font-bold text-lg py-2 pl-6 pr-12 rounded-lg cursor-pointer outline-none shadow-sm hover:bg-blue-50 transition-colors">
                                        <option value="Settled">Settled</option>
                                        <option value="Escalated">Escalated</option>
                                        <option value="Blacklisted">Blacklisted</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0066FF] pointer-events-none" size={20} strokeWidth={3} />
                                </div>
                            ) : (
                                <span className={`${getStatusColor(tempStatus || data.status)} px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm`}>
                                    {tempStatus || data.status || 'PENDING'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center space-x-4 mt-10">
                        {previewEditing ? (
                            <>
                                <button onClick={() => { setPreviewEditing(false); setTempStatus(data.status); }} className="px-10 py-3 rounded-xl border-2 border-gray-300 text-gray-500 font-bold hover:bg-blue-50 hover:text-[#0066FF] hover:border-[#0066FF] transition-colors text-sm uppercase tracking-wide">Cancel</button>
                                <button onClick={handlePreviewSaveClick} className={`${gradientBgClass} text-white px-12 py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-all text-sm uppercase tracking-wide flex items-center`}><Save size={18} className="mr-2"/> Save Changes</button>
                            </>
                        ) : isPending ? (
                            <>
                                <button onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-10 py-3 rounded-xl border-2 border-gray-300 text-gray-500 font-bold hover:bg-blue-50 hover:text-[#0066FF] hover:border-[#0066FF] transition-colors text-sm uppercase tracking-wide">Cancel</button>
                                <button onClick={() => setPreviewModal({ isOpen: false, data: null })} className={`${gradientBgClass} text-white px-12 py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-all text-sm uppercase tracking-wide`}>OK</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-10 py-3 rounded-xl border-2 border-gray-300 text-gray-500 font-bold hover:bg-blue-50 hover:text-[#0066FF] hover:border-[#0066FF] transition-colors text-sm uppercase tracking-wide">Cancel</button>
                                <button onClick={() => setPreviewEditing(true)} className="bg-[#0066FF] hover:bg-[#0055EE] text-white px-12 py-3 rounded-xl font-bold shadow-md transition-all text-sm uppercase tracking-wide flex items-center"><Edit size={18} className="mr-2"/> Edit Status</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // ============================
  // RENDER: CONFIRMATION MODAL
  // ============================
  const renderConfirmationModal = () => {
    if (!confirmModal.isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-[#0066FF] transform scale-100 transition-all">
                <div className="p-8">
                    <h3 className="text-2xl font-bold text-[#0066FF] mb-4">Confirm Status Update</h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-2">
                        Are you sure you want to mark case <span className="font-bold text-[#0066FF] whitespace-nowrap">{confirmModal.caseNo}</span> as <span className="font-bold text-gray-800">{confirmModal.action}</span>?
                    </p>
                    {confirmModal.action === 'Settled' && (
                        <p className="text-green-600 font-bold text-sm bg-green-50 p-2 rounded-lg border border-green-100 mb-4 text-center">
                            This case will be moved to the Archive.
                        </p>
                    )}
                    <div className="flex justify-end space-x-3 mt-8">
                        <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-6 py-2.5 rounded-lg border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm uppercase tracking-wide">Cancel</button>
                        <button onClick={executeStatusUpdate} className={`${gradientBgClass} text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:opacity-90 transition-all text-sm uppercase tracking-wide`}>Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // ============================
  // VIEW: NOTE EDIT (Level 5) - ADDING/EDITING NOTE
  // ============================
  if (view === 'NOTE_EDIT' && selectedNote) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10 flex items-center justify-center">
        <div className="max-w-[1200px] w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative">
          <div className={`${gradientBgClass} p-10 text-white`}>
            <h2 className="text-3xl font-extrabold tracking-wide uppercase mb-2">CASE {selectedNote} OVERVIEW</h2>
            <p className="text-blue-100 text-lg font-medium">Official summary of the conducted summon session</p>
          </div>
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
               <span className="bg-white border-2 border-blue-100 text-[#0066FF] px-6 py-2 rounded-lg font-bold text-sm shadow-sm uppercase tracking-wide">CASE NO. {selectedNote}</span>
               <div className="flex items-center space-x-4">
                  <label className="text-[#0066FF] font-bold uppercase text-sm">Date</label>
                  <div className="relative">
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border-2 border-gray-200 rounded-lg py-2 px-4 pr-10 text-gray-600 font-medium focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]" />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
               </div>
            </div>
            <div className="mb-8">
               <h3 className="text-[#0066FF] font-bold text-sm uppercase mb-2">CASE OVERVIEW</h3>
               <div className="border-2 border-[#0066FF] rounded-lg overflow-hidden shadow-sm flex flex-col h-72">
                 <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center space-x-5 text-gray-500">
                    <button onMouseDown={(e) => applyCommand(e, 'bold')} className="hover:text-[#0066FF] p-1 rounded" title="Bold"><Bold size={18} /></button>
                    <button onMouseDown={(e) => applyCommand(e, 'italic')} className="hover:text-[#0066FF] p-1 rounded" title="Italic"><Italic size={18} /></button>
                    <button onMouseDown={(e) => applyCommand(e, 'underline')} className="hover:text-[#0066FF] p-1 rounded" title="Underline"><Underline size={18} /></button>
                    <div className="h-5 w-px bg-gray-300 mx-2"></div>
                    <button onMouseDown={handleInsertLink} className="hover:text-[#0066FF] p-1 rounded" title="Insert Link"><Link size={18} /></button>
                    <button onMouseDown={handleInsertTime} className="hover:text-[#0066FF] p-1 rounded" title="Insert Time"><Clock size={18} /></button>
                 </div>
                 <div className="relative flex-1 bg-white cursor-text" onClick={() => editorRef.current?.focus()}>
                    <div ref={editorRef} contentEditable className="w-full h-full p-6 text-lg text-gray-700 focus:outline-none overflow-y-auto" style={{ minHeight: '100%' }} />
                 </div>
               </div>
            </div>
            {/* UPDATED BUTTONS FOR EDIT MODE - JUST CANCEL AND OK */}
            <div className="flex justify-end space-x-3">
                <button onClick={handleCancelEdit} className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition-colors">Cancel</button>
                <button onClick={handleSaveNote} className={`${gradientBgClass} text-white px-10 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-opacity`}>OK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: NOTE DETAIL (Level 4 - Read Only)
  // ============================
  if (view === 'NOTE_DETAIL' && selectedNote) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10 flex items-center justify-center">
        <div className="max-w-[1200px] w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className={`${gradientBgClass} p-10 text-white`}>
            <h2 className="text-3xl font-extrabold tracking-wide uppercase mb-2">CASE {selectedNote} OVERVIEW</h2>
            <p className="text-blue-100 text-lg font-medium">Official summary of the conducted summon session</p>
          </div>
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex space-x-4">
                <span className="bg-white border-2 border-blue-100 text-[#0066FF] px-6 py-2 rounded-full font-bold text-sm shadow-sm uppercase tracking-wide">CASE NO. {selectedNote}</span>
                <span className="bg-white border-2 border-blue-100 text-gray-500 px-6 py-2 rounded-full font-bold text-sm shadow-sm uppercase tracking-wide">DATE: {editDate}</span>
              </div>
              <button onClick={handleEditNote} className="flex items-center text-[#0066FF] border-2 border-[#0066FF] px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors"><Edit size={18} className="mr-2" /> Edit Case Overview</button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-10 h-64 shadow-inner text-gray-600 text-lg leading-relaxed overflow-y-auto" dangerouslySetInnerHTML={{ __html: savedSummaryHtml }}></div>
            {/* UPDATED BUTTONS FOR DETAIL MODE */}
            <div className="flex justify-end space-x-4">
                <button onClick={handleCloseNote} className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-md transition-colors">Cancel</button>
                <button onClick={handleCloseNote} className={`${gradientBgClass} text-white px-10 py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-md hover:opacity-90 transition-opacity`}>OK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: SUMMON OVERVIEW (Level 3)
  // ============================
  if (view === 'OVERVIEW' && selectedSummon && selectedCase) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10">
        {renderConfirmationModal()}
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
             <div className="flex items-center mb-6">
                <button onClick={handleBackToFolder} className="flex items-center text-gray-500 hover:text-blue-700 transition-colors mr-4"><ChevronLeft size={32} /></button>
                <h2 className="text-4xl font-bold text-[#0066FF] tracking-wide uppercase">SUMMON {selectedSummon.summonType} OVERVIEW</h2>
             </div>
             <div className="flex space-x-4">
                <div className={`${gradientBgClass} text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide shadow-md`}>CASE NO. : {selectedCase.caseNo}</div>
                <div className={`${gradientBgClass} text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide shadow-md opacity-90`}>RESIDENT NAME : {selectedCase.residentName}</div>
             </div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-10 shadow-sm relative">
            <h3 className="text-[#0066FF] font-extrabold text-lg uppercase mb-3">SUMMON REASON :</h3>
            <p className="text-gray-700 text-lg leading-relaxed font-medium">{selectedSummon.summonReason || "No reason provided."}</p>
          </div>
          <div className="relative">
            <div className="flex items-end mb-0 w-full filter drop-shadow-md">
               <div className={`${gradientBgClass} text-white py-6 pl-12 pr-20 flex-1 relative z-10 h-[80px] flex items-center`} style={{ clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0% 100%)', borderTopLeftRadius: '1.5rem' }}>
                   <h3 className="text-3xl font-bold tracking-wide uppercase">CASE FOLDERS</h3>
               </div>
               {/* ADD NOTE BUTTON - Triggers Logic */}
               <button onClick={handleAddNote} className={`${gradientBgClass} text-white py-6 pl-16 pr-10 flex items-center hover:brightness-110 transition-all active:scale-95 h-[80px] -ml-2`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 40px 100%)', borderTopRightRadius: '1.5rem' }}>
                  <div className="relative w-9 h-10 mr-4 flex items-center justify-center">
                    <div className="absolute w-7 h-8 bg-white/30 rounded-[3px] rotate-6"></div>
                    <div className="absolute w-7 h-8 bg-white rounded-[3px] flex items-center justify-center shadow-sm z-10"><Plus className="text-[#0066FF]" size={20} strokeWidth={4} /></div>
                  </div>
                  <span className="text-xl font-bold pt-1 whitespace-nowrap">Add Case Notes</span>
               </button>
            </div>
            <div className="bg-white rounded-b-2xl shadow-xl border border-gray-200 relative pb-24 z-0 mt-[-1px]">
              <div className="divide-y divide-gray-100">
                {/* DYNAMIC CASE NOTES */}
                {caseNotes.map((num) => (
                  <div key={num} onClick={() => handleOpenNoteDetail(num)} className="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer group transition-colors">
                    <div className="flex items-center space-x-6">
                      <ClipboardList size={36} className="text-[#0066FF]" strokeWidth={1.5} />
                      <span className="text-xl font-bold text-gray-800 uppercase">CASE NOTE {num}</span>
                    </div>
                    <button className="text-gray-400 hover:text-[#0066FF]"><MoreVertical size={28} /></button>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-8 right-8">
                <button onClick={handleBackToFolder} className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-md transition-colors">Back to Summons</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: SUMMONS FOLDER (Level 2)
  // ============================
  if (view === 'FOLDER' && selectedCase) {
    const rawSummons = summonsList.filter(s => s.caseNo === selectedCase.caseNo);
    const uniqueSummonsMap = new Map();
    rawSummons.forEach(s => { if (!uniqueSummonsMap.has(s.summonType)) uniqueSummonsMap.set(s.summonType, s); });
    const caseSummons = Array.from(uniqueSummonsMap.values()).sort((a, b) => a.summonType - b.summonType);

    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10">
        {renderConfirmationModal()}
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center mb-8">
            <button onClick={handleBackToList} className="flex items-center text-gray-500 hover:text-blue-700 transition-colors mr-4"><ChevronLeft size={32} /></button>
            <h2 className="text-4xl font-bold text-gray-800 tracking-wide uppercase">SUMMONS / HEARING</h2>
          </div>
          <div className="flex space-x-4 mb-8">
            <div className={`${gradientBgClass} text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide shadow-md`}>CASE NO. : {selectedCase.caseNo}</div>
            <div className={`${gradientBgClass} text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide shadow-md opacity-90`}>RESIDENT NAME : {selectedCase.residentName}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[500px]">
            <div className={`${gradientBgClass} text-white px-8 py-5`}><h3 className="text-xl font-bold tracking-wide uppercase">SUMMONS FOLDER</h3></div>
            <div className="p-4">
              {caseSummons.length > 0 ? (
                caseSummons.map((summon, index) => (
                  <div key={index} onClick={() => handleOpenSummonDetail(summon)} className="flex items-center justify-between p-6 border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 flex-shrink-0">
                        <img src="/icon-summons/folder-summon.png" alt="Folder" className="w-full h-full object-contain drop-shadow-sm" onError={(e) => {e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/3767/3767084.png"}} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-extrabold text-gray-800 tracking-wide uppercase group-hover:text-[#0066FF] transition-colors">SUMMON {summon.summonType}</span>
                        <span className="text-xs text-gray-500 font-bold mt-1">{summon.summonDate} • {summon.summonTime}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-3 rounded-full hover:bg-gray-100 transition-colors"><MoreVertical size={24} /></button>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center text-gray-400 text-lg font-medium">No summons found in this folder.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: MAIN LIST (Level 1)
  // ============================
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-10" onClick={() => setActiveActionDropdown(null)}>
      {renderConfirmationModal()}
      {renderPreviewModal()}
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col mb-10">
          <h2 className="text-4xl font-bold text-[#0066FF] tracking-wide uppercase mb-2">SUMMONS</h2>
          <p className="text-gray-500 text-base font-medium">List of summons</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-visible relative min-h-[600px] flex flex-col">
          <div className={`${gradientBgClass} text-white font-bold text-xl uppercase tracking-wider grid grid-cols-12 py-6 px-8 text-center items-center shadow-md`}>
            <div className="col-span-4 text-left pl-8">Case no.</div>
            <div className="col-span-4 text-left">Resident name</div>
            <div className="col-span-2">Date Assigned</div>
            <div className="col-span-2">Action</div>
          </div>
          <div className="divide-y divide-gray-100 flex-1 bg-white">
            {uniqueCases.length > 0 ? (
              uniqueCases.map((item, index) => {
                const isPending = !item.status || item.status === 'Pending';
                return (
                  <div key={index} onClick={() => handleOpenFolder(item)} className="grid grid-cols-12 py-6 px-8 text-center items-center hover:bg-blue-50/40 transition-colors group relative cursor-pointer">
                    <div className="col-span-4 flex items-center pl-4 space-x-6">
                      <div className={`${gradientBgClass} text-white p-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center w-12 h-12`}><Folder size={24} fill="currentColor" /></div>
                      <span className="font-bold text-gray-700 text-xl tracking-tight">{item.caseNo}</span>
                    </div>
                    <div className="col-span-4 text-left font-semibold text-gray-600 pl-1 text-xl">{item.residentName}</div>
                    <div className="col-span-2 text-gray-500 font-medium text-xl">{item.summonDate}</div>
                    <div className="col-span-2 flex justify-center relative">
                      <button onClick={(e) => { e.stopPropagation(); toggleActionDropdown(item.caseNo); }} className="text-gray-400 hover:text-[#0066FF] p-3 rounded-full hover:bg-blue-50"><List size={32} strokeWidth={2.5} /></button>
                      {activeActionDropdown === item.caseNo && (
                        <div className="absolute top-14 right-10 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 cursor-default">
                          <div onClick={(e) => { e.stopPropagation(); handleViewStatus(item); }} className="px-6 py-4 text-lg text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer font-bold border-b border-gray-100 transition-colors flex items-center"><Eye size={20} className="mr-2"/> View Status</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Escalated', item); }} className={`px-6 py-4 text-lg text-left font-bold border-b border-gray-100 transition-colors ${!isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer'}`}>Escalated</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Blacklisted', item); }} className={`px-6 py-4 text-lg text-left font-bold border-b border-gray-100 transition-colors ${!isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer'}`}>Blacklisted</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Settled', item); }} className={`px-6 py-4 text-lg text-left font-bold transition-colors ${!isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}`}>Settled</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-32 text-center">
                <p className="text-gray-400 font-medium text-2xl">No summons records found.</p>
                <p className="text-gray-300 text-lg mt-2">Go to Case Logs to assign a summon.</p>
              </div>
            )}
          </div>
          <div className="py-12 text-center bg-gray-50/50 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-6">
              <div className="h-px w-40 bg-gray-300"></div>
              <span className="text-gray-400 font-bold text-base uppercase tracking-widest">NOTHING FOLLOWS</span>
              <div className="h-px w-40 bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}