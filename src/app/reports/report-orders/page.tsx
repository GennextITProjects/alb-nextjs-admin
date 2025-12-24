"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import moment from "moment";
import "moment-timezone";
import Swal from "sweetalert2";
import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg, EditSvg } from "@/components/svgs/page";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Order {
  _id: string;
  name: string;
  email: string;
  whatsapp: string;
  gender: string | null;
  reportLanguage: string;
  dateOfBirth: string;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  placeOfBirthPincode: string | null;
  paymentTxnId: string;
  amount: string;
  paymentAt: string;
  planName: string;
  astroConsultation: boolean;
  consultationDate: string | null;
  consultationTime: string | null;
  problemType: string | null;
  partnerName: string | null;
  partnerDateOfBirth: string | null;
  partnerTimeOfBirth: string | null;
  partnerPlaceOfBirth: string | null;
  partnerPlaceOfBirthPincode: string | null;
  expressDelivery: boolean;
  questionOne: string | null;
  questionTwo: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  orderFingerprint: string;
  attemptCount: number;
  lastAttemptAt: string;
  deletedAt: string | null;
  status: "pending" | "paid" | "processing" | "delivered";
  createdAt: string;
  updatedAt: string;
  orderID: string;
  __v: number;
  expiresAt: string;
  razorpayOrderId: string;
}

interface ApiResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: Order[];
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  filteredOrders?: number;
  filteredRevenue?: number;
}

interface DateRangeStats {
  dateRange: {
    start: string;
    end: string;
    startUTC: string;
    endUTC: string;
  };
  stats: {
    ordersCount: number;
    totalRevenue: number;
    averageOrderValue: number;
    formatted: {
      ordersCount: number;
      totalRevenue: string;
      averageOrderValue: string;
    };
  };
  dailyBreakdown?: Array<{
    date: string;
    orders: number;
    revenue: string;
    average: string;
  }>;
}

interface Filters {
  q: string;
  from: string;
  to: string;
  dateRange: string;
  language: string;
  planName: string;
  status: string;
  astroConsultation: string;
  expressDelivery: string;
  includeDeleted: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  limit: number;
}

interface EditPayload {
  planName?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  gender?: string;
  reportLanguage?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  placeOfBirthPincode?: string;
  astroConsultation?: boolean;
  consultationDate?: string;
  consultationTime?: string;
  problemType?: string;
  partnerDateOfBirth?: string;
  partnerTimeOfBirth?: string;
  partnerPlaceOfBirth?: string;
  partnerPlaceOfBirthPincode?: string;
  expressDelivery?: boolean;
  questionOne?: string;
  questionTwo?: string;
  status?: "pending" | "paid" | "processing" | "delivered";
}

