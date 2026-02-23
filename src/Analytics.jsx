import React, { useState } from 'react';
import { FileText, UserX, Download, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext'; // TRANSLATION HOOK

// --- MOCK DATA ---
const REPORT_DATA = [
  { caseNo: '01-166-01-2026', title: 'Reyes, Timothy O. VS Maria Santos V.' },
  { caseNo: '01-166-02-2026', title: 'Reyes, Timothy O. VS Maria Santos V.' },
  { caseNo: '01-166-03-2026', title: 'Reyes, Timothy O. VS Maria Santos V.' },
  { caseNo: '01-166-04-2026', title: 'Reyes, Timothy O. VS Maria Santos V.' },
];

export default function Analytics() {
  const { t } = useLanguage(); // INIT TRANSLATOR
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // --- REAL-TIME CALENDAR LOGIC ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthYearString = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const calendarGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarGrid.push(i);
  }
  const remainingCells = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    calendarGrid.push(null);
  }

  const handleOpenPrint = () => setIsPrintModalOpen(true);
  
  // --- CANCEL CONFIRMATION ---
  const handleCancelPrint = () => {
    Swal.fire({
      title: t('discard_changes') || 'Discard Changes?',
      text: t('unsaved_lost') || 'Any unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('yes_discard') || 'Yes, discard',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsPrintModalOpen(false);
      }
    });
  };

  // --- PRINT CONFIRMATION ---
  const handlePrintSubmit = () => {
    Swal.fire({
      title: t('confirm_print_title') || 'Print Case Details?',
      text: t('confirm_print_text') || 'Are you sure you want to print this document?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0066FF',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes_print') || 'Yes, print it',
      cancelButtonText: t('cancel') || 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setTimeout(() => {
            window.print();
        }, 300);
      }
    });
  };

  // --- RENDER PRINT MODAL ---
  const renderPrintModal = () => {
    if (!isPrintModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex justify-center overflow-y-auto font-sans py-10 print:p-0 print:overflow-visible print:block">
        <div 
            id="printable-content"
            className="bg-white shadow-2xl relative flex flex-col justify-between text-black font-sans shrink-0 border-[3px] border-blue-500 print:border-none print:shadow-none print:w-full print:h-full print:m-0"
            style={{ width: '210mm', height: '297mm', padding: '15mm 20mm' }} 
        >
            <div>
                <div className="flex flex-col items-center text-center mb-8 w-full">
                    <div className="h-24 w-24 mb-2 flex items-center justify-center">
                        <img src="/icon-analytics/analyticsprint logo.png" alt="Republic Logo" className="h-full w-full object-contain" />
                    </div>
                    <p className="text-sm font-normal text-gray-900">Republic of the Philippines</p>
                    <h1 className="text-2xl font-black text-blue-700 uppercase tracking-wide mt-1 print:text-blue-700">
                        BARANGAY 166, CAYBIGA
                    </h1>
                    <p className="text-xs font-bold text-gray-600 uppercase">ZONE 15 DISTRICT I, CALOOCAN CITY</p>
                    <p className="text-xs font-bold text-gray-600 uppercase">#1 GEN LUIS. ST, CAYBIGA CALOOCAN CITY</p>
                </div>

                <div className="text-center mb-10 w-full">
                    <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">
                        TANGGAPAN NG LUPON TAGAMAPAYAMAPA
                    </h2>
                    <div className="w-full flex justify-end mt-6">
                        <p className="text-xs font-bold text-gray-800 uppercase">{monthYearString}</p>
                    </div>
                </div>

                <div className="text-center mb-8 w-full">
                    <h3 className="text-xl font-black text-gray-900 uppercase">
                        MONTHLY TRANSMITTAL OF FINAL REPORTS
                    </h3>
                </div>

                <div className="mb-6 text-sm text-gray-900 w-full">
                    <div className="flex gap-4 mb-6 pl-4">
                        <span className="font-bold w-8">TO:</span>
                        <div className="flex flex-col">
                            <p className="font-bold">City / Municipal Judge</p>
                            <p className="font-normal">Caloocan City</p>
                        </div>
                    </div>
                    <p className="text-justify leading-relaxed indent-12">
                        Enclosed herewith are the final reports of settlement of disputes and arbitration awards made by the Barangay Captain / Pangkat Tagapagkasundo in the following case:
                    </p>
                </div>

                <div className="mb-12 w-full font-sans">
                    <table className="w-full border-collapse border border-black">
                        <thead>
                            <tr className="bg-gray-300 print:bg-gray-300">
                                <th className="border border-black py-2 px-4 text-center font-bold text-sm w-1/3 align-middle text-black print:text-black">
                                    Barangay Case No.
                                </th>
                                <th className="border border-black py-2 px-4 text-center font-bold text-sm align-middle text-black print:text-black">
                                    Official Case Record
                                    <span className="block text-[10px] font-normal italic">(Complainant vs Respondent)</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {REPORT_DATA.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-black py-3 px-4 text-center text-sm font-bold align-middle">{item.caseNo}</td>
                                    <td className="border border-black py-3 px-4 text-center text-sm font-medium align-middle">{item.title}</td>
                                </tr>
                            ))}
                            <tr>
                                <td className="border border-black py-3 px-4">&nbsp;</td>
                                <td className="border border-black py-3 px-4">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div className="w-full flex justify-end mb-8">
                    <div className="text-center w-64">
                        <div className="border-b border-black mb-2"></div>
                        <p className="font-bold text-sm">Clerk of Court</p>
                    </div>
                </div>

                <div className="w-full relative">
                    <div className="text-[10px] text-gray-700 w-full mb-4">
                        <p className="font-bold">IMPORTANT: <span className="font-normal">The Lupon / Pangkat Secretary shall transmit, not later than the first day for preceding month.</span></p>
                    </div>

                    <div className="flex items-end justify-center relative h-24 w-full">
                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 z-10">
                            <img src="/icon-analytics/analytics footerprint.png" alt="Bagong Pilipinas" className="h-16 object-contain" />
                        </div>

                        <div className="absolute right-0 bottom-4 flex gap-2 print:hidden z-20">
                            <button onClick={handleCancelPrint} className="px-6 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded shadow-sm hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                            <button onClick={handlePrintSubmit} className="px-8 py-1.5 bg-[#007bff] text-white text-xs font-bold rounded shadow-sm hover:bg-blue-600 transition-colors uppercase tracking-wide">PRINT</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 font-sans">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-content, #printable-content * { visibility: visible; }
          #printable-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            z-index: 9999;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {renderPrintModal()}

      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex justify-between items-center h-40 border border-blue-800">
            <div className="z-10">
              <h3 className="text-5xl font-bold tracking-tight">10,000</h3>
              <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mt-2">{t('total_cases')}</p>
            </div>
            <div className="p-4">
              <FileText size={40} className="text-blue-100" />
            </div>
          </div>

          <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex justify-between items-center h-40 border border-emerald-600">
            <div className="z-10">
              <h3 className="text-5xl font-bold tracking-tight">200</h3>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider mt-2">{t('total_blacklisted')}</p>
            </div>
            <div className="p-4">
              <UserX size={40} className="text-emerald-100" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-900">{t('total_cases_trend')}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">{t('cases_reported_per_month')}</p>
            </div>
            <button 
                onClick={handleOpenPrint}
                className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors border border-blue-950"
            >
              <Download size={16} />
              <span>{t('export_pdf')}</span>
            </button>
          </div>
          
          <div className="relative h-80 w-full pl-12 pb-8">
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs font-bold text-gray-400">
              <span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
            </div>
            <div className="absolute left-10 right-0 top-0 bottom-8 flex flex-col justify-between z-0">
              {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-200 w-full h-0"></div>)}
            </div>
            <div className="absolute inset-0 left-10 bottom-8 flex items-end justify-between px-4 z-10">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'].map((month) => (
                <div key={month} className="flex flex-col items-center flex-1 h-full justify-end group space-y-2">
                  <div className="flex space-x-1.5 items-end h-full w-full justify-center">
                    <div className="w-2.5 bg-blue-600 rounded-t-sm" style={{ height: `${Math.floor(Math.random() * 60 + 20)}%` }}></div>
                    <div className="w-2.5 bg-emerald-500 rounded-t-sm" style={{ height: `${Math.floor(Math.random() * 50 + 10)}%` }}></div>
                    <div className="w-2.5 bg-red-500 rounded-t-sm" style={{ height: `${Math.floor(Math.random() * 40 + 10)}%` }}></div>
                    <div className="w-2.5 bg-yellow-400 rounded-t-sm" style={{ height: `${Math.floor(Math.random() * 40 + 10)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute left-10 right-0 bottom-0 flex justify-between px-4">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'].map((month) => (
                <div key={month} className="flex-1 text-center text-xs font-bold text-gray-500 pt-2">{month}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
               <h3 className="text-xl font-bold text-blue-900 mb-8">{t('case_analytics_category')}</h3>
               <div className="flex items-center justify-center space-x-16">
                 <div 
                    className="relative w-56 h-56 rounded-full shadow-md border border-gray-200 shrink-0 flex items-center justify-center" 
                    style={{ background: 'conic-gradient(#1e40af 0% 35%, #ef4444 35% 55%, #eab308 55% 80%, #22c55e 80% 100%)' }}
                 >
                     {/* Inner white circle to create Donut chart effect */}
                     <div className="w-36 h-36 bg-white rounded-full"></div>
                 </div>
                 <div className="space-y-4 w-full max-w-[150px]">
                    <div className="flex items-center justify-between text-sm font-bold text-gray-600">
                        <div className="flex items-center"><span className="w-4 h-4 bg-blue-800 mr-3 rounded-md"></span> LUPON</div>
                        <span>35%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-gray-600">
                        <div className="flex items-center"><span className="w-4 h-4 bg-red-500 mr-3 rounded-md"></span> VAWC</div>
                        <span>20%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-gray-600">
                        <div className="flex items-center"><span className="w-4 h-4 bg-yellow-400 mr-3 rounded-md"></span> BLOTTER</div>
                        <span>25%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-gray-600">
                        <div className="flex items-center"><span className="w-4 h-4 bg-green-500 mr-3 rounded-md"></span> COMPLAIN</div>
                        <span>20%</span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-blue-900">{t('daily_cases_overview')}</h3>
                 <span className="text-xl font-bold text-blue-900 uppercase tracking-wide">{monthYearString}</span>
               </div>
               <div className="border-t border-l border-slate-300">
                 <div className="grid grid-cols-7 text-center bg-blue-700 text-white">
                   {[t('sun'),t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat')].map(d => <div key={d} className="py-3 text-xs font-bold border-r border-b border-slate-300">{d}</div>)}
                 </div>
                 <div className="grid grid-cols-7">
                   {calendarGrid.map((day, i) => (
                     <div key={i} className="h-24 border-r border-b border-slate-300 bg-white relative p-2">
                       {day !== null && (
                         <span className={`text-sm font-bold ${day === currentDate.getDate() ? 'text-blue-600' : 'text-gray-700'}`}>
                            {day}
                         </span>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-blue-900 mb-8">{t('case_resolution_overview')}</h3>
               <div className="space-y-8">
                 {[{l:t('settled'),v:'80%',c:'bg-green-600'},{l:t('escalated'),v:'50%',c:'bg-red-600'},{l:t('blacklisted'),v:'40%',c:'bg-gray-900'}].map(x => (
                   <div key={x.l}>
                     <div className="flex justify-between text-sm font-bold text-gray-700 mb-2"><span>{x.l}</span><span>{x.v}</span></div>
                     <div className="w-full bg-gray-100 rounded-full h-3"><div className={`${x.c} h-3 rounded-full`} style={{width:x.v}}></div></div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-blue-900">{t('recent_activities')}</h3>
                 <User size={20} className="text-gray-400"/>
               </div>
               <div className="space-y-4">
                 {[...Array(6)].map((_, i) => (
                   <div key={i} className="bg-blue-700 text-white p-4 rounded-xl shadow-md">
                     <p className="text-xs font-black">166-09-2026 - CASE HEARING</p>
                     <p className="text-[10px] opacity-90 mt-1">Edited by: Jhon Timones</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}