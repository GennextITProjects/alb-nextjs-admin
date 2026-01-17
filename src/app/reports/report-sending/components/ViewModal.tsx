import React from "react";
import moment from "moment";
import { X } from "lucide-react";
import { Order } from "../types";

interface Props {
  order: Order;
  onClose: () => void;
}

const formatValue = (value: any, key: string): string => {
  if (!value) return "—";
  
  if (key.includes("Date") || key === "createdAt" || key === "paymentAt") {
    return moment(value).format("DD/MM/YYYY hh:mm A");
  }
  
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  return String(value);
};

// ViewModal.tsx
export const ViewModal: React.FC<Props> = ({ order, onClose }) => {
  const fields = [
    // Existing fields...
    { key: "orderID", label: "Order ID" },
    { key: "planName", label: "Plan" },
    { key: "amount", label: "Amount", prefix: "₹" },
    { key: "status", label: "Payment Status" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "gender", label: "Gender" },
    { key: "reportLanguage", label: "Language" },
    { key: "dateOfBirth", label: "DOB" },
    { key: "timeOfBirth", label: "TOB" },
    { key: "placeOfBirth", label: "POB" },
    { key: "astroConsultation", label: "Consultation" },
    { key: "expressDelivery", label: "Express" },
    { key: "paymentTxnId", label: "Payment ID" },
    { key: "razorpayOrderId", label: "Razorpay ID" },
    
    // ✅ NEW REPORT DELIVERY FIELDS
    { key: "reportDeliveryStatus", label: "Report Status" },
    { key: "driveFileUrl", label: "Drive URL", isLink: true },
    { key: "drivePdfUploaded", label: "PDF Uploaded" },
    { key: "driveUploadedAt", label: "Drive Uploaded" },
    { key: "reportDeliveryAttemptedAt", label: "Delivery Attempted" },
    { key: "reportDeliveryCompletedAt", label: "Delivery Completed" },
    { key: "reportGenerationError", label: "PDF Error" },
    { key: "driveUploadError", label: "Drive Error" },
    { key: "emailSendError", label: "Email Error" },
    
    { key: "paymentAt", label: "Payment Date" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6">Order Details</h2>
        
        {/* ✅ REPORT STATUS SUMMARY CARD */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            📊 Report Delivery Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                order.reportDeliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                order.reportDeliveryStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.reportDeliveryStatus || 'Not Started'}
              </span>
            </div>
            {order.driveFileUrl && (
              <div>
                <span className="text-gray-600">Report:</span>
                <a 
                  href={order.driveFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  📄 View PDF
                </a>
              </div>
            )}
            {order.reportGenerationError && (
              <div className="col-span-3">
                <span className="text-red-600 font-medium">⚠️ Error: {order.reportGenerationError}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fields.map(({ key, label, prefix, isLink }) => {
            const value = order[key as keyof Order];
            
            // Skip empty values for cleaner UI
            if (value === null || value === undefined || value === '') return null;
            
            return (
              <div key={key} className="space-y-1">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {label}
                </div>
                <div className="font-medium text-gray-900 break-words text-sm">
                  {isLink && value ? (
                    <a 
                      href={value as string} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate max-w-[250px] block"
                      title={String(value)}
                    >
                      📎 {String(value).slice(0, 50)}...
                    </a>
                  ) : (
                    prefix + formatValue(value, key)
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

