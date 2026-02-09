/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import MainDatatable from '@/components/common/MainDatatable';
import { Tooltip } from '@mui/material';
import { CSVLink } from 'react-csv';
import { Calendar, Filter, Download, Info } from 'lucide-react';

// Updated Types with earningBreakdown
interface CustomerDetails {
  _id: string;
  customerName: string;
  email: string;
}

interface AstrologerDetails {
  _id: string;
  astrologerName: string;
  email?: string;
}

interface EarningBreakdown {
  totalPaidByUser: number;
  gstAmount: number;
  netAmount: number;
  astrologerShareBeforeTDS: number;
  tdsAmount: number;
  payableToAstrologer: number;
  adminShare: number;
  astrologerEarningPercentage: number;
  tdsPercentage: number;
}

interface AdminEarningRow {
  _id: string;
  type: string;
  astrologerId: string | null | AstrologerDetails;
  customerId: CustomerDetails | null;
  transactionId: string;
  totalPrice: string;
  adminPrice: string;
  partnerPrice: string;
  duration: number;
  chargePerMinutePrice: number;
  startTime: string;
  endTime: string;
  transactionType: string;
  createdAt: string;
  updatedAt: string;
  earningBreakdown?: EarningBreakdown; // Added earningBreakdown
}

// Utility functions
const IndianRupee = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Helper function to get astrologer name
const getAstrologerName = (astrologerId: string | null | AstrologerDetails): string => {
  if (!astrologerId) return 'N/A';
  if (typeof astrologerId === 'object' && astrologerId !== null) {
    return (astrologerId as AstrologerDetails).astrologerName || 'N/A';
  }
  return 'N/A';
};

// Helper function to format type
const formatType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'live_video_call': 'Live Call',
    'consultation': 'Consultation',
    'puja': 'Puja',
    'chat': 'Chat',
    'call': 'Call',
    'video_call': 'Video Call'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Check if has earningBreakdown
const hasEarningBreakdown = (row: AdminEarningRow): boolean => {
  return !!row.earningBreakdown && 
         Object.keys(row.earningBreakdown).length > 0 && 
         typeof row.earningBreakdown === 'object';
};

// ✅ NEW: Frontend Search Filter Function
const searchFilterData = (data: AdminEarningRow[], searchText: string): AdminEarningRow[] => {
  if (!searchText.trim()) return data;

  const searchLower = searchText.toLowerCase();
  
  return data.filter((item) => {
    // Search across all relevant fields
    const astrologerName = getAstrologerName(item.astrologerId).toLowerCase();
    const customerName = item.customerId?.customerName?.toLowerCase() || '';
    const customerEmail = item.customerId?.email?.toLowerCase() || '';
    const typeFormatted = formatType(item.type).toLowerCase();
    const transactionId = item.transactionId.toLowerCase();
    const totalPrice = item.totalPrice;
    const adminPrice = item.adminPrice;
    const partnerPrice = item.partnerPrice;
    const duration = item.duration.toString();
    
    return (
      astrologerName.includes(searchLower) ||
      customerName.includes(searchLower) ||
      customerEmail.includes(searchLower) ||
      typeFormatted.includes(searchLower) ||
      transactionId.includes(searchLower) ||
      totalPrice.includes(searchLower) ||
      adminPrice.includes(searchLower) ||
      partnerPrice.includes(searchLower) ||
      duration.includes(searchLower)
    );
  });
};

const AdminEarning: React.FC = () => {
  const [allAdminEarningData, setAllAdminEarningData] = useState<AdminEarningRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'Consultation' | 'puja' | 'chat' | 'call' | 'video_call',
    startDate: '',
    endDate: '',
  });
  const [searchText, setSearchText] = useState('');

  // ✅ NEW: Filtered data with search
  // const filteredData = useMemo(() => {
  //   let filtered = [...allAdminEarningData];

  //   // Apply type filter
  //   if (filters.type !== 'all') {
  //     filtered = filtered.filter(item => item.type === filters.type);
  //   }

  //   // Apply search filter
  //   filtered = searchFilterData(filtered, searchText);

  //   return filtered;
  // }, [allAdminEarningData, filters.type, searchText]);
  // ✅ NEW: Filtered data with search AND live astrologer filter
