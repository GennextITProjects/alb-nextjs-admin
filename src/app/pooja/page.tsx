'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MainDatatable from "@/components/common/MainDatatable";
import ViewModal from "@/components/modals/viewmodal";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import Swal from "sweetalert2";

// Types
interface Category {
    _id: string;
    categoryName: string;
}

interface WhyYouShould {
    title: string;
    description: string;
    icon: string;
    _id: string;
}

interface PricingPackage {
    title: string;
    price: number;
    isPopular: boolean;
    features: string[];
    _id: string;
}

interface Testimonial {
    highlight: string;
    quote: string;
    name: string;
    location: string;
    _id: string;
}

interface FAQ {
    question: string;
    answer: string;
    _id: string;
}

interface EnhancedBenefit {
    title: string;
    description: string;
    icon: string;
    _id: string;
}

interface PujaItem {
    _id: string;
    title: string;
    slug: string;
    price: number;
    imageUrl: string;
    mainImage: string;
    galleryImages: string[];
    overview: string;
    whyPerform: string;
    enhancedBenefits: EnhancedBenefit[];
    enhancedWhoShouldBook: EnhancedBenefit[];
    pujaDetails: string;
    whyYouShould: WhyYouShould[];
    pricingPackages: PricingPackage[];
    testimonials: Testimonial[];
    faqs: FAQ[];
    categoryId: string;
    type: string;
    adminCommission: number;
    discount: number;
    isPopular: boolean;
    duration: string;
    languages: string[];
    cancellationPolicy: string;
    preparationRequired: string;
    panditRequired: boolean;
    status: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    keywords: string[];
    sortOrder: number;
    benefits: any[];
    whoShouldBook: any[];
    whyPerformReasons: any[];
    about: any[];
}

// API Configuration
const IMG_URL = process.env.NEXT_PUBLIC_IMG_URL || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Utility Functions
const deepSearchSpace = (data: PujaItem[], searchText: string): PujaItem[] => {
    if (!searchText.trim()) return data;

    const lowerSearch = searchText.toLowerCase();
    return data.filter(item => {
        return JSON.stringify(item).toLowerCase().includes(lowerSearch);
    });
};

const formatIndianRupee = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

// API Functions
const getPujaList = async (): Promise<PujaItem[]> => {
    try {
        const response = await fetch(`${API_URL}/api/puja-new/get_all_puja`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch puja list');
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching puja list:', error);
        return [];
    }
};

const deletePujaItem = async (pujaId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/api/puja/delete_puja`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pujaId: pujaId
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete puja');
        }

        return true;
    } catch (error) {
        console.error('Error deleting puja:', error);
        return false;
    }
};

const Puja: React.FC = () => {
    const router = useRouter();
    const [pujaData, setPujaData] = useState<PujaItem[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [text, setText] = useState<string>("");
    const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

    const filteredData = deepSearchSpace(pujaData, searchText);

    const openModal = (text: string): void => {
        setModalIsOpen(true);
        setText(text);
    };

    const closeModal = (): void => setModalIsOpen(false);

    const handleEdit = (row: PujaItem): void => {
        // Store the puja data in localStorage
        localStorage.setItem('editPujaData', JSON.stringify(row));
        // Navigate to edit page with ID
        router.push(`/pooja/add-pooja?id=${row._id}`);
    };

    const handleDelete = async (pujaId: string): Promise<void> => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You want to delete this puja!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            const success = await deletePujaItem(pujaId);
            if (success) {
                Swal.fire(
                    'Deleted!',
                    'Puja has been deleted successfully.',
                    'success'
                );
                fetchPujaData();
            } else {
                Swal.fire(
                    'Error!',
                    'Failed to delete puja.',
                    'error'
                );
            }
        }
    };

    const fetchPujaData = async (): Promise<void> => {
        setLoading(true);
        const data = await getPujaList();
        setPujaData(data);
        setLoading(false);
    };

    // DataTable Columns
    const columns = [
        {
            name: 'S.No.',
            selector: (row: PujaItem) => pujaData.indexOf(row) + 1,
            width: '80px'
        },
        {
            name: 'Puja Name',
            selector: (row: PujaItem) => row?.title || 'N/A',
            width: '150px'
        },
        {
            name: 'Puja Price',
            selector: (row: PujaItem) => formatIndianRupee(row?.price),
            width: '120px'
        },
        {
            name: 'Commission Price',
            selector: (row: PujaItem) => `${row?.adminCommission || 0}%`,
            width: '100px'
        },
        // {
        //     name: 'Discount',
        //     selector: (row: PujaItem) => `${row?.discount || 0}%`,
        //     width: '100px'
        // },
        // {
        //     name: 'Duration',
        //     selector: (row: PujaItem) => row?.duration || 'N/A',
        //     width: '120px'
        // },
        // {
        //     name: 'Status',
        //     cell: (row: PujaItem) => (
        //         <span className={`px-2 py-1 rounded text-xs ${row?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        //             {row?.status || 'inactive'}
        //         </span>
        //     ),
        //     width: '100px'
        // },
        // {
        //     name: 'Popular',
        //     cell: (row: PujaItem) => (
        //         <span className={`px-2 py-1 rounded text-xs ${row?.isPopular ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
        //             {row?.isPopular ? 'Yes' : 'No'}
        //         </span>
        //     ),
        //     width: '100px'
        // },
        {
            name: 'Image',
            cell: (row: PujaItem) => (
                <div className="relative w-[50px] h-[50px]">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL3}${row.imageUrl}`}
                        alt={row?.title || 'Puja'}
                        fill
                        className="rounded-full object-cover"
                    />
                </div>
            ),
            width: '80px'
        },
        {
            name: 'Action',
            cell: (row: PujaItem) => (
                <div className="flex gap-5 items-center">
                    <button
                        onClick={() => handleEdit(row)}
                        className="cursor-pointer hover:opacity-70 transition-opacity p-1"
                        title="Edit"
                    >
                        <EditSvg />
                    </button>
                    <button
                        onClick={() => handleDelete(row._id)}
                        className="cursor-pointer hover:opacity-70 transition-opacity p-1"
                        title="Delete"
                    >
                        <DeleteSvg />
                    </button>
                </div>
            ),
            width: "120px"
        },
    ];

    useEffect(() => {
        fetchPujaData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <>
            <MainDatatable 
                       columns={columns.map((col) => ({
          ...col,
          minwidth: col.width,
          width: undefined,
        }))} 
                title='Puja'
                data={filteredData} 
                url="/pooja/add-pooja" 
                showSearch={false}
          
            />

            <ViewModal
                openModal={modalIsOpen}
                text="Puja"
                title="Puja Description"
                handleCloseModal={closeModal}
            />
        </>
    );
};

export default Puja;