/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete } from '@react-google-maps/api';
import { z } from 'zod';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ApiCustomer {
  _id: string;
  customerName: string;
  email?: string | null;
  dateOfBirth?: string;
  timeOfBirth?: string;
  gender?: string;
  phoneNumber: string;
  countryCode?: string;
  // ✅ address object — this is where birthPlace/lat/lng live in the API response
  address?: {
    birthPlace?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface CustomerSession {
  customerId: string;
  customerName: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
}

export interface FormOutput {
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender: string;
  consultationTopic: string;
  dontKnowDOB: boolean;
  dontKnowTOB: boolean;
  countryCode: string;
  latitude: number;
  longitude: number;
}

export interface ConsultationFormProps {
  onFormDataChange: (data: FormOutput) => void;
  onValidationChange: (isValid: boolean) => void;
  onCustomerSessionChange?: (session: CustomerSession | null) => void;
  astrologerId?: string;
}

// ─────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────

const formSchema = z.object({
  fullName:          z.string().min(1, 'Full name is required'),
  email:             z.string().optional().default(''),
  mobileNumber:      z.string().optional().default(''),
  placeOfBirth:      z.string().min(1, 'Place of birth is required'),
  gender:            z.string().min(1, 'Gender is required'),
  consultationTopic: z.string().optional().default(''),
  dateOfBirth:       z.string().optional().default(''),
  timeOfBirth:       z.string().optional().default(''),
  dontKnowDOB:       z.boolean().default(false),
  dontKnowTOB:       z.boolean().default(false),
  countryCode:       z.string().optional().default('91'),
});

type FormValues = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// API returns "1999-02-12T23:15" — split on T to get date/time parts
const parseDate = (raw?: string): string => {
  if (!raw?.trim()) return '';
  if (raw.includes('T')) return raw.split('T')[0];
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch { return ''; }
};

const parseTime = (raw?: string): string => {
  if (!raw?.trim()) return '';
  if (raw.includes('T')) return raw.split('T')[1]?.substring(0, 5) ?? '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
};

// ─────────────────────────────────────────────
// Admin Login Response type
// ─────────────────────────────────────────────

interface AdminLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  customer?: ApiCustomer;
}

interface CountryData {
  dialCode: string;
}

// ─────────────────────────────────────────────
// LoginScreen
// ─────────────────────────────────────────────

const LoginScreen: React.FC<{ onLoginSuccess: (c: ApiCustomer) => void }> = ({
  onLoginSuccess,
}) => {
  const [phoneValue, setPhoneValue] = useState('');
  const [dialCode, setDialCode]     = useState('91');
  const [codeLength, setCodeLength] = useState(2);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const handleChange = (value: string, country: CountryData) => {
    setPhoneValue(value);
    setDialCode(country?.dialCode ?? '91');
    setCodeLength(country?.dialCode?.length ?? 0);
    setError('');
  };

  const phoneOnly = phoneValue.substring(codeLength);

  const handleLogin = async () => {
    if (phoneOnly.length < 5) {
      setError('Please enter a valid phone number');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/customer-login-admin`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ phoneNumber: phoneOnly, countryCode: dialCode }),
        }
      );
      const data: AdminLoginResponse = await res.json();
      if (data.success && data.customer) {
        onLoginSuccess(data.customer);
      } else {
        setError(data.message ?? 'Login failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg border">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Customer Login</h3>
          <p className="text-sm text-gray-500">
            Enter the customer's mobile number to load their details
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            country="in"
            placeholder="Enter mobile number"
            value={phoneValue}
            onChange={handleChange}
            onKeyDown={(e: any) => { if (e.key === 'Enter') handleLogin(); }}
            inputStyle={{
              width: '100%', height: '48px', fontSize: '14px',
              backgroundColor: '#FFF', borderRadius: '8px',
              border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
            }}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading || phoneOnly.length < 5}
          className="w-full h-[46px] bg-[#980d0d] hover:bg-[#7a0a0a] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Fetching Details...
            </>
          ) : (
            'Load Customer Details'
          )}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main ConsultationForm
// ─────────────────────────────────────────────

const autocompleteOptions = { types: ['(cities)'] };

const ConsultationForm: React.FC<ConsultationFormProps> = ({
  onFormDataChange,
  onValidationChange,
  onCustomerSessionChange,
}) => {
  const [loggedInCustomer, setLoggedInCustomer] = useState<ApiCustomer | null>(null);

  // lat/lng in refs — changes don't trigger re-renders
  const latRef = useRef(0);
  const lngRef = useRef(0);

  // Google Autocomplete instance
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Separate controlled state for place input display
  // (register() ref conflicts with Google Autocomplete's internal ref)
  const [placeInputValue, setPlaceInputValue] = useState('');

  // Stable refs for parent callbacks — prevents them from being in dep arrays
  const onFormDataChangeRef   = useRef(onFormDataChange);
  const onValidationChangeRef = useRef(onValidationChange);
  useEffect(() => { onFormDataChangeRef.current  = onFormDataChange;  }, [onFormDataChange]);
  useEffect(() => { onValidationChangeRef.current = onValidationChange; }, [onValidationChange]);

  const {
    register,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '', email: '', mobileNumber: '',
      dateOfBirth: '', timeOfBirth: '', placeOfBirth: '',
      gender: 'Male', consultationTopic: '',
      dontKnowDOB: false, dontKnowTOB: false, countryCode: '91',
    },
    mode: 'onChange',
  });

  // ── Stable notify function — empty dep array, uses refs ───────
  const notifyTimer = useRef<NodeJS.Timeout | null>(null);

  const notify = useCallback((values: FormValues, valid: boolean) => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    notifyTimer.current = setTimeout(() => {
      onFormDataChangeRef.current({
        fullName:          values.fullName          ?? '',
        email:             values.email             ?? '',
        mobileNumber:      values.mobileNumber      ?? '',
        dateOfBirth:       values.dateOfBirth       ?? '',
        timeOfBirth:       values.timeOfBirth       ?? '',
        placeOfBirth:      values.placeOfBirth      ?? '',
        gender:            values.gender            ?? '',
        consultationTopic: values.consultationTopic ?? '',
        dontKnowDOB:       values.dontKnowDOB       ?? false,
        dontKnowTOB:       values.dontKnowTOB       ?? false,
        countryCode:       values.countryCode       ?? '91',
        latitude:          latRef.current,
        longitude:         lngRef.current,
      });
      onValidationChangeRef.current(valid);
    }, 300);
  }, []); // ✅ empty — stable forever, no infinite loop

  // Watch form changes → notify parent
  useEffect(() => {
    if (!loggedInCustomer) return;
    const sub = watch((values) => {
      notify(values as FormValues, isValid);
    });
    return () => {
      sub.unsubscribe();
      if (notifyTimer.current) clearTimeout(notifyTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInCustomer, watch, notify]);

  // Notify when isValid changes (without re-subscribing watch)
  const isValidRef = useRef(isValid);
  useEffect(() => {
    if (isValidRef.current === isValid) return; // skip if unchanged
    isValidRef.current = isValid;
    if (!loggedInCustomer) return;
    notify(watch() as FormValues, isValid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  // ── Populate form when customer logs in ──────────────────────
  useEffect(() => {
    if (!loggedInCustomer) return;

    const dob = parseDate(loggedInCustomer.dateOfBirth);
    const tob = parseTime(loggedInCustomer.timeOfBirth);

    // ✅ Read from address object — this is where API puts the data
    const birthPlace = loggedInCustomer.address?.birthPlace ?? '';
    const lat        = Number(loggedInCustomer.address?.latitude)  || 0;
    const lng        = Number(loggedInCustomer.address?.longitude) || 0;

    // Store in refs for payload
    latRef.current = lat;
    lngRef.current = lng;

    // Update the display input for place of birth
    setPlaceInputValue(birthPlace);

    reset({
      fullName:          loggedInCustomer.customerName ?? '',
      email:             loggedInCustomer.email        ?? '',
      mobileNumber:      loggedInCustomer.phoneNumber  ?? '',
      countryCode:       loggedInCustomer.countryCode  ?? '91',
      dateOfBirth:       dob,
      timeOfBirth:       tob,
      gender:            loggedInCustomer.gender       ?? 'Male',
      placeOfBirth:      birthPlace,  // ✅ from address.birthPlace
      consultationTopic: '',
      dontKnowDOB:       false,
      dontKnowTOB:       false,
    });

    onCustomerSessionChange?.({
      customerId:   loggedInCustomer._id,
      customerName: loggedInCustomer.customerName,
      phoneNumber:  loggedInCustomer.phoneNumber,
      countryCode:  loggedInCustomer.countryCode ?? '91',
      email:        loggedInCustomer.email        ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInCustomer]);

  // ── Checkbox handler ──────────────────────────────────────────
  const handleCheckbox = useCallback(
    (field: 'dontKnowDOB' | 'dontKnowTOB', checked: boolean) => {
      setValue(field, checked, { shouldValidate: true });
      if (checked) {
        const target = field === 'dontKnowDOB' ? 'dateOfBirth' : 'timeOfBirth';
        setValue(target, '', { shouldValidate: true });
      }
      setTimeout(() => trigger(), 50);
    },
    [setValue, trigger],
  );

  // ── Google Places ─────────────────────────────────────────────
  const onAutocompleteLoad = useCallback((inst: google.maps.places.Autocomplete) => {
    autocompleteRef.current = inst;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const inst = autocompleteRef.current;
    if (!inst) return;
    const place = inst.getPlace();
    if (place?.geometry?.location) {
      const lat     = place.geometry.location.lat();
      const lng     = place.geometry.location.lng();
      const address = place.formatted_address ?? '';

      latRef.current = lat;
      lngRef.current = lng;

      setPlaceInputValue(address);
      setValue('placeOfBirth', address, { shouldValidate: true });
      setTimeout(() => trigger('placeOfBirth'), 50);
    }
  }, [setValue, trigger]);

  // ── Change customer ───────────────────────────────────────────
  const handleChangeCustomer = useCallback(() => {
    setLoggedInCustomer(null);
    setPlaceInputValue('');
    latRef.current = 0;
    lngRef.current = 0;
    onCustomerSessionChange?.(null);
    onValidationChangeRef.current(false);
  }, [onCustomerSessionChange]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (!loggedInCustomer) {
    return <LoginScreen onLoginSuccess={setLoggedInCustomer} />;
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border">

      {/* Logged-in customer badge */}
      <div className="flex items-center justify-between mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800">
            {loggedInCustomer.customerName.trim()} ({loggedInCustomer.phoneNumber})
          </span>
        </div>
        <button
          type="button"
          onClick={handleChangeCustomer}
          className="text-xs text-[#980d0d] hover:text-[#7a0a0a] font-medium underline whitespace-nowrap"
        >
          Change Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Full Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('fullName')}
            placeholder="Enter full name"
            autoComplete="off"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] bg-white ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            placeholder="Enter email"
            autoComplete="off"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] bg-white ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            {...register('gender')}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] bg-white ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Date of Birth</label>
          <input
            type="date"
            {...register('dateOfBirth')}
            disabled={!!watch('dontKnowDOB')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] disabled:bg-gray-100 bg-white"
          />
          <label className="flex items-center gap-2 mt-1 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={!!watch('dontKnowDOB')}
              onChange={(e) => handleCheckbox('dontKnowDOB', e.target.checked)}
              className="w-4 h-4 rounded accent-[#980d0d]"
            />
            <span className="text-xs text-gray-600">Don't know</span>
          </label>
        </div>

        {/* Time of Birth */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Time of Birth</label>
          <input
            type="time"
            {...register('timeOfBirth')}
            disabled={!!watch('dontKnowTOB')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] disabled:bg-gray-100 bg-white"
          />
          <label className="flex items-center gap-2 mt-1 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={!!watch('dontKnowTOB')}
              onChange={(e) => handleCheckbox('dontKnowTOB', e.target.checked)}
              className="w-4 h-4 rounded accent-[#980d0d]"
            />
            <span className="text-xs text-gray-600">Don't know</span>
          </label>
        </div>

        {/* Place of Birth — full width */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Place of Birth <span className="text-red-500">*</span>
          </label>

          {/*
            ✅ Do NOT use {...register('placeOfBirth')} here.
            register() attaches its own ref which conflicts with Google Autocomplete.
            Instead: controlled input + setValue() manually on place select.
            On login: placeInputValue is set from address.birthPlace (API data).
          */}
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={autocompleteOptions}
          >
            <input
              type="text"
              value={placeInputValue}
              onChange={(e) => {
                setPlaceInputValue(e.target.value);
                // If user clears the field, invalidate RHF value too
                if (!e.target.value) {
                  latRef.current = 0;
                  lngRef.current = 0;
                  setValue('placeOfBirth', '', { shouldValidate: true });
                }
              }}
              placeholder="Search city / place of birth"
              autoComplete="off"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] bg-white ${
                errors.placeOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </Autocomplete>

          {errors.placeOfBirth && (
            <p className="text-red-500 text-xs mt-1">{errors.placeOfBirth.message}</p>
          )}

        </div>

        {/* Consultation Topic — full width */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1">Topic</label>
          <input
            type="text"
            {...register('consultationTopic')}
            placeholder="What you'd like to discuss (Optional)"
            autoComplete="off"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#980d0d] bg-white"
          />
        </div>

      </div>
    </div>
  );
};

export default ConsultationForm;