/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete } from '@react-google-maps/api';
import { z } from 'zod';
import { ArrowRight, Edit2 } from 'lucide-react';
import OtpInput from 'react-otp-input';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface CustomerApiResponse {
  success: boolean;
  message: string;
  customer: {
    customerName: string;
    email: string | null;
    dateOfBirth: string;
    timeOfBirth: string;
    birthPlace?: string;
    longitude ?: string;
    latitude ?: string;
    gender?: string;
    phoneNumber: string;
    countryCode?: string;
  };
}

interface FormFieldConfig {
  fieldName: keyof ConsultationFormData;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'time' | 'autocomplete' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  disabled?: boolean;
  show?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface FormConfiguration {
  fields: FormFieldConfig[];
  showDateOfBirth: boolean;
  showTimeOfBirth: boolean;
  showPlaceOfBirth: boolean;
  showConsultationTopic: boolean;
  customFields?: FormFieldConfig[];
}

type ConsultationFormData = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  consultationTopic?: string;
  dontKnowDOB?: boolean;
  dontKnowTOB?: boolean;
  countryCode?: string;
};

type LoginMode = 'phone' | 'email';

interface PhoneInputDetail {
  phone_number: string;
  country_code_length: number;
  country_code: string;
}

interface CountryData {
  dialCode: string;
  countryCode: string;
}

// Dynamic schema
const createDynamicSchema = (config: FormConfiguration): z.ZodType<ConsultationFormData> => {
  const schemaFields: any = {
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email format"),
    mobileNumber: z.string()
    .regex(
      /^(\+?\d{1,4}[\s-]?)?0?\d{10}$/,
      "Please enter a valid mobile number"
    )
    .refine(
      (val) => {
        const digitsOnly = val.replace(/\D/g, '');          
        if (val.startsWith('+')) {
          // +91 followed by 10 digits = 13 total digits
          // +1 followed by 10 digits = 11 total digits
          return digitsOnly.length >= 11 && digitsOnly.length <= 15;
        }
        return digitsOnly.length === 10 || digitsOnly.length === 11;
      },
      { message: "Mobile number must be 10-11 digits, or include valid country code" }
    ),
    placeOfBirth: z.string().min(1, "Place of birth is required"),
    gender: z.string().min(1, "Gender is required"),
    consultationTopic: z.string().optional(),
    dateOfBirth: z.string().optional(),
    timeOfBirth: z.string().optional(),
    dontKnowDOB: z.boolean().optional(),
    dontKnowTOB: z.boolean().optional(),
    countryCode: z.string().optional(),
  };

  return z.object(schemaFields) as z.ZodType<any>;
};

const defaultFormConfig: FormConfiguration = {
  fields: [
    { fieldName: 'fullName', label: 'Full Name', type: 'text', required: true, show: true, placeholder: 'Enter full name' },
    { fieldName: 'email', label: 'Email', type: 'email', required: true, show: true, placeholder: 'Enter email' },
    { fieldName: 'mobileNumber', label: 'Mobile', type: 'tel', required: true, show: true, placeholder: 'Enter mobile number', validation: { min: 10 } },
    { fieldName: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false, show: true },
    { fieldName: 'timeOfBirth', label: 'Time of Birth', type: 'time', required: false, show: true },
    { fieldName: 'gender', label: 'Gender', type: 'select', required: true, show: true },   
    { fieldName: 'placeOfBirth', label: 'Place of Birth', type: 'autocomplete', required: true, show: true, placeholder: 'Enter place of birth' },
    { fieldName: 'consultationTopic', label: 'Topic', type: 'text', required: false, show: true, placeholder: "What you'd like to discuss (Optional)" },
  ],
  showDateOfBirth: true,
  showTimeOfBirth: true,
  showPlaceOfBirth: true,
  showConsultationTopic: true,
};

interface ConsultationFormProps {
  onFormDataChange: (data: ConsultationFormData & { latitude?: number; longitude?: number }) => void;
  onValidationChange: (isValid: boolean) => void;
  astrologerId?: string;
}

const autocompleteOptions = {
  types: ['(cities)']
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_HTTPS;

// API service updated for phone/email with country code
const apiService = {
  sendOtp: async (phoneNumber?: string, countryCode?: string, email?: string) => {
    const body: any = {};
    if (phoneNumber) {
      body.phoneNumber = phoneNumber;
      if (countryCode) {
        body.countryCode = countryCode;
      }
    }
    if (email) body.email = email;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/customer-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Failed to send OTP');
    return response.json();
  },

  verifyOtp: async (otp: string, webFcmToken: string, device_id: string, phoneNumber?: string, countryCode?: string, email?: string) => {
    const body: any = { otp, webFcmToken, device_id };

    if (phoneNumber) {
      body.phoneNumber = phoneNumber;
      if (countryCode) {
        body.countryCode = countryCode;
      }
    }

    if (email) {
      body.email = email.toLowerCase().trim();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/verify_web_customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Failed to verify OTP');
    return response.json();
  }
};

// Helpers
const parseDate = (dateString: string): string => {
  if (!dateString || dateString.trim() === '') return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error parsing date:', error);
    return '';
  }
};

const parseTime = (timeString: string): string => {
  if (!timeString || timeString.trim() === '') return '';
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error parsing time:', error);
    return '';
  }
};

const getMobileNumber = (): string => {
  if (typeof window === 'undefined') return '';
  const mobile = localStorage.getItem('customer_phone');
  return (mobile && mobile.trim() && mobile !== 'null' && mobile !== 'undefined') ? mobile : '';
};

const getCountryCode = (): string => {
  if (typeof window === 'undefined') return '91';
  const countryCode = localStorage.getItem('customer_country_code');
  return (countryCode && countryCode.trim() && countryCode !== 'null' && countryCode !== 'undefined') ? countryCode : '91';
};

const isUserLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const customerId = localStorage.getItem('customer_id');
  const customerPhone = localStorage.getItem('customer_phone');
  const customerEmail = localStorage.getItem('customer_email');
  const hasValidId = !!(customerId && customerId.trim() && customerId !== 'null' && customerId !== 'undefined');
  const hasValidPhone = !!(customerPhone && customerPhone.trim() && customerPhone !== 'null' && customerPhone !== 'undefined');
  const hasValidEmail = !!(customerEmail && customerEmail.trim() && customerEmail !== 'null' && customerEmail !== 'undefined');
  return hasValidId && (hasValidPhone || hasValidEmail);
};

const getUserData = () => {
  if (typeof window === 'undefined') return {};
  const getData = (key: string) => {
    const value = localStorage.getItem(key);
    return (value && value.trim() && value !== 'null' && value !== 'undefined') ? value : '';
  };
  return {
    customer_id: getData('customer_id'),
    customer_name: getData('customer_name'),
    customer_phone: getData('customer_phone'),
    customer_email: getData('customer_email'),
    customer_country_code: getData('customer_country_code'),
  };
};

