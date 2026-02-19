'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import moment from 'moment-timezone';
import {
  Video,
  Ban,
  Calendar,
  Clock,
  MapPin,
  MessageSquareText,
  UserCircle2,
  Phone,
  Type,
  Star,
  CalendarClock,
  MessageSquare,
  X,
  ExternalLink,
} from 'lucide-react';
import RescheduleComponent from './RescheduleComponent';
import Header from '@/components/common/Navbar';
import { toaster } from '@/utils/services/toast-service';
import RatingModal from '@/components/page/RatingModal';
// import CustomerLoginSheet from '@/components/page/Login2';

interface Astrologer {
  _id: string;
  astrologerName: string;
  title?: string;
  phoneNumber?: string;
  email?: string;
  profileImage?: string;
}

interface Slot {
  _id: string;
  duration: number;
  fromTime: string;
  toTime: string;
  status: string;
}

interface Consultation {
  _id: string;
  customerId: string;
  astrologerId: Astrologer;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  consultationType: string;
  consultationTopic: string;
  slotId: Slot;
  date: string;
  fromTime: string;
  toTime: string;
  status?: string;
  meetingId?: string;
  meetingPassword?: string;
}

interface ConsultationHistory {
  upcoming: Consultation[];
  completed: Consultation[];
  cancelled: Consultation[];
  expired: Consultation[];
}

interface InfoLineProps {
  icon: React.ComponentType<{ size: number; className: string }>;
  label: string;
  value: string;
}

const InfoLine = ({ icon: Icon, label, value }: InfoLineProps) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 p-1.5 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
      <Icon size={16} className="text-red-600" />
    </div>
    <div className="text-sm text-gray-700 flex-1">
      <span className="font-semibold text-gray-900">{label}</span>
      <p className="text-gray-600 mt-0.5 capitalize">{value || '--'}</p>
    </div>
  </div>
);

const IST = (input?: any) => moment.tz(input || new Date(), 'Asia/Kolkata');

