'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { YYYYMMDD } from '@/utils/common-function';
import Swal from 'sweetalert2';

interface CustomerDetail {
  customerName: string;
  phoneNumber: string;
  gender: string;
  wallet: string;
  dateOfBirth: string;
  timeOfBirth: string;
}

const AddCustomerContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const customerId = searchParams.get('id');
  const isEditMode = !!customerId;

  const [detail, setDetail] = useState<CustomerDetail>({
    customerName: '',
    phoneNumber: '',
    gender: '',
    wallet: '',
    dateOfBirth: '',
    timeOfBirth: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [image, setImage] = useState<{ file: string; bytes: File | null }>({
    file: '',
    bytes: null,
  });
  const [loading, setLoading] = useState(false);

  /* ---------- Extract time from datetime string ---------- */
  const extractTime = (datetime: string): string => {
    if (!datetime) return '';
    
    try {
      // If datetime contains 'T', extract time part (ISO format)
      if (datetime.includes('T')) {
        const timePart = datetime.split('T')[1];
        // Remove seconds and timezone if present
        const timeOnly = timePart.split('.')[0]; // Remove milliseconds
        return timeOnly.substring(0, 5); // Returns HH:MM format
      }
      
      // If it's already in time format (HH:MM or HH:MM:SS)
      if (datetime.includes(':')) {
        return datetime.substring(0, 5);
      }
    } catch (e) {
      console.error('Error extracting time:', e);
    }
    
    return '';
  };

  /* ---------- Extract date from datetime string ---------- */
  const extractDate = (datetime: string): string => {
    if (!datetime) return '';
    
    try {
      // If datetime contains 'T', extract date part (ISO format)
      if (datetime.includes('T')) {
        return datetime.split('T')[0];
      }
      
      // If already in date format (YYYY-MM-DD)
      if (datetime.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datetime;
      }
      
      // Try to parse and format using YYYYMMDD function
      return YYYYMMDD(datetime);
    } catch (e) {
      console.error('Error extracting date:', e);
      return '';
    }
  };

  /* ---------- Fill form from URL params ---------- */
  useEffect(() => {
    if (isEditMode) {
      const customerName = searchParams.get('customerName') || '';
      const phoneNumber = searchParams.get('phoneNumber') || '';
      const gender = searchParams.get('gender') || '';
      const wallet_balance = searchParams.get('wallet_balance') || '0';
      const dateOfBirth = searchParams.get('dateOfBirth') || '';
      const timeOfBirth = searchParams.get('timeOfBirth') || '';
      const imageUrl = searchParams.get('image') || '';

      setDetail({
        customerName,
        phoneNumber,
        gender,
        wallet: wallet_balance,
        dateOfBirth: extractDate(dateOfBirth),
        timeOfBirth: extractTime(timeOfBirth),
      });

      if (imageUrl) {
        setImage({ file: imageUrl, bytes: null });
      }
    }
  }, [searchParams, isEditMode]);

  /* ---------- Image handling ---------- */
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ file: URL.createObjectURL(file), bytes: file });
    }
    setError('image', undefined);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImage({ file: URL.createObjectURL(file), bytes: file });
    }
    setError('image', undefined);
  };

  const setError = (field: string, msg: string | undefined) => {
    setErrors((prev: any) => ({ ...prev, [field]: msg }));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetail((prev) => ({ ...prev, [name]: value }));
    setError(name, undefined);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetail((prev) => ({ ...prev, [name]: value }));
    setError(name, undefined);
  };

  /* ---------- Validation ---------- */
  const validate = () => {
    let ok = true;
    const namePat = /^[a-zA-Z\s]{1,56}$/;
    const phonePat = /^[0-9]{10}$/;
    const { customerName, phoneNumber, gender, dateOfBirth, timeOfBirth } = detail;

    if (!customerName) { 
      setError('customerName', 'Enter name'); 
      ok = false; 
    } else if (customerName.length > 30) { 
      setError('customerName', 'Name ≤30 chars'); 
      ok = false; 
    } else if (!namePat.test(customerName)) { 
      setError('customerName', 'Invalid name'); 
      ok = false; 
    }

    if (!phoneNumber) { 
      setError('phoneNumber', 'Enter phone'); 
      ok = false; 
    } else if (!phonePat.test(phoneNumber)) { 
      setError('phoneNumber', 'Invalid phone'); 
      ok = false; 
    }

    if (!gender) { 
      setError('gender', 'Select gender'); 
      ok = false; 
    }
    if (!dateOfBirth) { 
      setError('dateOfBirth', 'Select DOB'); 
      ok = false; 
    }
    if (!timeOfBirth) { 
      setError('timeOfBirth', 'Select TOB'); 
      ok = false; 
    }

    return ok;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    const fd = new FormData();
    if (isEditMode && customerId) fd.append('customerId', customerId);
    fd.append('customerName', detail.customerName);
    fd.append('phoneNumber', detail.phoneNumber);
    fd.append('gender', detail.gender);
    fd.append('wallet', detail.wallet || '0');
    fd.append('dateOfBirth', detail.dateOfBirth);
    fd.append('timeOfBirth', detail.timeOfBirth);
    if (image.bytes) fd.append('image', image.bytes);

    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/update-customer-data`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/customers/customer-signup`;

    try {
      const res = await fetch(url, { method: 'POST', body: fd });
      const json = await res.json();

      if (res.ok && json.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: isEditMode ? 'Customer updated successfully!' : 'Customer created successfully!',
          confirmButtonColor: '#3085d6',
        });
        
        router.push('/customer');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: json.message || 'Something went wrong',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to process request',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Get image source ---------- */
  const getImageSrc = () => {
    if (!image.file) return '';
    
    // If it's a blob URL (newly uploaded), return as is
    if (image.file.startsWith('blob:')) {
      return image.file;
    }
    
    // If it's an existing image from server
    return `${process.env.NEXT_PUBLIC_IMAGE_URL2}${image.file}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 sm:px-6 lg:px-5 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-xl font-bold text-white flex items-center gap-3">
                {/* <span className="text-3xl sm:text-4xl">{isEditMode ? '✏️' : '➕'}</span> */}
                {isEditMode ? 'Edit Customer' : 'Add New Customer'}
              </h1>
              <button
                onClick={() => router.push('/customer')}
                className="bg-white text-red-600 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              >
                Display
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-10">
            {/* Image Upload Section */}
            <div className="mb-8 lg:mb-10">
              <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                Customer Photo
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden hover:border-red-400 transition-all bg-gradient-to-br from-gray-50 to-white">
                {image.file ? (
                  // <label
                  //   onDragOver={(e) => e.preventDefault()}
                  //   onDrop={handleDrop}
                  //   htmlFor="upload-image"
                  //   className="block cursor-pointer group"
                  // >
                
                  // </label>
                      <div className="relative bg-white">
                      <img
                        src={getImageSrc()}
                        alt="Customer"
                        className="w-full h-96 object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        {/* <div className="opacity-0 group-hover:opacity-100 transition-all text-center px-4">
                          <p className="text-white font-bold text-lg mb-2">Change Photo</p>
                          <p className="text-white text-sm">Click or drop new image here</p>
                        </div> */}
                      </div>
                    </div>
                ) : (
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    htmlFor="upload-image"
                    className="flex flex-col items-center justify-center py-24 sm:py-28 lg:py-32 cursor-pointer hover:bg-gray-100 transition-all"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-5 shadow-lg">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-2">Choose Image</p>
                    <p className="text-base text-gray-600 mb-3">or drag and drop here</p>
                
                  </label>
                )}
                <input
                  id="upload-image"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImage}
                />
              </div>
              {errors.image && (
                <p className="text-red-600 text-sm mt-3 flex items-center bg-red-50 px-4 py-2 rounded-lg">
                  <span className="mr-2 text-lg">⚠️</span> {errors.image}
                </p>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Name */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 items-center gap-2">
                   Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={detail.customerName}
                  onChange={handleInput}
                  onFocus={() => setError('customerName', undefined)}
                  disabled={loading}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.customerName ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.customerName}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 items-center gap-2">
                 Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={detail.phoneNumber}
                  onChange={handleInput}
                  onFocus={() => setError('phoneNumber', undefined)}
                  disabled={loading}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter 10-digit phone"
                  maxLength={10}
                />
                {errors.phoneNumber && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 items-center gap-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={detail.gender}
                  onChange={handleSelect}
                  onFocus={() => setError('gender', undefined)}
                  disabled={loading}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    {errors.gender}
                  </p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 items-center gap-2">
                 Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={detail.dateOfBirth}
                  onChange={handleInput}
                  onFocus={() => setError('dateOfBirth', undefined)}
                  disabled={loading}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* TOB */}
              <div className="lg:col-span-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 items-center gap-2">
                  Time of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="timeOfBirth"
                  value={detail.timeOfBirth}
                  onChange={handleInput}
                  onFocus={() => setError('timeOfBirth', undefined)}
                  disabled={loading}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 transition-all ${
                    errors.timeOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.timeOfBirth && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.timeOfBirth}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-10 lg:mt-12 pt-8 border-t-2 border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-10 sm:px-12 py-4 rounded-xl text-white font-bold text-base sm:text-lg transition-all transform ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl hover:shadow-2xl hover:scale-105'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span>{isEditMode ? '✓ Update Customer' : '✓ Add Customer'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerContent;