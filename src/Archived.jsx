import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft } from 'lucide-react'; 
import { useLanguage } from './LanguageContext'; // TRANSLATION HOOK

// --- STYLES ---
const REPORT_TYPE_STYLES = {
  LUPON: 'bg-blue-700 text-white',
  VAWC: 'bg-red-700 text-white',
  BLOTTER: 'bg-yellow-600 text-white',
  COMPLAIN: 'bg-green-700 text-white',
  CURFEW: 'bg-purple-600 text-white', // Added special badge color for Curfews
};

export default function Archived() {
  const { t } = useLanguage(); // INIT TRANSLATOR
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null); 

  // --- LOAD REAL DATA (CASES + CURFEWS) ---
  useEffect(() => {
    const loadData = () => {
      // Load standard cases
      const storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      const archivedCases = storedCases.filter(c => c.status === 'SETTLED');

      // Load curfew cases
      const storedCurfews = JSON.parse(localStorage.getItem('curfew_violations') || '[]');
      const archivedCurfews = storedCurfews
        .filter(c => c.status === 'Settled')
        .map(c => ({
            ...c,
            isCurfew: true,
            type: 'CURFEW',
            caseNo: `CRFW-${c.id.padStart(3, '0')}`, // Create a visual case number 
        }));

      // Combine and sort by newest first
      const combined = [...archivedCases, ...archivedCurfews].sort((a, b) => new Date(b.date) - new Date(a.date));
      setRows(combined);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // --- HANDLERS ---
  const handleViewDetails = (row) => {
    setSelected(row);
    setView('DETAILS');
  };

  const handleBackToTable = () => {
    setSelected(null);
    setView('TABLE');
  };

  const handleRestore = (row) => {
    Swal.fire({
      title: t('swal_restore_title'),
      text: t('swal_restore_text').replace('{caseNo}', row.caseNo),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: t('swal_yes_restore'),
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        if (row.isCurfew) {
            // Restore to Curfew Logs
            const allCurfews = JSON.parse(localStorage.getItem('curfew_violations') || '[]');
            const updatedCurfews = allCurfews.map(c => c.id === row.id ? { ...c, status: 'Unsettled' } : c);
            localStorage.setItem('curfew_violations', JSON.stringify(updatedCurfews));
        } else {
            // Restore to Case Logs
            const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
            const updatedCases = allCases.map(c => c.caseNo === row.caseNo ? { ...c, status: 'PENDING' } : c);
            localStorage.setItem('cases', JSON.stringify(updatedCases));
        }
        
        window.dispatchEvent(new Event('storage'));
        
        if(view === 'DETAILS') setView('TABLE');
        Swal.fire(t('swal_restored'), t('swal_restored_text'), 'success');
      }
    });
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: t('swal_delete_title'),
      text: t('swal_delete_text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('swal_yes_delete'),
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        if (row.isCurfew) {
            // Delete from Curfew Logs completely
            const allCurfews = JSON.parse(localStorage.getItem('curfew_violations') || '[]');
            const updatedCurfews = allCurfews.filter(c => c.id !== row.id);
            localStorage.setItem('curfew_violations', JSON.stringify(updatedCurfews));
        } else {
            // Delete from Case Logs completely
            const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
            const updatedCases = allCases.filter(c => c.caseNo !== row.caseNo);
            localStorage.setItem('cases', JSON.stringify(updatedCases));
        }

        // ============================================================
        // NEW: CASCADE DELETE (Automatically wipe attached Summons)
        // ============================================================
        const allSummons = JSON.parse(localStorage.getItem('summons') || '[]');
        const updatedSummons = allSummons.filter(s => s.caseNo !== row.caseNo);
        localStorage.setItem('summons', JSON.stringify(updatedSummons));

        // Dispatch storage event so the UI globally refreshes
        window.dispatchEvent(new Event('storage'));

        if(view === 'DETAILS') setView('TABLE');
        Swal.fire(t('swal_deleted'), t('swal_deleted_text'), 'success');
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative">
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        
        {/* --- VIEW: DETAILS --- */}
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            
            {/* Header WITH BACK BUTTON */}
            <div className="bg-[#0044CC] px-6 py-4 text-white shadow-md shrink-0 rounded-t-xl flex items-center gap-3">
              <button 
                onClick={handleBackToTable}
                className="hover:bg-blue-600 p-1.5 rounded-full transition-colors flex items-center justify-center -ml-2"
                title={t('back')}
              >
                <ChevronLeft size={26} strokeWidth={2.5} />
              </button>
              <h1 className="text-xl font-bold">{t('archived_case_details')}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              
              {/* 1. Case Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">{t('case_summary')}</h3>
                </div>
                
                <div className="flex gap-2 mb-6">
                    <span className={`${REPORT_TYPE_STYLES[selected.type] || 'bg-[#FCD34D] text-yellow-800'} text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide`}>
                        {selected.type}
                    </span>
                    <span className="bg-gray-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                        {t('archived_badge')}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.caseNo}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('resident_name')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.resident}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_filed')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.date}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_closed')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.date}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('archived_date')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.date}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.isCurfew ? 'Barangay Officials' : 'Lupon Tagapamayapa'}</p>
                    </div>
                </div>
              </div>

              {/* 2. Case Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">{t('case_details_title')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-6 mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('complainant')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.isCurfew ? 'Barangay Patrol' : (selected.complainantName || 'N/A')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('defendants')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.resident}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('incident_date')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.incidentDate || selected.date}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('location')}</p>
                        <p className="text-sm font-bold text-gray-800">{selected.isCurfew ? selected.address : (selected.incidentLocation || '166, Caloocan City')}</p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium">
                        {selected.isCurfew ? 'Resident was logged for a curfew violation and the case has now been officially settled.' : (selected.incidentDesc || t('archived_mock_desc'))}
                    </div>
                </div>
              </div>

              {/* 3. Resolution Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">{t('resolution_summary')}</h3>
                </div>
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('settlement_status')}</p>
                    <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                        {t('settled').toUpperCase()}
                    </span>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p>
                    <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 font-bold">
                        {t('archived_mock_resolution')}
                    </div>
                </div>
              </div>

              {/* 4. Attached Documents (Hide for curfews) */}
              {!selected.isCurfew && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                        <h3 className="text-lg font-bold text-[#0044CC]">{t('attached_documents')}</h3>
                    </div>
                    <div className="space-y-3">
                        {[1].map((_, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-gray-700">Case_Report.pdf</span>
                                <div className="flex gap-2">
                                    <button className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors">{t('download')}</button>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1 rounded-full transition-colors">{t('view')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              )}

              {/* 5. Archived Information */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">{t('archived_information')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('archived_by')}</p>
                        <p className="text-xs font-bold text-gray-800">{t('barangay_admin')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('reason_for_archiving')}</p>
                        <p className="text-xs font-bold text-gray-800">{t('archived_mock_reason')}</p>
                    </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          
        /* --- VIEW: TABLE --- */
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="rounded-t-2xl bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-8 shadow-md shrink-0">
              <h1 className="text-3xl font-bold uppercase tracking-wide text-white">{t('archived_cases')}</h1>
              <p className="mt-2 text-sm font-medium text-white/80">{t('archived_subtitle')}</p>
            </div>

            <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 shrink-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-gray-700">{t('total_settled')}: {rows.length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6 md:px-8 w-full">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b-2 border-blue-100 text-blue-900">
                    <th className="px-4 py-4 text-left font-bold uppercase w-[15%]">{t('report_type')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">{t('case_number')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[35%]">{t('resident_name')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[30%]">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id || row.caseNo} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-5">
                        <span className={`inline-block rounded px-3 py-1 text-[10px] font-bold shadow-sm ${REPORT_TYPE_STYLES[row.type] || 'bg-gray-500 text-white'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-5 font-bold text-gray-700">{row.caseNo}</td>
                      <td className="px-4 py-5 font-medium text-gray-600">{row.resident}</td>
                      <td className="px-4 py-5">
                        <div className="flex gap-2">
                          <button 
                            className="rounded-lg bg-green-100 text-green-700 px-3 py-1.5 text-xs font-bold hover:bg-green-200 transition-colors" 
                            onClick={() => handleRestore(row)}
                          >
                            {t('restore')}
                          </button>
                          <button 
                            className="rounded-lg bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-bold hover:bg-blue-200 transition-colors" 
                            onClick={() => handleViewDetails(row)}
                          >
                            {t('view')}
                          </button>
                          <button 
                            className="rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-200 transition-colors" 
                            onClick={() => handleDelete(row)}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                      <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold">{t('no_settled_cases')}</td></tr>
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