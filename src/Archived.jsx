import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ModalCard from './components/ModalCard';

// --- STYLES ---
const REPORT_TYPE_STYLES = {
  LUPON: 'bg-blue-700 text-white',
  VAWC: 'bg-red-700 text-white',
  BLOTTER: 'bg-yellow-600 text-white',
  COMPLAIN: 'bg-green-700 text-white',
};

export default function Archived() {
  const [view, setView] = useState('TABLE');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null); 
  const [search, setSearch] = useState('');

  // --- LOAD REAL DATA ---
  useEffect(() => {
    const loadData = () => {
      // Pull shared data from Case Logs
      const storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      // Filter ONLY Settled cases
      const archived = storedCases.filter(c => c.status === 'SETTLED');
      setRows(archived);
    };

    loadData();
    // Listen for storage changes in case other tabs update
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

  const updateLocalStorage = (updatedRows, allCases) => {
    setRows(updatedRows);
    localStorage.setItem('cases', JSON.stringify(allCases));
    // Trigger event for other components to update
    window.dispatchEvent(new Event('storage'));
  };

  const handleRestore = (row) => {
    Swal.fire({
      title: 'Restore Case?',
      text: `Case ${row.caseNo} will be moved back to Active Logs (Pending).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Restore it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
        // Update status back to PENDING
        const updatedAll = allCases.map(c => c.id === row.id ? { ...c, status: 'PENDING' } : c);
        
        updateLocalStorage(updatedAll.filter(c => c.status === 'SETTLED'), updatedAll);
        
        if(view === 'DETAILS') setView('TABLE');
        Swal.fire('Restored!', 'The case has been moved to Active Logs.', 'success');
      }
    });
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete Permanently?',
      text: "This record will be gone forever.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
        // Remove completely
        const updatedAll = allCases.filter(c => c.id !== row.id);
        
        updateLocalStorage(updatedAll.filter(c => c.status === 'SETTLED'), updatedAll);

        if(view === 'DETAILS') setView('TABLE');
        Swal.fire('Deleted!', 'The record has been permanently removed.', 'success');
      }
    });
  };

  const filteredRows = rows.filter((row) => 
    (row.caseNo && row.caseNo.toLowerCase().includes(search.toLowerCase())) ||
    (row.resident && row.resident.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative">
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        
        {/* --- VIEW: DETAILS --- */}
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-2xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="rounded-t-2xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-5 text-center shadow-md shrink-0">
              <h1 className="text-xl font-bold text-white md:text-2xl">Archived Case Details</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-l-4 border-blue-700 pl-3 text-base font-bold text-gray-800">Case Summary</h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`rounded px-3 py-1 text-xs font-bold shadow-sm ${REPORT_TYPE_STYLES[selected.type] || 'bg-gray-500 text-white'}`}>
                    {selected.type}
                  </span>
                  <span className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white shadow-sm">SETTLED</span>
                </div>
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div><p className="text-xs font-bold text-gray-500 uppercase">Case Number</p><p className="text-sm font-bold text-gray-800">{selected.caseNo}</p></div>
                  <div><p className="text-xs font-bold text-gray-500 uppercase">Date Filed</p><p className="text-sm font-bold text-gray-800">{selected.date}</p></div>
                  <div><p className="text-xs font-bold text-gray-500 uppercase">Resident Name</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                  <div><p className="text-xs font-bold text-gray-500 uppercase">Contact</p><p className="text-sm font-bold text-gray-800">{selected.contact}</p></div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pb-4">
                 <button onClick={() => handleRestore(selected)} className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 transition-all shadow-md">Restore Case</button>
                 <button onClick={handleBackToTable} className="rounded-xl border-2 border-gray-200 text-gray-600 px-6 py-3 text-sm font-bold hover:bg-gray-50 transition-all">Back to List</button>
              </div>
            </div>
          </div>
        ) : (
          
        /* --- VIEW: TABLE --- */
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="rounded-t-2xl bg-gradient-to-br from-blue-800 to-blue-500 px-6 py-8 shadow-md shrink-0">
              <h1 className="text-3xl font-bold uppercase tracking-wide text-white">Archived Cases</h1>
              <p className="mt-2 text-sm font-medium text-white/80">Manage settled cases. Restore or permanently delete records.</p>
            </div>

            <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 shrink-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-gray-700">Total Settled: {rows.length}</p>
                <div className="relative w-full sm:max-w-xs">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6 md:px-8 w-full">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b-2 border-blue-100 text-blue-900">
                    <th className="px-4 py-4 text-left font-bold uppercase w-[15%]">Report Type</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">Case Number</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[35%]">Resident Name</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[30%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
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
                            Restore
                          </button>
                          <button 
                            className="rounded-lg bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-bold hover:bg-blue-200 transition-colors" 
                            onClick={() => handleViewDetails(row)}
                          >
                            View
                          </button>
                          <button 
                            className="rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-200 transition-colors" 
                            onClick={() => handleDelete(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                     <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold">No settled cases found.</td></tr>
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