import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

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
      const storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      const archived = storedCases.filter(c => c.status === 'SETTLED');
      setRows(archived);
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

  const updateLocalStorage = (updatedRows, allCases) => {
    setRows(updatedRows);
    localStorage.setItem('cases', JSON.stringify(allCases));
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
        
        {/* --- VIEW: DETAILS (Matches your design) --- */}
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            {/* Header */}
            <div className="bg-[#0044CC] px-8 py-5 text-white shadow-md shrink-0 rounded-t-xl">
              <h1 className="text-xl font-bold">Archived Case Details</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
              
              {/* 1. Case Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">Case Summary</h3>
                </div>
                
                <div className="flex gap-2 mb-6">
                    <span className="bg-[#FCD34D] text-yellow-800 text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                        {selected.type}
                    </span>
                    <span className="bg-gray-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                        ARCHIVED
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Case Number</p>
                        <p className="text-sm font-bold text-gray-800">{selected.caseNo}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Resident Name</p>
                        <p className="text-sm font-bold text-gray-800">{selected.resident}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Date Filed</p>
                        <p className="text-sm font-bold text-gray-800">{selected.date}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Date Closed</p>
                        <p className="text-sm font-bold text-gray-800">February 18, 2026</p> {/* Mock data for now */}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Archived Date</p>
                        <p className="text-sm font-bold text-gray-800">March 01, 2026</p> {/* Mock data for now */}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Moderator</p>
                        <p className="text-sm font-bold text-gray-800">Lupon Tagapamayapa</p>
                    </div>
                </div>
              </div>

              {/* 2. Case Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">Case Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-6 mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Complainant</p>
                        <p className="text-sm font-bold text-gray-800">Reyes, Timothy G.</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Defendants</p>
                        <p className="text-sm font-bold text-gray-800">Juan Dela Cruz</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Incident Date</p>
                        <p className="text-sm font-bold text-gray-800">January 10, 2026</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Location</p>
                        <p className="text-sm font-bold text-gray-800">166, Caloocan City, Metro Manila</p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Detailed Description</p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-gray-700 leading-relaxed font-medium">
                        The complainant reported repeated disturbance and violation of barangay mediation agreement. Multiple summons were issued but respondent failed to comply.
                    </div>
                </div>
              </div>

              {/* 3. Resolution Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">Resolution Summary</h3>
                </div>
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Settlement Status</p>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                        ESCALATED
                    </span>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Detailed Description</p>
                    <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 font-bold">
                        Case escalated to higher authority after unsuccessful mediation process.
                    </div>
                </div>
              </div>

              {/* 4. Attached Documents */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">Attached Documents</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                            <span className="text-xs font-bold text-gray-700">Complainant_Form.pdf</span>
                            <div className="flex gap-2">
                                <button className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors">Download</button>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1 rounded-full transition-colors">View</button>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* 5. Archived Information */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="border-l-4 border-[#0044CC] pl-3 mb-6">
                    <h3 className="text-lg font-bold text-[#0044CC]">Archived Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Archived By</p>
                        <p className="text-xs font-bold text-gray-800">Barangay Administrator</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reason for Archiving</p>
                        <p className="text-xs font-bold text-gray-800">Case completed and inactive for 30 days.</p>
                    </div>
                </div>
              </div>

              {/* Footer Button */}
              <div className="flex justify-end pt-4 pb-8">
                  <button 
                    onClick={handleBackToTable} 
                    className="bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold px-6 py-2 rounded shadow-md transition-colors"
                  >
                    Back to Archived
                  </button>
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