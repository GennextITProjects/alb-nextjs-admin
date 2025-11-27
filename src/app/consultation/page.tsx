"use client";

import moment from "moment";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainDatatable from "@/components/common/MainDatatable";
import DownloadIcon from "@mui/icons-material/Download";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";

interface PaymentDetails {
  paymentId?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  currency?: string;
  bank?: string | null;
  email?: string;
  contact?: string;
  fee?: number;
  tax?: number;
  createdAt?: string;
  transactionId?: string;
}

interface Slot {
  _id?: string;
  fromTime?: string;
  toTime?: string;
}

interface Customer {
  _id?: string;
  email?: string;
}

interface Astrologer {
  _id?: string;
  astrologerName?: string;
  title?: string;
}

interface Consultation {
  _id: string;
  astrologerId?: Astrologer;
  customerId?: Customer;
  fullName?: string;
  gender?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  date?: string;
  fromTime?: string;
  toTime?: string;
  slotId?: Slot;
  status?: string;
  reviewed?: boolean;
  consultationPrice?: number;
  consultationType?: string;
  consultationTopic?: string;
  couponCode?: string;
  astrologerJoined?: boolean;
  customerJoined?: boolean;
  latitude?: number;
  longitude?: number;
  meetingId?: string;
  meetingPassword?: string;
  paymentDetails?: PaymentDetails;
  createdAt?: string;
  updatedAt?: string;
  endTime?: string;
  __v?: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  bookings?: Consultation[];
  totalPages?: number;
  currentPage?: number;
}

interface Filters {
  status: string;
  customerName: string;
  astrologerName: string;
  startDate: string;
  endDate: string;
}

// Deep search function for client-side filtering
const DeepSearchSpace = (
  data: Consultation[],
  searchText: string
): Consultation[] => {
  if (!searchText) return data;

  const searchLower = searchText.toLowerCase();
  return data.filter((item) => {
    // Search in all relevant fields
    const searchableFields = [
      item?.astrologerId?.astrologerName,
      item?.fullName,
      item?.paymentDetails?.email,
      item?.mobileNumber,
      item?.dateOfBirth,
      item?.timeOfBirth,
      item?.placeOfBirth,
      item?.consultationType,
      item?.consultationTopic,
      item?.paymentDetails?.paymentAmount?.toString(),
      item?.paymentDetails?.paymentMethod,
      item?.status,
    ];

    return searchableFields.some(
      (val) => val && String(val).toLowerCase().includes(searchLower)
    );
  });
};

// Client-side filter function for filter dropdowns/inputs
const applyClientFilters = (
  data: Consultation[],
  filters: Filters
): Consultation[] => {
  return data.filter((item) => {
    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false;
    }

    // Customer name filter
    if (
      filters.customerName &&
      !item.fullName?.toLowerCase().includes(filters.customerName.toLowerCase())
    ) {
      return false;
    }

    // Astrologer name filter
    if (
      filters.astrologerName &&
      !item.astrologerId?.astrologerName
        ?.toLowerCase()
        .includes(filters.astrologerName.toLowerCase())
    ) {
      return false;
    }

    // Date range filtering - FIXED: Only filter if dates are provided
    if (filters.startDate || filters.endDate) {
      if (!item.date) return false; // Skip items without date

      const itemDate = moment(item.date).format("YYYY-MM-DD");
      
      // Start date filter
      if (filters.startDate && itemDate < filters.startDate) {
        return false;
      }
      
      // End date filter
      if (filters.endDate && itemDate > filters.endDate) {
        return false;
      }
    }

    return true;
  });
};