const getInitialData = (): Partial<ConsultationFormData> => {
  const userData = getUserData();
  return {
    fullName: userData.customer_name || '',
    email: userData.customer_email || '',
    mobileNumber: userData.customer_phone || '',
    countryCode: userData.customer_country_code || '91',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    consultationTopic: '',
    dontKnowDOB: false,
    dontKnowTOB: false,
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const ConsultationForm: React.FC<ConsultationFormProps> = ({
  onFormDataChange,
  onValidationChange,
  astrologerId
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [placeDetails, setPlaceDetails] = useState({ latitude: 0, longitude: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [formConfig] = useState<FormConfiguration>(defaultFormConfig);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState<boolean>(true);
  const [dynamicSchema] = useState(createDynamicSchema(defaultFormConfig));
  const [customerData, setCustomerData] = useState<CustomerApiResponse['customer'] | null>(null);
  const [fieldsToHide, setFieldsToHide] = useState<Set<string>>(new Set());

  // OTP & login mode states
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [isLoadingOtp, setIsLoadingOtp] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [tempPhoneInputDetail, setTempPhoneInputDetail] = useState<PhoneInputDetail>({
    phone_number: '',
    country_code_length: 0,
    country_code: '91'
  });
  const [phoneInputDetail, setPhoneInputDetail] = useState<PhoneInputDetail>({
    phone_number: '',
    country_code_length: 0,
    country_code: '91'
  });
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const [loginMode, setLoginMode] = useState<LoginMode>('phone');
  const [emailInput, setEmailInput] = useState<string>('');
  const [tempEmail, setTempEmail] = useState<string>('');

  const notifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotifiedDataRef = useRef<string>('');
  const hasInitialNotificationRef = useRef<boolean>(false);

  const fetchCustomerData = useCallback(async () => {
    const mobileNumber = getMobileNumber();
    const emailFromStorage = typeof window !== 'undefined' ? localStorage.getItem('customer_email') : '';

    if (!mobileNumber && (!emailFromStorage || emailFromStorage === 'null' || emailFromStorage.trim() === '')) {
      setIsLoadingCustomer(false);
      return;
    }

    try {
      setIsLoadingCustomer(true);

      const body: any = {};
      if (mobileNumber) {
        body.phoneNumber = mobileNumber;
      } else if (emailFromStorage && emailFromStorage !== 'null' && emailFromStorage.trim() !== '') {
        body.email = emailFromStorage;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/get-customer-by-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data: CustomerApiResponse = await response.json();

        if (data.success && data.customer) {
          setCustomerData(data.customer);
          setIsVerified(true);

          const hideFields = new Set<string>();

          if (data.customer.phoneNumber && data.customer.phoneNumber.trim()) {
            hideFields.add('mobileNumber');
          }

          if (data.customer.email && data.customer.email.trim() && data.customer.email !== 'null') {
            hideFields.add('email');
          }

          setFieldsToHide(hideFields);
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setIsLoadingCustomer(false);
    }
  }, []);

  useEffect(() => {
    const loginStatus = isUserLoggedIn();
    setIsLoggedIn(loginStatus);
    setIsVerified(loginStatus);
    fetchCustomerData();
  }, [fetchCustomerData]);

  const createInitialFormData = useCallback((): Partial<ConsultationFormData> => {
    const localData = getInitialData();

    if (customerData) {
      return {
        fullName: customerData.customerName || localData.fullName || '',
        email: customerData.email || localData.email || '',
        mobileNumber: customerData.phoneNumber || localData.mobileNumber || '',
        countryCode: customerData.countryCode || localData.countryCode || '91',
        dateOfBirth: parseDate(customerData.dateOfBirth) || localData.dateOfBirth || '',
        timeOfBirth: parseTime(customerData.timeOfBirth) || localData.timeOfBirth || '',
        gender: customerData.gender || '',
        placeOfBirth: customerData.birthPlace || localData.placeOfBirth || '',
        consultationTopic: '',
        dontKnowDOB: false,
        dontKnowTOB: false,
      };
    }

    return localData;
  }, [customerData]);

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: createInitialFormData(),
    mode: 'onChange'
  });

  const { register, setValue, trigger, formState: { errors, isValid }, watch, reset } = form;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (resendTimer > 0) {
      intervalId = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [resendTimer]);

  useEffect(() => {
    if (otp.length === 4 && !isLoadingOtp) {
      handleVerifyOtp();
    }
  }, [otp]);

  const handlePhoneInputField = (value: string, country: CountryData) => {
    setPhoneInputDetail({
      phone_number: value,
      country_code_length: country?.dialCode?.length || 0,
      country_code: country?.dialCode || '91'
    });
    setOtpError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailInput(value);
    setOtpError('');
  };

  // Minimum phone number validation (only country code + at least 1 digit)
  const isValidPhoneNumber = (phoneNumber: string) => {
    const phoneWithoutCountryCode = phoneNumber.substring(phoneInputDetail.country_code_length);
    return phoneWithoutCountryCode.length >= 1; // At least 1 digit after country code
  };

  const handleSendOtp = async () => {
    if (loginMode === 'phone') {
      if (!isValidPhoneNumber(phoneInputDetail.phone_number)) {
        setOtpError('Please enter a valid phone number');
        return;
      }
    } else {
      if (!isValidEmail(emailInput)) {
        setOtpError('Please enter a valid email address');
        return;
      }
    }

    setIsLoadingOtp(true);
    setOtpError('');

    try {
      if (loginMode === 'phone') {
        const phoneNumber = String(phoneInputDetail?.phone_number)?.substring(phoneInputDetail?.country_code_length);
        const countryCode = phoneInputDetail.country_code;
        const res = await apiService.sendOtp(phoneNumber, countryCode, undefined);
        if (res.success === true){
          setTempPhoneInputDetail(phoneInputDetail);
        } else {
          setOtpError(res.message || 'Failed to send OTP. Please try again.');
          return;
        }
      } else {
        const res = await apiService.sendOtp(undefined, undefined, emailInput);
        if (res.success === true){
          setTempEmail(emailInput);
        } else {
          setOtpError(res.message || 'Failed to send OTP. Please try again.');
          return;
        }
      }

      setShowOtpInput(true);
      setResendTimer(30);
      setOtp('');
    } catch (error) {
      setOtpError('Failed to send OTP. Please try again.');
      console.error('Send OTP error:', error);
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      setOtpError('Please enter a 4-digit OTP');
      return;
    }

    setIsLoadingOtp(true);
    setOtpError('');

    try {
      let response;
      const tokenToSend = 'fcmToken'; // You might want to get actual FCM token here
      
      if (loginMode === 'phone') {
        const phoneNumber = String(tempPhoneInputDetail?.phone_number)?.substring(tempPhoneInputDetail?.country_code_length);
        const countryCode = tempPhoneInputDetail.country_code;
        response = await apiService.verifyOtp(otp, tokenToSend, 'device_id', phoneNumber, countryCode, undefined);
      } else {
        response = await apiService.verifyOtp(otp, tokenToSend, 'device_id', undefined, undefined, tempEmail);
      }

      if (response?.success && typeof window !== 'undefined') {
        if (response?.token) {
          localStorage.setItem('auth_token', response.token);
        }

        const customerData = response?.customer;
        if (customerData) {
          localStorage.setItem('customer_id', customerData._id || '');
          localStorage.setItem('customer_phone', customerData.phoneNumber || '');
          localStorage.setItem('customer_name', customerData.customerName || '');
          localStorage.setItem('customer_email', customerData.email?.trim() || '');
          localStorage.setItem('customer_country_code', customerData.countryCode || '91');
          localStorage.setItem('customer_data', JSON.stringify(customerData));
        }
        window.location.reload();
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      setOtpError('Invalid OTP. Please try again.');
      setOtp('');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendTimer(30);
    setOtp('');
    setOtpError('');
    setIsLoadingOtp(true);

    try {
      if (loginMode === 'phone') {
        const phoneNumber = String(tempPhoneInputDetail?.phone_number)?.substring(tempPhoneInputDetail?.country_code_length);
        const countryCode = tempPhoneInputDetail.country_code;
        await apiService.sendOtp(phoneNumber, countryCode, undefined);
      } else {
        await apiService.sendOtp(undefined, undefined, tempEmail);
      }
    } catch (error) {
      setOtpError('Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleEditPhoneNumber = () => {
    setShowOtpInput(false);
    setOtp('');
    setOtpError('');
    setTempPhoneInputDetail({
      phone_number: '',
      country_code_length: 0,
      country_code: '91'
    });
    setTempEmail('');
  };

  useEffect(() => {
    hasInitialNotificationRef.current = false;
    lastNotifiedDataRef.current = '';

    onValidationChange(false);
    onFormDataChange({ ...getInitialData(), ...placeDetails });

    return () => {
      if (notifyTimeoutRef.current) clearTimeout(notifyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoadingCustomer && isVerified) {
      const initialData = createInitialFormData();
      reset(initialData);

      if (customerData?.birthPlace) {
        setPlaceDetails({ latitude: Number(customerData?.latitude) || 0, longitude: Number(customerData?.longitude) || 0 });
      }

      hasInitialNotificationRef.current = false;
      lastNotifiedDataRef.current = '';

      setTimeout(() => {
        const formData = form.getValues();
        onFormDataChange({ ...formData, ...placeDetails });
        onValidationChange(form.formState.isValid);
      }, 100);
    }
  }, [customerData, isLoadingCustomer, isVerified, createInitialFormData, reset]);

  const notifyParent = useCallback(() => {
    if (notifyTimeoutRef.current) clearTimeout(notifyTimeoutRef.current);

    notifyTimeoutRef.current = setTimeout(() => {
      const formData = form.getValues();
      const dataWithPlace = { ...formData, ...placeDetails };
      const dataString = JSON.stringify(dataWithPlace);

      lastNotifiedDataRef.current = dataString;
      onFormDataChange(dataWithPlace);
      onValidationChange(isValid);
    }, 300);
  }, [form, placeDetails, isValid, onFormDataChange, onValidationChange]);

  useEffect(() => {
    if (isVerified) {
      const subscription = watch(() => {
        notifyParent();
      });

      return () => {
        subscription.unsubscribe();
        if (notifyTimeoutRef.current) clearTimeout(notifyTimeoutRef.current);
      };
    }
  }, [watch, notifyParent, isVerified]);

  const handleCheckboxChange = useCallback((fieldName: 'dontKnowDOB' | 'dontKnowTOB', checked: boolean) => {
    setValue(fieldName, checked, { shouldValidate: true });

    if (checked) {
      if (fieldName === 'dontKnowDOB') {
        setValue('dateOfBirth', '', { shouldValidate: true });
      } else if (fieldName === 'dontKnowTOB') {
        setValue('timeOfBirth', '', { shouldValidate: true });
      }
    }

    setTimeout(() => trigger(), 50);
  }, [setValue, trigger]);

  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        const placeOfBirth = place.formatted_address || '';

        setPlaceDetails({ latitude, longitude });
        setValue('placeOfBirth', placeOfBirth, { shouldValidate: true });

        setTimeout(() => {
          trigger('placeOfBirth');
        }, 50);
      }
    }
  }, [autocomplete, setValue, trigger]);

  const isFieldHidden = (fieldName: string): boolean => fieldsToHide.has(fieldName);
  const isFieldReadOnly = (fieldName: string): boolean => fieldName === 'mobileNumber' && fieldsToHide.has(fieldName);
  const shouldSpanFullWidth = (fieldName: string): boolean => fieldName === 'fullName' && (isFieldHidden('email') && isFieldHidden('mobileNumber'));

  const renderField = (fieldConfig: FormFieldConfig) => {
    const { fieldName, label, type, required, placeholder, disabled, show } = fieldConfig;
    if (show === false || isFieldHidden(fieldName)) return null;

    const isReadOnly = isFieldReadOnly(fieldName) || disabled;
    const fieldError = errors[fieldName];

    switch (type) {
      case 'textarea':
        return (
          <div key={fieldName} className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              {...register(fieldName)}
              placeholder={placeholder}
              readOnly={isReadOnly}
              className={`px-3 py-2 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all ${
                isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'
              } ${fieldError ? 'border-red-500' : ''}`}
              rows={3}
            />
            {fieldError && (
              <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
            )}
          </div>
        );
      case 'select':
        if (fieldName === 'gender') {
          return (
            <div key={fieldName} className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <select
                {...register(fieldName)}
                disabled={isReadOnly}
                className={`px-3 py-2 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all ${
                  isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'
                } ${fieldError ? 'border-red-500' : ''}`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {fieldError && (
                <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
              )}
            </div>
          );
        }
        return null;
      case 'autocomplete':
        if (fieldName !== 'placeOfBirth') return null;
        return (
          <div key={fieldName} className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              options={autocompleteOptions}
            >
              <input
                {...register(fieldName)}
                placeholder={placeholder}
                autoComplete="off"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all ${
                  fieldError ? 'border-red-500' : ''
                } bg-white`}
              />
            </Autocomplete>
            {fieldError && (
              <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
            )}
          </div>
        );
      default:
        return (
          <div key={fieldName} className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              {...register(fieldName)}
              placeholder={placeholder}
              readOnly={isReadOnly}
              disabled={
                (fieldName === 'dateOfBirth' && watch('dontKnowDOB')) ||
                (fieldName === 'timeOfBirth' && watch('dontKnowTOB'))
              }
              autoComplete="off"
              className={`px-3 py-2 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all disabled:bg-gray-100 ${
                isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'bg-white'
              } ${fieldError ? 'border-red-500' : ''}`}
            />
            {fieldError && (
              <p className="text-red-500 text-xs mt-1">{fieldError.message}</p>
            )}
          </div>
        );
    }
  };

  if (isLoadingCustomer) {
    return (
      <div className="bg-amber-50/50 p-4 rounded-lg border">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#980d0d]"></div>
          <span className="ml-2 text-sm text-gray-600">Loading your details...</span>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg border">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {showOtpInput ? 'Verify OTP' : 'Login to Continue'}
            </h3>
            <p className="text-sm text-gray-600">
              {showOtpInput
                ? `Enter the 4-digit OTP sent to your ${loginMode}`
                : 'We will send you a verification code'}
            </p>
          </div>

          {!showOtpInput ? (
            <div className="space-y-4">
              <div className='w-full flex gap-2 bg-gray-100 p-1 rounded-lg'>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('phone');
                    setOtpError('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    loginMode === 'phone'
                      ? 'bg-white text-[#980d0d] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Phone Number
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('email');
                    setOtpError('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    loginMode === 'email'
                      ? 'bg-white text-[#980d0d] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Email
                </button>
              </div>

              {loginMode === 'phone' && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PhoneInput
                      country={'in'}
                      placeholder='Enter mobile number'
                      value={phoneInputDetail?.phone_number}
                      onChange={handlePhoneInputField}
                      onKeyDown={(e: any) => e.key === 'Enter' && handleSendOtp()}
                      inputStyle={{
                        width: '100%',
                        height: '48px',
                        fontSize: '14px',
                        backgroundColor: '#FFF',
                        borderRadius: '8px',
                        border: otpError ? '1px solid #ef4444' : '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  {otpError && (
                    <p className="text-red-500 text-xs mt-1">{otpError}</p>
                  )}
                </div>
              )}

              {loginMode === 'email' && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={handleEmailChange}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className={`w-full px-3 py-3 pr-12 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all bg-white ${
                        otpError ? 'border-red-500' : ''
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendOtp();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoadingOtp || !emailInput.includes('@')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#980d0d] text-white rounded-lg p-2.5 hover:bg-[#7a0a0a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send OTP"
                    >
                      {isLoadingOtp ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {otpError && (
                    <p className="text-red-500 text-xs mt-1">{otpError}</p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoadingOtp || (loginMode === 'phone' ? !isValidPhoneNumber(phoneInputDetail.phone_number) : !isValidEmail(emailInput))}
                  className="w-full h-[45px] bg-[#980d0d] hover:bg-[#7a0a0a] text-white py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingOtp ? 'Sending...' : 'GET OTP'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {loginMode === 'phone' 
                    ? tempPhoneInputDetail.phone_number.substring(tempPhoneInputDetail.country_code_length)
                    : tempEmail
                  }
                </span>
                <button
                  type="button"
                  onClick={handleEditPhoneNumber}
                  className="text-[#980d0d] hover:text-[#7a0a0a] transition-colors flex items-center gap-1"
                  title={`Edit ${loginMode}`}
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <OtpInput
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setOtpError('');
                  }}
                  numInputs={4}
                  renderSeparator={<span className="mx-2">-</span>}
                  renderInput={(props) => (
                    <input
                      {...props}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className='border-2 outline-none text-center rounded-lg transition-colors focus:border-[#980d0d]'
                      style={{ height: '50px', width: '50px', fontSize: '18px' }}
                    />
                  )}
                />

                {isLoadingOtp && otp.length === 4 && (
                  <div className="flex items-center gap-2 text-[#980d0d] text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#980d0d] border-t-transparent"></div>
                    Verifying OTP...
                  </div>
                )}

                {otpError && (
                  <p className="text-red-500 text-sm">{otpError}</p>
                )}

                <div className="text-sm text-gray-600">
                  {resendTimer > 0 ? (
                    `Resend OTP in ${resendTimer}s`
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoadingOtp}
                      className='text-[#980d0d] hover:text-[#7a0a0a] font-medium cursor-pointer disabled:opacity-50'
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formConfig.fields
          .filter(field => field.show !== false && !isFieldHidden(field.fieldName))
          .map(field => {
            if (field.fieldName === 'dateOfBirth' && formConfig.showDateOfBirth && !isFieldHidden('dateOfBirth')) {
              return (
                <div key="dateOfBirth" className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    disabled={watch('dontKnowDOB')}
                    className={`px-3 py-2 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all disabled:bg-gray-100 bg-white ${
                      errors.dateOfBirth ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={watch('dontKnowDOB')}
                      onChange={(e) => handleCheckboxChange('dontKnowDOB', e.target.checked)}
                      className="w-4 h-4 mr-2 rounded text-[#980d0d] focus:ring-[#980d0d]"
                    />
                    <span className="text-xs text-gray-600">Don't know</span>
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>
              );
            }

            if (field.fieldName === 'timeOfBirth' && formConfig.showTimeOfBirth && !isFieldHidden('timeOfBirth')) {
              return (
                <div key="timeOfBirth" className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="time"
                    {...register('timeOfBirth')}
                    disabled={watch('dontKnowTOB')}
                    className={`px-3 py-2 text-sm border rounded-lg focus:ring-[#980d0d] focus:border-transparent transition-all disabled:bg-gray-100 bg-white ${
                      errors.timeOfBirth ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={watch('dontKnowTOB')}
                      onChange={(e) => handleCheckboxChange('dontKnowTOB', e.target.checked)}
                      className="w-4 h-4 mr-2 rounded text-[#980d0d] focus:ring-[#980d0d]"
                    />
                    <span className="text-xs text-gray-600">Don't know</span>
                  </div>
                  {errors.timeOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{errors.timeOfBirth.message}</p>
                  )}
                </div>
              );
            }

            if (field.fieldName === 'consultationTopic') {
              return (
                <div key={field.fieldName} className="md:col-span-2">
                  {renderField(field)}
                </div>
              );
            }

            if (field.fieldName === 'placeOfBirth') {
              return (
                <div key={field.fieldName} className="md:col-span-2">
                  {renderField(field)}
                </div>
              );
            }

            if (field.fieldName === 'fullName') {
              return (
                <div key={field.fieldName} className={shouldSpanFullWidth('fullName') ? 'md:col-span-2' : ''}>
                  {renderField(field)}
                </div>
              );
            }

            if (field.fieldName === 'email') {
              return (
                <div key={field.fieldName} className={shouldSpanFullWidth('fullName') ? 'md:col-span-2' : ''}>
                  {renderField(field)}
                </div>
              );
            }

            return renderField(field);
          })}
      </div>
    </div>
  );
};

export default ConsultationForm;