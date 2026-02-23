import React, { createContext, useState, useContext } from 'react';

// --- THE COMPLETE DICTIONARY ---
const translations = {
  en: {
    // -------------------------
    // GLOBAL & NAVIGATION
    // -------------------------
    "barangay_title": "Barangay 166, Caybiga, Caloocan City",
    "nav_analytics": "Analytics",
    "nav_case_logs": "Case Logs",
    "nav_summons": "Summons",
    "nav_curfew_logs": "Curfew Logs",
    "nav_blacklisted": "Blacklisted",
    "nav_archived": "Archived",
    "cancel": "Cancel",
    "continue": "Continue",
    "confirm": "Confirm",
    "ok": "OK",
    "back": "Back",
    "view": "View",
    "remove": "Remove",
    "delete": "Delete",
    "restore": "Restore",
    "status": "Status",
    "action": "Action",
    "date": "Date",
    "time": "Time",
    "no": "No.",
    "as": "as",

    // -------------------------
    // STATUSES
    // -------------------------
    "settled": "Settled",
    "escalated": "Escalated",
    "blacklisted": "Blacklisted",
    "pending": "Pending",
    "unsettled": "Unsettled",

    // -------------------------
    // ANALYTICS PAGE
    // -------------------------
    "total_cases": "Total Cases",
    "total_blacklisted": "Total Blacklisted",
    "total_cases_trend": "Total Cases Trend",
    "cases_reported_per_month": "Cases Reported Per Month",
    "export_pdf": "Export PDF",
    "case_analytics_category": "Case Analytics by Category",
    "daily_cases_overview": "Daily Cases Overview",
    "case_resolution_overview": "Case Resolution Overview",
    "recent_activities": "Recent Activities",
    "sun": "SUN", "mon": "MON", "tue": "TUE", "wed": "WED", "thu": "THU", "fri": "FRI", "sat": "SAT",

    // -------------------------
    // CASE LOGS PAGE
    // -------------------------
    "cases_logs_title": "CASES LOGS",
    "all_years": "All Years",
    "all_status": "All Status",
    "new_case": "New Case",
    "report_type": "Report Type",
    "case_no": "Case No.",
    "complainant_name": "Complainant Name",
    "contact_no": "Contact No.",
    "date_created": "Date Created",
    "assign_summon": "Assign Summon",
    "no_records_found": "No records found.",
    "nothing_follows": "NOTHING FOLLOWS",
    "select_type_report": "Select the type of case to create a new report",
    "create_report": "Create Report",
    "assign_moderator": "ASSIGN MODERATOR",
    "case_report_overview": "Case Report Overview",
    "date_filed": "Date Filed",
    "complainant": "Complainant",
    "defendant": "Defendant",
    "full_name": "Full Name",
    "contact_num_placeholder": "Contact # (11 digits)",
    "address": "Address",
    "incident_details": "Incident Details",
    "location": "Location",
    "description": "Description",
    "attachments_optional": "Attachments (Optional)",
    "click_drag_files": "Click or Drag files to attach",
    "submit_case": "Submit Case",
    "print_details": "Print Details",
    "back_to_list": "Back to List",
    "assign_summons": "ASSIGN SUMMONS",
    "summon_schedule_subtitle": "Set the summon schedule and case details",
    "resident_name": "Resident Name",
    "summon_date": "Summon Date",
    "summon_time": "Summon Time",
    "select_summons_no": "Select Summons No.",
    "select_option": "Select option...",
    "first_summon": "1st Summon",
    "second_summon": "2nd Summon",
    "third_summon": "3rd Summon",
    "issued": "(Issued)",
    "summon_reason": "Summon Reason",
    "detailed_description": "Detailed description of what happened...",
    "noted_by": "Noted By",
    "auth_officer_name": "Authorized Officer Name",
    "submit_summon": "Submit Summon",

    // -------------------------
    // SUMMONS PAGE
    // -------------------------
    "list_of_summons": "List of summons",
    "date_assigned": "Date Assigned",
    "view_status": "View Status",
    "escalate": "Escalate",
    "no_summons_found": "No summons records found.",
    "go_to_case_logs": "Go to Case Logs to assign a summon.",
    "summons_hearing": "SUMMONS / HEARING",
    "summons_folder": "SUMMONS FOLDER",
    "no_summons_in_folder": "No summons found in this folder.",
    "summon_overview": "SUMMON OVERVIEW",
    "case_folders": "CASE FOLDERS",
    "add_case_notes": "Add Case Notes",
    "case_note": "CASE NOTE",
    "back_to_summons": "Back to Summons",
    "case_overview_title": "CASE OVERVIEW",
    "case_overview_subtitle": "Official summary of the conducted summon session",
    "edit_case_overview": "Edit Case Overview",
    "confirm_status_update": "Confirm Status Update",
    "are_you_sure_mark": "Are you sure you want to mark case",
    "moved_to_archive": "This case will be moved to the Archive.",
    "case_preview": "Case Preview",
    "current_status": "Current Status",
    "save_changes": "Save Changes",
    "edit_status": "Edit Status",

    // -------------------------
    // CURFEW LOGS PAGE
    // -------------------------
    "curfew_violations": "Curfew Violations",
    "add_violation": "Add Violation",
    "age": "Age",
    "mark_settled": "Mark Settled",
    "mark_unsettled": "Mark Unsettled",
    "new_curfew": "NEW CURFEW",
    "input_age": "Input Age",
    "input_full_address": "Input full address",
    "create": "Create",
    "records": "Records",
    "curfew_no": "CURFEW NO. :",
    "resident_name_caps": "RESIDENT NAME :",
    "curfew_folders": "CURFEW FOLDERS",
    "actions": "ACTIONS",
    "curfew_folder_prefix": "CURFEW",
    "add_curfew_notes_title": "ADD CURFEW NOTES",
    "notes": "Notes",
    "enter_curfew_notes": "Enter curfew notes...",
    "add_notes": "Add Notes",
    "delete_folder_title": "Delete Curfew Note?",
    "delete_folder_text": "Are you sure you want to delete this note?",
    "yes_delete": "Yes, delete",
    "note_deleted": "Note deleted!",
    "view_note": "View Note",
    "no_folders": "No folders found for this resident.",
    "curfew_notes_added": "Curfew notes added successfully!",

    // -------------------------
    // BLACKLISTED PAGE
    // -------------------------
    "blacklisted_case_details": "Blacklisted Resident - Case Details",
    "resident_id": "Resident ID",
    "resident": "Resident",
    "resident_info": "Resident Information",
    "household_no": "Household No.",
    "contact_number": "Contact Number",
    "blacklist_info": "Blacklist Information",
    "case_number": "Case Number",
    "case_type": "Case Type",
    "date_blacklisted": "Date Blacklisted",
    "moderator": "Moderator",
    "reason": "Reason",
    "default_reason_desc": "Resident repeatedly failed to attend summons hearings and violated settlement agreement multiple times.",
    "case_timeline": "Case Timeline",
    "back_to_blacklist": "Back to Blacklist Records",
    "blacklisted_case_records": "BLACKLISTED CASE RECORDS",
    "blacklisted_subtitle": "Residents restricted due to repeated violations and escalated cases.",
    "search_resident": "Search resident...",
    "add_blacklisted": "Add Blacklisted",
    "no_blacklisted_found": "No blacklisted records found.",
    "blacklist_entry": "Blacklist Entry",
    "detailed_reason": "Detailed reason...",
    "add_record": "Add Record",
    "summon_issued": "Summon Issued",
    "failed_to_appear": "Failed to Appear",
    "blacklisted_approved": "Blacklisted Approved",
    "swal_resident_blacklisted": "Resident Blacklisted",
    "swal_added": "added.",
    "swal_lift_restriction": "Lift Blacklist Restriction?",
    "swal_move_archives": "Move {name} to Archives (Settled)?",
    "swal_yes_lift": "Yes, Lift & Archive",
    "swal_restriction_lifted": "Restriction Lifted",
    "swal_record_moved": "Record moved to Archives.",

    // -------------------------
    // ARCHIVED PAGE
    // -------------------------
    "swal_restore_title": "Restore Case?",
    "swal_restore_text": "Case {caseNo} will be moved back to Active Logs (Pending).",
    "swal_yes_restore": "Yes, Restore it!",
    "swal_restored": "Restored!",
    "swal_restored_text": "The case has been moved to Active Logs.",
    "swal_delete_title": "Delete Permanently?",
    "swal_delete_text": "This record will be gone forever.",
    "swal_yes_delete": "Yes, delete it!",
    "swal_deleted": "Deleted!",
    "swal_deleted_text": "The record has been permanently removed.",
    "archived_case_details": "Archived Case Details",
    "case_summary": "Case Summary",
    "archived_badge": "ARCHIVED",
    "date_closed": "Date Closed",
    "archived_date": "Archived Date",
    "case_details_title": "Case Details",
    "defendants": "Defendants",
    "incident_date": "Incident Date",
    "archived_mock_desc": "The complainant reported repeated disturbance and violation of barangay mediation agreement. Multiple summons were issued but respondent failed to comply.",
    "resolution_summary": "Resolution Summary",
    "settlement_status": "Settlement Status",
    "archived_mock_resolution": "Case escalated to higher authority after unsuccessful mediation process.",
    "attached_documents": "Attached Documents",
    "download": "Download",
    "archived_information": "Archived Information",
    "archived_by": "Archived By",
    "barangay_admin": "Barangay Administrator",
    "reason_for_archiving": "Reason for Archiving",
    "archived_mock_reason": "Case completed and inactive for 30 days.",
    "back_to_archived": "Back to Archived",
    "archived_cases": "Archived Cases",
    "archived_subtitle": "Manage settled cases. Restore or permanently delete records.",
    "total_settled": "Total Settled",
    "search_placeholder": "Search...",
    "no_settled_cases": "No settled cases found."
  },
  
  tl: {
    // -------------------------
    // GLOBAL & NAVIGATION
    // -------------------------
    "barangay_title": "Barangay 166, Caybiga, Lungsod ng Caloocan",
    "nav_analytics": "Pagsusuri",
    "nav_case_logs": "Talaan ng Kaso",
    "nav_summons": "Pagpapatawag",
    "nav_curfew_logs": "Talaan ng Curfew",
    "nav_blacklisted": "Na-blacklist",
    "nav_archived": "Naka-archive",
    "cancel": "Kanselahin",
    "continue": "Magpatuloy",
    "confirm": "Kumpirmahin",
    "ok": "Sige",
    "back": "Bumalik",
    "view": "Tingnan",
    "remove": "Alisin",
    "delete": "Burahin",
    "restore": "I-restore",
    "status": "Katayuan",
    "action": "Aksyon",
    "date": "Petsa",
    "time": "Oras",
    "no": "Num.",
    "as": "bilang",

    // -------------------------
    // STATUSES
    // -------------------------
    "settled": "Naayos",
    "escalated": "Itinaas",
    "blacklisted": "Na-blacklist",
    "pending": "Nakabinbin",
    "unsettled": "Hindi Naayos",

    // -------------------------
    // ANALYTICS PAGE
    // -------------------------
    "total_cases": "Kabuuang Kaso",
    "total_blacklisted": "Kabuuang Na-blacklist",
    "total_cases_trend": "Trend ng Kabuuang Kaso",
    "cases_reported_per_month": "Mga Kasong Naiulat Kada Buwan",
    "export_pdf": "I-export sa PDF",
    "case_analytics_category": "Pagsusuri ng Kaso ayon sa Kategorya",
    "daily_cases_overview": "Pang-araw-araw na Kaso",
    "case_resolution_overview": "Pangkalahatang-ideya ng Resolusyon",
    "recent_activities": "Mga Kamakailang Aktibidad",
    "sun": "LIN", "mon": "LUN", "tue": "MAR", "wed": "MIY", "thu": "HUW", "fri": "BIY", "sat": "SAB",

    // -------------------------
    // CASE LOGS PAGE
    // -------------------------
    "cases_logs_title": "TALAAN NG MGA KASO",
    "all_years": "Lahat ng Taon",
    "all_status": "Lahat ng Katayuan",
    "new_case": "Bagong Kaso",
    "report_type": "Uri ng Ulat",
    "case_no": "Numero ng Kaso",
    "complainant_name": "Pangalan ng Nagrereklamo",
    "contact_no": "Numero ng Telepono",
    "date_created": "Petsa ng Paggawa",
    "assign_summon": "Magtalaga ng Pagpapatawag",
    "no_records_found": "Walang natagpuang rekord.",
    "nothing_follows": "WALANG KASUNOD",
    "select_type_report": "Piliin ang uri ng kaso upang gumawa ng bagong ulat",
    "create_report": "Gumawa ng Ulat",
    "assign_moderator": "MAGTALAGA NG TAGAPAMAGITAN",
    "case_report_overview": "Pangkalahatang-ideya ng Kaso",
    "date_filed": "Petsa ng Pagkakahain",
    "complainant": "Nagrereklamo",
    "defendant": "Inirereklamo",
    "full_name": "Buong Pangalan",
    "contact_num_placeholder": "Numero # (11 numero)",
    "address": "Address",
    "incident_details": "Detalye ng Insidente",
    "location": "Lokasyon",
    "description": "Paglalarawan",
    "attachments_optional": "Mga Kalakip (Opsiyonal)",
    "click_drag_files": "I-click o I-drag ang mga file dito",
    "submit_case": "Isumite ang Kaso",
    "print_details": "I-print ang mga Detalye",
    "back_to_list": "Bumalik sa Listahan",
    "assign_summons": "MAGTALAGA NG PAGPAPATAWAG",
    "summon_schedule_subtitle": "Itakda ang iskedyul at detalye ng kaso",
    "resident_name": "Pangalan ng Residente",
    "summon_date": "Petsa ng Pagpapatawag",
    "summon_time": "Oras ng Pagpapatawag",
    "select_summons_no": "Piliin ang Bilang ng Pagpapatawag",
    "select_option": "Pumili ng opsyon...",
    "first_summon": "Unang Pagpapatawag",
    "second_summon": "Ikalawang Pagpapatawag",
    "third_summon": "Ikatlong Pagpapatawag",
    "issued": "(Inisyu)",
    "summon_reason": "Dahilan ng Pagpapatawag",
    "detailed_description": "Detalyadong paglalarawan ng nangyari...",
    "noted_by": "Naitala ni",
    "auth_officer_name": "Pangalan ng Awtorisadong Opisyal",
    "submit_summon": "Isumite",

    // -------------------------
    // SUMMONS PAGE
    // -------------------------
    "list_of_summons": "Listahan ng mga pagpapatawag",
    "date_assigned": "Petsang Itinalaga",
    "view_status": "Tingnan ang Katayuan",
    "escalate": "Itaas",
    "no_summons_found": "Walang natagpuang rekord ng pagpapatawag.",
    "go_to_case_logs": "Pumunta sa Talaan ng Kaso upang magtalaga.",
    "summons_hearing": "PAGPAPATAWAG / PAGDINIG",
    "summons_folder": "FOLDER NG PAGPAPATAWAG",
    "no_summons_in_folder": "Walang natagpuang pagpapatawag sa folder na ito.",
    "summon_overview": "PANGKALAHATANG-IDEYA NG PAGPAPATAWAG",
    "case_folders": "MGA FOLDER NG KASO",
    "add_case_notes": "Magdagdag ng Tala",
    "case_note": "TALA NG KASO",
    "back_to_summons": "Bumalik sa Pagpapatawag",
    "case_overview_title": "PANGKALAHATANG-IDEYA NG KASO",
    "case_overview_subtitle": "Opisyal na buod ng isinagawang sesyon",
    "edit_case_overview": "I-edit ang Pangkalahatang-ideya",
    "confirm_status_update": "Kumpirmahin ang Pagbabago ng Katayuan",
    "are_you_sure_mark": "Sigurado ka bang nais mong markahan ang kasong",
    "moved_to_archive": "Ang kasong ito ay ililipat sa Archive.",
    "case_preview": "Preview ng Kaso",
    "current_status": "Kasalukuyang Katayuan",
    "save_changes": "I-save ang mga Pagbabago",
    "edit_status": "I-edit ang Katayuan",

    // -------------------------
    // CURFEW LOGS PAGE
    // -------------------------
    "curfew_violations": "Mga Paglabag sa Curfew",
    "add_violation": "Magdagdag ng Paglabag",
    "age": "Edad",
    "mark_settled": "Markahang Naayos",
    "mark_unsettled": "Markahang Hindi Naayos",
    "new_curfew": "BAGONG CURFEW",
    "input_age": "Ilagay ang Edad",
    "input_full_address": "Ilagay ang buong address",
    "create": "Lumikha",
    "records": "Mga Rekord",
    "curfew_no": "NUMERO NG CURFEW :",
    "resident_name_caps": "PANGALAN NG RESIDENTE :",
    "curfew_folders": "MGA FOLDER NG CURFEW",
    "actions": "MGA AKSYON",
    "curfew_folder_prefix": "CURFEW",
    "add_curfew_notes_title": "MAGDAGDAG NG TALA NG CURFEW",
    "notes": "Mga Tala",
    "enter_curfew_notes": "Ilagay ang mga tala...",
    "add_notes": "Idagdag ang Tala",
    "delete_folder_title": "Burahin ang Tala?",
    "delete_folder_text": "Sigurado ka bang nais mong burahin ang tala na ito?",
    "yes_delete": "Oo, burahin",
    "note_deleted": "Nabura na ang tala!",
    "view_note": "Tingnan ang Tala",
    "no_folders": "Walang natagpuang folder para sa residenteng ito.",
    "curfew_notes_added": "Matagumpay na naidagdag ang tala ng curfew!",
    // Add to the 'en' section:
    "curfew_overview_title": "CURFEW {num} OVERVIEW",
    "curfew_overview_subtitle": "Official summary of the conducted curfew session",
    "type_overview_here": "Type overview here...",
    "save": "Save",
    "back_to_curfew_folders": "Back to Curfew Folders",
    "back_to_curfew_logs": "Back to Curfew Logs",
    "case_overview_saved": "Case overview saved successfully!",
    "curfew_overview_label": "CURFEW OVERVIEW",

// Add to the 'tl' section:
    "curfew_overview_title": "PANGKALAHATANG-IDEYA NG CURFEW {num}",
    "curfew_overview_subtitle": "Opisyal na buod ng isinagawang sesyon ng curfew",
    "type_overview_here": "I-type ang pangkalahatang-ideya dito...",
    "save": "I-save",
    "back_to_curfew_folders": "Bumalik sa Mga Folder ng Curfew",
    "back_to_curfew_logs": "Bumalik sa Talaan ng Curfew",
    "case_overview_saved": "Matagumpay na na-save ang pangkalahatang-ideya!",
    "curfew_overview_label": "PANGKALAHATANG-IDEYA NG CURFEW",
    // Add to the 'en' section:
    "incomplete_fields": "Incomplete Fields",
    "fill_all_required": "Please fill out all required fields.",
    "discard_changes": "Discard Changes?",
    "unsaved_lost": "Any unsaved changes will be lost.",
    "yes_discard": "Yes, discard",
    "no_keep": "No, keep editing",

// Add to the 'tl' section:
    "incomplete_fields": "Hindi Kumpletong Impormasyon",
    "fill_all_required": "Pakipunuan ang lahat ng impormasyon.",
    "discard_changes": "Kanselahin ang mga Pagbabago?",
    "unsaved_lost": "Mawawala ang anumang hindi na-save na pagbabago.",
    "yes_discard": "Oo, kanselahin",
    "no_keep": "Hindi, ituloy ang pag-edit",
    // Add to the 'en' section:
    "confirm_save_title": "Save Changes?",
    "confirm_save_text": "Are you sure you want to save this record?",
    "yes_save": "Yes, save it!",

// Add to the 'tl' section:
    "confirm_save_title": "I-save ang mga Pagbabago?",
    "confirm_save_text": "Sigurado ka bang nais mong i-save ang rekord na ito?",
    "yes_save": "Oo, i-save!",

    // -------------------------
    // BLACKLISTED PAGE
    // -------------------------
    "blacklisted_case_details": "Na-blacklist na Residente - Detalye ng Kaso",
    "resident_id": "Resident ID",
    "resident": "Residente",
    "resident_info": "Impormasyon ng Residente",
    "household_no": "Numero ng Kabahayan",
    "contact_number": "Numero ng Telepono",
    "blacklist_info": "Impormasyon ng Blacklist",
    "case_number": "Numero ng Kaso",
    "case_type": "Uri ng Kaso",
    "date_blacklisted": "Petsa kung kailan na-blacklist",
    "moderator": "Tagapamagitan",
    "reason": "Dahilan",
    "default_reason_desc": "Paulit-ulit na hindi pagdalo ng residente sa mga pagdinig at paglabag sa kasunduan.",
    "case_timeline": "Timeline ng Kaso",
    "back_to_blacklist": "Bumalik sa mga Rekord ng Blacklist",
    "blacklisted_case_records": "MGA REKORD NG NA-BLACKLIST NA KASO",
    "blacklisted_subtitle": "Mga residenteng pinaghigpitan dahil sa paulit-ulit na paglabag at lumalang mga kaso.",
    "search_resident": "Hanapin ang residente...",
    "add_blacklisted": "Magdagdag ng Blacklist",
    "no_blacklisted_found": "Walang natagpuang rekord ng na-blacklist.",
    "blacklist_entry": "Entry ng Blacklist",
    "detailed_reason": "Detalyadong dahilan...",
    "add_record": "Magdagdag ng Rekord",
    "summon_issued": "Naglabas ng Pagpapatawag",
    "failed_to_appear": "Hindi Dumalo",
    "blacklisted_approved": "Naaprubahan ang Blacklist",
    "swal_resident_blacklisted": "Na-blacklist ang Residente",
    "swal_added": "naidagdag.",
    "swal_lift_restriction": "Alisin sa Blacklist?",
    "swal_move_archives": "Ilipat si {name} sa Archives (Naayos)?",
    "swal_yes_lift": "Oo, Alisin at I-archive",
    "swal_restriction_lifted": "Inalis ang Paghihigpit",
    "swal_record_moved": "Inilipat ang rekord sa Archives.",

    // -------------------------
    // ARCHIVED PAGE
    // -------------------------
    "swal_restore_title": "I-restore ang Kaso?",
    "swal_restore_text": "Ang kasong {caseNo} ay ibabalik sa Active Logs (Nakabinbin).",
    "swal_yes_restore": "Oo, I-restore!",
    "swal_restored": "Na-restore!",
    "swal_restored_text": "Ang kaso ay nailipat na sa Active Logs.",
    "swal_delete_title": "Burahin nang Permanente?",
    "swal_delete_text": "Ang rekord na ito ay mawawala nang tuluyan.",
    "swal_yes_delete": "Oo, burahin!",
    "swal_deleted": "Nabura!",
    "swal_deleted_text": "Ang rekord ay permanenteng tinanggal.",
    "archived_case_details": "Mga Detalye ng Naka-archive na Kaso",
    "case_summary": "Buod ng Kaso",
    "archived_badge": "NAKA-ARCHIVE",
    "date_closed": "Petsa ng Pagsasara",
    "archived_date": "Petsa ng Pag-archive",
    "case_details_title": "Mga Detalye ng Kaso",
    "defendants": "Mga Inirereklamo",
    "incident_date": "Petsa ng Insidente",
    "archived_mock_desc": "Inireport ng nagrereklamo ang paulit-ulit na panggugulo at paglabag sa kasunduan sa barangay. Ilang beses nagpadala ng pagpapatawag ngunit hindi sumunod ang inirereklamo.",
    "resolution_summary": "Buod ng Resolusyon",
    "settlement_status": "Katayuan ng Pag-aayos",
    "archived_mock_resolution": "Itinaas ang kaso sa nakatataas na awtoridad matapos ang hindi matagumpay na proseso ng pamamagitan.",
    "attached_documents": "Mga Nakalakip na Dokumento",
    "download": "I-download",
    "archived_information": "Impormasyon ng Pag-archive",
    "archived_by": "In-archive ni",
    "barangay_admin": "Administrator ng Barangay",
    "reason_for_archiving": "Dahilan ng Pag-archive",
    "archived_mock_reason": "Nakumpleto ang kaso at hindi aktibo sa loob ng 30 araw.",
    "back_to_archived": "Bumalik sa Naka-archive",
    "archived_cases": "Mga Naka-archive na Kaso",
    "archived_subtitle": "Pamahalaan ang mga naayos na kaso. I-restore o permanenteng burahin ang mga rekord.",
    "total_settled": "Kabuuang Naayos",
    "search_placeholder": "Maghanap...",
    "no_settled_cases": "Walang natagpuang naayos na kaso."
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // SMART TRANSLATION FUNCTION
  const t = (key) => {
    // 1. If translation exists, return it.
    if (translations[language][key]) {
        return translations[language][key];
    }
    
    // 2. FALLBACK AUTO-FORMATTER: 
    // If you forget a key (e.g., "resident_name"), this turns it into "Resident Name" automatically 
    // instead of showing ugly code text in the UI.
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);