const MyBooking = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('active') || 'upcoming';

  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistory>({
    upcoming: [],
    completed: [],
    cancelled: [],
    expired: [],
  });
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [joiningMeeting, setJoiningMeeting] = useState<string | null>(null);
  const [modalData, setModalData] = useState({
    isOpen: false,
    data: null as Consultation | null,
    isConsultationModalOpen: false,
    isRatingModalOpen: false, // ✅ ADD THIS
    duration_minutes: null as number | null,
    consultation_type: null as string | null,
    astrologerId: null as string | null,
    bookingId: null as string | null,
    date: null as string | null,
    toTime: null as string | null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('hasReloaded') === 'true') {
      localStorage.removeItem('hasReloaded');
      window.location.reload();
    }
  }, []);

  const customerId = typeof window !== 'undefined' ? localStorage.getItem('customer_id') : null;
  const support_email = typeof window !== 'undefined' ? localStorage.getItem('email') : null;

  useEffect(() => {
    fetchConsultations();
  }, [activeTab]);

  useEffect(() => {
    // Check if customer_id exists in localStorage
    if (typeof window !== 'undefined') {
      const customerId = localStorage.getItem('customer_id');
      if (!customerId) {
        setIsLoginOpen(true);
      }
    }
  }, []); // Empty dependency array means this runs once on mount


  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    window.location.reload();
  };
  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };


  const filterConsultationsByDate = (consultations: Consultation[]) => {
    const now = IST();  
    const filtered: ConsultationHistory = {
      upcoming: [],
      completed: [],
      cancelled: [],
      expired: [],
    };

    consultations.forEach((consultation) => {
      const consultationDateTime = moment(
        `${consultation.date} ${consultation.toTime}`,
        'YYYY-MM-DD hh:mm A'
      ).tz('Asia/Kolkata'); 
      const consultationStartTime = moment(
        `${consultation.date} ${consultation.fromTime}`,
        'YYYY-MM-DD hh:mm A'
      ).tz('Asia/Kolkata'); 

      if (consultation.status === 'cancelled') {
        filtered.cancelled.push(consultation);
      } else if (consultationDateTime.isBefore(now)) {
        if (consultation.status === 'completed') {
          filtered.completed.push(consultation);
        } else {
          filtered.expired.push(consultation);
        }
      } else if (consultationStartTime.isAfter(now)) {
        filtered.upcoming.push(consultation);
      } else {
        filtered.upcoming.push(consultation);
      }
    });

    // 
    filtered.upcoming.sort((a, b) => {
    const dateTimeA = moment(`${a.date} ${a.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata');  
    const dateTimeB = moment(`${b.date} ${b.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata');  
    return dateTimeA.diff(dateTimeB);
  });

  return filtered;
};

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
      const currentTime = moment().tz('Asia/Kolkata').format('HH:mm');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/get_consultations/all?customerId=${customerId}&currentDate=${today}&currentTime=${currentTime}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        if (Array.isArray(data.consultations)) {
          // API returns array format
          const filteredData = filterConsultationsByDate(data.consultations);
          setConsultationHistory(filteredData);
        } else {
          // ✅ API returns object format - sort the upcoming array
          const sortedUpcoming = [...(data.consultations.upcoming || [])].sort((a, b) => {
            const dateTimeA = moment(`${a.date} ${a.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata');  
            const dateTimeB = moment(`${b.date} ${b.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata');  
            return dateTimeA.diff(dateTimeB);
          });


          setConsultationHistory({
            ...data.consultations,
            upcoming: sortedUpcoming
          });
        }
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleModalOpen = ({ type, data }: { type: string; data: any }) => {
    switch (type) {
      case 'Rating':
        setModalData({
          isOpen: false,
          data: data,
          isConsultationModalOpen: false,
          isRatingModalOpen: true, // ✅ CHANGE THIS
          duration_minutes: null,
          consultation_type: null,
          astrologerId: null,
          bookingId: null,
          date: null,
          toTime: null,
        });
        return;

      case 'Consultation':
        setModalData({
          isOpen: false,
          data: data,
          isConsultationModalOpen: true,
          isRatingModalOpen: false, // ✅ ADD THIS
          duration_minutes: data?.duration_minutes,
          consultation_type: data?.consultation_type,
          astrologerId: data?.astrologerId,
          bookingId: data?.bookingId,
          date: data?.date,
          toTime: data?.toTime,
        });
        return;

      default:
        setModalData({
          isOpen: false,
          data: null,
          isConsultationModalOpen: false,
          isRatingModalOpen: false, // ✅ ADD THIS
          duration_minutes: null,
          consultation_type: null,
          astrologerId: null,
          bookingId: null,
          date: null,
          toTime: null,
        });
        return;
    }
  };

  const handleModalClose = () => {
    setModalData({
      isOpen: false,
      data: null,
      isConsultationModalOpen: false,
      isRatingModalOpen: false, // ✅ ADD THIS
      duration_minutes: null,
      consultation_type: null,
      astrologerId: null,
      bookingId: null,
      date: null,
      toTime: null,
    });
    fetchConsultations();
  };

  const handleJoinConsultation = async (consultation: Consultation) => {
    const { consultationType, customerId, astrologerId, _id, meetingId, meetingPassword, slotId, date, fromTime, toTime } = consultation;

    if (consultationType === 'chat') {
      router.push(
        `/consultation/chat-consultation?customerId=${customerId}&astrologerId=${astrologerId._id}&consultationId=${_id}`
      );
    } else if (consultationType === 'videocall') {
      if (meetingId) {
        setJoiningMeeting(_id);

        try {
          // const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

          // const now = moment();
          // const slotStartTime = moment(`${date} ${fromTime}`, 'YYYY-MM-DD hh:mm A');

          // // Calculate time difference in seconds, then convert to minutes
          // const secondsFromStart = now.diff(slotStartTime, 'seconds');
          // const minutesFromStart = Math.floor(secondsFromStart / 60);

          // let adjustedDuration: number;

          // if (secondsFromStart < 0) {
          //   // User joined early - add extra minutes to duration + 1 min leverage
          //   adjustedDuration = (slotId?.duration || 15) + Math.abs(minutesFromStart) + 1;
          // } else if (secondsFromStart > 0) {
          //   // User joined late - subtract elapsed minutes from duration + 1 min leverage
          //   adjustedDuration = (slotId?.duration || 15) - minutesFromStart + 1;

          //   // Ensure duration doesn't go negative
          //   if (adjustedDuration <= 0) {
          //     adjustedDuration = 1; 
          //   }
          // } else {
          //   // User joined exactly on time
          //   adjustedDuration = slotId?.duration || 15;
          // }

          // const timerResponse = await fetch(
          //   `${process.env.NEXT_PUBLIC_API_URL}/api/zoom/startMeetingTimer`,
          //   {
          //     method: 'POST',
          //     headers: {
          //       'Content-Type': 'application/json',
          //       'Authorization': `Bearer ${token}`,
          //     },
          //     body: JSON.stringify({
          //       consultationId: _id,
          //       meetingId: meetingId,
          //       durationMinutes: adjustedDuration, 
          //     }),
          //   }
          // );

          // const timerData = await timerResponse.json();

          // if (timerData.success) {
          //   const endTime = new Date(timerData.data.endTime).toLocaleString('en-IN', {
          //     timeZone: 'Asia/Kolkata',
          //     hour: '2-digit',
          //     minute: '2-digit'
          //   });

          //   toaster.success({
          //     text: `Call will auto-end in ${adjustedDuration} minutes (at ${endTime})`
          //   });

          // } else {
          //   toaster.warning({
          //     text: 'Timer could not be started, but you can still join the meeting.'
          //   });
          // }

          const zoomUrl = `https://zoom.us/wc/join/${meetingId}${meetingPassword ? `?pwd=${meetingPassword}` : ''
            }`;

          const windowFeatures = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
          const meetingWindow = window.open(zoomUrl, 'ZoomMeeting', windowFeatures);

          if (!meetingWindow) {
            toaster.error({
              text: 'Please allow popups for this site to join the meeting.'
            });
            return;
          }

          toaster.success({ text: 'Meeting opened successfully' });

        } catch (error) {
          console.error('❌ Error joining meeting:', error);
          toaster.error({ text: 'Failed to join meeting. Please try again.' });
        } finally {
          setJoiningMeeting(null);
        }
      } else {
        toaster.error({ text: 'Meeting ID not found. Please contact Support.' });
      }
    } else if (consultationType === 'call') {
      setJoiningMeeting(_id);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const now = IST();
        
        // ✅ FIXED: ISO date + 24hr format parsing
        const dateStr = moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
        const slotStartTime = moment.tz(`${dateStr} ${fromTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');
        const slotEndTime = moment.tz(`${dateStr} ${toTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');
        
        const secondsRemaining = slotEndTime.diff(now, 'seconds');
        let adjustedDuration = secondsRemaining > 0 ? Math.ceil(secondsRemaining / 60) : 1;
        adjustedDuration = Math.max(1, Math.min(adjustedDuration, slotId?.duration || 15));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/customers/initiate_call_with_exotel`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              astrologerId: astrologerId._id,
              consultationId: _id,
              customerId: customerId,
              formId: _id,
              maxDuration: adjustedDuration * 60,
            }),
          }
        );

        const data = await response.json();

        if (data.success === false) {
          toaster.info({ text: data.message });
        } else {
          toaster.success({ text: `Consultation call sent successfully! Duration: ${adjustedDuration} minutes` });
        }
      } catch (error) {
        console.error('Error initiating call:', error);
        toaster.error({ text: 'Failed to initiate call. Please try again.' });
      } finally {
        setJoiningMeeting(null);
      }
    }
  };


  const renderAppointmentCard = (data: Consultation, type: string) => {
    const startTime = moment(`${data?.date} ${data?.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata');  // ✅ ADDED
    const canJoin = IST().isAfter(startTime.clone().subtract(5, 'minutes'));  // ✅ CHANGED: IST()
    const bookingDate = moment(data.date).format('YYYY-MM-DD');  // ✅ unchanged (formatting)
    const bookingStart = new Date(`${bookingDate}T${data.fromTime}:00`);
    const minAllowed = new Date(IST().toDate().getTime() + 24 * 60 * 60 * 1000);  // ✅ CHANGED: IST()
    const canReschedule = bookingStart.getTime() > minAllowed.getTime();
    const isJoining = joiningMeeting === data._id;

    return (
      <div
        key={data?._id}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100/50 to-pink-100/50 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-500"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-md">
                  <UserCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-xl">{data?.fullName}</h3>
                  {/* <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone size={14} />
                    <span>{data?.mobileNumber}</span>
                  </div> */}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-6 text-sm">
                <span className="font-semibold text-gray-700">Astrologer:</span>
                <span className="text-red-600 font-medium">{data?.astrologerId?.astrologerName || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="bg-gradient-to-r from-red-500 to-red-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md flex items-center gap-2 whitespace-nowrap">
                <Calendar size={14} />
                {moment(data?.date).format('DD MMM YYYY')}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoLine
                icon={Clock}
                label="Date of Birth"
                value={moment(data?.dateOfBirth).format('DD MMM YYYY')}
              />
              <InfoLine icon={Clock} label="Time of Birth" value={data?.timeOfBirth} />
              <InfoLine icon={MapPin} label="Place of Birth" value={data?.placeOfBirth} />
              <InfoLine icon={Type} label="Consultation Type" value={data?.consultationType} />
              <InfoLine
                icon={MessageSquareText}
                label="Topic"
                value={data?.consultationTopic}
              />
              <InfoLine
                icon={Clock}
                label="Time Slot (IST)"
                value={`${data?.fromTime} - ${data?.toTime}`}
              />
            </div>
          </div>

          {type === 'upcoming' && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleJoinConsultation(data)}
                disabled={!canJoin || isJoining}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-md text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${canJoin && !isJoining
                    ? 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    {data?.consultationType === 'call' && <Phone size={18} />}
                    {data?.consultationType === 'chat' && <MessageSquare size={18} />}
                    {data?.consultationType === 'videocall' && <Video size={18} />}
                    Join Now
                  </>
                )}
              </button>

              {/* ✅ FIXED: Pass date and toTime */}
              <button
                disabled={!canReschedule}
                onClick={() =>
                  handleModalOpen({
                    type: 'Consultation',
                    data: {
                      bookingId: data?._id,
                      duration_minutes: data?.slotId?.duration,
                      consultation_type: data?.consultationType,
                      astrologerId: data?.astrologerId?._id,
                      date: data?.date,
                      toTime: data?.fromTime,
                    },
                  })
                }
                className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-md text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${canReschedule
                    ? 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <CalendarClock size={18} /> Reschedule
              </button>
            </div>
          )}


          {type === 'completed' && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleModalOpen({ type: 'Rating', data: data })}
                className="px-6 py-3 rounded-xl flex items-center gap-2 shadow-md text-sm font-semibold transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white cursor-pointer"
              >
                <Star size={18} /> Add Review
              </button>
            </div>
          )}

          {type === 'cancelled' && (
            <div className="flex gap-3 justify-end">
              <span className="bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Ban size={16} /> Cancelled
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* <Header/> */}
      <section className="px-5 py-6 pt-28 bg-gradient-to-br from-gray-50 to-red-50/30 min-h-screen">
        <article className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-center gap-3 flex-wrap">
            {['upcoming', 'completed', 'cancelled', 'expired'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    router.push(`?active=${tab}`);
                  }}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold capitalize shadow-md transform hover:scale-105 ${isActive
                    ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-red-500 border-r-red-700 absolute top-0 left-0"></div>
                </div>
              </div>
            ) : consultationHistory[activeTab as keyof ConsultationHistory]?.length > 0 ? (
              consultationHistory[activeTab as keyof ConsultationHistory]?.map((appt) =>
                renderAppointmentCard(appt, activeTab)
              )
            ) : customerId ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-2xl shadow-sm">
                <div className="p-6 bg-gradient-to-br from-gray-100 to-red-100/50 rounded-full mb-4">
                  <Video size={48} className="text-gray-400" />
                </div>
                <p className="mt-2 text-lg font-medium">No {activeTab} appointments found</p>
                <p className="text-sm text-gray-500 mt-1">Your {activeTab} consultations will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-2xl shadow-sm">
                <div className="p-6 bg-gradient-to-br from-red-100 to-pink-100/50 rounded-full mb-4">
                  <UserCircle2 size={48} className="text-red-500" />
                </div>
                <p className="mt-2 text-xl font-semibold text-gray-700">Sign in to view your bookings</p>
                <p className="text-sm text-gray-500 mt-1">Please log in to see your consultation history</p>
              </div>
            )
            }
          </div>
        </article>
      </section>

      <RescheduleComponent
        astrologerId={modalData?.astrologerId}
        duration_minutes={modalData?.duration_minutes}
        consultation_type={modalData?.consultation_type}
        bookingId={modalData?.bookingId}
        isOpen={modalData?.isConsultationModalOpen}
        ConsultantDate={modalData?.date}
        toTime={modalData?.toTime}
        handleClose={handleModalClose}
      />

      <RatingModal
        isOpen={modalData.isRatingModalOpen}
        onClose={handleModalClose}
        consultation={modalData.data}
      />

      {/* <CustomerLoginSheet
        isOpen={isLoginOpen}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      /> */}
    </>
  );
};

export default MyBooking;
