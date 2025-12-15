// components/customer/profile.tsx
'use client';

import React from 'react';
import moment from 'moment';
import Image from 'next/image';

// Types (use the same as in ViewCustomer)
interface Address {
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

interface Customer {
  _id: string;
  customerName: string;
  image?: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: string;
  address?: Address;
  alternateNumber?: string;
  wallet_balance: number;
  banned_status: boolean;
  call_status: boolean;
  chat_status: boolean;
  createdAt: string;
  device_id?: string;
  fcmToken?: string;
  first_wallet_recharged?: boolean;
  isBlock?: number;
  isDeleted?: number;
  isOnline?: boolean;
  isOtpVerified?: number;
  isSignupCompleted?: number;
  is_registered?: boolean;
  new_user?: boolean;
  otp?: number;
  status?: number;
  timeOfBirth?: string;
  updatedAt: string;
  type?: string;
  placeOfBirth?: string;
}

interface ProfileProps {
  customer: Customer;
}

const Profile: React.FC<ProfileProps> = ({ customer }) => {
  const {
    customerName,
    image,
    email,
    phoneNumber,
    dateOfBirth,
    gender,
    address,
    alternateNumber,
    wallet_balance,
    banned_status,
    call_status,
    chat_status,
    createdAt,
    device_id,
    fcmToken,
    first_wallet_recharged,
    isBlock,
    isDeleted,
    isOnline,
    isOtpVerified,
    isSignupCompleted,
    is_registered,
    new_user,
    otp,
    status,
    timeOfBirth,
    updatedAt,
    placeOfBirth,
  } = customer;
  const baseURL = process.env.NEXT_PUBLIC_API_URL;


  const formatAddress = () => {
    if (!address) return '';
    
    if (address.birthPlace) {
      return address.birthPlace;
    }
    
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : '';
  };

  // Helper function to convert number status to boolean for display
  const getBooleanStatus = (value: number | boolean | undefined): boolean => {
    if (typeof value === 'number') return value === 1;
    return Boolean(value);
  };

  const IndianRupee = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Image Section */}
        <div className="md:col-span-4">
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-100 to-blue-200">
            {image ? (
              // Next.js Image component with proper configuration
              <Image
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL2}${image}`}
                alt={customerName || 'Customer Profile'}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                quality={85}
                priority={true} // Since it's a main profile image
                onError={(e) => {
                  console.error('Profile image failed to load');
                  // Error handling - image will hide automatically
                }}
              />
            ) : (
              // Fallback when no image
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl font-bold text-blue-600">
                  {customerName?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="md:col-span-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              {customerName}
            </h1>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start">
                <span className="font-semibold text-gray-700 min-w-[140px]">Phone:</span>
                <span className="text-gray-600">{phoneNumber || ''}</span>
              </div>

              {email && (
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[140px]">Email:</span>
                  <span className="text-gray-600">{email}</span>
                </div>
              )}

              {gender && (
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[140px]">Gender:</span>
                  <span className="text-gray-600 capitalize">{gender}</span>
                </div>
              )}

              <div className="flex items-start">
                <span className="font-semibold text-gray-700 min-w-[140px]">Location:</span>
                <span className="text-gray-600">{formatAddress()}</span>
              </div>

              {dateOfBirth && (
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[140px]">Date of Birth:</span>
                  <span className="text-gray-600">
                    {moment(dateOfBirth).isValid()
                      ? moment(dateOfBirth).format('DD MMM YYYY')
                      : ''}
                  </span>
                </div>
              )}

              

              {placeOfBirth && (
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[140px]">Place of Birth:</span>
                  <span className="text-gray-600">{placeOfBirth}</span>
                </div>
              )}

              {alternateNumber && (
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[140px]">Alternate Phone:</span>
                  <span className="text-gray-600">{alternateNumber}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;