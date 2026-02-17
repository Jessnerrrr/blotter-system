import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronDown, Check, Upload, Calendar, MapPin, Filter, FileText, Trash2, Clock, FileWarning, Bold, Italic, Underline, Link, AlignLeft } from 'lucide-react';
import Swal from 'sweetalert2';

// --- MOCK DATA (Fallback) ---
const initialCaseData = [
  { type: 'LUPON', status: 'SETTLED', caseNo: '01-166-01-2025', resident: 'Dela Cruz, Juan', contact: '0912-000-0001', date: '01-15-2025' },
  { type: 'VAWC', status: 'PENDING', caseNo: '02-166-05-2025', resident: 'Santos, Maria', contact: '0912-000-0002', date: '05-20-2025' },
  { type: 'BLOTTER', status: 'ESCALATED', caseNo: '03-166-09-2025', resident: 'Reyes, Timothy', contact: '0951-321-2121', date: '09-05-2025' },
  { type: 'COMPLAIN', status: 'BLACKLISTED', caseNo: '04-166-12-2025', resident: 'Bautista, Ana', contact: '0912-000-0004', date: '12-10-2025' },
  { type: 'LUPON', status: 'PENDING', caseNo: '05-166-01-2026', resident: 'Lim, Pedro', contact: '0912-000-0005', date: '01-05-2026' },
];

const getStatusStyle = (status) => {
  switch (status) {
    case 'SETTLED': return 'bg-green-500 text-white border-green-600';
    case 'ESCALATED': return 'bg-red-500 text-white border-red-600';
    case 'BLACKLISTED': return 'bg-black text-white border-gray-800';
    case 'PENDING': return 'bg-yellow-500 text-white border-yellow-600';
    default: return 'bg-gray-500 text-white';
  }
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'LUPON': return 'bg-blue-700 text-white';
    case 'VAWC': return 'bg-red-700 text-white';
    case 'BLOTTER': return 'bg-yellow-600 text-white';
    case 'COMPLAIN': return 'bg-green-700 text-white';
    default: return 'bg-gray-600 text-white';
  }
};

const gradientBtnClass = "bg-gradient-to-r from-[#0066FF] to-[#0099FF] hover:from-[#0055EE] hover:to-[#0088DD] text-white shadow-md transition-all active:scale-95";

