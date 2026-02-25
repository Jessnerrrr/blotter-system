import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ModalCard from './components/ModalCard';
import { useLanguage } from './LanguageContext'; // TRANSLATION HOOK

// Helper to determine badge color based on report type
const REPORT_TYPE_STYLES = {
  LUPON: 'bg-blue-700 text-white',
  VAWC: 'bg-red-700 text-white',
  BLOTTER: 'bg-yellow-600 text-white',
  COMPLAIN: 'bg-green-700 text-white',
  MANUAL: 'bg-gray-800 text-white', // Special style for manually added blacklists
};

export default function Blacklisted() {
  const { t, language } = useLanguage(); // INIT TRANSLATOR & LANGUAGE STATE
  const [view, setView] = useState('TABLE'); 
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({ resident: '', contact: '', caseNo: '', reason: '' });
  const [errors, setErrors] = useState({}); // Tracking errors for the red borders

  // Mock Timeline Events matched with translation keys
  const TIMELINE_EVENTS = [
    { date: 'Jan. 12, 2026', labelKey: 'summon_issued' },
    { date: 'Jan. 20, 2026', labelKey: 'failed_to_appear' },
    { date: 'Feb. 03, 2026', labelKey: 'second_summon' },
    { date: 'Feb. 18, 2026', labelKey: 'blacklisted_approved' },
  ];

  useEffect(() => {
    const syncData = () => {
      // --- AUTO CLEAN GHOST RECORDS ---
      let storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      
      const cleanedCases = storedCases.filter(c => c.fullData !== undefined);
      
      if (cleanedCases.length !== storedCases.length) {
          localStorage.setItem('cases', JSON.stringify(cleanedCases));
          storedCases = cleanedCases; 
      }

      // 1. Get ONLY valid blacklisted cases that originated from CASE LOGS
      const blacklistedOnes = storedCases.filter(c => c.status === 'BLACKLISTED');

      // 2. Get MANUALLY added blacklisted individuals
      const manualBlacklisted = JSON.parse(localStorage.getItem('manual_blacklisted') || '[]');

      // Combine both lists for the table and sort newest first
      setRows([...blacklistedOnes, ...manualBlacklisted].sort((a,b) => b.id - a.id));
    };

    syncData();
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, []);

  const handleViewDetails = (row) => {
    setSelected(row);
    setView('DETAILS');
  };

  const handleBackToTable = () => {
    setSelected(null);
    setView('TABLE');
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setForm({ ...form, [name]: value });
      
      // Clear the red error outline as soon as the user starts typing
      if (errors[name]) {
          setErrors({ ...errors, [name]: false });
      }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    
    let newErrors = {};
    let hasError = false;

    // Check if required fields are filled
    if (!form.resident) {
        newErrors.resident = true;
        hasError = true;
    }
    
    if (!form.caseNo) {
        newErrors.caseNo = true;
        hasError = true;
    }

    if (hasError) {
        setErrors(newErrors);
        Swal.fire({
            title: language === 'tl' ? 'Kulang na Impormasyon' : 'Incomplete Fields',
            text: language === 'tl' ? 'Punan ang lahat ng kinakailangang field.' : 'Please fill out all required fields.',
            icon: 'error',
            confirmButtonColor: '#d33'
        });
        return;
    }

    // REGEX VALIDATION: Allow ONLY numbers and hyphens in Case No.
    const caseNoRegex = /^[0-9-]+$/;
    if (!caseNoRegex.test(form.caseNo)) {
        setErrors({ ...newErrors, caseNo: true });
        Swal.fire({
            title: language === 'tl' ? 'Maling Format' : 'Invalid Format',
            text: language === 'tl' ? 'Ang Case No. ay dapat maglaman lamang ng mga numero at gitling (hal. 01-166-01-2026).' : 'Case No. must only contain numbers and hyphens (e.g. 01-166-01-2026).',
            icon: 'error',
            confirmButtonColor: '#d33'
        });
        return;
    }

    // CONFIRMATION BEFORE SAVING (Forced Language Check)
    Swal.fire({
        title: language === 'tl' ? 'Idagdag sa Blacklist?' : 'Add to Blacklist?',
        text: language === 'tl' ? 'Sigurado ka bang nais mong i-blacklist ang residenteng ito?' : 'Are you sure you want to blacklist this resident?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        confirmButtonText: language === 'tl' ? 'Oo, idagdag' : 'Yes, add record',
        cancelButtonText: language === 'tl' ? 'Kanselahin' : 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            
            // SAVE TO 'manual_blacklisted' INSTEAD OF 'cases'
            const manualBlacklisted = JSON.parse(localStorage.getItem('manual_blacklisted') || '[]');
            const newEntry = { 
                id: Date.now(), 
                caseNo: form.caseNo, 
                resident: form.resident, 
                contact: form.contact || '0912-345-6789', 
                type: 'MANUAL', // Marked as manual
                status: 'BLACKLISTED',
                reason: form.reason || 'Repeated Case Violation', 
                date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
                isManual: true // Important flag to differentiate it
            };

            manualBlacklisted.unshift(newEntry);
            localStorage.setItem('manual_blacklisted', JSON.stringify(manualBlacklisted));
            
            // Dispatch event so the table updates instantly
            window.dispatchEvent(new Event('storage')); 
            
            setForm({ resident: '', contact: '', caseNo: '', reason: '' });
            setErrors({});
            setShowAddModal(false);
            
            Swal.fire({ 
              icon: 'success', 
              title: language === 'tl' ? 'Naidagdag!' : 'Added!', 
              text: language === 'tl' ? `Si ${newEntry.resident} ay na-blacklist.` : `${newEntry.resident} has been blacklisted.`, 
              confirmButtonColor: '#2563eb' 
            });
        }
    });
  };

  const handleCloseAddModal = () => {
    if (form.resident || form.caseNo || form.reason) {
        Swal.fire({
            title: language === 'tl' ? 'Balewalain ang mga pagbabago?' : 'Discard Changes?',
            text: language === 'tl' ? 'Mawawala ang anumang hindi na-save na pagbabago.' : 'Any unsaved changes will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: language === 'tl' ? 'Oo, balewalain' : 'Yes, discard',
            cancelButtonText: language === 'tl' ? 'Kanselahin' : 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                setForm({ resident: '', contact: '', caseNo: '', reason: '' });
                setErrors({});
                setShowAddModal(false);
            }
        });
    } else {
        setErrors({});
        setShowAddModal(false);
    }
  };

  const handleRemove = (row) => {
    Swal.fire({
        title: language === 'tl' ? 'Alisin sa Blacklist?' : 'Lift Restriction?',
        text: language === 'tl' ? `Ililipat ba si ${row.resident} sa Archives?` : `Move ${row.resident}'s record to Archives?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: language === 'tl' ? 'Oo, alisin' : 'Yes, lift restriction',
        cancelButtonText: language === 'tl' ? 'Kanselahin' : 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            
            if (row.isManual) {
                // 1. Remove from manual_blacklisted
                const manualBlacklisted = JSON.parse(localStorage.getItem('manual_blacklisted') || '[]');
                const updatedManual = manualBlacklisted.filter(c => c.id !== row.id);
                localStorage.setItem('manual_blacklisted', JSON.stringify(updatedManual));
                
                // 2. Add to 'cases' as SETTLED so it appears in Archives
                const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
                const archivedManualRecord = {
                    ...row,
                    status: 'SETTLED',
                    fullData: {
                        caseNo: row.caseNo,
                        dateFiled: row.date,
                        complainantName: 'Direct Entry',
                        complainantContact: 'N/A',
                        complainantAddress: 'N/A',
                        defendantName: row.resident,
                        defendantContact: row.contact || 'N/A',
                        defendantAddress: 'N/A',
                        incidentDate: row.date,
                        incidentLocation: 'N/A',
                        incidentDesc: row.reason || 'Manually added to blacklist, restriction now lifted.',
                        selectedReportType: 'MANUAL',
                        selectedRole: 'System'
                    }
                };
                allCases.unshift(archivedManualRecord);
                localStorage.setItem('cases', JSON.stringify(allCases));

            } else {
                // If it came from Case Logs originally, just revert its status to SETTLED
                const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
                const updatedCases = allCases.map(c => c.id === row.id || c.caseNo === row.caseNo ? { ...c, status: 'SETTLED' } : c);
                localStorage.setItem('cases', JSON.stringify(updatedCases));
            }

            window.dispatchEvent(new Event('storage'));
            if(view === 'DETAILS') setView('TABLE');
            
            Swal.fire(
              language === 'tl' ? 'Naalis na!' : 'Restriction Lifted!', 
              language === 'tl' ? 'Ang record ay inilipat sa Archives.' : 'Record moved to Archives.', 
              'success'
            );
        }
    });
  };

  const filteredRows = rows.filter((row) => 
    row.resident?.toLowerCase().includes(search.toLowerCase()) ||
    row.caseNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative">
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        
        {/* VIEW: DETAILS */}
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                
                {/* 1. Blue Header Bar */}
                <div className="bg-[#0044CC] p-4 rounded-lg shadow-sm">
                    <h1 className="text-xl font-bold text-white">{t('blacklisted_case_details')}</h1>
                </div>

                {/* 2. Profile Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 shrink-0"></div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#0044CC]">{selected.resident}</h2>
                        <p className="text-sm text-gray-600 font-medium mt-1">{t('resident_id')}: {selected.caseNo}</p>
                        <div className="mt-3">
                            <span className="bg-black text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                                {t('blacklisted')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Resident Information Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-[#0044CC]"></div>
                        <h3 className="text-xl font-bold text-[#0044CC]">{t('resident_info')}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-8">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('household_no')}</p>
                            <p className="text-sm font-bold text-gray-900">HN4820450670</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('contact_number')}</p>
                            <p className="text-sm font-bold text-gray-900">{selected.contact || '0914-430-1203'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('address')}</p>
                            <p className="text-sm font-bold text-gray-900">Blk.1 Lot 2, Caloocan City, Metro Manila</p>
                        </div>
                    </div>
                </div>

                {/* 4. Blacklist Information Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-[#2b85ff] relative">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-[#0044CC]"></div>
                        <h3 className="text-xl font-bold text-[#0044CC]">{t('blacklist_info')}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-8 mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p>
                            <p className="text-sm font-bold text-gray-900">{selected.caseNo}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_type')}</p>
                            <p className="text-sm font-bold text-gray-900 font-sans capitalize">{selected.type === 'MANUAL' ? 'Direct Entry' : selected.type}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_blacklisted')}</p>
                            <p className="text-sm font-bold text-gray-900">{selected.date}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p>
                            <p className="text-sm font-bold text-gray-900">Lupon Tagapamayapa</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('reason')}</p>
                        <p className="text-xs font-bold text-gray-900 leading-relaxed">
                            {selected.reason || t('default_reason_desc')}
                        </p>
                    </div>
                </div>

                {/* 5. Case Timeline Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-[#0044CC]"></div>
                        <h3 className="text-xl font-bold text-[#0044CC]">{t('case_timeline')}</h3>
                    </div>
                    
                    <div className="relative pl-2">
                        {/* Vertical Line */}
                        <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-blue-600"></div>
                        
                        <div className="space-y-6">
                            {TIMELINE_EVENTS.map((event, i) => (
                                <div key={i} className="flex items-center gap-4 relative">
                                    {/* Dot */}
                                    <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm z-10"></div>
                                    <p className="text-[10px] font-bold text-gray-800">
                                        {event.date} - {t(event.labelKey)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Back Button */}
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleBackToTable} 
                        className="bg-[#A0A0A0] hover:bg-gray-500 text-white text-[10px] font-bold px-6 py-2 rounded shadow-sm transition-colors uppercase tracking-wide"
                    >
                        {t('back_to_blacklist')}
                    </button>
                </div>
            </div>
          </div>
        ) : (
          
        /* VIEW: MAIN TABLE */
          <div className="flex-1 flex flex-col w-full h-full">
            {/* Header Banner */}
            <div className="bg-[#0044CC] px-8 py-8 rounded-t-2xl shadow-sm">
                <h1 className="text-3xl font-black text-white tracking-wide uppercase">{t('blacklisted_case_records')}</h1>
                <p className="text-blue-100 text-sm mt-1 font-medium">{t('blacklisted_subtitle')}</p>
            </div>

            {/* White Content Area */}
            <div className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                        <input 
                            type="text" 
                            placeholder={t('search_resident')} 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#0077CC] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <span className="text-lg leading-none">+</span> {t('add_blacklisted')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-900 text-xs font-bold uppercase border-b border-gray-100">
                                <th className="py-4 px-2 w-16">{t('no')}</th>
                                <th className="py-4 px-2 w-[25%]">{t('resident')}</th>
                                <th className="py-4 px-2 w-[20%]">{t('household_no')}</th>
                                <th className="py-4 px-2 w-[15%]">{t('status')}</th>
                                <th className="py-4 px-2 w-[25%]">{t('reason')}</th>
                                <th className="py-4 px-2 text-right">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredRows.map((row, index) => (
                                <tr key={row.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors group">
                                    <td className="py-4 px-2 text-blue-600 font-bold">{String(index + 1).padStart(2, '0')}</td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                                            <span className="font-bold text-gray-700">{row.resident}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-gray-600 font-medium">HN4820450670</td>
                                    <td className="py-4 px-2"><span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">{t('blacklisted')}</span></td>
                                    <td className="py-4 px-2 text-gray-600 font-medium">{row.reason || 'Repeated Case Violation'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleViewDetails(row)} className="bg-[#4A72B2] hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded shadow-sm transition-colors">{t('view')}</button>
                                            <button onClick={() => handleRemove(row)} className="bg-[#EF4444] hover:bg-red-600 text-white text-[10px] font-bold px-4 py-1.5 rounded shadow-sm transition-colors">{t('remove')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRows.length === 0 && (<tr><td colSpan={6} className="py-12 text-center text-gray-400 font-medium">{t('no_blacklisted_found')}</td></tr>)}
                        </tbody>
                    </table>
                    {filteredRows.length > 0 && (<div className="flex items-center justify-center mt-8 opacity-50"><div className="h-px bg-gray-300 w-24"></div><span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t('nothing_follows')}</span><div className="h-px bg-gray-300 w-24"></div></div>)}
                </div>
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showAddModal && (
          <ModalCard title={t('blacklist_entry') || 'Blacklist Entry'} onClose={handleCloseAddModal}>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 gap-4">
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">{t('resident_name') || 'RESIDENT NAME'}</span>
                    <input 
                        type="text" 
                        name="resident"
                        className={`rounded-lg border px-4 py-3 font-bold outline-none transition-colors ${errors.resident ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-gray-300 bg-gray-50 focus:border-blue-600'}`} 
                        value={form.resident} 
                        onChange={handleInputChange} 
                        placeholder={t('full_name') || 'Full Name'} 
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">{t('case_no') || 'CASE NO.'}</span>
                    <input 
                        type="text" 
                        name="caseNo"
                        className={`rounded-lg border px-4 py-3 font-bold outline-none transition-colors ${errors.caseNo ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-gray-300 bg-gray-50 focus:border-blue-600'}`} 
                        value={form.caseNo} 
                        onChange={handleInputChange} 
                        placeholder="01-166-01-2026" 
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">{t('reason') || 'REASON'}</span>
                    <textarea 
                        name="reason"
                        className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-blue-600 min-h-[100px] transition-colors" 
                        value={form.reason} 
                        onChange={handleInputChange} 
                        placeholder={t('detailed_reason') || 'Detailed reason...'} 
                    />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={handleCloseAddModal} className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">{t('cancel') || 'Cancel'}</button>
                  <button type="submit" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-colors">{t('add_record') || 'Add Record'}</button>
              </div>
            </form>
          </ModalCard>
        )}
      </div>
    </div>
  );
}