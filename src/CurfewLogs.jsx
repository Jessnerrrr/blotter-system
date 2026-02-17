import React, { useState, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import ModalCard from './components/ModalCard';

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
  const [curfewForm, setCurfewForm] = useState({ resident: '', address: '', age: '', date: '', time: '' });
  const [notesForm, setNotesForm] = useState({ title: '', content: '' });

  // --- HANDLERS ---
  const handleAddCurfew = (e) => {
    e.preventDefault();
    if (!curfewForm.resident) return;
    const newId = String(rows.length + 1).padStart(2, '0');
    setRows([...rows, { id: newId, ...curfewForm, status: 'Unsettled' }]);
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
                // In a real app, move to archive DB here
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

        {/* --- VIEW: FOLDERS --- */}
        {view === 'FOLDERS' && selectedResident && (
          <section className="flex-1 flex flex-col w-full overflow-hidden rounded-2xl bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 py-6 px-8 bg-blue-700 text-white shrink-0">
              <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold uppercase">{selectedResident.resident}</h2>
                    <p className="opacity-80 text-sm">Curfew Violation Records</p>
                  </div>
                  <button onClick={() => setView('LIST')} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-all">Back to List</button>
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
                {/* Add Note Button */}
                <div onClick={() => setShowAddNotesModal(true)} className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all min-h-[200px] text-gray-400 hover:text-blue-600">
                    <span className="text-4xl mb-2">+</span>
                    <span className="font-bold">Add New Note</span>
                </div>

                {/* Folders */}
                {folders.map(folder => (
                    <div key={folder.id} onClick={() => { setSelectedFolder(folder); setView('OVERVIEW'); }} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] group">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            📁
                        </div>
                        <h3 className="font-bold text-gray-800 text-center">{folder.name}</h3>
                        <p className="text-xs text-gray-500 mt-2">Click to view details</p>
                    </div>
                ))}
            </div>
          </section>
        )}

        {/* --- VIEW: OVERVIEW --- */}
        {view === 'OVERVIEW' && selectedFolder && (
             <div className="flex-1 flex flex-col w-full rounded-2xl overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-700 px-8 py-6 text-white shrink-0 flex justify-between items-center">
                    <h1 className="text-xl font-bold uppercase">{selectedFolder.name}</h1>
                    <button onClick={() => setView('FOLDERS')} className="bg-white/20 px-4 py-2 rounded-lg text-sm font-bold">Back</button>
                </div>
                <div className="p-8">
                    <div className="prose max-w-none text-gray-600">
                        <p>This contains the details for {selectedFolder.name}. In a real application, this would show the rich text content.</p>
                    </div>
                </div>
             </div>
        )}

        {/* --- MODALS --- */}
        {showAddCurfewModal && (
            <ModalCard title="New Curfew Violation" onClose={() => setShowAddCurfewModal(false)}>
                <form onSubmit={handleAddCurfew} className="space-y-4">
                    <input type="text" placeholder="Resident Name" className="w-full border p-3 rounded-lg" onChange={e => setCurfewForm({...curfewForm, resident: e.target.value})} />
                    <input type="text" placeholder="Address" className="w-full border p-3 rounded-lg" onChange={e => setCurfewForm({...curfewForm, address: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Age" className="w-full border p-3 rounded-lg" onChange={e => setCurfewForm({...curfewForm, age: e.target.value})} />
                        <input type="time" className="w-full border p-3 rounded-lg" />
                    </div>
                    <button className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700">Submit Violation</button>
                </form>
            </ModalCard>
        )}

        {showAddNotesModal && (
            <ModalCard title="Add Case Note" onClose={() => setShowAddNotesModal(false)}>
                <div className="space-y-4">
                    <input type="text" placeholder="Note Title" className="w-full border p-3 rounded-lg" onChange={e => setNotesForm({...notesForm, title: e.target.value})} />
                    <textarea placeholder="Details..." className="w-full border p-3 rounded-lg h-32" onChange={e => setNotesForm({...notesForm, content: e.target.value})}></textarea>
                    <button onClick={handleAddNotes} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700">Save Note</button>
                </div>
            </ModalCard>
        )}

      </div>
    </div>
  );
}