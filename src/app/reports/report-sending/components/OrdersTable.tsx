import React, { useMemo } from "react";
import moment from "moment";
import { Order } from "../types";
import { ViewSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";
import { Pen, RotateCw, SendHorizonal } from "lucide-react";
import { SendAndArchive } from "@mui/icons-material";

interface Props {
  data: Order[];
  loading: boolean;
  page: number;
  limit: number;
  selectedIds: string[];
  onToggleRow: (orderId: string) => void;
  onToggleAll: () => void;
  onView: (row: Order) => void;
  onProcessSingle: (reportId: string) => void;
  onMarkAsDelivered: (orderId: string) => void;
}

export const OrdersTable: React.FC<Props> = ({ 
  data, 
  loading, 
  page, 
  limit,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onView,
  onProcessSingle,
  onMarkAsDelivered
}) => {
  const columns = useMemo(() => {
    const selectableCount = data.filter(r => r._id && r.reportDeliveryStatus !== 'delivered').length;
    
    return [
      { 
        name: "Select",
        cell: (row: Order) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row._id || "")}
            onChange={() => row._id && onToggleRow(row._id)}
            disabled={!row._id || row.reportDeliveryStatus === 'delivered'}
            className="w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={row.reportDeliveryStatus === 'delivered' ? 'Already delivered' : 'Select'}
          />
        ),
        width: "60px",
      },
      { 
        name: "S.No.", 
        selector: (_: Order, idx?: number) => ((page - 1) * limit) + (idx || 0) + 1, 
        width: "80px" 
      },
      { 
        name: "Order ID", 
        selector: (row: Order) => row?.orderID || "—", 
        width: "150px" 
      },
      { 
        name: "Plan", 
        selector: (row: Order) => row?.planName || "—", 
        width: "200px" 
      },
      { 
        name: "Amount", 
        selector: (row: Order) => `₹${row?.amount?.split(' ')[0] || "0"}`, 
        width: "120px" 
      },
      {
        name: "Payment",
        cell: (row: Order) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row?.status === "paid" ? "bg-green-100 text-green-700" :
            row?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {row?.status === "paid" ? "Paid" : row?.status || "—"}
          </span>
        ),
        width: "100px",
      },
      {
        name: "Report Status",
        cell: (row: Order) => {
          const deliveryStatus = row?.reportDeliveryStatus;
          const driveUrl = row?.driveFileUrl;
          
          if (!deliveryStatus || deliveryStatus === 'pending') {
            return (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                Pending
              </span>
            );
          }
          if (!deliveryStatus || deliveryStatus === 'processing') {
            return (
              <span className="px-2 py-1 bg-yellow-100 text-red-700 rounded-full text-xs font-medium">
                Processing
              </span>
            );
          }
          
          if (deliveryStatus === 'delivered') {
            return (
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Delivered
                </span>
                {/* {driveUrl && (
                  <a 
                    href={driveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-lg"
                    title="View Report"
                  >
                    📄
                  </a>
                )} */}
              </div>
            );
          }
          
          if (deliveryStatus === 'failed') {
            return (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Failed
              </span>
            );
          }
          
          return <span className="text-gray-500">—</span>;
        },
        width: "140px",
      },
      { 
        name: "Name", 
        selector: (row: Order) => row?.name || "—", 
        width: "150px" 
      },
      { 
        name: "WhatsApp", 
        selector: (row: Order) => row?.whatsapp || "—", 
        width: "120px" 
      },
      { 
        name: "Language", 
        selector: (row: Order) => row?.reportLanguage || "—", 
        width: "100px" 
      },
      { 
        name: "Created", 
        selector: (row: Order) => row?.formattedCreatedAt || 
          (row?.createdAt ? moment(row.createdAt).format("DD/MM/YY hh:mm A") : "—"), 
        width: "140px" 
      },
      {
        name: "Actions",
        cell: (row: Order) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(row)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="View Details"
            >
              <ViewSvg />
            </button>
            
            {row.reportDeliveryStatus === 'failed' && row._id && (
              <>
                <button
                  onClick={() => onProcessSingle(row._id!)}
                  className="h-4 w-4 flex items-center justify-center font-bold"
                  title="Retry Failed Report"
                >
                  <RotateCw/>
                </button>
                
                <button
                  onClick={() => onMarkAsDelivered(row._id!)}
                  className="h-4 w-4 flex items-center justify-center font-bold"
                  title="Mark as Delivered"
                >
                  <Pen/>
                </button>
              </>
            )}
          </div>
        ),
        width: "180px"
      }
    ];
  }, [page, limit, selectedIds, onToggleRow, onToggleAll, onView, onProcessSingle, onMarkAsDelivered, data]);

  return (
    <div className="mb-4">
      {/* Select All Header */}
      {data.length > 0 && (
        <div className="mb-2 flex items-center gap-2 px-2">
          <input
            type="checkbox"
            checked={
              data.filter(r => r._id && r.reportDeliveryStatus !== 'delivered').length > 0 &&
              selectedIds.length === data.filter(r => r._id && r.reportDeliveryStatus !== 'delivered').length
            }
            onChange={onToggleAll}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-gray-600">
            Select All ({data.filter(r => r.reportDeliveryStatus !== 'delivered').length} available)
          </span>
        </div>
      )}

      {data.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No orders found with the current filters.
        </div>
      ) : (
        <MainDatatable
          data={data}
          columns={columns.map((col) => ({
            ...col,
            minwidth: col.width,
            width: undefined,
          }))}
          isLoading={loading}
          showSearch={false}
        />
      )}
    </div>
  );
};