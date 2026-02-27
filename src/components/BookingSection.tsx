/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Calendar, CreditCard, IndianRupee, Phone, Video } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useRazorpay } from 'react-razorpay';
import Swal from 'sweetalert2';

import ConsultationForm, { CustomerSession, FormOutput } from '@/components/form/consultationForm';
import { toaster } from '@/utils/services/toast-service';
import { createStripePayment } from '@/utils/stripe-payment';
import { AstrologerData, User as UserType } from '../types';
import DatePicker from './DatePicker';
import DatePickerSpecial from './DatePickerSpecial';
import { astrologer } from '../../schema';


interface ConsultationPrice {
  price: number;
  duration: { slotDuration: number };
  consultationType: string;
}

interface AvailableSlot {
  fromTime: string;
  toTime: string;
  duration: number;
  _id?: string;
  status?: string;
}

interface SlotsApiResponse {
  SlotDate: string;
  SlotTimeByDuration: { [key: string]: AvailableSlot[] };
}

interface DurationCount {
  duration: number;
  count: number;
  label: string;
}

interface AvailableSlotsApiResponse {
  success: boolean;
  message: string;
  totalSlots: number;
  availableDurations: number[];
  durationCounts: DurationCount[];
  requestedDate: string;
  requestedTime: string;
  minimumTime: string;
  dateRange: { from: string; to: string };
  slots: AvailableSlot[];
}

interface SessionType {
  title: string;
  value: 'videocall' | 'call' | 'chat';
  icon: React.ReactNode;
}

interface ModalData {
  price: number | null;
  consultation_type: 'videocall' | 'call' | 'chat';
  duration_minutes: string;
  selectedDate: string | null;
  selectedSlot: AvailableSlot | null;
}

interface BookingSectionProps {
  astrologerId: string;
  astrologerData: AstrologerData;
  currentUser: UserType | null;
  onLoginRequired: () => void;
  consultationPrices: ConsultationPrice[];
}


const getAvailableSessionTypes = (astrologerData: AstrologerData): SessionType[] => {
  const all: SessionType[] = [
    { title: 'Video Call', value: 'videocall', icon: <Video size={24} /> },
    { title: 'Voice Call', value: 'call',      icon: <Phone size={24} /> },
  ];
  return all.filter((t) => {
    if (t.value === 'videocall') return astrologerData.video_call_status !== 'offline';
    if (t.value === 'call')      return astrologerData.call_status      !== 'offline';
    return true;
  });
};

const formatTime = (time: string): string => {
  const [h, m] = time.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};


