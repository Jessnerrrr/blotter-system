import React from 'react';
import { Globe, Image as ImageIcon, Upload, RotateCcw, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from './LanguageContext';
import { useLogo } from './LogoContext'; 

export default function Settings() {
  const { t, language, setLanguage } = useLanguage(); // Make sure to get 't' from useLanguage
  const { logoUrl, setLogoUrl } = useLogo(); 

  // Handle uploading a new image WITH SweetAlert
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Use translations for Swal
      const result = await Swal.fire({
        title: t('change_logo_title') || 'Change System Logo?',
        text: t('change_logo_text') || "Are you sure you want to apply this new logo?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t('yes_change') || 'Yes, change it!',
        cancelButtonText: t('cancel')
      });
      
      if (result.isConfirmed) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoUrl(reader.result); 
          Swal.fire({
            title: t('updated') || 'Updated!',
            text: t('logo_applied') || 'Your new logo has been applied.',
            icon: 'success',
            confirmButtonColor: '#2563eb'
          });
        };
        reader.readAsDataURL(file);
      } else {
        e.target.value = null;
      }
    }
  };
  // Reset to default WITH SweetAlert
  const resetLogo = async () => {
    const result = await Swal.fire({
      title: t('restore_logo_title') || 'Restore Default Logo?',
      text: t('restore_logo_text') || "This will remove your custom logo and bring back the original.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('yes_restore') || 'Yes, restore it!',
      cancelButtonText: t('cancel')  // ← ADD THIS LINE
    });

    if (result.isConfirmed) {
      setLogoUrl('/logo.png');
      Swal.fire({
        title: t('restored') || 'Restored!',
        text: t('default_logo_back') || 'The default logo is back.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl">
        
        {/* Header with translations */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-gray-900">{t('settings_title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('settings_subtitle')}</p>
        </div>

        {/* System Language Section with translations */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-1">
            <Globe className="w-5 h-5 text-gray-800" />
            <h3 className="text-base font-bold text-gray-900">{t('system_language')}</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">{t('system_language_desc')}</p>
          
          <div className="flex space-x-4 max-w-2xl">
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg border text-sm font-bold transition-all
                ${language === 'en' ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <span>{t('english')}</span>
              {language === 'en' && <CheckCircle2 className="w-4 h-4" />}
            </button>
            
            <button 
              onClick={() => setLanguage('tl')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg border text-sm font-bold transition-all
                ${language === 'tl' ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <span>{t('tagalog')}</span>
              {language === 'tl' && <CheckCircle2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-gray-100 mb-8 max-w-2xl"></div>

        {/* System Logo Section with translations */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <ImageIcon className="w-5 h-5 text-gray-800" />
            <h3 className="text-base font-bold text-gray-900">{t('system_logo')}</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">{t('system_logo_desc')}</p>

          <div className="flex items-start space-x-6">
            {/* Logo Box */}
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 p-2 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
              <img src={logoUrl} alt="System Logo" className="w-full h-full object-contain" />
            </div>

            {/* Upload & Reset Buttons with translations */}
            <div className="flex flex-col space-y-3 pt-2">
              <label className="flex items-center justify-center space-x-2 bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{t('upload_custom_logo')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              
              <button onClick={resetLogo} className="flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                <RotateCcw className="w-4 h-4" />
                <span>{t('restore_default_logo')}</span>
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}