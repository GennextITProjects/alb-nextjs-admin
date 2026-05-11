"use client";

import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import {
  Dialog, DialogContent, DialogTitle, IconButton,
  Chip, Tooltip, LinearProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TableColumn } from "react-data-table-component";
import Swal from "sweetalert2";
import MainDatatable from "@/components/common/MainDatatable";
import { base_url } from "@/lib/api-routes";

interface LineItem {
  title: string;
  variant_title: string;
  quantity: number;
  price: string;
  sku: string;
}

interface ShopifyOrder {
  _id: string;
  name: string;
  email: string;
  phone: string;
  Status: "Paid" | "Unpaid" | "Initiated";
  shopify_order_id: string;
  razorpay_order_id: string;
  is_gemstone_order: boolean;
  gemstone_handles: string[];
  consultation_matched: boolean;
  drive_link: string | null;
  shopify_order_data: any;
  createdAt: string;
}

interface UploadModalState {
  open: boolean;
  order: ShopifyOrder | null;
  uploading: boolean;
  progress: number;
  driveLink: string | null;
}

const deepSearch = <T,>(data: T[], searchText: string): T[] => {
  if (!searchText) return data;
  const lower = searchText.toLowerCase();
  return data.filter((item) => JSON.stringify(item).toLowerCase().includes(lower));
};

const statusColor: Record<string, "success" | "warning" | "default"> = {
  Paid: "success",
  Unpaid: "warning",
  Initiated: "default",
};

const ShopifyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [filteredData, setFilteredData] = useState<ShopifyOrder[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [gemstoneFilter, setGemstoneFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Upload Modal
  const [uploadModal, setUploadModal] = useState<UploadModalState>({
    open: false, order: null, uploading: false, progress: 0, driveLink: null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (gemstoneFilter !== "") params.append("is_gemstone", gemstoneFilter);
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const res = await fetch(`${base_url}api/admin/shopify-orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data.data || []);
      setFilteredData(data.data || []);
    } catch (err) {
      console.error("Error fetching shopify orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, gemstoneFilter, startDate, endDate]);
  useEffect(() => { setFilteredData(deepSearch(orders, searchText)); }, [searchText, orders]);

  const openUploadModal = (order: ShopifyOrder) => {
    setSelectedFile(null);
    setUploadModal({ open: true, order, uploading: false, progress: 0, driveLink: order.drive_link });
  };

  const closeUploadModal = () => {
    if (uploadModal.uploading) return;
    setUploadModal({ open: false, order: null, uploading: false, progress: 0, driveLink: null });
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadModal.order) return;

    setUploadModal(prev => ({ ...prev, uploading: true, progress: 10 }));

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("orderId", uploadModal.order._id);

      // Fake progress since axios progress doesn't work easily with fetch
      const progressInterval = setInterval(() => {
        setUploadModal(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 85)
        }));
      }, 1500);

      const res = await fetch(`${base_url}api/admin/shopify-orders/upload-mp4`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      setUploadModal(prev => ({ ...prev, uploading: false, progress: 100, driveLink: data.drive_link }));

      // Refresh table
      fetchOrders();

      Swal.fire({
        icon: "success",
        title: "Uploaded!",
        text: "MP4 uploaded to Google Drive successfully",
        timer: 2500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error("Upload error:", error);
      setUploadModal(prev => ({ ...prev, uploading: false, progress: 0 }));
      Swal.fire({ icon: "error", title: "Upload Failed", text: "Something went wrong during upload" });
    }
  };

  const columns: TableColumn<ShopifyOrder>[] = useMemo(() => [
    {
      name: "S.No.",
      selector: (_row, index) => (index !== undefined ? index + 1 : 0),
      width: "70px",
    },
    {
      name: "Order No.",
      cell: (row) => (
        <span className="font-medium text-sm">
          {row.shopify_order_data?.name || row.shopify_order_id || "-"}
        </span>
      ),
      width: "110px",
    },
    {
      name: "Customer",
      cell: (row) => (
        <div className="py-1">
          <div className="font-medium text-sm">{row.name || "-"}</div>
          <div className="text-xs text-gray-500">{row.email || "-"}</div>
          <div className="text-xs text-gray-500">{row.phone || "-"}</div>
        </div>
      ),
      width: "190px",
    },
    {
      name: "Products",
      cell: (row) => {
        const items: LineItem[] = row.shopify_order_data?.line_items || [];
        return (
          <div className="py-1">
            {items.map((item, i) => (
              <div key={i} className="text-xs mb-1">
                <span className="font-medium">{item.title}</span>
                {item.variant_title && item.variant_title !== item.title && (
                  <span className="text-gray-400"> — {item.variant_title}</span>
                )}
                <span className="text-gray-500"> × {item.quantity}</span>
              </div>
            ))}
          </div>
        );
      },
      width: "200px",
    },
    {
      name: "Amount",
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium">₹{row.shopify_order_data?.total_price || "-"}</div>
          {Number(row.shopify_order_data?.total_discounts) > 0 && (
            <div className="text-xs text-green-600">
              -{row.shopify_order_data?.total_discounts} off
            </div>
          )}
        </div>
      ),
      width: "110px",
    },
    {
      name: "Status",
      cell: (row) => (
        <Chip
          label={row.Status}
          color={statusColor[row.Status] || "default"}
          size="small"
        />
      ),
      width: "100px",
    },
    {
      name: "Type",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          {row.is_gemstone_order && (
            <Chip label="💎 Gemstone" size="small" color="secondary" />
          )}
          {row.consultation_matched && (
            <Chip label="📋 Consultation" size="small" color="info" />
          )}
          {!row.is_gemstone_order && !row.consultation_matched && (
            <Chip label="🛍️ Product" size="small" variant="outlined" />
          )}
        </div>
      ),
      width: "130px",
    },
    {
      name: "Payment",
      cell: (row) => {
        const method = row.shopify_order_data?.note_attributes?.find(
          (a: any) => a.name === "payment_method"
        )?.value || "-";
        const gateway = row.shopify_order_data?.payment_gateway_names?.[0] || "";
        return (
          <div className="text-xs">
            <div className="font-medium capitalize">{method}</div>
            <div className="text-gray-400">{gateway}</div>
          </div>
        );
      },
      width: "120px",
    },
    {
      name: "Drive Link",
      cell: (row) => row.drive_link ? (
        <a
          href={row.drive_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-xs underline"
        >
          View Video
        </a>
      ) : (
        <span className="text-gray-400 text-xs">Not uploaded</span>
      ),
      width: "110px",
    },
    {
      name: "Date",
      selector: (row) => moment(row.createdAt).format("DD/MM/YY HH:mm"),
      width: "120px",
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          onClick={() => openUploadModal(row)}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
        >
          📤 Send
        </button>
      ),
      width: "100px",
    },
  ], []);

  return (
    <>
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 px-4 pt-4 pb-2 bg-white border-b">
        {/* Search */}
        <input
          type="text"
          placeholder="Search name / email / phone..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Initiated">Initiated</option>
        </select>

        {/* Gemstone Filter */}
        <select
          value={gemstoneFilter}
          onChange={(e) => setGemstoneFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Types</option>
          <option value="true">💎 Gemstone Only</option>
          <option value="false">🛍️ Non-Gemstone</option>
        </select>

        {/* Date Range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {/* Clear filters */}
        {(statusFilter || gemstoneFilter || startDate || endDate) && (
          <button
            onClick={() => { setStatusFilter(""); setGemstoneFilter(""); setStartDate(""); setEndDate(""); }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      <MainDatatable
        title="Shopify Orders"
        columns={columns as any}
        data={filteredData}
        isLoading={loading}
      />

      {/* Upload MP4 Modal */}
      <Dialog open={uploadModal.open} onClose={closeUploadModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <span>📤 Upload & Send Video</span>
            <IconButton onClick={closeUploadModal} size="small" disabled={uploadModal.uploading}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          {uploadModal.order && (
            <div className="space-y-4 py-2">

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-semibold text-gray-700 mb-1">Customer</div>
                <div>{uploadModal.order.name || "-"}</div>
                <div className="text-gray-500">{uploadModal.order.email || "-"}</div>
                <div className="text-gray-500">{uploadModal.order.phone || "-"}</div>
                <div className="text-gray-400 text-xs mt-1">
                  Order: {uploadModal.order.shopify_order_data?.name || uploadModal.order.shopify_order_id}
                </div>
              </div>

              {/* Existing Drive Link */}
              {uploadModal.driveLink && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <div className="font-semibold text-green-700 mb-1">✅ Drive Link</div>
                    <a href={uploadModal.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all text-xs"
                    >
                    {uploadModal.driveLink}
                    </a>
                </div>
                )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {uploadModal.driveLink ? "Replace MP4 Video" : "Upload MP4 Video"}
                </label>
                <input
                  type="file"
                  accept="video/mp4"
                  disabled={uploadModal.uploading}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedFile.name} — {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {uploadModal.uploading && (
                <div>
                  <LinearProgress variant="determinate" value={uploadModal.progress} />
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Uploading to Google Drive... {uploadModal.progress}%
                  </p>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadModal.uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {uploadModal.uploading ? "Uploading..." : "Upload to Drive & Send Link"}
              </button>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShopifyOrdersPage;