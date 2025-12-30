'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

interface Props {
  inputFieldDetail: any;
  handleInputChange: (e: any) => void;
}

const DetailsTab: React.FC<Props> = ({ inputFieldDetail, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-800">Puja Details & Information</h2>
      </div>

      <div className="space-y-6">
        {/* Description */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={inputFieldDetail.description}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[120px]"
            placeholder="Enter detailed puja description..."
            required
          />
        </div> */}

        {/* Overview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overview
          </label>
          <textarea
            name="overview"
            value={inputFieldDetail.overview}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
            placeholder="Brief overview of the puja..."
          />
        </div>

        {/* Why Perform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Why Perform This Puja
          </label>
          <textarea
            name="whyPerform"
            value={inputFieldDetail.whyPerform}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
            placeholder="Explain the significance and benefits..."
          />
        </div>

        {/* Puja Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puja Details
          </label>
          <textarea
            name="pujaDetails"
            value={inputFieldDetail.pujaDetails}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[150px]"
            placeholder="Step-by-step puja procedure, rituals, and materials required..."
          />
        </div>

        {/* Preparation Required */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preparation Required
          </label>
          <textarea
            name="preparationRequired"
            value={inputFieldDetail.preparationRequired}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
            placeholder="What devotees need to prepare beforehand..."
          />
        </div> */}

        {/* Cancellation Policy */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Policy
          </label>
          <textarea
            name="cancellationPolicy"
            value={inputFieldDetail.cancellationPolicy}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
            placeholder="Cancellation terms and conditions..."
          />
        </div> */}
      </div>
    </div>
  );
};

export default DetailsTab;