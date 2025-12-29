"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import moment from "moment";
import { DeepSearchSpace } from "@/utils/common-function";

import { Color } from "@/assets/colors";
import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg, CrossSvg } from "@/components/svgs/page";
import { TableColumn } from "react-data-table-component";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface ContactEnquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  productName: string;
  productType: string;
  productDetails: string;
  createdAt: string;
  updatedAt: string;
}

type EnquiryColumn = TableColumn<ContactEnquiry>;

// CSV Row Type
interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

// Dynamically import CSVLink to avoid SSR issues
const CSVLink = dynamic(
  () => import("react-csv").then((mod) => mod.CSVLink),
  { ssr: false }
);

// DateRangeFilter Component (Client-side only)
const DateRangeFilter = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  handleDateFilter,
  handleResetDate,
  csvData,
  filteredDataLength,
}: {
  fromDate: string;
  toDate: string;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  handleDateFilter: () => void;
  handleResetDate: () => void;
  csvData: CSVRow[];
  filteredDataLength: number;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2 items-end">
          <button
            onClick={handleDateFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filter
          </button>
          
          <button
            onClick={handleResetDate}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset to Today
          </button>
          
          <CSVLink
            data={csvData}
            filename={`enquiries_${fromDate}_to_${toDate}.csv`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 no-underline"
          >
            Export CSV
          </CSVLink>
        </div>
        
        <div className="ml-auto">
          <div className="text-sm text-gray-600">
            Showing {filteredDataLength} records
            {fromDate && toDate && (
              <span className="ml-2">
                (From {moment(fromDate).format("DD/MM/YYYY")} to {moment(toDate).format("DD/MM/YYYY")})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ContactEnquiryPage() {
  // State
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
    
    // Default to today's date only on client side
    const today = moment().format("YYYY-MM-DD");
    setFromDate(today);
    setToDate(today);
  }, []);

  // Filter data based on search text AND date range
  const filteredData = useMemo(() => {
    let filtered = DeepSearchSpace(enquiries, searchText);
    
    if (fromDate && toDate && isClient) {
      const startDate = moment(fromDate).startOf('day');
      const endDate = moment(toDate).endOf('day');
      
      filtered = filtered.filter((item) => {
        const itemDate = moment(item.createdAt);
        return itemDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    return filtered;
  }, [enquiries, searchText, fromDate, toDate, isClient]);

  // View Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: ContactEnquiry | null;
  }>({ open: false, data: null });

  // -----------------------------------------------------------------
  // Data Fetching with Date Range
  // -----------------------------------------------------------------
  const fetchEnquiries = async (dateFilter: { from: string; to: string } = { from: "", to: "" }) => {
    try {
      setIsLoading(true);
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/leads`;
      
      // If date range is provided, use the date range API
      if (dateFilter.from && dateFilter.to) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/leads-by-date?fromDate=${dateFilter.from}&toDate=${dateFilter.to}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      const sorted = (result.data || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setEnquiries(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch with today's date (only on client)
  useEffect(() => {
    if (isClient && fromDate && toDate) {
      fetchEnquiries({ from: fromDate, to: toDate });
    }
  }, [fromDate, toDate, isClient]);

  // Handle date range change
  const handleDateFilter = () => {
    if (fromDate && toDate) {
      fetchEnquiries({ from: fromDate, to: toDate });
    }
  };

  // Reset to today's date
  const handleResetDate = () => {
    const today = moment().format("YYYY-MM-DD");
    setFromDate(today);
    setToDate(today);
  };

  // -----------------------------------------------------------------
  // CSV Data (Transformed for Export)
  // -----------------------------------------------------------------
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((enquiry, index) => ({
      "S.No.": index + 1,
      Name: enquiry.name,
      Email: enquiry.email,
      Phone: enquiry.phone,
      Message: enquiry.message,
      "Product Name": enquiry.productName || "",
      "Product Type": enquiry.productType || "",
      "Created Date": moment(enquiry.createdAt).format("DD/MM/YYYY"),
    }));
  }, [filteredData]);

  // -----------------------------------------------------------------
  // View Modal Handlers
  // -----------------------------------------------------------------
  const openViewModal = (enquiry: ContactEnquiry) => {
    setViewModal({ open: true, data: enquiry });
  };

  const closeViewModal = () => {
    setViewModal({ open: false, data: null });
  };

  // -----------------------------------------------------------------
  // Table Columns
  // -----------------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        name: "S. No.",
        selector: (_row: any, index?: number) =>
          index !== undefined ? index + 1 : 0,
        width: "80px",
      },
      {
        name: "Name",
        selector: (row: any) => row.name,
        width: "180px",
      },
      {
        name: "Email",
        selector: (row: any) => row.email,
        width: "250px",
      },
      {
        name: "Phone",
        selector: (row: any) => row.phone,
        width: "150px",
      },
      {
        name: "Message",
        selector: (row: any) => row.message,
        width: "250px",
        cell: (row: any) => (
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={row.message}
          >
            {row.message}
          </div>
        ),
      },
      {
        name: "Product Name",
        selector: (row: any) => row.productName || "",
        width: "180px",
      },
      {
        name: "Product Type",
        selector: (row: any) => row.productType || "",
        width: "150px",
      },
      {
        name: "Created Date",
        selector: (row: any) => moment(row.createdAt).format("DD/MM/YYYY"),
        width: "140px",
      },
      {
        name: "Action",
        cell: (row: any) => (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              onClick={() => openViewModal(row)}
              style={{ cursor: "pointer" }}
            >
              <ViewSvg />
            </div>
          </div>
        ),
        width: "100px",
        // center: true,
      },
    ],
    []
  );

  // Show loading state during initial client-side hydration
  if (!isClient) {
    return (
      <div className="p-4">
        <div className="h-10 w-64 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="h-[400px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
      {/* Date Range Filter */}
      <Suspense fallback={
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      }>
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          handleDateFilter={handleDateFilter}
          handleResetDate={handleResetDate}
          csvData={csvData}
          filteredDataLength={filteredData.length}
        />
      </Suspense>
      
      <div style={{ width: "100%", overflowX: "auto" }}>
        <MainDatatable
          columns={columns.map((col) => ({
            ...col,
            minwidth: col.width,
            width: undefined,
          }))}
          data={filteredData}
          isLoading={isLoading}
          title="Gemstone Leads"
          url=""
        />
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl font-medium"
                  style={{ color: Color.black }}
                >
                  Enquiry Details
                </h2>
                <div onClick={closeViewModal} className="cursor-pointer">
                  <CrossSvg />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <DetailRow label="Name" value={viewModal.data.name} />
                <DetailRow label="Email" value={viewModal.data.email} />
                <DetailRow label="Phone" value={viewModal.data.phone} />
                <DetailRow
                  label="Message"
                  value={viewModal.data.message}
                  fullWidth
                />
                <DetailRow
                  label="Product Name"
                  value={viewModal.data.productName || ""}
                />
                <DetailRow
                  label="Product Type"
                  value={viewModal.data.productType || ""}
                />
                <DetailRow
                  label="Product Details"
                  value={viewModal.data.productDetails || ""}
                  fullWidth
                />
                <DetailRow
                  label="Created At"
                  value={moment(viewModal.data.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                />
                <DetailRow
                  label="Updated At"
                  value={moment(viewModal.data.updatedAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                />
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeViewModal}
                  className="px-6 py-2 text-white rounded font-medium hover:opacity-90"
                  style={{ backgroundColor: Color.primary }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper Component for Detail Rows
const DetailRow = ({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) => (
  <div className={fullWidth ? "" : "grid grid-cols-3 gap-4"}>
    <div className="font-semibold text-gray-700">{label}:</div>
    <div className={`text-gray-600 ${fullWidth ? "mt-1" : "col-span-2"}`}>
      {value}
    </div>
  </div>
);