'use client';
import React, { useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/navigation';
import { CSVLink } from 'react-csv';
import DownloadIcon from '@mui/icons-material/Download';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Swal from "sweetalert2";

interface Column {
  name: string;
  selector?: (row: any, index?: number) => any;
  cell?: (row: any, index?: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface StatusFilter {
  label: string;
  value: string;
  count?: number;
  color?: string;
}

interface MainDatatableProps {
  data: any[];
  columns: Column[];
  url?: string;
  title?: string;
  addButtonActive?: boolean;
  buttonMessage?: string;
  isLoading?: boolean;
  showSearch?: boolean;
  expandableRows?: boolean;
  expandableRowsComponent?: React.ComponentType<{ data: any }>;
  statusFilters?: StatusFilter[];
  onStatusFilterChange?: (status: string) => void;
  selectedStatus?: string;
  dateFilters?: React.ReactNode;
  additionalFilters?: React.ReactNode;
}

// Deep search function
const DeepSearchSpace = (data: any[], searchText: string): any[] => {
  if (!searchText) return data;
  
  const searchLower = searchText.toLowerCase();
  return data.filter(item => 
    Object.values(item).some(val => 
      val && String(val).toLowerCase().includes(searchLower)
    )
  );
};

// Custom styles for DataTable
const DataTableCustomStyles = {
  headCells: {
    style: {
      backgroundColor: '#ef4444',
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#ffffff',
    },
  },
  cells: {
    style: {
      fontSize: '14px',
    },
  },
  expanderButton: {
    style: {
      display: 'none',
    },
  },
  table: {
    style: {
      width: '100%', // Ensure table takes full width
    },
  },
  headRow: {
    style: {
      width: '100%', // Header row takes full width
    },
  },
};

const MainDatatable: React.FC<MainDatatableProps> = ({ 
  data = [], 
  columns, 
  url, 
  title = '', 
  addButtonActive = true, 
  buttonMessage = '',
  isLoading = false,
  showSearch = true,
  expandableRows = false,
  expandableRowsComponent,
  statusFilters,
  onStatusFilterChange,
  selectedStatus = 'all',
  dateFilters,
  additionalFilters
}) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value);
  const filteredData = DeepSearchSpace(data, searchText);

  // Ensure data is always an array for CSV export
  const csvData = Array.isArray(data) && data.length > 0 ? data : [];

  const onClickAdd = () => {
    if (addButtonActive && url) {
      router.push(url);
    } else {
      Swal.fire({ 
        icon: "error", 
        title: "Sorry can't add more", 
        text: "Maximum 10 banners are allowed.", 
        showConfirmButton: false, 
        timer: 2000, 
      });
    }
  };


  const enhancedColumns = useMemo(() => {
  // Remove the expand button column - just return original columns
  return columns;
}, [columns]);

  
  const ExpandableComponent = ({ data: rowData }: { data: any }) => {
    if (!expandableRowsComponent) return null;
    const Component = expandableRowsComponent;
    return <Component data={rowData} />;
  };

  const getSelectedStatusLabel = () => {
    if (!statusFilters) return 'All';
    const selected = statusFilters.find(f => f.value === selectedStatus);
    return selected ? selected.label : 'All';
  };

  return (
    <div className={`${title ? 'p-5 shadow-sm border border-gray-200 rounded-lg mb-5' : ''} bg-white`}>
      {isLoading ? (
        <div className="text-black text-center min-h-[400px] flex items-center justify-center text-base">
          <div className="animate-spin w-16 h-16 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Section with Title, Search, and Filters in one row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            {/* Left Side - Title */}
            {title && (
              <div className="text-xl font-semibold text-gray-800 lg:min-w-[200px]">
                {title}
              </div>
            )}

            {/* Right Side - Search, Date Filter, Status Filter */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:justify-end items-start sm:items-center">
              {/* Search Box */}
              {showSearch && (
                <div className="">
                  <input
                    type="search"
                    value={searchText}
                    onChange={handleSearch}
                    placeholder="Search..."
                    className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {/* Date Filters */}
              {dateFilters && (
                <div className="flex gap-2 items-center">
                  {dateFilters}
                </div>
              )}

              {/* Status Dropdown */}
              {statusFilters && onStatusFilterChange && (
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center gap-2 min-w-[40px] justify-between"
                  >
                    <span>{getSelectedStatusLabel()}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showStatusDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowStatusDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                        {statusFilters.map((filter) => (
                          <button
                            key={filter.value}
                            onClick={() => {
                              onStatusFilterChange(filter.value);
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                              selectedStatus === filter.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            <span>{filter.label}</span>
                            {filter.count !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                selectedStatus === filter.value 
                                  ? 'bg-indigo-100 text-indigo-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {filter.count}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Additional Filters */}
              {additionalFilters}
            </div>

            {/* Action Buttons - CSV Download and Add Button */}
            <div className="flex gap-3 items-center lg:ml-4">
              {/* CSV Download */}
              {csvData.length > 0 ? (
                <CSVLink 
                  filename={`${title}.csv`} 
                  data={csvData} 
                  className="text-gray-800 text-base no-underline flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  <div className="text-base font-medium text-gray-600">
                    <DownloadIcon />
                  </div>
                </CSVLink>
              ) : (
                <div className="text-gray-400 text-base flex items-center gap-2 cursor-not-allowed opacity-50">
                  <div className="text-base font-medium">
                    <DownloadIcon />
                  </div>
                </div>
              )}

              {/* Add Button */}
              {url && addButtonActive && (
                <button 
                  onClick={onClickAdd}
                  className="font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors duration-200 text-sm border-none whitespace-nowrap"
                >
                  <span>{buttonMessage || 'Add'}</span>
                  <span className="font-bold text-lg">+</span>
                </button>
              )}
            </div>
          </div>

          {/* DataTable with built-in pagination */}
         <DataTable
  columns={enhancedColumns}
  data={showSearch ? filteredData : data}
  pagination
  paginationPerPage={10}
  paginationRowsPerPageOptions={[10, 25, 50, 100, 200]}
  paginationComponentOptions={{ 
    rowsPerPageText: 'Rows Per Page:',
    rangeSeparatorText: 'of',
  }}
  customStyles={DataTableCustomStyles}
  fixedHeader
  fixedHeaderScrollHeight="600px"
  highlightOnHover
  pointerOnHover
  responsive
  noDataComponent={
    <div className="text-center py-10 text-gray-500">
      No records found
    </div>
  }
  expandableRows={expandableRows}
  expandableRowsComponent={ExpandableComponent}
  expandableRowsHideExpander={true}
  expandOnRowClicked={true}
  
/>

         
        </>
      )}
    </div>
  );
};

export default MainDatatable;