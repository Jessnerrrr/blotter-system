import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ChevronLeft, Calendar, Filter, ChevronDown, Search } from 'lucide-react'; 
import { useLanguage } from './LanguageContext'; 
import { blacklistAPI, casesAPI, summonsAPI } from "../services/api"; 

import { BlacklistedButton } from './buttons/Buttons';

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

export default function Blacklisted() {
  const { t } = useLanguage(); 
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null); 
  const [search, setSearch] = useState('');

  const allYearsText = t('all_years') || 'All Years';
  const allTypesText = t('all_types') || 'All Types';

  const [isYearSortOpen, setIsYearSortOpen] = useState(false);
  const [isTypeSortOpen, setIsTypeSortOpen] = useState(false);
  const [isMonthSortOpen, setIsMonthSortOpen] = useState(false); // Added Month Sort State
  const [isDaySortOpen, setIsDaySortOpen] = useState(false); // Added Day Sort State

  const [sortYear, setSortYear] = useState(allYearsText);
  const [filterMonth, setFilterMonth] = useState('All Months'); // Added Month Filter State
  const [filterDay, setFilterDay] = useState('All Days'); // Added Day Filter State
  const [sortType, setSortType] = useState(allTypesText);

  const currentYear = new Date().getFullYear();
  const yearOptions = [allYearsText, ...Array.from({length: 7}, (_, i) => (currentYear - i).toString())];
  const monthOptions = ['All Months', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']; // Added Month Options
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; // Added Month Names
  const dayOptions = ['All Days', ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))]; // Added Day Options
  
  const typeOptions = [
    { label: allTypesText, color: 'bg-gray-400' },
    { label: 'LUPON', color: 'bg-green-600' },
    { label: 'VAWC', color: 'bg-purple-600' },
    { label: 'BLOTTER', color: 'bg-red-600' },
    { label: 'COMPLAIN', color: 'bg-blue-600' },
    
  ];

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

  const filteredRows = rows.filter((row) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
        (row.caseNo && row.caseNo.toLowerCase().includes(searchLower)) ||
        (row.resident && row.resident.toLowerCase().includes(searchLower)) ||
        (row.complainantName && row.complainantName.toLowerCase().includes(searchLower));

    let rowYear = '';
    let rowMonth = '';
    let rowDay = '';

    // Extract year, month, and day based on the date format
    if (row.date) {
        const itemDateParts = row.date.split('-');
        if (itemDateParts.length === 3) {
            if (itemDateParts[2].length === 4) { // MM-DD-YYYY
                rowYear = itemDateParts[2];
                rowMonth = itemDateParts[0].padStart(2, '0');
                rowDay = itemDateParts[1].padStart(2, '0');
            } else { // YYYY-MM-DD
                rowYear = itemDateParts[0];
                rowMonth = itemDateParts[1].padStart(2, '0');
                rowDay = itemDateParts[2].padStart(2, '0');
            }
        } else {
            // Fallback for valid dates not caught by manual split
            const d = new Date(row.date);
            if (!isNaN(d)) {
                rowYear = d.getFullYear().toString();
                rowMonth = String(d.getMonth() + 1).padStart(2, '0');
                rowDay = String(d.getDate()).padStart(2, '0');
            }
        }
    }

    const matchesYear = (sortYear === allYearsText) || rowYear === sortYear;
    const matchesMonth = filterMonth === 'All Months' || rowMonth === filterMonth;
    const matchesDay = filterDay === 'All Days' || rowDay === filterDay;
    const matchesType = (sortType === allTypesText) || row.type === sortType;

    return matchesSearch && matchesYear && matchesMonth && matchesDay && matchesType;
  });

  const handleViewDetails = (row) => { setSelected(row); setView('DETAILS'); };
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

  // --- 🔥 NEW ARCHIVE LOGIC INSTEAD OF DELETE 🔥 ---
  const handleArchive = (row) => {
    Swal.fire({
      title: 'Move to Archives?',
      text: `Are you sure you want to archive ${row.caseNo}? It will be marked as Settled.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b', // Yellow/Orange warning color
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (row.type === 'CURFEW') {
              // If it's purely a manual blacklist entry, moving to archive just deletes it from the blacklist 
              // because manual entries don't have a "Settled" state in the database.
              await blacklistAPI.delete(row._id);
          } else {
              // If it's a real case, update the status to SETTLED so it moves to Archives
              await casesAPI.update(row._id, { ...row, status: 'SETTLED' });
              
              // Also update any attached summons to Settled
              const allSummons = await summonsAPI.getAll();
              const summonsToArchive = allSummons.filter(s => s.caseNo === row.caseNo);
              await Promise.all(summonsToArchive.map(s => summonsAPI.update(s._id, { ...s, status: 'Settled' })));
          }

          // Reload data to remove it from this page
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

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative" onClick={() => { setIsYearSortOpen(false); setIsTypeSortOpen(false); setIsMonthSortOpen(false); setIsDaySortOpen(false); }}>
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-[#0044CC] px-6 py-4 text-white shadow-md shrink-0 rounded-t-xl flex items-center gap-3">
              <button onClick={handleBackToTable} className="hover:bg-blue-600 p-1.5 rounded-full transition-colors flex items-center justify-center -ml-2"><ChevronLeft size={26} strokeWidth={2.5} /></button>
              <h1 className="text-xl font-bold">{t('blacklisted_case_details') || 'Blacklisted Case Details'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC]">{t('case_summary')}</h3></div>
                <div className="flex gap-2 mb-6">
                    <span className={`${getTypeStyle(selected.type)} text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide`}>{selected.type}</span>
                    <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">{t('blacklisted')}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('case_number')}</p><p className="text-sm font-bold text-gray-800">{selected.caseNo}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('resident_name')}</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('date_filed')}</p><p className="text-sm font-bold text-gray-800">{selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('moderator')}</p><p className="text-sm font-bold text-gray-800">{selected.fullData?.selectedRole || 'Admin'}</p></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6"><h3 className="text-lg font-bold text-[#0044CC]">{t('case_details_title')}</h3></div>
                <div className="grid grid-cols-2 gap-y-6 mb-6">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('complainant')}</p><p className="text-sm font-bold text-gray-800">{selected.complainantName || 'N/A'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('respondents')}</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('incident_date')}</p><p className="text-sm font-bold text-gray-800">{selected.fullData?.incidentDate || selected.date}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('location')}</p><p className="text-sm font-bold text-gray-800">{selected.fullData?.incidentLocation || '166, Caloocan City'}</p></div>
                </div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t('detailed_description')}</p><div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium">{selected.fullData?.incidentDesc || t('default_reason_desc') || 'Resident was permanently blacklisted.'}</div></div>
              </div>
            </div>
          </div>
        ) : (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-5 text-white shadow-md shrink-0">
              <h1 className="text-2xl font-bold">{t('blacklisted_case_records') || 'BLACKLISTED CASES'}</h1>
              <p className="text-sm text-white/80">{t('blacklisted_subtitle') || 'View residents permanently blacklisted from the community.'}</p>
            </div>

            <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 shrink-0 relative z-20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('total_blacklisted') || 'Total Blacklisted'}: {filteredRows.length}</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsYearSortOpen(!isYearSortOpen); setIsTypeSortOpen(false); setIsMonthSortOpen(false); setIsDaySortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"><div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{sortYear}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" /></button>
                    {isYearSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 custom-scrollbar">{yearOptions.map(y => (<div key={y} onClick={() => { setSortYear(y); setIsYearSortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">{y}</div>))}</div>)}
                  </div>
                  
                  {/* 🔥 NEW MONTH FILTER 🔥 */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsMonthSortOpen(!isMonthSortOpen); setIsYearSortOpen(false); setIsTypeSortOpen(false); setIsDaySortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{filterMonth === 'All Months' ? 'All Months' : monthNames[parseInt(filterMonth)-1] || filterMonth}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" />
                    </button>
                    {isMonthSortOpen && (
                      <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 custom-scrollbar">
                        {monthOptions.map(m => (
                          <div key={m} onClick={() => { setFilterMonth(m); setIsMonthSortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">
                            {m === 'All Months' ? m : monthNames[parseInt(m)-1] || m}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 🔥 NEW DAY FILTER 🔥 */}
                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsDaySortOpen(!isDaySortOpen); setIsMonthSortOpen(false); setIsYearSortOpen(false); setIsTypeSortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center"><Calendar size={18} className="mr-2 text-gray-500" /><span>{filterDay}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" />
                    </button>
                    {isDaySortOpen && (
                      <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 custom-scrollbar">
                        {dayOptions.map(d => (
                          <div key={d} onClick={() => { setFilterDay(d); setIsDaySortOpen(false); }} className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b last:border-0">
                            {d}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsTypeSortOpen(!isTypeSortOpen); setIsYearSortOpen(false); setIsMonthSortOpen(false); setIsDaySortOpen(false); }} className="flex w-full sm:w-auto items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"><div className="flex items-center"><Filter size={18} className="mr-2 text-gray-500" /><span>{sortType}</span></div><ChevronDown size={16} className="ml-3 text-gray-500" /></button>
                    {isTypeSortOpen && (<div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">{typeOptions.map(o => (<div key={o.label} onClick={() => { setSortType(o.label); setIsTypeSortOpen(false); }} className="px-4 py-3 text-sm font-bold hover:bg-blue-50 cursor-pointer flex items-center text-gray-700 border-b last:border-0"><span className={`w-2.5 h-2.5 rounded-full ${o.color} mr-3`} />{o.label}</div>))}</div>)}
                  </div>
                  <div className="relative w-full sm:w-72">
  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
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
                          <BlacklistedButton actionType="restore" onClick={() => handleRestore(row)}>{t('restore')}</BlacklistedButton>
                          <BlacklistedButton actionType="view" onClick={() => handleViewDetails(row)}>{t('view')}</BlacklistedButton>
                          {/* 🔥 NEW ARCHIVE BUTTON REPLACES DELETE 🔥 */}
                          <button 
                            onClick={() => handleArchive(row)}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all shadow-sm border border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100 uppercase tracking-wide"
                          >
                            {t('archive') || 'Archive'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                      <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold">{t('no_blacklisted_found') || 'No blacklisted records found.'}</td></tr>
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