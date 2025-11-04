// 'use client';
// import React, { useState } from 'react';
// import DataTable from 'react-data-table-component';
// import { useRouter } from 'next/navigation';
// import { CSVLink } from 'react-csv';
// import { Color } from '../../assets/colors';
// import DownloadIcon from '@mui/icons-material/Download';
// import Swal from "sweetalert2";
// import Image from 'next/image';
// import { DownloadSvg } from '../svgs/page';

// interface Column {
//   name: string;
//   selector?: (row: any, index?: number) => any;
//   cell?: (row: any, index?: number) => React.ReactNode;
//   width?: string;
//   sortable?: boolean;
// }

// interface MainDatatableProps {
//   data: any[];
//   columns: Column[];
//   url?: string;
//   title?: string;
//   addButtonActive?: boolean;
//   buttonMessage?: string;
//   isLoading?: boolean;
// }

// // Deep search function
// const DeepSearchSpace = (data: any[], searchText: string): any[] => {
//   if (!searchText) return data;
  
//   const searchLower = searchText.toLowerCase();
//   return data.filter(item => 
//     Object.values(item).some(val => 
//       val && String(val).toLowerCase().includes(searchLower)
//     )
//   );
// };

// // Custom styles for DataTable
// const DataTableCustomStyles = {
//   headCells: {
//     style: {
//       backgroundColor: '#f8f9fa',
//       fontWeight: 'bold',
//       fontSize: '14px',
//     },
//   },
//   cells: {
//     style: {
//       fontSize: '14px',
//     },
//   },
// };

// const MainDatatable: React.FC<MainDatatableProps> = ({ 
//   data = [], 
//   columns, 
//   url, 
//   title = 'Title', 
//   addButtonActive = true, 
//   buttonMessage = '',
//   isLoading = false
// }) => {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState('');

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value);
//   const filteredData = DeepSearchSpace(data, searchText);

//   const onClickAdd = () => {
//     if (addButtonActive && url) {
//       router.push(url);
//     } else {
//       Swal.fire({ 
//         icon: "error", 
//         title: "Sorry can't add more", 
//         text: "Maximum 10 banners are allowed.", 
//         showConfirmButton: false, 
//         timer: 2000, 
//       });
//     }
//   };

//   return (
//     <div style={{ 
//       padding: "20px", 
//       backgroundColor: "#fff", 
//       marginBottom: "20px", 
//       boxShadow: '0px 0px 5px lightgrey', 
//       borderRadius: "10px" 
//     }}>
//       {isLoading ? (
//         <div style={{ 
//           color: "black", 
//           textAlign: "center", 
//           minHeight: "400px", 
//           display: "flex", 
//           alignItems: "center", 
//           justifyContent: "center", 
//           fontSize: "16px",
//         }}>
//           <div 
//             style={{ 
//               animation: 'rotation 2s infinite linear',
//               width: '100px',
//               height: '100px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center'
//             }}
//           >
//             {/* Replace with your loading spinner or use a simple CSS spinner */}
//             <div style={{
//               width: '50px',
//               height: '50px',
//               border: '3px solid #f3f3f3',
//               borderTop: '3px solid #3498db',
//               borderRadius: '50%',
//               animation: 'spin 1s linear infinite'
//             }}></div>
//           </div>
//           <style jsx>{`
//             @keyframes spin {
//               0% { transform: rotate(0deg); }
//               100% { transform: rotate(360deg); }
//             }
//           `}</style>
//         </div>
//       ) : (
//         <>
//           <div style={{ 
//             display: "flex", 
//             justifyContent: "space-between", 
//             marginBottom: "20px", 
//             backgroundColor: "#fff" 
//           }}>
//             <div style={{ 
//               fontSize: "22px", 
//               fontWeight: "500", 
//               color: Color?.black || '#000' 
//             }}>
//               {title}
//             </div>

//             <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//               <CSVLink 
//                 filename={title} 
//                 data={data} 
//                 style={{ 
//                   color: "#000", 
//                   fontSize: "1rem", 
//                   textDecoration: "none", 
//                   display: "flex", 
//                   alignItems: "center", 
//                   gap: "10px", 
//                   cursor: "pointer" 
//                 }} 
//               >
//                 <div style={{ fontSize: "16px", fontWeight: "500", color: '#667284' }}>
//                   <DownloadIcon />
//                 </div>
//                 <DownloadSvg />
//               </CSVLink>

