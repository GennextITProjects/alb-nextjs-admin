import React from "react";
import { Filters } from "../types";
import moment from "moment";

interface Props {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
  onRefresh: () => void;
  onReset: () => void;
}

export const FilterBar: React.FC<Props> = ({ filters, onChange, onRefresh, onReset }) => {
  const getTodayDate = () => moment().format("YYYY-MM-DD");

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

      <select
        value={filters.sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value })}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="createdAt">Created</option>
        <option value="paymentAt">Payment</option>
        <option value="planName">Plan</option>
      </select>

      <select
        value={filters.sortOrder}
        onChange={(e) => onChange({ sortOrder: e.target.value as "asc" | "desc" })}
        className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="desc">Latest</option>
        <option value="asc">Oldest</option>
      </select>

      <button
        onClick={onRefresh}
        className="px-4 py-1.5 text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Refresh
      </button>
      
      <button
        onClick={onReset}
        className="px-4 py-1.5 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
      >
        Reset
      </button>
    </div>
  );
};
