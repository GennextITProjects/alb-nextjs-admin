'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AstrologerData {
  astrologerName: string;
  tagLine?: string;
  profileImage: string;
  multipleImages?: string[];
  experience: number;
  rating?: number;
  consultation : string;
  language?: string[];
  skill?: { skill: string }[];
  about?: string;
  mainExpertise?: { mainExpertise: string }[];
  remedies?: { description: string }[];
  long_bio?: string;
  multipleVideos?: string[];
}

interface AstrologerProfileProps {
  astrologerData: AstrologerData;
}

const AstrologerProfile: React.FC<AstrologerProfileProps> = ({ astrologerData }) => {
  const [isReadMore, setIsReadMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showReadMoreButton, setShowReadMoreButton] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);

  const web_urls = process.env.NEXT_PUBLIC_PREFIX_IMAGE_URL || "https://api.acharyalavbhushan.com/";

  // Check if bio content exceeds line clamp
  useEffect(() => {
    if (bioRef.current && astrologerData.long_bio) {
      const lineHeight = parseInt(getComputedStyle(bioRef.current).lineHeight);
      const maxHeight = lineHeight * 4; // 4 lines for desktop, 6 for mobile
      setShowReadMoreButton(bioRef.current.scrollHeight > maxHeight);
    }
  }, [astrologerData.long_bio]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Mobile Layout - Optimized Header */}
      <div className="block lg:hidden">
        {/* Profile Card with Image + Name/Tagline */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-5">
          <div className="flex gap-4 items-start">
            {/* Profile Image - Left Side */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-28">
                <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200 shadow-md">
                  <img
                    src={`${web_urls}${astrologerData.profileImage}`}
                    alt={astrologerData.astrologerName}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setShowFullImage(true)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // target.src = '/default-profile.jpg';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Name and Tagline - Right Side */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h1 className="text-xl font-bold text-[#980d0d] leading-tight">
                  {astrologerData.astrologerName}
                </h1>
                {/* Green Verification Tick */}
                <svg 
                  className="w-5 h-5 text-green-600 flex-shrink-0" 
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
              
              {astrologerData.tagLine && (
                <p className='text-gray-600 text-sm leading-snug mb-2'>{astrologerData.tagLine}</p>
              )}
              
              {/* Quick Stats - Compact */}
              <div className="flex gap-3 flex-wrap text-xs mt-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#980d0d]">{astrologerData.experience}+</span>
                  <span className="text-gray-600">Years</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#980d0d]">{astrologerData.consultation || 2500}+</span>
                  <span className="text-gray-600">Clients</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 w-full flex-shrink-0">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                  </svg>
                  <span className="text-xs truncate">
                    {astrologerData.language?.slice(0, 2).join(', ') || 'English'}
                  </span>
                  {astrologerData && astrologerData.language && astrologerData.language?.length > 2 && (
                    <span className="text-gray-400 text-xs">+{astrologerData.language.length - 2}</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Image Gallery - Below Profile Card */}
          {astrologerData.multipleImages && astrologerData.multipleImages.length > 0 && (
            <div className="hidden lg:flex gap-2 justify-start mt-4 overflow-x-auto pb-1">
              {astrologerData.multipleImages.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(`${web_urls}${image}`)}
                  className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-300 hover:border-[#980d0d] transition-all hover:scale-105"
                >
                  <img
                    src={`${web_urls}${image}`}
                    alt={`Gallery ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // target.src = '/default-profile.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Stats Grid - Full Width */}
          <div className="bg-gray-50 rounded-xl hidden border border-gray-200 p-3 mt-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-[#980d0d]">{astrologerData.experience}+</p>
                <p className="text-xs text-gray-600">Experience</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#980d0d]">{astrologerData.consultation || 2500}+</p>
                <p className="text-xs text-gray-600">Clients</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#980d0d]">{(astrologerData.rating || 4).toFixed(1)}★</p>
                <p className="text-xs text-gray-600">Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* About Me Preview (4 lines) */}
        {astrologerData.about && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-[#980d0d] rounded-full"></div>
              <h3 className='font-semibold text-base text-[#980d0d]'>About Me</h3>
            </div>
            <p className={`text-gray-700 leading-relaxed text-sm ${!showMobileDetails ? 'line-clamp-1' : ''}`}>
              {astrologerData.about}
            </p>
            
            {!showMobileDetails && (
              <button
                onClick={() => setShowMobileDetails(true)}
                className="flex items-center gap-1 text-[#980d0d] text-sm font-semibold mt-3 hover:text-red-700 transition-colors"
              >
                Read More <ChevronDown size={16} />
              </button>
            )}
          </div>
        )}

        {/* Expandable Details Section - Mobile Only */}
        {showMobileDetails && (
          <div className="space-y-5 animate-fadeIn">
            
            {astrologerData.multipleImages && astrologerData.multipleImages.length > 0 && (
              <div className="flex gap-2 lg:hidden justify-start mt-4 overflow-x-auto pb-1">
                {astrologerData.multipleImages.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(`${web_urls}${image}`)}
                    className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-300 hover:border-[#980d0d] transition-all hover:scale-105"
                  >
                    <img
                      src={`${web_urls}${image}`}
                      alt={`Gallery ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // target.src = '/default-profile.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Languages - Now shown in expanded section */}
            {astrologerData.language && astrologerData.language.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#980d0d] rounded-full"></div>
                  <h3 className='font-semibold text-base text-[#980d0d]'>Languages</h3>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {astrologerData.language.map((lang, index) => (
                    <span
                      key={index}
                      className="bg-white px-3 py-1.5 rounded-full text-sm text-gray-700 border border-orange-300 font-medium shadow-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {astrologerData.skill && astrologerData.skill.length > 0 && (
              <div>
                <h3 className='font-semibold text-base text-[#980d0d] mb-3'>Skills & Specializations</h3>
                <div className='flex flex-wrap gap-2'>
                  {astrologerData.skill.map((skillItem, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 hover:bg-orange-200 transition-colors px-3 py-2 rounded-full text-sm text-orange-800 border border-orange-200 font-medium"
                    >
                      {skillItem.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise */}
            {astrologerData.mainExpertise && astrologerData.mainExpertise.length > 0 && (
              <div>
                <h3 className="font-semibold text-base text-[#980d0d] mb-3">Main Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {astrologerData.mainExpertise.map((item, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-full text-sm text-gray-800 border border-gray-300 font-medium"
                    >
                      {item.mainExpertise}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Remedies */}
            {astrologerData.remedies && astrologerData.remedies.length > 0 && (
              <div>
                <h3 className="font-semibold text-base text-[#980d0d] mb-3">Remedies Offered</h3>
                <ul className="space-y-2">
                  {astrologerData.remedies.map((remedy, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                      <span className="text-[#980d0d] mt-1">•</span>
                      <span className="leading-relaxed">{remedy.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Long Bio - Mobile */}
            {astrologerData.long_bio && astrologerData.long_bio.trim() !== '<p><br></p>' && astrologerData.long_bio.trim() !== '' && (
              <div>
                <h3 className='font-semibold text-base text-[#980d0d] mb-3'>Detailed Biography</h3>
                <div className="text-gray-700 leading-relaxed">
                  <div
                    ref={bioRef}
                    className={`text-sm leading-relaxed ${!isReadMore ? 'line-clamp-6' : ''}`}
                    dangerouslySetInnerHTML={{ __html: astrologerData.long_bio }}
                  />
                  {showReadMoreButton && (
                    <button
                      onClick={() => setIsReadMore(!isReadMore)}
                      className="flex items-center gap-1 text-[#980d0d] text-sm font-semibold mt-3 hover:text-red-700 transition-colors"
                    >
                      {isReadMore ? (
                        <>Show Less <ChevronUp size={16} /></>
                      ) : (
                        <>Read Full Biography <ChevronDown size={16} /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Videos */}
            {astrologerData.multipleVideos && astrologerData.multipleVideos.length > 0 && (
              <div>
                <h3 className='font-semibold text-base text-[#980d0d] mb-3'>Introduction Videos</h3>
                <div className="space-y-3">
                  {astrologerData.multipleVideos.slice(0, 2).map((video, index) => (
                    <video
                      key={index}
                      controls
                      className="w-full rounded-xl object-cover border border-gray-200"
                    >
                      <source src={`${web_urls}${video}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ))}
                </div>
              </div>
            )}

            {/* Collapse Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setShowMobileDetails(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[#980d0d] text-sm font-semibold flex items-center gap-1 hover:text-red-700 transition-colors"
              >
                <ChevronUp size={18} /> Show Less
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Left Side - Image */}
          <div className='flex-shrink-0'>
            <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative w-44 h-44 mb-2">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
                  <img
                    src={`${web_urls}${astrologerData.profileImage}`}
                    alt={astrologerData.astrologerName}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setShowFullImage(true)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // target.src = '/default-profile.jpg';
                    }}
                  />
                </div>
              </div>

              {astrologerData.multipleImages && astrologerData.multipleImages.length > 0 && (
                <div className="flex gap-2 justify-center flex-wrap max-w-[280px] mx-auto">
                  {astrologerData.multipleImages.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(`${web_urls}${image}`)}
                      className="w-14 h-14 rounded-xl overflow-hidden border border-gray-300 hover:border-[#980d0d] transition-all hover:scale-105"
                    >
                      <img
                        alt={`Gallery ${index + 1}`}
                        loading="lazy"
                        src={`${web_urls}${image}`}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // target.src = '/default-profile.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="w-full max-w-[280px] md:max-w-[300px] bg-gray-50 rounded-xl border border-gray-200 p-4 mt-2">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-[#980d0d]">{astrologerData.experience}+</p>
                    <p className="text-xs text-gray-600">Years</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#980d0d]">{astrologerData.consultation || 2500}+</p>
                    <p className="text-xs text-gray-600">Clients</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#980d0d]">{(astrologerData.rating || 4).toFixed(1)}★</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Desktop Content */}
          <div className='flex-1 space-y-4 min-w-0'>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#980d0d]">
                  {astrologerData.astrologerName}
                </h1>
                {/* Green Verification Tick */}
                <svg 
                  className="w-6 h-6 lg:w-7 lg:h-7 text-green-600 flex-shrink-0" 
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
              {astrologerData.tagLine && (
                <p className='text-gray-600 text-base'>{astrologerData.tagLine}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="rounded-lg">
                <p className='font-semibold text-base text-[#980d0d] mb-1'>Experience</p>
                <p className='text-gray-700 text-lg font-medium'>{astrologerData.experience} years</p>
              </div>

              <div className="rounded-lg">
                <p className='font-semibold text-base text-[#980d0d] mb-1'>Languages</p>
                <p className='text-gray-700 text-lg font-medium'>
                  {astrologerData&&astrologerData.language&&astrologerData.language?.length > 0
                    ? astrologerData.language.join(', ')
                    : "Hindi, English"}
                </p>
              </div>
            </div>

            {astrologerData.skill && astrologerData.skill.length > 0 && (
              <div className='hidden lg:block'>
                <h3 className='font-semibold text-sm text-[#980d0d] mb-3'>Skills</h3>
                <div className='flex flex-wrap gap-2'>
                  {astrologerData.skill.map((skillItem, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-xs hover:bg-orange-200 transition-colors px-3 py-1.5 rounded-full text-orange-800 border border-orange-200"
                    >
                      {skillItem.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop - All Other Sections */}
        <div className="space-y-6 mt-6">
          {astrologerData.about && (
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-[#980d0d] rounded-full"></div>
                <h3 className='font-semibold text-lg text-[#980d0d]'>About Me</h3>
              </div>
              <p className='text-gray-700 leading-relaxed text-justify'>{astrologerData.about}</p>
            </div>
          )}

          {astrologerData.mainExpertise && astrologerData.mainExpertise.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-[#980d0d] mb-2">Expertise</h3>
              <div className="flex flex-wrap items-center gap-2">
                {astrologerData.mainExpertise.map((item, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-full text-sm text-gray-800 border border-gray-300"
                  >
                    {item.mainExpertise}
                  </span>
                ))}
              </div>
            </div>
          )}

          {astrologerData.remedies && astrologerData.remedies.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-[#980d0d] mb-2">Remedies</h3>
              <ul className="list-disc list-inside space-y-1.5 text-gray-700 text-sm">
                {astrologerData.remedies.map((remedy, index) => (
                  <li key={index} className="leading-snug">
                    {remedy.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Long Bio - Desktop */}
          {astrologerData.long_bio && astrologerData.long_bio.trim() !== '<p><br></p>' && astrologerData.long_bio.trim() !== '' && (
            <div>
              <h3 className='font-semibold text-lg text-[#980d0d] mb-3'>Detailed Biography</h3>
              <div className="text-gray-700 leading-relaxed">
                <div
                  ref={bioRef}
                  className={`text-base leading-relaxed text-justify ${
                    isReadMore ? '' : 'line-clamp-4'
                  } transition-all duration-500`}
                  dangerouslySetInnerHTML={{
                    __html: astrologerData.long_bio
                  }}
                />

                {showReadMoreButton && (
                  <button
                    onClick={() => setIsReadMore(!isReadMore)}
                    className="flex items-center gap-1 text-[#980d0d] text-sm font-medium mt-2 hover:text-red-700 transition-colors"
                  >
                    {isReadMore ? (
                      <>Show less <Minimize2 size={14} /></>
                    ) : (
                      <>Read more <Maximize2 size={14} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {astrologerData.multipleVideos && astrologerData.multipleVideos.length > 0 && (
            <div>
              <h3 className='font-semibold text-lg text-[#980d0d] mb-3'>Introduction Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {astrologerData.multipleVideos.slice(0, 2).map((video, index) => (
                  <video
                    key={index}
                    controls
                    className="w-full rounded-lg object-cover border border-gray-200"
                    poster="/video-placeholder.jpg"
                  >
                    <source src={`${web_urls}${video}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setShowFullImage(false)}
        >
          <img
            src={`${web_urls}${astrologerData.profileImage}`}
            alt="Full Size"
            className="max-w-[90%] max-h-[85%] rounded-xl shadow-2xl border border-gray-300"
          />
        </div>
      )}

      {/* Gallery Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AstrologerProfile;