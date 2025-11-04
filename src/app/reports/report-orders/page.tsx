"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, Grid, TextField, Button } from "@mui/material";
import moment from "moment";
import "moment-timezone";
import Swal from "sweetalert2";
import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg, EditSvg } from "@/components/svgs/page";

// Types
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

const API_BASE_URL = "https://api.acharyalavbhushan.com";

const ReportOrders: React.FC = () => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => moment().format("YYYY-MM-DD");
  
  // Calculate date ranges
  const getDateRange = (range: string) => {
    const today = moment();
    switch (range) {
      case "today":
        return {
          from: today.format("YYYY-MM-DD"),
          to: today.format("YYYY-MM-DD")
        };
      case "weekly":
        return {
          from: today.subtract(7, 'days').format("YYYY-MM-DD"),
          to: moment().format("YYYY-MM-DD")
        };
      case "monthly":
        return {
          from: today.subtract(30, 'days').format("YYYY-MM-DD"),
          to: moment().format("YYYY-MM-DD")
        };
      default:
        return { from: "", to: "" };
    }
  };

  // ---------- filters / paging ----------
  const [filters, setFilters] = useState<Filters>({
    q: "",
    from: "",
    to: "",
    dateRange: "",
    language: "",
    planName: "",
    status: "paid",
    astroConsultation: "",
    expressDelivery: "",
    includeDeleted: false,
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 25,
  });
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // ---------- data / ui ----------
  const [rows, setRows] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [activeRow, setActiveRow] = useState<Order | null>(null);
  const [editPayload, setEditPayload] = useState<EditPayload>({});

  // ---------- API helper ----------
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ---------- fetch list ----------
  const fetchList = async (_page: number = page) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(_page),
        limit: String(filters.limit),
      });

      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined && k !== "dateRange") {
          if (k === "from" && filters.from && !filters.to) {
            qs.set("from", filters.from);
            qs.set("to", filters.from);
          } else {
            qs.set(k, String(v));
          }
        }
      });

      if (filters.astroConsultation === "") qs.delete("astroConsultation");
      if (filters.expressDelivery === "") qs.delete("expressDelivery");
      if (!filters.includeDeleted) qs.delete("includeDeleted");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/life-journey-orders?${qs.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      const data: ApiResponse = result.data || result;

      setRows(data?.items || []);
      setTotal(data?.total || 0);
      setPages(data?.pages || 1);
      setPage(data?.page || 1);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Failed to load orders",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- fetch stats ----------
  const fetchStats = async () => {
    try {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined && k !== "dateRange") {
          qs.set(k, String(v));
        }
      });
      
      const response = await fetch(
        `${API_BASE_URL}/api/admin/life-journey-orders/stats?${qs.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) return;

      const result = await response.json();
      const data: Stats = result.data || result;
      setStats(data || null);
    } catch (e) {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchList(1);
    fetchStats();
    // eslint-disable-next-line
  }, [
    filters.q,
    filters.includeDeleted,
    filters.language,
    filters.planName,
    filters.status,
    filters.astroConsultation,
    filters.expressDelivery,
    filters.sortBy,
    filters.sortOrder,
    filters.from,
    filters.to,
    filters.limit,
  ]);

  // ---------- handlers ----------
  const onChangeFilter = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setPage(1);
    
    // Handle date range selection
    if (name === "dateRange") {
      const range = getDateRange(value);
      setFilters((f) => ({
        ...f,
        dateRange: value,
        from: range.from,
        to: range.to,
      }));
      return;
    }
    
    // If manual date is selected, clear dateRange
    if (name === "from" || name === "to") {
      setFilters((f) => ({
        ...f,
        dateRange: "",
        [name]: value,
      }));
      return;
    }
    
    const v =
      type === "checkbox" ? checked : name === "limit" ? Number(value) : value;
    setFilters((f) => ({ ...f, [name]: v }));
  };

  const onPageChange = (dirOrNum: number | "prev" | "next") => {
    if (typeof dirOrNum === "number") {
      setPage(dirOrNum);
      fetchList(dirOrNum);
    } else {
      const target =
        dirOrNum === "prev"
          ? Math.max(1, page - 1)
          : Math.min(pages, page + 1);
      setPage(target);
      fetchList(target);
    }
  };

  // ---------- BREAD actions ----------
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
        `${API_BASE_URL}/api/admin/life-journey-orders/${idOrOrder}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(editPayload),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      Swal.fire({
        icon: "success",
        title: "Order updated",
        timer: 1200,
        showConfirmButton: false,
      });
      setEditOpen(false);
      fetchList(page);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const onDelete = async (row: Order) => {
    const ask = await Swal.fire({
      icon: "warning",
      title: "Soft delete this order?",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!ask.isConfirmed) return;
    try {
      const idOrOrder = row?._id || row?.orderID;
      const response = await fetch(
        `${API_BASE_URL}/api/admin/life-journey-orders/${idOrOrder}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) throw new Error("Delete failed");

      Swal.fire({
        icon: "success",
        title: "Order deleted",
        timer: 1200,
        showConfirmButton: false,
      });
      fetchList(page);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const onRestore = async (row: Order) => {
    try {
      const idOrOrder = row?._id || row?.orderID;
      const response = await fetch(
        `${API_BASE_URL}/api/admin/life-journey-orders/${idOrOrder}/restore`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error("Restore failed");

      Swal.fire({
        icon: "success",
        title: "Order restored",
        timer: 1200,
        showConfirmButton: false,
      });
      fetchList(page);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Restore failed",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // ---------- Export (client CSV) ----------
  const downloadCSV = () => {
    const headers = [
      "_id",
      "orderID",
      "planName",
      "name",
      "email",
      "whatsapp",
      "gender",
      "reportLanguage",
      "amount",
      "status",
      "paymentTxnId",
      "razorpayOrderId",
      "paymentAt",
      "astroConsultation",
      "consultationDate",
      "consultationTime",
      "expressDelivery",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "createdAt",
      "deletedAt",
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r._id,
          r.orderID,
          r.planName,
          r.name,
          r.email,
          r.whatsapp,
          r.gender || "",
          r.reportLanguage,
          r.amount,
          r.status,
          r.paymentTxnId,
          r.razorpayOrderId,
          r.paymentAt
            ? moment.tz(r.paymentAt, "Asia/Kolkata").format("YYYY-MM-DD hh:mm a")
            : "",
          r.astroConsultation ? "Yes" : "No",
          r.consultationDate || "",
          r.consultationTime || "",
          r.expressDelivery ? "Yes" : "No",
          r.utm_source || "",
          r.utm_medium || "",
          r.utm_campaign || "",
          r.utm_term || "",
          r.utm_content || "",
          r.createdAt
            ? moment.tz(r.createdAt, "Asia/Kolkata").format("YYYY-MM-DD hh:mm a")
            : "",
          r.deletedAt
            ? moment.tz(r.deletedAt, "Asia/Kolkata").format("YYYY-MM-DD hh:mm a")
            : "",
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "life_journey_orders.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // ---------- Export (server CSV) ----------
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
        `${API_BASE_URL}/api/admin/life-journey-orders/export?${qs.toString()}`,
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "life_journey_orders.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "CSV export failed",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // ---------- columns ----------
  const columns = useMemo(
    () => [
      {
        name: "",
        selector: (_row: Order, idx?: number) =>
          (page - 1) * filters.limit + (idx || 0) + 1,
        width: "40px",
      },
      {
        name: "Order ID",
        selector: (row: Order) => row?.orderID || "—",
        width: "110px",
      },
      {
        name: "Plan",
        selector: (row: Order) => row?.planName || "—",
        width: "200px",
      },
      {
        name: "Amount",
        selector: (row: Order) => row?.amount || "—",
        width: "120px",
      },
      {
        name: "Status",
        selector: (row: Order) => row?.status || "—",
        cell: (row: Order) => (
          <span className="capitalize">{row?.status || "—"}</span>
        ),
        width: "80px",
      },
      {
        name: "Lang",
        selector: (row: Order) => row?.reportLanguage || "—",
        width: "90px",
      },
      {
        name: "Name",
        selector: (row: Order) => row?.name || "—",
        width: "180px",
      },
      {
        name: "WhatsApp",
        selector: (row: Order) => row?.whatsapp || "—",
        width: "120px",
      },
      {
        name: "Email",
        selector: (row: Order) => row?.email || "—",
        width: "240px",
      },
      {
        name: "Astro",
        selector: (row: Order) => (row?.astroConsultation ? "Yes" : "No"),
        width: "90px",
      },
      {
        name: "Express",
        selector: (row: Order) => (row?.expressDelivery ? "Yes" : "No"),
        width: "90px",
      },
      {
        name: "Paid At",
        selector: (row: Order) =>
          row?.paymentAt
            ? moment
                .tz(row.paymentAt, "Asia/Kolkata")
                .format("DD/MM/YYYY hh:mm a")
            : "—",
        width: "170px",
      },
      {
        name: "Created",
        selector: (row: Order) =>
          row?.createdAt
            ? moment
                .tz(row.createdAt, "Asia/Kolkata")
                .format("DD/MM/YYYY hh:mm a")
            : "—",
        width: "170px",
      },
      {
        name: "Action",
        cell: (row: Order) => (
          <div className="flex gap-3 items-center">
            <div className="cursor-pointer" onClick={() => onView(row)}>
              <ViewSvg />
            </div>
            <div className="cursor-pointer" onClick={() => onEdit(row)}>
              <EditSvg />
            </div>
          </div>
        ),
        width: "100px",
      },
    ],
    [page, filters.limit]
  );

  return (
    <>
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fff',
          marginBottom: '20px',
          boxShadow: '0px 0px 5px lightgrey',
          borderRadius: '10px',
        }}
      >
        {/* Header + Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#000' }}>
            {stats && (
              <>
                <div>
                  Total Order: {stats.totalOrders} • Total Revenue: ₹
                  {Number(stats.totalRevenue || 0).toFixed(2)}
                </div>
                <div style={{ fontWeight: 600, color: '#000', marginTop: '5px' }}>
                  Today: {stats.todayOrders} • Revenue: ₹
                  {Number(stats.todayRevenue || 0).toFixed(2)}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={downloadCSV}>
              CSV(Current)
            </Button>
            <Button variant="outlined" size="small" onClick={downloadServerCSV}>
              CSV(All)
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <TextField
            select
            SelectProps={{ native: true }}
            name="dateRange"
            value={filters.dateRange}
            onChange={onChangeFilter}
            label="Date Range"
            size="small"
            style={{ minWidth: '150px' }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </TextField>

          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={onChangeFilter}
            max={getTodayDate()}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={onChangeFilter}
            max={getTodayDate()}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontSize: '14px',
              outline: 'none',
            }}
          />

          <TextField
            select
            SelectProps={{ native: true }}
            name="language"
            value={filters.language}
            onChange={onChangeFilter}
            label="Language"
            size="small"
            style={{ minWidth: '150px' }}
          >
            <option value="all">All</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </TextField>

          <TextField
            select
            SelectProps={{ native: true }}
            name="status"
            value={filters.status}
            onChange={onChangeFilter}
            label="Status"
            size="small"
            style={{ minWidth: '130px' }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
          </TextField>

          <TextField
            placeholder="Plan name"
            name="planName"
            value={filters.planName}
            onChange={onChangeFilter}
            size="small"
            style={{ minWidth: '150px' }}
          />

          <TextField
            select
            SelectProps={{ native: true }}
            name="astroConsultation"
            value={filters.astroConsultation}
            onChange={onChangeFilter}
            label="Astro"
            size="small"
            style={{ minWidth: '110px' }}
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </TextField>

          <TextField
            select
            SelectProps={{ native: true }}
            name="expressDelivery"
            value={filters.expressDelivery}
            onChange={onChangeFilter}
            label="Express"
            size="small"
            style={{ minWidth: '110px' }}
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </TextField>

          <TextField
            select
            SelectProps={{ native: true }}
            name="sortBy"
            value={filters.sortBy}
            onChange={onChangeFilter}
            label="Sort By"
            size="small"
            style={{ minWidth: '150px' }}
          >
            <option value="createdAt">createdAt</option>
            <option value="paymentAt">paymentAt</option>
            <option value="planName">planName</option>
            <option value="reportLanguage">reportLanguage</option>
          </TextField>

          <TextField
            select
            SelectProps={{ native: true }}
            name="sortOrder"
            value={filters.sortOrder}
            onChange={onChangeFilter}
            label="Order"
            size="small"
            style={{ minWidth: '100px' }}
          >
            <option value="desc">desc</option>
            <option value="asc">asc</option>
          </TextField>

          <TextField
            select
            SelectProps={{ native: true }}
            name="limit"
            value={filters.limit}
            onChange={onChangeFilter}
            label="Rows"
            size="small"
            style={{ minWidth: '90px' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </TextField>

          <Button variant="contained" size="small" onClick={() => fetchList(1)}>
            Apply
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setFilters({
                ...filters,
                q: "",
                from: "",
                to: "",
                dateRange: "",
                language: "",
                planName: "",
                status: "",
                astroConsultation: "",
                expressDelivery: "",
              });
            }}
          >
            Reset
          </Button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <MainDatatable
            data={rows}
            columns={columns}
            title="Life Journey Orders"
            isLoading={loading}
          />
        </div>

        {/* Pagination */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            size="small"
            onClick={() => onPageChange("prev")}
            disabled={page <= 1}
          >
            Prev
          </Button>
          {Array.from({ length: Math.min(pages, 10) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={i}
                size="small"
                variant={page === pageNum ? "contained" : "outlined"}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          {pages > 10 && <span>...</span>}
          <Button
            size="small"
            onClick={() => onPageChange("next")}
            disabled={page >= pages}
          >
            Next
          </Button>
          <div style={{ marginLeft: '8px', opacity: 0.7, fontSize: '14px' }}>Total: {total}</div>
        </div>
      </div>

      {/* VIEW modal */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(activeRow || {}).map(([k, v]) => (
              <Grid item xs={12} sm={6} key={k}>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{k}</div>
                <div style={{ fontWeight: 600 }}>{String(v ?? "")}</div>
              </Grid>
            ))}
          </Grid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button variant="outlined" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT modal */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Grid container spacing={2}>
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
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  fullWidth
                  size="small"
                  label={label}
                  value={(editPayload as any)[key] ?? ""}
                  onChange={(e) =>
                    setEditPayload((p) => ({ ...p, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                margin="dense"
                size="small"
                label="Status"
                value={editPayload.status || ""}
                onChange={(e) =>
                  setEditPayload({
                    ...editPayload,
                    status: e.target.value as any,
                  })
                }
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={!!editPayload.astroConsultation}
                  onChange={(e) =>
                    setEditPayload((p) => ({
                      ...p,
                      astroConsultation: e.target.checked,
                    }))
                  }
                />
                Astro Consultation
              </label>
            </Grid>
            <Grid item xs={12} sm={6}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={!!editPayload.expressDelivery}
                  onChange={(e) =>
                    setEditPayload((p) => ({
                      ...p,
                      expressDelivery: e.target.checked,
                    }))
                  }
                />
                Express Delivery
              </label>
            </Grid>
          </Grid>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="outlined" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitEdit}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportOrders;