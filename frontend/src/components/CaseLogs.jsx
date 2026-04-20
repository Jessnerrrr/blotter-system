import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronDown, Check, Upload, Calendar, MapPin, Filter, FileText, Trash2, Clock, FileWarning, Bold, Italic, Underline, Link as LinkIcon, AlignLeft, Printer, Search } from 'lucide-react';
import Swal from 'sweetalert2';

import { useLanguage } from './LanguageContext'; 
import { CaseLogsButton } from "./buttons/Buttons"; 
import { casesAPI, summonsAPI, residentsAPI } from "../services/api";
import ResidentAutocomplete from './ResidentAutocomplete';

const getStatusStyle = (status) => {
  switch (status) {
    case 'SETTLED': return 'bg-green-500 text-white border-green-600';
    case 'ESCALATED': return 'bg-red-500 text-white border-red-600';
    case 'BLACKLISTED': return 'bg-black text-white border-gray-800';
    case 'PENDING': return 'bg-yellow-500 text-white border-yellow-600';
    default: return 'bg-gray-500 text-white';
  }
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'LUPON': return 'bg-green-600 text-white';
    case 'VAWC': return 'bg-purple-600 text-white';
    case 'BLOTTER': return 'bg-red-600 text-white';
    case 'COMPLAIN': return 'bg-blue-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
};

// Helper function to calculate age from birthdate
const calculateAge = (birthdate) => {
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(age, 0);
};

const fetchResidentAge = async (name) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) return '';
  try {
    const data = await residentsAPI.getAgeByName(name.trim());
    if (!data) return '';
    if (data.age !== undefined && data.age !== null) return String(data.age);
    if (data.birthdate) return String(calculateAge(data.birthdate));
    return '';
  } catch (error) {
    console.error('Error fetching resident age by name:', error);
    return '';
  }
};

export default function CaseLogs() {
  const { t } = useLanguage(); 
  const [view, setView] = useState('TABLE'); 
  
  const [cases, setCases] = useState([]);
  const [allSummonsCache, setAllSummonsCache] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const [casesData, summonsData] = await Promise.all([
          casesAPI.getAll(),
          summonsAPI.getAll() 
        ]);
        setCases(casesData);
        setAllSummonsCache(summonsData);
        setError(null);
      } catch (err) {
        console.error('Error loading cases:', err);
        setError(err.message);
        Swal.fire({
          title: 'Error Loading Cases',
          text: 'Could not load cases from database. Please check backend connection.',
          icon: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCases();
    
    const refreshInterval = setInterval(loadCases, 10000);
    const handleCaseUpdate = () => loadCases();
    window.addEventListener('caseDataUpdated', handleCaseUpdate);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('caseDataUpdated', handleCaseUpdate);
    };
  }, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isModeratorModalOpen, setIsModeratorModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedRole, setSelectedRole] = useState('Lupon Head');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  
  const [isYearSortOpen, setIsYearSortOpen] = useState(false);
  const [isMonthSortOpen, setIsMonthSortOpen] = useState(false);
  const [isDaySortOpen, setIsDaySortOpen] = useState(false); // 🔥 NEW: Day Dropdown State
  const [isTypeSortOpen, setIsTypeSortOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All Years');
  const [filterMonth, setFilterMonth] = useState('All Months');
  const [filterDay, setFilterDay] = useState('All Days'); // 🔥 NEW: Day Filter State
  const [filterType, setFilterType] = useState('All Types');

  const [formData, setFormData] = useState({
    caseNo: '', dateFiled: '', 
    complainantName: '', complainantAge: '', complainantContact: '', complainantAddress: '',
    respondentName: '', respondentAge: '', respondentContact: '', respondentAddress: '', 
    incidentDate: '', incidentLocation: '', incidentDesc: ''
  });
  
  const [ageLoading, setAgeLoading] = useState({ complainant: false, respondent: false });
  
  const [viewCaseData, setViewCaseData] = useState(null);
  
  useEffect(() => {
    const fetchMissingAges = async () => {
      if (view === 'VIEW_CASE' && viewCaseData) {
        let updated = false;
        let newData = { ...viewCaseData };

        if (!newData.complainantAge && newData.complainantName) {
          try {
            const resolvedAge = await fetchResidentAge(newData.complainantName);
            if (resolvedAge) {
              newData.complainantAge = resolvedAge;
              updated = true;
            }
          } catch (e) { console.error('Error auto-fetching complainant age', e); }
        }

        if (!newData.respondentAge && newData.respondentName) {
          try {
            const resolvedAge = await fetchResidentAge(newData.respondentName);
            if (resolvedAge) {
              newData.respondentAge = resolvedAge;
              updated = true;
            }
          } catch (e) { console.error('Error auto-fetching respondent age', e); }
        }

        if (updated) {
          setViewCaseData(newData);
        }
      }
    };

    fetchMissingAges();
  }, [view, viewCaseData?.caseNo]);

  const [summonData, setSummonData] = useState({ caseNo: '', residentName: '', summonDate: '', summonTime: '',  selectedHour: '00', selectedMinute: '00',  selectedPeriod: '--', summonType: '', summonReason: '', notedBy: '' });
  const editorRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null); 
  const fileInputRef = useRef(null);
  
  const [formErrors, setFormErrors] = useState({});
  const [summonErrors, setSummonErrors] = useState({});
  const [takenSummons, setTakenSummons] = useState([]); 

  const today = new Date().toISOString().split('T')[0]; 
  const currentYear = new Date().getFullYear();
  const yearOptions = ['All Years', ...Array.from({length: 7}, (_, i) => (currentYear - i).toString())];
  const monthOptions = ['All Months', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayOptions = ['All Days', ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))]; // 🔥 NEW: Day Options
  const typeOptions = ['All Types', 'LUPON', 'VAWC', 'BLOTTER', 'COMPLAIN'];
  
  const roles = ['Lupon Head', 'Lupon Tagapamayapa', 'Administration']; 

  const filteredData = cases.filter((item) => {
    if (item.type === 'CURFEW') return false; 
    if (item.status === 'SETTLED' || item.status === 'BLACKLISTED') return false;

    const itemDateParts = item.date ? item.date.split('-') : []; 
    let itemYear = '';
    let itemMonth = '';
    let itemDay = ''; // 🔥 NEW: Day Extractor

    if (itemDateParts.length === 3) {
        if (itemDateParts[2].length === 4) { // MM-DD-YYYY
            itemYear = itemDateParts[2];
            itemMonth = itemDateParts[0].padStart(2, '0');
            itemDay = itemDateParts[1].padStart(2, '0');
        } else { // YYYY-MM-DD
            itemYear = itemDateParts[0];
            itemMonth = itemDateParts[1].padStart(2, '0');
            itemDay = itemDateParts[2].padStart(2, '0');
        }
    }

    const matchesYear = filterYear === 'All Years' || itemYear === filterYear;
    const matchesMonth = filterMonth === 'All Months' || itemMonth === filterMonth.padStart(2, '0');
    const matchesDay = filterDay === 'All Days' || itemDay === filterDay; // 🔥 NEW: Day Matcher
    const matchesType = filterType === 'All Types' || item.type === filterType;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                          (item.caseNo && item.caseNo.toLowerCase().includes(searchLower)) ||
                          (item.complainantName && item.complainantName.toLowerCase().includes(searchLower)) ||
                          (item.resident && item.resident.toLowerCase().includes(searchLower));

    return matchesYear && matchesMonth && matchesDay && matchesType && matchesSearch;
  });

  const handleReportTypeSelect = (type) => { setSelectedReportType(type); setIsModeratorModalOpen(true); };
  const handleRoleSelect = (role) => { setSelectedRole(role); setIsDropdownOpen(false); };

  const handleContinueToForm = () => {
    let maxControlNum = 0;
    cases.forEach(c => {
        if (c.caseNo && c.caseNo.includes('-166-')) {
            const parts = c.caseNo.split('-');
            const num = parseInt(parts[0], 10);
            if (!isNaN(num) && num > maxControlNum) maxControlNum = num;
        }
    });
    const nextControlNum = String(maxControlNum + 1).padStart(2, '0');
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const newCaseNo = `${nextControlNum}-166-${month}-${now.getFullYear()}`;

    setFormData({
      caseNo: newCaseNo, dateFiled: today,
      complainantName: '', complainantAge: '', complainantContact: '', complainantAddress: '',
      respondentName: '', respondentAge: '', respondentContact: '', respondentAddress: '',
      incidentDate: '', incidentLocation: '', incidentDesc: ''
    });
    setAttachedFiles([]);
    setPreviewFile(null);
    setFormErrors({});
    setIsModalOpen(false);
    setIsModeratorModalOpen(false);
    setView('FORM');
  };

  const validateField = (name, value) => {
    if (!value || !value.trim()) return 'This field is required';

    if (name.includes('Name')) {
        const nameRegex = /^[a-zA-ZñÑ\s,\.\-]+$/;
        if (!nameRegex.test(value)) return 'Only letters, spaces, commas, and periods allowed';
    }

    if (name.includes('Contact')) {
        const rawNumbers = value.replace(/[^0-9]/g, '');
        if (rawNumbers === '63' || rawNumbers.length === 0) return 'Contact number is required';
        if (rawNumbers.length > 2 && rawNumbers[2] !== '9') return 'PH mobile numbers must start with 9';
        if (rawNumbers.length !== 12) return 'Must be exactly 10 digits after +63';
    }

    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name.includes('Contact')) {
      let rawNumbers = value.replace(/\D/g, '');
      if (rawNumbers.startsWith('63')) rawNumbers = rawNumbers.substring(2);
      else if (rawNumbers.startsWith('0')) rawNumbers = rawNumbers.substring(1);
      rawNumbers = rawNumbers.substring(0, 10); 
      finalValue = rawNumbers.length > 0 ? `(+63) ${rawNumbers}` : '';
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (formErrors[name]) {
        const error = validateField(name, finalValue);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const getInputClass = (fieldName, errorState = formErrors) => {
    const base = "w-full border rounded-lg px-4 py-3 outline-none transition-all";
    return errorState[fieldName] ? `${base} border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200` : `${base} border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100`;
  };

  const handleAssignSummonClick = async (caseItem) => {
    try {
      const allSummons = await summonsAPI.getAll();
      const caseSummons = allSummons.filter(s => s.caseNo === caseItem.caseNo);
      const usedTypes = caseSummons.map(s => s.summonType);
      setTakenSummons(usedTypes);

      setSummonData({
        caseNo: caseItem.caseNo, residentName: caseItem.resident || caseItem.respondentName || 'Unknown',
        summonDate: '', summonTime: '', selectedHour: '00', selectedMinute: '00', selectedPeriod: '--', summonType: '', summonReason: '', notedBy: ''
      });
      setSummonErrors({});
      if(editorRef.current) editorRef.current.innerHTML = "";
      setView('SUMMON');
    } catch (error) {
      console.error('Error loading summons:', error);
      Swal.fire({ title: 'Error', text: 'Failed to load summons data.', icon: 'error', confirmButtonColor: '#d33' });
    }
  };

  const handleViewCase = (caseItem) => {
    if (caseItem.fullData) {
        setViewCaseData(caseItem.fullData);
    } else {
        setViewCaseData({
            selectedReportType: caseItem.type, selectedRole: '', caseNo: caseItem.caseNo, dateFiled: caseItem.date,
            complainantName: caseItem.complainantName || caseItem.resident || '', complainantContact: caseItem.contact || '', complainantAddress: '', complainantAge: '',
            respondentName: caseItem.resident || '', respondentContact: '', respondentAddress: '', respondentAge: '', incidentDate: caseItem.date, incidentLocation: '', incidentDesc: ''
        });
    }
    setView('VIEW_CASE');
  };

  const handleSummonInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'summonType' && value === '2' && !takenSummons.includes('1')) {
    Swal.fire({
      title: 'Cannot Select Second Summon',
      text: 'You must issue the First Summon before issuing the Second Summon.',
      icon: 'warning',
      confirmButtonColor: '#d33'
    });
    return;
  }
  
  if (name === 'summonType' && value === '3' && !takenSummons.includes('2')) {
    Swal.fire({
      title: 'Cannot Select Third Summon',
      text: 'You must issue the Second Summon before issuing the Third Summon.',
      icon: 'warning',
      confirmButtonColor: '#d33'
    });
    return;
  }
  
  setSummonData(prev => ({ ...prev, [name]: value }));
  if (summonErrors[name]) setSummonErrors(prev => ({ ...prev, [name]: '' }));
};

  const applyCommand = (e, command, value = null) => {
    e.preventDefault(); document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleCancelModerator = () => { setIsModeratorModalOpen(false); };
  const handleBackToListFromOverview = () => { setView('TABLE'); };

  const handlePrintOverview = () => {
    Swal.fire({ title: t('confirm_print_case'), text: t('confirm_print_text'), icon: 'question', showCancelButton: true, confirmButtonColor: '#0066FF', cancelButtonColor: '#d33', confirmButtonText: t('Print'), cancelButtonText: t('cancel') }).then((result) => {
      if (result.isConfirmed) setTimeout(() => { window.print(); }, 300);
    });
  };

  const handleCancelSummon = () => { setView('TABLE'); };

  const handleSubmitSummon = () => {
  const currentReason = editorRef.current ? editorRef.current.innerHTML : '';
  const finalData = { ...summonData, summonReason: currentReason };
  
  const errors = {};
  const required = ['summonDate', 'summonType', 'notedBy'];
  required.forEach(f => { 
    const value = finalData[f];
    if (!value || (typeof value === 'string' && !value.trim())) errors[f] = 'Required';
  });
  
  if (finalData.selectedHour === '00') {
    errors['summonTime'] = 'Required';
  }

  if (!currentReason || currentReason === '<br>' || currentReason.trim() === '') errors['summonReason'] = 'Required';
  
  if (Object.keys(errors).length > 0) {
    setSummonErrors(errors);
    Swal.fire({ title: 'Incomplete Details', text: 'Please fill out all required fields highlighted in red.', icon: 'warning', confirmButtonColor: '#d33' });
    return;
  }

    Swal.fire({ title: t('confirm_summon?'), text: t('confirm_save_text'), icon: 'question', showCancelButton: true, confirmButtonColor: '#2563eb', cancelButtonColor: '#d33', confirmButtonText: t('yes_save'), cancelButtonText: t('cancel') }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const newSummonRecord = { ...finalData, status: 'Active' };
          const saved = await summonsAPI.create(newSummonRecord);
          window.dispatchEvent(new Event('caseDataUpdated'));
          setView('TABLE');
          Swal.fire({ title: 'Summon Assigned!', text: `Summon scheduled for ${finalData.residentName}.`, icon: 'success', confirmButtonColor: '#1d4ed8' });
        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message || 'Failed to save summon to database.';
          Swal.fire({ title: 'Error', text: errorMsg, icon: 'error', confirmButtonColor: '#d33' });
        }
      }
    });
  };

  const handleCancelNewCase = () => { setView('TABLE'); };

  const handleComplainantSelect = async (resident) => {
    const selectedName = resident.full_name || '';
    const resolvedAge = resident.age !== undefined && resident.age !== null
      ? String(resident.age)
      : resident.birthdate
        ? String(calculateAge(resident.birthdate))
        : '';

    setFormData(prev => ({
      ...prev,
      complainantName: selectedName,
      complainantContact: resident.contact_number || '',
      complainantAddress: resident.address_text || '',
      complainantAge: resolvedAge
    }));

    if (!resolvedAge && selectedName) {
      setAgeLoading(prev => ({ ...prev, complainant: true }));
      const fetchedAge = await fetchResidentAge(selectedName);
      setFormData(prev => ({ ...prev, complainantAge: fetchedAge }));
      setAgeLoading(prev => ({ ...prev, complainant: false }));
    }
  };

  const handleComplainantBlur = async (value) => {
    const normalizedValue = value?.trim();
    if (!normalizedValue) return;
    if (formData.complainantName === normalizedValue && formData.complainantAge) return;

    setAgeLoading(prev => ({ ...prev, complainant: true }));
    const fetchedAge = await fetchResidentAge(normalizedValue);
    setFormData(prev => ({ ...prev, complainantAge: fetchedAge }));
    setAgeLoading(prev => ({ ...prev, complainant: false }));
  };

  const handleRespondentSelect = async (resident) => {
    const selectedName = resident.full_name || '';
    const resolvedAge = resident.age !== undefined && resident.age !== null
      ? String(resident.age)
      : resident.birthdate
        ? String(calculateAge(resident.birthdate))
        : '';

    setFormData(prev => ({
      ...prev,
      respondentName: selectedName,
      respondentContact: resident.contact_number || '',
      respondentAddress: resident.address_text || '',
      respondentAge: resolvedAge
    }));

    if (!resolvedAge && selectedName) {
      setAgeLoading(prev => ({ ...prev, respondent: true }));
      const fetchedAge = await fetchResidentAge(selectedName);
      setFormData(prev => ({ ...prev, respondentAge: fetchedAge }));
      setAgeLoading(prev => ({ ...prev, respondent: false }));
    }
  };

  const handleRespondentBlur = async (value) => {
    const normalizedValue = value?.trim();
    if (!normalizedValue) return;
    if (formData.respondentName === normalizedValue && formData.respondentAge) return;

    setAgeLoading(prev => ({ ...prev, respondent: true }));
    const fetchedAge = await fetchResidentAge(normalizedValue);
    setFormData(prev => ({ ...prev, respondentAge: fetchedAge }));
    setAgeLoading(prev => ({ ...prev, respondent: false }));
  };

  const handleSubmitCase = () => {
    const errors = {};
    const fieldsToValidate = [
        'complainantName', 'complainantContact', 'complainantAddress', 
        'respondentName', 'respondentContact', 'respondentAddress', 
        'incidentDate', 'incidentLocation', 'incidentDesc'
    ];
    
    fieldsToValidate.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) errors[field] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Swal.fire({ 
          title: 'Incomplete Details', 
          text: 'Please fix the errors highlighted in red before submitting.', 
          icon: 'warning', 
          confirmButtonColor: '#d33' 
      });
      return;
    }

    Swal.fire({ title: t('confirm_save_title'), text: t('confirm_save_text'), icon: 'question', showCancelButton: true, confirmButtonColor: '#2563eb', cancelButtonColor: '#d33', confirmButtonText: t('yes_save'), cancelButtonText: t('cancel') }).then(async (result) => {
        if(result.isConfirmed) {
            const dateObj = new Date(formData.dateFiled);
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${dateObj.getFullYear()}`;
            
            const newCase = { 
              type: selectedReportType, 
              status: 'PENDING', 
              caseNo: formData.caseNo, 
              complainantName: formData.complainantName, 
              resident: formData.respondentName, 
              contact: formData.complainantContact, 
              date: formattedDate, 
              fullData: { ...formData, selectedReportType, selectedRole } 
            };

            try {
              const savedCase = await casesAPI.create(newCase);
              setCases([savedCase, ...cases]);
              setFilterType('All Types');
              setFilterYear('All Years');
              setFilterMonth('All Months');
              setFilterDay('All Days');
              setSearchQuery('');
              setView('TABLE');
              window.dispatchEvent(new Event('caseDataUpdated'));
              
              Swal.fire({ title: 'Success!', text: 'Case saved to database successfully!', icon: 'success' });
            } catch (err) {
              Swal.fire({ title: 'Error!', text: 'Failed to save case to database. Please try again.', icon: 'error' });
            }
        }
    });
  };

  const handleFileZoneClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => { if (e.target.files?.length) setAttachedFiles([...attachedFiles, ...Array.from(e.target.files)]); };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatFileType = (type, name) => {
    if (!type) return `${name.split('.').pop().toUpperCase()} File`;
    if (type.includes('image/png')) return 'PNG File';
    if (type.includes('image/jpeg')) return 'JPEG File';
    if (type.includes('application/pdf')) return 'PDF Document';
    return type.split('/')[1]?.toUpperCase() + ' File' || 'File';
  };

  const handleViewFile = (e, file) => { e.stopPropagation(); setPreviewFile(file); };
  const handleRemoveFile = (index, e) => { e.stopPropagation(); setAttachedFiles(prev => prev.filter((_, i) => i !== index)); };

  if (view === 'VIEW_CASE' && viewCaseData) {
     return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 relative">
            <style>{`@media print { body * { visibility: hidden; } #printable-overview, #printable-overview * { visibility: visible; } #printable-overview { position: absolute; left: 0; top: 0; width: 100%; padding: 10mm; } }`}</style>
            <div id="printable-overview" className="hidden print:block text-black font-sans">
                <h1 className="text-2xl font-bold text-center mb-6 uppercase">{t('case_report_overview')}</h1>
                <table className="w-full border-collapse border border-black text-sm">
                    <tbody>
                        <tr><td className="border border-black p-3 font-bold bg-gray-100 w-1/4">{t('report_type')}</td><td className="border border-black p-3 w-1/4">{viewCaseData.selectedReportType}</td><td className="border border-black p-3 font-bold bg-gray-100 w-1/4">{t('assign_moderator')}</td><td className="border border-black p-3 w-1/4">{viewCaseData.selectedRole}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-100">{t('case_no')}</td><td className="border border-black p-3">{viewCaseData.caseNo}</td><td className="border border-black p-3 font-bold bg-gray-100">{t('date_filed')}</td><td className="border border-black p-3">{viewCaseData.dateFiled}</td></tr>
                        <tr><td colSpan="2" className="border border-black p-3 font-bold text-center bg-gray-200 uppercase tracking-wide">{t('complainant')}</td><td colSpan="2" className="border border-black p-3 font-bold text-center bg-gray-200 uppercase tracking-wide">{t('respondent')}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-50">{t('full_name')}</td><td className="border border-black p-3">{viewCaseData.complainantName}</td><td className="border border-black p-3 font-bold bg-gray-50">{t('full_name')}</td><td className="border border-black p-3">{viewCaseData.respondentName}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-50">{t('age')}</td><td className="border border-black p-3">{viewCaseData.complainantAge || 'N/A'}</td><td className="border border-black p-3 font-bold bg-gray-50">{t('age')}</td><td className="border border-black p-3">{viewCaseData.respondentAge || 'N/A'}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-50">{t('contact_no')}</td><td className="border border-black p-3">{viewCaseData.complainantContact}</td><td className="border border-black p-3 font-bold bg-gray-50">{t('contact_no')}</td><td className="border border-black p-3">{viewCaseData.respondentContact}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-50">{t('address')}</td><td className="border border-black p-3">{viewCaseData.complainantAddress}</td><td className="border border-black p-3 font-bold bg-gray-50">{t('address')}</td><td className="border border-black p-3">{viewCaseData.respondentAddress}</td></tr>
                        <tr><td colSpan="4" className="border border-black p-3 font-bold text-center bg-gray-200 uppercase tracking-wide">{t('incident_details')}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-50">{t('date_filed')}</td><td className="border border-black p-3">{viewCaseData.incidentDate}</td><td className="border border-black p-3 font-bold bg-gray-50">{t('location')}</td><td className="border border-black p-3">{viewCaseData.incidentLocation}</td></tr>
                        <tr><td className="border border-black p-3 font-bold bg-gray-50 align-top">{t('description')}</td><td colSpan="3" className="border border-black p-3 whitespace-pre-wrap leading-relaxed">{viewCaseData.incidentDesc}</td></tr>
                    </tbody>
                  </table>
                <div className="mt-16 text-right"><div className="inline-block border-t border-black w-64 text-center pt-2 font-bold text-sm">{t('auth_officer_name')}</div></div>
            </div>

            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
                <div className="bg-blue-700 p-8 text-white text-center"><h2 className="text-3xl font-bold">{t('case_report_overview')}</h2></div>
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-bold text-gray-500 mb-2">{t('report_type')}</label><div className="bg-slate-100 p-4 rounded-lg font-bold text-gray-700">{viewCaseData.selectedReportType}</div></div><div><label className="block text-sm font-bold text-gray-500 mb-2">{t('assign_moderator')}</label><div className="bg-slate-100 p-4 rounded-lg font-bold text-gray-700">{viewCaseData.selectedRole}</div></div></div>
                    <div className="grid grid-cols-2 gap-6"><div><label className="font-bold text-gray-700">{t('case_no')}</label><input type="text" value={viewCaseData.caseNo} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed font-mono font-bold" /></div><div><label className="font-bold text-gray-700">{t('date_filed')}</label><input type="date" value={viewCaseData.dateFiled} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed font-bold" /></div></div>
                    <div className="grid grid-cols-2 gap-8"><div className="space-y-4"><h4 className="text-blue-600 font-bold border-b pb-2">{t('complainant')}</h4><input type="text" value={viewCaseData.complainantName} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.complainantAge || 'N/A'} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.complainantContact} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.complainantAddress} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /></div><div className="space-y-4"><h4 className="text-blue-600 font-bold border-b pb-2">{t('Respondent')}</h4><input type="text" value={viewCaseData.respondentName} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.respondentAge || 'N/A'} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.respondentContact} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.respondentAddress} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /></div></div>
                    <div className="space-y-4"><h4 className="text-blue-600 font-bold border-b pb-2">{t('incident_details')}</h4><div className="grid grid-cols-2 gap-6"><input type="date" value={viewCaseData.incidentDate} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /><input type="text" value={viewCaseData.incidentLocation} readOnly className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed" /></div><textarea value={viewCaseData.incidentDesc} readOnly rows="4" className="w-full bg-slate-100 border border-gray-200 text-gray-600 p-3 rounded-lg cursor-not-allowed resize-none"></textarea></div>
                </div>
                <div className="bg-slate-50 p-8 border-t flex justify-end space-x-4"><button onClick={handlePrintOverview} className="flex items-center px-8 py-3 border-2 border-[#0066FF] text-[#0066FF] font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"><Printer size={18} className="mr-2" />{t('print_details')}</button><button onClick={handleBackToListFromOverview} className="px-8 py-3 border border-gray-300 font-bold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">{t('back_to_list')}</button></div>
            </div>
        </div>
     );
  }

  if (view === 'SUMMON') {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-700 py-6 relative overflow-hidden flex items-center justify-center">
            <div className="absolute left-8 top-1/2 -translate-y-1/2"><img src="/icon-summons/assign summon.png" alt="Assign Summon" className="w-16 h-16 object-contain opacity-80" /></div>
            <div className="text-center text-white z-10"><h2 className="text-2xl font-bold tracking-tight">{t('assign_summons')}</h2><p className="text-blue-100 mt-1 text-xs">{t('summon_schedule_subtitle')}</p></div>
          </div>
          <div className="p-8 space-y-5 bg-slate-50">
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold text-gray-700 mb-1">{t('case_no')}</label><input type="text" value={summonData.caseNo} readOnly className="w-full bg-gray-200 border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed font-bold" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">{t('resident_name')}</label><input type="text" value={summonData.residentName} readOnly className="w-full bg-gray-200 border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed font-bold" /></div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold text-gray-700 mb-1">{t('summon_date')}</label><div className="relative"><input type="date" name="summonDate" value={summonData.summonDate} onChange={handleSummonInputChange} min={today} className={`${getInputClass('summonDate', summonErrors)} py-2 text-sm`} /><Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} /></div>{summonErrors.summonDate && <p className="text-red-500 text-[10px] mt-1 font-bold">{summonErrors.summonDate}</p>}</div>
<div>
  <label className="block text-xs font-bold text-gray-700 mb-1">{t('summon_time')}</label>
  <div className="flex gap-2 relative">
    <select 
      value={summonData.selectedHour || '00'} 
      onChange={(e) => { 
        const hour = e.target.value; 
        let period = '--'; 
        if (hour === '08' || hour === '09' || hour === '10' || hour === '11') { 
          period = 'AM'; 
        } else if (hour === '12' || hour === '01' || hour === '02' || hour === '03' || hour === '04' || hour === '05') { 
          period = 'PM'; 
        } 
        setSummonData(prev => ({ 
          ...prev, 
          selectedHour: hour, 
          selectedPeriod: period, 
          summonTime: hour === '00' ? '' : `${hour}:${prev.selectedMinute || '00'} ${period}` 
        })); 
      }} 
      className={`${summonErrors.summonTime ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'} flex-1 border rounded-lg px-4 py-3 outline-none focus:ring-2`}
      style={{ transform: 'rotate(0deg)', direction: 'ltr' }}
    >
      <option value="00" disabled>00</option>
      <option value="08">08</option>
      <option value="09">09</option>
      <option value="10">10</option>
      <option value="11">11</option>
      <option value="12">12</option>
      <option value="01">01</option>
      <option value="02">02</option>
      <option value="03">03</option>
      <option value="04">04</option>
      <option value="05">05</option>
    </select>

    <select 
      value={summonData.selectedMinute || '00'} 
      onChange={(e) => { 
        const minute = e.target.value; 
        setSummonData(prev => ({ 
          ...prev, 
          selectedMinute: minute, 
          summonTime: prev.selectedHour === '00' ? '' : `${prev.selectedHour || '08'}:${minute} ${prev.selectedPeriod || 'AM'}` 
        })); 
      }} 
      className={`${summonErrors.summonTime ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'} flex-1 border rounded-lg px-4 py-3 outline-none focus:ring-2`}
      style={{ transform: 'rotate(0deg)', direction: 'ltr' }}
    >
      {Array.from({ length: 60 }, (_, i) => { 
        const minuteStr = i.toString().padStart(2, '0'); 
        return <option key={i} value={minuteStr}>{minuteStr}</option>; 
      })}
    </select>

    <div className={`w-24 border ${summonErrors.summonTime ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 bg-gray-50 text-gray-700'} rounded-lg px-4 py-3 font-medium text-center transition-colors`}>
      {summonData.selectedHour === '00' ? '--' : summonData.selectedPeriod}
    </div>
  </div>
  {summonErrors.summonTime && <p className="text-red-500 text-[10px] mt-1 font-bold absolute">{summonErrors.summonTime}</p>}
</div>
     </div>
           <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">{t('select_summons_no')}</label>
  <div className="relative mt-2">
    <select 
      name="summonType" 
      value={summonData.summonType} 
      onChange={handleSummonInputChange} 
      className={`${getInputClass('summonType', summonErrors)} appearance-none py-2 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all cursor-pointer`}
    >
      <option value="" disabled>{t('select_option')}</option>
      {!takenSummons.includes('1') && <option value="1">{t('first_summon')}</option>}
      {!takenSummons.includes('2') && <option value="2">{t('second_summon')}</option>}
      {!takenSummons.includes('3') && <option value="3">{t('third_summon')}</option>}
      {takenSummons.includes('1') && <option value="1" disabled className="opacity-60">{t('first_summon')} {t('issued')}</option>}
      {takenSummons.includes('2') && <option value="2" disabled className="opacity-60">{t('second_summon')} {t('issued')}</option>}
      {takenSummons.includes('3') && <option value="3" disabled className="opacity-60">{t('third_summon')} {t('issued')}</option>}
    </select>
    <ChevronDown className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
  </div>
  {summonErrors.summonType && <p className="text-red-500 text-[10px] mt-1 font-bold">{summonErrors.summonType}</p>}
</div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('summon_reason')}</label>
              <div className={`border-2 rounded-xl overflow-hidden shadow-sm flex flex-col h-40 transition-colors ${summonErrors.summonReason ? 'border-red-500 focus-within:border-red-600 ring-2 ring-red-100' : 'border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'}`}>
                <div className="relative flex-1 bg-white cursor-text" onClick={() => editorRef.current?.focus()}>
                  <div ref={editorRef} contentEditable suppressContentEditableWarning={true} className="w-full h-full p-4 text-sm text-gray-600 focus:outline-none overflow-y-auto" style={{ minHeight: '100%' }} placeholder={t('detailed_description')} />
                </div>
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex items-center space-x-3 text-gray-500">
                  <button onMouseDown={(e) => applyCommand(e, 'bold')} className="hover:text-[#0066FF] p-1 rounded" title="Bold"><Bold size={14} /></button>
                  <button onMouseDown={(e) => applyCommand(e, 'italic')} className="hover:text-[#0066FF] p-1 rounded" title="Italic"><Italic size={14} /></button>
                  <button onMouseDown={(e) => applyCommand(e, 'underline')} className="hover:text-[#0066FF] p-1 rounded" title="Underline"><Underline size={14} /></button>
                  <div className="h-4 w-px bg-gray-300 mx-2"></div>
                </div>
              </div>
              {summonErrors.summonReason && <p className="text-red-500 text-[10px] mt-1 font-bold">{summonErrors.summonReason}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('noted_by')}</label>
              <input type="text" name="notedBy" value={summonData.notedBy} onChange={handleSummonInputChange} placeholder={t('auth_officer_name')} className={`${getInputClass('notedBy', summonErrors)} py-2 text-sm`} />
              {summonErrors.notedBy && <p className="text-red-500 text-[10px] mt-1 font-bold">{summonErrors.notedBy}</p>}
            </div>
          </div>
          <div className="bg-white p-5 border-t border-gray-200 flex justify-end space-x-3">
            <button onClick={handleCancelSummon} className="px-5 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">{t('cancel')}</button>
            <button onClick={handleSubmitSummon} className="px-6 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('submit_summon')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'FORM') {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 relative">
        
        {previewFile && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200" onClick={() => setPreviewFile(null)}>
            <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b bg-gray-50 shrink-0">
                <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                  <FileText className="text-blue-500" size={20}/>
                  {previewFile.name}
                </h3>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors">
                  <X size={24} strokeWidth={2.5}/>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 flex justify-center items-center bg-slate-100 min-h-[50vh]">
                {previewFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(previewFile)} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded shadow-sm border border-gray-200" />
                ) : previewFile.type === 'application/pdf' ? (
                  <iframe src={URL.createObjectURL(previewFile)} className="w-full h-[75vh] border rounded shadow-sm" title="PDF Preview" />
                ) : (
                  <div className="text-center text-gray-400 bg-white p-12 rounded-xl shadow-sm border border-gray-200">
                    <FileWarning size={64} className="mx-auto mb-4 opacity-50 text-yellow-500" />
                    <p className="text-lg font-bold text-gray-600">Preview not available</p>
                    <p className="text-sm mt-1">Cannot preview {formatFileType(previewFile.type, previewFile.name)} files directly in the browser.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-700 p-8 text-white"><h2 className="text-3xl font-bold">{t('create_report')}</h2><p className="opacity-80">{t('select_type_report')}</p></div>
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-bold text-gray-500 mb-2">{t('report_type')}</label><div className="bg-gray-100 p-4 rounded-lg font-bold text-blue-800">{selectedReportType}</div></div><div><label className="block text-sm font-bold text-gray-500 mb-2">{t('assign_moderator')}</label><div className="bg-gray-100 p-4 rounded-lg font-bold text-blue-800">{selectedRole}</div></div></div>
            <div className="grid grid-cols-2 gap-6"><div><label className="font-bold">{t('case_no')}</label><input type="text" value={formData.caseNo} readOnly className="w-full bg-slate-100 border p-3 rounded-lg cursor-not-allowed font-mono font-bold" /></div><div><label className="font-bold">{t('date_filed')}</label><input type="date" name="dateFiled" value={formData.dateFiled} readOnly className="w-full bg-slate-100 border p-3 rounded-lg cursor-not-allowed font-bold text-gray-600" /></div></div>
            
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="text-blue-600 font-bold border-b pb-2">{t('complainant')}</h4>
                    <div>
                        <ResidentAutocomplete
                            value={formData.complainantName}
                            onChange={(value) => {
                                handleInputChange({ target: { name: 'complainantName', value } });
                            }}
                            onSelect={handleComplainantSelect}
                            onBlur={handleComplainantBlur}
                            placeholder={t('full_name')}
                            label=""
                            required={false}
                        />
                        {formErrors.complainantName && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.complainantName}</p>}
                    </div>
                    <div>
                        <input 
                            type="text" 
                            name="complainantAge" 
                            value={formData.complainantAge} 
                            onChange={handleInputChange}
                            placeholder={ageLoading.complainant ? 'Calculating age...' : 'Age (Type if missing)'} 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <input type="text" name="complainantContact" value={formData.complainantContact} placeholder="(+63) 9XX XXX XXXX" onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('complainantContact')} />
                        {formErrors.complainantContact && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.complainantContact}</p>}
                    </div>
                    <div>
                        <input type="text" name="complainantAddress" value={formData.complainantAddress} placeholder={t('address')} onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('complainantAddress')} />
                        {formErrors.complainantAddress && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.complainantAddress}</p>}
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h4 className="text-blue-600 font-bold border-b pb-2">{t('Respondent')}</h4>
                    <div>
                        <ResidentAutocomplete
                            value={formData.respondentName}
                            onChange={(value) => {
                                handleInputChange({ target: { name: 'respondentName', value } });
                            }}
                            onSelect={handleRespondentSelect}
                            onBlur={handleRespondentBlur}
                            placeholder={t('full_name')}
                            label=""
                            required={false}
                        />
                        {formErrors.respondentName && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.respondentName}</p>}
                    </div>
                    <div>
                        <input 
                            type="text" 
                            name="respondentAge" 
                            value={formData.respondentAge} 
                            onChange={handleInputChange}
                            placeholder={ageLoading.respondent ? 'Calculating age...' : 'Age (Type if missing)'} 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <input type="text" name="respondentContact" value={formData.respondentContact} placeholder="(+63) 9XX XXX XXXX" onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('respondentContact')} />
                        {formErrors.respondentContact && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.respondentContact}</p>}
                    </div>
                    <div>
                        <input type="text" name="respondentAddress" value={formData.respondentAddress} placeholder={t('address')} onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('respondentAddress')} />
                        {formErrors.respondentAddress && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.respondentAddress}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-blue-600 font-bold border-b pb-2">{t('incident_details')}</h4>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <input type="date" name="incidentDate" value={formData.incidentDate} max={today} onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('incidentDate')} />
                        {formErrors.incidentDate && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.incidentDate}</p>}
                    </div>
                    <div>
                        <input type="text" name="incidentLocation" value={formData.incidentLocation} placeholder={t('location')} onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('incidentLocation')} />
                        {formErrors.incidentLocation && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.incidentLocation}</p>}
                    </div>
                </div>
                <div>
                    <textarea name="incidentDesc" value={formData.incidentDesc} rows="4" placeholder={t('description')} onChange={handleInputChange} onBlur={handleBlur} className={getInputClass('incidentDesc')}></textarea>
                    {formErrors.incidentDesc && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{formErrors.incidentDesc}</p>}
                </div>
            </div>
            
            <div>
              <h4 className="text-blue-600 font-bold border-b pb-2 mb-4">{t('attachments_optional')}</h4>
              
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
              
              {attachedFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                      {attachedFiles.map((f, i) => (
                          <div 
                              key={i} 
                              onClick={(e) => handleViewFile(e, f)}
                              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 text-gray-700 transition-colors cursor-pointer border border-slate-200 rounded-xl shadow-sm group"
                          >
                              <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 flex-shrink-0 bg-blue-50 p-2 flex items-center justify-center rounded-lg">
                                      <FileText size={24} className="text-blue-500" />
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-gray-800 text-sm font-bold group-hover:text-blue-600 transition-colors">{f.name}</span>
                                      <span className="text-[11px] text-gray-500 font-medium mt-0.5">Type: {formatFileType(f.type, f.name)}</span>
                                  </div>
                              </div>
                              <div className="flex items-center space-x-4 pr-2">
                                  <div className="text-[11px] text-gray-500 font-bold bg-gray-100 px-2.5 py-1 rounded">
                                      Size: {formatFileSize(f.size)}
                                  </div>
                                  <button 
                                      onClick={(e) => handleRemoveFile(i, e)}
                                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                      title="Remove file"
                                  >
                                      <X size={20} strokeWidth={2.5} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <div 
                onClick={handleFileZoneClick} 
                className="border-2 border-dashed p-8 rounded-xl text-center cursor-pointer transition-all border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 bg-slate-50"
              >
                  <div className="text-gray-500 font-medium">
                      <Upload className="mx-auto mb-3 text-blue-500" size={28} /> 
                      {t('click_drag_files') || 'Click or drag files here to attach'}
                  </div>
              </div>
            </div>

          </div>
          <div className="bg-slate-50 p-8 border-t flex justify-end space-x-4"><button onClick={handleCancelNewCase} className="px-8 py-3 border font-bold rounded-lg hover:bg-white transition-colors">{t('cancel')}</button><button onClick={handleSubmitCase} className="px-10 py-3 rounded-lg font-bold bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('submit_case')}</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 relative" onClick={() => {
        setIsYearSortOpen(false);
        setIsMonthSortOpen(false);
        setIsDaySortOpen(false);
        setIsTypeSortOpen(false);
    }}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 tracking-wide uppercase">{t('cases_logs_title')}</h2>
            <p className="text-sm font-bold text-gray-700 whitespace-nowrap mt-1">{t('total_cases') || 'Total Records'}: {filteredData.length}</p>
          </div>
          <div className="flex items-center space-x-3">
            
            <div className="relative w-64 mr-2" onClick={e => e.stopPropagation()}>
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 shadow-sm text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="relative" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => { setIsYearSortOpen(!isYearSortOpen); setIsMonthSortOpen(false); setIsDaySortOpen(false); setIsTypeSortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <Calendar size={16} className="mr-2 text-gray-500" /> 
                <span className="text-xs font-bold text-gray-700 w-16 text-left">{filterYear}</span> 
                <ChevronDown size={14} className="ml-1 text-gray-400" />
              </button>
              {isYearSortOpen && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                  {yearOptions.map(y => (
                    <div key={y} onClick={() => { setFilterYear(y); setIsYearSortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer ${filterYear === y ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>{y}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => { setIsMonthSortOpen(!isMonthSortOpen); setIsYearSortOpen(false); setIsDaySortOpen(false); setIsTypeSortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <Calendar size={16} className="mr-2 text-gray-500" /> 
                <span className="text-xs font-bold text-gray-700 w-20 text-left">{filterMonth === 'All Months' ? 'All Months' : monthNames[parseInt(filterMonth)-1] || filterMonth}</span> 
                <ChevronDown size={14} className="ml-1 text-gray-400" />
              </button>
              {isMonthSortOpen && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                  {monthOptions.map((m, i) => (
                    <div key={m} onClick={() => { setFilterMonth(m); setIsMonthSortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer ${filterMonth === m ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                      {m === 'All Months' ? m : monthNames[parseInt(m)-1] || m}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🔥 ADDED: Day Dropdown Filter 🔥 */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => { setIsDaySortOpen(!isDaySortOpen); setIsYearSortOpen(false); setIsMonthSortOpen(false); setIsTypeSortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <Calendar size={16} className="mr-2 text-gray-500" /> 
                <span className="text-xs font-bold text-gray-700 w-16 text-left">{filterDay}</span> 
                <ChevronDown size={14} className="ml-1 text-gray-400" />
              </button>
              {isDaySortOpen && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                  {dayOptions.map(d => (
                    <div key={d} onClick={() => { setFilterDay(d); setIsDaySortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer ${filterDay === d ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>{d}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => { setIsTypeSortOpen(!isTypeSortOpen); setIsYearSortOpen(false); setIsMonthSortOpen(false); setIsDaySortOpen(false); }} className="flex items-center bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <Filter size={16} className="mr-2 text-gray-500" /> 
                <span className="text-xs font-bold text-gray-700 w-20 text-left">{filterType}</span> 
                <ChevronDown size={14} className="ml-1 text-gray-400" />
              </button>
              {isTypeSortOpen && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                  {typeOptions.map(tOption => (
                    <div key={tOption} onClick={() => { setFilterType(tOption); setIsTypeSortOpen(false); }} className={`px-4 py-2 text-xs cursor-pointer flex items-center ${filterType === tOption ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${tOption === 'LUPON' ? 'bg-green-500' : tOption === 'VAWC' ? 'bg-purple-500' : tOption === 'BLOTTER' ? 'bg-red-500' : tOption === 'COMPLAIN' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {tOption}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ml-2">
              <div className="relative w-8 h-9 mr-2 flex items-center justify-center">
                <div className="absolute w-6 h-7 bg-white/30 rounded-[2px] rotate-6"></div>
                <div className="absolute w-6 h-7 bg-white rounded-[2px] flex items-center justify-center shadow-sm z-10">
                  <Plus className="text-[#0066FF]" size={18} strokeWidth={4} />
                </div>
              </div>
              <span className="text-xl font-bold pt-1">{t('new_case')}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gradient-to-br from-blue-800 to-blue-500 text-white">
                <th className="py-5 px-4 font-bold">{t('report_type')}</th>
                <th className="py-5 px-4 font-bold">{t('case_no')}</th>
                <th className="py-5 px-4 font-bold">{t('complainant_name')}</th>
                <th className="py-5 px-4 font-bold">{t('contact_no')}</th>
                <th className="py-5 px-4 font-bold">{t('date_created')}</th>
                <th className="py-5 px-4 font-bold">{t('status')}</th>
                <th className="py-5 px-4 font-bold">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length > 0 ? filteredData.map((item, idx) => {
                const caseSummonsCount = allSummonsCache.filter(s => s.caseNo === item.caseNo).length;
                const isMaxSummons = caseSummonsCount >= 3;

                return (
                <tr key={idx} onClick={() => handleViewCase(item)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-5 px-4"><span className={`${getTypeStyle(item.type)} px-3 py-1 rounded text-[10px] font-bold shadow-sm uppercase tracking-wide`}>{item.type}</span></td>
                  <td className="py-5 px-4 font-semibold text-gray-700">{item.caseNo}</td>
                  <td className="py-5 px-4 text-gray-600">{item.complainantName}</td>
                  <td className="py-5 px-4 text-gray-600">{item.contact}</td>
                  <td className="py-5 px-4 text-gray-600">{item.date}</td>
                  <td className="py-5 px-4"><span className={`${getStatusStyle(item.status)} px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wide`}>{item.status}</span></td>
                  <td className="py-5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => {
                          if (!isMaxSummons) handleAssignSummonClick(item);
                        }} 
                        disabled={isMaxSummons}
                        className={`${isMaxSummons ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md active:scale-95'} text-xs font-bold px-4 py-2 rounded-lg transition-all`}
                        title={isMaxSummons ? "Maximum of 3 summons reached for this case" : ""}
                      >
                        {isMaxSummons ? 'MAX SUMMONS' : t('assign_summon')}
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : <tr><td colSpan="7" className="py-10 text-gray-400 font-bold">{searchQuery ? `No records found matching "${searchQuery}"` : t('no_records_found')}</td></tr>}
            </tbody>
          </table>
        </div>
        {filteredData.length > 0 && (<div className="flex items-center justify-center mt-8 opacity-50"><div className="h-px bg-gray-300 w-24"></div><span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t('nothing_follows')}</span><div className="h-px bg-gray-300 w-24"></div></div>)}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl relative overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full z-20 transition-colors"><X size={28} /></button>
            <div className="text-center pt-14 pb-4"><h2 className="text-5xl font-medium text-blue-800 tracking-tighter">REPORT TYPE</h2><p className="text-gray-500 mt-2 text-base font-medium">{t('select_type_report')}</p></div>
            <div className="p-14 grid grid-cols-1 md:grid-cols-4 gap-8">
              {['LUPON', 'VAWC', 'BLOTTER', 'COMPLAIN'].map((type) => (
                  <div key={type} className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                    <div className={`${getTypeStyle(type).split(' ')[0]} h-2.5 w-full`}></div>
                    <div className="p-8 flex flex-col items-center text-center flex-1">
                      <div className="w-24 h-24 mb-6"><img src={`/icon-casereport/${type.toLowerCase()}.png`} alt={type} className="w-full h-full object-contain" /></div>
                      <h3 className={`text-2xl font-medium mb-1 ${getTypeStyle(type).split(' ')[0].replace('bg-', 'text-')}`}>{type}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-10">Report Category</p>
                      <button onClick={() => handleReportTypeSelect(type)} className={`mt-auto w-full ${getTypeStyle(type).split(' ')[0]} hover:opacity-90 text-white py-3 rounded-lg text-lg font-medium shadow-md transition-colors`}>→ {t('create_report')}</button>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModeratorModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-visible shadow-2xl border border-blue-100 flex flex-col">
            <div className="bg-blue-700 p-6 text-center text-white relative rounded-t-2xl"><h3 className="text-2xl font-bold">{t('assign_moderator')}</h3></div>
            <div className="p-8 flex-1 flex flex-col justify-between">
              <div className="relative mb-8">
                <div onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }} className={`border p-4 rounded-lg flex justify-between cursor-pointer font-bold bg-white ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200'}`}>
                  <span className="text-gray-800">{selectedRole}</span><ChevronDown className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isDropdownOpen && (<div className="absolute top-full left-0 w-full bg-white border shadow-lg rounded-lg z-[120] mt-1 overflow-hidden">{roles.map((r) => (<div key={r} onClick={() => handleRoleSelect(r)} className={`p-4 cursor-pointer border-b last:border-0 font-medium hover:bg-blue-600 hover:text-white ${selectedRole === r ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}>{r}</div>))}</div>)}
              </div>
              <div className="flex space-x-3"><button onClick={handleCancelModerator} className="flex-1 border py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors">{t('cancel')}</button><button onClick={handleContinueToForm} className="flex-1 py-3 rounded-lg font-bold bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-md transition-all active:scale-95">{t('continue')}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}