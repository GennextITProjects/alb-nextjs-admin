import React, { useState } from "react";
import { Filters } from "../types";
import moment from "moment";

interface Props {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
  onRefresh: () => void;
  onReset: () => void;
  onProcessReports?: (reportIds: string[]) => Promise<void>;
  // this prop will receive data
  orders?: any[];
}

export const FilterBar: React.FC<Props> = ({ 
  filters, 
  onChange, 
  onRefresh, 
  onReset, 
  onProcessReports,
  orders = [] 
}) => {
  const getTodayDate = () => moment().format("YYYY-MM-DD");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessReports = async () => {
    if (!onProcessReports || orders.length === 0) return;

    try {
      setIsProcessing(true);
      
      // सभी orders से _id निकालें
      const reportIds = orders
        .filter(order => order._id) // केवल वे orders जिनमें _id है
        .map(order => order._id);
      
      if (reportIds.length === 0) {
        alert("No valid report IDs found!");
        return;
      }

      // API को IDs भेजें
      await onProcessReports(reportIds);
      
    } catch (error) {
      console.error("Error processing reports:", error);
      alert("Failed to process reports!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-4 text-sm">
      <input
        type="text"
        placeholder="Search..."
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value })}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500 min-w-[180px]"
      />

      <input
        type="date"
        value={filters.from}
        onChange={(e) => onChange({ from: e.target.value })}
        max={getTodayDate()}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="date"
        value={filters.to}
        onChange={(e) => onChange({ to: e.target.value })}
        max={getTodayDate()}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="processing">Processing</option>
        <option value="delivered">Delivered</option>
      </select>

      {/* NEW: Select First N Pending Orders */}
      <div className="relative">
        <input
          type="number"
          placeholder="Enter Number to select..."
          value={filters.selectFirstN || ""}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            onChange({ selectFirstN: value });
          }}
          min="1"
          max="1000"
          className="px-3 py-1.5 border-2 min-w-[180px] bg-green-50 font-semibold"
          title="Shows ONLY pending orders (excludes delivered)"
        />
        {filters.selectFirstN && filters.selectFirstN > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Process Reports Button - केवल तभी दिखेगा जब selectFirstN में मान हो */}
      {filters.selectFirstN && filters.selectFirstN > 0 && onProcessReports && (
        <button
          onClick={handleProcessReports}
          disabled={isProcessing || orders.length === 0}
          className="px-4 py-1.5 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title={`Process ${orders.length} pending reports`}
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⟳</span>
              Processing...
            </>
          ) : (
            <>
              <span>⚡</span>
              Process {orders.length} Reports
            </>
          )}
        </button>
      )}

      <select
        value={filters.sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value })}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
        disabled={filters.selectFirstN ? true : false}
      >
        <option value="createdAt">Created</option>
        <option value="paymentAt">Payment</option>
        <option value="planName">Plan</option>
      </select>

      {/* <select
        value={filters.sortOrder}
        onChange={(e) => onChange({ sortOrder: e.target.value as "asc" | "desc" })}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
        disabled={filters.selectFirstN ? true : false}
      >
        <option value="desc">Latest</option>
        <option value="asc">Oldest</option>
      </select> */}

      <button
        onClick={onRefresh}
        className="px-4 py-1.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Refresh
      </button>
      
      {/* <button
        onClick={onReset}
        className="px-4 py-1.5 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        ↺ Reset
      </button> */}
    </div>
  );
};