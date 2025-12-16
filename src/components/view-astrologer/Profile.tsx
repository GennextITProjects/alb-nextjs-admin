// app/astrologer/view-astrologer/components/profile.tsx
import { img_url } from '@/lib/api-routes';
import { IndianRupee } from "@/utils/common-function";
import moment from "moment";
import React from "react";


// Types
interface Astrologer {
  _id: string;
  astrologerName: string;
  profileImage: string;
  email: string;
  phoneNumber: string;
  wallet_balance: number;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  dateOfBirth: string;
  chat_price: number;
  call_price: number;
  video_call_price: number;
  experience: number;
  about: string;
  short_bio: string;
  long_bio: string;
  rating: number;
  skill: Array<{ skill: string }>;
  remedies: Array<{ title: string; description: string }>;
  mainExpertise: Array<{ mainExpertise: string }>;
  account_holder_name: string;
  account_number: string;
  account_type: string;
  account_name: string;
  IFSC_code: string;
  panCard: string;
  aadharNumber: string;
  chat_status: string;
  call_status: string;
  video_call_status: string;
  alternateNumber: string;
  gender: string;
  currency: string;
  free_min: number;
  avg_rating: number;
  youtubeLink: string;
  follower_count: number;
  address: string;
  country_phone_code: string;
  commission_video_call_price: number;
  normal_video_call_price: number;
  commission_normal_video_call_price: number;
  consultation_price: number;
  commission_call_price: number;
  commission_chat_price: number;
  commission_remark: string;
  expertise: string;
  live_notification: boolean;
  chat_notification: boolean;
  call_notification: boolean;
  workingOnOtherApps: boolean;
  activeBankAcount: boolean;
  isVerified: boolean;
  isOnline: boolean;
  today_earnings: number;
}

interface ProfileProps {
  astrologer: Astrologer;
}

const Profile: React.FC<ProfileProps> = ({ astrologer }) => {
  const {
    astrologerName,
    phoneNumber,
    alternateNumber,
    gender,
    email,
    profileImage,
    chat_price,
    call_price,
    video_call_price,
    experience,
    about,
    city,
    state,
    country,
    zipCode,
    free_min,
    rating,
    skill,
    remedies,
    mainExpertise,
    youtubeLink,
    short_bio,
    long_bio,
    follower_count,
    aadharNumber,
    dateOfBirth,
    address,
    commission_video_call_price,
    normal_video_call_price,
    commission_normal_video_call_price,
    consultation_price,
    commission_call_price,
    commission_chat_price,
    expertise,
    account_holder_name,
    account_number,
    account_type,
    account_name,
    IFSC_code,
    panCard,
    chat_status,
    call_status,
    video_call_status,
    wallet_balance,
  } = astrologer;

  return (
    <div className="p-5 bg-white mb-5 shadow-lg rounded-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Image */}
        <div className="lg:col-span-4">
          <img
              src={img_url + profileImage}
            alt={astrologerName}
            className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-sm"
          />
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{astrologerName}</h1>
            <p className="text-gray-600 mt-1">{short_bio}</p>
          </div>

          <hr className="border-gray-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p><strong>Experience:</strong> {experience} years</p>
            <p><strong>Location:</strong> {city}, {state}, {country} - {zipCode}</p>
            <p><strong>Phone:</strong> {phoneNumber} | Alt: {alternateNumber || ''}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Gender:</strong> {gender}</p>
            <p><strong>Date of Birth:</strong> {moment(dateOfBirth).format('DD MMM YYYY')}</p>
            <p><strong>Rating:</strong> {rating?.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">About</h2>
        <p className="text-gray-700 leading-relaxed text-justify">
          {long_bio || about || 'No description available.'}
        </p>
      </div>

      {/* Pricing */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Consultation Price</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p><strong>Chat Price:</strong> {IndianRupee(chat_price)}</p>
            <p><strong>Call Price:</strong> {IndianRupee(call_price)}</p>
            <p><strong>Video Call Price:</strong> {IndianRupee(normal_video_call_price)}</p>
            <p><strong>Live Price:</strong> {IndianRupee(video_call_price)}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Chat Platform Charge:</strong> {IndianRupee(commission_chat_price)}</p>
            <p><strong>Call Platform Charge:</strong> {IndianRupee(commission_call_price)}</p>
            <p><strong>Video Call Platform Charge:</strong> {IndianRupee(commission_normal_video_call_price)}</p>
            <p><strong>Live Platform Charge:</strong> {IndianRupee(commission_video_call_price)}</p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {skill?.map((item, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full border border-gray-300 text-sm font-medium"
            >
              {item?.skill?.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Remedies */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Remedies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {remedies?.map((remedy, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <h4 className="font-semibold text-gray-800">{remedy?.title?.trim()}</h4>
              <p className="text-sm text-gray-600 mt-1">{remedy?.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Expertise */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Main Expertise</h3>
        <div className="flex flex-wrap gap-2">
          {mainExpertise?.map((exp, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-sm font-medium"
            >
              {exp?.mainExpertise?.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Bank Information */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bank Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p><strong>Account Holder:</strong> {account_holder_name || ''}</p>
            <p><strong>Account Number:</strong> {account_number || ''}</p>
            <p><strong>Account Type:</strong> <span className="capitalize">{account_type || ''}</span></p>
          </div>
          <div className="space-y-2">
            <p><strong>Bank Name:</strong> {account_name || ''}</p>
            <p><strong>IFSC Code:</strong> {IFSC_code || ''}</p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8">
        <hr className="border-gray-200 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p><strong>Pan Card:</strong> {panCard || ''}</p>
            <p><strong>Aadhar Card:</strong> {aadharNumber || ''}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Chat Status:</strong> {chat_status || ''}</p>
            <p><strong>Call Status:</strong> {call_status || ''}</p>
            <p><strong>Video Call Status:</strong> {video_call_status || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;