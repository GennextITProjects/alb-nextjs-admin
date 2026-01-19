export interface Order {
  _id: string;
  orderID: string;
  name: string;
  email: string;
  whatsapp: string;
  gender: string | null;
  reportLanguage: string;
  dateOfBirth: string;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  planName: string;
  amount: string;
  paymentAt: string;
  paymentTxnId: string;
  razorpayOrderId: string;
  orderFingerprint: string;
  astroConsultation: boolean;
  expressDelivery: boolean;
  reportDeliveryStatus?: 'pending' | 'delivered' | 'failed';
  drivePdfUploaded?: boolean;
  driveFileId?: string;
  driveFileUrl?: string;
  driveUploadedAt?: string;
  reportDeliveryAttemptedAt?: string;
  reportDeliveryCompletedAt?: string;
  reportGenerationError?: string;
  driveUploadError?: string;
  emailSendError?: string;
  status: "pending" | "paid" | "processing" | "delivered";
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: Order[];
}

// export interface Filters {
//   q: string;
//   from: string;
//   to: string;
//   language: string;
//   planName: string;
//   status: string;
//   sortBy: string;
//   sortOrder: "asc" | "desc";
//   limit: number;
// }


// types.ts - Add this to your existing types file
export interface Filters {
  q: string;
  from: string;
  to: string;
  language: string;
  planName: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  limit: number;
  selectFirstN?: number; // NEW: For selecting first N rows
}