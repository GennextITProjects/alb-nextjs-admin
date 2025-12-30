'use client';

import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface Props {
  image: any;
  imagePreview: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryImages: File[];
  galleryPreviews: string[];
  handleGalleryImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (index: number) => void;
  editId?: string | null;
}

const ImagesTab: React.FC<Props> = ({
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
  console.log(imagePreview, "dbhbwkgdvwytdfwydtfwdtf")

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <ImageIcon className="w-5 h-5 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-800">Images & Gallery</h2>
      </div>

      {/* Main Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Main Puja Image {!editId && <span className="text-red-500">*</span>}
          <span className="text-xs text-gray-500 ml-2">(This will be displayed as the primary image)</span>
        </label>
        
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

    </div>
  );
};

export default ImagesTab;