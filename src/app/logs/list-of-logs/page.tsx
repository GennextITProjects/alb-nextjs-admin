'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Video, Phone, CheckCircle, Clock, Calendar, User, CreditCard, Loader2, XCircle, AlertCircle } from 'lucide-react';
import MainDatatable from '@/components/LogsDataTable';

// Types
interface ConsultationLog {
  _id: string;
  paymentDetails: {
    paymentId: string;
    currency: string;
    bank: string;
    email: string;
    contact: string;
    fee: number;
    tax: number;
    transactionId: string;
    createdAt: string;
    paymentAmount?: number;
    paymentMethod?: string;
  };
  customerId: {
    _id: string;
    email: string;
  };
  astrologerId: {
    _id: string;
  };
  fullName: string;
  
  mobileNumber: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  slotId: {
    _id: string;
    duration: number;
    createdAt: string;
  };
  date: string;
  fromTime: string;
  toTime: string;
  status: string;
  consultationPrice: number;
  consultationType: string;
  consultationTopic: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  razorpay_order_id?: string;
  bookingId?: string;
}

const ConsultationLogsPage = () => {
  const [allData, setAllData] = useState<ConsultationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(() => getTodayDate());
  const [endDate, setEndDate] = useState(() => getTodayDate());

  const normalizeStatus = (status: string): string => {
    if (status === 'in-progress') {
      return 'failed';
    }
    return status;
  };

  const getStatusDisplay = (log: ConsultationLog) => {
    const status = log.status;
    
    if (status === 'in-progress') {
      return {
        label: 'Failed',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: <XCircle className="w-3.5 h-3.5" />
      };
    }
    
    switch (status) {
      case 'pending_payment':
        return {
          label: 'Pending Payment',
          color: 'amber',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case 'booked':
        return {
          label: 'Booked',
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: <XCircle className="w-3.5 h-3.5" />
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: status,
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: <Clock className="w-3.5 h-3.5" />
        };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        params.set('startDate', startDate);
        
        if (startDate !== endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1);
          const endDatePlusOne = endDateObj.toISOString().split('T')[0];
          params.set('endDate', endDatePlusOne);
        }
        
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/customers/all_consultation_logs?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setAllData(result.data);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    if (newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);
    if (newEndDate < startDate) {
      setStartDate(newEndDate);
    }
  };

  const filteredLogs = useMemo(() => {
    return allData.filter(log => {
      const normalizedStatus = normalizeStatus(log.status);
      
      const matchesStatus = statusFilter === 'all' || 
                           normalizedStatus === statusFilter ||
                           log.status === statusFilter;
      
      return matchesStatus;
    });
  }, [statusFilter, allData]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: allData.length,
      pending_payment: 0,
      booked: 0,
      failed: 0,
      completed: 0,
      cancelled: 0
    };
    
    allData.forEach(log => {
      const status = log.status;
      if (status === 'in-progress') {
        counts.failed++;
      } else if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [allData]);

  // Status filters configuration
  const statusFilters = [
    { label: 'All', value: 'all', count: statusCounts.all },
    { label: 'Pending Payment', value: 'pending_payment', count: statusCounts.pending_payment },
    { label: 'Booked', value: 'booked', count: statusCounts.booked },
    { label: 'Failed', value: 'failed', count: statusCounts.failed },
    { label: 'Completed', value: 'completed', count: statusCounts.completed },
    { label: 'Cancelled', value: 'cancelled', count: statusCounts.cancelled }
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getPaymentStatus = (paymentDetails: any) => {
    return paymentDetails.paymentId && paymentDetails.paymentId !== '';
  };

  const getConsultationIcon = (type: string) => {
    return type === 'videocall' ? 
      <Video className="w-4 h-4 text-indigo-600" /> : 
      <Phone className="w-4 h-4 text-indigo-600" />;
  };

  const columns = useMemo(() => [
    {
      name: 'Name',
      selector: (row: ConsultationLog) => row.fullName,
      cell: (row: ConsultationLog) => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{row.fullName}</div>
            <div className="text-xs text-gray-500">{row.mobileNumber}</div>
          </div>
        </div>
      ),
      sortable: true,
      width: '300px',
    },
    {
      name: 'Type',
      selector: (row: ConsultationLog) => row.consultationType,
      cell: (row: ConsultationLog) => (
        <div className="flex justify-center">
          {getConsultationIcon(row.consultationType)}
        </div>
      ),
      width: '175px',
    },
    {
      name: 'Payment',
      selector: (row: ConsultationLog) => getPaymentStatus(row.paymentDetails) ? 'Paid' : 'Unpaid',
      cell: (row: ConsultationLog) => (
        getPaymentStatus(row.paymentDetails) ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3.5 h-3.5" />
            Paid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <XCircle className="w-3.5 h-3.5" />
            Unpaid
          </span>
        )
      ),
      sortable: true,
      width: '170px',
    },
    {
      name: 'Status',
      selector: (row: ConsultationLog) => row.status,
      cell: (row: ConsultationLog) => {
        const statusDisplay = getStatusDisplay(row);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
            {statusDisplay.icon}
            {statusDisplay.label}
          </span>
        );
      },
      sortable: true,
      width: '250px',
    },
    {
      name: 'Time Slot',
      selector: (row: ConsultationLog) => row.fromTime,
      cell: (row: ConsultationLog) => (
        <div className="text-sm font-medium text-gray-900">
          {row.fromTime} - {row.toTime}
        </div>
      ),
      width: '180px',
    },
    {
      name: 'Created At',
      selector: (row: ConsultationLog) => row.createdAt,
      cell: (row: ConsultationLog) => (
        <div>
          <div className="text-sm text-gray-900">{formatTime(row.createdAt)}</div>
          <div className="text-xs text-gray-500">{formatDate(row.createdAt)}</div>
        </div>
      ),
      sortable: true,
      width: '130px',
    },
  ], []);

  // Expandable row component
  const ExpandedComponent = ({ data }: { data: ConsultationLog }) => {
    const statusDisplay = getStatusDisplay(data);
    
    return (
      <div className="px-6 py-6 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                Customer Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Full Name</span>
                  <span className="text-sm font-medium text-gray-900">{data.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900 truncate ml-4">{data?.paymentDetails?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mobile</span>
                  <span className="text-sm font-medium text-gray-900">{data.mobileNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date of Birth</span>
                  <span className="text-sm font-medium text-gray-900">{data.dateOfBirth ? formatDate(data.dateOfBirth) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Birth Time</span>
                  <span className="text-sm font-medium text-gray-900">{data.timeOfBirth || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Place of Birth</span>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{data.placeOfBirth || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Customer ID</span>
                  <span className="sm:text-sm font-medium text-gray-900 text-right ml-4 font-mono text-xs">{data?.customerId?._id}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Astrologer ID</span>
                  <span className="sm:text-sm font-medium text-gray-900 text-right ml-4 font-mono text-xs">{data?.astrologerId?._id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Consultation Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${statusDisplay.textColor}`}>{statusDisplay.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(data.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Time Slot</span>
                  <span className="text-sm font-medium text-gray-900">{data.fromTime} - {data.toTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">{data?.slotId?.duration} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{data.consultationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Topic</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{data.consultationTopic || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(data.consultationPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Log ID</span>
                  <span className="sm:text-sm font-medium text-gray-900 font-mono text-xs">{data._id}</span>
                </div>
                {data.razorpay_order_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order ID</span>
                    <span className="sm:text-sm font-medium text-gray-900 font-mono text-xs">{data.razorpay_order_id}</span>
                  </div>
                )}
                {data.bookingId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Booking ID</span>
                    <span className="sm:text-sm font-medium text-green-600 font-mono text-xs">{data.bookingId}</span>
                  </div>
                )}
              </div>
            </div>

            {getPaymentStatus(data.paymentDetails) && (
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Payment Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment ID</span>
                    <span className="sm:text-sm font-medium text-gray-900 font-mono text-xs">{data.paymentDetails?.paymentId}</span>
                  </div>
                  {data.paymentDetails.paymentAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(data.paymentDetails?.paymentAmount)}</span>
                    </div>
                  )}
                  {data.paymentDetails.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Method</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{data.paymentDetails.paymentMethod}</span>
                    </div>
                  )}
                  {data.paymentDetails.bank && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bank</span>
                      <span className="text-sm font-medium text-gray-900">{data.paymentDetails.bank}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction Fee</span>
                    <span className="text-sm font-medium text-gray-900">₹{data.paymentDetails.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="text-sm font-medium text-gray-900">₹{data.paymentDetails.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Currency</span>
                    <span className="text-sm font-medium text-gray-900">{data.paymentDetails.currency}</span>
                  </div>
                  {data.paymentDetails.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transaction ID</span>
                      <span className="sm:text-sm font-medium text-gray-900 font-mono text-xs">{data.paymentDetails.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Date filters component
  const dateFiltersComponent = (
    <>
      <input
        type="date"
        value={startDate}
        max={getTodayDate()}
        onChange={(e) => handleStartDateChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <span className="text-gray-500 text-sm">to</span>
      <input
        type="date"
        value={endDate}
        max={getTodayDate()}
        min={startDate}
        onChange={(e) => handleEndDateChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading consultation logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto">
        <MainDatatable
          data={filteredLogs}
          columns={columns}
          title="Consultation Logs"
          isLoading={loading}
          showSearch={true}
          expandableRows={true}
          
          expandableRowsComponent={ExpandedComponent}
          statusFilters={statusFilters}
          onStatusFilterChange={setStatusFilter}
          selectedStatus={statusFilter}
          dateFilters={dateFiltersComponent}
          addButtonActive={false}
        />
      </div>
    </div>
  );
};

export default ConsultationLogsPage;