import React, { useMemo } from "react";
import moment from "moment";
import { Order } from "../types";
import { ViewSvg } from "@/components/svgs/page";
import MainDatatable from "@/components/common/MainDatatable";

interface Props {
  data: Order[];
  loading: boolean;
  page: number;
  limit: number;
  onView: (row: Order) => void;
}

export const OrdersTable: React.FC<Props> = ({ data, loading, page, limit, onView }) => {
 const columns = useMemo(() => [
    { 
      name: "S.No.", 
      selector: (_: Order, idx?: number) => ((page - 1) * limit) + (idx || 0) + 1, 
      width: "100px" 
    },
    { 
      name: "Order ID", 
      selector: (row: Order) => row?.orderID || "—", 
      width: "200px" 
    },
    { 
      name: "Plan", 
      selector: (row: Order) => row?.planName || "—", 
      width: "280px" 
    },
    { 
      name: "Amount", 
      selector: (row: Order) => `₹${row?.amount || "0"}`, 
      width: "160px" 
    },
    {
      name: "Payment Status",
      cell: (row: Order) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row?.status === "paid" ? "bg-green-100 text-green-700" :
          row?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
          row?.status === "processing" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {row?.status || "—"}
        </span>
      ),
      width: "120px",
    },
    // ✅ NEW: Report Delivery Status Column
    {
      name: "Report Status",
      cell: (row: Order) => {
        const deliveryStatus = row?.reportDeliveryStatus;
        const driveUrl = row?.driveFileUrl;
        
        if (!deliveryStatus || deliveryStatus === 'pending') {
          return (
            <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              Pending
            </span>
          );
        }
        
        if (deliveryStatus === 'delivered') {
          return (
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Delivered ✅
              </span>
              {driveUrl && (
                <a 
                  href={driveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  title="View Report"
                >
                  📄
                </a>
              )}
            </div>
          );
        }
        
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Failed ❌
          </span>
        );
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
      width: "110px" 
    },
    { 
      name: "Created", 
      selector: (row: Order) => row?.createdAt 
        ? moment(row.createdAt).format("DD/MM/YY hh:mm A") 
        : "—", 
      width: "140px" 
    },
    {
      name: "Action",
      cell: (row: Order) => (
        <div className="cursor-pointer" onClick={() => onView(row)}>
          <ViewSvg />
        </div>
      ),
      width: "80px"
    }
  ], [page, limit, onView]);

  return (
    <div className="mb-4">
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
    </div>
  );
};
