'use client';
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainDatatable from "@/components/common/MainDatatable";
import { ViewSvg } from "@/components/svgs/page";
import ViewModal from "@/components/modals/viewmodal";

// Types
interface Customer {
  customerName: string;
}

interface PaymentDetails {
  razorpayOrderId: string;
  razorpayAmount: number;
}

interface PujaBookedItem {
  _id: string;
  customerId: Customer;
  paymentDetails: PaymentDetails;
  createdAt: string;
  status?: string;
}

// Utility Functions
const deepSearchSpace = (data: PujaBookedItem[], searchText: string): PujaBookedItem[] => {
  if (!searchText.trim()) return data;
  
  const lowerSearch = searchText.toLowerCase();
  return data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(lowerSearch)
  );
};

const formatIndianRupee = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// API Functions
const getPujaBookedList = async (): Promise<PujaBookedItem[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja/get_all_booked_pujas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch puja booked list');
    }
    
    const data = await response.json();
    return data.results || data.data || [];
  } catch (error) {
    console.error('Error fetching puja booked list:', error);
    return [];
  }
};

const PujaBooked: React.FC = () => {
  const router = useRouter();
  const [pujaBookedData, setPujaBookedData] = useState<PujaBookedItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [text, setText] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const filteredData = deepSearchSpace(pujaBookedData, searchText);

  const openModal = (text: string) => {
    setModalIsOpen(true);
    setText(text);
  };

  const closeModal = () => setModalIsOpen(false);

  const fetchPujaBookedData = async () => {
    try {
      setLoading(true);
      const data = await getPujaBookedList();
      setPujaBookedData(data);
    } catch (error) {
      console.error('Error fetching puja booked data:', error);
    } finally {
      setLoading(false);
    }
  };

  // DataTable Columns
  const columns = [
    { 
      name: 'S.No.', 
    selector: (row: PujaBookedItem, index?: number) => (index || 0) + 1, // Make index optional
      width: "80px" 
    },
    { 
      name: 'Order Id', 
      selector: (row: PujaBookedItem) => row?.paymentDetails?.razorpayOrderId || 'N/A'
    },
    { 
      name: 'Customer', 
      selector: (row: PujaBookedItem) => row?.customerId?.customerName || 'N/A' 
    },
    { 
      name: 'Total Price', 
      selector: (row: PujaBookedItem) => 
        row?.paymentDetails?.razorpayAmount 
          ? formatIndianRupee(row.paymentDetails.razorpayAmount / 100)
          : 'N/A'
    },
    { 
      name: 'Booking Date', 
      selector: (row: PujaBookedItem) => 
        row?.createdAt 
          ? moment(row.createdAt).format('DD MMM YYYY')
          : 'N/A' 
    },
    { 
      name: 'View', 
      cell: (row: PujaBookedItem) => (
        <div 
          onClick={() => router.push(`/astro-puja/puja-booked/details?orderId=${row?.paymentDetails?.razorpayOrderId}`)} 
          className="cursor-pointer hover:opacity-70 transition-opacity"
        >
          <ViewSvg />
        </div>
      ),
      width: "180px",
      center: true
    },
  ];

  useEffect(() => {
    fetchPujaBookedData();
  }, []);

  return (
<>        {/* Header */}
       

        {/* Search */}
       

        {/* DataTable */}
        <MainDatatable 
          columns={columns} 
          data={filteredData} 
          title="Puja Booked"
          isLoading={loading}
        />

      <ViewModal 
        openModal={modalIsOpen} 
        text={text} 
        title="Puja Description" 
        handleCloseModal={closeModal} 
      />
</>
  );
};

export default PujaBooked;