'use client';

import moment from 'moment';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface ConsultationModalProps {
  isOpen: boolean;
  astrologerId: string | null;
  duration_minutes: number | null;
  consultation_type: string | null;
  bookingId: string | null;
  handleClose: () => void;
  ConsultantDate?: string | null;
  toTime?: string | null;
}

const ConsultationModal = ({
  isOpen,
  astrologerId,
  duration_minutes,
  consultation_type,
  bookingId,
  handleClose,
  ConsultantDate,
  toTime
}: ConsultationModalProps) => {
  const [astrologerSlotDateData, setAstrologerSlotDateData] = useState<string[]>([]);
  const [astrologerSlotTimeByDateData, setAstrologerSlotTimeByDateData] = useState<SlotTimeByDateData>({
    SlotDate: '',
    SlotTimeByDuration: {},
  });
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ✅ Set modal app element when component mounts
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const rootElement = document.getElementById('__next') || document.body;
      Modal.setAppElement(rootElement);
    }
  }, []);

  // Fetch available slot dates
  useEffect(() => {
    if (astrologerId && isOpen && isClient) {
      fetchAstrologerSlotDates();
    }
  }, [astrologerId, isOpen, isClient]);

  // Fetch slot times for the first available date
  useEffect(() => {
    if (astrologerId && astrologerSlotDateData && astrologerSlotDateData.length > 0) {
      fetchAstrologerSlotTimeByDate(astrologerSlotDateData[0]);
    }
  }, [astrologerId, astrologerSlotDateData]);

  const fetchAstrologerSlotDates = async () => {
    try {
      setLoading(true);
      
    const consultationDate = ConsultantDate ? moment(ConsultantDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    const consultationTime = toTime ? moment(toTime, ['hh:mm A', 'HH:mm']).format('HH:mm') : moment().format('HH:mm');
    
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const response = await fetch(
        `/api/astrologer/get_slots_date_duration/${astrologerId}?duration=${duration_minutes}&currentDate=${consultationDate}&currentTime=${consultationTime}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.slotDates) {
        setAstrologerSlotDateData(data.slotDates);
      }
    } catch (error) {
      console.error('Error fetching slot dates:', error);
      toaster.error({ text: 'Failed to fetch available dates' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Correctly parse the API response
  const fetchAstrologerSlotTimeByDate = async (date: string) => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const consultationDate = ConsultantDate ? moment(ConsultantDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    const consultationTime = toTime ? moment(toTime, ['hh:mm A', 'HH:mm']).format('HH:mm') : moment().format('HH:mm');
    
      const response = await fetch(
        `/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${consultationDate}&currentTime=${consultationTime}&date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log('API Response:', data); // ✅ Debug log

      // ✅ FIX: The response structure is different - it directly has SlotDate and SlotTimeByDuration
      if (data.success) {
        setAstrologerSlotTimeByDateData({
          SlotDate: data.SlotDate,
          SlotTimeByDuration: data.SlotTimeByDuration,
        });
      }
    } catch (error) {
      console.error('Error fetching slot times:', error);
      toaster.error({ text: 'Failed to fetch available slots' });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (slotId: string) => {
  try {
    const result = await Swal.fire({
      icon: 'warning',
      text: 'Are you sure you want to re-schedule this session?',
      showConfirmButton: true,
      timer: 20000,
      confirmButtonText: 'Yes',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'No',
      showCancelButton: true,
      cancelButtonColor: '#6b7280',
      // ✅ ADD THIS: Increase z-index to appear above modal
      customClass: {
        container: 'swal-high-zindex',
      },
    });

    if (result.isConfirmed) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const response = await fetch(
        `/customers/reschedule-booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            newSlotId: slotId,
          }),
        }
      );

      const data = await response.json();

      if (data?.success) {
        toaster.success({ text: data?.message || 'Booking rescheduled successfully' });
        handleClose();
        
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        toaster.error({ text: data?.message || 'Failed to reschedule booking' });
      }
    }
  } catch (error) {
    console.error('Error rescheduling:', error);
    toaster.error({ text: 'An error occurred while rescheduling' });
  }
};


  // ✅ Don't render modal until client-side is ready
  if (!isClient) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="modal-content"
      overlayClassName="modal-overlay"
      closeTimeoutMS={200}
      ariaHideApp={false}
      style={{
        content: {
          position: 'relative',
          top: 'auto',
          left: 'auto',
          right: 'auto',
          bottom: 'auto',
          maxWidth: '98vw',
          maxHeight: '95vh',
          width: '98vw',
          height: '95vh',
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: 0,
          border: 'none',
          overflow: 'hidden',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        },
      }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4 bg-primary">
          <h2 className="text-xl font-semibold text-white">
            Re Schedule Your <span className="capitalize">{consultation_type}</span> Consultation
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Available Dates Section */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-black mb-4">Available Slots Date</h2>

            {loading && astrologerSlotDateData.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : astrologerSlotDateData.length > 0 ? (
              <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-3">
                <div className="flex gap-3">
                  {astrologerSlotDateData?.map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => fetchAstrologerSlotTimeByDate(date)}
                      className={`flex flex-col items-center py-2 px-4 min-w-[80px] rounded-md border transition text-xs ${
                        date === astrologerSlotTimeByDateData?.SlotDate
                          ? 'bg-gradient-to-r from-red-500 to-red-700 text-white border-red-600'
                          : 'border-gray-400 text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-700 hover:text-white hover:border-red-600'
                      }`}
                    >
                      <span className="text-sm font-medium">{moment(date).format('DD MMM')}</span>
                      <span className="text-xs font-semibold uppercase">{moment(date).format('ddd')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center py-4">No dates available</p>
            )}
          </div>

          {/* Available Time Slots Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold mb-3">
              Available Slots Time For your Booking of {duration_minutes} min
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <>
                {/* Slot Preview Cards */}
                {duration_minutes &&
                  astrologerSlotTimeByDateData?.SlotTimeByDuration?.[duration_minutes + 'min']?.length > 0 && (
                    <div className="space-y-4">
                      {/* <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-3">
                        {astrologerSlotTimeByDateData?.SlotTimeByDuration[duration_minutes + 'min']?.map((slot, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-md shadow-md text-center font-medium text-sm transition min-w-[120px] ${
                              slot?.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {slot?.fromTime} - {slot?.toTime}
                          </div>
                        ))}
                      </div> */}

                      {/* Detailed Slot Cards with Proceed Button */}
                      <div className="grid md:grid-cols-3 gap-4">
                        {astrologerSlotTimeByDateData?.SlotTimeByDuration[duration_minutes + 'min']?.map((slot, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white rounded-md shadow-md flex justify-between items-center border border-gray-200 hover:shadow-lg transition-all"
                          >
                            <div>
                              <p className="text-black font-medium">
                                {slot?.fromTime} - {slot?.toTime}
                              </p>
                              <p className="text-sm text-gray-500">Duration: {slot?.duration} Min</p>
                            </div>

                            <button
                              onClick={() => handleReschedule(slot?._id)}
                              disabled={slot?.status !== 'available'}
                              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition ${
                                slot?.status === 'available'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Proceed
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* No Slots Message */}
                {(!duration_minutes ||
                  !astrologerSlotTimeByDateData?.SlotTimeByDuration?.[duration_minutes + 'min'] ||
                  astrologerSlotTimeByDateData?.SlotTimeByDuration[duration_minutes + 'min']?.length === 0) && (
                  <p className="text-gray-400 italic text-center py-8">
                    {astrologerSlotTimeByDateData?.SlotDate 
                      ? `No ${duration_minutes}-minute slots available for ${moment(astrologerSlotTimeByDateData.SlotDate).format('DD MMM YYYY')}`
                      : 'Please select a date to view available slots'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConsultationModal;