export default function Consultation() {
  const router = useRouter();

  const [consultationData, setConsultationData] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>({
    status: "",
    customerName: "",
    astrologerName: "",
    startDate: "",
    endDate: "",
  });

  const fetchConsultations = async () => {
    try {
      setLoading(true);

      const queryParams: Record<string, string> = {
        page: "1",
        limit: "1000",
      };

      // Only add filters if they have values
      if (filters.status) queryParams.status = filters.status;
      if (filters.customerName) queryParams.customerName = filters.customerName;
      if (filters.astrologerName) queryParams.astrologerName = filters.astrologerName;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;

      const query = new URLSearchParams(queryParams);

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/admin/all_consultations_booking?${query.toString()}`
      );
      const data: ApiResponse = await res.json();

      if (data.success && Array.isArray(data.bookings)) {
        setConsultationData(data.bookings);
      } else {
        setConsultationData([]);
      }
    } catch (error) {
      console.error("Failed to fetch consultation data:", error);
      setConsultationData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchConsultations();
    }, 300); 

    return () => clearTimeout(timeoutId);
  }, [filters.status, filters.customerName, filters.astrologerName, filters.startDate, filters.endDate]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Apply filters first, then search - FIXED: Correct data flow
  const filteredByFilters = applyClientFilters(consultationData, filters);
  const finalFilteredData = DeepSearchSpace(filteredByFilters, searchText);

  const columns = [
    {
      name: "S.No.",
      selector: (row: Consultation, index?: number) => (index ?? 0) + 1,
      width: "70px",
      sortable: false,
    },
    {
      name: "Astrologer",
      selector: (row: Consultation) =>
        row?.astrologerId?.astrologerName || "N/A",
      sortable: true,
      width: "150px",
    },
    {
      name: "Customer",
      selector: (row: Consultation) => row?.fullName || "N/A",
      sortable: true,
      width: "150px",
    },
    {
      name: "Email",
      cell: (row: Consultation) => {
        const email = row?.paymentDetails?.email?.trim() || "N/A";
        return (
          <Tooltip title={email}>
            <span className="truncate block w-full">{email}</span>
          </Tooltip>
        );
      },
      width: "200px",
    },
    {
      name: "Mobile",
      selector: (row: Consultation) => row?.mobileNumber || "N/A",
      width: "130px",
    },
    {
      name: 'DOB/TOB',
      cell: (row: Consultation) => {
        const dob = row?.dateOfBirth ? moment(row.dateOfBirth).format('DD/MM/YYYY') : 'N/A';
        const tob = row?.timeOfBirth ? moment(row.timeOfBirth, 'HH:mm').format('hh:mm A') : 'N/A';
        const value = `${dob} / ${tob}`;

        return (
          <Tooltip title={value}>
            <span className="truncate block w-full">{value}</span>
          </Tooltip>
        );
      },
      width: '180px'
    },

    {
      name: "POB",
      cell: (row: Consultation) => {
        const value = row?.placeOfBirth || "N/A";
        return (
          <Tooltip title={value}>
            <span className="truncate block w-full">{value}</span>
          </Tooltip>
        );
      },
      width: "150px",
    },

    { 
      name: 'Date', 
      selector: (row: Consultation) => row?.date ? moment(row.date).format('DD/MM/YYYY') : 'N/A',
      sortable: true,
      width: "120px",
    },
    {
      name: "Slot",
      selector: (row: Consultation) =>
        `${row?.slotId?.fromTime || "N/A"} - ${row?.slotId?.toTime || "N/A"}`,
      width: "140px",
    },
    {
      name: "Type",
      cell: (row: Consultation) => {
        const value = row?.consultationType || "N/A";
        return (
          <Tooltip title={value}>
            <span className="truncate block w-full">{value}</span>
          </Tooltip>
        );
      },
      width: "120px",
    },

    {
      name: "Topic",
      cell: (row: Consultation) => {
        const value = row?.consultationTopic || "N/A";
        return (
          <Tooltip title={value}>
            <span className="truncate block w-full">{value}</span>
          </Tooltip>
        );
      },
      width: "120px",
    },
    {
      name: "Amount",
      selector: (row: Consultation) =>
        row?.paymentDetails?.paymentAmount
          ? `₹${row.paymentDetails.paymentAmount}`
          : "N/A",
      width: "100px",
    },
    {
      name: "Mode",
      selector: (row: Consultation) =>
        row?.paymentDetails?.paymentMethod || "N/A",
      width: "100px",
    },
    {
      name: "Status",
      cell: (row: Consultation) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            row?.status === "completed"
              ? "bg-green-100 text-green-700"
              : row?.status === "cancelled"
              ? "bg-red-100 text-red-700"
              : row?.status === "booked"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {row?.status
            ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
            : "N/A"}
        </span>
      ),
      width: "120px",
    },
  ];

  const handleClearFilters = () => {
    setFilters({
      status: "",
      customerName: "",
      astrologerName: "",
      startDate: "",
      endDate: "",
    });
    setSearchText("");
  };

  const prepareCSVData = (data: Consultation[]) => {
    return data.map((item) => ({
      "Astrologer Name": item?.astrologerId?.astrologerName || "N/A",
      "Customer Name": item?.fullName || "N/A",
      "Email": item?.paymentDetails?.email?.trim() || "N/A",
      Mobile: item?.mobileNumber || "N/A",
      Gender: item?.gender || "",
      "Date of Birth": item?.dateOfBirth ? moment(item.dateOfBirth).format("DD/MM/YYYY") : "N/A",
      "Time of Birth": item?.timeOfBirth || "N/A",
      "Place of Birth": item?.placeOfBirth || "N/A",
      Date: item?.date ? `\t${moment(item.date).format("YYYY-MM-DD")}` : "N/A",
      "Slot From": item?.slotId?.fromTime || "N/A",
      "Slot To": item?.slotId?.toTime || "N/A",
      "Consultation Type": item?.consultationType || "N/A",
      "Consultation Topic": item?.consultationTopic || "N/A",
      "Payment Amount": item?.paymentDetails?.paymentAmount || "N/A",
      "Payment Method": item?.paymentDetails?.paymentMethod || "N/A",
      Status: item?.status || "N/A",
      "Created At": item?.createdAt
        ? `\t${moment(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}`
        : "",
      "Updated At": item?.updatedAt
        ? `\t${moment(item.updatedAt).format("YYYY-MM-DD HH:mm:ss")}`
        : "",
    }));
  };

  return (
    <div className="p-5 bg-white rounded-lg border border-gray-200">
      <div className="mb-5">
        <div className="flex justify-between items-center mb-5 bg-white">
          <div className="text-xl font-semibold text-gray-800">
            Consultation Bookings
          </div>

          <div className="flex gap-3 items-center">
            {consultationData.length > 0 && (
              <CSVLink
                filename="Consultation_Bookings.csv"
                data={prepareCSVData(finalFilteredData)}
                className="text-gray-800 text-base no-underline flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors"
              >
                <DownloadIcon className="text-gray-600" />
                Export CSV
              </CSVLink>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          <input
            type="text"
            placeholder="Customer Name"
            name="customerName"
            value={filters.customerName}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Astrologer Name"
            name="astrologerName"
            value={filters.astrologerName}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            max={filters.endDate || undefined}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            min={filters.startDate || undefined}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Search across all fields..."
            value={searchText}
            onChange={handleSearch}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />

          {(filters.status ||
            filters.customerName ||
            filters.astrologerName ||
            filters.startDate ||
            filters.endDate ||
            searchText) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <MainDatatable
        columns={columns}
        data={finalFilteredData}
        isLoading={loading}
        title=""
        addButtonActive={false}
        showSearch={false}
      />
    </div>
  );
}