
export const mockCases = [
  {
    type: 'LUPON',
    status: 'PENDING',
    caseNo: '01-166-02-2026',
    complainantName: 'Maria Clara',
    resident: 'Juan Dela Cruz',
    contact: '09123456789',
    date: '02-26-2026',
    fullData: {
      selectedReportType: 'LUPON',
      selectedRole: 'Lupon Head',
      caseNo: '01-166-02-2026',
      dateFiled: '2026-02-26',
      complainantName: 'Maria Clara',
      complainantContact: '09123456789',
      complainantAddress: '123 Sampaguita St.',
      defendantName: 'Juan Dela Cruz',
      defendantContact: '09987654321',
      defendantAddress: '456 Rosal St.',
      incidentDate: '2026-02-25',
      incidentLocation: 'Barangay Hall Area',
      incidentDesc: 'Verbal dispute regarding property boundaries.'
    }
  }
];

export const mockSummons = [];
export const mockCurfews = [];
export const mockManualBlacklist = [];

// --- DASHBOARD CHART DATA ---
export const mockBarData = [
  { month: 'JAN', LUPON: 35, VAWC: 20, BLOTTER: 25, COMPLAIN: 20 },
  { month: 'FEB', LUPON: 40, VAWC: 15, BLOTTER: 30, COMPLAIN: 15 },
  { month: 'MAR', LUPON: 30, VAWC: 25, BLOTTER: 25, COMPLAIN: 20 },
  { month: 'APR', LUPON: 45, VAWC: 20, BLOTTER: 20, COMPLAIN: 15 },
  { month: 'MAY', LUPON: 38, VAWC: 22, BLOTTER: 25, COMPLAIN: 15 },
  { month: 'JUN', LUPON: 42, VAWC: 18, BLOTTER: 22, COMPLAIN: 18 },
  { month: 'JUL', LUPON: 35, VAWC: 20, BLOTTER: 28, COMPLAIN: 17 },
  { month: 'AUG', LUPON: 33, VAWC: 22, BLOTTER: 27, COMPLAIN: 18 },
  { month: 'SEP', LUPON: 40, VAWC: 19, BLOTTER: 26, COMPLAIN: 15 },
  { month: 'OCT', LUPON: 37, VAWC: 21, BLOTTER: 24, COMPLAIN: 18 },
];

export const mockPieData = [
  { label: 'LUPON', percentage: 35, color: 'bg-blue-800', hexColor: '#1e40af', startAngle: 0, endAngle: 126 }, 
  { label: 'VAWC', percentage: 20, color: 'bg-red-500', hexColor: '#ef4444', startAngle: 126, endAngle: 198 }, 
  { label: 'BLOTTER', percentage: 25, color: 'bg-yellow-400', hexColor: '#eab308', startAngle: 198, endAngle: 288 }, 
  { label: 'COMPLAIN', percentage: 20, color: 'bg-green-500', hexColor: '#22c55e', startAngle: 288, endAngle: 360 }, 
];