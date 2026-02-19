/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Calendar, CreditCard, IndianRupee, Phone, Video } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useRazorpay } from 'react-razorpay';
import Swal from 'sweetalert2';

import ConsultationForm from '@/components/form/consultationForm';
// import { trackConsultationEvent } from '@/utils/consultationTracking';
import { toaster } from '@/utils/services/toast-service';
import { createStripePayment } from '@/utils/stripe-payment';
import { AstrologerData, User as UserType } from '../types';
import DatePicker from './DatePicker';
import DatePickerSpecial from './DatePickerSpecial';
// import { createStripePayment, verifyStripePayment } from '@/utils/';


interface ConsultationPrice {
  price: number;
  duration: {
    slotDuration: number;
  };
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
  SlotTimeByDuration: {
    [key: string]: AvailableSlot[];
  };
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
  dateRange: {
    from: string;
    to: string;
  };
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

type PaymentMethod = 'razorpay' | 'stripe';

const getAvailableSessionTypes = (astrologerData: AstrologerData) => {
  const allTypes: SessionType[] = [
    { title: "Video Call", value: "videocall", icon: <Video size={24} /> },
    { title: "Voice Call", value: "call", icon: <Phone size={24} /> },
  ];

  return allTypes.filter(type => {
    if (type.value === 'videocall') {
      return astrologerData.video_call_status !== 'offline';
    }
    if (type.value === 'call') {
      return astrologerData.call_status !== 'offline';
    }
    return true;
  });
};

// Payment method options
const paymentMethods = [
  {
    id: 'razorpay' as PaymentMethod,
    name: 'Razorpay',
    icon: <IndianRupee size={20} />,
    description: 'UPI, Cards, Net Banking',
    // supportedMethods: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet']
  },
  {
    id: 'stripe' as PaymentMethod,
    name: 'Stripe',
    icon: <CreditCard size={20} />,
    description: 'International Cards',
    // supportedMethods: ['International Cards']
  }
];

// 🎯 PAYMENT LINK CREATE FUNCTION - YEH ADD KARO

const BookingSection: React.FC<BookingSectionProps> = ({
  astrologerId,
  astrologerData,
  onLoginRequired,
  consultationPrices
}) => {
  const router = useRouter();
  const { error: razorpayError, isLoading: razorpayLoading, Razorpay } = useRazorpay();
// Add state for urgent booking
const [isUrgentBooking, setIsUrgentBooking] = useState<boolean>(false);
// Check if current astrologer has special pricing enabled
const isSpecialAstrologer = astrologerData?.hasSpecialPricing === true;

// Get special pricing rates from astrologer data (keys are strings in DB)
const SPECIAL_PRICING_CONFIG = astrologerData?.specialPricingRates || {};

// Helper function to get special price
const getSpecialPrice = (duration: number): number | null => {
  // Keys are stored as strings in MongoDB Map
  return SPECIAL_PRICING_CONFIG[String(duration)] || null;
};

// FINAL CORRECTED: Handle urgent mode properly with first-time offers
const getCorrectPrice = (durationSlot: number): number => {
  // Find base consultation price
  const basePrice = consultationPrices.find(
    p => p.duration.slotDuration === durationSlot
  );
  
  if (!basePrice) return 199; // fallback

  // ===== URGENT MODE: Return base price immediately (no discounts) =====
  if (isUrgentBooking) {
    return basePrice.price;
  }

  // ===== NORMAL MODE: Apply pricing logic =====

  // Priority 1: Special Pricing (hasSpecialPricing) - ABSOLUTE PRIORITY
  // If special pricing exists, USE ONLY THAT - don't check anything else
  if (isSpecialAstrologer) {
    const specialPrice = getSpecialPrice(durationSlot);
    if (specialPrice !== null) {
      return specialPrice;
    }
  }

  // ===== If NO special pricing, then check other options for NEW CUSTOMERS =====
  
  // Array to collect applicable prices (only if NO special pricing)
  const applicablePrices: number[] = [];

  // Priority 2: Custom first-time pricing (from firstTimeOfferPrices array)
  if (isNewCustomer && 
      astrologerData?.GoWithCustomPricings === true && 
      astrologerData?.firstTimeOfferPrices && 
      astrologerData?.firstTimeOfferPrices?.length > 0) {
    const customOfferPrice = astrologerData.firstTimeOfferPrices.find(
      (offer: any) => offer.duration.slotDuration === durationSlot
    );
    
    if (customOfferPrice) {
      applicablePrices.push(customOfferPrice.price);
    }
  }

  // Priority 3: Global first-time offer price (15 min only, from check-new-customer API)
  if (isNewCustomer && 
      astrologerData?.useGlobalFirstTimeOfferPrice === true && 
      astrologerData?.GoWithCustomPricings === false &&
      astrologerData?.firstTimeOfferPrices?.length === 0 &&
      durationSlot === 15 &&
      globalOfferPrice !== null) {
    applicablePrices.push(globalOfferPrice);
  }

  // Priority 4: Base consultation price (always available)
  applicablePrices.push(basePrice.price);

  // Return MINIMUM of all applicable prices
  const finalPrice = Math.min(...applicablePrices);
  
  return finalPrice;
};


  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('razorpay');
  
  const sessionTypes = getAvailableSessionTypes(astrologerData);
  const [slotsData, setSlotsData] = useState<SlotsApiResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [hasFutureSlots, setHasFutureSlots] = useState<boolean | null>(null);
  const [showConsultationForm, setShowConsultationForm] = useState<boolean>(false);
  const [consultationFormData, setConsultationFormData] = useState<any>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [showAllSlots, setShowAllSlots] = useState<boolean>(false);
  const [pendingSlot, setPendingSlot] = useState<AvailableSlot | null>(null);
  const [availableDurations, setAvailableDurations] = useState<number[]>([]);
  const [loadingDurations, setLoadingDurations] = useState<boolean>(false);
  const [durationCounts, setDurationCounts] = useState<DurationCount[]>([]);
  // Add these new state variables after existing state declarations
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(false);
  const [globalOfferPrice, setGlobalOfferPrice] = useState<number | null>(null);
  const [checkingNewCustomer, setCheckingNewCustomer] = useState<boolean>(false);

  // Use ref to ensure API is called only once
  const hasCheckedAvailability = useRef(false);

  
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    return {
      _id: localStorage.getItem('customer_id') || '',
      name: localStorage.getItem('customer_name') || '',
      phone: localStorage.getItem('customer_phone') || '',
      email: localStorage.getItem('customer_email') || ''
    };
  };

  

