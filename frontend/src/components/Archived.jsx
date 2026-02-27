import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Calendar, Filter, ChevronDown } from 'lucide-react'; 
import { useLanguage } from './LanguageContext'; 
import { ArchivedButton } from './buttons/Buttons'; // Change button name per page

const getTypeStyle = (type) => {
  switch (type) {
    case 'LUPON': return 'bg-green-600 text-white';
    case 'VAWC': return 'bg-purple-600 text-white';
    case 'BLOTTER': return 'bg-red-600 text-white';
    case 'COMPLAIN': return 'bg-blue-600 text-white';
    case 'CURFEW': return 'bg-indigo-600 text-white';
    case 'MANUAL': return 'bg-gray-800 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export default function Archived() {
  const { t, language } = useLanguage(); 
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null); 
  const [search, setSearch] = useState('');

  const allYearsText = t('all_years') || 'All Years';
  const allTypesText = t('all_types') || 'All Types';

  const [isYearSortOpen, setIsYearSortOpen] = useState(false);
  const [isTypeSortOpen, setIsTypeSortOpen] = useState(false);
  const [sortYear, setSortYear] = useState(allYearsText);
  const [sortType, setSortType] = useState(allTypesText);

  const currentYear = new Date().getFullYear();
  const yearOptions = [allYearsText, ...Array.from({length: 7}, (_, i) => (currentYear - i).toString())];
  
  const typeOptions = [
    { label: allTypesText, color: 'bg-gray-400' },
    { label: 'LUPON', color: 'bg-green-600' },
    { label: 'VAWC', color: 'bg-purple-600' },
    { label: 'BLOTTER', color: 'bg-red-600' },
    { label: 'COMPLAIN', color: 'bg-blue-600' },
    { label: 'CURFEW', color: 'bg-indigo-600' },
    { label: 'MANUAL', color: 'bg-gray-800' }
  ];

  useEffect(() => {
    const loadData = () => {
      // Archive ONLY holds "SETTLED" cases
      const storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      const archivedCases = storedCases.filter(c => c.status === 'SETTLED');

      const storedCurfews = JSON.parse(localStorage.getItem('curfew_violations') || '[]');
      const archivedCurfews = storedCurfews
        .filter(c => c.status === 'Settled')
        .map(c => ({
            ...c,
            isCurfew: true,
            type: 'CURFEW',
            caseNo: `CRFW-${c.id.padStart(3, '0')}`,
        }));

      const combined = [...archivedCases, ...archivedCurfews].sort((a, b) => new Date(b.date) - new Date(a.date));
      setRows(combined);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredRows = rows.filter((row) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
        (row.caseNo && row.caseNo.toLowerCase().includes(searchLower)) ||
        (row.resident && row.resident.toLowerCase().includes(searchLower)) ||
        (row.complainantName && row.complainantName.toLowerCase().includes(searchLower));

    let rowYear = '';
    if (row.date) {
        const d = new Date(row.date);
        if (!isNaN(d)) rowYear = d.getFullYear().toString();
    }
    const matchesYear = (sortYear === allYearsText) || rowYear === sortYear;
    const matchesType = (sortType === allTypesText) || row.type === sortType;

    return matchesSearch && matchesYear && matchesType;
  });

  const handleViewDetails = (row) => { setSelected(row); setView('DETAILS'); };
  const handleBackToTable = () => { setSelected(null); setView('TABLE'); };

  // --- SMART RESTORE LOGIC ---
  const handleRestore = (row) => {
    Swal.fire({
      title: t('swal_restore_title') || 'Restore Record?',
      text: `Restore ${row.caseNo} back to its previous page?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: t('swal_yes_restore') || 'Yes, restore',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        if (row.isCurfew) {
            const allCurfews = JSON.parse(localStorage.getItem('curfew_violations') || '[]');
            const updatedCurfews = allCurfews.map(c => c.id === row.id ? { ...c, status: 'Unsettled' } : c);
            localStorage.setItem('curfew_violations', JSON.stringify(updatedCurfews));
        } else if (row.type === 'MANUAL') {
            const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
            const updatedCases = allCases.map(c => c.caseNo === row.caseNo ? { ...c, status: 'BLACKLISTED' } : c);
            localStorage.setItem('cases', JSON.stringify(updatedCases));
        } else {
            const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
            const updatedCases = allCases.map(c => c.caseNo === row.caseNo ? { ...c, status: 'PENDING' } : c);
            localStorage.setItem('cases', JSON.stringify(updatedCases));
        }
        
        window.dispatchEvent(new Event('storage'));
        if(view === 'DETAILS') setView('TABLE');
        Swal.fire(t('swal_restored') || 'Restored!', t('swal_restored_text') || 'The record has been restored to its previous page.', 'success');
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={() => { setIsYearSortOpen(false); setIsTypeSortOpen(false); }}>
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-[#0044CC] px-6 py-4 text-white shadow-md shrink-0 rounded-t-xl flex items-center gap-3">
              <button onClick={handleBackToTable} className="hover:bg-blue-600 p-1.5 rounded-full transition-colors flex items-center justify-center -ml-2"><ChevronLeft size={26} strokeWidth={2.5} /></button>
              <h1 className="text-xl font-bold">{t('archived_case_details') || 'Archived Case Details'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC]">{t('case_summary')}</h3></div>
                <div className="flex gap-2 mb-6">
                    <span className={`${getTypeStyle(selected.type)} text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide`}>{selected.type}</span>
                    <span className="bg-gray-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">SETTLED</span>
                </div>
                <div className="grid grid-cols-2 gap-y-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p><p className="text-sm font-bold text-gray-800">{selected.caseNo}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('resident_name')}</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_filed')}</p><p className="text-sm font-bold text-gray-800">{selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_closed')}</p><p className="text-sm font-bold text-gray-800">{selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('archived_date')}</p><p className="text-sm font-bold text-gray-800">{selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p><p className="text-sm font-bold text-gray-800">{selected.isCurfew ? 'Barangay Officials' : (selected.fullData?.selectedRole || 'Lupon Tagapamayapa')}</p></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC]">{t('case_details_title')}</h3></div>
                <div className="grid grid-cols-2 gap-y-6 mb-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('complainant')}</p><p className="text-sm font-bold text-gray-800">{selected.isCurfew ? 'Barangay Patrol' : (selected.complainantName || 'N/A')}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('defendants')}</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('incident_date')}</p><p className="text-sm font-bold text-gray-800">{selected.fullData?.incidentDate || selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('location')}</p><p className="text-sm font-bold text-gray-800">{selected.isCurfew ? selected.address : (selected.fullData?.incidentLocation || '166, Caloocan City')}</p></div>
                </div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p><div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium">{selected.isCurfew ? 'Resident was logged for a curfew violation and the case has now been officially settled.' : (selected.fullData?.incidentDesc || t('archived_mock_desc'))}</div></div>
              </div>

              {!selected.isCurfew && selected.type !== 'MANUAL' && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC]">{t('attached_documents')}</h3></div>
                    <div className="space-y-3">
                        {[1].map((_, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-gray-700">Case_Report.pdf</span>
                                <div className="flex gap-2"><button className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors">{t('download') || 'Download'}</button><button className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1 rounded-full transition-colors">{t('view') || 'View'}</button></div>
                            </div>
                        ))}
                    </div>
                  </div>
              )}
            </div>
          </div>
        ) : (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="rounded-t-2xl bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-8 shadow-md shrink-0">
              <h1 className="text-3xl font-bold uppercase tracking-wide text-white">{t('archived_cases') || 'Archived Cases'}</h1>
              <p className="mt-2 text-sm font-medium text-white/80">{t('archived_subtitle') || 'View all settled and resolved records.'}</p>
            </div>

            <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 shrink-0 relative z-20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('total_settled') || 'Total Records'}: {filteredRows.length}</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsYearSortOpen(!isYearSortOpen); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"><div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{sortYear}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" /></button>
                    {isYearSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">{yearOptions.map(y => (<div key={y} onClick={() => { setSortYear(y); setIsYearSortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">{y}</div>))}</div>)}
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsTypeSortOpen(!isTypeSortOpen); setIsYearSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"><div className="flex items-center"><Filter size={18} className="mr-2 text-gray-500" /><span>{sortType}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" /></button>
                    {isTypeSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">{typeOptions.map(o => (<div key={o.label} onClick={() => { setSortType(o.label); setIsTypeSortOpen(false); }} className="px-4 py-3 text-sm font-bold hover:bg-blue-50 cursor-pointer flex items-center text-gray-700 border-b last:border-0"><span className={`w-2.5 h-2.5 rounded-full ${o.color} mr-3`} />{o.label}</div>))}</div>)}
                  </div>
                  <div className="relative w-full sm:w-72">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
                    <input type="text" placeholder={t('search_placeholder') || 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6 md:px-8 w-full z-10 relative">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="border-b-2 border-blue-100 text-blue-900">
                    <th className="px-4 py-4 text-left font-bold uppercase w-[15%]">{t('report_type')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">{t('case_number')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[35%]">{t('resident_name')}</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[30%]">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id || row.caseNo} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-5"><span className={`inline-block rounded px-3 py-1 text-[10px] font-bold shadow-sm uppercase tracking-wide ${getTypeStyle(row.type)}`}>{row.type}</span></td>
                      <td className="px-4 py-5 font-bold text-gray-700">{row.caseNo}</td>
                      <td className="px-4 py-5 font-medium text-gray-600">{row.resident || row.complainantName}</td>
                      <td className="px-4 py-5">
                        <div className="flex gap-2">
                          {/* --- LOOK HERE! USING YOUR MASTER BUTTON --- */}
                          <ArchivedButton actionType="restore" onClick={() => handleRestore(row)}>
                            {t('restore') || 'Restore'}
                          </ArchivedButton>
                          <ArchivedButton actionType="view" onClick={() => handleViewDetails(row)}>
                            {t('view') || 'View'}
                          </ArchivedButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (<tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold">{t('no_settled_cases') || 'No records found.'}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}