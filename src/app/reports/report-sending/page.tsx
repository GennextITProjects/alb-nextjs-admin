"use client";

import React, { useEffect, useState } from "react";
import { Filters, Order, ApiResponse } from "./types";
import { FilterBar } from "./components/FilterBar";
import { OrdersTable } from "./components/OrdersTable";
import { ViewModal } from "./components/ViewModal";
import { Pagination } from "./components/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import Swal from "sweetalert2";

const ReportOrders: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    from: "",
    to: "",
    language: "",
    planName: "life changing",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
    selectFirstN: undefined,
  });

  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedFilters = useDebounce(filters, 500);

  const getAuthHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const fetchOrders = async (currentFilters: Filters, currentPage: number) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      
      // Build base query parameters
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v && v !== "all" && k !== "selectFirstN") {
          if (k === "from" && currentFilters.from && !currentFilters.to) {
            qs.set("from", currentFilters.from);
            qs.set("to", currentFilters.from);
          } else {
            qs.set(k, String(v));
          }
        }
      });

      // When selectFirstN is active
      if (currentFilters.selectFirstN && currentFilters.selectFirstN > 0) {
        // Force parameters for selecting oldest pending orders
        qs.set("sortBy", "createdAt");
        qs.set("sortOrder", "asc");
        qs.set("limit", String(currentFilters.selectFirstN * 3)); // Fetch extra to filter client-side
        qs.set("page", "1");
        
        // Try multiple possible parameter names for pending status
        qs.set("reportDeliveryStatus", "pending");
        qs.delete("status"); // Remove general status filter
      } else {
        qs.set("page", String(currentPage));
        qs.set("limit", String(currentFilters.limit));
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/life-journey-orders?${qs.toString()}`;
      console.log("🔍 API URL:", apiUrl); // Debug log

      const response = await fetch(apiUrl, { headers: getAuthHeaders() });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      const data: ApiResponse = result.data || result;
      
      let finalItems = data?.items || [];

      // CLIENT-SIDE FILTER: Remove delivered orders when selectFirstN is active
      if (currentFilters.selectFirstN && currentFilters.selectFirstN > 0) {
        console.log("📊 Before filtering:", finalItems.length, "orders");
        console.log("🔍 Sample statuses:", finalItems.slice(0, 3).map(o => ({
          id: o.orderID,
          status: o.reportDeliveryStatus
        })));

        // Filter out delivered orders
        finalItems = finalItems.filter(order => {
          const deliveryStatus = order.reportDeliveryStatus?.toLowerCase();
          return !deliveryStatus || deliveryStatus === 'pending' || deliveryStatus === 'failed';
        });

        console.log("✅ After filtering:", finalItems.length, "orders (pending only)");

        // Take only the requested number
        finalItems = finalItems.slice(0, currentFilters.selectFirstN);
      }
      
      setRows(finalItems);
      setPage(data?.page || 1);
      setTotalPages(data?.pages || 1);
      setTotalItems(finalItems.length); // Show filtered count
    } catch (e) {
      console.error("❌ Fetch error:", e);
      Swal.fire({ 
        icon: "error", 
        title: "Failed to load orders", 
        timer: 2000, 
        showConfirmButton: false 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(debouncedFilters, page);
  }, [debouncedFilters]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrders(filters, newPage);
  };

  const handleRefresh = () => fetchOrders(filters, page);

  const handleReset = () => {
    const resetFilters: Filters = {
      q: "",
      from: "",
      to: "",
      language: "",
      planName: "",
      status: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 100,
      selectFirstN: undefined,
    };
    setFilters(resetFilters);
    setPage(1);
  };

  // नया function: Reports process करने के लिए
  const handleProcessReports = async (reportIds: string[]) => {
    try {
      // SweetAlert confirmation
      const result = await Swal.fire({
        title: `Process ${reportIds.length} Reports?`,
        text: "This will trigger report generation for all selected pending orders.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Process Now!",
        cancelButtonText: "Cancel"
      });

      if (!result.isConfirmed) return;

      // API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/process-lcr-reports`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reportIds })
      });

      if (!response.ok) throw new Error("Failed to process reports");

      const data = await response.json();
      
      // Success message
      await Swal.fire({
        icon: "success",
        title: "Reports Processing Started!",
        text: `${reportIds.length} reports have been queued for generation.`,
        timer: 3000,
        showConfirmButton: false
      });

      // Refresh the orders list
      fetchOrders(filters, page);

    } catch (error) {
      console.error("Error processing reports:", error);
      Swal.fire({
        icon: "error",
        title: "Processing Failed",
        text: "There was an error while processing the reports.",
        timer: 3000
      });
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h1 className="font-bold text-2xl mb-4">Report Automation</h1>
      
      {/* Enhanced info banner when selectFirstN is active */}
      {/* {filters.selectFirstN && filters.selectFirstN > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-600 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-green-800">
                Showing {rows.length} oldest PENDING orders
              </p>
              <p className="text-xs text-green-700 mt-1">
                📌 Sorted by: <span className="font-semibold">createdAt (oldest first)</span>
              </p>
              <p className="text-xs text-green-700">
                🚫 Excluded: <span className="font-semibold">All delivered orders</span>
              </p>
              <p className="text-xs text-green-700">
                📊 Status filter: <span className="font-semibold">Pending & Failed only</span>
              </p>
              {rows.length > 0 && (
                <p className="text-xs text-green-700 mt-2">
                  ⚡ Process all {rows.length} reports at once using the purple button above.
                </p>
              )}
            </div>
          </div>
        </div>
      )} */}
      
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onRefresh={handleRefresh}
        onReset={handleReset}
        onProcessReports={handleProcessReports}
        orders={rows} // Current orders data pass करें
      />

      <OrdersTable
        data={rows}
        loading={loading}
        page={page}
        limit={filters.limit}
        onView={(row) => {
          setActiveRow(row);
          setViewOpen(true);
        }}
      />

      {/* Hide pagination when selectFirstN is active */}
      {!filters.selectFirstN && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={filters.limit}
          onPageChange={handlePageChange}
        />
      )}

      {viewOpen && activeRow && (
        <ViewModal
          order={activeRow}
          onClose={() => setViewOpen(false)}
        />
      )}
    </div>
  );
};

export default ReportOrders;