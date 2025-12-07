'use client';

import { useState } from 'react';

interface Vendor {
  _id: string;
  businessName: string;
  description: string;
  services: string[];
}

interface VendorFilterProps {
  categories: string[];
  vendors: Vendor[];
  selectedCategory: string;
  selectedVendor: string;
  priceRange: [number, number];
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onVendorChange: (vendorId: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export default function VendorFilter({
  categories,
  vendors,
  selectedCategory,
  selectedVendor,
  priceRange,
  searchQuery,
  onCategoryChange,
  onVendorChange,
  onPriceRangeChange,
  onSearchChange,
  onClearFilters,
  activeFiltersCount
}: VendorFilterProps) {
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    category: true,
    vendor: true,
    price: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      food: '🍽️',
      beverages: '🥤',
      essentials: '🛒',
      amenities: '🏊',
      concierge: '🎩',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[#383a3c]">Filters</h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-[#f06123] hover:text-orange-600 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('search')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="font-medium text-gray-700">Search</h4>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.search ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.search && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
            />
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('category')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="font-medium text-gray-700">Categories</h4>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.category ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.category && (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => onCategoryChange('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 ${
                !selectedCategory
                  ? 'bg-[#f06123] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center ${
                  selectedCategory === category
                    ? 'bg-[#f06123] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{getCategoryIcon(category)}</span>
                {formatCategory(category)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vendors */}
      {vendors.length > 0 && (
        <div className="mb-6 border-b border-gray-200 pb-6">
          <button
            onClick={() => toggleSection('vendor')}
            className="flex justify-between items-center w-full text-left"
          >
            <h4 className="font-medium text-gray-700">Vendors</h4>
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.vendor ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.vendor && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => onVendorChange('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 ${
                  !selectedVendor
                    ? 'bg-[#f06123] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Vendors
              </button>
              {vendors.map((vendor) => (
                <button
                  key={vendor._id}
                  onClick={() => onVendorChange(vendor._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 ${
                    selectedVendor === vendor._id
                      ? 'bg-[#f06123] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">🏪</span>
                    <span className="truncate">{vendor.businessName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="font-medium text-gray-700">Price Range</h4>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.price && (
          <div className="mt-3 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">₦{priceRange[0].toLocaleString()}</span>
              <span className="text-gray-600">₦{priceRange[1].toLocaleString()}</span>
            </div>
            
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={priceRange[0]}
                onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={priceRange[0]}
                  onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={priceRange[1]}
                  onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Count */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {activeFiltersCount > 0 
            ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied` 
            : 'No filters applied'
          }
        </p>
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #f06123;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #f06123;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .slider::-webkit-slider-track {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
        }
        .slider::-moz-range-track {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          border: none;
        }
      `}</style>
    </div>
  );
}
