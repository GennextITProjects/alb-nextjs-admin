'use client';

import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { TableColumn } from 'react-data-table-component';
import MainDatatable from '@/components/common/MainDatatable';

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
  historyId: string;
  duration: number;
  chargePerMinutePrice: number;
  startTime: string;
  endTime: string;
  transactionType: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  history: AdminEarningRow[];
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

// API function to fetch admin earnings
const getAdminEarnings = async (): Promise<AdminEarningRow[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/get_admin_earnig_history`);
    if (!response.ok) {
      throw new Error('Failed to fetch admin earnings');
    }
    const data: ApiResponse = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching admin earnings:', error);
    return [];
  }
};

const AdminEarning: React.FC = () => {
  const [adminEarningData, setAdminEarningData] = useState<AdminEarningRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // DataTable Columns
  const columns = [
    {
      name: '',
      selector: (row: AdminEarningRow) => adminEarningData.indexOf(row) + 1,
      width: '40px',
    },
    {
      name: 'Type',
      selector: (row: AdminEarningRow) => row?.type,
      cell: (row: AdminEarningRow) => (
        <div style={{ textTransform: 'capitalize' }}>
          {row?.type === 'live_video_call' ? 'Live Call' : row?.type}
        </div>
      ),
      width: '120px',
    },
    {
      name: 'Astrologers',
      selector: (row: AdminEarningRow) => {
        if (!row?.astrologerId) return '';
        if (typeof row.astrologerId === 'object' && row.astrologerId !== null) {
          return (row.astrologerId as AstrologerDetails).astrologerName || 'N/A';
        }
        return 'N/A';
      },
      width: '120px',
    },
    {
      name: 'Customers',
      selector: (row: AdminEarningRow) => row?.customerId?.customerName || row?.customerId?.email || 'N/A',
      width: '140px',
    },
    {
      name: 'Total Price',
      selector: (row: AdminEarningRow) => row?.totalPrice,
      cell: (row: AdminEarningRow) => IndianRupee(row?.totalPrice),
    },
    {
      name: 'Admin Share',
      selector: (row: AdminEarningRow) => row?.adminPrice,
      cell: (row: AdminEarningRow) => IndianRupee(row?.adminPrice),
    },
    {
      name: 'Astro Share',
      selector: (row: AdminEarningRow) => row?.partnerPrice,
      cell: (row: AdminEarningRow) => IndianRupee(row?.partnerPrice),
    },
    {
      name: 'Duration',
      selector: (row: AdminEarningRow) => row?.duration || 0,
      cell: (row: AdminEarningRow) => (row?.duration ? `${row.duration} min` : 'N/A'),
    },
    {
      name: 'Charge/Min',
      selector: (row: AdminEarningRow) => row?.chargePerMinutePrice || 0,
      cell: (row: AdminEarningRow) => row?.chargePerMinutePrice ? IndianRupee(row.chargePerMinutePrice) : 'N/A',
    },
    {
      name: 'Start Time',
      selector: (row: AdminEarningRow) => row?.startTime || '',
      cell: (row: AdminEarningRow) => row?.startTime || 'N/A',
    },
    {
      name: 'End Time',
      selector: (row: AdminEarningRow) => row?.endTime || '',
      cell: (row: AdminEarningRow) => row?.endTime || 'N/A',
    },
    {
      name: 'Date',
      selector: (row: AdminEarningRow) => row?.createdAt || '',
      cell: (row: AdminEarningRow) =>
        row?.createdAt ? moment(row?.createdAt).format('DD/MM/YYYY') : 'N/A',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getAdminEarnings();
      setAdminEarningData(data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <>
      <div
       
      >
        <MainDatatable
          data={adminEarningData}
          columns={columns}
          title="Admin Earning"
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

export default AdminEarning;