const BookingSection: React.FC<BookingSectionProps> = ({
  astrologerId,
  astrologerData,
  consultationPrices,
}): React.ReactElement => { 
  
  console.log(astrologerData, '--- Astrologer Data in BookingSection ---');

  const router = useRouter();
  const { error: razorpayError, Razorpay } = useRazorpay();

  const isSpecialAstrologer = astrologerData?.hasSpecialPricing === true;
  const SPECIAL_PRICING_CONFIG: Record<string, number> = astrologerData?.specialPricingRates ?? {};

  const getSpecialPrice = (dur: number): number | null =>
    SPECIAL_PRICING_CONFIG[String(dur)] ?? null;

  // ── Customer session from ConsultationForm (no localStorage) ──
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);

  // ── State ─────────────────────────────────────────────────────
  const [isUrgentBooking, setIsUrgentBooking]       = useState(false);
  const [isNewCustomer, setIsNewCustomer]         = useState(false);
  const [globalOfferPrice, setGlobalOfferPrice]      = useState<number | null>(null);
  const [checkingNewCustomer, setCheckingNewCustomer]   = useState(false);
  const [slotsData, setSlotsData]             = useState<SlotsApiResponse | null>(null);
  const [loadingSlots, setLoadingSlots]          = useState(false);
  const [slotsError, setSlotsError]            = useState<string | null>(null);
  const [isBooking, setIsBooking]             = useState(false);
  const [hasFutureSlots, setHasFutureSlots]        = useState<boolean | null>(null);
  const [showConsultationForm, setShowConsultationForm]  = useState(false);
  const [consultationFormData, setConsultationFormData]  = useState<FormOutput | null>(null);
  const [isFormValid,setIsFormValid]           = useState(false);
  const [showAllSlots,setShowAllSlots]          = useState(false);
  const [availableDurations,setAvailableDurations]    = useState<number[]>([]);
  const [loadingDurations, setLoadingDurations] = useState(false);
  const [durationCounts,setDurationCounts]= useState<DurationCount[]>([]);
  const [adminID,setAdminID] = useState('')
  const [paymentLinkStatus,setPaymentLinkStatus]= useState<{
    consultationLogId: string;
    status: 'pending' | 'paid' | 'failed';
  } | null>(null);

  const hasCheckedAvailability  = useRef(false);
  const paymentCheckInterval    = useRef<NodeJS.Timeout | null>(null);
  const sessionTypes            = getAvailableSessionTypes(astrologerData);


  
  // ── Price logic ───────────────────────────────────────────────
  const getCorrectPrice = (durationSlot: number): number => {
    const base = consultationPrices.find((p) => p.duration.slotDuration === durationSlot);
    if (!base) return 199;
    if (isUrgentBooking) return base.price;

    if (isSpecialAstrologer) {
      const sp = getSpecialPrice(durationSlot);
      if (sp !== null) return sp;
    }

    const candidates: number[] = [];

    const offerPrices = astrologerData?.firstTimeOfferPrices ?? [];

    if (
      isNewCustomer &&
      astrologerData?.GoWithCustomPricings === true &&
      offerPrices.length > 0
    ) {
      const offer = offerPrices.find(
        (o: any) => o.duration.slotDuration === durationSlot
      );
      if (offer) candidates.push(offer.price);
    }

    if (
      isNewCustomer &&
      astrologerData?.useGlobalFirstTimeOfferPrice === true &&
      astrologerData?.GoWithCustomPricings === false &&
      offerPrices.length === 0 &&
      durationSlot === 15 &&
      globalOfferPrice !== null
    ) {
      candidates.push(globalOfferPrice);
    }

    candidates.push(base.price);
    return Math.min(...candidates);
  };

  // ── Modal state ───────────────────────────────────────────────
  const [modalData, setModalData] = useState<ModalData>(() => {
    const defaultType = sessionTypes[0]?.value ?? 'videocall';
    if (!consultationPrices?.length) {
      return {
        price:             isSpecialAstrologer ? getSpecialPrice(30) : null,
        consultation_type: defaultType,
        duration_minutes:  '30min',
        selectedDate:      null,
        selectedSlot:      null,
      };
    }
    const minSlot = consultationPrices.reduce((min, item) =>
      (item?.duration?.slotDuration ?? 0) < (min?.duration?.slotDuration ?? 0) ? item : min
    );
    const defaultDur   = isSpecialAstrologer ? 30 : (minSlot?.duration?.slotDuration ?? 15);
    const defaultPrice = isSpecialAstrologer
      ? (getSpecialPrice(defaultDur) ?? minSlot?.price ?? 199)
      : (minSlot?.price ?? 199);
    return {
      price:             defaultPrice,
      consultation_type: defaultType,
      duration_minutes:  `${defaultDur}min`,
      selectedDate:      null,
      selectedSlot:      null,
    };
  });

  // ── Sync price ────────────────────────────────────────────────
  useEffect(() => {
    if (!consultationPrices.length) return;
    const dur     = parseInt(modalData.duration_minutes.replace('min', ''));
    const correct = getCorrectPrice(dur);
    if (modalData.price !== correct) setModalData((p) => ({ ...p, price: correct }));
  }, [isSpecialAstrologer, isUrgentBooking, modalData.duration_minutes, consultationPrices, isNewCustomer, globalOfferPrice]);

  // ── Sync session type ─────────────────────────────────────────
  useEffect(() => {
    if (!sessionTypes.length) return;
    const ok = sessionTypes.some((t) => t.value === modalData.consultation_type);
    if (!ok) setModalData((p) => ({ ...p, consultation_type: sessionTypes[0].value }));
  }, [sessionTypes, modalData.consultation_type]);

  // ── Check new customer ────────────────────────────────────────
  useEffect(() => {
    if (!customerSession?.customerId) return;
    const check = async () => {
      setCheckingNewCustomer(true);
      try {
        const res  = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/customers/check-new-customer`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ customerId: customerSession.customerId, offerPriceActive: true }),
          }
        );
        const data = await res.json();
        if (data.success && data.isNewCustomer) {
          setIsNewCustomer(true);
          if (data.hasOfferPrice) setGlobalOfferPrice(data.offerPrice);
        } else {
          setIsNewCustomer(false);
        }
      } catch {
        setIsNewCustomer(false);
      } finally {
        setCheckingNewCustomer(false);
      }
    };
    check();
  }, [customerSession?.customerId]);

  // ── Cleanup ───────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (paymentCheckInterval.current) clearInterval(paymentCheckInterval.current); };
  }, []);

  // ── Check available durations ─────────────────────────────────
  const checkAvailableDurations = async () => {
    if (!astrologerId || hasCheckedAvailability.current) return;
    setLoadingDurations(true);
    hasCheckedAvailability.current = true;
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/slots/available?astrologerId=${astrologerId}&date=${moment().format('YYYY-MM-DD')}&time=${moment().format('HH:mm')}`
      );
      const data: AvailableSlotsApiResponse = await res.json();
      if (res.ok && data.success) {
        setAvailableDurations(data.availableDurations ?? []);
        setDurationCounts(data.durationCounts ?? []);
        setHasFutureSlots(data.totalSlots > 0);
        if (data.availableDurations?.length) {
          const cur   = parseInt(modalData.duration_minutes.replace('min', ''));
          if (!data.availableDurations.includes(cur)) {
            const first = data.availableDurations[0];
            const match = consultationPrices.find((p) => p.duration.slotDuration === first);
            if (match) {
              let fp = match.price;
              if (isSpecialAstrologer && !isUrgentBooking) {
                const sp = getSpecialPrice(first);
                if (sp !== null) fp = sp;
              }
              setModalData((p) => ({ ...p, duration_minutes: `${first}min`, price: fp }));
            }
          }
        }
      } else {
        setHasFutureSlots(false);
      }
    } catch {
      setHasFutureSlots(false);
    } finally {
      setLoadingDurations(false);
    }
  };

  useEffect(() => { checkAvailableDurations(); }, [astrologerId]);

  // ── Fetch slots ───────────────────────────────────────────────
  const fetchSlots = async (date: string) => {
    if (!astrologerId || !date) return;
    setLoadingSlots(true);
    setSlotsError(null);
    setShowAllSlots(false);
    try {
      const duration = parseInt(modalData.duration_minutes.replace('min', ''));
      const res      = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${new Date().toLocaleDateString('en-CA')}&duration=${duration}&currentTime=${moment().format('HH:mm')}&date=${date}`
      );
      const data: SlotsApiResponse = await res.json();
      if (res.ok && data.SlotTimeByDuration) {
        const key      = `${duration}min`;
        let   slots    = data.SlotTimeByDuration[key] ?? [];
        const todayObj = new Date();
        const [y, m, d] = date.split('-').map(Number);
        if (todayObj.toDateString() === new Date(y, m - 1, d).toDateString()) {
          const minMins = todayObj.getHours() * 60 + todayObj.getMinutes() + 15;
          slots = slots.filter((s) => {
            const [h, mi] = s.fromTime.split(':').map(Number);
            return h * 60 + mi >= minMins;
          });
        }
        setSlotsData({ ...data, SlotTimeByDuration: { ...data.SlotTimeByDuration, [key]: slots } });
      } else {
        setSlotsError('Failed to fetch available slots');
      }
    } catch {
      setSlotsError('Network error while fetching slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Re-fetch when duration/date changes
  useEffect(() => {
    const ctrl   = new AbortController();
    let   active = true;
    const run = async () => {
      if (!astrologerId || !modalData.selectedDate || !hasFutureSlots) return;
      setLoadingSlots(true);
      setSlotsError(null);
      setShowAllSlots(false);
      try {
        const duration = parseInt(modalData.duration_minutes.replace('min', ''));
        const res      = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${new Date().toLocaleDateString('en-CA')}&duration=${duration}&currentTime=${moment().format('HH:mm')}&date=${modalData.selectedDate}`,
          { signal: ctrl.signal }
        );
        if (!active) return;
        const data: SlotsApiResponse = await res.json();
        if (!active) return;
        if (res.ok && data.SlotTimeByDuration) {
          const key      = `${duration}min`;
          let   slots    = data.SlotTimeByDuration[key] ?? [];
          const todayObj = new Date();
          const [y, m, d] = modalData.selectedDate.split('-').map(Number);
          if (todayObj.toDateString() === new Date(y, m - 1, d).toDateString()) {
            const minMins = todayObj.getHours() * 60 + todayObj.getMinutes() + 15;
            slots = slots.filter((s) => {
              const [h, mi] = s.fromTime.split(':').map(Number);
              return h * 60 + mi >= minMins;
            });
          }
          if (active) setSlotsData({ ...data, SlotTimeByDuration: { ...data.SlotTimeByDuration, [key]: slots } });
        } else {
          if (active) setSlotsError('Failed to fetch available slots');
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError' && active) setSlotsError('Network error');
      } finally {
        if (active) setLoadingSlots(false);
      }
    };
    run();
    return () => { active = false; ctrl.abort(); };
  }, [modalData.selectedDate, modalData.duration_minutes, hasFutureSlots, astrologerId]);

  // ─────────────────────────────────────────────────────────────
  // Event handlers
  // ─────────────────────────────────────────────────────────────

  const handleSessionTypeChange = (t: 'videocall' | 'call' | 'chat') =>
    setModalData((p) => ({ ...p, consultation_type: t }));

  const handleDurationChange = (slot: ConsultationPrice) => {
    if (!slot?.duration?.slotDuration) return;
    setModalData((p) => ({
      ...p,
      price:            getCorrectPrice(slot.duration.slotDuration),
      duration_minutes: `${slot.duration.slotDuration}min`,
      selectedSlot:     null,
    }));
  };

  const handleDateSelect = async (date: string) => {
    setModalData((p) => ({ ...p, selectedDate: date, selectedSlot: null }));
    setShowAllSlots(false);
    await fetchSlots(date);
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setModalData((p) => ({ ...p, selectedSlot: slot }));
    setShowConsultationForm(true);
  };

  const handleConsultationFormChange  = (data: FormOutput) => setConsultationFormData(data);
  const handleFormValidationChange    = (valid: boolean)   => setIsFormValid(valid);

  const handleCustomerSessionChange = (session: CustomerSession | null) => {
    setCustomerSession(session);
    if (!session) {
      setIsFormValid(false);
      setIsNewCustomer(false);
      setGlobalOfferPrice(null);
    }
  };

  // ── Direct Booking (no payment) ───────────────────────────────
  const handleDirectBooking = async () => {
    if (!modalData.selectedSlot) { toaster.info({ text: 'Please select a slot first' }); return; }
    if (!customerSession)        { toaster.error({ text: 'Please login with customer phone number first' }); return; }
    if (!isFormValid)            { toaster.error({ text: 'Please fill all required customer details' }); return; }

    setIsBooking(true);
     const adminRes = await fetch(
          `/api/admin/me`,
          { method: 'GET', credentials: 'include' }   
        );
        if (adminRes.ok) {
          const adminData = await adminRes.json();
           const adminId = adminData?.userId ?? null;

          setAdminID(adminId)
          console.log('Admin fetched:', adminData?.username, '| ID:', adminId);
        }

    Swal.fire({
      title: 'Booking Consultation',
      html:  '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980d0d] mx-auto"></div><p class="mt-2">Please wait...</p>',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    try {
      const payload = {
        customerId:        customerSession.customerId,
        astrologerId,
        adminId:           adminID ,

        slotId:            modalData.selectedSlot._id,
        consultationType:  modalData.consultation_type,
        fullName:          consultationFormData?.fullName          ?? customerSession.customerName,
        mobileNumber:      consultationFormData?.mobileNumber      ?? customerSession.phoneNumber,
        dateOfBirth:       consultationFormData?.dateOfBirth       ?? '',
        timeOfBirth:       consultationFormData?.timeOfBirth       ?? '',
        placeOfBirth:      consultationFormData?.placeOfBirth      ?? '',
        gender:            consultationFormData?.gender            ?? '',
        latitude:          consultationFormData?.latitude          ?? 0,
        longitude:         consultationFormData?.longitude         ?? 0,
        consultationTopic: consultationFormData?.consultationTopic ?? 'Astrology Consultation',
        couponCode:        '',
        meetingId:         '',
        meetingPassword:   '',
      };

      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/book_without_payment`,
        {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify(payload),
        }
      );
      const data = await res.json();

      Swal.close();

      if (data.success) {
        await Swal.fire({
          icon:               'success',
          title:              'Booking Confirmed!',
          text:               'Consultation has been booked successfully.',
          confirmButtonColor: '#980d0d',
        });
        router.push('/my-booking');
      } else {
        throw new Error(data.message ?? 'Booking failed');
      }
    } catch (err: any) {
      Swal.close();
      toaster.error({ text: err.message ?? 'Booking failed. Please try again.' });
    } finally {
      setIsBooking(false);
    }
  };

  // ── Razorpay helpers (kept for future use) ────────────────────
  const createOrderAndSaveConsultation = async (payload: any) => {
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/customers/book_consultation_order`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) }
    );
    const data = await res.json();
    if (!data.status) throw new Error(data.message ?? 'Failed to create order');
    return data;
  };

  const verifyPaymentAndCompleteBooking = async (payload: any) => {
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/customers/verify_payment_and_complete_booking`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message ?? 'Verification failed');
    return data;
  };


  const getFilteredPrices = (): ConsultationPrice[] => {
    const sorted = [...consultationPrices].sort((a, b) => a.price - b.price);
    if (!availableDurations?.length) return sorted;
    return sorted.filter((p) => availableDurations.includes(p.duration.slotDuration));
  };

  const getAvailableSlots = (): AvailableSlot[] =>
    slotsData?.SlotTimeByDuration?.[modalData.duration_minutes] ?? [];

  const getDisplaySlots = (): AvailableSlot[] => {
    const all = getAvailableSlots().filter((s) => s.status === 'available');
    return showAllSlots ? all : all.slice(0, 8);
  };

  const hasValidCustomer = !!customerSession?.customerId;
  const isLinkDisabled = !modalData.selectedSlot || !isFormValid || !hasValidCustomer;
  const displaySlots = getDisplaySlots();
  const allAvailableSlots = getAvailableSlots().filter((s) => s.status === 'available');
  const hasMoreSlots = allAvailableSlots.length > 8;
  const filteredPrices = getFilteredPrices();
  const web_urls = process.env.NEXT_PUBLIC_IMAGE_URL



  if (loadingDurations) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px] flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980d0d]" />
        <span className="text-gray-600">Checking availability...</span>
      </div>
    );
  }

  if (hasFutureSlots === false) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Future Slots Available</h3>
          <p className="text-gray-500">This astrologer doesn't have any upcoming slots right now.</p>
          <button
            onClick={() => { hasCheckedAvailability.current = false; checkAvailableDurations(); }}
            className="mt-6 px-6 py-2 bg-[#980d0d] text-white rounded-lg hover:bg-[#7a0a0a] transition-colors"
          >
            Refresh Availability
          </button>
        </div>
      </div>
    );
  }

  if (!sessionTypes.length) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Consultation Modes Available</h3>
          <p className="text-gray-500">This astrologer is not available for any call type right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">

      {/* Header */}
      <div className="flex justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-[#980d0d] mb-1">Book Your Consultation</h2>
          <p className="text-sm text-gray-500 hidden lg:block">
            Get personalized astrological guidance in simple steps
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <img
            src={`${web_urls}${astrologerData.profileImage}`}
            alt={astrologerData.astrologerName}
            className="w-12 h-12 object-cover object-top rounded-full hover:scale-105 transition-transform cursor-pointer"
          />
          <span className="text-xs text-gray-500 hidden lg:block">{astrologerData.astrologerName}</span>
        </div>
      </div>

      {/* Payment pending banner */}
      {paymentLinkStatus?.status === 'pending' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm flex items-center gap-2">
            <span className="animate-pulse">⏳</span>
            Payment link active — waiting for customer payment...
          </p>
        </div>
      )}

      <div className="space-y-6">

        {/* ── Urgent / Normal toggle ── */}
        {isSpecialAstrologer && (
          <div className="inline-flex rounded-lg border-2 border-gray-300 bg-white p-1">
            {(['Normal', 'Urgent'] as const).map((label) => {
              const urgent = label === 'Urgent';
              const active = isUrgentBooking === urgent;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (active) return;
                    setIsUrgentBooking(urgent);
                    setModalData((p) => {
                      const dur   = parseInt(p.duration_minutes.replace('min', ''));
                      const price = urgent
                        ? (consultationPrices.find((cp) => cp.duration.slotDuration === dur)?.price ?? 199)
                        : (getSpecialPrice(dur) ?? SPECIAL_PRICING_CONFIG[String(dur)] ?? 199);
                      return { ...p, selectedDate: null, selectedSlot: null, price };
                    });
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    active ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 1: Session Type ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">1</div>
            <h3 className="text-base font-semibold text-gray-800">Select Session Type</h3>
          </div>
          <div className="grid gap-3 grid-cols-4">
            {sessionTypes.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSessionTypeChange(item.value)}
                disabled={isBooking}
                className={`flex flex-col items-center justify-center gap-2 px-4 p-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                  modalData.consultation_type === item.value
                    ? 'bg-[#980d0d] text-white border-[#980d0d] shadow-md'
                    : 'border-gray-300 text-gray-600 hover:border-[#980d0d] hover:bg-red-50'
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ── Step 2: Duration ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">2</div>
            <h3 className="text-base font-semibold text-gray-800">Choose Duration</h3>
          </div>
          {filteredPrices.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredPrices.map((slot, idx) => {
                const selected     = modalData.duration_minutes === `${slot.duration.slotDuration}min`;
                const displayPrice = getCorrectPrice(slot.duration.slotDuration);
                const hasDiscount  = displayPrice < slot.price;
                return (
                  <button
                    key={idx}
                    onClick={() => handleDurationChange(slot)}
                    disabled={isBooking}
                    className={`flex flex-col items-center justify-center px-4 p-1 rounded-lg border-2 transition-all text-sm disabled:opacity-50 ${
                      selected
                        ? 'bg-[#980d0d] text-white border-[#980d0d] shadow-md'
                        : 'border-gray-300 text-gray-700 hover:border-[#980d0d] hover:bg-green-50'
                    }`}
                  >
                    <span className="font-bold text-lg">{slot.duration.slotDuration} Min</span>
                    {hasDiscount && !isUrgentBooking && (
                      <span className="text-xs line-through opacity-75">₹{slot.price.toLocaleString('en-IN')}</span>
                    )}
                    <span className="font-semibold">₹{displayPrice.toLocaleString('en-IN')}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">No duration slots available</p>
          )}
        </div>

        {/* ── Step 3: Date & Time ── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <h3 className="text-base font-semibold text-gray-800">Select Date & Time Slot</h3>
            </div>
            {!isUrgentBooking && isSpecialAstrologer && (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg inline-flex items-center gap-2 w-fit text-xs sm:text-sm font-medium text-amber-700">
                ⚠️ Waiting Period: 30 Days
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Choose Date</label>
            {isSpecialAstrologer ? (
              <DatePickerSpecial
                selectedDate={modalData.selectedDate}
                astrologerId={astrologerId}
                onDateSelect={handleDateSelect}
                setSlotsError={setSlotsError}
                duration={parseInt(modalData.duration_minutes.replace('min', ''))}
                isUrgentMode={isUrgentBooking}
              />
            ) : (
              <DatePicker
                selectedDate={modalData.selectedDate}
                astrologerId={astrologerId}
                onDateSelect={handleDateSelect}
                setSlotsError={setSlotsError}
                duration={parseInt(modalData.duration_minutes.replace('min', ''))}
              />
            )}
          </div>

          {/* Time slots */}
          {modalData.selectedDate && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Available Time Slots</label>
                <span className="text-sm text-gray-500">{moment(modalData.selectedDate).format('DD MMM YYYY')}</span>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center gap-2 py-6 bg-gray-50 rounded-lg text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#980d0d]" />
                  Loading available times...
                </div>
              ) : slotsError ? (
                <div className="text-center py-6 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 mb-2">Failed to load slots</p>
                  <button
                    onClick={() => modalData.selectedDate && fetchSlots(modalData.selectedDate)}
                    className="px-4 py-2 bg-[#980d0d] text-white rounded-md text-sm hover:bg-[#7a0a0a]"
                  >
                    Try Again
                  </button>
                </div>
              ) : displaySlots.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {displaySlots.map((slot, idx) => {
                      const selected =
                        modalData.selectedSlot?.fromTime === slot.fromTime &&
                        modalData.selectedSlot?.toTime   === slot.toTime;
                      return (
                        <button
                          key={`${slot.fromTime}-${idx}`}
                          onClick={() => handleSlotSelect(slot)}
                          className={`px-3 py-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                            selected
                              ? 'bg-[#980d0d] text-white border-[#980d0d] shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[#980d0d] hover:bg-red-50'
                          }`}
                        >
                          <div className="text-center font-bold">{formatTime(slot.fromTime)}</div>
                        </button>
                      );
                    })}
                  </div>
                  {hasMoreSlots && !showAllSlots && (
                    <button
                      onClick={() => setShowAllSlots(true)}
                      className="w-full py-2 text-sm text-[#980d0d] font-medium hover:bg-red-50 rounded-lg border border-dashed border-[#980d0d]"
                    >
                      + {allAvailableSlots.length - 8} More Slots
                    </button>
                  )}
                  {hasMoreSlots && showAllSlots && (
                    <button
                      onClick={() => setShowAllSlots(false)}
                      className="w-full py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-dashed border-gray-400"
                    >
                      Show Less
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No {modalData.duration_minutes} slots for {moment(modalData.selectedDate).format('DD MMM YYYY')}</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different duration or date</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 4: Customer Details ── */}
        {showConsultationForm && modalData.selectedSlot && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">4</div>
              <h3 className="text-base font-semibold text-gray-800">Customer Details</h3>
            </div>
            <ConsultationForm
              onFormDataChange={handleConsultationFormChange}
              onValidationChange={handleFormValidationChange}
              onCustomerSessionChange={handleCustomerSessionChange}
              astrologerId={astrologerId}
            />
          </div>
        )}

        {/* ── Book Consultation Button (no payment) ── */}
        {showConsultationForm && modalData.selectedSlot && (
          <div className="mt-2">
            <button
              onClick={handleDirectBooking}
              disabled={isLinkDisabled || isBooking}
              className="w-full py-3 border-2 border-dashed border-[#980d0d] text-[#980d0d] rounded-lg font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {isBooking ? 'Booking...' : 'Book Consultation'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-1">
              Click to confirm and book the consultation
            </p>
          </div>
        )}

        {/* Hint messages */}
        {/* {isLinkDisabled && showConsultationForm && (
          <div className="text-xs text-gray-500 text-center space-y-0.5">
            {!hasValidCustomer && <div>→ Login with customer phone number first</div>}
            {!modalData.selectedSlot && <div>→ Select a date and time slot</div>}
            {!isFormValid && hasValidCustomer && <div>→ Fill all required fields in the form</div>}
          </div>
        )} */}

        {razorpayError && (
          <p className="text-xs text-red-500 text-center">Payment gateway error: {razorpayError}</p>
        )}

      </div>
    </div>
  );
};

export default BookingSection;