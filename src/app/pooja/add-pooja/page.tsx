'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { 
  Home, BookOpen, Images, Star, Target, Users, 
  BanknoteIcon, MessageSquare, Shield, Save, X,
  Upload, Plus, Trash2, CheckCircle, Loader2,
  ArrowLeft, Eye
} from 'lucide-react';

// Tab Components
import BasicInfoTab from "@/components/puja/BasicInfoTab";
import DetailsTab from "@/components/puja/DetailsTab";
import ImagesTab from "@/components/puja/ImagesTab";
import BenefitsTab from "@/components/puja/BenefitsTab";
import WhyPerformTab from "@/components/puja/WhyPerformTab";
import WhoShouldBookTab from "@/components/puja/WhoShouldBookTab";
import PackagesTab from "@/components/puja/PackagesTab";
import TestimonialsTab from "@/components/puja/TestimonialsTab";
import FAQsTab from "@/components/puja/FAQsTab";
import TrustCTATab from "@/components/puja/TrustCTATab";


// Types
interface Category {
  _id: string;
  categoryName: string;
}

interface Benefit {
  description: string;
}

interface whyYouShould {
  title: string;
  description: string;
  icon: string;
  _id: string;
}

interface WhoShouldBook {
  description: string;
}

interface PricingPackage {
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  isPopular: boolean;
  features: string[];
  duration?: string;
  validity?: string;
}

interface Testimonial {
  id: number;
  highlight: string;
  quote: string;
  name: string;
  location: string;
  rating?: number;
  verified?: boolean;
  date?: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface TrustCTA {
  badge: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  ctaText: string;
  footerNote: string;
  image: string;
}

interface InputFieldDetail {
  categoryId: string;
  pujaName: string;
  price: string;
  adminCommission: string;
  // description: string;
  overview: string;
  whyPerform: string;
  pujaDetails: string;
  duration: string;
  // languages: string;
  // cancellationPolicy: string;
  // preparationRequired: string;
  // discount: string;
  // panditRequired: boolean;
  // isPopular: boolean;
}

interface ImageState {
  file: string;
  bytes: File | null;
  url: string;
}


// Get single puja API
const getPujaById = async (id: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/get_puja_by/${id}`);
    if (!response.ok) throw new Error('Failed to fetch puja');
    const data = await response.json();
    return data.data || data.puja;
  } catch (error) {
    console.error('Error fetching puja:', error);
    return null;
  }
};

// Get categories API
const getCategories = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja/get_puja_category`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
};

// Create puja API
const createPuja = async (formData: FormData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/create_puja`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Update puja API
const updatePuja = async (id: string, formData: FormData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/update-puja/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Main Component
const AddPujaContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const mode = editId ? 'Edit' : 'Add';

  // State Management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [pujaName, setPujaName] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  // Main form state
  const [inputFieldDetail, setInputFieldDetail] = useState<InputFieldDetail>({
    categoryId: '',
    pujaName: '',
    price: '',
    adminCommission: '',
    // description: '',
    overview: '',
    whyPerform: '',
    pujaDetails: '',
    duration: '',
    // languages: 'Hindi,English',
    // cancellationPolicy: 'Free cancellation up to 24 hours before puja',
    // preparationRequired: '',
    // discount: '',
    // panditRequired: true,
    // isPopular: false
  });

  const [image, setImage] = useState<ImageState>({ 
    file: '', 
    bytes: null, 
    url: '' 
  });

  // Dynamic arrays
const [benefits, setBenefits] = useState<string[]>(['']);
  
const [whyYouShould, setWhyYouShould] = useState([
  { 
    _id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ✅ Unique ID
    title: '', 
    description: '', 
    icon: 'Target' 
  }
]);
  
const [whoShouldBook, setWhoShouldBook] = useState<string[]>(['']);
  
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([
    { id: 1, title: '', price: 0, isPopular: false, features: [''] }
  ]);
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    { id: 1, highlight: '', quote: '', name: '', location: '' }
  ]);
  
  const [faqs, setFaqs] = useState<FAQ[]>([
    { id: 1, question: '', answer: '' }
  ]);
  
  // const [trustCTA, setTrustCTA] = useState<TrustCTA>({
  //   badge: 'TRUSTED BY 5000+ DEVOTEES',
  //   title: 'Need Personal Guidance?',
  //   description: 'Talk to our Acharya directly for personalized solutions',
  //   phone: '+91 9876543210',
  //   email: 'support@acharyalavbhushan.com',
  //   ctaText: 'Book a Call Now',
  //   footerNote: 'Mon-Sun, 9 AM - 9 PM',
  //   image: ''
  // });

  // Gallery
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Tabs
  const tabs = [
    { id: 0, label: 'Basic Info', icon: <Home className="w-4 h-4" /> },
    { id: 1, label: 'Images', icon: <Images className="w-4 h-4" /> },
    { id: 2, label: 'Details', icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: 'Benefits', icon: <Star className="w-4 h-4" /> },
    { id: 4, label: 'Who Should Book', icon: <Users className="w-4 h-4" /> },
    { id: 5, label: 'Why Perform', icon: <Target className="w-4 h-4" /> },
    { id: 6, label: 'Packages', icon: <BanknoteIcon className="w-4 h-4" /> },
    { id: 7, label: 'Testimonials', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 8, label: 'FAQs', icon: <MessageSquare className="w-4 h-4" /> },
    // { id: 9, label: 'Trust CTA', icon: <Shield className="w-4 h-4" /> },
  ];


  
  // Fetch data on mount
  useEffect(() => {
const fetchData = async () => {
  setLoading(true);
  
  // Fetch categories
  const categoriesData = await getCategories();
  setCategories(categoriesData);

  // If editing, fetch puja data
  if (editId) {
    const pujaData = await getPujaById(editId);
    if (pujaData) {
      // Update basic info
      setPujaName(pujaData.title || pujaData.pujaName || '');
      setInputFieldDetail({
        categoryId: pujaData.categoryId || '',
        pujaName: pujaData.title || pujaData.pujaName || '',
        price: pujaData.price?.toString() || '',
        adminCommission: pujaData.adminCommission?.toString() || '',
        overview: pujaData.overview || '',
        whyPerform: pujaData.whyPerform || '',
        pujaDetails: pujaData.pujaDetails || '',
        duration: pujaData.duration || '',
      });

      // Update image
      if (pujaData.imageUrl || pujaData.mainImage) {
        const imgUrl = pujaData.imageUrl || pujaData.mainImage;
        setImage({
          file: imgUrl,
          bytes: null,
          url: `${process.env.NEXT_PUBLIC_IMAGE_URL3}${imgUrl}`
        });
        setImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL3}${imgUrl}`);
      }

      // ========== IMPORTANT: Why You Should Data Formatting ==========
      if (pujaData.whyYouShould && Array.isArray(pujaData.whyYouShould)) {
        const formattedWhyYouShould = pujaData.whyYouShould.map((item: any, index: number) => ({
          _id: item._id || `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`, // ✅ Ensure unique ID
          title: item.title || '',
          description: item.description || '',
          icon: item.icon || 'Target'
        }));
        
        setWhyYouShould(formattedWhyYouShould.length > 0 ? formattedWhyYouShould : [
          { 
            _id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
            title: '', 
            description: '', 
            icon: 'Target' 
          }
        ]);
      } else {
        // Default data if no whyYouShould in API
        setWhyYouShould([
          { 
            _id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
            title: '', 
            description: '', 
            icon: 'Target' 
          }
        ]);
      }

          // Update arrays (handle both enhanced and regular fields)
          if (pujaData.benefits) {
            // If benefits is a string (comma-separated), convert to array
            if (typeof pujaData.benefits === 'string') {
              const benefitsArray = pujaData.benefits
                .split(',')
                .map((b: any) => b.trim())
                .filter((b: any) => b !== '');
              setBenefits(benefitsArray.length > 0 ? benefitsArray : ['']);
            } else if (Array.isArray(pujaData.benefits)) {
              // If already array
              setBenefits(pujaData.benefits.filter((b: any) => b && b.trim() !== ''));
            }
          }

          if (pujaData.enhancedWhoShouldBook && pujaData.enhancedWhoShouldBook.length > 0) {
            const mappedWhoShouldBook = pujaData.enhancedWhoShouldBook.map((item: any, index: number) => ({
              id: index + 1,
              title: item.title || '',
              description: item.description || '',
              icon: item.icon || 'Users'
            }));
            setWhoShouldBook(mappedWhoShouldBook.length > 0 ? mappedWhoShouldBook : [{ id: 1, title: '', description: '', icon: 'Users' }]);
          }
          

          if (pujaData.whoShouldBook) {
              if (typeof pujaData.whoShouldBook === 'string') {
                const whoShouldBookArray = pujaData.whoShouldBook
                  .split(',')
                  .map((w: any) => w.trim())
                  .filter((w: any) => w !== '');
                setWhoShouldBook(whoShouldBookArray.length > 0 ? whoShouldBookArray : ['']);
              } else if (Array.isArray(pujaData.whoShouldBook)) {
                setWhoShouldBook(pujaData.whoShouldBook.filter((w: any) => w && w.trim() !== ''));
              }
            }

          if (pujaData.pricingPackages && pujaData.pricingPackages.length > 0) {
            const mappedPackages = pujaData.pricingPackages.map((pkg: any, index: number) => ({
              id: index + 1,
              title: pkg.title || '',
              price: pkg.price || 0,
              originalPrice: pkg.originalPrice,
              discount: pkg.discount,
              isPopular: pkg.isPopular || false,
              features: pkg.features || [],
              duration: pkg.duration,
              validity: pkg.validity
            }));
            setPricingPackages(mappedPackages.length > 0 ? mappedPackages : [{ id: 1, title: '', price: 0, isPopular: false, features: [''] }]);
          }

          if (pujaData.testimonials && pujaData.testimonials.length > 0) {
            const mappedTestimonials = pujaData.testimonials.map((testimonial: any, index: number) => ({
              id: index + 1,
              highlight: testimonial.highlight || '',
              quote: testimonial.quote || '',
              name: testimonial.name || '',
              location: testimonial.location || ''
            }));
            setTestimonials(mappedTestimonials.length > 0 ? mappedTestimonials : [{ id: 1, highlight: '', quote: '', name: '', location: '' }]);
          }

          if (pujaData.faqs && pujaData.faqs.length > 0) {
            const mappedFaqs = pujaData.faqs.map((faq: any, index: number) => ({
              id: index + 1,
              question: faq.question || '',
              answer: faq.answer || ''
            }));
            setFaqs(mappedFaqs.length > 0 ? mappedFaqs : [{ id: 1, question: '', answer: '' }]);
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [editId]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInputFieldDetail(prev => ({ ...prev, [name]: checked }));
    } else {
      setInputFieldDetail(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setImage({
        file: file.name,
        bytes: file,
        url: previewUrl
      });
      setImagePreview(previewUrl);
    }
  };

  // Handle gallery images
  const handleGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGalleryImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addItem = <T extends { id?: number; _id?: string }>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    template: Omit<T, 'id' | '_id'>
  ) => {
    // For arrays using 'id' (numeric)
    if (array.length > 0 && 'id' in array[0] && typeof array[0].id === 'number') {
      const newId = array.length > 0 ? Math.max(...array.map(item => item.id || 0)) + 1 : 1;
      setArray([...array, { ...template, id: newId } as T]);
    } 
    // For arrays using '_id' (string) - like whyYouShould
    else {
      const uniqueId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setArray([...array, { ...template, _id: uniqueId } as T]);
    }
  };


  // updateItem function ko replace karo with this:

  const updateItem = <T extends { id?: number; _id?: string }>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    identifier: number | string,
    field: keyof T,
    value: any
  ) => {
    setArray(array.map(item => {
      // First check _id (string comparison)
      if (item._id && item._id === identifier) {
        return { ...item, [field]: value };
      }
      // Then check id (number comparison)
      if (item.id && item.id === identifier) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };


  // removeItem function ko replace karo with this:

  const removeItem = <T extends { id?: number; _id?: string }>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    identifier: number | string
  ) => {
    if (array.length > 1) {
      setArray(array.filter(item => {
        // Filter out item with matching _id or id
        const matches_id = item._id && item._id === identifier;
        const matches_id_numeric = item.id && item.id === identifier;
        return !(matches_id || matches_id_numeric);
      }));
    }
  };

  // Package features helpers
  const updatePackageFeature = (packageId: number, featureIndex: number, value: string) => {
    setPricingPackages(packages => 
      packages.map(pkg => {
        if (pkg.id === packageId) {
          const newFeatures = [...pkg.features];
          newFeatures[featureIndex] = value;
          return { ...pkg, features: newFeatures };
        }
        return pkg;
      })
    );
  };

  const addPackageFeature = (packageId: number) => {
    setPricingPackages(packages => 
      packages.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, features: [...pkg.features, ''] }
          : pkg
      )
    );
  };

  const removePackageFeature = (packageId: number, featureIndex: number) => {
    setPricingPackages(packages => 
      packages.map(pkg => {
        if (pkg.id === packageId) {
          const newFeatures = pkg.features.filter((_, i) => i !== featureIndex);
          return { ...pkg, features: newFeatures.length > 0 ? newFeatures : [''] };
        }
        return pkg;
      })
    );
  };

  // Handle popular package
  const handlePopularPackageChange = (packageId: number) => {
    setPricingPackages(packages => 
      packages.map(pkg => ({
        ...pkg,
        isPopular: pkg.id === packageId
      }))
    );
  };

  // Validation
  const validateForm = () => {
    if (!inputFieldDetail.pujaName.trim()) {
      Swal.fire('Error', 'Puja name is required', 'error');
      return false;
    }
    if (!inputFieldDetail.categoryId) {
      Swal.fire('Error', 'Category is required', 'error');
      return false;
    }
    if (!inputFieldDetail.price || parseFloat(inputFieldDetail.price) <= 0) {
      Swal.fire('Error', 'Valid price is required', 'error');
      return false;
    }
    if (!inputFieldDetail.adminCommission || parseFloat(inputFieldDetail.adminCommission) <= 0) {
      Swal.fire('Error', 'Valid admin commission is required', 'error');
      return false;
    }
    if (!editId && !image.bytes && !image.url) {
      Swal.fire('Error', 'Image is required', 'error');
      return false;
    }
    return true;
  };

  // Submit handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setSaving(true);

  try {
    const formData = new FormData();
    
    // Basic fields
    Object.entries(inputFieldDetail).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // ========== KEY CHANGES HERE ==========
    // 1. Benefits - simple array of strings (JSON format mein)
    const benefitsArray = benefits
      .map(benefit => benefit.trim())
      .filter(benefit => benefit !== '');
    formData.append("benefits", JSON.stringify(benefitsArray));
    
    // 2. Who Should Book - simple array of strings (JSON format mein)
    const whoShouldBookArray = whoShouldBook
      .map(item => item.trim())
      .filter(item => item !== '');
    formData.append("whoShouldBook", JSON.stringify(whoShouldBookArray));
    
    // 3. Why You Should - array of objects (same as before)
    // handleSubmit function में whyYouShould को submit करते समय:
formData.append("whyYouShould", JSON.stringify(
  whyYouShould.map(item => ({
    title: item.title,
    description: item.description,
    icon: item.icon,
  }))
));
    
    // 4. Other arrays - same as before
    formData.append("pricingPackages", JSON.stringify(pricingPackages));
    formData.append("testimonials", JSON.stringify(testimonials));
    formData.append("faqs", JSON.stringify(faqs));
    // formData.append("trustCTA", JSON.stringify(trustCTA));

    // Image
    if (image.bytes) {
      formData.append("image", image.bytes);
    }

    // Gallery images
    galleryImages.forEach((img) => {
      formData.append("galleryImages", img);
    });


    // Call API
    let success;
    if (editId) {
      success = await updatePuja(editId, formData);
    } else {
      success = await createPuja(formData);
    }

    if (success) {
      Swal.fire({
        icon: 'success',
        title: `Puja ${editId ? 'Updated' : 'Created'} Successfully`,
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        router.push('/pooja');
      });
    } else {
      throw new Error(`Failed to ${editId ? 'update' : 'create'} puja`);
    }
  } catch (error) {
    Swal.fire('Error', 'Something went wrong. Please try again.', 'error');
  } finally {
    setSaving(false);
  }
};

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Render current tab
  const renderTabContent = () => {
    const props = {
      inputFieldDetail,
      setInputFieldDetail,
      handleInputChange,
      categories,
      benefits,
      setBenefits,
      whyYouShould,
      setWhyYouShould,
      whoShouldBook,
      setWhoShouldBook,
      pricingPackages,
      setPricingPackages,
      testimonials,
      setTestimonials,
      faqs,
      setFaqs,
      // trustCTA,
      // setTrustCTA,
      image,
      imagePreview,
      handleImageUpload,
      galleryImages,
      galleryPreviews,
      handleGalleryImages,
      removeGalleryImage,
      addItem,
      updateItem,
      removeItem,
      updatePackageFeature,
      addPackageFeature,
      removePackageFeature,
      handlePopularPackageChange,
      editId
    };

    switch (activeTab) {
      case 0:
        return <BasicInfoTab {...props} />;
      case 1:
        return <ImagesTab {...props} />;
      case 2:
        return <DetailsTab {...props} />;
      case 3:
        return <BenefitsTab {...props} />;
      case 4:
        return <WhoShouldBookTab {...props} />;
      case 5:
        return <WhyPerformTab {...props} />;
      case 6:
        return <PackagesTab {...props} />;
      case 7:
        return <TestimonialsTab {...props} />;
      case 8:
        return <FAQsTab {...props} />;
      // case 9:
      //   return <TrustCTATab {...props} />;
      default:
        return <BasicInfoTab {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with puja name and image */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/astro-puja/puja')}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">
                  {mode} Puja: {pujaName || 'New Puja'}
                </h1>
                <p className="text-red-100 mt-1">
                  Fill in all the required details step by step
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={imagePreview} 
                    alt="Puja" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* <div className="text-right">
                <div className="text-sm text-red-200">Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">{editId ? 'Editing' : 'Creating'}</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-red-600 border-red-600 bg-red-50'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            {renderTabContent()}
            
            {/* Navigation and Submit */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Step {activeTab + 1} of {tabs.length}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                  disabled={activeTab === 0}
                  className={`px-6 py-2 rounded-lg ${
                    activeTab === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Previous
                </button>
                
                {activeTab < tabs.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(prev => Math.min(tabs.length - 1, prev + 1))}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editId ? 'Update Puja' : 'Create Puja'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component with Suspense
const AddPuja = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <AddPujaContent />
    </Suspense>
  );
};

export default AddPuja;