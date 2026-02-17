import React, { useState } from 'react';
import { FileText, UserX, Users, Download, User, ChevronDown, ChevronRight, X } from 'lucide-react';
import Swal from 'sweetalert2';

// Reusable Styles
const cardClass = "bg-white p-6 rounded-2xl shadow-sm border border-gray-100";

export default function Analytics() {
  // --- STATE ---
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    destination: 'HP LaserJet Pro M402dn',
    pages: 'All',
    copies: 1,
    layout: 'Portrait',
    color: 'Black and white',
    paperSize: 'Letter'
  });

  // --- MOCK CONTENT BLOCKS FOR PDF PREVIEW ---
  const contentBlocks = [
    { id: 'cards', height: 100 },      
    { id: 'barchart', height: 220 },   
    { id: 'donut', height: 180 },      
    { id: 'calendar', height: 200 },   
    { id: 'resolution', height: 160 }, 
    { id: 'activities', height: 250 }  
  ];

  // --- HANDLERS ---
  const handleOpenPrint = () => setIsPrintModalOpen(true);
  
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setPrintConfig(prev => ({ ...prev, [name]: value }));
  };

  const handlePrintSubmit = () => {
    let timerInterval;
    Swal.fire({
      title: 'Printing...',
      html: `Sending to <b>${printConfig.destination}</b>`,
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => { Swal.showLoading(); },
      willClose: () => { clearInterval(timerInterval); }
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.timer) {
        setIsPrintModalOpen(false);
        Swal.fire({
          title: 'Sent to Printer',
          text: 'Document is in the print queue.',
          icon: 'success',
          confirmButtonColor: '#1a73e8'
        });
      }
    });
  };

  // --- RENDER CONTENT BLOCKS (Visuals for Preview) ---
  const renderBlockContent = (id) => {
    switch (id) {
      case 'cards':
        return (
          <div className="flex space-x-4 mb-4 h-full">
            <div className="bg-blue-700 flex-1 rounded-lg p-3 text-white relative overflow-hidden flex items-center justify-between">
               <div><h3 className="text-xl font-bold">10,000</h3><p className="text-[9px] uppercase opacity-90">Total Cases</p></div>
               <FileText size={20} className="text-white/40" />
            </div>
            <div className="bg-emerald-500 flex-1 rounded-lg p-3 text-white relative overflow-hidden flex items-center justify-between">
               <div><h3 className="text-xl font-bold">200</h3><p className="text-[9px] uppercase opacity-90">Blacklisted</p></div>
               <UserX size={20} className="text-white/40" />
            </div>
          </div>
        );
      case 'barchart':
        return (
          <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4 h-full flex flex-col justify-between">
            <div className="flex justify-between mb-2">
                <h4 className="text-[10px] font-bold text-gray-700">Total Cases Trend</h4>
                <div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div></div>
            </div>
            {/* FIXED: Added explicit height (h-32) to ensure bars render */}
            <div className="h-32 flex items-end justify-between space-x-1 px-1">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-[1px] w-full items-center h-full justify-end">
                        <div className="w-1.5 bg-blue-600 rounded-t-[1px]" style={{height: `${Math.floor(Math.random() * 40 + 20)}%`}}></div>
                        <div className="w-1.5 bg-emerald-500 rounded-t-[1px]" style={{height: `${Math.floor(Math.random() * 30 + 10)}%`}}></div>
                        <div className="w-1.5 bg-red-500 rounded-t-[1px]" style={{height: `${Math.floor(Math.random() * 20 + 5)}%`}}></div>
                    </div>
                ))}
            </div>
          </div>
        );
      case 'donut':
        return (
          <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4 h-full flex items-center">
             <div className="flex-1">
                <h4 className="text-[10px] font-bold text-gray-700 mb-2">Analytics by Category</h4>
                <div className="space-y-1 text-[8px] text-gray-500">
                    <div className="flex items-center"><div className="w-2 h-2 bg-blue-800 mr-1 rounded-sm"></div> LUPON</div>
                    <div className="flex items-center"><div className="w-2 h-2 bg-red-500 mr-1 rounded-sm"></div> VAWC</div>
                    <div className="flex items-center"><div className="w-2 h-2 bg-green-500 mr-1 rounded-sm"></div> COMPLAIN</div>
                </div>
             </div>
             <div className="relative w-16 h-16 rounded-full shadow-inner ring-1 ring-gray-100" style={{ background: 'conic-gradient(#1e40af 0% 35%, #ef4444 35% 55%, #eab308 55% 80%, #22c55e 80% 100%)' }}>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center"><span className="text-[6px] font-bold text-gray-400">Total</span></div>
             </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4 h-full flex flex-col">
             <div className="flex justify-between mb-2">
                <h4 className="text-[10px] font-bold text-gray-700">Daily Overview</h4>
                <span className="text-[8px] font-bold text-blue-900">JAN 2026</span>
             </div>
             <div className="grid grid-cols-7 border border-gray-100 flex-1">
                {[...Array(28)].map((_, i) => (
                    <div key={i} className="border-r border-b border-gray-50 relative bg-white flex items-start justify-start p-[1px]">
                        <span className="text-[6px] text-gray-400 leading-none">{i+1}</span>
                        {(i === 5 || i === 15) && <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-green-500 rounded-sm"></div>}
                    </div>
                ))}
             </div>
          </div>
        );
      case 'resolution':
        return (
          <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4 h-full flex flex-col justify-center">
             <h4 className="text-[10px] font-bold text-gray-700 mb-3">Resolution Overview</h4>
             <div className="space-y-2">
                <div><div className="flex justify-between text-[7px] mb-0.5"><span>Settled</span><span>80%</span></div><div className="w-full bg-gray-100 h-1 rounded-full"><div className="bg-green-600 h-1 rounded-full w-[80%]"></div></div></div>
                <div><div className="flex justify-between text-[7px] mb-0.5"><span>Escalated</span><span>50%</span></div><div className="w-full bg-gray-100 h-1 rounded-full"><div className="bg-red-600 h-1 rounded-full w-[50%]"></div></div></div>
                <div><div className="flex justify-between text-[7px] mb-0.5"><span>Blacklisted</span><span>40%</span></div><div className="w-full bg-gray-100 h-1 rounded-full"><div className="bg-gray-900 h-1 rounded-full w-[40%]"></div></div></div>
             </div>
          </div>
        );
      case 'activities':
        return (
          <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4 h-full flex flex-col">
             <h4 className="text-[10px] font-bold text-gray-700 mb-2">Recent Activities</h4>
             <div className="space-y-1.5 overflow-hidden">
                {['bg-yellow-500', 'bg-green-600', 'bg-blue-700', 'bg-red-600', 'bg-gray-800'].map((color, i) => (
                    <div key={i} className={`${color} text-white p-1.5 rounded shadow-sm flex flex-col justify-center`}>
                        <p className="text-[6px] font-bold truncate">166-09-2026 - CASE HEARING</p>
                        <p className="text-[5px] opacity-90 truncate">Edited by: Jhon Timones | 10:20</p>
                    </div>
                ))}
             </div>
          </div>
        );
      default: return null;
    }
  };

  // --- PAGINATION LOGIC ---
  const getPreviewPages = () => {
    // 1. Define Paper Dimensions (in pixels for preview scale)
    const sizes = {
        'Letter': { w: 380, h: 490 }, 
        'A4':     { w: 370, h: 520 }, 
        'Legal':  { w: 380, h: 600 } 
    };
    
    let dims = sizes[printConfig.paperSize] || sizes['Letter'];

    // Handle Orientation Swap
    if (printConfig.layout === 'Landscape') {
        dims = { w: dims.h + 100, h: dims.w }; // Adjust width for landscape aspect
    }

    // 2. Distribute Blocks into Pages
    const pages = [];
    let currentPage = [];
    let currentHeightUsed = 0;
    const padding = 80; // Top + Bottom padding inside paper
    const maxHeight = dims.h - padding;

    contentBlocks.forEach(block => {
        // If block fits, add to current page
        if (currentHeightUsed + block.height < maxHeight) {
            currentPage.push(block);
            currentHeightUsed += block.height + 16; // +16 for gap
        } else {
            // Else, push current page and start a new one
            pages.push(currentPage);
            currentPage = [block];
            currentHeightUsed = block.height;
        }
    });
    
    // Push the last page if it has content
    if (currentPage.length > 0) pages.push(currentPage);

    return { pages, width: dims.w, height: dims.h };
  };

  // --- RENDER PRINT MODAL ---
  const renderPrintModal = () => {
    if (!isPrintModalOpen) return null;

    const { pages, width, height } = getPreviewPages();

    return (
      <div className="fixed inset-0 z-[999] bg-white flex animate-in fade-in duration-200 font-sans text-gray-700">
        
        {/* LEFT: PREVIEW AREA */}
        <div className="flex-1 bg-[#525659] flex flex-col h-full relative">
            <div className="h-14 bg-[#323639] text-gray-200 flex items-center px-4 font-medium text-lg shadow-sm z-10 justify-between">
               <span>Print Preview</span>
               <button onClick={() => setIsPrintModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-auto flex flex-col items-center py-10 space-y-8 custom-scrollbar">
                {/* RENDER DYNAMIC PAGES */}
                {pages.map((pageContent, idx) => (
                    <div 
                        key={idx}
                        className="bg-white shadow-2xl transition-all duration-300 relative flex flex-col transform scale-100 origin-center"
                        style={{ width: `${width}px`, height: `${height}px`, minHeight: `${height}px` }}
                    >
                        <div className="p-8 h-full flex flex-col">
                            {/* NO HEADER - Removed as requested */}
                            
                            {/* Content Blocks Placeholder */}
                            <div className="flex-1 space-y-4">
                                {pageContent.map((block) => (
                                    <div key={block.id} style={{ height: `${block.height}px` }}>
                                        {renderBlockContent(block.id)}
                                    </div>
                                ))}
                            </div>

                            {/* Footer (Page Number) */}
                            <div className="mt-auto pt-4 border-t border-gray-300 text-[8px] text-gray-400 flex justify-between">
                                <span>Generated by System</span>
                                <span>Page {idx + 1} of {pages.length}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: SETTINGS SIDEBAR */}
        <div className="w-[320px] bg-white h-full flex flex-col shadow-xl border-l border-gray-200">
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-lg text-gray-800">Print</h2>
                <span className="text-sm text-gray-500">{pages.length} sheet{pages.length > 1 ? 's' : ''} of paper</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Controls */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Destination</label>
                    <div className="relative">
                        <select name="destination" className="w-full bg-gray-100/50 hover:bg-gray-100 text-gray-800 text-sm rounded px-3 py-2 outline-none cursor-pointer appearance-none">
                            <option>HP LaserJet Pro M402dn</option>
                            <option>Save as PDF</option>
                            <option>Microsoft Print to PDF</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Pages</label>
                    <div className="relative">
                        <select name="pages" className="w-full bg-gray-100/50 hover:bg-gray-100 text-gray-800 text-sm rounded px-3 py-2 outline-none cursor-pointer appearance-none">
                            <option>All</option>
                            <option>Custom</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Copies</label>
                    <input type="number" name="copies" value={printConfig.copies} onChange={handleConfigChange} className="w-full bg-gray-100/50 hover:bg-gray-100 text-gray-800 text-sm rounded px-3 py-2 outline-none" />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Layout</label>
                    <div className="relative">
                        <select name="layout" value={printConfig.layout} onChange={handleConfigChange} className="w-full bg-gray-100/50 hover:bg-gray-100 text-gray-800 text-sm rounded px-3 py-2 outline-none cursor-pointer appearance-none">
                            <option value="Portrait">Portrait</option>
                            <option value="Landscape">Landscape</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Paper Size</label>
                    <div className="relative">
                        <select name="paperSize" value={printConfig.paperSize} onChange={handleConfigChange} className="w-full bg-gray-100/50 hover:bg-gray-100 text-gray-800 text-sm rounded px-3 py-2 outline-none cursor-pointer appearance-none">
                            <option value="Letter">Letter</option>
                            <option value="A4">A4</option>
                            <option value="Legal">Legal</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/>
                    </div>
                </div>

                <div className="pt-2">
                    <button className="flex items-center text-[#1a73e8] text-sm font-medium hover:text-blue-700">
                        <ChevronRight size={16} className="mr-1" /> More settings
                    </button>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-white">
                <button 
                    onClick={() => setIsPrintModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-[#1a73e8] text-sm font-medium rounded hover:bg-blue-50 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handlePrintSubmit}
                    className="px-6 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded shadow-sm hover:bg-[#1557b0] transition-colors"
                >
                    Print
                </button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 font-sans">
      {/* PRINT MODAL */}
      {renderPrintModal()}

      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* --- 1. TOP CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Blue Card */}
          <div className="bg-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex justify-between items-center h-40 border border-blue-800">
            <div className="z-10">
              <h3 className="text-5xl font-bold tracking-tight">10,000</h3>
              <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mt-2">Total Cases</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <FileText size={40} className="text-blue-100" />
            </div>
          </div>

          {/* Green Card */}
          <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex justify-between items-center h-40 border border-emerald-600">
            <div className="z-10">
              <h3 className="text-5xl font-bold tracking-tight">200</h3>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider mt-2">Total Blacklisted</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <UserX size={40} className="text-emerald-100" />
            </div>
          </div>
        </div>

        {/* --- 2. MAIN GRAPH (BAR CHART) --- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-900">Total Cases Trend</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Cases Reported Per Month</p>
            </div>
            {/* EXPORT BUTTON - TRIGGERS MODAL */}
            <button 
                onClick={handleOpenPrint}
                className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors border border-blue-950"
            >
              <Download size={16} />
              <span>Export PDF</span>
            </button>
          </div>
          
          {/* BAR CHART VISUALIZATION */}
          <div className="relative h-80 w-full pl-12 pb-8">
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs font-bold text-gray-400">
              <span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
            </div>
            <div className="absolute left-10 right-0 top-0 bottom-8 flex flex-col justify-between z-0">
              <div className="border-t border-slate-200 w-full h-0"></div>
              <div className="border-t border-slate-200 w-full h-0"></div>
              <div className="border-t border-slate-200 w-full h-0"></div>
              <div className="border-t border-slate-200 w-full h-0"></div>
              <div className="border-t border-slate-200 w-full h-0"></div>
            </div>
            <div className="absolute inset-0 left-10 bottom-8 flex items-end justify-between px-4 z-10">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'].map((month) => (
                <div key={month} className="flex flex-col items-center flex-1 h-full justify-end group space-y-2">
                  <div className="flex space-x-1.5 items-end h-full w-full justify-center">
                    <div className="w-2.5 bg-blue-600 rounded-t-sm border border-blue-700 hover:opacity-80 transition-opacity" style={{ height: `${Math.floor(Math.random() * 60 + 20)}%` }}></div>
                    <div className="w-2.5 bg-emerald-500 rounded-t-sm border border-emerald-600 hover:opacity-80 transition-opacity" style={{ height: `${Math.floor(Math.random() * 50 + 10)}%` }}></div>
                    <div className="w-2.5 bg-red-500 rounded-t-sm border border-red-600 hover:opacity-80 transition-opacity" style={{ height: `${Math.floor(Math.random() * 40 + 10)}%` }}></div>
                    <div className="w-2.5 bg-yellow-400 rounded-t-sm border border-yellow-500 hover:opacity-80 transition-opacity" style={{ height: `${Math.floor(Math.random() * 40 + 10)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute left-10 right-0 bottom-0 flex justify-between px-4">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'].map((month) => (
                <div key={month} className="flex-1 text-center text-xs font-bold text-gray-500 pt-2">{month}</div>
              ))}
            </div>
            <div className="absolute -top-10 right-0 flex space-x-6 text-xs font-bold text-gray-600">
               <span className="flex items-center"><span className="w-3 h-3 bg-blue-600 rounded-full mr-2 border border-blue-700"></span>LUPON</span>
               <span className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 border border-emerald-600"></span>COMPLAIN</span>
               <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2 border border-red-600"></span>VAWC</span>
               <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2 border border-yellow-500"></span>BLOTTER</span>
            </div>
          </div>
        </div>

        {/* --- 3. BOTTOM SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
               <h3 className="text-xl font-bold text-blue-900 mb-8">Case Analytics by Category</h3>
               <div className="flex items-center justify-center space-x-16">
                 <div className="relative w-56 h-56 rounded-full shadow-inner ring-1 ring-gray-100" style={{ background: 'conic-gradient(#1e40af 0% 35%, #ef4444 35% 55%, #eab308 55% 80%, #22c55e 80% 100%)' }}>
                    <div className="absolute inset-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                      <span className="text-gray-400 text-xs font-bold">Total</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center text-sm font-bold text-gray-600"><span className="w-4 h-4 bg-blue-800 mr-3 rounded-md border border-blue-900"></span> LUPON</div>
                    <div className="flex items-center text-sm font-bold text-gray-600"><span className="w-4 h-4 bg-red-500 mr-3 rounded-md border border-red-600"></span> VAWC</div>
                    <div className="flex items-center text-sm font-bold text-gray-600"><span className="w-4 h-4 bg-yellow-400 mr-3 rounded-md border border-yellow-500"></span> BLOTTER</div>
                    <div className="flex items-center text-sm font-bold text-gray-600"><span className="w-4 h-4 bg-green-500 mr-3 rounded-md border border-green-600"></span> COMPLAIN</div>
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-blue-900">Daily Cases Overview</h3>
                   <p className="text-sm text-gray-500">Case Reminders</p>
                 </div>
                 <span className="text-xl font-bold text-blue-900 uppercase tracking-wide">JANUARY 2026</span>
               </div>
               <div className="border-t border-l border-slate-300">
                 <div className="grid grid-cols-7 text-center bg-blue-700 text-white">
                   {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                     <div key={d} className="py-3 text-xs font-bold border-r border-b border-slate-300">{d}</div>
                   ))}
                 </div>
                 <div className="grid grid-cols-7">
                   {[...Array(4)].map((_, i) => (
                      <div key={`empty-${i}`} className="h-24 bg-slate-50 border-r border-b border-slate-300"></div>
                   ))}
                   {Array.from({length: 31}).map((_, i) => {
                     const day = i + 1;
                     let eventBar = null;
                     if (day === 5) eventBar = <div className="mt-2 mx-1 h-3 bg-green-600 rounded-sm shadow-sm"></div>;
                     if (day === 9) eventBar = <div className="mt-2 mx-1 h-3 bg-yellow-500 rounded-sm shadow-sm"></div>;
                     if (day === 13) eventBar = <div className="mt-2 mx-1 h-3 bg-yellow-500 rounded-sm shadow-sm"></div>;
                     if (day === 16) eventBar = <div className="mt-2 mx-1 h-3 bg-blue-800 rounded-sm shadow-sm"></div>;
                     if (day === 22) eventBar = <div className="mt-2 mx-1 h-3 bg-blue-800 rounded-sm shadow-sm"></div>;
                     if (day === 24) eventBar = <div className="mt-2 mx-1 h-3 bg-green-600 rounded-sm shadow-sm"></div>;
                     if (day === 29) eventBar = <div className="mt-2 mx-1 h-3 bg-red-600 rounded-sm shadow-sm"></div>;
                     return (
                       <div key={i} className="h-24 border-r border-b border-slate-300 bg-white hover:bg-slate-50 transition-colors relative p-2">
                         <span className="text-sm font-bold text-gray-700 block">{day}</span>
                         {eventBar}
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-blue-900 mb-8">Case Resolution Overview</h3>
               <div className="space-y-8">
                 <div>
                   <div className="flex justify-between text-sm font-bold text-gray-700 mb-2"><span>Settled</span><span>80%</span></div>
                   <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200"><div className="bg-green-600 h-3 rounded-full border border-green-700" style={{width: '80%'}}></div></div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm font-bold text-gray-700 mb-2"><span>Escalated</span><span>50%</span></div>
                   <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200"><div className="bg-red-600 h-3 rounded-full border border-red-700" style={{width: '50%'}}></div></div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm font-bold text-gray-700 mb-2"><span>Blacklisted</span><span>40%</span></div>
                   <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200"><div className="bg-gray-900 h-3 rounded-full border border-black" style={{width: '40%'}}></div></div>
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-blue-900">Recent Activities</h3>
                 <User size={20} className="text-gray-400"/>
               </div>
               <div className="space-y-4">
                 {[
                   { color: 'bg-yellow-500 border-yellow-600', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                   { color: 'bg-green-600 border-green-700', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                   { color: 'bg-blue-700 border-blue-800', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                   { color: 'bg-gray-800 border-gray-900', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                   { color: 'bg-cyan-500 border-cyan-600', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                   { color: 'bg-red-600 border-red-700', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                   { color: 'bg-green-600 border-green-700', text: '166-09-2026 - CASE HEARING', sub: 'Edited by: Jhon Timones | 10/09 10:20' },
                 ].map((item, idx) => (
                   <div key={idx} className={`${item.color} text-white p-4 rounded-xl shadow-md border transition-transform hover:-translate-x-1 cursor-default`}>
                     <p className="text-xs font-black tracking-wide">{item.text}</p>
                     <p className="text-[10px] font-medium opacity-90 mt-1">{item.sub}</p>
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