//               {url && (
//                 <button 
//                   onClick={onClickAdd}
//                   style={{ 
//                     fontWeight: "500", 
//                     backgroundColor: Color?.primary || '#007bff', 
//                     color: Color?.white || '#fff', 
//                     padding: "8px 12px", 
//                     borderRadius: "5px", 
//                     display: "flex", 
//                     alignItems: "center", 
//                     gap: "5px", 
//                     cursor: "pointer",
//                     border: 'none',
//                     fontSize: '14px'
//                   }}
//                 >
//                   <span>Add</span>
//                   <span style={{ fontWeight: "bold", fontSize: "18px" }}>+</span>
//                 </button>
//               )}
//             </div>
//           </div>

//           <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
//             <input 
//               style={{
//                 padding: '8px 12px', 
//                 borderRadius: '5px', 
//                 border: '1px solid #ccc',
//                 boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)',
//                 width: '100%', 
//                 maxWidth: '250px', 
//                 fontSize: '15px',  
//                 outline: 'none',
//               }} 
//               type='search' 
//               value={searchText} 
//               onChange={handleSearch} 
//               placeholder='Search' 
//             />
//           </div>

//           <DataTable
//             columns={columns}
//             data={filteredData}
//             pagination
//             customStyles={DataTableCustomStyles}
//             paginationPerPage={10}
//             paginationRowsPerPageOptions={[10, 25, 50, 100, 200]}
//             paginationComponentOptions={{ rowsPerPageText: 'Rows Per Page :' }}
//             fixedHeader
//           />
//         </>
//       )}
//     </div>
//   );
// };

// export default MainDatatable;



// 'use client';
// import React, { useState } from 'react';
// import DataTable from 'react-data-table-component';
// import { useRouter } from 'next/navigation';
// import { CSVLink } from 'react-csv';
// import DownloadIcon from '@mui/icons-material/Download';
// import Swal from "sweetalert2";
// import { DownloadSvg } from '../svgs/page';

// interface Column {
//   name: string;
//   selector?: (row: any, index?: number) => any;
//   cell?: (row: any, index?: number) => React.ReactNode;
//   width?: string;
//   sortable?: boolean;
// }

// interface MainDatatableProps {
//   data: any[];
//   columns: Column[];
//   url?: string;
//   title?: string;
//   addButtonActive?: boolean;
//   buttonMessage?: string;
//   isLoading?: boolean;
// }

// // Deep search function
// const DeepSearchSpace = (data: any[], searchText: string): any[] => {
//   if (!searchText) return data;
  
//   const searchLower = searchText.toLowerCase();
//   return data.filter(item => 
//     Object.values(item).some(val => 
//       val && String(val).toLowerCase().includes(searchLower)
//     )
//   );
// };

// // Custom styles for DataTable
// const DataTableCustomStyles = {
//   headCells: {
//     style: {
//       backgroundColor: '#ef4444',
//       fontWeight: 'bold',
//       fontSize: '14px',
//       color: '#ffffff',
//     },
//   },
//   cells: {
//     style: {
//       fontSize: '14px',
//     },
//   },
// };

// const MainDatatable: React.FC<MainDatatableProps> = ({ 
//   data = [], 
//   columns, 
//   url, 
//   title = 'Title', 
//   addButtonActive = true, 
//   buttonMessage = '',
//   isLoading = false
// }) => {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState('');

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value);
//   const filteredData = DeepSearchSpace(data, searchText);

//   const onClickAdd = () => {
//     if (addButtonActive && url) {
//       router.push(url);
//     } else {
//       Swal.fire({ 
//         icon: "error", 
//         title: "Sorry can't add more", 
//         text: "Maximum 10 banners are allowed.", 
//         showConfirmButton: false, 
//         timer: 2000, 
//       });
//     }
//   };

//   return (
//     <div className="p-5 bg-white shadow-sm border border-gray-200 rounded-lg mb-5">
//       {isLoading ? (
//         <div className="text-black text-center min-h-[400px] flex items-center justify-center text-base">
//           <div className="animate-spin w-16 h-16 flex items-center justify-center">
//             <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
//           </div>
//         </div>
//       ) : (
//         <>
//           {/* Header Section */}
//           <div className="flex justify-between items-center mb-5 bg-white">
//             <div className="text-xl font-semibold text-gray-800">
//               {title}
//             </div>
 