export default function CaseLogs() {
  // --- MAIN STATES ---
  const [view, setView] = useState('TABLE'); 
  
  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem('cases');
    return saved ? JSON.parse(saved) : initialCaseData;
  });

  useEffect(() => {
    localStorage.setItem('cases', JSON.stringify(cases));
  }, [cases]);
  
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isModeratorModalOpen, setIsModeratorModalOpen] = useState(false);

  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedRole, setSelectedRole] = useState('Lupon Head');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [isStatusSortOpen, setIsStatusSortOpen] = useState(false); 
  const [isYearSortOpen, setIsYearSortOpen] = useState(false); 
  const [sortStatus, setSortStatus] = useState('All Status'); 
  const [sortYear, setSortYear] = useState('All Years');

  const [formData, setFormData] = useState({
    caseNo: '', dateFiled: '',
    complainantName: '', complainantContact: '', complainantAddress: '',
    defendantName: '', defendantContact: '', defendantAddress: '',
    incidentDate: '', incidentLocation: '', incidentDesc: ''
  });
  
  const [summonData, setSummonData] = useState({
    caseNo: '', residentName: '', summonDate: '', summonTime: '',
    summonType: '', summonReason: '', notedBy: ''
  });

  const editorRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [formErrors, setFormErrors] = useState({});
  const [summonErrors, setSummonErrors] = useState({});
  const [takenSummons, setTakenSummons] = useState([]); 

  const today = new Date().toISOString().split('T')[0]; 
  const currentYear = new Date().getFullYear();
  const yearOptions = ['All Years', ...Array.from({length: 7}, (_, i) => (currentYear - i).toString())];
  const roles = ['Lupon Head', 'Lupon Tagapamayapa', 'Administration']; 
  const statusOptions = [{ label: 'Settled', color: 'bg-green-500' }, { label: 'Pending', color: 'bg-yellow-500' }, { label: 'Escalated', color: 'bg-red-500' }, { label: 'Blacklisted', color: 'bg-black' }];

  const filteredData = cases.filter((item) => {
    const matchesStatus = sortStatus === 'All Status' || item.status === sortStatus.toUpperCase();
    const itemYear = item.date.split('-')[2]; 
    const matchesYear = sortYear === 'All Years' || itemYear === sortYear;
    return matchesStatus && matchesYear;
  });

  // --- HANDLERS ---
  const handleReportTypeSelect = (type) => { setSelectedReportType(type); setIsModeratorModalOpen(true); };
  
  const handleRoleSelect = (role) => { 
    setSelectedRole(role); 
    setIsDropdownOpen(false); 
  };

  const handleContinueToForm = () => {
    let maxControlNum = 0;
    cases.forEach(c => {
        const parts = c.caseNo.split('-');
        const num = parseInt(parts[0], 10);
        if (!isNaN(num) && num > maxControlNum) maxControlNum = num;
    });
    const nextControlNum = String(maxControlNum + 1).padStart(2, '0');
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const newCaseNo = `${nextControlNum}-166-${month}-${now.getFullYear()}`;

    setFormData({
      caseNo: newCaseNo, dateFiled: today,
      complainantName: '', complainantContact: '', complainantAddress: '',
      defendantName: '', defendantContact: '', defendantAddress: '',
      incidentDate: '', incidentLocation: '', incidentDesc: ''
    });
    setAttachedFiles([]);
    setFormErrors({});
    setIsModalOpen(false);
    setIsModeratorModalOpen(false);
    setView('FORM');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name.includes('Contact')) finalValue = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAssignSummonClick = (caseItem) => {
    const allSummons = JSON.parse(localStorage.getItem('summons') || '[]');
    const caseSummons = allSummons.filter(s => s.caseNo === caseItem.caseNo);
    const usedTypes = caseSummons.map(s => s.summonType);
    setTakenSummons(usedTypes);

    setSummonData({
      caseNo: caseItem.caseNo, residentName: caseItem.resident,
      summonDate: '', summonTime: '', summonType: '', summonReason: '', notedBy: ''
    });
    setSummonErrors({});
    if(editorRef.current) editorRef.current.innerHTML = "";
    setView('SUMMON');
  };

  const handleSummonInputChange = (e) => {
    const { name, value } = e.target;
    setSummonData(prev => ({ ...prev, [name]: value }));
    if (summonErrors[name]) setSummonErrors(prev => ({ ...prev, [name]: '' }));
  };

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

  const handleSubmitSummon = () => {
    const currentReason = editorRef.current ? editorRef.current.innerHTML : '';
    const finalData = { ...summonData, summonReason: currentReason };
    const errors = {};
    const required = ['summonDate', 'summonTime', 'summonType', 'notedBy'];
    required.forEach(f => { if (!finalData[f].trim()) errors[f] = 'Required'; });
    if (!currentReason || currentReason === '<br>' || currentReason.trim() === '') errors['summonReason'] = 'Required';
    if (Object.keys(errors).length > 0) {
      setSummonErrors(errors);
      Swal.fire({ title: 'Missing Information', text: 'Please fill out all required fields.', icon: 'error', confirmButtonColor: '#d33' });
      return;
    }
    if (takenSummons.includes(finalData.summonType)) {
      Swal.fire({ title: 'Duplicate Summon', text: 'This summon type has already been issued for this case.', icon: 'error', confirmButtonColor: '#d33' });
      return;
    }
    const existingSummons = JSON.parse(localStorage.getItem('summons') || '[]');
    const newSummonRecord = { ...finalData, status: 'Active', id: Date.now() };
    localStorage.setItem('summons', JSON.stringify([...existingSummons, newSummonRecord]));
    setView('TABLE');
    Swal.fire({ title: 'Summon Assigned!', text: `Summon scheduled for ${finalData.residentName}.`, icon: 'success', confirmButtonColor: '#1d4ed8' });
  };

  const handleSubmitCase = () => {
    const errors = {};
    const required = ['dateFiled', 'complainantName', 'defendantName', 'incidentDate', 'incidentLocation', 'incidentDesc'];
    required.forEach(f => { if (!formData[f].trim()) errors[f] = 'Required'; });
    if (attachedFiles.length === 0) errors.attachment = 'Required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Swal.fire({ title: 'Incomplete', text: 'Please fill all required fields.', icon: 'error', confirmButtonColor: '#d33' });
      return;
    }
    const dateObj = new Date(formData.dateFiled);
    const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${dateObj.getFullYear()}`;
    setCases([{
      type: selectedReportType,
      status: 'PENDING',
      caseNo: formData.caseNo,
      resident: formData.defendantName,
      contact: formData.defendantContact || 'N/A',
      date: formattedDate
    }, ...cases]);
    setSortStatus('All Status');
    setSortYear('All Years');
    setView('TABLE');
    Swal.fire({ title: 'Success!', text: 'Case added to logs.', icon: 'success' });
  };

  const getInputClass = (fieldName, errorState = formErrors) => {
    const base = "w-full border rounded-lg px-4 py-3 outline-none transition-all";
    return errorState[fieldName] ? `${base} border-red-500 bg-red-50` : `${base} border-gray-300 focus:border-blue-500`;
  };
  const handleFileZoneClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => { if (e.target.files?.length) setAttachedFiles([...attachedFiles, ...Array.from(e.target.files)]); };
  const handleRemoveFile = (i) => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i));
  const handleStatusSelect = (o) => { setSortStatus(o); setIsStatusSortOpen(false); };
  const handleYearSelect = (o) => { setSortYear(o); setIsYearSortOpen(false); };

  // ==========================
  // VIEW: TABLE
  // ==========================
  if (view === 'TABLE') {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 relative">
        <div className="max-w-[1600px] mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-blue-600 tracking-wide uppercase">CASES LOGS</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button type="button" onClick={() => setIsYearSortOpen(!isYearSortOpen)} className="flex items-center bg-white px-5 py-3 rounded-lg shadow-sm border border-gray-200"><Calendar size={18} className="mr-2 text-gray-500" /> <span className="text-sm font-bold">{sortYear}</span> <ChevronDown size={16} className="ml-2" /></button>
                {isYearSortOpen && (<div className="absolute top-full right-0 mt-2 w-32 bg-white border rounded-xl shadow-xl z-50">{yearOptions.map(y => <div key={y} onClick={() => handleYearSelect(y)} className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer">{y}</div>)}</div>)}
              </div>
              <div className="relative">
                <button type="button" onClick={() => setIsStatusSortOpen(!isStatusSortOpen)} className="flex items-center bg-white px-5 py-3 rounded-lg shadow-sm border border-gray-200"><Filter size={18} className="mr-2 text-gray-500" /> <span className="text-sm font-bold">{sortStatus}</span> <ChevronDown size={16} className="ml-2" /></button>
                {isStatusSortOpen && (<div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-50">{statusOptions.map(o => <div key={o.label} onClick={() => handleStatusSelect(o.label)} className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer flex items-center"><span className={`w-2 h-2 rounded-full ${o.color} mr-2`} />{o.label}</div>)}</div>)}
              </div>
              <button onClick={() => setIsModalOpen(true)} className={`flex items-center pr-6 pl-2 py-1.5 rounded-lg ${gradientBtnClass}`}><div className="relative w-8 h-9 mr-2 flex items-center justify-center"><div className="absolute w-6 h-7 bg-white/30 rounded-[2px] rotate-6"></div><div className="absolute w-6 h-7 bg-white rounded-[2px] flex items-center justify-center shadow-sm z-10"><Plus className="text-[#0066FF]" size={18} strokeWidth={4} /></div></div><span className="text-xl font-bold pt-1">New Case</span></button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-center border-collapse">
              <thead><tr className="bg-blue-700 text-white"><th className="py-5 px-4 font-bold">Report Type</th><th className="py-5 px-4 font-bold">Case no.</th><th className="py-5 px-4 font-bold">Resident name</th><th className="py-5 px-4 font-bold">Contact no.</th><th className="py-5 px-4 font-bold">Date Created</th><th className="py-5 px-4 font-bold">Status</th><th className="py-5 px-4 font-bold">Action</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length > 0 ? filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-4"><span className={`${getTypeStyle(item.type)} px-3 py-1 rounded text-[10px] font-bold shadow-sm`}>{item.type}</span></td>
                    <td className="py-5 px-4 font-semibold text-gray-700">{item.caseNo}</td>
                    <td className="py-5 px-4 text-gray-600">{item.resident}</td>
                    <td className="py-5 px-4 text-gray-600">{item.contact}</td>
                    <td className="py-5 px-4 text-gray-600">{item.date}</td>
                    <td className="py-5 px-4"><span className={`${getStatusStyle(item.status)} px-3 py-1 rounded-full text-[10px] font-bold shadow-sm`}>{item.status}</span></td>
                    <td className="py-5 px-4"><button onClick={() => handleAssignSummonClick(item)} className={`text-xs font-bold px-4 py-2 rounded ${gradientBtnClass}`}>Assign Summon</button></td>
                  </tr>
                )) : <tr><td colSpan="7" className="py-10 text-gray-400">No cases found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- REPORT TYPE MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl relative overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-200">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full z-20 transition-colors"><X size={28} /></button>
              <div className="text-center pt-14 pb-4">
                <h2 className="text-5xl font-medium text-blue-800 tracking-tighter">REPORT TYPE</h2>
                <p className="text-gray-500 mt-2 text-base font-medium">Select the type of case to create a new report</p>
              </div>
              <div className="p-14 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* LUPON */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <div className="bg-blue-800 h-2.5 w-full"></div>
                  <div className="p-8 flex flex-col items-center text-center flex-1">
                    <div className="w-24 h-24 mb-6"><img src="/icon-casereport/lupon.png" alt="Lupon" className="w-full h-full object-contain" /></div>
                    <h3 className="text-2xl font-medium text-blue-800 mb-1">LUPON</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-10">Community Dispute Case</p>
                    <button onClick={() => handleReportTypeSelect('LUPON')} className="mt-auto w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg text-lg font-medium shadow-md transition-colors">→ Create Report</button>
                  </div>
                </div>
                {/* VAWC */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <div className="bg-red-600 h-2.5 w-full"></div>
                  <div className="p-8 flex flex-col items-center text-center flex-1">
                    <div className="w-24 h-24 mb-6"><img src="/icon-casereport/vawc.png" alt="VAWC" className="w-full h-full object-contain" /></div>
                    <h3 className="text-2xl font-medium text-red-600 mb-1">VAWC</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-10">Violence Against Women & Children</p>
                    <button onClick={() => handleReportTypeSelect('VAWC')} className="mt-auto w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-lg font-medium shadow-md transition-colors">→ Create Report</button>
                  </div>
                </div>
                {/* BLOTTER */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <div className="bg-yellow-500 h-2.5 w-full"></div>
                  <div className="p-8 flex flex-col items-center text-center flex-1">
                    <div className="w-24 h-24 mb-6"><img src="/icon-casereport/blotter.png" alt="Blotter" className="w-full h-full object-contain" /></div>
                    <h3 className="text-2xl font-medium text-yellow-600 mb-1">BLOTTER</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-10">Incident Reports</p>
                    <button onClick={() => handleReportTypeSelect('BLOTTER')} className="mt-auto w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg text-lg font-medium shadow-md transition-colors">→ Create Report</button>
                  </div>
                </div>
                {/* COMPLAIN */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <div className="bg-green-600 h-2.5 w-full"></div>
                  <div className="p-8 flex flex-col items-center text-center flex-1">
                    <div className="w-24 h-24 mb-6"><img src="/icon-casereport/complain.png" alt="Complain" className="w-full h-full object-contain" /></div>
                    <h3 className="text-2xl font-medium text-green-600 mb-1">COMPLAIN</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-10">General Complaint</p>
                    <button onClick={() => handleReportTypeSelect('COMPLAIN')} className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-lg font-medium shadow-md transition-colors">→ Create Report</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODERATOR MODAL - FIXED CORNER ROUNDING */}
        {isModeratorModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
            {/* FIXED: Changed rounded-xl to rounded-2xl to match "Report Type" modal proportions */}
            <div className="bg-white rounded-2xl w-full max-w-md overflow-visible shadow-2xl border border-blue-100 flex flex-col">
              <div className="bg-blue-700 p-6 text-center text-white relative rounded-t-2xl">
                <h3 className="text-2xl font-bold">ASSIGN ROLE</h3>
              </div>
              
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div className="relative mb-8">
                  <div 
                    onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }} 
                    className={`border p-4 rounded-lg flex justify-between cursor-pointer font-bold bg-white ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200'}`}
                  >
                    <span className="text-gray-800">{selectedRole}</span>
                    <ChevronDown className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full bg-white border shadow-lg rounded-lg z-[120] mt-1 overflow-hidden">
                      {roles.map((r) => (
                        <div 
                          key={r} 
                          onClick={() => handleRoleSelect(r)} 
                          // FIXED: Hover is blue bg + white text
                          className={`p-4 cursor-pointer border-b last:border-0 font-medium hover:bg-blue-600 hover:text-white ${selectedRole === r ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button onClick={() => setIsModeratorModalOpen(false)} className="flex-1 border py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleContinueToForm} className={`flex-1 py-3 rounded-lg font-bold ${gradientBtnClass}`}>Continue</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================
  // VIEW: SUMMON FORM
  // ==========================
  if (view === 'SUMMON') {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-700 py-6 relative overflow-hidden flex items-center justify-center">
            <div className="absolute left-8 top-1/2 -translate-y-1/2"><img src="/icon-summons/assign summon.png" alt="Assign Summon" className="w-16 h-16 object-contain opacity-80" /></div>
            <div className="text-center text-white z-10"><h2 className="text-2xl font-bold tracking-tight">ASSIGN SUMMONS</h2><p className="text-blue-100 mt-1 text-xs">Set the summon schedule and case details</p></div>
          </div>
          <div className="p-8 space-y-5 bg-slate-50">
            <div className="grid grid-cols-2 gap-5"><div><label className="block text-xs font-bold text-gray-700 mb-1">Case Number</label><input type="text" value={summonData.caseNo} readOnly className="w-full bg-gray-200 border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed font-bold" /></div><div><label className="block text-xs font-bold text-gray-700 mb-1">Resident Name</label><input type="text" value={summonData.residentName} readOnly className="w-full bg-gray-200 border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed font-bold" /></div></div>
            <div className="grid grid-cols-2 gap-5"><div><label className="block text-xs font-bold text-gray-700 mb-1">Summon Date</label><div className="relative"><input type="date" name="summonDate" value={summonData.summonDate} onChange={handleSummonInputChange} min={today} className={`${getInputClass('summonDate', summonErrors)} py-2 text-sm`} /><Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} /></div>{summonErrors.summonDate && <p className="text-red-500 text-[10px] mt-1 font-bold">Required</p>}</div><div><label className="block text-xs font-bold text-gray-700 mb-1">Summon Time</label><div className="relative"><input type="time" name="summonTime" value={summonData.summonTime} onChange={handleSummonInputChange} className={`${getInputClass('summonTime', summonErrors)} py-2 text-sm`} /><Clock className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} /></div>{summonErrors.summonTime && <p className="text-red-500 text-[10px] mt-1 font-bold">Required</p>}</div></div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Summons No.</label>
              <div className="relative">
                <select 
                  name="summonType" 
                  value={summonData.summonType} 
                  onChange={handleSummonInputChange} 
                  className={`${getInputClass('summonType', summonErrors)} appearance-none py-2 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all cursor-pointer`}
                >
                  <option value="" disabled>Select option...</option>
                  <option value="1" disabled={takenSummons.includes('1')}>1st Summon {takenSummons.includes('1') ? '(Issued)' : ''}</option>
                  <option value="2" disabled={takenSummons.includes('2')}>2nd Summon {takenSummons.includes('2') ? '(Issued)' : ''}</option>
                  <option value="3" disabled={takenSummons.includes('3')}>3rd Summon {takenSummons.includes('3') ? '(Issued)' : ''}</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
              </div>
              {summonErrors.summonType && <p className="text-red-500 text-[10px] mt-1 font-bold">Required</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Summon Reason</label>
              <div className={`border-2 rounded-xl overflow-hidden shadow-sm flex flex-col h-40 transition-colors ${summonErrors.summonReason ? 'border-red-500' : 'border-gray-200 focus-within:border-blue-500'}`}>
                 <div className="relative flex-1 bg-white cursor-text" onClick={() => editorRef.current?.focus()}>
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="w-full h-full p-4 text-sm text-gray-600 focus:outline-none overflow-y-auto"
                        style={{ minHeight: '100%' }}
                        placeholder="Detailed description of what happened..."
                    />
                 </div>
                 <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex items-center space-x-3 text-gray-500">
                    <button onMouseDown={(e) => applyCommand(e, 'bold')} className="hover:text-[#0066FF] p-1 rounded" title="Bold"><Bold size={14} /></button>
                    <button onMouseDown={(e) => applyCommand(e, 'italic')} className="hover:text-[#0066FF] p-1 rounded" title="Italic"><Italic size={14} /></button>
                    <button onMouseDown={(e) => applyCommand(e, 'underline')} className="hover:text-[#0066FF] p-1 rounded" title="Underline"><Underline size={14} /></button>
                    <div className="h-4 w-px bg-gray-300 mx-2"></div>
                    <button onMouseDown={handleInsertLink} className="hover:text-[#0066FF] p-1 rounded" title="Link"><Link size={14} /></button>
                    <button onMouseDown={handleInsertTime} className="hover:text-[#0066FF] p-1 rounded" title="Time"><Clock size={14} /></button>
                 </div>
              </div>
              {summonErrors.summonReason && <p className="text-red-500 text-[10px] mt-1 font-bold">Required</p>}
            </div>

            <div><label className="block text-xs font-bold text-gray-700 mb-1">Noted By</label><input type="text" name="notedBy" value={summonData.notedBy} onChange={handleSummonInputChange} placeholder="Authorized Officer Name" className={`${getInputClass('notedBy', summonErrors)} py-2 text-sm`} />{summonErrors.notedBy && <p className="text-red-500 text-[10px] mt-1 font-bold">Required</p>}</div>
          </div>
          <div className="bg-white p-5 border-t border-gray-200 flex justify-end space-x-3"><button onClick={() => setView('TABLE')} className="px-5 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button><button onClick={handleSubmitSummon} className={`px-6 py-2 rounded-lg font-bold text-sm ${gradientBtnClass}`}>Submit Summon</button></div>
        </div>
      </div>
    );
  }

  // ==========================
  // VIEW: NEW CASE FORM
  // ==========================
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-blue-700 p-8 text-white"><h2 className="text-3xl font-bold">Case Report Form</h2><p className="opacity-80">Enter information for {selectedReportType} report</p></div>
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-bold text-gray-500 mb-2">REPORT TYPE</label><div className="bg-gray-100 p-4 rounded-lg font-bold text-blue-800">{selectedReportType}</div></div><div><label className="block text-sm font-bold text-gray-500 mb-2">ASSIGNED ROLE</label><div className="bg-gray-100 p-4 rounded-lg font-bold text-blue-800">{selectedRole}</div></div></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="font-bold">Case Number</label><input type="text" value={formData.caseNo} readOnly className="w-full bg-slate-100 border p-3 rounded-lg cursor-not-allowed font-mono font-bold" /></div><div><label className="font-bold">Date Filed</label><input type="date" name="dateFiled" value={formData.dateFiled} onChange={handleInputChange} max={today} className={getInputClass('dateFiled')} /></div></div>
          <div className="grid grid-cols-2 gap-8"><div className="space-y-4"><h4 className="text-blue-600 font-bold border-b pb-2">Complainant</h4><input type="text" name="complainantName" placeholder="Full Name" onChange={handleInputChange} className={getInputClass('complainantName')} /><input type="text" name="complainantContact" placeholder="Contact #" onChange={handleInputChange} className="w-full border p-3 rounded-lg" /><input type="text" name="complainantAddress" placeholder="Address" onChange={handleInputChange} className="w-full border p-3 rounded-lg" /></div><div className="space-y-4"><h4 className="text-blue-600 font-bold border-b pb-2">Defendant</h4><input type="text" name="defendantName" placeholder="Full Name" onChange={handleInputChange} className={getInputClass('defendantName')} /><input type="text" name="defendantContact" placeholder="Contact #" onChange={handleInputChange} className="w-full border p-3 rounded-lg" /><input type="text" name="defendantAddress" placeholder="Address" onChange={handleInputChange} className="w-full border p-3 rounded-lg" /></div></div>
          <div className="space-y-4"><h4 className="text-blue-600 font-bold border-b pb-2">Incident Details</h4><div className="grid grid-cols-2 gap-6"><input type="date" name="incidentDate" onChange={handleInputChange} className={getInputClass('incidentDate')} /><input type="text" name="incidentLocation" placeholder="Location" onChange={handleInputChange} className={getInputClass('incidentLocation')} /></div><textarea name="incidentDesc" rows="4" placeholder="Description" onChange={handleInputChange} className={getInputClass('incidentDesc')}></textarea></div>
          <div><h4 className="text-blue-600 font-bold border-b pb-2 mb-4">Attachments</h4><input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} /><div onClick={handleFileZoneClick} className={`border-2 border-dashed p-10 rounded-xl text-center cursor-pointer transition-all ${formErrors.attachment ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}>{attachedFiles.length > 0 ? (<div className="space-y-2">{attachedFiles.map((f, i) => <div key={i} className="text-blue-600 font-bold">{f.name}</div>)}</div>) : (<div className="text-gray-400"><Upload className="mx-auto mb-2" /> Click or Drag files to attach</div>)}</div></div>
        </div>
        <div className="bg-slate-50 p-8 border-t flex justify-end space-x-4"><button onClick={() => setView('TABLE')} className="px-8 py-3 border font-bold rounded-lg hover:bg-white transition-colors">Cancel</button><button onClick={handleSubmitCase} className={`px-10 py-3 rounded-lg font-bold ${gradientBtnClass}`}>Submit Case</button></div>
      </div>
    </div>
  );
}