// ---------------------------------------------------------------------
// Custom Debounce Function
// ---------------------------------------------------------------------
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
const ReportOrders: React.FC = () => {
  const getTodayDate = () => moment().format("YYYY-MM-DD");

  const getDateRange = (range: string) => {
    const today = moment();
    switch (range) {
      case "today":
        return { from: today.format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
      case "yesterday":
        const yesterday = moment().subtract(1, 'days');
        return { from: yesterday.format("YYYY-MM-DD"), to: yesterday.format("YYYY-MM-DD") };
      case "weekly":
        return { from: today.subtract(7, 'days').format("YYYY-MM-DD"), to: moment().format("YYYY-MM-DD") };
      case "monthly":
        return { from: today.subtract(30, 'days').format("YYYY-MM-DD"), to: moment().format("YYYY-MM-DD") };
      default:
        return { from: "", to: "" };
    }
  };

  const [filters, setFilters] = useState<Filters>({
    q: "",
    from: "",
    to: "",
    dateRange: "",
    language: "",
    planName: "",
    status: "all",
    astroConsultation: "",
    expressDelivery: "",
    includeDeleted: false,
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 200,
  });

  const [rows, setRows] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dateRangeStats, setDateRangeStats] = useState<DateRangeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [activeRow, setActiveRow] = useState<Order | null>(null);
  const [editPayload, setEditPayload] = useState<EditPayload>({});
  
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Store pagination history for each filter combination
  const paginationHistory = useRef<Map<string, number>>(new Map());

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Create a unique key for current filter combination
const getFilterKey = (filterObj: Filters): string => {
  return JSON.stringify({
    q: filterObj.q,
    from: filterObj.from,
    to: filterObj.to,
    language: filterObj.language,
    planName: filterObj.planName,
    status: filterObj.status,
    astroConsultation: filterObj.astroConsultation,
    expressDelivery: filterObj.expressDelivery,
    sortBy: filterObj.sortBy,
    sortOrder: filterObj.sortOrder,
  });
};

  // Fetch date range stats (sirf date filters ka)
// Fetch date range stats (sirf date filters ka)
// Fetch date range stats (sirf from aur to date ke hisaab se)
const fetchDateRangeStats = async (fromDate?: string, toDate?: string) => {
  try {
    // Agar koi date nahi hai to mat fetch karo
    if (!fromDate && !toDate) {
      setDateRangeStats(null);
      return;
    }
    
    const statsQs = new URLSearchParams();
    if (fromDate) statsQs.set('from', fromDate);
    if (toDate) statsQs.set('to', toDate);
    
    // URL CHANGE: /date-range-stats
    const statsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/life-journey-orders/date?${statsQs.toString()}`,
      { headers: getAuthHeaders() }
    );
    
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      setDateRangeStats(statsResult || null);
    }
  } catch (error) {
    console.error('Failed to fetch date range stats:', error);
  }
};

// Fetch filtered stats (sab filters ka)
const fetchFilteredStats = async (currentFilters: Filters) => {
  try {
    const statsQs = new URLSearchParams();
    Object.entries(currentFilters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined && 
          k !== "limit" && k !== "sortBy" && k !== "sortOrder" && k !== "page") {
        statsQs.set(k, String(v));
      }
    });

    // Clean up empty filters
    if (currentFilters.astroConsultation === "") statsQs.delete("astroConsultation");
    if (currentFilters.expressDelivery === "") statsQs.delete("expressDelivery");

    const statsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/life-journey-orders/stats?${statsQs.toString()}`,
      { headers: getAuthHeaders() }
    );
    
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      setStats(statsResult || null); // ✅ setStats use karo, setFilteredStats nahi
    }
  } catch (error) {
    console.error('Failed to fetch filtered stats:', error);
  }
};
  // Create debounced fetch function

