// Slot and Booking Types
export interface SlotData {
  _id: string;
  fromTime: string;
  toTime: string;
  duration: number;
  status?: 'available' | 'booked' | 'blocked';
}

export interface ConsultationPrice {
  price: number;
  duration: {
    slotDuration: number;
  };
  consultationType: string;
}

// Astrologer Profile Types
export interface AstrologerData {
  _id: string;
  astrologerName: string;
  tagLine?: string;
  about?: string;
  experience: number;
  video_call_status : "offline" | "online",
  chat_status : "offline" | "online",
  call_status : "offline" | "online",
  language: string[];
  skill?: Array<{ skill: string }>;
  mainExpertise?: Array<{ mainExpertise: string }>;
  remedies?: Array<{ description: string }>;
  profileImage: string;
  multipleImages?: string[];
  multipleVideos?: string[];
  long_bio?: string;
  isoneline:string;
  consultationPrices?: ConsultationPrice[];
}
// Review Types
export interface Review {
  _id: string;
  customer: {
    _id: string;
    customerName: string;
    image: string;
  };
  astrologer: {
    _id: string;
    astrologerName: string;
  };
      customerName: string;

  callId: string;
  ratings: number;
  comments: string;
  is_verified: boolean;
  createdAt: string;
  updatedAt: string;
    customerImage : string;
    rating :  number;
  reviewText : string;

  __v: number;
}



// User Types
export interface User {
  _id: string;
  customerName: string;
  email: string;
  phoneNumber: string;
}

// Modal and UI State Types
export interface ModalData {
  isModalOpen: boolean;
  price: number | null;
  consultation_type: 'videocall' | 'call' | 'chat';
  duration_minutes: string;
  selectedDate: string | null;
  selectedSlot: SlotData | null;
}

export interface SessionType {
  title: string;
  value: 'videocall' | 'call' | 'chat';
  icon: React.ReactNode;
}

// API Response Types
export interface GetAvailableSlotsResponse {
  success: boolean;
  date: string;
  astrologerId: string;
  bookedSlots: SlotData[];
  availableSlots: SlotData[];
}

export interface AstrologerDetailsResponse {
  success: boolean;
  message?: string;
  astrologer: AstrologerData;
}

export interface ReviewsResponse {
  success: boolean;
  message?: string;
  reviews: Review[];
}

// Booking Data Types
export interface BookingData {
  slotId: string;
  astrologerId: string;
  price: number;
  duration: number;
  consultationType: 'videocall' | 'call' | 'chat';
  start_time: string;
}

// Component Props Types
export interface AstrologerProfileProps {
  astrologerData: AstrologerData;
}

export interface BookingSectionProps {
  astrologerId: string;
  astrologerData: AstrologerData;
  currentUser: User | null;
  onLoginRequired: () => void;
  consultationPrices: ConsultationPrice[];
}

export interface ReviewsSectionProps {
  reviews: Review[];
  loadingReviews: boolean;
  reviewsError: string | null;
  astrologerId: string | null;
  onRetryReviews: () => void;
}

export interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

// Loading and Error State Types
export interface LoadingStates {
  loadingAstrologer: boolean;
  loadingReviews: boolean;
  loadingSlots: boolean;
}

export interface ErrorStates {
  astrologerError: string | null;
  reviewsError: string | null;
  slotsError: string | null;
}

// Utility Types for Date/Time
export interface DateInfo {
  date: string;
  display: string;
  dayName: string;
}

export interface TimeSlotInfo extends SlotData {
  isSelected?: boolean;
  isAvailable?: boolean;
}

// Form Validation Types
export interface BookingValidation {
  hasSelectedSlot: boolean;
  hasUser: boolean;
  hasValidDate: boolean;
  canProceed: boolean;
}
