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
                        : `${process.env.NEXT_PUBLIC_IMAGE_URL3}${imagePreview}`
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Gallery Images
          <span className="text-xs text-gray-500 ml-2">(Additional images for gallery)</span>
        </label>

        {/* Upload Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Add Gallery Images</span>
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            onChange={handleGalleryImages}
            className="hidden"
            accept="image/*"
            multiple
          />
          <p className="text-xs text-gray-500 mt-2">
            You can select multiple images at once
          </p>
        </div>

        {/* Gallery Preview */}
        {galleryPreviews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-700">
                Gallery Preview ({galleryPreviews.length} images)
              </h4>
              <span className="text-sm text-gray-500">
                Click on × to remove
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <Image
                      src={preview}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500 truncate">
                      {galleryImages[index]?.name || `Image ${index + 1}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesTab;