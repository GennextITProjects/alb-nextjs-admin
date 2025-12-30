'use client';

import React from 'react';
import { Target, Plus, Trash2, Heart, Brain, Zap, Sun, Moon, Eye } from 'lucide-react';

const iconOptions = [
  { value: 'Target', label: 'Target', icon: '🎯' },
  { value: 'Heart', label: 'Heart', icon: '❤️' },
  { value: 'Brain', label: 'Brain', icon: '🧠' },
  { value: 'Zap', label: 'Zap', icon: '⚡' },
  { value: 'Sun', label: 'Sun', icon: '☀️' },
  { value: 'Moon', label: 'Moon', icon: '🌙' },
  { value: 'Eye', label: 'Eye', icon: '👁️' },
  { value: 'Star', label: 'Star', icon: '⭐' },
  { value: 'CheckCircle', label: 'Check', icon: '✓' },
  { value: 'TrendingUp', label: 'Trending Up', icon: '📈' },
];

interface Props {
  whyYouShould: any[];
  setWhyYouShould: (data: any[]) => void;
  addItem: any;
  updateItem: any;
  removeItem: any;
}

const WhyPerformTab: React.FC<Props> = ({
  whyYouShould,
  setWhyYouShould,
  addItem,
  updateItem,
  removeItem
}) => {
  const getIconDisplay = (iconValue: string) => {
    const icon = iconOptions.find(i => i.value === iconValue);
    return icon ? icon.icon : '🎯';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Why You Should Perform This Puja</h2>
          <p className="text-sm text-gray-600 mt-1">
            List compelling reasons why devotees should perform this puja
          </p>
        </div>
        <button
          type="button"
          onClick={() => addItem(whyYouShould, setWhyYouShould, { 
            title: '', 
            description: '', 
            icon: 'Target' 
          })}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          Add Reason
        </button>
      </div>

      <div className="space-y-6">
        {whyYouShould.map((reason) => (
          <div key={reason._id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <span className="text-lg">{getIconDisplay(reason.icon)}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Reason</h3>
                  <p className="text-xs text-gray-500">Why this puja is important</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(whyYouShould, setWhyYouShould, reason._id)}
                disabled={whyYouShould.length <= 1}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={reason.title}
                  onChange={(e) => updateItem(whyYouShould, setWhyYouShould, reason._id, 'title', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="e.g., For Spiritual Growth"
                  required
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Icon
                </label>
                <select
                  value={reason.icon}
                  onChange={(e) => updateItem(whyYouShould, setWhyYouShould, reason._id, 'icon', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.icon} {icon.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Explanation *
                </label>
                <textarea
                  value={reason.description}
                  onChange={(e) => updateItem(whyYouShould, setWhyYouShould, reason._id, 'description', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
                  placeholder="Explain in detail why this reason is important..."
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

export default WhyPerformTab;