  // const [modalData, setModalData] = useState<ModalData>(() => {
  //   if (!consultationPrices || consultationPrices.length === 0) {
  //     const defaultSessionType = sessionTypes.length > 0 ? sessionTypes[0].value : 'videocall';
      
  //     return {
  //       price: null,
  //       consultation_type: defaultSessionType,
  //       duration_minutes: '15min',
  //       selectedDate: null,
  //       selectedSlot: null,
  //     };
  //   }

  //   const minDurationData = consultationPrices.reduce(
  //     (min: ConsultationPrice, item: ConsultationPrice) => {
  //       return (item?.duration?.slotDuration || 0) < (min?.duration?.slotDuration || 0) ? item : min;
  //     }
  //   );

  //   const defaultSessionType = sessionTypes.length > 0 ? sessionTypes[0].value : 'videocall';

  //   return {
  //     price: minDurationData?.price || 199,
  //     consultation_type: defaultSessionType,
  //     duration_minutes: `${minDurationData?.duration?.slotDuration || 15}min`,
  //     selectedDate: null,
  //     selectedSlot: null,
  //   };
  // });
  const [modalData, setModalData] = useState<ModalData>(() => {
  if (!consultationPrices || consultationPrices.length === 0) {
    const defaultSessionType = sessionTypes.length > 0 ? sessionTypes[0].value : 'videocall';
    
    return {
      price: isSpecialAstrologer ? (getSpecialPrice(30) || null) : null,
      consultation_type: defaultSessionType,
      duration_minutes: '30min',
      selectedDate: null,
      selectedSlot: null,
    };
  }

  const minDurationData = consultationPrices.reduce(
    (min: ConsultationPrice, item: ConsultationPrice) => {
      return (item?.duration?.slotDuration || 0) < (min?.duration?.slotDuration || 0) ? item : min;
    }
  );


  const defaultSessionType = sessionTypes.length > 0 ? sessionTypes[0].value : 'videocall';

  // For special astrologer, default to 30min with special price
  const defaultDuration = isSpecialAstrologer ? 30 : (minDurationData?.duration?.slotDuration || 15);
const defaultPrice = isSpecialAstrologer 
  ? (getSpecialPrice(defaultDuration) || minDurationData?.price || 199)
  : (minDurationData?.price || 199);

  return {
    price: defaultPrice,
    consultation_type: defaultSessionType,
    duration_minutes: `${defaultDuration}min`,
    selectedDate: null,
    selectedSlot: null,
  };
});
  
// UPDATED: Force correct price on mount and when conditions change
useEffect(() => {
  if (!consultationPrices.length) return;
  
  const currentDuration = parseInt(modalData.duration_minutes.replace('min', ''));
  const correctPrice = getCorrectPrice(currentDuration);
  
  if (modalData.price !== correctPrice) {
    setModalData(prev => ({
      ...prev,
      price: correctPrice
    }));
  }
}, [
  isSpecialAstrologer, 
  isUrgentBooking, 
  modalData.duration_minutes, 
  consultationPrices,
  isNewCustomer,
  globalOfferPrice
]);

useEffect(() => {
    if (sessionTypes.length === 0) return;

    const currentTypeAvailable = sessionTypes.some(
      type => type.value === modalData.consultation_type
    );

    if (!currentTypeAvailable) {
      setModalData(prev => ({
        ...prev,
        consultation_type: sessionTypes[0].value
      }));
    }
  }, [sessionTypes, modalData.consultation_type]);

  // Add this useEffect to check if customer is new (for global offer pricing)
  useEffect(() => {
    const checkNewCustomerStatus = async () => {
      const currentUser:any = getCurrentUser();
      // if (!currentUser || !currentUser._id) {
      //   setIsNewCustomer(true);
      //   return;
      // }
      
      setCheckingNewCustomer(true);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/customers/check-new-customer`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: currentUser._id ,offerPriceActive : true })
          }
        );

        const data = await response.json();

        if (data.success && data.isNewCustomer) {
          setIsNewCustomer(true);
          if (data.hasOfferPrice) {
            setGlobalOfferPrice(data.offerPrice);
          }
        } else {
          setIsNewCustomer(false);
        }
      } catch (error) {
        console.error('Error checking new customer status:', error);
        setIsNewCustomer(false);
      } finally {
        setCheckingNewCustomer(false);
      }
    };

    checkNewCustomerStatus();
  }, [astrologerId]);

  // Fetch available durations ONLY ONCE on initial mount
  const checkAvailableDurations = async () => {
    if (!astrologerId || hasCheckedAvailability.current) return;

    try {
      setLoadingDurations(true);
      hasCheckedAvailability.current = true;

      const today = moment().format('YYYY-MM-DD');
      const currentTime = moment().format('HH:mm');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/slots/available?astrologerId=${astrologerId}&date=${today}&time=${currentTime}`
      );
      const data: AvailableSlotsApiResponse = await response.json();

      if (response.ok && data.success) {
        setAvailableDurations(data.availableDurations || []);
        setDurationCounts(data.durationCounts || []);
        setHasFutureSlots(data.totalSlots > 0);

        // Auto-select first available duration if current duration is not available
        if (data.availableDurations && data.availableDurations.length > 0) {
          const currentDuration = parseInt(modalData.duration_minutes.replace('min', ''));
          if (!data.availableDurations.includes(currentDuration)) {
            const firstAvailableDuration = data.availableDurations[0];
            const matchingPrice = consultationPrices.find(
              price => price.duration.slotDuration === firstAvailableDuration
            );
            if (matchingPrice) {
  let finalPrice = matchingPrice.price;
  
  // Apply special price for special astrologer in normal mode
  if (isSpecialAstrologer && !isUrgentBooking) {
    const specialPrice = getSpecialPrice(firstAvailableDuration);
    if (specialPrice !== null) {
      finalPrice = specialPrice;
    }
  }

  setModalData(prev => ({
    ...prev,
    duration_minutes: `${firstAvailableDuration}min`,
    price: finalPrice,
  }));
}

          }
        }
      } else {
        setHasFutureSlots(false);
        setAvailableDurations([]);
      }
    } catch (error) {
      console.error('Error checking available durations:', error);
      setHasFutureSlots(false);
      setAvailableDurations([]);
    } finally {
      setLoadingDurations(false);
    }
  };