const debouncedFetch = useMemo(() => 
  debounce(async (currentFilters: Filters, currentPage: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      
      // Add all filters to query string
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined && k !== "dateRange") { // dateRange remove
          if (k === "from" && currentFilters.from && !currentFilters.to) {
            qs.set("from", currentFilters.from);
            qs.set("to", currentFilters.from);
          } else {
            qs.set(k, String(v));
          }
        }
      });

      // Set pagination
      qs.set("page", String(currentPage));
      qs.set("limit", String(currentFilters.limit));

      // Clean up boolean filters
      if (currentFilters.astroConsultation === "") qs.delete("astroConsultation");
      if (currentFilters.expressDelivery === "") qs.delete("expressDelivery");
      if (!currentFilters.includeDeleted) qs.delete("includeDeleted");

      // Fetch orders - URL SAME
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/life-journey-orders?${qs.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      const data: ApiResponse = result.data || result;
      
      setRows(data?.items || []);
      setPage(data?.page || 1);
      setTotalPages(data?.pages || 1);
      setTotalItems(data?.total || 0);

      // Store current page
      const filterKey = getFilterKey(currentFilters);
      paginationHistory.current.set(filterKey, data?.page || 1);

      // IMPORTANT: Dono alag-alag stats fetch karo
      // 1. Date range ke liye (sirf from/to)
      // 2. Sab filters ke liye
      await Promise.all([
        fetchFilteredStats(currentFilters), // Ye sab filters le jayega
        fetchDateRangeStats(currentFilters.from, currentFilters.to) // Ye sirf from/to le jayega
      ]);

    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Failed to load orders", timer: 2000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, 500),
  []
);

  // Initial fetch
  useEffect(() => {
    const filterKey = getFilterKey(filters);
    const savedPage = paginationHistory.current.get(filterKey) || 1;
    debouncedFetch(filters, savedPage);
  }, []);

  // Main function to handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    let newFilters = { ...filters };

    if (name === "dateRange") {
      const range = getDateRange(value);
      newFilters = { ...newFilters, dateRange: value, from: range.from, to: range.to };
    } else if (name === "from" || name === "to") {
      newFilters = { ...newFilters, dateRange: "", [name]: value };
    } else {
      const v = type === "checkbox" ? checked : name === "limit" ? Number(value) : value;
      newFilters = { ...newFilters, [name]: v };
    }

    setFilters(newFilters);
    
    // Always reset to page 1 for any filter change
    setPage(1);
    
    const newFilterKey = getFilterKey(newFilters);
    paginationHistory.current.set(newFilterKey, 1);
    
    debouncedFetch(newFilters, 1);
  };

  // Handle pagination with history preservation
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    // Save current page for current filter combination
    const filterKey = getFilterKey(filters);
    paginationHistory.current.set(filterKey, newPage);
    
    setPage(newPage);
    debouncedFetch(filters, newPage);
  };

  // Generate pagination buttons
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // Always show first page button if not visible
    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push("...");
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    // Always show last page button if not visible
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push("...");
      buttons.push(totalPages);
    }

    return buttons;
  };

  // Action handlers
  const onView = (row: Order) => {
    setActiveRow(row);
    setViewOpen(true);
  };

  const onEdit = (row: Order) => {
    setActiveRow(row);
    setEditPayload({
      planName: row?.planName || "",
      name: row?.name || "",
      email: row?.email || "",
      whatsapp: row?.whatsapp || "",
      gender: row?.gender || "",
      reportLanguage: row?.reportLanguage || "",
      dateOfBirth: row?.dateOfBirth || "",
      timeOfBirth: row?.timeOfBirth || "",
      placeOfBirth: row?.placeOfBirth || "",
      placeOfBirthPincode: row?.placeOfBirthPincode || "",
      astroConsultation: row?.astroConsultation || false,
      consultationDate: row?.consultationDate || "",
      consultationTime: row?.consultationTime || "",
      problemType: row?.problemType || "",
      partnerDateOfBirth: row?.partnerDateOfBirth || "",
      partnerTimeOfBirth: row?.partnerTimeOfBirth || "",
      partnerPlaceOfBirth: row?.partnerPlaceOfBirth || "",
      partnerPlaceOfBirthPincode: row?.partnerPlaceOfBirthPincode || "",
      expressDelivery: row?.expressDelivery || false,
      questionOne: row?.questionOne || "",
      questionTwo: row?.questionTwo || "",
      status: row?.status || "pending",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      const idOrOrder = activeRow?._id || activeRow?.orderID;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/life-journey-orders/${idOrOrder}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(editPayload),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      Swal.fire({ 
        icon: "success", 
        title: "Order updated successfully!", 
        timer: 1200, 
        showConfirmButton: false 
      });
      setEditOpen(false);
      
      // Refresh everything
      const filterKey = getFilterKey(filters);
      const currentPage = paginationHistory.current.get(filterKey) || page;
      await debouncedFetch(filters, currentPage);
      
    } catch (e) {
      console.error(e);
      Swal.fire({ 
        icon: "error", 
        title: "Update failed", 
        timer: 2000, 
        showConfirmButton: false 
      });
    }
  };

  const downloadCSV = () => {
    const headers = [
      "_id", "orderID", "planName", "name", "email", "whatsapp", "gender", "reportLanguage", "amount", "status",
      "paymentTxnId", "razorpayOrderId", "paymentAt", "astroConsultation", "consultationDate", "consultationTime",
      "expressDelivery", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "createdAt", "deletedAt"
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map(r => [
        r._id, r.orderID, r.planName, r.name, r.email, r.whatsapp, r.gender || "",
        r.reportLanguage, r.amount, r.status, r.paymentTxnId, r.razorpayOrderId,
        r.paymentAt ? moment.tz(r.paymentAt, "Asia/Kolkata").format("YYYY-MM-DD hh:mm a") : "",
        r.astroConsultation ? "Yes" : "No", r.consultationDate || "", r.consultationTime || "",
        r.expressDelivery ? "Yes" : "No", r.utm_source || "", r.utm_medium || "", r.utm_campaign || "",
        r.utm_term || "", r.utm_content || "",
        r.createdAt ? moment.tz(r.createdAt, "Asia/Kolkata").format("YYYY-MM-DD hh:mm a") : "",
        r.deletedAt ? moment.tz(r.deletedAt, "Asia/Kolkata").format("YYYY-MM-DD hh:mm a") : ""
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life_journey_orders_page_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadServerCSV = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined && k !== "dateRange") {
          qs.set(k, String(v));
        }
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/life-journey-orders/export?${qs.toString()}`,
        { method: "POST", headers: { Authorization: "Bearer " + token } }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "life_journey_orders_all.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      Swal.fire({ icon: "error", title: "CSV export failed", timer: 2000, showConfirmButton: false });
    }
  };

  const columns = useMemo(() => [
    { 
      name: "S.No.", 
      selector: (_: Order, idx?: number) => ((page - 1) * filters.limit) + (idx || 0) + 1, 
      width: "70px" 
    },
    { 
      name: "Order ID", 
      selector: (row: Order) => row?.orderID || "—", 
      width: "110px" 
    },
    { 
      name: "Plan", 
      selector: (row: Order) => row?.planName || "—", 
      width: "200px" 
    },
    { 
      name: "Amount", 
      selector: (row: Order) => `₹${row?.amount || "0"}`, 
      width: "120px" 
    },
    {
      name: "Status",
      selector: (row: Order) => row?.status || "—",
      cell: (row: Order) => (
        <span
          className={`capitalize ${
            row?.status === "paid"
              ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
              : row?.status === "pending"
              ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
              : row?.status === "processing"
              ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
              : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          }`}
        >
          {row?.status || "—"}
        </span>
      ),
      width: "80px",
    },
    { 
      name: "Lang", 
      selector: (row: Order) => row?.reportLanguage || "—", 
      width: "90px" 
    },
    { 
      name: "Name", 
      selector: (row: Order) => row?.name || "—", 
      width: "180px" 
    },
    { 
      name: "WhatsApp", 
      selector: (row: Order) => row?.whatsapp || "—", 
      width: "120px" 
    },
    { 
      name: "Email", 
      selector: (row: Order) => row?.email || "—", 
      width: "240px" 
    },
    { 
      name: "Astro", 
      selector: (row: Order) => (row?.astroConsultation ? "Yes" : "No"), 
      width: "90px" 
    },
    { 
      name: "Express", 
      selector: (row: Order) => (row?.expressDelivery ? "Yes" : "No"), 
      width: "90px" 
    },
    { 
      name: "Paid At", 
      selector: (row: Order) => row?.paymentAt ? moment.tz(row.paymentAt, "Asia/Kolkata").format("DD/MM/YYYY hh:mm a") : "—", 
      width: "170px" 
    },
    { 
      name: "Created", 
      selector: (row: Order) => row?.createdAt ? moment.tz(row.createdAt, "Asia/Kolkata").format("DD/MM/YYYY hh:mm a") : "—", 
      width: "170px" 
    },
    {
      name: "Action",
      cell: (row: Order) => (
        <div className="flex gap-3 items-center">
          <div className="cursor-pointer" onClick={() => onView(row)}><ViewSvg /></div>
          <div className="cursor-pointer" onClick={() => onEdit(row)}><EditSvg /></div>
        </div>
      ),
      width: "100px"
    }
  ], [page, filters.limit]);

  // Check if any non-date filters are active
  const hasNonDateFilters = useMemo(() => {
    return !!(
      filters.q ||
      filters.language ||
      filters.planName ||
      (filters.status && filters.status !== "all") ||
      filters.astroConsultation ||
      filters.expressDelivery
    );
  }, [filters]);

  // Format date range for display
  const getFormattedDateRange = () => {
    if (filters.dateRange) {
      switch(filters.dateRange) {
        case "today": return "Today";
        case "yesterday": return "Yesterday";
        case "weekly": return "Last 7 Days";
        case "monthly": return "Last 30 Days";
        default: return "";
      }
    } else if (filters.from || filters.to) {
      if (filters.from && filters.to) {
        return `${moment(filters.from).format("MMM D, YYYY")} - ${moment(filters.to).format("MMM D, YYYY")}`;
      } else if (filters.from) {
        return `From ${moment(filters.from).format("MMM D, YYYY")}`;
      } else if (filters.to) {
        return `Until ${moment(filters.to).format("MMM D, YYYY")}`;
      }
    }
    return "All Time";
  };

  return (
    <>
      <div className="p-5 bg-white rounded-xl shadow-sm mb-5">
        {/* Header + Stats */}
       <div className="p-5 bg-white rounded-xl shadow-sm mb-5">
  {/* Header + Stats */}
  <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
    <div>
      {/* Date Range Stats - Always visible */}
      {dateRangeStats && (
        <>
          <div className="text-xl text-gray-700">
            Total{" "}
            <span className="font-semibold">
              {dateRangeStats.stats.formatted.ordersCount}
            </span>{" "}
            orders •{" "}
            <strong>{dateRangeStats.stats.formatted.totalRevenue}</strong>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Average: {dateRangeStats.stats.formatted.averageOrderValue} per order
          </div>
        </>
      )}
      
      {/* Today's Stats - Always visible */}
      {stats && (
        <div className="text-lg text-gray-900 mt-2">
          <span className="font-semibold">Today:</span>{" "}
          <strong>{stats.todayOrders || 0}</strong> orders •{" "}
          <strong>₹{Number(stats.todayRevenue || 0).toFixed(2)}</strong> revenue
        </div>
      )}
      
      {/* Filtered Stats - Only show if non-date filters are active */}
      {stats && stats.filteredOrders !== undefined && stats.filteredOrders > 0 && (
        <div className="text-md text-blue-600 mt-2">
          <span className="font-semibold">Filtered:</span>{" "}
          <strong>{stats.filteredOrders}</strong> orders •{" "}
          <strong>₹{Number(stats.filteredRevenue || 0).toFixed(2)}</strong> revenue
          <span className="text-gray-500 text-sm ml-2">
            (Matching your filters)
          </span>
        </div>
      )}
    </div>
    
    <div className="flex gap-2">
      <button onClick={downloadCSV} className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
        CSV (Current Page)
      </button>
      <button onClick={downloadServerCSV} className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
        CSV (All)
      </button>
    </div>
  </div>

  {/* Rest of your code... */}
</div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-5">
          {/* Search Input - Only for name/email/orderID */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Search (Name/Email/Order ID)</label>
            <input
              type="text"
              name="q"
              placeholder="Search name, email, orderID..."
              value={filters.q}
              onChange={handleFilterChange}
              className="min-w-[200px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Plan Name - Separate filter */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Plan Name</label>
            <input
              type="text"
              name="planName"
              value={filters.planName}
              onChange={handleFilterChange}
              placeholder="Filter by plan..."
              className="min-w-[150px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Date Range</label>
            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="min-w-[150px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              max={getTodayDate()}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              max={getTodayDate()}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Language</label>
            <select
              name="language"
              value={filters.language}
              onChange={handleFilterChange}
              className="min-w-[150px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Order Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="min-w-[130px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Astro Consultation</label>
            <select
              name="astroConsultation"
              value={filters.astroConsultation}
              onChange={handleFilterChange}
              className="min-w-[110px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Express Delivery</label>
            <select
              name="expressDelivery"
              value={filters.expressDelivery}
              onChange={handleFilterChange}
              className="min-w-[110px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="min-w-[150px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created At</option>
              <option value="paymentAt">Payment At</option>
              <option value="planName">Plan Name</option>
              <option value="reportLanguage">Report Language</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Sort Order</label>
            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
              className="min-w-[100px] px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">DESC</option>
              <option value="asc">ASC</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                const filterKey = getFilterKey(filters);
                const savedPage = paginationHistory.current.get(filterKey) || page;
                debouncedFetch(filters, savedPage);
              }}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                const resetFilters: Filters = {
                  q: "",
                  from: "",
                  to: "",
                  dateRange: "",
                  language: "",
                  planName: "",
                  status: "all",
                  astroConsultation: "",
                  expressDelivery: "",
                  includeDeleted: false,
                  sortBy: "createdAt",
                  sortOrder: "desc",
                  limit: 200,
                };
                setFilters(resetFilters);
                setPage(1);
                paginationHistory.current.clear();
                debouncedFetch(resetFilters, 1);
              }}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reset All
            </button>
          </div>
        </div>

{/* Comparison Info */}
{stats && dateRangeStats && 
 (filters.q || filters.planName || filters.status !== "all" || 
  filters.language || filters.astroConsultation || filters.expressDelivery) && (
  <span className="text-blue-600">
    <strong>{stats.filteredOrders || 0}</strong> of{" "}
    <strong>{dateRangeStats.stats.ordersCount || 0}</strong> orders match your filters
    {(stats.filteredRevenue && dateRangeStats.stats.totalRevenue) && (
      <span className="ml-2">
        (<strong>₹{Number(stats.filteredRevenue || 0).toFixed(2)}</strong> of{" "}
        <strong>₹{Number(dateRangeStats.stats.totalRevenue || 0).toFixed(2)}</strong> revenue)
      </span>
    )}
  </span>
)}

        {/* Table */}
        <div className="overflow-x-auto mb-4">
          <MainDatatable
            data={rows}
            columns={columns.map((col) => ({
              ...col,
              minwidth: col.width,
              width: undefined,
            }))}
            isLoading={loading}
            showSearch={false}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{(page - 1) * filters.limit + 1}</span> to{" "}
              <span className="font-semibold">{Math.min(page * filters.limit, totalItems)}</span> of{" "}
              <span className="font-semibold">{totalItems}</span> orders
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                «
              </button>
              
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                ‹
              </button>

              {getPaginationButtons().map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof btn === "number" ? handlePageChange(btn) : null}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    btn === page
                      ? "text-white bg-blue-600 border border-blue-600"
                      : typeof btn === "number"
                      ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      : "text-gray-400 cursor-default bg-transparent border-none"
                  }`}
                  disabled={btn === "..."}
                  title={typeof btn === "number" ? `Go to page ${btn}` : ""}
                >
                  {btn}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                ›
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                »
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-semibold">Page:</span> {page} of {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* VIEW Modal */}
      {viewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeRow && Object.entries(activeRow).map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-gray-600">{k}</div>
                  <div className="font-medium text-gray-900">{String(v ?? "")}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Order</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["planName", "Plan Name"],
                ["name", "Name"],
                ["email", "Email"],
                ["whatsapp", "WhatsApp"],
                ["gender", "Gender"],
                ["reportLanguage", "Report Language"],
                ["dateOfBirth", "DOB (YYYY-MM-DD)"],
                ["timeOfBirth", "TOB (HH:mm)"],
                ["placeOfBirth", "Place of Birth"],
                ["placeOfBirthPincode", "POB Pincode"],
                ["consultationDate", "Consultation Date"],
                ["consultationTime", "Consultation Time"],
                ["problemType", "Problem Type"],
                ["partnerDateOfBirth", "Partner DOB"],
                ["partnerTimeOfBirth", "Partner TOB"],
                ["partnerPlaceOfBirth", "Partner POB"],
                ["partnerPlaceOfBirthPincode", "Partner POB Pincode"],
                ["questionOne", "Question One"],
                ["questionTwo", "Question Two"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(editPayload as any)[key] ?? ""}
                    onChange={(e) => setEditPayload(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editPayload.status || ""}
                  onChange={(e) => setEditPayload({ ...editPayload, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={!!editPayload.astroConsultation}
                  onChange={(e) => setEditPayload(p => ({ ...p, astroConsultation: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Astro Consultation</label>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={!!editPayload.expressDelivery}
                  onChange={(e) => setEditPayload(p => ({ ...p, expressDelivery: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Express Delivery</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportOrders;