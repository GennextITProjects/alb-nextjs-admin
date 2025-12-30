'use client';

import React, { useRef } from 'react';
import { Eye, Info, Upload, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface Props {
  inputFieldDetail: any;
  handleInputChange: (e: any) => void;
  categories: any[];
  image: any;
  imagePreview: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryImages: File[];
  galleryPreviews: string[];
  handleGalleryImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (index: number) => void;
  editId?: string | null;
}

const BasicInfoTab: React.FC<Props> = ({ 
  inputFieldDetail, 
  handleInputChange, 
  categories,
  image,
  imagePreview,
  handleImageUpload,
  galleryImages,
  galleryPreviews,
  handleGalleryImages,
  removeGalleryImage,
  editId 
}) => {
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-8">

        <div className="space-y-8">
     
        {/* Main Image */}
        <div>          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Upload Area */}
            <div className="flex-1">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-red-500 ${
                  imagePreview ? 'border-gray-300' : 'border-gray-300 bg-gray-50'
                }`}
                onClick={() => mainImageInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={imagePreview.startsWith('blob:') || imagePreview.startsWith('data:') 
                          ? imagePreview 
                          : `${imagePreview}`
                        }
                        alt="Main preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Upload Main Image</p>
                    <p className="text-sm text-gray-500">Drag & drop or click to browse</p>
                    <p className="text-xs text-gray-400 mt-2">Recommended: 800x600px, JPG/PNG</p>
                  </>
                )}
              </div>
              <input
                ref={mainImageInputRef}
                type="file"
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
                required={!editId}
              />
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        {galleryPreviews.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gallery Images ({galleryPreviews.length})
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={preview.startsWith('blob:') || preview.startsWith('data:') 
                        ? preview 
                        : `${preview}`
                      }
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 my-8"></div>

      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Puja Information</h2>
          <span className="ml-auto text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
            Required Fields
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={inputFieldDetail.categoryId}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Puja Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puja Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pujaName"
              value={inputFieldDetail.pujaName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="Enter puja name"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={inputFieldDetail.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="Enter price"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Admin Commission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Commission (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="adminCommission"
              value={inputFieldDetail.adminCommission}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="Enter commission percentage"
              required
              min="0"
              max="100"
              step="0.01"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <input
              type="text"
              name="duration"
              value={inputFieldDetail.duration}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="e.g., 2-3 hours"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default BasicInfoTab;