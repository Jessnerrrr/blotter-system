import React from 'react';
import { LogOut } from 'lucide-react'; // MUST import the icon!

export default function DashboardLayout({ children }) {
  // Since this simplified sidebar doesn't have a collapse function yet, 
  // we set isExpanded to true so the text always shows and doesn't crash.
  const isExpanded = true; 

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* --- SIDEBAR --- */}
      {/* Added flex flex-col so we can push the logout button to the bottom */}
      <div className="w-64 bg-white shadow-lg p-4 flex flex-col">
        
        <h2 className="text-xl font-bold text-blue-800 mb-6">Barangay System</h2>
        
        {/* Added flex-1 to push the bottom div down */}
        <nav className="space-y-2 flex-1">
          <div className="p-2 bg-blue-50 text-blue-700 rounded cursor-pointer font-semibold">Archived</div>
          {/* Other links would go here */}
        </nav>

        {/* --- BOTTOM SECTION (Logout) --- */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button 
            onClick={() => {
              // Put your logout logic here
              console.log("Logging out");
              // localStorage.removeItem('saved_active_page');
              // window.location.href = '/login'; 
            }}
            title={!isExpanded ? "Logout" : ""}
            className="w-full flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden text-red-600 hover:bg-red-50 font-medium"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-8">
              <LogOut size={24} strokeWidth={2.5} className="text-red-600 transition-transform hover:scale-110" />
            </div>
            <span 
              className={`text-sm transition-all duration-300 ease-in-out whitespace-nowrap
                ${isExpanded ? 'opacity-100 ml-3 w-auto translate-x-0' : 'opacity-0 w-0 ml-0 -translate-x-4'}
              `}
            >
              Logout
            </span>
          </button>
        </div>

      </div>
      
      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>

    </div>
  );
}