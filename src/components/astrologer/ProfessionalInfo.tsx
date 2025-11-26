// components/astrologer/ProfessionalInfo.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Check, ChevronDown } from 'lucide-react';

interface Language {
  _id: string;
  languageName: string;
}

interface ProfessionalInfoProps {
  astrologerId: string;
  initialData: any;
  onUpdate: () => void;
}

export default function ProfessionalInfo({ astrologerId, initialData, onUpdate }: ProfessionalInfoProps) {
  const [form, setForm] = useState({
    experience: initialData?.experience || '',
    about: initialData?.about || '',
    short_bio: initialData?.short_bio || '',
    long_bio: initialData?.long_bio || '',
    tagLine: initialData?.tagLine || '',
    languages: [] as string[],
    youtubeLink: initialData?.youtubeLink || '',
    workingOnOtherApps: initialData?.workingOnOtherApps === 'Yes' || initialData?.workingOnOtherApps === true,
  });

  const [originalForm, setOriginalForm] = useState(form);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLanguages = async () => {
    setLoadingLanguages(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/get_language`);
      const data = await response.json();
      
      if (data.success) {
        const languages = data.languageData || [];
        setAllLanguages(languages);
        
        const languageNames = initialData?.language || [];
        
        const initialLanguageIds = languages
          .filter((lang: Language) => languageNames.includes(lang.languageName))
          .map((lang: Language) => lang._id);
        
        setForm(prev => ({
          ...prev,
          languages: initialLanguageIds
        }));
        setOriginalForm(prev => ({
          ...prev,
          languages: initialLanguageIds
        }));
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast.error('Failed to load languages');
    } finally {
      setLoadingLanguages(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleLanguage = (langId: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter((id: any) => id !== langId)
        : [...prev.languages, langId]
    }));
    setErrors(prev => ({ ...prev, languages: '' }));
  };

  const getSelectedLanguageNames = () => {
    return allLanguages
      .filter(lang => form.languages.includes(lang._id))
      .map(lang => lang.languageName)
      .join(', ');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.experience || Number(form.experience) < 0) {
      newErrors.experience = 'Valid experience required';
    }
    if (!form.about || form.about.length < 10) {
      newErrors.about = 'About must be at least 10 characters';
    }
    if (form.languages.length === 0) {
      newErrors.languages = 'Select at least one language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getChangedFields = () => {
    const changed: Record<string, any> = {};
    Object.keys(form).forEach(key => {
      const currentValue = form[key as keyof typeof form];
      const originalValue = originalForm[key as keyof typeof originalForm];
      
      if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
        changed[key] = currentValue;
      }
    });
    return changed;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const changedFields = getChangedFields();
    if (Object.keys(changedFields).length === 0) {
      toast.info('No changes to update');
      return;
    }

    setSubmitting(true);

    try {
      const languageNames = allLanguages
        .filter(lang => form.languages.includes(lang._id))
        .map(lang => lang.languageName);

      const payload = {
        astrologerId,
        astrologerName: initialData?.astrologerName || '',
        displayName: initialData?.displayName || '',
        title: initialData?.title || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        alternateNumber: initialData?.alternateNumber || '',
        country_phone_code: initialData?.country_phone_code || '91',
        gender: initialData?.gender || '',
        dateOfBirth: initialData?.dateOfBirth || '',
        address: initialData?.address || '',
        country: initialData?.country || 'India',
        state: initialData?.state || '',
        city: initialData?.city || '',
        zipCode: initialData?.zipCode || '',
        password: initialData?.password || '',
        confirm_password: initialData?.confirm_password || initialData?.password || '',
        
        experience: form.experience,
        about: form.about,
        short_bio: form.short_bio,
        long_bio: form.long_bio,
        youtubeLink: form.youtubeLink,
        tagLine: form.tagLine,
        language: languageNames,
        workingOnOtherApps: form.workingOnOtherApps ? 'Yes' : 'No',
        
        skill: initialData?.skill?.map((s: any) => s._id) || [],
        mainExpertise: initialData?.mainExpertise?.map((e: any) => e._id) || [],
        remedies: initialData?.remedies?.map((r: any) => r._id) || [],
        expertise: initialData?.expertise || [],
        preferredDays: initialData?.preferredDays || [],
        
        account_holder_name: initialData?.account_holder_name || '',
        account_number: initialData?.account_number || '',
        account_type: initialData?.account_type || '',
        IFSC_code: initialData?.IFSC_code || '',
        account_name: initialData?.account_name || '',
        panCard: initialData?.panCard || '',
        aadharNumber: initialData?.aadharNumber || '',
        
        free_min: initialData?.free_min || 0,
        consultation: initialData?.consultation || '1000',
        chat_price: initialData?.chat_price || null,
        call_price: initialData?.call_price || null,
        video_call_price: initialData?.video_call_price || 0,
        normal_video_call_price: initialData?.normal_video_call_price || 0,
        
        consultation_commission: initialData?.consultation_commission || 0,
        commission_call_price: initialData?.commission_call_price || '0',
        commission_chat_price: initialData?.commission_chat_price || '0',
        commission_video_call_price: initialData?.commission_video_call_price || 0,
        commission_normal_video_call_price: initialData?.commission_normal_video_call_price || 0,
        consultation_call_price: initialData?.consultation_call_price || null,
        consultation_chat_price: initialData?.consultation_chat_price || null,
        consultation_videocall_price: initialData?.consultation_videocall_price || null,
        consultation_commission_call: initialData?.consultation_commission_call || null,
        consultation_commission_chat: initialData?.consultation_commission_chat || null,
        consultation_commission_videocall: initialData?.consultation_commission_videocall || null,
        gift_commission: initialData?.gift_commission || 0,
        
        follower_count: initialData?.follower_count || 0,
        totalCallDuration: initialData?.totalCallDuration || 0,
        totalChatDuration: initialData?.totalChatDuration || 0,
        totalVideoCallDuration: initialData?.totalVideoCallDuration || 0,
        currency: initialData?.currency || 'INR',
        
        isDealInReport: initialData?.isDealInReport || false,
        reportTypes: initialData?.reportTypes || [],
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/update-astrologer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Professional info updated successfully');
        setOriginalForm(form);
        onUpdate();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional Information</h3>
      </div>

      {/* Compact Top Section - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Experience - Smaller (2 cols) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience (Years) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="experience"
            value={form.experience}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.experience ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.experience && (
            <p className="text-red-600 text-sm mt-1">{errors.experience}</p>
          )}
        </div>

        {/* YouTube Link (3 cols) */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Link
          </label>
          <input
            type="url"
            name="youtubeLink"
            value={form.youtubeLink}
            onChange={handleChange}
            placeholder="https://youtube.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Languages (4 cols) */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-left flex items-center justify-between ${
                errors.languages ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <span className={`text-sm truncate ${form.languages.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                {form.languages.length === 0 
                  ? 'Select languages...' 
                  : getSelectedLanguageNames()}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {loadingLanguages ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-red-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="p-2">
                    {allLanguages.map(lang => {
                      const isSelected = form.languages.includes(lang._id);
                      return (
                        <label
                          key={lang._id}
                          className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-50 ${
                            isSelected ? 'bg-red-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLanguage(lang._id)}
                            className="w-4 h-4 text-red-600 focus:ring-red-500 rounded"
                          />
                          <span className={`text-sm ${isSelected ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                            {lang.languageName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.languages && (
            <p className="text-red-600 text-sm mt-1">{errors.languages}</p>
          )}
        </div>

        {/* Working on Other Apps Checkbox (3 cols) */}
        <div className="md:col-span-3 flex items-end pb-[1px]">
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 h-[42px] w-full">
            <input
              type="checkbox"
              name="workingOnOtherApps"
              checked={form.workingOnOtherApps}
              onChange={handleChange}
              className="w-4 h-4 text-red-600 focus:ring-red-500 rounded flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-900">
              Working on Other Apps
            </span>
          </label>
        </div>
      </div>

      {/* Tag Line */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tag Line
        </label>
        <input
          type="text"
          name="tagLine"
          value={form.tagLine}
          onChange={handleChange}
          placeholder="A catchy phrase or motto"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Text Areas */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            About <span className="text-red-500">*</span>
          </label>
          <textarea
            name="about"
            value={form.about}
            onChange={handleChange}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.about ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.about && <p className="text-red-600 text-sm mt-1">{errors.about}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Bio
          </label>
          <textarea
            name="short_bio"
            value={form.short_bio}
            onChange={handleChange}
            rows={2}
            placeholder="Brief introduction (100-150 characters)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Long Bio
          </label>
          <textarea
            name="long_bio"
            value={form.long_bio}
            onChange={handleChange}
            rows={4}
            placeholder="Detailed description"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Update Professional Info
            </>
          )}
        </button>
      </div>
    </div>
  );
}
