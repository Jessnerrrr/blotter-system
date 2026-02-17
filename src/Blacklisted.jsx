import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ModalCard from './components/ModalCard';

// Helper to determine badge color based on report type
const REPORT_TYPE_STYLES = {
  LUPON: 'bg-blue-700 text-white',
  VAWC: 'bg-red-700 text-white',
  BLOTTER: 'bg-yellow-600 text-white',
  COMPLAIN: 'bg-green-700 text-white',
};

// Mock Timeline Events matching the UI
const TIMELINE_EVENTS = [
  { date: 'Jan. 12, 2026', label: 'Summon Issued' },
  { date: 'Jan. 20, 2026', label: 'Failed to Appear' },
  { date: 'Feb. 03, 2026', label: 'Second Summon' },
  { date: 'Feb. 18, 2026', label: 'Blacklisted Approved' },
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
        contact: form.contact || '0912-345-6789', 
        type: 'LUPON', 
        status: 'BLACKLISTED',
        reason: form.reason || 'Repeated Case Violation', 
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
        
        {/* VIEW: DETAILS (Updated to match Screenshot) */}
        {view === 'DETAILS' && selected ? (
          // Added overflow-y-auto here to make the whole details section scrollable
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                
                {/* 1. Blue Header Bar */}
                <div className="bg-[#0044CC] p-4 rounded-lg shadow-sm">
                    <h1 className="text-xl font-bold text-white">Blacklisted Resident - Case Details</h1>
                </div>

                {/* 2. Profile Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 shrink-0"></div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#0044CC]">{selected.resident}</h2>
                        <p className="text-sm text-gray-600 font-medium mt-1">Resident ID: 01-166-2026</p>
                        <div className="mt-3">
                            <span className="bg-black text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                                BLACKLISTED
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Resident Information Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-[#0044CC]"></div>
                        <h3 className="text-xl font-bold text-[#0044CC]">Resident Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-8">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Household no.</p>
                            <p className="text-sm font-bold text-gray-900">HN4820450670</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Contact number</p>
                            <p className="text-sm font-bold text-gray-900">{selected.contact || '0914-430-1203'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Address</p>
                            <p className="text-sm font-bold text-gray-900">Blk.1 Lot 2, Caloocan City, Metro Manila</p>
                        </div>
                    </div>
                </div>

                {/* 4. Blacklist Information Card (Blue Border) */}
                <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-[#2b85ff] relative">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-[#0044CC]"></div>
                        <h3 className="text-xl font-bold text-[#0044CC]">Blacklist Information</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-8 mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Case Number</p>
                            <p className="text-sm font-bold text-gray-900">{selected.caseNo}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Case Type</p>
                            <p className="text-sm font-bold text-gray-900 font-sans capitalize">Lupon</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Date Blacklisted</p>
                            <p className="text-sm font-bold text-gray-900">{selected.date}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Moderator</p>
                            <p className="text-sm font-bold text-gray-900">Lupon Tagapamayapa</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Reason</p>
                        <p className="text-xs font-bold text-gray-900 leading-relaxed">
                            {selected.reason || 'Resident repeatedly failed to attend summons hearings and violated settlement agreement multiple times.'}
                        </p>
                    </div>
                </div>

                {/* 5. Case Timeline Card */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-[#0044CC]"></div>
                        <h3 className="text-xl font-bold text-[#0044CC]">Case Timeline</h3>
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
                                        {event.date} - {event.label}
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
                        Back to Blacklist Records
                    </button>
                </div>
            </div>
          </div>
        ) : (
          
        /* VIEW: MAIN TABLE */
          <div className="flex-1 flex flex-col w-full h-full">
            {/* Header Banner */}
            <div className="bg-[#0044CC] px-8 py-8 rounded-t-2xl shadow-sm">
                <h1 className="text-3xl font-black text-white tracking-wide uppercase">BLACKLISTED CASE RECORDS</h1>
                <p className="text-blue-100 text-sm mt-1 font-medium">Residents restricted due to repeated violations and escalated cases.</p>
            </div>

            {/* White Content Area */}
            <div className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                        <input 
                            type="text" 
                            placeholder="Search resident....." 
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
                        <span className="text-lg leading-none">+</span> Add Blacklisted
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-900 text-xs font-bold uppercase border-b border-gray-100">
                                <th className="py-4 px-2 w-16">No.</th>
                                <th className="py-4 px-2 w-[25%]">Resident</th>
                                <th className="py-4 px-2 w-[20%]">Household no.</th>
                                <th className="py-4 px-2 w-[15%]">Status</th>
                                <th className="py-4 px-2 w-[25%]">Reason</th>
                                <th className="py-4 px-2 text-right">Action</th>
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
                                    <td className="py-4 px-2"><span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">BLACKLISTED</span></td>
                                    <td className="py-4 px-2 text-gray-600 font-medium">{row.reason || 'Repeated Case Violation'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleViewDetails(row)} className="bg-[#4A72B2] hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded shadow-sm transition-colors">View</button>
                                            <button onClick={() => handleRemove(row)} className="bg-[#EF4444] hover:bg-red-600 text-white text-[10px] font-bold px-4 py-1.5 rounded shadow-sm transition-colors">Remove</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRows.length === 0 && (<tr><td colSpan={6} className="py-12 text-center text-gray-400 font-medium">No blacklisted records found.</td></tr>)}
                        </tbody>
                    </table>
                    {filteredRows.length > 0 && (<div className="flex items-center justify-center mt-8 opacity-50"><div className="h-px bg-gray-300 w-24"></div><span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Nothing Follows</span><div className="h-px bg-gray-300 w-24"></div></div>)}
                </div>
            </div>
          </div>
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