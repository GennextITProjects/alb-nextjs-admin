// components/ChatWithAstrologer.tsx
'use client';

import axios from 'axios';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BsBroadcast } from 'react-icons/bs';

// TypeScript interfaces
interface ConsultationPrice {
  price: number;
  duration: {
    slotDuration: number;
  };
  _id: string;
}

interface MainExpertise {
  _id: string;
  mainExpertise: string;
  description: string;
  image: string;
}

interface NextAvailableSlot {
  date: string | null;
  fromTime: string | null;
  toTime?: string | null;
}

interface AstrologerData {
  _id: string;
  id: string;
  original_price: number;
  isOnline: string;
  isLive: boolean;
  title: string;
  avg_rating: number;
  astrologerName: string;
  profileImage: string;
  tagLine: string;
  rating: number;
  ratingCount: number;
  experience: string;
  mainExpertise: MainExpertise[];
  language: string[];
  consultationPrices: ConsultationPrice[];
  consultation: string;
  nextAvailableSlot: NextAvailableSlot | null;
  hasSpecialPricing?: boolean;  
  specialPricingRates?: {       
    [key: string]: number;
  };
  GoWithCustomPricings?: boolean;
  firstTimeOfferPrices?: Array<{
    duration: string;
    price: number;
    _id: string;
  }>;
  useGlobalFirstTimeOfferPrice?: boolean;
  minFirstTimeOfferPrice?: number | null;
}


interface ApiResponse {
  success: boolean;
  message: string;
  results: AstrologerData[];
  totalPages: number;
}

interface ChatWithAstrologerProps {
  searchText?: string;
  expertiseId?: string;
  onCountChange?: (count: number) => void;
}

const ChatWithAstrologer: React.FC<ChatWithAstrologerProps> = ({ 
  searchText = '', 
  expertiseId = '',
  onCountChange 
}) => {
  const router = useRouter();
  const [astrologerData, setAstrologerData] = useState<AstrologerData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [isFetched, setIsFetched] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<{
    type: 'network' | 'server' | null;
    message: string;
  } | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [globalOfferPrice, setGlobalOfferPrice] = useState<number | null>(null);

  // Check if customer is new
useEffect(() => {
  async function checkCustomerStatus() {
    try {
      const customerId = localStorage.getItem('customer_id');
      
      // if (!customerId) {
      //   setIsNewCustomer(false);
      //   return;
      // }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/check-new-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId , offerPriceActive: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsNewCustomer(data.isNewCustomer);
        if (data.hasOfferPrice) {
          setGlobalOfferPrice(data.offerPrice);
        }
      }
    } catch (error) {
      console.error('Failed to check customer status:', error);
      setIsNewCustomer(false);
    }
  }

  checkCustomerStatus();
}, []);

const sortConsultationPrices = (prices: ConsultationPrice[]): ConsultationPrice[] => {
  return [...prices].sort((a, b) => b.price - a.price);
};

const getMinPrice = (astrologer: AstrologerData): number => {
  if (!astrologer?.consultationPrices?.length) return 0;
  
  const validPrices = astrologer.consultationPrices
    .filter(price => price.price !== 5)
    .map(price => price.price);
  
  if (validPrices.length === 0) return 0;
  
  return Math.min(...validPrices);
};

// Get first-time offer price for new customers
const getFirstTimeOfferPrice = (astrologer: AstrologerData): number | null => {
  if (!isNewCustomer) {
    return null;
  }

  // Custom first-time pricing
  if (astrologer.GoWithCustomPricings && 
      astrologer.firstTimeOfferPrices && 
      astrologer.firstTimeOfferPrices.length > 0 &&
      astrologer.minFirstTimeOfferPrice !== null) {
    return astrologer.minFirstTimeOfferPrice ? astrologer.minFirstTimeOfferPrice : null;
  }

  // Global first-time pricing
  if (astrologer.useGlobalFirstTimeOfferPrice && globalOfferPrice !== null) {
    return globalOfferPrice;
  }

  return null;
};

// Get minimum special price if special pricing is enabled
const getSpecialPrice = (astrologer: AstrologerData): number | null => {
  if (!astrologer?.hasSpecialPricing || !astrologer?.specialPricingRates) {
    return null;
  }

  const specialPrices = Object.values(astrologer.specialPricingRates);
  
  if (specialPrices.length === 0) {
    return null;
  }

  return Math.min(...specialPrices);
};

// UPDATED: Get display price with special pricing priority
const getDisplayPrice = (astrologer: AstrologerData): number => {
  // ===== Priority 1: Special Pricing (hasSpecialPricing) - ABSOLUTE PRIORITY =====
  // If special pricing exists, USE ONLY THAT - don't check anything else
  if (astrologer?.hasSpecialPricing) {
    const specialPrice = getSpecialPrice(astrologer);
    if (specialPrice !== null) {
      return specialPrice;
    }
  }

  // ===== If NO special pricing, then check other options for NEW CUSTOMERS =====
  
  if (isNewCustomer) {
    const prices: number[] = [];
    
    // Add first-time offer price if available
    const offerPrice = getFirstTimeOfferPrice(astrologer);
    if (offerPrice !== null) {
      prices.push(offerPrice);
    }
    
    // Add consultation min price
    prices.push(getMinPrice(astrologer));
    
    // Return minimum of all prices
    return Math.min(...prices);
  }

  // Not a new customer - return base price
  return getMinPrice(astrologer);
};


// Categorize and sort astrologers by price within each category
const categorizeAndSortAstrologers = (astrologers: AstrologerData[]): AstrologerData[] => {
  const categories = {
    celebrity: [] as AstrologerData[],
    top: [] as AstrologerData[],
    rising: [] as AstrologerData[],
    other: [] as AstrologerData[]
  };

  // Categorize astrologers
  astrologers.forEach(astrologer => {
    // Sort consultation prices for this astrologer
    const sortedPrices = sortConsultationPrices(astrologer.consultationPrices);
    
    // Create a new astrologer object with sorted prices
    const astrologerWithSortedPrices = {
      ...astrologer,
      consultationPrices: sortedPrices
    };

    const title = astrologer.title?.toLowerCase();
    
    if (title?.includes('celebrity')) {
      categories.celebrity.push(astrologerWithSortedPrices);
    } else if (title?.includes('top')) {
      categories.top.push(astrologerWithSortedPrices);
    } else if (title?.includes('rising')) {
      categories.rising.push(astrologerWithSortedPrices);
    } else {
      categories.other.push(astrologerWithSortedPrices);
    }
  });

  // Sort each category by maximum price (highest first)
  const sortedCelebrity = categories.celebrity.sort((a, b) => getMinPrice(b) - getMinPrice(a));
  const sortedTop = categories.top.sort((a, b) => getMinPrice(b) - getMinPrice(a));
  const sortedRising = categories.rising.sort((a, b) => getMinPrice(b) - getMinPrice(a));
  const sortedOther = categories.other.sort((a, b) => getMinPrice(b) - getMinPrice(a));

  // Return in the desired order
  return [
    ...sortedCelebrity,    // Celebrity astrologers sorted by price (highest first)
    ...sortedTop,          // Top astrologers sorted by price (highest first)
    ...sortedRising,       // Rising stars sorted by price (highest first)
    ...sortedOther         // Others sorted by price (highest first)
  ];
};

  // Add this helper function inside the component
const prioritizeAstrologer = (astrologers: AstrologerData[], priorityName: string): AstrologerData[] => {
  const priorityAstrologer = astrologers.find(
    (a) => a.astrologerName === priorityName
  );
  
  if (priorityAstrologer) {
    const others = astrologers.filter(
      (a) => a.astrologerName !== priorityName
    );
    return [priorityAstrologer, ...others];
  }
  
  return astrologers;
};

