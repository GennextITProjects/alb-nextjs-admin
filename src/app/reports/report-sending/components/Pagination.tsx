import React from "react";

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const getPageButtons = () => {
    const buttons: (number | string)[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      buttons.push(1);
      if (start > 2) buttons.push("...");
    }

    for (let i = start; i <= end; i++) {
      buttons.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push("...");
      buttons.push(totalPages);
    }

    return buttons;
  };

  return (
    <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg text-sm">
      <div className="text-gray-600">
        Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          «
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          ‹
        </button>

        {getPageButtons().map((btn, idx) => (
          <button
            key={idx}
            onClick={() => typeof btn === "number" ? onPageChange(btn) : null}
            className={`px-3 py-1 rounded ${
              btn === currentPage
                ? "bg-blue-600 text-white"
                : typeof btn === "number"
                ? "border hover:bg-gray-50"
                : "text-gray-400 cursor-default"
            }`}
            disabled={btn === "..."}
          >
            {btn}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          ›
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          »
        </button>
      </div>

      <div className="text-gray-600">
        Page {currentPage} / {totalPages}
      </div>
    </div>
  );
};