  // Fetch slots for specific date
  const fetchAvailableSlots = async (date: string) => {
    if (!astrologerId || !date) return;

    try {
      setLoadingSlots(true);
      setSlotsError(null);
      setShowAllSlots(false);

      const duration = parseInt(modalData.duration_minutes.replace('min', ''));
      const currentTime = moment().format('HH:mm');
      const currentDate = new Date().toLocaleDateString('en-CA');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${currentDate}&duration=${duration}&currentTime=${currentTime}&date=${date}`
      );
      const data: SlotsApiResponse = await response.json();

      if (response.ok && data.SlotTimeByDuration) {
        const durationKey = `${duration}min`;
        let slots = data.SlotTimeByDuration[durationKey] || [];

        // Check if the selected date is today
        const today = new Date();
        const [year, month, day] = date.split('-').map(Number);
        const selectedDateObj = new Date(year, month - 1, day);
        const isToday = today.toDateString() === selectedDateObj.toDateString();

        if (isToday && slots.length > 0) {
          // Get current time in minutes from midnight
          const currentHours = today.getHours();
          const currentMinutes = today.getMinutes();
          const currentTimeInMinutes = currentHours * 60 + currentMinutes;

          // Add 15 minutes buffer
          const minimumTimeInMinutes = currentTimeInMinutes + 15;

          // Filter slots that are at least 15 minutes from now
          slots = slots.filter((slot) => {
            // Parse fromTime (format: "HH:MM")
            const [hours, minutes] = slot.fromTime.split(':').map(Number);
            const slotTimeInMinutes = hours * 60 + minutes;

            // Keep only slots that are at least 15 minutes from current time
            return slotTimeInMinutes >= minimumTimeInMinutes;
          });
        }

        // Update the SlotTimeByDuration with filtered slots
        const updatedData = {
          ...data,
          SlotTimeByDuration: {
            ...data.SlotTimeByDuration,
            [durationKey]: slots
          }
        };

        setSlotsData(updatedData);
      } else {
        setSlotsError('Failed to fetch available slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlotsError('Network error while fetching slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Call ONLY ONCE on mount to check available durations
  useEffect(() => {
    checkAvailableDurations();
  }, [astrologerId]);

  const handleSessionTypeChange = (sessionType: 'videocall' | 'call' | 'chat'): void => {
    setModalData({ ...modalData, consultation_type: sessionType });
  };

  // UPDATED: handleDurationChange to use new pricing logic
const handleDurationChange = (slot: ConsultationPrice): void => {
  if (slot?.duration?.slotDuration && slot?.price) {
    const finalPrice = getCorrectPrice(slot.duration.slotDuration);
    
    setModalData({
      ...modalData,
      price: finalPrice,
      duration_minutes: `${slot.duration.slotDuration}min`,
      selectedSlot: null,
    });
  }
};
const handleCreatePaymentLink = async () => {
  // Validation
  if (!modalData?.selectedSlot) {
    toaster.info({ text: "Please select a slot first" });
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser._id) {
    onLoginRequired();
    return;
  }

  if (!isFormValid) {
    toaster.error({ text: "Please fill customer details first" });
    return;
  }

  // Show loading
  Swal.fire({
    title: 'Creating Payment Link',
    html: '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980d0d] mx-auto"></div><p class="mt-2">Please wait...</p>',
    allowOutsideClick: false,
    showConfirmButton: false
  });

  try {
    // Calculate correct price
    const currentDuration = parseInt(modalData.duration_minutes.replace('min', ''));
    const finalPrice = getCorrectPrice(currentDuration);

    // Prepare payload
    const payload = {
      amount: finalPrice,
      astrologerId,
      slotId: modalData.selectedSlot._id,
      consultationType: modalData.consultation_type,
      duration: modalData.selectedSlot.duration,
      customerName: consultationFormData.fullName,
      customerPhone: consultationFormData.mobileNumber,
      customerEmail: consultationFormData.email || '',
      consultationTopic: consultationFormData.consultationTopic || 'Consultation',
      createdBy: {
        userId: currentUser._id,
        userType: 'customer'
      }
    };

    console.log('📤 Creating payment link with payload:', payload);

    // API call
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/customers/payment-link/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    console.log('📥 Payment link response:', data);
    
    Swal.close();

    if (data.success) {
      // ✅ Payment link created - show share modal
      await showShareModal(data.paymentLink, data.consultationLogId);
    } else {
      throw new Error(data.message || 'Failed to create payment link');
    }

  } catch (error: any) {
    Swal.close();
    console.error('❌ Payment link creation error:', error);
    toaster.error({ 
      text: error.message || 'Failed to create payment link. Please try again.' 
    });
  }
};

// 🎯 SHARE MODAL FUNCTION - YEH BHI ADD KARO
const showShareModal = async (paymentLink: string, consultationLogId: string) => {
  // WhatsApp share URL
  const whatsappText = encodeURIComponent(
    `🔮 *Astrology Consultation Payment Link*\n\n` +
    `Hello! Please complete your payment for the astrology consultation.\n\n` +
    `💰 Amount: ₹${modalData.price}\n` +
    `📞 Astrologer: ${astrologerData.astrologerName}\n` +
    `🕐 Duration: ${modalData.duration_minutes}\n\n` +
    `Click here to pay: ${paymentLink}\n\n` +
    `Thank you! 🙏`
  );
  
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
  
  // SMS text
  const smsText = encodeURIComponent(
    `Pay for astrology consultation: ${paymentLink} Amount: ₹${modalData.price}`
  );
  const smsUrl = `sms:?body=${smsText}`;
  
  // Email text
  const emailSubject = encodeURIComponent('Astrology Consultation Payment Link');
  const emailBody = encodeURIComponent(
    `Dear Customer,\n\n` +
    `Please complete your payment for the astrology consultation.\n\n` +
    `Astrologer: ${astrologerData.astrologerName}\n` +
    `Amount: ₹${modalData.price}\n` +
    `Duration: ${modalData.duration_minutes}\n\n` +
    `Payment Link: ${paymentLink}\n\n` +
    `After payment, your consultation will be confirmed automatically.\n\n` +
    `Thank you!`
  );
  const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  // Show SweetAlert modal with sharing options
  Swal.fire({
    title: '✅ Payment Link Created!',
    html: `
      <div class="text-left">
        <p class="text-sm text-gray-600 mb-3">Share this link with customer:</p>
        
        <!-- Link Box -->
        <div class="bg-gray-100 p-3 rounded-lg mb-4">
          <div class="flex items-center justify-between gap-2">
            <input 
              type="text" 
              value="${paymentLink}" 
              readonly 
              class="bg-transparent text-sm w-full outline-none"
              id="paymentLinkInput"
            />
            <button 
              onclick="navigator.clipboard.writeText('${paymentLink}').then(() => { Swal.clickConfirm() })" 
              class="text-[#980d0d] hover:text-[#7a0a0a] font-medium text-sm whitespace-nowrap"
            >
              Copy
            </button>
          </div>
        </div>
        
        <!-- Share Options -->
        <p class="text-sm font-medium text-gray-700 mb-2">Share via:</p>
        <div class="flex gap-3 justify-center">
          <!-- WhatsApp -->
          <a 
            href="${whatsappUrl}" 
            target="_blank" 
            class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-center transition-all"
          >
            <svg class="w-5 h-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.09.58 4.13 1.69 5.93L2 22l4.33-1.77c1.74.98 3.73 1.5 5.78 1.5 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm.02 18.09c-1.79 0-3.54-.5-5.06-1.44l-.36-.22-2.57 1.06.89-2.49-.24-.38c-1.07-1.62-1.64-3.51-1.64-5.48 0-5.01 4.08-9.09 9.09-9.09s9.09 4.08 9.09 9.09-4.08 9.09-9.09 9.09zm4.97-6.79c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.62.13-.19.26-.73.88-.9 1.06-.17.18-.33.2-.6.07-.27-.13-1.15-.43-2.2-1.37-.81-.73-1.36-1.63-1.52-1.9-.16-.27-.02-.42.12-.56.13-.13.27-.33.4-.5.13-.17.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.62-1.5-.85-2.05-.22-.54-.45-.47-.62-.48-.16-.01-.35-.01-.54-.01s-.5.07-.76.34c-.27.27-1.02 1-1.02 2.44 0 1.44 1.05 2.83 1.2 3.02.15.19 2.07 3.16 5.02 4.33.7.28 1.25.45 1.68.58.71.21 1.35.18 1.86.11.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.18-1.42-.07-.13-.25-.2-.52-.33z"/>
            </svg>
            WhatsApp
          </a>
          
          <!-- SMS -->
          <a 
            href="${smsUrl}" 
            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-center transition-all"
          >
            <svg class="w-5 h-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z"/>
            </svg>
            SMS
          </a>
          
          <!-- Email -->
          <a 
            href="${emailUrl}" 
            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg text-center transition-all"
          >
            <svg class="w-5 h-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Email
          </a>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    width: '500px',
    customClass: {
      popup: 'rounded-xl'
    }
  });
};



  // const handleDurationChange = (slot: ConsultationPrice): void => {
  //   if (slot?.duration?.slotDuration && slot?.price) {
  //     setModalData({
  //       ...modalData,
  //       price: slot.price,
  //       duration_minutes: `${slot.duration.slotDuration}min`,
  //       selectedSlot: null,
  //     });
  //   }
  // };

  const handleDateSelect = async (date: string) => {
    setModalData(prev => ({
      ...prev,
      selectedDate: date,
      selectedSlot: null
    }));
    setShowAllSlots(false);
    await fetchAvailableSlots(date);
  };

  const handleSlotSelect = (slot: AvailableSlot): void => {
    setModalData((prev) => ({ ...prev, selectedSlot: slot }));
    setShowConsultationForm(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);

    if (pendingSlot) {
      setModalData((prev) => ({ ...prev, selectedSlot: pendingSlot }));
      setShowConsultationForm(true);
      setPendingSlot(null);
    }
  };

  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };

  const handleConsultationFormChange = (data: any) => {
    setConsultationFormData(data);
  };

  const handleFormValidationChange = (isValid: boolean) => {
    setIsFormValid(isValid);
  };

  // Fetch slots when date or duration changes
  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    const fetchSlots = async () => {
      if (!astrologerId || !modalData.selectedDate || !hasFutureSlots) return;

      try {
        setLoadingSlots(true);
        setSlotsError(null);
        setShowAllSlots(false);

        const duration = parseInt(modalData.duration_minutes.replace('min', ''));
        const currentTime = moment().format('HH:mm');
        const currentDate = new Date().toLocaleDateString('en-CA');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${currentDate}&duration=${duration}&currentTime=${currentTime}&date=${modalData.selectedDate}`,
          { signal: abortController.signal }
        );

        if (!isActive) return;

        const data: SlotsApiResponse = await response.json();

        if (!isActive) return;

        if (response.ok && data.SlotTimeByDuration) {
          const durationKey = `${duration}min`;
          let slots = data.SlotTimeByDuration[durationKey] || [];

          // Check if the selected date is today
          const today = new Date();
          const [year, month, day] = modalData.selectedDate.split('-').map(Number);
          const selectedDateObj = new Date(year, month - 1, day);
          const isToday = today.toDateString() === selectedDateObj.toDateString();

          if (isToday && slots.length > 0) {
            const currentHours = today.getHours();
            const currentMinutes = today.getMinutes();
            const currentTimeInMinutes = currentHours * 60 + currentMinutes;
            const minimumTimeInMinutes = currentTimeInMinutes + 15;

            slots = slots.filter((slot) => {
              const [hours, minutes] = slot.fromTime.split(':').map(Number);
              const slotTimeInMinutes = hours * 60 + minutes;
              return slotTimeInMinutes >= minimumTimeInMinutes;
            });
          }

          const updatedData = {
            ...data,
            SlotTimeByDuration: {
              ...data.SlotTimeByDuration,
              [durationKey]: slots
            }
          };

          if (isActive) {
            setSlotsData(updatedData);
          }
        } else {
          if (isActive) {
            setSlotsError('Failed to fetch available slots');
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error('Error fetching slots:', error);
        if (isActive) {
          setSlotsError('Network error while fetching slots');
        }
      } finally {
        if (isActive) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [modalData.selectedDate, modalData.duration_minutes, hasFutureSlots, astrologerId]);

  const createOrderAndSaveConsultation = async (orderPayload: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/book_consultation_order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
           credentials: 'include', 
          body: JSON.stringify(orderPayload)
        }
      );

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPaymentAndCompleteBooking = async (verificationPayload: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/verify_payment_and_complete_booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verificationPayload)
        }
      );

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Payment verification failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async (orderPayload: any) => {
    const orderResponse = await createOrderAndSaveConsultation(orderPayload);

    if (!orderResponse.status) {
      throw new Error('Failed to create order');
    }

    const consultationLogId = orderResponse.consultationLogId;

    const razorpayOptions = {
      key: orderResponse.key_id,
      amount: orderResponse.data.amount,
      currency: orderResponse.data.currency,
      name: orderPayload.fullName,
      description: orderPayload.consultationTopic || 'Astrology Consultation',
      order_id: orderResponse.data.id,

      handler: async (response: any) => {
        await handlePaymentSuccess(response, consultationLogId, 'razorpay');
      },

      modal: {
        ondismiss: function () {
          setIsBooking(false);
          Swal.close();
          toaster.info({ text: 'Payment cancelled.' });
        },
        escape: true,
        backdropclose: true,
        confirm_close: false
      },

      prefill: {
        name: orderPayload.fullName,
        email: orderPayload.email,
        contact: orderPayload.mobileNumber,
      },

      theme: {
        color: '#980d0d',
      },
    };

    const razorpayInstance = new Razorpay(razorpayOptions);

    razorpayInstance.on('payment.failed', function (response: any) {
      setIsBooking(false);
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: response.error.description || 'Payment could not be processed. Please try again.',
        confirmButtonColor: '#980d0d'
      });
    });

    razorpayInstance.open();
  };

// Stripe payment handler - UPDATED VERSION
// const handleStripePayment = async (orderPayload: any) => {
//   // Show loading immediately
//   Swal.fire({
//     title: 'Processing Your Booking',
//     html: `
//       <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
//         <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-[#980d0d]"></div>
//         <p style="color: #666; font-size: 14px;">Preparing your payment...</p>
//       </div>
//     `,
//     allowOutsideClick: false,
//     allowEscapeKey: false,
//     showConfirmButton: false,
//     background: '#fff',
//     customClass: {
//       popup: 'rounded-xl shadow-2xl'
//     }
//   });

//   try {
//     // First create the consultation order
//     const orderResponse = await createOrderAndSaveConsultation(orderPayload);

//     if (!orderResponse.status) {
//       throw new Error('Failed to create order');
//     }

//     const consultationLogId = orderResponse.consultationLogId;

//     // Create Stripe payment
//     // const stripePayload = {
//     //   amount: orderPayload.amount,
//     //   customerId: orderPayload.customerId,
//     //   consultationLogId: consultationLogId,
//     //   consultationTopic: orderPayload.consultationTopic,
//     //   customerName: orderPayload.fullName,
//     //   customerEmail: orderPayload.email,
//     //   customerPhone: orderPayload.mobileNumber,
//     //   astrologerId: orderPayload.astrologerId,
//     //   slotId: orderPayload.slotId,
//     //   consultationType: orderPayload.consultationType
//     // };
//       const stripePayload = {
//       amount: orderPayload.amount,
//       customerId: orderPayload.customerId,
//       consultationLogId: consultationLogId,
//       consultationTopic: orderPayload.consultationTopic,
//       customerName: orderPayload.fullName,
//       customerEmail: orderPayload.email,
//       customerPhone: orderPayload.mobileNumber,
//       astrologerId: orderPayload.astrologerId,
//       slotId: orderPayload.slotId,
//       consultationType: orderPayload.consultationType,
//       // ✅ Existing address data use karo
//       placeOfBirth: consultationFormData.placeOfBirth || 'India'
//     };
//     const stripeResponse = await createStripePayment(stripePayload);

//     if (!stripeResponse.success) {
//       throw new Error(stripeResponse.message || 'Failed to create Stripe payment');
//     }

//     // Close loading Swal
//     Swal.close();

//     // NEW METHOD: Redirect to Stripe Checkout
//     window.location.href = stripeResponse.sessionUrl;
    
//     // Agar sessionUrl nahi hai toh manually redirect karo
//     // if (!stripeResponse.sessionUrl) {
//     //   window.location.href = `https://checkout.stripe.com/pay/${stripeResponse.sessionId}`;
//     // }

//   } catch (error: any) {
//     Swal.close();
//     throw error;
//   }
// };
// Stripe payment handler - NO STRIPE.JS AT ALL
// Stripe payment handler - PURE BROWSER REDIRECT
const handleStripePayment = async (orderPayload: any) => {
  // Show loading
  Swal.fire({
    title: 'Processing Your Booking',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-[#980d0d]"></div>
        <p style="color: #666; font-size: 14px;">Preparing your payment...</p>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });

  try {
    // Create consultation order
    const orderResponse = await createOrderAndSaveConsultation(orderPayload);

    if (!orderResponse.status) {
      throw new Error('Failed to create order');
    }

    const consultationLogId = orderResponse.consultationLogId;

    // Create Stripe payment
    const stripePayload = {
      amount: orderPayload.amount,
      customerId: orderPayload.customerId,
      consultationLogId: consultationLogId,
      consultationTopic: orderPayload.consultationTopic,
      customerName: orderPayload.fullName,
      customerEmail: orderPayload.email,
      customerPhone: orderPayload.mobileNumber,
      astrologerId: orderPayload.astrologerId,
      slotId: orderPayload.slotId,
      consultationType: orderPayload.consultationType
    };

    const stripeResponse = await createStripePayment(stripePayload);

    if (!stripeResponse.success) {
      throw new Error(stripeResponse.message || 'Failed to create Stripe payment');
    }

    // Close loading
    Swal.close();

    // ✅ PURE BROWSER REDIRECT - NO STRIPE.JS, NO getStripe
    window.location.href = stripeResponse.sessionUrl;

  } catch (error: any) {
    Swal.close();
    console.error('Stripe payment error:', error);
    toaster.error({ 
      text: error.message || 'Failed to process Stripe payment' 
    });
  }
};
  // Common payment success handler
  const handlePaymentSuccess = async (paymentResponse: any, consultationLogId: string, method: PaymentMethod) => {
    Swal.fire({
      title: 'Confirming Your Booking',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-[#980d0d]"></div>
          <p style="color: #666; font-size: 14px;">Please wait while we confirm your booking...</p>
          <p style="color: #999; font-size: 12px;">Do not close this window</p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#fff',
      customClass: {
        popup: 'rounded-xl shadow-2xl'
      }
    });

    try {
      let verificationResult;

      if (method === 'razorpay') {
        const verificationPayload = {
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          consultationLogId: consultationLogId,
        };

        verificationResult = await verifyPaymentAndCompleteBooking(verificationPayload);
      } else {
        // For Stripe, we'll handle verification via the success page
        // For now, we'll assume success and complete the booking
        verificationResult = { 
          success: true, 
          consultation: { 
            _id: consultationLogId,
            consultationTopic: consultationFormData.consultationTopic || 'Consultation',
            consultationPrice: modalData.price
          } 
        };
      }

      if (verificationResult.success) {
        setIsBooking(false);
        Swal.close();
        
        // trackConsultationEvent("purchase", {
        //   consultationName: verificationResult.consultation?.consultationTopic || 'Consultation',
        //   consultationId: verificationResult.consultation?._id || consultationLogId,
        //   price: Number(verificationResult.consultation?.consultationPrice) || modalData.price || 0,
        //   orderId: paymentResponse.razorpay_payment_id || consultationLogId,
        //   consultantName: astrologerData.astrologerName || "",
        //   // paymentMethod: method
        // });

        await Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: 'Your consultation has been booked successfully.',
          confirmButtonColor: '#980d0d'
        });

        router.push('/my-booking');
      } else {
        throw new Error(verificationResult.message || 'Failed to complete booking');
      }
    } catch (error: any) {
      console.error('Error in payment verification:', error);
      setIsBooking(false);
      Swal.close();

      await Swal.fire({
        icon: 'warning',
        title: 'Processing Issue',
        html: `
          <p>Your payment was successful but we're having trouble completing your booking.</p>
          <p><strong>Reference ID:</strong> ${paymentResponse.razorpay_payment_id || consultationLogId}</p>
          <p>Don't worry! Please contact our support team with this reference ID, or check your bookings page in a few minutes.</p>
        `,
        confirmButtonColor: '#980d0d'
      });
    }
  };

  // Main booking handler
  const handleBookNow = async (): Promise<void> => {
    // ✅ Calculate the correct price first
    const currentDuration = parseInt(modalData.duration_minutes.replace('min', ''));
    const finalPrice = getCorrectPrice(currentDuration);

    // trackConsultationEvent("checkout_initiated", {
    //   consultationName: consultationFormData.consultationTopic || '',
    //   consultationId: "",
    //   price: finalPrice, // ✅ Use finalPrice instead of modalData.price
    //   consultantName: astrologerData.astrologerName,
    //   // paymentMethod: selectedPaymentMethod
    // });

    if (!modalData?.selectedSlot) {
      toaster.info({ text: "Please select a slot first" });
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser._id) {
      onLoginRequired();
      return;
    }

    if (!isFormValid) {
      toaster.error({ text: "Please fill in all required consultation details" });
      return;
    }

    setIsBooking(true);

    try {
      // Common order payload for both payment methods
      const orderPayload = {
        amount: finalPrice, // ✅ Use finalPrice instead of modalData.price
        customerId: currentUser._id,
        astrologerId,
        slotId: modalData.selectedSlot._id,
        consultationType: modalData.consultation_type,
        fullName: consultationFormData.fullName,
        mobileNumber: consultationFormData.mobileNumber,
        email: consultationFormData.email || '',
        dateOfBirth: consultationFormData.dateOfBirth || '',
        timeOfBirth: consultationFormData.timeOfBirth || '',
        placeOfBirth: consultationFormData.placeOfBirth || '',
        gender: consultationFormData.gender || '',
        consultationTopic: consultationFormData.consultationTopic || 'Consultation',
        couponCode: '',
        latitude: consultationFormData.latitude,
        longitude: consultationFormData.longitude,
        duration: modalData.selectedSlot.duration,
        startTime: moment
          .utc(`${modalData.selectedDate} ${modalData.selectedSlot.fromTime}`, 'YYYY-MM-DD HH:mm')
          .toISOString(),
        dontKnowBirthDate: consultationFormData.dontKnowBirthDate || false,
        source: process.env.NEXT_PUBLIC_Hashed_Token || 'web',
        dontKnowBirthTime: consultationFormData.dontKnowBirthTime || false,
        paymentMethod: selectedPaymentMethod
      };

      if (selectedPaymentMethod === 'razorpay') {
        await handleRazorpayPayment(orderPayload);
      } else {
        await handleStripePayment(orderPayload);
      }

    } catch (error: any) {
      console.error('Error in booking process:', error);
      setIsBooking(false);
      Swal.close();
      
      toaster.error({ 
        text: error.message || 'Failed to initiate booking. Please try again.' 
      });
    }
  };


  const getFilteredConsultationPrices = () => {
    if (!availableDurations || availableDurations.length === 0) {
      return consultationPrices.sort((a, b) => a.price - b.price);
    }
    return consultationPrices
      .filter(price => availableDurations.includes(price.duration.slotDuration))
      .sort((a, b) => a.price - b.price);
  };

  const getAvailableSlots = (): AvailableSlot[] => {
    if (!slotsData?.SlotTimeByDuration) return [];

    const durationKey = modalData.duration_minutes;
    return slotsData.SlotTimeByDuration[durationKey] || [];
  };

  const getDisplaySlots = (): AvailableSlot[] => {
    const availableSlots = getAvailableSlots().filter(slot => slot.status === 'available');

    if (showAllSlots) {
      return availableSlots;
    }

    return availableSlots.slice(0, 8);
  };

  const currentUser = getCurrentUser();
  const hasValidUser = currentUser && currentUser._id;
  const isButtonDisabled = !modalData.selectedSlot || !isFormValid || isBooking || !hasValidUser;

  const displaySlots = getDisplaySlots();
  const availableSlots = getAvailableSlots().filter(slot => slot.status === 'available');
  const hasMoreSlots = availableSlots.length > 8;
  const filteredPrices = getFilteredConsultationPrices();

  // Skeleton for duration buttons
  const DurationSkeleton = () => (
    <div className="grid grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-200 rounded-lg h-20 border-2 border-gray-200"
        />
      ))}
    </div>
  );

  if (loadingDurations) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980d0d]"></div>
          <span className="ml-3 text-gray-600">Checking availability...</span>
        </div>
      </div>
    );
  }

  if (hasFutureSlots === false) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Future Slots Available
          </h3>
          <p className="text-gray-500 mb-4">
            This astrologer doesn't have any future slots available for booking right now.
          </p>

          <button
            onClick={() => {
              hasCheckedAvailability.current = false;
              checkAvailableDurations();
            }}
            className="mt-6 px-6 py-2 bg-[#980d0d] text-white rounded-lg hover:bg-[#7a0a0a] transition-colors"
          >
            Refresh Availability
          </button>
        </div>
      </div>
    );
  }

  if (sessionTypes.length === 0) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No consultation modes are currently available for this astrologer.
          </h3>
          <p className="text-gray-500 mb-4">
            This astrologer is not available for any video or voice call at this time.
          </p>

          <button
            onClick={() => {
              hasCheckedAvailability.current = false;
              checkAvailableDurations();
            }}
            className="mt-6 px-6 py-2 bg-[#980d0d] text-white rounded-lg hover:bg-[#7a0a0a] transition-colors"
          >
            Refresh Availability
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
    <div className="mb-6 pb-1 lg:pb-4 border-b border-gray-200">
      <h2 className="text-xl font-bold text-[#980d0d] mb-1">Book Your Consultation</h2>
      <p className="text-sm text-gray-500 hidden lg:inline-block">Get personalized astrological guidance in simple steps</p>
    </div>

    <div className="space-y-6">
      
      {/* ========== URGENT BOOKING SECTION ========== */}
      {isSpecialAstrologer && (
        <div className="inline-flex rounded-lg border-2 border-gray-300 bg-white p-1">
              <button
                onClick={() => {
                  if (isUrgentBooking) {
                    setIsUrgentBooking(false);
                    setModalData(prev => ({
                      ...prev,
                      selectedDate: null,
                      selectedSlot: null,
                      price: getSpecialPrice(30) || SPECIAL_PRICING_CONFIG[30]
                    }));
                  }
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  !isUrgentBooking
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => {
                  if (!isUrgentBooking) {
                    setIsUrgentBooking(true);
                    setModalData(prev => ({
                      ...prev,
                      selectedDate: null,
                      selectedSlot: null,
                      price: (() => {
                        const currentDuration = parseInt(prev.duration_minutes.replace('min', ''));
                        return consultationPrices.find(p => p.duration.slotDuration === currentDuration)?.price || 199;
                      })()
                    }));
                  }
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  isUrgentBooking
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Urgent
              </button>
            </div>
      )}

      {/* ========== END OF URGENT BOOKING SECTION ========== */}

      {/* Session Type Selection - NO CHANGES */}
      <div className='space-y-3'>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">
            1
          </div>
          <h3 className="text-base font-semibold text-gray-800">Select Session Type</h3>
        </div>

        {sessionTypes.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">
              No consultation modes are currently available for this astrologer.
            </p>
          </div>
        ) : (
          <div className={`grid gap-3 grid-cols-4`}>
            {sessionTypes.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSessionTypeChange(item.value)}
                disabled={isBooking}
                className={`flex flex-col items-center justify-center gap-2 px-4 p-3 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 ${
                  modalData.consultation_type === item.value
                    ? "bg-[#980d0d] text-white border-[#980d0d] shadow-md"
                    : "border-gray-300 text-gray-600 hover:border-[#980d0d] hover:bg-red-50"
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========== MODIFIED: Duration Selection ========== */}
      <div className='space-y-3'>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">
            2
          </div>
          <h3 className="text-base font-semibold text-gray-800">Choose Duration</h3>
        </div>

        {loadingDurations ? (
          <DurationSkeleton />
        ) : filteredPrices.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {filteredPrices.map((slot, index) => {
            const isSelected = modalData.duration_minutes === `${slot.duration.slotDuration}min`;
            
            // ✅ Use getCorrectPrice instead of manual calculation
            const displayPrice = getCorrectPrice(slot.duration.slotDuration);
            const hasDiscount = displayPrice < slot.price;

            return (
              <button
                key={index}
                onClick={() => handleDurationChange(slot)}
                disabled={isBooking}
                className={`relative flex flex-col items-center justify-center px-4 p-1 rounded-lg border-2 transition-all duration-300 text-sm disabled:opacity-50 ${
                  isSelected
                    ? "bg-[#980d0d] text-white border-[#980d0d] shadow-md"
                    : "border-gray-300 text-gray-700 hover:border-[#980d0d] hover:bg-green-50"
                }`}
              >
                <span className='font-bold text-lg'>{slot.duration.slotDuration} Min</span>
                
                {/* Show original price if there's a discount */}
                {hasDiscount && !isUrgentBooking && (
                  <span className="text-xs line-through opacity-75">
                    ₹{slot.price.toLocaleString('en-IN')}
                  </span>
                )}
                
                {/* Display final price */}
                <span className="font-semibold">₹{displayPrice.toLocaleString('en-IN')}</span>
              </button>
            );
          })}

          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No duration slots available</p>
          </div>
        )}
      </div>

      {/* ========== MODIFIED: Date & Time Selection ========== */}
      <div className='space-y-3'>
<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
  {/* Step number and title */}
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
      3
    </div>
    <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap">
      Select Date & Time Slot
    </h3>
  </div>
  
  {/* Waiting Period Badge - Mobile pe bhi same line mein */}
  {!isUrgentBooking && isSpecialAstrologer && (
    <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg inline-flex items-center gap-2 flex-shrink-0 mt-0 sm:mt-0 w-fit">
      <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd"/>
      </svg>
      <span className="text-xs sm:text-sm font-medium text-amber-700 whitespace-nowrap">
        Waiting Period: 30 Days
      </span>
    </div>
  )}
</div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Choose Date</label>
          
          {/* ========== CHANGED: Conditional DatePicker component ========== */}
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

        {/* Time slots section - NO CHANGES */}
        {modalData.selectedDate && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Available Time Slots</label>
              {slotsData && (
                <span className="text-sm text-gray-500">
                  {moment(modalData.selectedDate).format('DD MMM YYYY')}
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-4 justify-center bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#980d0d]"></div>
                Loading available times...
              </div>
            ) : !slotsError && displaySlots.length > 0 ? (
              <>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {!slotsError && displaySlots.map((slot, idx) => {
                    const isSelected = modalData.selectedSlot &&
                      modalData.selectedSlot.fromTime === slot.fromTime &&
                      modalData.selectedSlot.toTime === slot.toTime;

                    const formatTime = (time: string) => {
                      const [hours, minutes] = time.split(':');
                      const hour = parseInt(hours, 10);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const hour12 = hour % 12 || 12;
                      return `${hour12}:${minutes} ${ampm}`;
                    };

                    return (
                      <button
                        key={`${slot.fromTime}-${slot.toTime}-${idx}`}
                        onClick={() => handleSlotSelect(slot)}
                        className={`px-3 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${isSelected
                          ? "bg-[#980d0d] text-white border-[#980d0d] shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-[#980d0d] hover:bg-red-50"
                          }`}
                      >
                        <div className="text-center">
                          <div className="font-bold">
                            {formatTime(slot.fromTime)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!slotsError && hasMoreSlots && !showAllSlots && (
                  <button
                    onClick={() => setShowAllSlots(true)}
                    className="w-full py-2 text-sm text-[#980d0d] font-medium hover:bg-red-50 rounded-lg transition-colors border border-dashed border-[#980d0d]"
                  >
                    + {availableSlots.length - 8} More Slots
                  </button>
                )}

                {!slotsError && showAllSlots && hasMoreSlots && (
                  <button
                    onClick={() => setShowAllSlots(false)}
                    className="w-full py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors border border-dashed border-gray-400"
                  >
                    Show Less
                  </button>
                )}
              </>
            ) : slotsError ? (
              <div className="text-center py-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 mb-2">Failed to load available slots</p>
                <button
                  onClick={() => modalData.selectedDate && fetchAvailableSlots(modalData.selectedDate)}
                  className="mt-3 px-4 py-2 bg-[#980d0d] text-white rounded-md hover:bg-[#7a0a0a] transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  No {modalData.duration_minutes} slots available for {moment(modalData.selectedDate).format('DD MMM YYYY')}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try selecting a different duration or date
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consultation Form - NO CHANGES */}
      {showConsultationForm && modalData.selectedSlot && (
        <div className='space-y-3'>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">
              4
            </div>
            <h3 className="text-base font-semibold text-gray-800">Your Details</h3>
          </div>

          <div className="">
            <ConsultationForm
              onFormDataChange={handleConsultationFormChange}
              onValidationChange={handleFormValidationChange}
              astrologerId={astrologerId}
            />
          </div>
        </div>
      )}

      {showConsultationForm && modalData.selectedSlot && (
  <div className="mt-2">
    <button
      onClick={handleCreatePaymentLink}
      disabled={!isFormValid || !hasValidUser || isBooking}
      className="w-full py-3 border-2 border-dashed border-[#980d0d] text-[#980d0d] rounded-lg font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      Generate Payment Link to Share
    </button>
    <p className="text-xs text-gray-500 text-center mt-1">
      Create a link to share with customer for payment
    </p>
  </div>
)}

{/* Book Consultation Button - Already hai */}
<button
  onClick={handleBookNow}
  disabled={isButtonDisabled}
  className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
    isButtonDisabled
      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
      : 'bg-[#980d0d] text-white hover:bg-[#7a0a0a]'
  }`}
>
  {/* ... */}
</button>

        {/* Payment Method Selection */}
        {showConsultationForm && modalData.selectedSlot && (
          <div className='space-y-3'>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">
                5
              </div>
              <h3 className="text-base font-semibold text-gray-800">Choose Payment Method</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  disabled={isBooking}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 ${
                    selectedPaymentMethod === method.id
                      ? "bg-[#980d0d] text-white border-[#980d0d] shadow-md"
                      : "border-gray-300 text-gray-600 hover:border-[#980d0d] hover:bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {method.icon}
                    <span className="font-semibold text-sm">{method.name}</span>
                  </div>
                  <span className="text-xs text-center">{method.description}</span>
                  {/* <span className="text-xs text-gray-500 mt-1">
                    {method.supportedMethods.join(', ')}
                  </span> */}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleBookNow}
          disabled={isButtonDisabled}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
            isButtonDisabled
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-[#980d0d] text-white hover:bg-[#7a0a0a]'
          }`}
        >
          {isBooking ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing Payment...
            </div>
          ) : (
            `Book Consultation`
          )}
        </button>
     

      {isButtonDisabled && (
        <div className="text-xs text-gray-500 text-center -mt-2">
          {!hasValidUser && <div>Please login to continue</div>}
          {!modalData.selectedSlot && <div>Select a date and time slot</div>}
          {!isFormValid && showConsultationForm && <div>Complete all required consultation details</div>}
        </div>
      )}

      {razorpayError && (
        <p className="text-xs text-red-500 text-center -mt-2">
          Payment gateway error: {razorpayError}
        </p>
      )}
    </div>

  </div>
);

};

export default BookingSection;