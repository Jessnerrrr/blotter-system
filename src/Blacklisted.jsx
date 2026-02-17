import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ModalCard from './components/ModalCard';

// Helper to determine badge color based on report type (matches Case Logs)
const REPORT_TYPE_STYLES = {
  LUPON: 'bg-blue-700 text-white',
  VAWC: 'bg-red-700 text-white',
  BLOTTER: 'bg-yellow-600 text-white',
  COMPLAIN: 'bg-green-700 text-white',
};

// Mock Timeline Events matching design pattern
const TIMELINE_EVENTS = [
  { date: 'Jan. 12, 2026', label: 'Initial Incident Recorded' },
  { date: 'Jan. 20, 2026', label: 'First Summon Ignored' },
  { date: 'Feb. 03, 2026', label: 'Second Summon - No Show' },
  { date: 'Feb. 18, 2026', label: 'Blacklist Status Approved' },
];

export default function Blacklisted() {
  const [view, setView] = useState('TABLE'); 
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({ resident: '', contact: '', caseNo: '', reason: '' });

  useEffect(() => {
    const syncData = () => {
      const storedCases = JSON.parse(localStorage.getItem('cases') || '[]');
      const blacklistedOnes = storedCases.filter(c => c.status === 'BLACKLISTED');
      setRows(blacklistedOnes);
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

  const updateGlobalStorage = (allCases) => {
    localStorage.setItem('cases', JSON.stringify(allCases));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.resident || !form.caseNo) return;

    const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
    const newEntry = { 
        id: Date.now(), 
        caseNo: form.caseNo, 
        resident: form.resident, 
        contact: form.contact || 'N/A', 
        type: 'COMPLAIN', 
        status: 'BLACKLISTED',
        reason: form.reason || 'Manual Entry',
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    };

    allCases.unshift(newEntry);
    updateGlobalStorage(allCases);
    setForm({ resident: '', contact: '', caseNo: '', reason: '' });
    setShowAddModal(false);
    Swal.fire({ icon: 'success', title: 'Resident Blacklisted', text: `${newEntry.resident} added.`, confirmButtonColor: '#2563eb' });
  };

  const handleRemove = (row) => {
    Swal.fire({
        title: 'Lift Blacklist Restriction?',
        text: `Move ${row.resident} to Archives (Settled)?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Lift & Archive'
    }).then((result) => {
        if (result.isConfirmed) {
            const allCases = JSON.parse(localStorage.getItem('cases') || '[]');
            const updatedCases = allCases.map(c => c.id === row.id || c.caseNo === row.caseNo ? { ...c, status: 'SETTLED' } : c);
            updateGlobalStorage(updatedCases);
            if(view === 'DETAILS') setView('TABLE');
            Swal.fire('Restriction Lifted', 'Record moved to Archives.', 'success');
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
        
        {/* VIEW: DETAILS (Matches image_f6b5a3.png Design) */}
        {view === 'DETAILS' && selected ? (
          <div className="flex-1 flex flex-col w-full rounded-2xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            {/* Header: Blue Gradient */}
            <div className="rounded-t-2xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-5 text-center shadow-md shrink-0">
              <h1 className="text-xl font-bold text-white md:text-2xl uppercase tracking-wide">
                Blacklisted Resident Details
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gray-50/50">
              
              {/* Resident Summary Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-l-4 border-blue-700 pl-3 text-base font-bold text-gray-800">Resident Summary</h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`rounded px-3 py-1 text-[10px] font-bold shadow-sm ${REPORT_TYPE_STYLES[selected.type] || 'bg-blue-600 text-white'}`}>
                    {selected.type}
                  </span>
                  <span className="rounded bg-gray-800 px-3 py-1 text-[10px] font-bold text-white shadow-sm uppercase">BLACKLISTED</span>
                </div>
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Case Number</p><p className="text-sm font-bold text-gray-800">{selected.caseNo}</p></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Date of Entry</p><p className="text-sm font-bold text-gray-800">{selected.date}</p></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Resident Name</p><p className="text-sm font-bold text-gray-800">{selected.resident}</p></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Moderator</p><p className="text-sm font-bold text-gray-800">Lupon Tagapamayapa</p></div>
                </div>
              </div>

              {/* Record Information Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-l-4 border-blue-700 pl-3 text-base font-bold text-gray-800">Violation Details</h3>
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div><p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Contact info</p><p className="text-sm font-bold text-gray-800">{selected.contact || 'N/A'}</p></div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Detailed Reason</p>
                    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm font-medium text-slate-700 leading-relaxed italic">
                      "{selected.reason || 'Persistent non-compliance and violation of community mediation agreements.'}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-l-4 border-blue-700 pl-3 text-base font-bold text-gray-800">Case Timeline</h3>
                <div className="relative flex flex-col gap-4 pl-6 border-l-2 border-blue-100 ml-2 py-2">
                  {TIMELINE_EVENTS.map((event, i) => (
                    <div key={i} className="relative flex items-center gap-3">
                      <span className="absolute -left-[31px] h-3 w-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-50" />
                      <p className="text-sm font-bold text-gray-800">
                        <span className="text-blue-600 mr-2">{event.date}</span> — {event.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-8 flex justify-end gap-3 pb-4">
                <button onClick={() => handleRemove(selected)} className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-md transition-all active:scale-95">Lift Restriction</button>
                <button onClick={handleBackToTable} className="rounded-xl border-2 border-gray-300 text-gray-600 px-6 py-3 text-sm font-bold hover:bg-gray-200 transition-all">Back to List</button>
              </div>
            </div>
          </div>
        ) : (
          
        /* VIEW: MAIN TABLE */
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="rounded-t-2xl bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-8 shadow-md md:px-8 shrink-0">
              <h1 className="text-3xl font-bold uppercase tracking-wide text-white">BLACKLISTED RECORDS</h1>
              <p className="mt-2 text-sm font-medium text-white/80">Residents restricted due to repeated violations and unresolved cases.</p>
            </div>

            <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8 shrink-0">
              <div className="relative flex-1 sm:max-w-xs">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
                <input type="text" placeholder="Search resident or case no..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
              </div>
              <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-800 hover:to-blue-600 transition-all" onClick={() => setShowAddModal(true)}>+ Add Record</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 md:px-8 w-full">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">Case No.</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[25%]">Resident</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[15%]">Status</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">Type</th>
                    <th className="px-4 py-4 text-left font-bold uppercase w-[20%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-5 font-bold text-gray-700">{row.caseNo}</td>
                      <td className="px-4 py-5 font-bold text-gray-900">{row.resident}</td>
                      <td className="px-4 py-5"><span className="inline-block rounded bg-gray-800 px-3 py-1 text-[10px] font-bold text-white shadow-sm uppercase">BLACKLISTED</span></td>
                      <td className="px-4 py-5"><span className={`inline-block rounded px-2 py-0.5 text-[9px] font-black uppercase ${REPORT_TYPE_STYLES[row.type]}`}>{row.type}</span></td>
                      <td className="px-4 py-5"><div className="flex gap-2"><button className="rounded-lg bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-bold hover:bg-blue-200 transition-colors shadow-sm" onClick={() => handleViewDetails(row)}>View</button><button className="rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-200 transition-colors shadow-sm" onClick={() => handleRemove(row)}>Lift</button></div></td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (<tr><td colSpan={5} className="py-12 text-center text-gray-400 font-bold">No records found.</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ADD MODAL */}
        {showAddModal && (
          <ModalCard title="Blacklist Entry" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 gap-4">
                <label className="flex flex-col gap-1"><span className="text-xs font-bold text-gray-500 uppercase">Resident Name</span><input type="text" className="rounded-lg border bg-gray-50 px-4 py-3 font-bold outline-none focus:border-blue-600" value={form.resident} onChange={(e) => setForm({ ...form, resident: e.target.value })} placeholder="Full Name" /></label>
                <label className="flex flex-col gap-1"><span className="text-xs font-bold text-gray-500 uppercase">Case No.</span><input type="text" className="rounded-lg border bg-gray-50 px-4 py-3 font-bold outline-none focus:border-blue-600" value={form.caseNo} onChange={(e) => setForm({ ...form, caseNo: e.target.value })} placeholder="XX-166-XX-202X" /></label>
                <label className="flex flex-col gap-1"><span className="text-xs font-bold text-gray-500 uppercase">Reason</span><textarea className="rounded-lg border bg-gray-50 px-4 py-3 font-bold outline-none focus:border-blue-600 min-h-[100px]" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Detailed reason..." /></label>
              </div>
              <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button><button type="submit" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700">Add Record</button></div>
            </form>
          </ModalCard>
        )}
      </div>
    </div>
  );
}