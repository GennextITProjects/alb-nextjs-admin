'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  benefits: string[]; // Array of strings
  setBenefits: (data: string[]) => void;
}

const BenefitsTab: React.FC<Props> = ({
  benefits,
  setBenefits
}) => {
  const handleAdd = () => {
    if (benefits.length < 10) {
      setBenefits([...benefits, '']);
    }
  };
  const handleUpdate = (index: number, value: string) => {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  };

  const handleRemove = (index: number) => {
    if (benefits.length > 1) {
      const filtered = benefits.filter((_, i) => i !== index);
      setBenefits(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Benefits of This Puja</h2>
          <p className="text-sm text-gray-600 mt-1">
            List the key benefits devotees will get from performing this puja (Max 10)
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={benefits.length >= 10}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Benefit ({benefits.length}/10)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Benefit {index + 1} *
                  </label>
                  <span className="text-xs text-gray-500">{index + 1}/{benefits.length}</span>
                </div>
                <textarea
                  value={benefit}
                  onChange={(e) => handleUpdate(index, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
                  placeholder="Example: Brings peace of mind, Improves health, Brings prosperity, etc."
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={benefits.length <= 1}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-7"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenefitsTab;