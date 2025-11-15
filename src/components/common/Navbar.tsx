'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { CrossSvg, HamburgerSvg, PersonSvg, ProfileSvg } from '@/components/svgs/page';
import { Button } from '../ui/button';
// import CustomerLoginSheetMain from '../page/MainLogin';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ASTROLOGER' | 'ADMIN';
  profileImage?: string;
}

// API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_HTTPS

const apiService = {
  getUserProfile: async (customerId: string) => {
    const response = await fetch(`${API_BASE_URL}/customers/get-customer-detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  }
};

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNav, setShowNav] = useState(false);
  const [screenScroll, setScreenScroll] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // New states for scroll behavior
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Special routes styling
  const specialRoutes = ['/muhurat', '/astrology-insights'];
  // const isSpecialRoute = specialRoutes.some(route => pathname?.startsWith(route));
  const isSpecialRoute = false;

  // Fetch user data from localStorage and API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const customerId = localStorage.getItem('customer_id');
        const customerDataStr = localStorage.getItem('customer_data');

        if (customerId) {
          // First, set basic data from localStorage
          if (customerDataStr) {
            const customerData = JSON.parse(customerDataStr);
            setUser({
              id: customerData._id || customerId,
              name: customerData.customerName || 'User',
              email: customerData.email?.trim() || '',
              phone: customerData.phoneNumber || '',
              role: customerData.type || 'CUSTOMER',
              profileImage: customerData.image || '',
            });
          }

          // Then fetch updated profile data from API
          try {
            const profileResponse = await apiService.getUserProfile(customerId);
            if (profileResponse?.success && profileResponse?.customersDetail) {
              const customerData = profileResponse.customersDetail;
              const userData: User = {
                id: customerData._id,
                name: customerData.customerName || 'User',
                email: customerData.email?.trim() || '',
                phone: customerData.phoneNumber || '',
                role: customerData.type || 'CUSTOMER',
                profileImage: customerData.image || '',
              };
              setUser(userData);
              
              // Update localStorage with latest data
              localStorage.setItem('customer_data', JSON.stringify(customerData));
              localStorage.setItem('customer_name', customerData.customerName || '');
              localStorage.setItem('customer_email', customerData.email?.trim() || '');
              localStorage.setItem('customer_phone', customerData.phoneNumber || '');
              if (customerData.image) {
                localStorage.setItem('customer_image', customerData.image);
              }
            }
          } catch (apiError) {
            console.error('API fetch error:', apiError);
            // Continue with localStorage data if API fails
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [localStorage]);

  // Handle scroll for show/hide navbar
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY;
      
  //     // Show header when scrolling up, hide when scrolling down
  //     if (currentScrollY < lastScrollY || currentScrollY < 10) {
  //       setShowHeader(true);
  //     } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
  //       setShowHeader(false);
  //       setShowProfileDropdown(false); // Close dropdown when hiding
  //     }
      
  //     setLastScrollY(currentScrollY);
  //     setScreenScroll(currentScrollY > 60);
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });

  //   return () => {
  //     window.removeEventListener('scroll', handleScroll);
  //   };
  // }, [lastScrollY]);

  // Handle resize and click outside effects
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setShowNav(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowNav(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    document.body.style.overflow = showNav ? 'hidden' : '';

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [showNav]);

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { href: '/', label: 'Home' },
      { href: '/consultation', label: 'Consultation' },
      { href: '/reports', label: 'Reports' },
      { href: '/blog', label: 'Blog' },
      { href: '/about-us', label: 'About Us' },
    ];

    if (user?.role === 'ASTROLOGER') {
      return [...baseItems, { href: '/register-puja', label: 'Register Puja' }];
    } else {
      return [...baseItems, { href: '/book-puja', label: 'Book Puja' }];
    }
  };

  // User dropdown items
  const getUserDropdownItems = () => {
    if (user?.role === 'CUSTOMER') {
      return [
        { href: '/my-account', label: 'Account' },
        { href: '/my-booking', label: 'Booking' },
        { href: '/consultation', label: 'Consultation' },
        { href: '/reports', label: 'Reports' },
        { href: '/cart', label: 'Cart' },
        { href: '/transaction-history', label: 'Transaction History' },
        { href: '/my-order', label: 'Order History' },
        { href: '/book-puja', label: 'Book Puja' },
      ];
    } else if (user?.role === 'ASTROLOGER') {
      return [
        { href: '/astrologer/dashboard', label: 'Dashboard' },
        { href: '/astrologer/account', label: 'Account' },
        { href: '/astrologer/live-streaming', label: 'Go Live' },
        { href: '/astrologer/slots', label: 'Slot Management' },
        { href: '/astrologer/bookings', label: 'Booking Management' },
        { href: '/astrologer/transactions', label: 'Transaction History' },
        { href: '/astrologer/puja-history', label: 'Puja History' },
      ];
    }
    return [];
  };

  const handleLogout = async () => {
    // Clear all user data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('customer_id');
    localStorage.removeItem('customer_phone');
    localStorage.removeItem('customer_name');
    localStorage.removeItem('customer_email');
    localStorage.removeItem('customer_data');
    localStorage.removeItem('customer_image');
    localStorage.clear();
    
    setUser(null);
    setShowNav(false);
    setShowProfileDropdown(false);
    window.location.reload();
  };

  const handleExternalLink = (url: string) => {
    if (typeof window !== 'undefined') {
      const isWebView = navigator.userAgent.includes('wv') || !!(window as any).ReactNativeWebView;
      
      if (isWebView) {
        (window as any).ReactNativeWebView?.postMessage(
          JSON.stringify({ type: 'linking', payload: url })
        );
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <>
      <header 
        className={`fixed w-full max-w-[1700px] z-[1000] transition-all duration-300 text-base font-normal shadow-md ${
          showHeader ? 'top-0' : '-top-full'
        } ${
          isSpecialRoute 
            ? 'bg-[#0E1622] text-white border-b-2 border-yellow-400' 
            : 'bg-white text-black'
        }`}
      >
        <div className="flex flex-wrap justify-between items-center gap-5 relative z-10 px-5 py-3">
          {/* Logo */}
          <Link prefetch={true} href="/" className="flex items-center gap-2 ">
            <Image
              // src={isSpecialRoute ? "/assets/images/logo/logo-small.png" : "/assets/images/logo/logo.png"}
              src={isSpecialRoute ? "/assets/images/logo/logo-small.png" : "/alb-logo.png"}
              alt="Acharya Lavbhushan"
              height={48}
              width={isSpecialRoute ? 40 : 120}
              className="h-12 max-lg:h-10 w-auto"
              priority
            />
            {isSpecialRoute && (
              <span className="text-2xl font-bold text-yellow-400">
                Acharya Lavbhushan
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex gap-5 items-center max-lg:hidden">
            {getNavigationItems().map((item) => (
              <Link prefetch={true}
                key={item.href}
                href={item.href}
                className={`hover:text-primary transition-colors ${
                  pathname === item.href ? 'text-primary' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* External Links */}
            {/* <button 
              onClick={() => handleExternalLink('https://astrovastugurukull.com')}
              className="hover:text-primary transition-colors"
            >
              Courses
            </button> */}

            {/* <Link prefetch={true}
            href="/courses"
            >
              <button 
              className="hover:text-primary transition-colors"
            >
              Courses
              </button>
            </Link> */}

            

            {/* User Authentication */}
            {!user && !isLoading && (
              <Button
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-1.5 bg-white px-5 py-2 rounded-full hover:bg-gray-50"
              >
                <div className="h-9 w-9 border border-secondary rounded-full flex items-center justify-center bg-secondary text-black">
                  <PersonSvg/>
                </div>
                <span className=' text-black'>Sign In</span>
              </Button>
            )}

            {/* User Profile with Dropdown */}
            {user && (
              <div className="relative" >
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {user.profileImage ? (
                    <div className="h-10 w-10 rounded-full text-white bg-[#980d0d] flex items-center justify-center font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    // <Image
                    //   src={process.env.NEXT_PUBLIC_PREFIX_IMAGE_URL + 'uploads/' + user.profileImage}
                    //   alt={user.name}
                    //   width={40}
                    //   height={40}
                    //   className="h-10 w-10 rounded-full object-cover border-2 border-primary"
                    // />
                  ) : (
                    <div className="h-10 w-10 rounded-full text-white bg-[#980d0d] flex items-center justify-center font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute top-[60px] right-0 bg-white w-72 rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
                    {/* User Info Header */}
                    <div className="flex flex-col items-center gap-2 py-5 bg-gradient-to-r from-orange-50 to-white border-b">
                      {user.profileImage ? (
                        // <Image
                        //   src={user.profileImage}
                        //   alt={user.name}
                        //   width={60}
                        //   height={60}
                        //   className="h-[60px] w-[60px] rounded-full object-cover border-2 border-primary"
                        // />
                        <div className="h-[60px] w-[60px] rounded-full bg-[#980d0d] text-white flex items-center justify-center font-bold text-2xl">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      ) : (
                        <div className="h-[60px] w-[60px] rounded-full bg-[#980d0d] text-white flex items-center justify-center font-bold text-2xl">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="text-lg font-semibold text-center text-black">{user.name || 'User'}</div>
                      <div className="text-sm text-gray-600">
                        {user.phone ? `XXXXXX${user.phone.slice(-4)}` : user.email}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {getUserDropdownItems().map((item, index) => (
                        <Link prefetch={true}
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center justify-between py-3 px-5 hover:bg-gray-50 transition-colors border-b text-black hover:text-primary"
                        >
                          <span>{item.label}</span>
                          {item.label === 'Go Live' && (
                            <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                          )}
                        </Link>
                      ))}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 py-3 px-5 hover:bg-red-50 hover:text-red-600 transition-colors border-t text-left text-black font-semibold"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowNav(!showNav)}
            className={`cursor-pointer lg:hidden ${showNav ? 'invisible' : ''}`}
          >
            <HamburgerSvg />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          ref={navRef}
          className={`pb-40 flex flex-col gap-5 p-5 absolute h-full bg-white text-black border-r border-primary shadow-lg top-0 z-50 min-h-screen w-[80vw] transition-all duration-500 overflow-y-auto ${
            showNav ? 'left-0' : 'left-[-200vw]'
          }`}
        >
          <button
            onClick={() => setShowNav(false)}
            className="flex items-center justify-center gap-2 text-sm font-semibold"
          >
            CLOSE <CrossSvg/>
          </button>
          
          {/* Mobile User Profile Section */}
          {user && (
            <div className="flex flex-col items-center gap-2 py-4 border-b">
              {user.profileImage ? (
                // <Image
                //   src={user.profileImage}
                //   alt={user.name}
                //   width={60}
                //   height={60}
                //   className="h-[60px] w-[60px] rounded-full object-cover border-2 border-primary"
                // />
                <div className="h-[60px] w-[60px] rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              ) : (
                <div className="h-[60px] w-[60px] rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-lg font-semibold">{user.name || 'User'}</div>
              <div className="text-sm text-gray-600">
                {user.phone ? `XXXXXX${user.phone.slice(-4)}` : user.email}
              </div>
            </div>
          )}

          <div className="text-center font-semibold text-sm">
            WHAT ARE YOU LOOKING FOR?
          </div>

          {/* Mobile Menu Items */}
          <div className="flex flex-col">
            {user ? (
              <>
                {getUserDropdownItems().map((item) => (
                  <Link prefetch={true}
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowNav(false)}
                    className="flex items-center justify-between border-b py-4 px-1 hover:text-primary"
                  >
                    <span>{item.label}</span>
                    {item.label === 'Go Live' && (
                      <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    )}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center border-b py-4 px-1 hover:text-red-600 text-left font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {getNavigationItems().map((item) => (
                  <Link prefetch={true} 
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowNav(false)}
                    className="flex items-center border-b py-4 px-1 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  onClick={() =>{ 
                    setShowNav(false)
                    setIsLoginOpen(true)
                  }}
                  className="flex items-center border-b py-4 px-1 hover:text-primary"
                >
                  Login as Customer
                </Button>
                {/* <Link
                  href="/auth/signin?type=astrologer"
                  onClick={() => setShowNav(false)}
                  className="flex items-center border-b py-4 px-1 hover:text-primary"
                >
                  Login as Astrologer
                </Link> */}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showNav && (
        <div 
          onClick={() => setShowNav(false)}
          className="fixed top-0 left-0 w-full h-full transition-all ease-in duration-300 bg-black bg-opacity-50 z-40" 
        />
      )}
      
      {/* <CustomerLoginSheetMain
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      /> */}
      
      {/* Profile Dropdown Overlay (Desktop) */}
      {showProfileDropdown && (
        <div 
          onClick={() => setShowProfileDropdown(false)}
          className="fixed top-0 left-0 w-full h-full z-40" 
        />
      )}
    </>
  );
};

export default Header;