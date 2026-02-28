'use client';

import moment from 'moment';
import Swal from 'sweetalert2';
import { X, CalendarClock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { toaster } from '@/utils/services/toast-service';

interface Slot {
  _id: string;
  fromTime: string;
  toTime: string;
  duration: number;
  status: 'available' | 'booked';
}

interface SlotTimeByDateData {
  SlotDate: string;
  SlotTimeByDuration: {
    [key: string]: Slot[];
  };
}

interface InlineRescheduleProps {
  astrologerId: string | null;
  duration_minutes: number | null;
  consultation_type: string | null;
  bookingId: string | null;
  ConsultantDate?: string | null;
  toTime?: string | null;
  currentFromTime?: string | null;
  currentToTime?: string | null;
  rescheduledByAdminId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Skeleton for slot cards
const SlotSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col gap-2 animate-pulse"
      >
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded-lg w-full mt-1" />
      </div>
    ))}
  </div>
);

const InlineReschedule = ({
  astrologerId,
  duration_minutes,
  consultation_type,
  bookingId,
  currentFromTime = null,
  currentToTime = null,
  rescheduledByAdminId = null,
  onClose,
  onSuccess,
}: InlineRescheduleProps) => {
  const [slotDates, setSlotDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slotTimeData, setSlotTimeData] = useState<SlotTimeByDateData>({
    SlotDate: '',
    SlotTimeByDuration: {},
  });

  // Two separate loaders: one for the date row, one for the slot grid
  const [datesLoading, setDatesLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false); 

  const containerRef = useRef<HTMLDivElement>(null);

  // Always use current date/time so upcoming bookings can also reschedule freely
  const currentDate = moment().format('YYYY-MM-DD');
  const currentTime = moment().format('HH:mm');

  useEffect(() => {
    if (astrologerId) fetchSlotDates();
  }, [astrologerId]);

  useEffect(() => {
    if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, []);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchSlotDates = async () => {
    try {
      setDatesLoading(true);
      const res = await fetch(
        `/api/astrologer/get_slots_date_duration/${astrologerId}?duration=${duration_minutes}&currentDate=${currentDate}&currentTime=${currentTime}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (data.success && data.slotDates?.length > 0) {
        setSlotDates(data.slotDates);
        fetchSlotTimeByDate(data.slotDates[0]); // auto-load first date slots
      }
    } catch (err) {
      console.error('Error fetching slot dates:', err);
      toaster.error({ text: 'Failed to fetch available dates' });
    } finally {
      setDatesLoading(false);
    }
  };

  const fetchSlotTimeByDate = async (date: string) => {
    try {
      // Highlight the date immediately — no wait
      setSelectedDate(date);
      setSlotsLoading(true);

      const res = await fetch(
        `/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${currentDate}&currentTime=${currentTime}&date=${date}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (data.success) {
        setSlotTimeData({
          SlotDate: data.SlotDate,
          SlotTimeByDuration: data.SlotTimeByDuration,
        });
      }
    } catch (err) {
      console.error('Error fetching slot times:', err);
      toaster.error({ text: 'Failed to fetch available slots' });
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleReschedule = async (slot: Slot) => {
 
    try {
      const result = await Swal.fire({
        title: 'Confirm Reschedule',
       
        icon: 'warning',
        showConfirmButton: true,
        confirmButtonText: 'Yes, Reschedule',
        confirmButtonColor: '#dc2626',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        cancelButtonColor: '#6b7280',
      });

      if (result.isConfirmed) {
        // Show loading state
        setIsRescheduling(true);
        Swal.fire({
          title: 'Rescheduling...',
          html: `<p style="color:#6b7280;font-size:14px;">Please wait while we update your appointment.</p>`,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/customers/reschedule-booking`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              bookingId,
              newSlotId: slot._id,
              rescheduledByAdminId: rescheduledByAdminId || null,
            }),
          }
        );
        const data = await res.json();
        Swal.close();

        if (data?.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Rescheduled!',
            html: `<p style="font-size:14px;color:#374151;">Appointment moved to <strong style="color:#16a34a;">${slot.fromTime} – ${slot.toTime}</strong> on <strong>${moment(selectedDate).format('DD MMM YYYY')}</strong></p>`,
            confirmButtonColor: '#dc2626',
            timer: 3000,
            timerProgressBar: true,
          });
          onSuccess();
        } else {
          toaster.error({ text: data?.message || 'Failed to reschedule booking' });
        }
      }
    } catch (err) {
      Swal.close();
      console.error('Error rescheduling:', err);
      toaster.error({ text: 'An error occurred while rescheduling' });
    } finally {
      setIsRescheduling(false);
    }
  };

  const availableSlots = duration_minutes
    ? slotTimeData?.SlotTimeByDuration?.[duration_minutes + 'min'] ?? []
    : [];

  return (
    <div
      ref={containerRef}
      className="mt-4 border-t border-dashed border-red-200 pt-4"
      style={{ animation: 'slideDown 0.25s ease-out' }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .slots-fade { animation: fadeIn 0.18s ease-out; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <CalendarClock size={16} className="text-red-600" />
          Reschedule{' '}
          <span className="capitalize text-red-600">{consultation_type}</span> Consultation
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── DATE ROW ── */}
      {datesLoading ? (
        <div className="mb-4">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 w-16 rounded-xl bg-gray-200 animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      ) : slotDates.length === 0 ? (
        <p className="text-gray-400 text-xs italic text-center py-3">No dates available</p>
      ) : (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Select Date
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
            {slotDates.map((date, idx) => {
              const isSelected = date === selectedDate;
              return (
                <button
                  key={idx}
                  onClick={() => fetchSlotTimeByDate(date)}
                  className={`flex flex-col items-center py-2 px-3 min-w-[64px] rounded-xl border text-xs font-medium transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-600 shadow-md shadow-red-200 scale-105'
                      : 'border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 bg-white'
                  }`}
                >
                  <span className="text-sm font-bold">{moment(date).format('DD')}</span>
                  <span className="text-[10px] uppercase">{moment(date).format('MMM')}</span>
                  <span className="text-[10px] uppercase opacity-75">{moment(date).format('ddd')}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SLOT GRID ── date row stays frozen, only this area updates */}
      {!datesLoading && selectedDate && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {duration_minutes}-min slots &middot; {moment(selectedDate).format('DD MMM YYYY')}
          </p>

          {slotsLoading ? (
            // Skeleton replaces only the grid — header + dates untouched
            <SlotSkeleton />
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 slots-fade">
              {availableSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-md shadow-md flex justify-between items-center border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div>
                    <p className="text-black font-medium text-sm">
                      {slot.fromTime} - {slot.toTime}
                    </p>
                    <p className="text-xs text-gray-500">Duration: {slot.duration} Min</p>
                  </div>
                  <button
                    onClick={() => handleReschedule(slot)}
                    disabled={slot.status !== 'available' || isRescheduling}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ml-3 ${
                      slot.status === 'available' && !isRescheduling
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {slot.status === 'available' ? 'Proceed' : 'Booked'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-xs italic text-center py-4 slots-fade">
              No {duration_minutes}-min slots available for this date
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineReschedule;