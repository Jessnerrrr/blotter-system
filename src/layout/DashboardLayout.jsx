import React from 'react';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-white shadow-lg p-4">
        <h2 className="text-xl font-bold text-blue-800 mb-6">Barangay System</h2>
        <nav className="space-y-2">
          <div className="p-2 bg-blue-50 text-blue-700 rounded cursor-pointer font-semibold">Archived</div>
          {/* Other links would go here */}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
}