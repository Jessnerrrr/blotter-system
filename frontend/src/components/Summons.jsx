import React, { useState, useEffect, useRef } from 'react';
import { Folder, List, MoreVertical, ChevronLeft, Plus, ClipboardList, Edit, Calendar, Save, Eye, ChevronDown, Bold, Italic, Underline } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext'; 

import { SummonsButton, SummonsAddNoteButton } from './buttons/Buttons';

const gradientBgClass = "bg-gradient-to-r from-[#0066FF] to-[#0099FF]";
const gradientBtnClass = "bg-gradient-to-r from-[#0066FF] to-[#0099FF] hover:from-[#0055EE] hover:to-[#0088DD] text-white shadow-md transition-all active:scale-95";

const getTypeStyle = (type) => {
  switch (type) {
    case 'LUPON': return 'bg-green-600 text-white';
    case 'VAWC': return 'bg-purple-600 text-white';
    case 'BLOTTER': return 'bg-red-600 text-white';
    case 'COMPLAIN': return 'bg-blue-600 text-white';
    default: return 'bg-blue-600 text-white';
  }
};

export default function Summons() {
  const { t } = useLanguage(); 
  const [summonsList, setSummonsList] = useState([]);
  const [view, setView] = useState('LIST'); 
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSummon, setSelectedSummon] = useState(null);
  
  const [caseNotes, setCaseNotes] = useState([1, 2, 4, 5, 6]); 
  const [selectedNote, setSelectedNote] = useState(null); 
  
  const [activeActionDropdown, setActiveActionDropdown] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, caseNo: null });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, data: null });
  const [previewEditing, setPreviewEditing] = useState(false); 
  const [tempStatus, setTempStatus] = useState(''); 

  const [editDate, setEditDate] = useState('');
  const editorRef = useRef(null);
  const [savedSummaryHtml, setSavedSummaryHtml] = useState('');

  useEffect(() => {
    const loadData = () => {
      let rawDataStr = localStorage.getItem('summons') || '[]';
      const casesDataStr = localStorage.getItem('cases') || '[]';
      const allCases = JSON.parse(casesDataStr);
      let rawData = JSON.parse(rawDataStr);

      // --- CRITICAL FIX: Only hide the summons for the view, DO NOT delete them from localStorage! ---
      const validSummonsForView = rawData.filter(summon => 
          allCases.some(c => c.caseNo === summon.caseNo && c.status !== 'SETTLED' && c.status !== 'BLACKLISTED')
      );

      const normalizedData = validSummonsForView.map(item => {
          let status = item.status || 'Pending';
          if (status === 'Active' || status === 'PENDING') status = 'Pending';
          
          const matchedCase = allCases.find(c => c.caseNo === item.caseNo);
          
          const complainantName = item.complainantName || matchedCase?.fullData?.complainantName || matchedCase?.complainantName || 'N/A';
          const complainantContact = item.complainantContact || matchedCase?.fullData?.complainantContact || 'N/A';
          const complainantAddress = item.complainantAddress || matchedCase?.fullData?.complainantAddress || 'N/A';

          const respondentName = item.residentName || item.respondentName || matchedCase?.fullData?.respondentName || matchedCase?.resident || 'N/A';
          const respondentContact = item.respondentContact || matchedCase?.fullData?.respondentContact || 'N/A';
          const respondentAddress = item.respondentAddress || matchedCase?.fullData?.respondentAddress || matchedCase?.respondentAddress || 'No address provided';
          
          const caseType = matchedCase ? matchedCase.type : 'LUPON'; 

          return { 
              ...item, 
              status, 
              complainantName, complainantContact, complainantAddress,
              respondentName, respondentContact, respondentAddress,
              type: caseType 
          };
      });
      
      setSummonsList(normalizedData);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const uniqueCases = Object.values(summonsList.reduce((acc, current) => {
    if (!acc[current.caseNo]) {
      acc[current.caseNo] = current;
    }
    return acc;
  }, {}));

  const handleOpenFolder = (caseItem) => { setSelectedCase(caseItem); setView('FOLDER'); };
  const handleOpenSummonDetail = (summonItem) => { setSelectedSummon(summonItem); setView('OVERVIEW'); };
  const handleAddNote = () => { const maxNote = caseNotes.length > 0 ? Math.max(...caseNotes) : 0; setSelectedNote(maxNote + 1); setEditDate(new Date().toISOString().split('T')[0]); setSavedSummaryHtml(''); setView('NOTE_EDIT'); };
  const handleOpenNoteDetail = (noteId) => { setSelectedNote(noteId); if (!editDate) setEditDate(new Date().toISOString().split('T')[0]); if (!savedSummaryHtml || selectedNote !== noteId) setSavedSummaryHtml('This section provides an overview of the selected case.<br><br>It records the facts, responses of parties, and any next steps identified during mediation.'); setView('NOTE_DETAIL'); };
  const handleEditNote = () => { setView('NOTE_EDIT'); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = savedSummaryHtml; }, 0); };

  const handleSaveNote = () => {
    if (editorRef.current) setSavedSummaryHtml(editorRef.current.innerHTML);
    if (!caseNotes.includes(selectedNote)) setCaseNotes(prev => [...prev, selectedNote].sort((a,b) => a - b));
    Swal.fire({ title: t('save_changes') || 'Saved!', text: t('case_overview_saved') || 'Case note has been saved.', icon: 'success', confirmButtonColor: '#0066FF' });
    setView('OVERVIEW'); 
  };

  const handleCancelEdit = () => {
    Swal.fire({ title: t('discard_changes') || 'Discard Changes?', text: t('unsaved_lost') || "Any unsaved changes will be lost.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('yes_discard') || 'Yes, discard', cancelButtonText: t('no_keep') || 'No, keep editing' }).then((result) => { if (result.isConfirmed) setView('OVERVIEW'); });
  };

  const handleBackToList = () => { setSelectedCase(null); setView('LIST'); };
  const handleBackToFolder = () => { setSelectedSummon(null); setView('FOLDER'); };
  const handleCloseNote = () => { setView('OVERVIEW'); };
  const toggleActionDropdown = (caseNo) => { setActiveActionDropdown(activeActionDropdown === caseNo ? null : caseNo); };
  
  const handleActionSelect = (action, caseItem) => {
    if (caseItem.status === action) return; 
    setActiveActionDropdown(null); 
    setConfirmModal({ isOpen: true, action: action, caseNo: caseItem.caseNo }); 
  };

  const handleViewStatus = (caseItem) => {
    setActiveActionDropdown(null); setPreviewEditing(false); setTempStatus(caseItem.status || 'Pending'); setPreviewModal({ isOpen: true, data: caseItem });
  };

  const executeStatusUpdate = () => {
    const { action, caseNo } = confirmModal;
    setConfirmModal({ isOpen: false, action: null, caseNo: null });

    const allSummons = JSON.parse(localStorage.getItem('summons') || '[]');
    const updatedSummons = allSummons.map(item => item.caseNo === caseNo ? { ...item, status: action } : item);
    localStorage.setItem('summons', JSON.stringify(updatedSummons));

    const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
    const updatedCases = allCases.map(c => c.caseNo === caseNo ? { ...c, status: action.toUpperCase() } : c);
    localStorage.setItem('cases', JSON.stringify(updatedCases));
    
    window.dispatchEvent(new Event('storage')); 
    Swal.fire({ title: t('status_updated') || 'Status Updated!', text: `${t('case_no')} ${caseNo} ${t('marked_as')} ${action}.`, icon: 'success', confirmButtonColor: '#0066FF' });
  };

  const handlePreviewSaveClick = () => {
    Swal.fire({ title: t('confirm_status_update') || 'Save Changes?', text: t('are_you_sure_mark') + " " + previewModal.data.caseNo + " " + t('as') + " " + tempStatus + "?", icon: 'question', showCancelButton: true, confirmButtonColor: '#0066FF', cancelButtonColor: '#d33', confirmButtonText: t('save_changes') || 'Yes, update it!' }).then((result) => { if (result.isConfirmed) performSaveStatus(); });
  };

  const performSaveStatus = () => {
    const newStatus = tempStatus;
    const caseNo = previewModal.data.caseNo;

    const allSummons = JSON.parse(localStorage.getItem('summons') || '[]');
    const updatedSummons = allSummons.map(item => item.caseNo === caseNo ? { ...item, status: newStatus } : item);
    localStorage.setItem('summons', JSON.stringify(updatedSummons));

    const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
    const updatedCases = allCases.map(c => c.caseNo === caseNo ? { ...c, status: newStatus.toUpperCase() } : c);
    localStorage.setItem('cases', JSON.stringify(updatedCases));
    
    window.dispatchEvent(new Event('storage'));
    setPreviewModal({ isOpen: false, data: null }); setPreviewEditing(false);
    Swal.fire({ title: t('status_updated') || 'Updated!', text: `${t('case_no')} ${caseNo} ${t('marked_as')} ${newStatus}.`, icon: 'success', confirmButtonColor: '#0066FF' });
  };

  const applyCommand = (e, command, value = null) => { e.preventDefault(); document.execCommand(command, false, value); if (editorRef.current) editorRef.current.focus(); };

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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border-2 border-[#0066FF] transform scale-100 transition-all">
                <div className="p-10">
                    <h3 className="text-3xl font-bold text-[#0066FF] mb-8">{t('case_preview')}</h3>
                    <div className="bg-slate-50 rounded-xl p-8 border border-gray-100 space-y-6">
                        
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <span className="text-gray-500 font-medium text-lg">{t('case_no')}</span>
                            <span className="text-[#0066FF] font-bold text-xl tracking-wide">{data.caseNo}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 border-b border-gray-200 pb-6">
                            <div className="space-y-1">
                                <span className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2 block flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>Complainant</span>
                                <p className="text-gray-800 font-extrabold text-lg uppercase">{data.complainantName}</p>
                                <p className="text-gray-600 text-sm font-medium"><span className="text-gray-400 mr-1">Contact:</span> {data.complainantContact}</p>
                                <p className="text-gray-600 text-sm font-medium leading-tight"><span className="text-gray-400 mr-1">Address:</span> {data.complainantAddress}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-red-600 font-bold text-sm uppercase tracking-wider mb-2 block flex items-center"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>Respondent</span>
                                <p className="text-gray-800 font-extrabold text-lg uppercase">{data.respondentName}</p>
                                <p className="text-gray-600 text-sm font-medium"><span className="text-gray-400 mr-1">Contact:</span> {data.respondentContact}</p>
                                <p className="text-gray-600 text-sm font-medium leading-tight"><span className="text-gray-400 mr-1">Address:</span> {data.respondentAddress}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-b border-gray-200 pb-4"><span className="text-gray-500 font-medium text-lg">{t('date_filed')}</span><span className="text-gray-800 font-medium text-xl">{data.summonDate || 'N/A'}</span></div>
                        <div className="flex justify-between items-center pt-2 min-h-[50px]">
                            <span className="text-gray-500 font-medium text-lg">{t('current_status')}</span>
                            {previewEditing ? (
                                <div className="relative">
                                    <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} className="appearance-none bg-white border-2 border-[#0066FF] text-gray-900 font-bold text-lg py-2 pl-6 pr-12 rounded-lg cursor-pointer outline-none shadow-sm hover:bg-blue-50 transition-colors">
                                        <option value="Pending">Pending</option>
                                        <option value="Settled">{t('settle')}</option>
                                        <option value="Escalated">{t('escalate')}</option>
                                        <option value="Blacklisted">{t('blacklist')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0066FF] pointer-events-none" size={20} strokeWidth={3} />
                                </div>
                            ) : ( <span className={`${getStatusColor(tempStatus || data.status)} px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm`}>{tempStatus || data.status || 'PENDING'}</span> )}
                        </div>
                    </div>
                    <div className="flex justify-center space-x-4 mt-10">
                        {previewEditing ? (
                            <>
                              <SummonsButton variant="outline" onClick={() => { setPreviewEditing(false); setTempStatus(data.status); }} className="px-10 py-3 rounded-xl text-sm tracking-wide">{t('cancel')}</SummonsButton>
                              <SummonsButton variant="primary" onClick={handlePreviewSaveClick} className="px-12 py-3 rounded-xl text-sm tracking-wide"><Save size={18} className="mr-2"/> {t('save_changes')}</SummonsButton>
                            </>
                        ) : isPending ? (
                            <>
                              <SummonsButton variant="outline" onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-10 py-3 rounded-xl text-sm tracking-wide">{t('cancel')}</SummonsButton>
                              <SummonsButton variant="primary" onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-12 py-3 rounded-xl text-sm tracking-wide">{t('ok')}</SummonsButton>
                            </>
                        ) : (
                            <>
                              <SummonsButton variant="outline" onClick={() => setPreviewModal({ isOpen: false, data: null })} className="px-10 py-3 rounded-xl text-sm tracking-wide">{t('cancel')}</SummonsButton>
                              <SummonsButton variant="primary" onClick={() => setPreviewEditing(true)} className="px-12 py-3 rounded-xl text-sm tracking-wide"><Edit size={18} className="mr-2"/> {t('edit_status')}</SummonsButton>
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
                    
                    {confirmModal.action === 'Pending' && <p className="text-yellow-600 font-bold text-sm bg-yellow-50 p-2 rounded-lg border border-yellow-100 mb-4 text-center">Case will be reverted to pending status.</p>}
                    {confirmModal.action === 'Settled' && <p className="text-green-600 font-bold text-sm bg-green-50 p-2 rounded-lg border border-green-100 mb-4 text-center">{t('moved_to_archive')}</p>}
                    {confirmModal.action === 'Escalated' && <p className="text-red-600 font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100 mb-4 text-center">{t('case_escalated_notice')}</p>}
                    {confirmModal.action === 'Blacklisted' && <p className="text-gray-800 font-bold text-sm bg-gray-200 p-2 rounded-lg border border-gray-300 mb-4 text-center">{t('moved_to_blacklist')}</p>}
                    
                    <div className="flex justify-end space-x-3 mt-4">
                      <SummonsButton variant="outline" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-6 py-2.5 rounded-lg text-sm tracking-wide">{t('cancel')}</SummonsButton>
                      <SummonsButton variant="primary" onClick={executeStatusUpdate} className="px-8 py-2.5 rounded-lg text-sm tracking-wide">{t('confirm')}</SummonsButton>
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
          <div className={`${gradientBgClass} p-10 text-white`}><h2 className="text-3xl font-extrabold tracking-wide uppercase mb-2">{t('case_overview_title')}</h2><p className="text-blue-100 text-lg font-medium">{t('case_overview_subtitle')}</p></div>
          <div className="p-10">
            <div className="flex items-center justify-between mb-8 px-2">
               <p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('case_no')}:</span> <span className="text-[#0066FF] ml-1">{selectedNote}</span></p>
               <div className="flex items-center space-x-4"><span className="text-gray-400 font-bold text-sm uppercase tracking-wide">{t('date')}:</span><div className="relative"><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border-2 border-gray-200 rounded-lg py-1.5 px-3 text-gray-800 font-bold focus:outline-none focus:border-[#0066FF] text-sm" /></div></div>
            </div>
            <div className="mb-8">
               <h3 className="text-[#0066FF] font-bold text-sm uppercase mb-2 ml-1">{t('case_overview_title')}</h3>
               <div className="border-2 border-[#0066FF] rounded-lg overflow-hidden shadow-sm flex flex-col h-72">
                 <div className="relative flex-1 bg-white cursor-text" onClick={() => editorRef.current?.focus()}><div ref={editorRef} contentEditable className="w-full h-full p-6 text-base text-gray-700 focus:outline-none overflow-y-auto" style={{ minHeight: '100%' }} /></div>
                 <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center space-x-5 text-gray-500 shrink-0"><button onMouseDown={(e) => applyCommand(e, 'bold')} className="hover:text-[#0066FF] p-1 rounded" title="Bold"><Bold size={18} /></button><button onMouseDown={(e) => applyCommand(e, 'italic')} className="hover:text-[#0066FF] p-1 rounded" title="Italic"><Italic size={18} /></button><button onMouseDown={(e) => applyCommand(e, 'underline')} className="hover:text-[#0066FF] p-1 rounded" title="Underline"><Underline size={18} /></button><div className="h-5 w-px bg-gray-300 mx-2"></div></div>
               </div>
            </div>
            <div className="flex justify-end space-x-3">
              <SummonsButton variant="secondary" onClick={handleCancelEdit} className="px-8 py-2.5 rounded-lg text-xs tracking-wider">{t('cancel')}</SummonsButton>
              <SummonsButton variant="primary" onClick={handleSaveNote} className="px-10 py-2.5 rounded-lg text-xs tracking-wider">{t('ok')}</SummonsButton>
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
          <div className={`${gradientBgClass} p-10 text-white`}><h2 className="text-3xl font-extrabold tracking-wide uppercase mb-2">{t('case_overview_title')}</h2><p className="text-blue-100 text-lg font-medium">{t('case_overview_subtitle')}</p></div>
          <div className="p-10">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center space-x-6"><p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('case_no')}:</span> <span className="text-[#0066FF] ml-1">{selectedNote}</span></p><div className="w-px h-4 bg-gray-300"></div><p className="text-gray-500 font-bold text-sm uppercase tracking-wide"><span className="text-gray-400">{t('date')}:</span> <span className="text-gray-800 ml-1">{editDate}</span></p></div>
              <button onClick={handleEditNote} className="flex items-center text-[#0066FF] hover:text-blue-800 font-bold transition-colors text-sm uppercase tracking-wide"><Edit size={16} className="mr-1.5" /> {t('edit_case_overview')}</button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-10 h-64 shadow-inner text-gray-600 text-base leading-relaxed overflow-y-auto" dangerouslySetInnerHTML={{ __html: savedSummaryHtml }}></div>
            <div className="flex justify-end space-x-4">
              <SummonsButton variant="secondary" onClick={handleCloseNote} className="px-8 py-3 rounded-lg text-sm tracking-wider">{t('cancel')}</SummonsButton>
              <SummonsButton variant="primary" onClick={handleCloseNote} className="px-10 py-3 rounded-lg text-sm tracking-wider">{t('ok')}</SummonsButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'OVERVIEW' && selectedSummon && selectedCase) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-10">
        {renderConfirmationModal()}
        <div className="max-w-[1600px] mx-auto">
          
          <div className="mb-8">
             <div className="flex items-center mb-6"><button onClick={handleBackToFolder} className="flex items-center text-gray-500 hover:text-blue-700 transition-colors mr-4"><ChevronLeft size={32} /></button><h2 className="text-4xl font-bold text-[#0066FF] tracking-wide uppercase">{t('summon_overview')}</h2></div>
             
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 mt-4">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 tracking-wide uppercase"><span className="text-gray-400 mr-2">Case No:</span> <span className="text-[#0066FF]">{selectedCase.caseNo}</span></h3>
                    <span className={`${getTypeStyle(selectedCase.type)} px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm`}>{selectedCase.type || 'LUPON'}</span>
                </div>
                <div className="grid grid-cols-2 gap-8 px-2">
                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-3 flex items-center"><span className="w-2 h-2 rounded-full bg-[#0066FF] mr-2"></span> Complainant</p>
                        <p className="font-extrabold text-gray-800 text-lg uppercase mb-1">{selectedCase.complainantName}</p>
                        <p className="text-gray-600 text-sm font-medium mb-1"><span className="text-gray-400 mr-1">Contact:</span> {selectedCase.complainantContact}</p>
                        <p className="text-gray-600 text-sm font-medium"><span className="text-gray-400 mr-1">Address:</span> {selectedCase.complainantAddress}</p>
                    </div>
                    <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Respondent</p>
                        <p className="font-extrabold text-gray-800 text-lg uppercase mb-1">{selectedCase.respondentName}</p>
                        <p className="text-gray-600 text-sm font-medium mb-1"><span className="text-gray-400 mr-1">Contact:</span> {selectedCase.respondentContact}</p>
                        <p className="text-gray-600 text-sm font-medium"><span className="text-gray-400 mr-1">Address:</span> {selectedCase.respondentAddress}</p>
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-10 shadow-sm relative">
              <h3 className="text-[#0066FF] font-extrabold text-lg uppercase mb-3">{t('summon_reason')} :</h3>
              {selectedSummon.summonReason ? (
                  <div 
                      className="text-gray-700 text-base leading-relaxed font-medium" 
                      dangerouslySetInnerHTML={{ __html: selectedSummon.summonReason }} 
                  />
              ) : (
                  <p className="text-gray-700 text-base leading-relaxed font-medium">No reason provided.</p>
              )}
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6 gap-6">
               <div className="bg-[#0066FF] text-white py-3.5 px-8 rounded-xl shadow-sm flex-1"><h3 className="text-xl font-bold tracking-wide uppercase">{t('case_folders')}</h3></div>
               <SummonsAddNoteButton onClick={handleAddNote} text={t('add_case_notes')} />
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 relative pb-24 z-0">
              <div className="divide-y divide-gray-100">
                {caseNotes.map((num) => (
                  <div key={num} onClick={() => handleOpenNoteDetail(num)} className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer group transition-colors">
                    <div className="flex items-center space-x-4"><ClipboardList size={28} className="text-[#0066FF]" strokeWidth={1.5} /><span className="text-base font-bold text-gray-800 uppercase">{t('case_note')} {num}</span></div>
                    <button className="text-gray-400 hover:text-[#0066FF]"><MoreVertical size={24} /></button>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-6 right-6">
                <SummonsButton variant="secondary" onClick={handleBackToFolder} className="px-6 py-2 rounded-lg text-xs tracking-wider">{t('back_to_summons')}</SummonsButton>
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
             
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 mt-4">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 tracking-wide uppercase"><span className="text-gray-400 mr-2">Case No:</span> <span className="text-[#0066FF]">{selectedCase.caseNo}</span></h3>
                    <span className={`${getTypeStyle(selectedCase.type)} px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm`}>{selectedCase.type || 'LUPON'}</span>
                </div>
                <div className="grid grid-cols-2 gap-8 px-2">
                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-3 flex items-center"><span className="w-2 h-2 rounded-full bg-[#0066FF] mr-2"></span> Complainant</p>
                        <p className="font-extrabold text-gray-800 text-lg uppercase mb-1">{selectedCase.complainantName}</p>
                        <p className="text-gray-600 text-sm font-medium mb-1"><span className="text-gray-400 mr-1">Contact:</span> {selectedCase.complainantContact}</p>
                        <p className="text-gray-600 text-sm font-medium"><span className="text-gray-400 mr-1">Address:</span> {selectedCase.complainantAddress}</p>
                    </div>
                    <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Respondent</p>
                        <p className="font-extrabold text-gray-800 text-lg uppercase mb-1">{selectedCase.respondentName}</p>
                        <p className="text-gray-600 text-sm font-medium mb-1"><span className="text-gray-400 mr-1">Contact:</span> {selectedCase.respondentContact}</p>
                        <p className="text-gray-600 text-sm font-medium"><span className="text-gray-400 mr-1">Address:</span> {selectedCase.respondentAddress}</p>
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[500px]">
            <div className={`${gradientBgClass} text-white px-6 py-4`}><h3 className="text-lg font-bold tracking-wide uppercase">{t('summons_folder')}</h3></div>
            <div className="p-4">
              {caseSummons.length > 0 ? (
                caseSummons.map((summon, index) => (
                  <div key={index} onClick={() => handleOpenSummonDetail(summon)} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 flex-shrink-0"><img src="/icon-summons/folder-summon.png" alt="Folder" className="w-full h-full object-contain drop-shadow-sm" onError={(e) => {e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/3767/3767084.png"}} /></div>
                      <div className="flex flex-col"><span className="text-base font-extrabold text-gray-800 tracking-wide uppercase group-hover:text-[#0066FF] transition-colors">{t('nav_summons')} {summon.summonType}</span><span className="text-[11px] text-gray-500 font-bold mt-0.5">{summon.summonDate} • {summon.summonTime}</span></div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><MoreVertical size={20} /></button>
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
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8" onClick={() => setActiveActionDropdown(null)}>
      {renderConfirmationModal()}
      {renderPreviewModal()}
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col mb-8"><h2 className="text-3xl font-bold text-[#0066FF] tracking-wide uppercase mb-1">{t('nav_summons')}</h2><p className="text-gray-500 text-sm font-medium">{t('list_of_summons')}</p></div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-visible relative min-h-[600px] flex flex-col">
          <div className={`${gradientBgClass} text-white font-bold text-sm uppercase tracking-wider grid grid-cols-12 py-4 px-6 text-center items-center shadow-md`}>
            <div className="col-span-4 text-left pl-6">{t('case_no')}</div><div className="col-span-4 text-left">{t('complainant_name')}</div><div className="col-span-2">{t('date_assigned')}</div><div className="col-span-2">{t('action')}</div>
          </div>
          <div className="divide-y divide-gray-100 flex-1 bg-white">
            {uniqueCases.length > 0 ? (
              uniqueCases.map((item, index) => {
                return (
                  <div key={index} onClick={() => handleOpenFolder(item)} className="grid grid-cols-12 py-4 px-6 text-center items-center hover:bg-blue-50/40 transition-colors group relative cursor-pointer">
                    <div className="col-span-4 flex items-center pl-2 space-x-4">
                      <div className={`${getTypeStyle(item.type)} p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center w-10 h-10`}><Folder size={20} fill="currentColor" /></div>
                      <span className="font-bold text-gray-700 text-base tracking-tight">{item.caseNo}</span>
                    </div>
                    <div className="col-span-4 text-left font-semibold text-gray-600 pl-1 text-base">{item.complainantName}</div>
                    <div className="col-span-2 text-gray-500 font-medium text-base">{item.summonDate}</div>
                    <div className="col-span-2 flex justify-center relative">
                      <button onClick={(e) => { e.stopPropagation(); toggleActionDropdown(item.caseNo); }} className="text-gray-400 hover:text-[#0066FF] p-2 rounded-full hover:bg-blue-50"><List size={24} strokeWidth={2.5} /></button>
                      
                      {activeActionDropdown === item.caseNo && (
                        <div className="absolute top-12 right-10 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 cursor-default">
                          <div onClick={(e) => { e.stopPropagation(); handleViewStatus(item); }} className="px-5 py-3 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer font-bold border-b border-gray-100 transition-colors flex items-center"><Eye size={16} className="mr-2"/> {t('view_status')}</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Pending', item); }} className={`px-5 py-3 text-sm text-left font-bold border-b border-gray-100 transition-colors ${item.status === 'Pending' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 cursor-pointer'}`}>Pending</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Escalated', item); }} className={`px-5 py-3 text-sm text-left font-bold border-b border-gray-100 transition-colors ${item.status === 'Escalated' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer'}`}>{t('escalate')}</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Blacklisted', item); }} className={`px-5 py-3 text-sm text-left font-bold border-b border-gray-100 transition-colors ${item.status === 'Blacklisted' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer'}`}>{t('blacklist')}</div>
                          <div onClick={(e) => { e.stopPropagation(); handleActionSelect('Settled', item); }} className={`px-5 py-3 text-sm text-left font-bold transition-colors ${item.status === 'Settled' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}`}>{t('settle')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : ( <div className="py-24 text-center"><p className="text-gray-400 font-medium text-xl">{t('no_summons_found')}</p><p className="text-gray-300 text-base mt-2">{t('go_to_case_logs')}</p></div> )}
          </div>
          <div className="py-8 text-center bg-gray-50/50 border-t border-gray-100"><div className="flex items-center justify-center space-x-6"><div className="h-px w-32 bg-gray-300"></div><span className="text-gray-400 font-bold text-sm uppercase tracking-widest">{t('nothing_follows')}</span><div className="h-px w-32 bg-gray-300"></div></div></div>
        </div>
      </div>
    </div>
  ); 
}