const fetchAstrologers = async (pageNum: number = 1, reset: boolean = false): Promise<void> => {
  try {
    setLoading(true);
    setError(null); // Clear previous errors
    
    if (reset) {
      setAstrologerData([]);
      setIsFetched(false);
      setHasMore(true);
    }
    

    const currentTimePlus15 = moment().add(15, 'minutes').format('HH:mm');

    const paramsObj: Record<string, string> = {
      page: pageNum.toString(),
      limit: '100',
      searchText: searchText,
      hasAvailableSlots: 'true',
      currentTime: currentTimePlus15,
    };
    // Only add mainExpertise if expertiseId is provided and not empty
    if (expertiseId && expertiseId !== '') {
      paramsObj.mainExpertise = expertiseId;
    }

    const params = new URLSearchParams(paramsObj);

    const { data }: { data: ApiResponse } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/astrologer_filters`,
      { 
        params,
        timeout: 15000 // 15 second timeout
      }
    );

    // Filter out astrologers with empty consultationPrices array
   const filteredResults = data.results.filter(astrologer => {
  const prices = astrologer?.consultationPrices;
  return prices && prices.length > 0;
});
const categorizedResults = categorizeAndSortAstrologers(filteredResults);

    // Prioritize "Acharya Lavbhushan" to appear first
const prioritizedResults = prioritizeAstrologer(categorizedResults, "Acharya Lavbhushan");

    // Check if we got any results - if 0 results, set hasMore to false
    if (prioritizedResults.length === 0) {
      setHasMore(false);
    }

    if (reset) {
      setAstrologerData(prioritizedResults);
    } else {
      setAstrologerData(prev => [...prev, ...prioritizedResults]);
    }
    
    setTotalPage(data.totalPages);
    
    // Update count in parent component
    if (onCountChange) {
      onCountChange(reset ? prioritizedResults.length : astrologerData.length + prioritizedResults.length);
    }
  } catch (err: any) {
    console.error("Error fetching astrologer data:", err);
    
    // Check if it's a network error (backend down)
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      setError({
        type: 'network',
        message: 'Your backend is currently down and facing some issues. Please try again later.'
      });
    } 
    // Check for timeout
    else if (err.code === 'ECONNREFUSED' || err.message.includes('timeout')) {
      setError({
        type: 'network',
        message: 'Connection timeout. Our servers might be experiencing issues. Please try again later.'
      });
    }
    // Server responded with error status
    else if (err.response) {
      setError({
        type: 'server',
        message: 'Unable to fetch consultants. Please try again.'
      });
    }
    // Unknown error
    else {
      setError({
        type: 'network',
        message: 'Our backend is currently down and facing some issues. Please try again later.'
      });
    }
    
    if (onCountChange) {
      onCountChange(0);
    }
  } finally {
    setLoading(false);
    setIsFetched(true);
  }
};

  // Reset and fetch when search text or expertise changes
  useEffect(() => {
    setPage(1);
    fetchAstrologers(1, true);
  }, [searchText, expertiseId]);

  // Fetch more when page changes (but not on initial load)
  useEffect(() => {
    if (page > 1) {
      fetchAstrologers(page, false);
    }
  }, [page]);

useEffect(() => {
  const handleScroll = (): void => {
    if (loading || !hasMore) return;

    // Get all astrologer cards
    const cards = document.querySelectorAll('[data-astrologer-card]');
    
    if (cards.length === 0) return;

    // Get the last card
    const lastCard = cards[cards.length - 1];
    const rect = lastCard.getBoundingClientRect();
    
    // Check if last card is visible in viewport (with some buffer)
    const isLastCardVisible = rect.top <= window.innerHeight + 200;

    if (isLastCardVisible) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  window.addEventListener("scroll", handleScroll);
  // Also check on mount in case content doesn't fill screen
  handleScroll();
  
  return () => window.removeEventListener("scroll", handleScroll);
}, [loading, hasMore, astrologerData.length]);

  const handleCardClick = (astrologer: AstrologerData): void => {
    const slug = astrologer?.astrologerName?.split(' ')?.join('-')?.toLowerCase();
    router.push(`/astrologer/details?name=${slug}&id=${astrologer?._id}`);
  };

const renderStars = (rating: number): React.ReactNode => {
  const starsToShow = rating === 0 ? 4 : Math.ceil(rating);
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span 
          key={i} 
          className={`text-sm transition-all ${
            i < starsToShow 
              ? 'text-yellow-400' 
              : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

  const getFilteredExpertise = (expertiseList: MainExpertise[]): MainExpertise[] => {
    return expertiseList.filter(exp => 
      exp.mainExpertise.toLowerCase() !== 'ask any prashna'
    );
  };

  // Price display component with reactive pricing
const PriceDisplay = ({ astrologer }: { astrologer: AstrologerData }) => {
  const [priceKey, setPriceKey] = useState(0);

  useEffect(() => {
    setPriceKey(prev => prev + 1);
  }, [isNewCustomer, globalOfferPrice]);

  const displayPrice = getDisplayPrice(astrologer);

  return (
    <div 
      key={priceKey}
      className="flex items-center gap-2 animate-fadeIn"
    >
      {/* Original Price */}
      {!astrologer.hasSpecialPricing && 
      astrologer.original_price > displayPrice && (
        <span className="text-xs font-bold text-gray-400 line-through">
          ₹{astrologer.original_price.toLocaleString('en-IN')}
        </span>
      )}

      {/* Display Price */}
      <span className="text-md font-bold text-red-700">
        ₹{displayPrice.toLocaleString('en-IN')}
      </span>
    </div>
  );
};


  return (
    <section className='px-4 pb-6 min-h-screen'>
      <article className='max-w-7xl mx-auto space-y-6'>
        {/* Backend Error State */}
        {error && isFetched && (
          <div className={`rounded-2xl shadow-md p-8 text-center ${
            error.type === 'network' 
              ? 'bg-red-50 border-2 border-red-200' 
              : 'bg-orange-50 border-2 border-orange-200'
          }`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              error.type === 'network' 
                ? 'bg-red-100' 
                : 'bg-orange-100'
            }`}>
              <svg 
                className={`w-8 h-8 ${
                  error.type === 'network' 
                    ? 'text-red-600' 
                    : 'text-orange-600'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${
              error.type === 'network' 
                ? 'text-red-900' 
                : 'text-orange-900'
            }`}>
              {error.type === 'network' ? 'Service Unavailable' : 'Oops!'}
            </h3>
            <p className={`text-base mb-6 max-w-md mx-auto ${
              error.type === 'network' 
                ? 'text-red-700' 
                : 'text-orange-700'
            }`}>
              {error.message}
            </p>
            <button
              onClick={() => fetchAstrologers(1, true)}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors shadow-md ${
                error.type === 'network'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Consultants Grid - Only show if no error */}
        {!error && (
          <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-1 md:gap-4 pt-2'>
            {astrologerData?.map((astrologer, value) => {
              return (
                <Link 
                  prefetch={true}
                  key={value}
                  href={`/astrologer/details?name=${astrologer.astrologerName}&id=${astrologer._id}`}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
                  data-astrologer-card
                >
                  {/* Golden Background Section with Profile Image */}
          
                  <div className="relative flex items-center justify-center w-full bg-gradient-to-b from-yellow-200 via-amber-100 to-white pt-6 pb-4">
                    {/* First Call Offer Ribbon - Top Left */}
                    {isNewCustomer && 
                     getFirstTimeOfferPrice(astrologer) !== null && 
                     astrologer.astrologerName !== "Acharya Lavbhushan" &&
                     getDisplayPrice(astrologer) < getMinPrice(astrologer) && (
                      <div className="absolute top-0 left-0 w-28 h-28 overflow-hidden z-10">
                        <div 
                          className="absolute top-5 -left-7 bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-bold py-1 px-8 origin-center shadow-lg whitespace-nowrap" 
                          style={{transform: 'rotate(-45deg)'}}
                        >
                          First Call Offer
                        </div>
                      </div>
                    )}
                    {/* Live Badge - Top Right */}
                    {astrologer.isLive && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-sm shadow-lg flex items-center gap-0.5">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707zm2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708zm5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708zm2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                          </svg>
                          LIVE
                        </div>
                      </div>
                    )}

                    <div className="relative w-32 h-32">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img
                          src={`${process.env.NEXT_PUBLIC_PREFIX_IMAGE_URL}${astrologer.profileImage}`}
                          alt={astrologer.astrologerName}
                          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>


                  {/* Content Area - White Background */}
                  <div className="flex flex-col items-start gap-1 w-full flex-1 p-4 pt-3">
{/* Name */}
<div className='flex items-center gap-1'>
  <h3 className="text-sm sm:text-base font-bold text-gray-900 capitalize truncate">
    {astrologer.astrologerName}
  </h3>
  <svg 
    className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-green-600" 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path 
      fillRule="evenodd" 
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
      clipRule="evenodd"
    />
  </svg>
</div>

                    {/* Rating and Experience - NEW */}
                      <div className="flex items-center justify-between w-full flex-shrink-0">
                        <div className="flex items-center gap-0.5">
                          {renderStars(astrologer.rating)}
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {astrologer.experience}+ yrs
                        </span>
                      </div>



                  {/* Verified Badge - ADD THIS */}
                  {/* <div className="flex items-center gap-1 w-full flex-shrink-0 mb-0.5">
                    <svg 
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-green-600" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[10px] sm:text-xs text-green-700 font-medium">
                      Verified Vedic Astrologer
                    </span>
                  </div> */}
                    {/* Consultations Count */}
                    <div className="flex items-center gap-1.5 w-full flex-shrink-0">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-xs text-gray-500">
                        {astrologer.consultation || 2500}+ Consultations
                      </span>
                    </div>

                    {/* Language */}
                    <div className="flex items-center gap-1.5 text-gray-400 w-full flex-shrink-0">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                      </svg>
                      <span className="text-xs truncate">
                        {astrologer.language?.slice(0, 2).join(', ') || 'English'}
                      </span>
                      {astrologer.language?.length > 2 && (
                        <span className="text-gray-400 text-xs">+{astrologer.language.length - 2}</span>
                      )}
                    </div>

                    {/* Spacer - Pushes price to bottom */}
                    <div className="flex-1"></div>

                    {/* Price and Book Now - Responsive layout */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 mt-1 border-t border-gray-100 w-full flex-shrink-0 ">

                    <PriceDisplay astrologer={astrologer} />

                      {/* Book Now Button - Full width on mobile, auto on desktop */}
                      <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors duration-200 shadow-sm whitespace-nowrap w-full sm:w-auto">
                        {/* Mobile: Show "Pay ₹price" */}
                        <span className="sm:hidden">
                          Book Now
                        </span>
                        {/* Desktop: Show "Book Now" */}
                        <span className="hidden sm:inline">
                          Book Now
                        </span>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Loading States */}
        {loading && !isFetched && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-40 sm:h-48"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - Only show if no error */}
        {!error && isFetched && astrologerData?.length <= 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-md text-center py-12 px-6">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No consultants available right now
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                All our consultants are currently busy. Please try again later.
              </p>
              <button 
                onClick={() => fetchAstrologers(1, true)}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md text-sm"
              >
                Refresh Availability
              </button>
            </div>
          </div>
        )}

        {/* Load More Loading */}
        {loading && isFetched && !error && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Loading more consultants...</p>
            </div>
          </div>
        )}
      </article>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </section>
  );
};

export default ChatWithAstrologer;