const filteredData = useMemo(() => {
  let filtered = [...allAdminEarningData];

  // Apply type filter
  if (filters.type !== 'all') {
    filtered = filtered.filter(item => item.type === filters.type);
  }

  // ✅ Filter out live astrologers (isLive: true)
  filtered = filtered.filter(item => {
    const astrologer = item.astrologerId;
    if (!astrologer) return true;
    if (typeof astrologer === 'object') {
      // Check if astrologer object has isLive property
      return !(astrologer as any).isLive; // Hide if isLive is true
    }
    return true;
  });

  // Apply search filter
  filtered = searchFilterData(filtered, searchText);

  return filtered;
}, [allAdminEarningData, filters.type, searchText]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      const breakdown = item.earningBreakdown;
      const total = parseFloat(item.totalPrice || '0');
      const admin = parseFloat(item.adminPrice || '0');
      const partner = parseFloat(item.partnerPrice || '0');
      
      return {
        total: acc.total + total,
        admin: acc.admin + admin,
        partner: acc.partner + partner,
        tds: acc.tds + (breakdown?.tdsAmount || 0),
        gst: acc.gst + (breakdown?.gstAmount || 0),
        net: acc.net + (breakdown?.netAmount || 0),
      };
    }, { total: 0, admin: 0, partner: 0, tds: 0, gst: 0, net: 0 });
  }, [filteredData]);

  // CSV Data for ALL records export (uses filtered data)
  const prepareCSVData = useMemo(() => {
    return filteredData.map((item, index) => {
      const breakdown = item.earningBreakdown;
      const hasBreakdown = hasEarningBreakdown(item);
      
      return {
        "S.No.": index + 1,
        "Type": formatType(item.type),
        "Astrologer": getAstrologerName(item.astrologerId),
        "Customer Name": item.customerId?.customerName || 'N/A',
        "Customer Email": item.customerId?.email || 'N/A',
        "Total Amount": hasBreakdown ? breakdown?.totalPaidByUser || item.totalPrice : item.totalPrice,
        "GST Amount": hasBreakdown ? breakdown?.gstAmount || 0 : 0,
        "Net Amount": hasBreakdown ? breakdown?.netAmount || 0 : item.totalPrice,
        "Admin Share": hasBreakdown ? breakdown?.adminShare || item.adminPrice : item.adminPrice,
        "Astrologer Share": hasBreakdown ? breakdown?.astrologerShareBeforeTDS || item.partnerPrice : item.partnerPrice,
        "TDS (2%)": hasBreakdown ? breakdown?.tdsAmount || 0 : 0,
        "Astrologer Earning After TDS": hasBreakdown ? breakdown?.payableToAstrologer || item.partnerPrice : item.partnerPrice,
        "Astrologer %": hasBreakdown ? `${breakdown?.astrologerEarningPercentage || 0}%` : 'N/A',
        "Duration (min)": item.duration || 0,
        "Date": item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY') : 'N/A',
        "Time": item.createdAt ? moment(item.createdAt).format('hh:mm A') : 'N/A',
        "Astrologer ID": typeof item.astrologerId === 'object' ? item.astrologerId?._id : item.astrologerId || 'N/A',
        "Customer ID": item.customerId?._id || 'N/A',
        "Transaction ID": item.transactionId || 'N/A',
        "Has Breakdown": hasBreakdown ? 'Yes' : 'No',
      };
    });
  }, [filteredData]);

  // API function to fetch admin earnings
  const fetchAdminEarnings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.type !== 'all') params.set('type', filters.type);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/get_admin_earnig_history2?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin earnings');
      }

      const data = await response.json();
      console.log('Admin Earnings API Response:', data); // Debug log
      
      const sortedHistory = (data.history || []).sort(
        (a: AdminEarningRow, b: AdminEarningRow) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAllAdminEarningData(sortedHistory);
    } catch (error) {
      console.error('Error fetching admin earnings:', error);
      setAllAdminEarningData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and filter changes (date/type only)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdminEarnings();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.startDate, filters.endDate, filters.type]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Date validation
    if (name === "startDate" && filters.endDate && value > filters.endDate) {
      alert("Start date cannot be after end date");
      return;
    }
    if (name === "endDate" && filters.startDate && value < filters.startDate) {
      alert("End date cannot be before start date");
      return;
    }
    
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
    });
    setSearchText('');
  };

  // DataTable Columns - UPDATED for earningBreakdown
  const columns = useMemo(() => [
    {
      name: 'S.No.',
      selector: (row: AdminEarningRow, rowIndex?: number) => (rowIndex ?? 0) + 1,
      width: '80px',
      sortable: false,
    },
    {
      name: 'Type',
      selector: (row: AdminEarningRow) => formatType(row?.type),
      cell: (row: AdminEarningRow) => (
        <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>
          {formatType(row?.type)}
        </div>
      ),
      width: '120px',
      sortable: true,
      export: true,
    },
    {
      name: 'Astrologers',
      selector: (row: AdminEarningRow) => getAstrologerName(row?.astrologerId),
      cell: (row: AdminEarningRow) => (
        <span className="font-medium text-gray-900">{getAstrologerName(row?.astrologerId)}</span>
      ),
      width: '180px',
      sortable: true,
      export: true,
    },
    {
      name: 'Customer',
      selector: (row: AdminEarningRow) => row?.customerId?.customerName || 'N/A',
      cell: (row: AdminEarningRow) => (
        <div>
          <div className="font-medium text-gray-900">{row?.customerId?.customerName || 'N/A'}</div>
          {row?.customerId?.email && (
            <div className="text-xs text-gray-500 truncate max-w-[180px]">
              {row.customerId.email}
            </div>
          )}
        </div>
      ),
      width: '220px',
      sortable: true,
      export: true,
    },
    {
      name: 'Total Amount',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.totalPaidByUser) {
          return row.earningBreakdown.totalPaidByUser;
        }
        return parseFloat(row?.totalPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown :any = row.earningBreakdown;
        
        return (
          <div className="font-semibold text-gray-900">
            <div>{IndianRupee(hasBreakdown ? breakdown?.totalPaidByUser || row.totalPrice : row.totalPrice)}</div>
            {hasBreakdown && breakdown?.gstAmount > 0 && (
              <div className="text-xs text-gray-500">
                (GST: {IndianRupee(breakdown.gstAmount)})
              </div>
            )}
          </div>
        );
      },
      width: '150px',
      sortable: true,
      export: true,
    },
    {
      name: 'Admin Share',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.adminShare) {
          return row.earningBreakdown.adminShare;
        }
        return parseFloat(row?.adminPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;
        
        return (
          <div className="font-bold text-green-600">
            <div>{IndianRupee(hasBreakdown ? breakdown?.adminShare || row.adminPrice : row.adminPrice)}</div>
            {hasBreakdown && (
              <div className="text-xs text-gray-500">
                ({100 - (breakdown?.astrologerEarningPercentage || 0)}%)
              </div>
            )}
          </div>
        );
      },
      width: '150px',
      sortable: true,
      export: true,
    },
    {
      name: 'Astro Share',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.astrologerShareBeforeTDS) {
          return row.earningBreakdown.astrologerShareBeforeTDS;
        }
        return parseFloat(row?.partnerPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;
        
        return (
          <div>
            <div className="font-medium text-blue-600">
              {IndianRupee(hasBreakdown ? breakdown?.astrologerShareBeforeTDS || row.partnerPrice : row.partnerPrice)}
            </div>
            {hasBreakdown && (
              <div className="text-xs text-gray-500">
                ({breakdown?.astrologerEarningPercentage || 0}%)
              </div>
            )}
          </div>
        );
      },
      width: '150px',
      sortable: true,
      export: true,
    },
    {
      name: 'TDS',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row)) {
          return row.earningBreakdown?.tdsAmount || 0;
        }
        return 0;
      },
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown = row.earningBreakdown;
        
        if (!hasBreakdown || !breakdown?.tdsAmount) {
          return <span className="text-gray-400">-</span>;
        }
        
        return (
          <div className="text-amber-600 font-medium">
            <div>{IndianRupee(breakdown.tdsAmount)}</div>
            <div className="text-xs text-gray-500">({breakdown.tdsPercentage}%)</div>
          </div>
        );
      },
      width: '120px',
      sortable: true,
      export: true,
    },
    {
      name: 'Net to Astro',
      selector: (row: AdminEarningRow) => {
        if (hasEarningBreakdown(row) && row.earningBreakdown?.payableToAstrologer) {
          return row.earningBreakdown.payableToAstrologer;
        }
        return parseFloat(row?.partnerPrice || '0');
      },
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        const breakdown :any = row.earningBreakdown;
        
        return (
          <div className="font-semibold">
            <div className={`${hasBreakdown && breakdown?.tdsAmount > 0 ? 'text-green-700' : 'text-green-600'}`}>
              {IndianRupee(hasBreakdown ? breakdown?.payableToAstrologer || row.partnerPrice : row.partnerPrice)}
            </div>
            {hasBreakdown && breakdown?.tdsAmount > 0 && (
              <div className="text-xs text-gray-500">
                After TDS
              </div>
            )}
          </div>
        );
      },
      width: '150px',
      sortable: true,
      export: true,
    },
    {
      name: 'Duration',
      selector: (row: AdminEarningRow) => row?.duration || 0,
      cell: (row: AdminEarningRow) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{row?.duration || 0}</span>
          <span className="text-xs text-gray-500">min</span>
        </div>
      ),
      width: '100px',
      sortable: true,
      export: true,
    },
    {
      name: 'Date & Time',
      selector: (row: AdminEarningRow) => row?.createdAt || '',
      cell: (row: AdminEarningRow) => (
        <div className="text-sm">
          <div>{row?.createdAt ? moment(row?.createdAt).format('DD/MM/YYYY') : 'N/A'}</div>
          <div className="text-xs text-gray-500">
            {row?.createdAt ? moment(row?.createdAt).format('hh:mm A') : ''}
          </div>
        </div>
      ),
      width: '140px',
      sortable: true,
      export: true,
    },
    {
      name: 'Details',
      cell: (row: AdminEarningRow) => {
        const hasBreakdown = hasEarningBreakdown(row);
        
        if (!hasBreakdown) {
          return <span className="text-gray-400">-</span>;
        }
        
        return (
          <Tooltip 
            title={
              <div className="p-2 text-sm">
                <div className="font-semibold mb-2">Breakdown Details</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span>{IndianRupee(row.earningBreakdown?.totalPaidByUser || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span className="text-red-500">{IndianRupee(row.earningBreakdown?.gstAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Amount:</span>
                    <span>{IndianRupee(row.earningBreakdown?.netAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Astro Share:</span>
                    <span>{row.earningBreakdown?.astrologerEarningPercentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TDS:</span>
                    <span className="text-amber-600">{row.earningBreakdown?.tdsPercentage || 0}%</span>
                  </div>
                </div>
              </div>
            }
            arrow
            placement="left"
          >
            <button className="p-1 text-blue-600 hover:text-blue-800">
              <Info className="w-4 h-4" />
            </button>
          </Tooltip>
        );
      },
      width: '80px',
      sortable: false,
      export: false,
    },
  ], []);

  const hasActiveFilters = filters.type !== 'all' || filters.startDate || filters.endDate || searchText;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredData.length} of {allAdminEarningData.length} records
            {filteredData.length > 0 && ` • ${filteredData.filter(hasEarningBreakdown).length} with detailed breakdown`}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700 font-medium">Total Amount</div>
          <div className="text-xl font-bold text-blue-900 mt-1">{IndianRupee(totals.total)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 font-medium">Admin Earnings</div>
          <div className="text-xl font-bold text-green-900 mt-1">{IndianRupee(totals.admin)}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-700 font-medium">Astro Earnings</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{IndianRupee(totals.partner)}</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-700 font-medium">TDS Collected</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{IndianRupee(totals.tds)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-700 font-medium">GST Collected</div>
          <div className="text-xl font-bold text-red-900 mt-1">{IndianRupee(totals.gst)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700 font-medium">Net Amount</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{IndianRupee(totals.net)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="puja">Puja</option>
              <option value="chat">Chat</option>
              <option value="call">Call</option>
              <option value="video_call">Video Call</option>
            </select>
          </div>

          {/* Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              max={filters.endDate || undefined}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              min={filters.startDate || undefined}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* ✅ Search */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search astrologer, customer, email, transaction ID..."
              value={searchText}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Download All Records Button */}
          {filteredData.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export</label>
              <CSVLink
                data={prepareCSVData}
                filename={`Admin_Earnings_Detailed_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download ({filteredData.length})
              </CSVLink>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ✅ DataTable - Uses filteredData */}
      <MainDatatable
        data={filteredData}
        columns={columns.map(col => ({
          ...col,
          minwidth: col.width,
          width: undefined,
        }))}
        title="Admin Earnings Report"
        isLoading={isLoading}
        exportHeaders={true}
        fileName={`Admin_Earnings_Detailed_${moment().format('YYYY-MM-DD_HH-mm-ss')}`}
        showSearch={false}
      />

      {/* Legend for Breakdown */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-700">Legend:</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Astro Share: Earnings before TDS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Net to Astro: After TDS deduction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></div>
            <span>TDS: 2% tax deducted at source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>GST: 18% GST included in total</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEarning;