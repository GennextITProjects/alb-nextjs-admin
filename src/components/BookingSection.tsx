'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, Video, Calendar, User } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useRazorpay } from 'react-razorpay';

import { Color } from '@/assets/colors/index';
import { toaster } from '@/utils/services/toast-service';
import DatePicker from './DatePicker';
import ConsultationForm from '@/components/form/consultationForm';
import { AstrologerData, User as UserType } from '../types';
// import CustomerLoginSheet from './page/Login2';

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

const BookingSection: React.FC<BookingSectionProps> = ({
  astrologerId,
  astrologerData,
  onLoginRequired,
  consultationPrices
}) => {
  const router = useRouter();
  const { error: razorpayError, isLoading: razorpayLoading, Razorpay } = useRazorpay();

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

  const [modalData, setModalData] = useState<ModalData>(() => {
    if (!consultationPrices || consultationPrices.length === 0) {
      return {
        price: null,
        consultation_type: 'videocall',
        duration_minutes: '15min',
        selectedDate: null,
        selectedSlot: null,
      };
    }

    const minDurationData = consultationPrices.reduce(
      (min: ConsultationPrice, item: ConsultationPrice) => {
        return (item?.duration?.slotDuration || 0) < (min?.duration?.slotDuration || 0) ? item : min;
      }
    );

    return {
      price: minDurationData?.price || 199,
      consultation_type: 'videocall',
      duration_minutes: `${minDurationData?.duration?.slotDuration || 15}min`,
      selectedDate: null,
      selectedSlot: null,
    };
  });

  const sessionTypes: SessionType[] = [
    { title: "Video Call", value: "videocall", icon: <Video size={24} /> },
    { title: "Voice Call", value: "call", icon: <Phone size={24} /> },
  ];

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
              setModalData(prev => ({
                ...prev,
                duration_minutes: `${firstAvailableDuration}min`,
                price: matchingPrice.price,
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

  // Fetch slots for specific date using the old API
  // Fetch slots for specific date using the old API
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

  const createRazorpayOrder = async (amount: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/create_razorpay_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amount })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const createZoomMeeting = async (bookingPayload: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/zoom/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw error;
    }
  };

  const bookConsultation = async (bookingPayload: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/book_consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error booking consultation:', error);
      throw error;
    }
  };

  // Call ONLY ONCE on mount to check available durations
  useEffect(() => {
    checkAvailableDurations();
  }, [astrologerId]);

  const handleSessionTypeChange = (sessionType: 'videocall' | 'call' | 'chat'): void => {
    setModalData({ ...modalData, consultation_type: sessionType });
  };

  const handleDurationChange = (slot: ConsultationPrice): void => {
    if (slot?.duration?.slotDuration && slot?.price) {
      setModalData({
        ...modalData,
        price: slot.price,
        duration_minutes: `${slot.duration.slotDuration}min`,
        selectedSlot: null,
      });
    }
  };

  const handleDateSelect = async (date: string) => {
    setModalData(prev => ({
      ...prev,
      selectedDate: date,
      selectedSlot: null
    }));
    setShowAllSlots(false);
  };

  const handleSlotSelect = (slot: AvailableSlot): void => {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser._id) {
      setPendingSlot(slot);
      setIsLoginOpen(true);
      return;
    }

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

  const handleBookNow = async (): Promise<void> => {
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

    const slot = modalData.selectedSlot;

    const result = await Swal.fire({
      icon: "warning",
      title: "Confirm Booking",
      text: `Are you sure you want to book this ${modalData.consultation_type} session for ₹${modalData.price}?`,
      showConfirmButton: true,
      timer: 20000,
      confirmButtonText: "Yes, Book Now",
      confirmButtonColor: '#980d0d',
      cancelButtonText: "Cancel",
      showCancelButton: true,
      cancelButtonColor: '#6B7280',
    });

    if (result.isConfirmed) {
      setIsBooking(true);

      try {
        const orderData = await createRazorpayOrder(modalData.price!);

        if (!orderData.status) {
          throw new Error('Failed to create payment order');
        }

        const razorpayOptions = {
          key: orderData.key_id,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: consultationFormData.fullName,
          description: consultationFormData.consultationTopic || 'Astrology Consultation',
          order_id: orderData.data.id,
          handler: async (response: any) => {
            // Show loading popup immediately after payment
            Swal.fire({
              title: 'Processing Your Request',
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
              const bookingPayload = {
                fullName: consultationFormData.fullName,
                last_name: consultationFormData.last_name || '',
                mobileNumber: consultationFormData.mobileNumber,
                dateOfBirth: consultationFormData.dateOfBirth,
                timeOfBirth: consultationFormData.timeOfBirth,
                placeOfBirth: consultationFormData.placeOfBirth,
                consultationTopic: consultationFormData.consultationTopic,
                consultationType: modalData.consultation_type,
                astrologerId,
                customerId: currentUser._id,
                slotId: slot._id || `${modalData.selectedDate}-${slot.fromTime}-${slot.toTime}`,
                startTime: moment
                  .utc(`${modalData.selectedDate} ${slot.fromTime}`, 'YYYY-MM-DD HH:mm')
                  .toISOString(),
                duration: slot.duration,
                consultationPrice: modalData.price! * 100,
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                latitude: consultationFormData.latitude,
                longitude: consultationFormData.longitude,
                dontKnowBirthDate: consultationFormData.dontKnowBirthDate,
                dontKnowBirthTime: consultationFormData.dontKnowBirthTime,
                isBirthDateProvided: consultationFormData.isBirthDateProvided,
                isBirthTimeProvided: consultationFormData.isBirthTimeProvided,
                agenda: consultationFormData.consultationTopic,
                topic: "Meeting",
                meetingId: "",
                meetingPassword: ""
              };

              if (modalData.consultation_type === 'videocall') {
                const zoomData = await createZoomMeeting(bookingPayload);
                if (zoomData.success) {
                  bookingPayload.meetingId = zoomData.data.id;
                  bookingPayload.meetingPassword = zoomData.data.password;
                }
              }

              const consultationResult = await bookConsultation(bookingPayload);

              if (consultationResult.success) {
                // Close loading and show success
                await Swal.fire({
                  icon: 'success',
                  title: 'Booking Confirmed!',
                  text: 'Your consultation has been booked successfully.',
                  confirmButtonColor: '#980d0d'
                });
                router.push('/my-booking');
              } else {
                throw new Error(consultationResult.message || 'Failed to book consultation');
              }
            } catch (error) {
              console.error('Error in booking process:', error);
              // Close loading and show error
              Swal.close();
              toaster.error({ text: 'Failed to complete booking. Please try again.' });
            }
          },

          prefill: {
            name: consultationFormData.fullName,
            email: consultationFormData.email,
            contact: consultationFormData.mobileNumber,
          },
          theme: {
            color: '#980d0d',
          },
        };

        const razorpayInstance = new Razorpay(razorpayOptions);
        razorpayInstance.open();

      } catch (error) {
        console.error('Error in booking process:', error);
        toaster.error({ text: 'Failed to initiate booking. Please try again.' });
      } finally {
        setIsBooking(false);
      }
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

  const getDurationCount = (duration: number): number => {
    if (!durationCounts || durationCounts.length === 0) return 0;
    const durationInfo = durationCounts.find(dc => dc.duration === duration);
    return durationInfo?.count || 0;
  };

  const currentUser = getCurrentUser();
  const hasValidUser = currentUser && currentUser._id;
  const isButtonDisabled = !modalData.selectedSlot || !isFormValid || isBooking || razorpayLoading || !hasValidUser;

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

  return (
    <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
      <div className="mb-6 pb-1 lg:pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-[#980d0d] mb-1">Book Your Consultation</h2>
        <p className="text-sm text-gray-500 hidden lg:inline-block">Get personalized astrological guidance in simple steps</p>
      </div>

      <div className="space-y-6">
        <div className='space-y-3'>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h3 className="text-base font-semibold text-gray-800">Select Session Type</h3>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {sessionTypes.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSessionTypeChange(item.value)}
                disabled={isBooking}
                className={`flex flex-col items-center justify-center gap-2 px-4 p-3 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 ${modalData.consultation_type === item.value
                    ? "bg-[#980d0d] text-white border-[#980d0d] shadow-md"
                    : "border-gray-300 text-gray-600 hover:border-[#980d0d] hover:bg-red-50"
                  }`}
              >
                {item.icon}
                {/* <span className="text-sm font-medium">{item.title}</span> */}
              </button>
            ))}
          </div>
        </div>

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

                return (
                  <button
                    key={index}
                    onClick={() => handleDurationChange(slot)}
                    disabled={isBooking}
                    className={`relative flex flex-col items-center justify-center px-4 p-1 rounded-lg border-2 transition-all duration-300 text-sm disabled:opacity-50 ${isSelected
                        ? "bg-[#980d0d] text-white border-[#980d0d] shadow-md"
                        : "border-gray-300 text-gray-700 hover:border-[#980d0d] hover:bg-green-50"
                      }`}
                  >
                    <span className='font-bold text-lg'>{slot.duration.slotDuration} Min</span>
                    <span className="font-semibold">₹{slot.price.toLocaleString('en-IN')}</span>
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

        <div className='space-y-3'>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">
              3
            </div>
            <h3 className="text-base font-semibold text-gray-800">Select Date & Time Slot</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Choose Date</label>
            <DatePicker
              selectedDate={modalData.selectedDate}
              astrologerId={astrologerId}
              onDateSelect={handleDateSelect}
              setSlotsError={setSlotsError}
              duration={parseInt(modalData.duration_minutes.replace('min', ''))}
            />
          </div>
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

                      // Convert 24-hour format to 12-hour AM/PM format
                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(':');
                        const hour = parseInt(hours, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour % 12 || 12; // Convert to 12-hour format, 0 becomes 12
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

        <button
          onClick={handleBookNow}
          disabled={isButtonDisabled}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl ${isButtonDisabled
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-[#980d0d] text-white hover:bg-[#7a0a0a]'
            }`}
        >
          {isBooking ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing Booking...
            </div>
          ) : (
            `Book Consultation - ₹${modalData.price?.toLocaleString('en-IN') || 0}`
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

      {/* <CustomerLoginSheet
        isOpen={isLoginOpen}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      /> */}
    </div>
  );
};

export default BookingSection;