//             <div className="flex gap-3 items-center">
//                 <div className=" flex justify-end rounded-sm">
//             <input 
//               className="px-4 py-2 border border-red-500 text-red-500 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-full max-w-xs text-sm"

//               type='search' 
//               value={searchText} 
//               onChange={handleSearch} 
//               placeholder='Search' 
//             />
//           </div>
//               <CSVLink 
//                 filename={title} 
//                 data={data} 
//                 className="text-gray-800 text-base no-underline flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors"
//               >
//                 <div className="text-base font-medium text-gray-600">
//                   <DownloadIcon />
//                 </div>
//                 <DownloadSvg />
//               </CSVLink>

//               {url && (
//                 <button 
//                   onClick={onClickAdd}
//                   className="font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors duration-200 text-sm border-none"
//                 >
//                   <span>Add</span>
//                   <span className="font-bold text-lg">+</span>
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Search Section */}
         

//           {/* DataTable */}
//           <DataTable
//             columns={columns}
//             data={filteredData}
//             pagination
//             customStyles={DataTableCustomStyles}
//             paginationPerPage={10}
//             paginationRowsPerPageOptions={[10, 25, 50, 100, 200]}
//             paginationComponentOptions={{ rowsPerPageText: 'Rows Per Page :' }}
//             fixedHeader
//           />
//         </>
//       )}
//     </div>
//   );
// };

// export default MainDatatable;


'use client';
import React, { useState } from 'react';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/navigation';
import { CSVLink } from 'react-csv';
import DownloadIcon from '@mui/icons-material/Download';
import Swal from "sweetalert2";
import { DownloadSvg } from '../svgs/page';

interface Column {
  name: string;
  selector?: (row: any, index?: number) => any;
  cell?: (row: any, index?: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface MainDatatableProps {
  data: any[];
  columns: Column[];
  url?: string;
  title?: string;
  addButtonActive?: boolean;
  buttonMessage?: string;
  isLoading?: boolean;
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
};

const MainDatatable: React.FC<MainDatatableProps> = ({ 
  data = [], 
  columns, 
  url, 
  title = 'Title', 
  addButtonActive = true, 
  buttonMessage = '',
  isLoading = false
}) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

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

  return (
    <div className="p-5 bg-white shadow-sm border border-gray-200 rounded-lg mb-5">
      {isLoading ? (
        <div className="text-black text-center min-h-[400px] flex items-center justify-center text-base">
          <div className="animate-spin w-16 h-16 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="flex justify-between items-center mb-5 bg-white">
            <div className="text-xl font-semibold text-gray-800">
              {title}
            </div>
 
            <div className="flex gap-3 items-center">
              <div className="flex justify-end rounded-sm">
                <input 
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-full max-w-xs text-sm"
                  type='search' 
                  value={searchText} 
                  onChange={handleSearch} 
                  placeholder='Search' 
                />
              </div>
              
              {/* Only show CSVLink if there's data to export */}
              {csvData.length > 0 ? (
                <CSVLink 
                  filename={`${title}.csv`} 
                  data={csvData} 
                  className="text-gray-800 text-base no-underline flex items-center gap-2 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  <div className="text-base font-medium text-gray-600">
                    <DownloadIcon />
                  </div>
                  <DownloadSvg />
                </CSVLink>
              ) : (
                <div className="text-gray-400 text-base flex items-center gap-2 cursor-not-allowed opacity-50">
                  <div className="text-base font-medium">
                    <DownloadIcon />
                  </div>
                  <DownloadSvg />
                </div>
              )}

              {url && addButtonActive &&(
                <button 
                  onClick={onClickAdd}
                  className="font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors duration-200 text-sm border-none"
                >
                  <span>Add</span>
                  <span className="font-bold text-lg">+</span>
                </button>
              )}
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            customStyles={DataTableCustomStyles}
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100, 200]}
            paginationComponentOptions={{ rowsPerPageText: 'Rows Per Page :' }}
            fixedHeader
            noDataComponent={
              <div className="text-center py-10 text-gray-500">
                No records found
              </div>
            }
          />
        </>
      )}
    </div>
  );
};

export default MainDatatable;