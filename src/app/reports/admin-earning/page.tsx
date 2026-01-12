'use client';

import React, { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import MainDatatable from '@/components/common/MainDatatable';
import { Tooltip } from '@mui/material';
import { CSVLink } from 'react-csv';
import { Calendar, Filter, Download } from 'lucide-react';

// Types
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
}

// Utility functions
const IndianRupee = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
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
    'puja': 'Puja'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
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
    type: 'all' as 'all' | 'Consultation' | 'puja',
    startDate: '',
    endDate: '',
  });
  const [searchText, setSearchText] = useState('');

  // ✅ NEW: Filtered data with search
  const filteredData = useMemo(() => {
    let filtered = [...allAdminEarningData];

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => formatType(item.type) === filters.type);
    }

    // Apply search filter
    filtered = searchFilterData(filtered, searchText);

    return filtered;
  }, [allAdminEarningData, filters.type, searchText]);

  // CSV Data for ALL records export (uses filtered data)
  const prepareCSVData = useMemo(() => {
    return filteredData.map((item, index) => ({
      "S.No.": index + 1,
      "Type": formatType(item.type),
      "Astrologer": getAstrologerName(item.astrologerId),
      "Customer Name": item.customerId?.customerName || 'N/A',
      "Customer Email": item.customerId?.email || 'N/A',
      "Total Price": item.totalPrice,
      "Admin Share": item.adminPrice,
      "Astro Share": item.partnerPrice,
      "Duration (min)": item.duration || 0,
      "Date": item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY') : 'N/A',
      "Astrologer ID": typeof item.astrologerId === 'object' ? item.astrologerId?._id : item.astrologerId || 'N/A',
      "Customer ID": item.customerId?._id || 'N/A',
      "Transaction ID": item.transactionId || 'N/A',
    }));
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

  // DataTable Columns - INCREASED WIDTHS
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
      width: '150px',
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
      name: 'Customer Name',
      selector: (row: AdminEarningRow) => row?.customerId?.customerName || 'N/A',
      cell: (row: AdminEarningRow) => (
        <span className="font-medium text-gray-900">{row?.customerId?.customerName || 'N/A'}</span>
      ),
      width: '200px',
      sortable: true,
      export: true,
    },
    {
      name: "Customer's Email",
      selector: (row: AdminEarningRow) => row?.customerId?.email || 'N/A',
      cell: (row: AdminEarningRow) => {
        const email = row?.customerId?.email?.trim() || "N/A";
        return (
          <Tooltip title={email}>
            <span className="truncate block w-full text-sm text-gray-900 max-w-[160px]">{email}</span>
          </Tooltip>
        );
      },
      width: '220px',
      sortable: true,
      export: true,
    },
    {
      name: 'Total Price',
      selector: (row: AdminEarningRow) => parseFloat(row?.totalPrice || '0'),
      cell: (row: AdminEarningRow) => (
        <div className="font-semibold text-lg text-gray-900">
          {IndianRupee(row?.totalPrice)}
        </div>
      ),
      width: '150px',
      sortable: true,
      export: true,
      format: (row: AdminEarningRow) => row?.totalPrice || '0',
    },
    {
      name: 'Admin Share',
      selector: (row: AdminEarningRow) => parseFloat(row?.adminPrice || '0'),
      cell: (row: AdminEarningRow) => (
        <div className="font-bold text-green-600 text-lg">
          {IndianRupee(row?.adminPrice)}
        </div>
      ),
      width: '150px',
      sortable: true,
      export: true,
      format: (row: AdminEarningRow) => row?.adminPrice || '0',
    },
    {
      name: 'Astro Share',
      selector: (row: AdminEarningRow) => parseFloat(row?.partnerPrice || '0'),
      cell: (row: AdminEarningRow) => IndianRupee(row?.partnerPrice),
      width: '150px',
      sortable: true,
      export: true,
      format: (row: AdminEarningRow) => row?.partnerPrice || '0',
    },
    {
      name: 'Duration (min)',
      selector: (row: AdminEarningRow) => row?.duration || 0,
      cell: (row: AdminEarningRow) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{row?.duration || 0}</span>
          <span className="text-xs text-gray-500">min</span>
        </div>
      ),
      width: '130px',
      sortable: true,
      export: true,
      format: (row: AdminEarningRow) => (row?.duration || 0).toString(),
    },
    {
      name: 'Date',
      selector: (row: AdminEarningRow) => row?.createdAt || '',
      cell: (row: AdminEarningRow) => 
        row?.createdAt ? moment(row?.createdAt).format('DD/MM/YYYY') : 'N/A',
      width: '150px',
      sortable: true,
      export: true,
      format: (row: AdminEarningRow) => 
        row?.createdAt ? moment(row?.createdAt).format('DD/MM/YYYY') : 'N/A',
    },
    // Hidden columns for CSV export only
    {
      name: 'Astrologer ID',
      selector: (row: AdminEarningRow) => {
        if (!row?.astrologerId) return 'N/A';
        if (typeof row.astrologerId === 'object' && row.astrologerId !== null) {
          return (row.astrologerId as AstrologerDetails)._id || 'N/A';
        }
        return row.astrologerId || 'N/A';
      },
      omit: true,
      export: true,
    },
    {
      name: 'Customer ID',
      selector: (row: AdminEarningRow) => row?.customerId?._id || 'N/A',
      omit: true,
      export: true,
    },
    {
      name: 'Transaction ID',
      selector: (row: AdminEarningRow) => row?.transactionId || 'N/A',
      omit: true,
      export: true,
    },
  ], []);

  const hasActiveFilters = filters.type !== 'all' || filters.startDate || filters.endDate || searchText;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Earnings</h1>
          {/* ✅ Show filtered count */}
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredData.length} of {allAdminEarningData.length} records
          </p>
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
              <option value="Consultation">Consultation</option>
              <option value="puja">Puja</option>
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

          {/* ✅ Search - NOW WORKS */}
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
                filename={`Admin_Earnings_ALL_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download All ({filteredData.length})
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
        data={filteredData}  // ✅ Now uses filtered data
        columns={columns.map(col => ({
          ...col,
          minwidth: col.width,
          width: undefined,
        }))}
        title="Admin Earnings Report"
        isLoading={isLoading}
        exportHeaders={true}
        fileName={`Admin_Earnings_${moment().format('YYYY-MM-DD_HH-mm-ss')}`}
        showSearch={false} // Custom search above
      />
    </div>
  );
};

export default AdminEarning;
