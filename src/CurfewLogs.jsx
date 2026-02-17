import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// --- DATA MATCHING CASE LOGS ---
const initialCurfewRows = [
  { id: '01', resident: 'Reyes, Timothy', address: '166, Caybiga', age: '17', status: 'Unsettled', date: '2025-10-20', time: '10:30 PM' },
  { id: '02', resident: 'Dela Cruz, Juan', address: '166, Caybiga', age: '16', status: 'Unsettled', date: '2025-10-21', time: '11:00 PM' },
];

const MOCK_FOLDERS = [
  { id: '1', name: 'Violation Report 1' },
  { id: '2', name: 'Parent Conference' },
];

export default function CurfewLogs() {
  const [view, setView] = useState('LIST'); 
  const [rows, setRows] = useState(initialCurfewRows);
  const [selectedResident, setSelectedResident] = useState(null);
  const [folders, setFolders] = useState(MOCK_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  const [showAddCurfewModal, setShowAddCurfewModal] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(null);

  // Forms
  const [curfewForm, setCurfewForm] = useState({ resident: '', address: '', age: '' });
  const [notesForm, setNotesForm] = useState({ title: '', content: '' });

  // --- REALTIME CLOCK STATE ---
  const [currentDateTime, setCurrentDateTime] = useState({
    time: '',
    date: '',
    rawDate: ''
  });

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateString = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const rawDateString = now.toISOString().split('T')[0];

      setCurrentDateTime({
        time: timeString,
        date: dateString,
        rawDate: rawDateString
      });
    };

    updateTime(); 
    const timer = setInterval(updateTime, 1000); 

    return () => clearInterval(timer); 
  }, []);

  // --- HANDLERS ---
  const handleAddCurfew = (e) => {
    e.preventDefault();
    if (!curfewForm.resident) return;
    
    const newId = String(rows.length + 1).padStart(2, '0');
    
    setRows([...rows, { 
        id: newId, 
        ...curfewForm, 
        time: currentDateTime.time, 
        date: currentDateTime.rawDate,
        status: 'Unsettled' 
    }]);
    
    setShowAddCurfewModal(false);
    Swal.fire('Added!', `Curfew violation recorded for ${curfewForm.resident}`, 'success');
  };

  const handleStatusChange = (id, newStatus) => {
    setStatusMenuOpen(null);
    if (newStatus === 'Settled') {
        Swal.fire({
            title: 'Settle & Archive?',
            text: "Marking this as Settled will move the file to Archives.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Yes, Settle it'
        }).then((result) => {
            if (result.isConfirmed) {
                setRows(rows.filter(r => r.id !== id));
                Swal.fire('Archived!', 'The curfew violation has been settled and moved to Archives.', 'success');
            }
        });
    } else {
        setRows(rows.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const handleAddNotes = () => {
      setFolders([...folders, { id: Date.now(), name: notesForm.title || 'New Note' }]);
      setShowAddNotesModal(false);
      Swal.fire('Saved!', 'Note added to folder.', 'success');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-8 relative">
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        
        {/* --- VIEW: LIST --- */}
        {view === 'LIST' && (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 border border-gray-200">
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-br from-blue-800 to-blue-600 px-6 py-6 text-white shadow-md shrink-0">
              <h1 className="text-xl font-bold uppercase tracking-wide">Curfew Violations</h1>
              <button onClick={() => setShowAddCurfewModal(true)} className="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-bold shadow hover:bg-white/30 transition-all">
                + Add Violation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold uppercase text-gray-500 text-xs">NO.</th>
                    <th className="px-6 py-4 text-left font-bold uppercase text-gray-500 text-xs">Resident Name</th>
                    <th className="px-6 py-4 text-left font-bold uppercase text-gray-500 text-xs">Address</th>
                    <th className="px-6 py-4 text-center font-bold uppercase text-gray-500 text-xs">Age</th>
                    <th className="px-6 py-4 text-center font-bold uppercase text-gray-500 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id} onClick={() => { setSelectedResident(row); setView('FOLDERS'); }} className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-5 text-center text-sm font-bold text-blue-600">{row.id}</td>
                      <td className="px-6 py-5 font-bold text-gray-700">{row.resident}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">{row.address}</td>
                      <td className="px-6 py-5 text-center font-bold text-gray-700">{row.age}</td>
                      <td className="relative px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => setStatusMenuOpen(statusMenuOpen === row.id ? null : row.id)}
                            className={`rounded-full px-4 py-1 text-xs font-bold text-white shadow-sm ${row.status === 'Settled' ? 'bg-emerald-500' : 'bg-red-500'}`}
                        >
                            {row.status.toUpperCase()}
                        </button>
                        {statusMenuOpen === row.id && (
                            <div className="absolute right-10 top-10 z-20 flex flex-col gap-1 rounded-xl border bg-white p-2 shadow-xl">
                                <button onClick={() => handleStatusChange(row.id, 'Settled')} className="px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg">Mark Settled</button>
                                <button onClick={() => handleStatusChange(row.id, 'Unsettled')} className="px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg">Mark Unsettled</button>
                            </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* --- VIEW: FOLDERS & OVERVIEW (Omitted for brevity, logic remains same) --- */}
        {view === 'FOLDERS' && selectedResident && (
             <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">{selectedResident.resident} Records</h2>
                    <button onClick={() => setView('LIST')} className="text-sm font-bold text-blue-600 hover:underline">Back</button>
                </div>
                <div className="p-8"><p>Folder view content...</p></div>
             </section>
        )}

        {/* --- CUSTOM MODAL: NEW CURFEW VIOLATION --- */}
        {showAddCurfewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                    
                    {/* Header - NOW WITH GRADIENT */}
                    <div className="bg-gradient-to-r from-[#0044CC] to-[#0066FF] px-6 py-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-wide">NEW CURFEW</h2>
                        <button onClick={() => setShowAddCurfewModal(false)} className="ml-auto text-white/70 hover:text-white">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleAddCurfew} className="p-8 space-y-6">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8">
                                <label className="mb-2 block text-sm font-bold text-gray-700">Date</label>
                                <div className="relative">
                                    <input type="text" value={currentDateTime.date} readOnly className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 font-bold focus:outline-none cursor-not-allowed" />
                                    <span className="absolute right-4 top-3 text-gray-400">📅</span>
                                </div>
                            </div>
                            <div className="col-span-4">
                                <label className="mb-2 block text-sm font-bold text-gray-700">Time</label>
                                <div className="relative">
                                    <input type="text" value={currentDateTime.time} readOnly className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 font-bold focus:outline-none cursor-not-allowed text-center" />
                                    <span className="absolute right-4 top-3 text-gray-400">🕒</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8">
                                <label className="mb-2 block text-sm font-bold text-gray-700">Resident Name</label>
                                <input type="text" placeholder="Full name" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" onChange={e => setCurfewForm({...curfewForm, resident: e.target.value})} />
                            </div>
                            <div className="col-span-4">
                                <label className="mb-2 block text-sm font-bold text-gray-700">Age</label>
                                <input type="text" placeholder="Input Age" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" onChange={e => setCurfewForm({...curfewForm, age: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">Address</label>
                            <input type="text" placeholder="Input full address" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" onChange={e => setCurfewForm({...curfewForm, address: e.target.value})} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowAddCurfewModal(false)} className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0044CC] to-[#0066FF] px-8 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-900/20">Create</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}