import React from 'react';

export const MainButton = ({ imageSrc, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      flex items-center space-x-3 px-3 py-3 rounded-lg cursor-pointer transition-all mb-2
      ${active 
        ? 'bg-blue-100 text-blue-900 shadow-sm border border-blue-200' 
        : 'text-gray-900 hover:bg-gray-100'}
    `}>
    <img src={imageSrc} alt={label} className={`w-8 h-8 object-contain ${active ? 'opacity-100' : 'opacity-80'}`} />
    <span className={`text-sm ${active ? 'font-extrabold' : 'font-bold'}`}>{label}</span>
  </div>
);

export const ArchivedButton = ({ actionType, onClick, children }) => {
  const colorClass = actionType === 'restore' 
    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
    : 'bg-blue-100 text-blue-700 hover:bg-blue-200';

  return (
    <button className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${colorClass}`} onClick={onClick}>
      {children}
    </button>
  );
};

export const CaseLogsButton = ({ onClick, children }) => (
  <button className="bg-gradient-to-r from-[#0066FF] to-[#0099FF] hover:from-[#0055EE] hover:to-[#0088DD] text-white shadow-md transition-all active:scale-95 text-xs font-bold px-3 py-1.5 rounded" onClick={onClick}>
    {children}
  </button>
);

export const SummonsButton = ({ variant = 'primary', onClick, children, className = '' }) => {
  const variants = {
    primary: "bg-gradient-to-r from-[#0066FF] to-[#0099FF] text-white hover:opacity-90 shadow-md",
    secondary: "bg-gray-400 hover:bg-gray-500 text-white shadow-md",
    outline: "border-2 border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-[#0066FF] hover:border-[#0066FF]"
  };
  return (
    <button className={`font-bold transition-colors flex justify-center items-center ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

export const SummonsAddNoteButton = ({ onClick, text }) => (
  <button onClick={onClick} className="flex items-center pr-5 pl-2 py-1.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0099FF] text-white shadow-md transition-all active:scale-95 shrink-0">
    <div className="relative w-8 h-8 mr-2 flex items-center justify-center">
      <div className="absolute w-6 h-6 bg-white/30 rounded-[2px] rotate-6"></div>
      <div className="absolute w-6 h-6 bg-white rounded-[2px] flex items-center justify-center shadow-sm z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </div>
    </div>
    <span className="text-sm font-bold pt-0.5 whitespace-nowrap">{text}</span>
  </button>
);

export const BlacklistedButton = ({ actionType, onClick, children }) => {
  const colorClass = 
    actionType === 'restore' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
    actionType === 'delete'  ? 'bg-red-100 text-red-700 hover:bg-red-200' :
    'bg-blue-100 text-blue-700 hover:bg-blue-200'; 
  return (
    <button className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${colorClass}`} onClick={onClick}>
      {children}
    </button>
  );
};

export const CurfewButton = ({ variant = 'primary', type = "button", onClick, children, className = '' }) => {
  const variants = {
    primary: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md",
    secondary: "bg-gray-400 hover:bg-gray-500 text-white shadow-sm",
    outline: "border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
    outlineLight: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    gradient: "bg-gradient-to-r from-[#1a3a8a] to-[#1b9ad4] hover:opacity-90 text-white shadow",
    header: "bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white shadow"
  };
  return (
    <button type={type} onClick={onClick} className={`flex items-center justify-center transition-colors ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- THIS WAS MISSING AND CAUSING YOUR ERROR! ---
export const DashboardButton = ({ variant = 'export', onClick, children, className = '' }) => {
  const variants = {
    export: "bg-blue-900 hover:bg-blue-800 text-white border border-blue-950 shadow-md",
    cancel: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm",
    print: "bg-[#007bff] hover:bg-blue-600 text-white shadow-sm"
  };
  return (
    <button onClick={onClick} className={`transition-colors font-bold flex items-center justify-center ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};