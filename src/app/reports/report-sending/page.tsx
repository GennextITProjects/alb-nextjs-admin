"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
    planName: "",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
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
      
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v && v !== "all") {
          if (k === "from" && currentFilters.from && !currentFilters.to) {
            qs.set("from", currentFilters.from);
            qs.set("to", currentFilters.from);
          } else {
            qs.set(k, String(v));
          }
        }
      });

      qs.set("page", String(currentPage));
      qs.set("limit", String(currentFilters.limit));

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
    } catch (e) {
      console.error(e);
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
    };
    setFilters(resetFilters);
    setPage(1);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h1 className="font-bold text-2xl mb-4">Report Orders</h1>
      
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onRefresh={handleRefresh}
        onReset={handleReset}
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={filters.limit}
        onPageChange={handlePageChange}
      />

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
