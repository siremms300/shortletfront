'use client';

import { useState } from 'react';

interface SearchFiltersProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  propertyTypes: string[];
  allAmenities: string[];
  amenitiesLookup?: {[key: string]: string};
  activeFiltersCount: number;
  onClearFilters: () => void;
  locations?: string[];
  selectedLocation?: string;
  onLocationChange?: (location: string) => void;
  minPrice?: number;
  maxPrice?: number;
  isMobile?: boolean;
}

export default function SearchFilters({
  priceRange,
  onPriceRangeChange,
  selectedTypes,
  onTypesChange,
  selectedAmenities,
  onAmenitiesChange,
  propertyTypes,
  allAmenities,
  amenitiesLookup = {},
  activeFiltersCount,
  onClearFilters,
  locations = [],
  selectedLocation = '',
  onLocationChange,
  minPrice = 0,
  maxPrice = 500,
  isMobile = false
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    price: true,
    type: true,
    amenities: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handler functions that work for both mobile and desktop
  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onAmenitiesChange(selectedAmenities.filter(id => id !== amenityId));
    } else {
      onAmenitiesChange([...selectedAmenities, amenityId]);
    }
  };

  const handleMinPriceChange = (value: number) => {
    const newMin = Math.min(value, priceRange[1] - 10);
    onPriceRangeChange([newMin, priceRange[1]]);
  };

  const handleMaxPriceChange = (value: number) => {
    const newMax = Math.max(value, priceRange[0] + 10);
    onPriceRangeChange([priceRange[0], newMax]);
  };

  const handleLocationChange = (location: string) => {
    if (onLocationChange) {
      onLocationChange(location);
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 sticky top-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
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

      {/* Location Filter */}
      {locations.length > 0 && onLocationChange && (
        <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
          <button
            onClick={() => toggleSection('location')}
            className="flex justify-between items-center w-full text-left"
          >
            <h4 className="font-medium text-gray-700">Location</h4>
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.location && (
            <div className="mt-3">
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="font-medium text-gray-700">Price Range (per night)</h4>
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
            {/* Price Display */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Min: ${priceRange[0]}</span>
              <span className="text-gray-600">Max: ${priceRange[1]}</span>
            </div>
            
            {/* Min Price Slider */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Minimum Price</label>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step="10"
                value={priceRange[0]}
                onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Max Price Slider */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Maximum Price</label>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step="10"
                value={priceRange[1]}
                onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                <input
                  type="number"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[0]}
                  onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                <input
                  type="number"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Types */}
      <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
        <button
          onClick={() => toggleSection('type')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="font-medium text-gray-700">Property Type</h4>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.type ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.type && (
          <div className="mt-3 space-y-2">
            {propertyTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
                />
                <span className="ml-2 text-gray-700">{formatType(type)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => toggleSection('amenities')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="font-medium text-gray-700">Amenities</h4>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.amenities ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.amenities && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {allAmenities.map((amenityId, index) => (
              <label key={`${amenityId}-${index}`} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenityId)}
                  onChange={() => handleAmenityToggle(amenityId)}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
                />
                <span className="ml-2 text-gray-700 text-sm">
                  {amenitiesLookup[amenityId] || amenityId}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
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



















































// 'use client';

// import { useState } from 'react';

// interface SearchFiltersProps {
//   priceRange: [number, number];
//   onPriceRangeChange: (range: [number, number]) => void;
//   selectedTypes: string[];
//   onTypesChange: (types: string[]) => void;
//   selectedAmenities: string[];
//   onAmenitiesChange: (amenities: string[]) => void;
//   propertyTypes: string[];
//   allAmenities: string[];
//   activeFiltersCount: number;
//   onClearFilters: () => void;
//   locations?: string[];
//   selectedLocation?: string;
//   onLocationChange?: (location: string) => void;
//   minPrice?: number;
//   maxPrice?: number;
//   isMobile?: boolean;
// }

// export default function SearchFilters({
//   priceRange,
//   onPriceRangeChange,
//   selectedTypes,
//   onTypesChange,
//   selectedAmenities,
//   onAmenitiesChange,
//   propertyTypes,
//   allAmenities,
//   activeFiltersCount,
//   onClearFilters,
//   locations = [],
//   selectedLocation = '',
//   onLocationChange,
//   minPrice = 0,
//   maxPrice = 500,
//   isMobile = false
// }: SearchFiltersProps) {
//   const [expandedSections, setExpandedSections] = useState({
//     location: true,
//     price: true,
//     type: true,
//     amenities: true
//   });

//   const toggleSection = (section: keyof typeof expandedSections) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   };

//   // Handler functions that work for both mobile and desktop
//   const handleTypeToggle = (type: string) => {
//     if (selectedTypes.includes(type)) {
//       onTypesChange(selectedTypes.filter(t => t !== type));
//     } else {
//       onTypesChange([...selectedTypes, type]);
//     }
//   };

//   const handleAmenityToggle = (amenity: string) => {
//     if (selectedAmenities.includes(amenity)) {
//       onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
//     } else {
//       onAmenitiesChange([...selectedAmenities, amenity]);
//     }
//   };

//   const handleMinPriceChange = (value: number) => {
//     const newMin = Math.min(value, priceRange[1] - 10);
//     onPriceRangeChange([newMin, priceRange[1]]);
//   };

//   const handleMaxPriceChange = (value: number) => {
//     const newMax = Math.max(value, priceRange[0] + 10);
//     onPriceRangeChange([priceRange[0], newMax]);
//   };

//   const handleLocationChange = (location: string) => {
//     if (onLocationChange) {
//       onLocationChange(location);
//     }
//   };

//   const formatType = (type: string) => {
//     return type.charAt(0).toUpperCase() + type.slice(1);
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 sticky top-4">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4 md:mb-6">
//         <h3 className="text-lg font-semibold text-[#383a3c]">Filters</h3>
//         {activeFiltersCount > 0 && (
//           <button
//             onClick={onClearFilters}
//             className="text-sm text-[#f06123] hover:text-orange-600 font-medium"
//           >
//             Clear all
//           </button>
//         )}
//       </div>

//       {/* Location Filter */}
//       {locations.length > 0 && onLocationChange && (
//         <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
//           <button
//             onClick={() => toggleSection('location')}
//             className="flex justify-between items-center w-full text-left"
//           >
//             <h4 className="font-medium text-gray-700">Location</h4>
//             <svg 
//               className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} 
//               fill="none" 
//               stroke="currentColor" 
//               viewBox="0 0 24 24"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//             </svg>
//           </button>
//           {expandedSections.location && (
//             <div className="mt-3">
//               <select
//                 value={selectedLocation}
//                 onChange={(e) => handleLocationChange(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
//               >
//                 <option value="">All Locations</option>
//                 {locations.map((location) => (
//                   <option key={location} value={location}>
//                     {location}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Price Range */}
//       <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
//         <button
//           onClick={() => toggleSection('price')}
//           className="flex justify-between items-center w-full text-left"
//         >
//           <h4 className="font-medium text-gray-700">Price Range (per night)</h4>
//           <svg 
//             className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} 
//             fill="none" 
//             stroke="currentColor" 
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>
//         {expandedSections.price && (
//           <div className="mt-3 space-y-4">
//             {/* Price Display */}
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-600">Min: ${priceRange[0]}</span>
//               <span className="text-gray-600">Max: ${priceRange[1]}</span>
//             </div>
            
//             {/* Min Price Slider */}
//             <div className="space-y-2">
//               <label className="text-xs text-gray-500">Minimum Price</label>
//               <input
//                 type="range"
//                 min={minPrice}
//                 max={maxPrice}
//                 step="10"
//                 value={priceRange[0]}
//                 onChange={(e) => handleMinPriceChange(Number(e.target.value))}
//                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//             </div>

//             {/* Max Price Slider */}
//             <div className="space-y-2">
//               <label className="text-xs text-gray-500">Maximum Price</label>
//               <input
//                 type="range"
//                 min={minPrice}
//                 max={maxPrice}
//                 step="10"
//                 value={priceRange[1]}
//                 onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
//                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//             </div>

//             {/* Price Inputs */}
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1">Min Price</label>
//                 <input
//                   type="number"
//                   min={minPrice}
//                   max={maxPrice}
//                   value={priceRange[0]}
//                   onChange={(e) => handleMinPriceChange(Number(e.target.value))}
//                   className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1">Max Price</label>
//                 <input
//                   type="number"
//                   min={minPrice}
//                   max={maxPrice}
//                   value={priceRange[1]}
//                   onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
//                   className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Property Types */}
//       <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
//         <button
//           onClick={() => toggleSection('type')}
//           className="flex justify-between items-center w-full text-left"
//         >
//           <h4 className="font-medium text-gray-700">Property Type</h4>
//           <svg 
//             className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.type ? 'rotate-180' : ''}`} 
//             fill="none" 
//             stroke="currentColor" 
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>
//         {expandedSections.type && (
//           <div className="mt-3 space-y-2">
//             {propertyTypes.map((type) => (
//               <label key={type} className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={selectedTypes.includes(type)}
//                   onChange={() => handleTypeToggle(type)}
//                   className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
//                 />
//                 <span className="ml-2 text-gray-700">{formatType(type)}</span>
//               </label>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Amenities */}
//       <div className="mb-4 md:mb-6">
//         <button
//           onClick={() => toggleSection('amenities')}
//           className="flex justify-between items-center w-full text-left"
//         >
//           <h4 className="font-medium text-gray-700">Amenities</h4>
//           <svg 
//             className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.amenities ? 'rotate-180' : ''}`} 
//             fill="none" 
//             stroke="currentColor" 
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>
//         {expandedSections.amenities && (
//           <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
//             {allAmenities.map((amenity) => (
//               <label key={amenity} className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={selectedAmenities.includes(amenity)}
//                   onChange={() => handleAmenityToggle(amenity)}
//                   className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
//                 />
//                 <span className="ml-2 text-gray-700 text-sm">{amenity}</span>
//               </label>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Results Count */}
//       <div className="pt-4 border-t border-gray-200">
//         <p className="text-sm text-gray-600">
//           {activeFiltersCount > 0 
//             ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied` 
//             : 'No filters applied'
//           }
//         </p>
//       </div>

//       {/* Custom Slider Styles */}
//       <style jsx>{`
//         .slider::-webkit-slider-thumb {
//           appearance: none;
//           height: 18px;
//           width: 18px;
//           border-radius: 50%;
//           background: #f06123;
//           cursor: pointer;
//           border: 2px solid white;
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
//         }
//         .slider::-moz-range-thumb {
//           height: 18px;
//           width: 18px;
//           border-radius: 50%;
//           background: #f06123;
//           cursor: pointer;
//           border: 2px solid white;
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
//         }
//         .slider::-webkit-slider-track {
//           width: 100%;
//           height: 6px;
//           background: #e5e7eb;
//           border-radius: 3px;
//         }
//         .slider::-moz-range-track {
//           width: 100%;
//           height: 6px;
//           background: #e5e7eb;
//           border-radius: 3px;
//           border: none;
//         }
//       `}</style>
//     </div>
//   );
// }





















































// // 'use client';

// // import { useState } from 'react';

// // interface SearchFiltersProps {
// //   priceRange: [number, number];
// //   onPriceRangeChange: (range: [number, number]) => void;
// //   selectedTypes: string[];
// //   onTypesChange: (types: string[]) => void;
// //   selectedAmenities: string[];
// //   onAmenitiesChange: (amenities: string[]) => void;
// //   propertyTypes: string[];
// //   allAmenities: string[];
// //   activeFiltersCount: number;
// //   onClearFilters: () => void;
// //   locations?: string[];
// //   selectedLocation?: string;
// //   onLocationChange?: (location: string) => void;
// //   minPrice?: number;
// //   maxPrice?: number;
// // }

// // export default function SearchFilters({
// //   priceRange,
// //   onPriceRangeChange,
// //   selectedTypes,
// //   onTypesChange,
// //   selectedAmenities,
// //   onAmenitiesChange,
// //   propertyTypes,
// //   allAmenities,
// //   activeFiltersCount,
// //   onClearFilters,
// //   locations = [],
// //   selectedLocation = '',
// //   onLocationChange,
// //   minPrice = 0,
// //   maxPrice = 500
// // }: SearchFiltersProps) {
// //   const [expandedSections, setExpandedSections] = useState({
// //     location: true,
// //     price: true,
// //     type: true,
// //     amenities: true
// //   });

// //   const toggleSection = (section: keyof typeof expandedSections) => {
// //     setExpandedSections(prev => ({
// //       ...prev,
// //       [section]: !prev[section]
// //     }));
// //   };

// //   const handleTypeToggle = (type: string) => {
// //     if (selectedTypes.includes(type)) {
// //       onTypesChange(selectedTypes.filter(t => t !== type));
// //     } else {
// //       onTypesChange([...selectedTypes, type]);
// //     }
// //   };

// //   const handleAmenityToggle = (amenity: string) => {
// //     if (selectedAmenities.includes(amenity)) {
// //       onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
// //     } else {
// //       onAmenitiesChange([...selectedAmenities, amenity]);
// //     }
// //   };

// //   const handleMinPriceChange = (value: number) => {
// //     const newMin = Math.min(value, priceRange[1] - 10);
// //     onPriceRangeChange([newMin, priceRange[1]]);
// //   };

// //   const handleMaxPriceChange = (value: number) => {
// //     const newMax = Math.max(value, priceRange[0] + 10);
// //     onPriceRangeChange([priceRange[0], newMax]);
// //   };

// //   const formatType = (type: string) => {
// //     return type.charAt(0).toUpperCase() + type.slice(1);
// //   };

// //   return (
// //     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 sticky top-4">
// //       {/* Header */}
// //       <div className="flex justify-between items-center mb-4 md:mb-6">
// //         <h3 className="text-lg font-semibold text-[#383a3c]">Filters</h3>
// //         {activeFiltersCount > 0 && (
// //           <button
// //             onClick={onClearFilters}
// //             className="text-sm text-[#f06123] hover:text-orange-600 font-medium"
// //           >
// //             Clear all
// //           </button>
// //         )}
// //       </div>

// //       {/* Location Filter */}
// //       {locations.length > 0 && onLocationChange && (
// //         <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
// //           <button
// //             onClick={() => toggleSection('location')}
// //             className="flex justify-between items-center w-full text-left"
// //           >
// //             <h4 className="font-medium text-gray-700">Location</h4>
// //             <svg 
// //               className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} 
// //               fill="none" 
// //               stroke="currentColor" 
// //               viewBox="0 0 24 24"
// //             >
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //             </svg>
// //           </button>
// //           {expandedSections.location && (
// //             <div className="mt-3">
// //               <select
// //                 value={selectedLocation}
// //                 onChange={(e) => onLocationChange(e.target.value)}
// //                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// //               >
// //                 <option value="">All Locations</option>
// //                 {locations.map((location) => (
// //                   <option key={location} value={location}>
// //                     {location}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>
// //           )}
// //         </div>
// //       )}

// //       {/* Price Range */}
// //       <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
// //         <button
// //           onClick={() => toggleSection('price')}
// //           className="flex justify-between items-center w-full text-left"
// //         >
// //           <h4 className="font-medium text-gray-700">Price Range (per night)</h4>
// //           <svg 
// //             className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} 
// //             fill="none" 
// //             stroke="currentColor" 
// //             viewBox="0 0 24 24"
// //           >
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //           </svg>
// //         </button>
// //         {expandedSections.price && (
// //           <div className="mt-3 space-y-4">
// //             {/* Price Display */}
// //             <div className="flex justify-between text-sm">
// //               <span className="text-gray-600">Min: ${priceRange[0]}</span>
// //               <span className="text-gray-600">Max: ${priceRange[1]}</span>
// //             </div>
            
// //             {/* Min Price Slider */}
// //             <div className="space-y-2">
// //               <label className="text-xs text-gray-500">Minimum Price</label>
// //               <input
// //                 type="range"
// //                 min={minPrice}
// //                 max={maxPrice}
// //                 step="10"
// //                 value={priceRange[0]}
// //                 onChange={(e) => handleMinPriceChange(Number(e.target.value))}
// //                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
// //               />
// //             </div>

// //             {/* Max Price Slider */}
// //             <div className="space-y-2">
// //               <label className="text-xs text-gray-500">Maximum Price</label>
// //               <input
// //                 type="range"
// //                 min={minPrice}
// //                 max={maxPrice}
// //                 step="10"
// //                 value={priceRange[1]}
// //                 onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
// //                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
// //               />
// //             </div>

// //             {/* Price Inputs */}
// //             <div className="grid grid-cols-2 gap-3">
// //               <div>
// //                 <label className="block text-xs text-gray-500 mb-1">Min Price</label>
// //                 <input
// //                   type="number"
// //                   min={minPrice}
// //                   max={maxPrice}
// //                   value={priceRange[0]}
// //                   onChange={(e) => handleMinPriceChange(Number(e.target.value))}
// //                   className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //                 />
// //               </div>
// //               <div>
// //                 <label className="block text-xs text-gray-500 mb-1">Max Price</label>
// //                 <input
// //                   type="number"
// //                   min={minPrice}
// //                   max={maxPrice}
// //                   value={priceRange[1]}
// //                   onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
// //                   className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>

// //       {/* Property Types */}
// //       <div className="mb-4 md:mb-6 border-b border-gray-200 pb-4 md:pb-6">
// //         <button
// //           onClick={() => toggleSection('type')}
// //           className="flex justify-between items-center w-full text-left"
// //         >
// //           <h4 className="font-medium text-gray-700">Property Type</h4>
// //           <svg 
// //             className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.type ? 'rotate-180' : ''}`} 
// //             fill="none" 
// //             stroke="currentColor" 
// //             viewBox="0 0 24 24"
// //           >
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //           </svg>
// //         </button>
// //         {expandedSections.type && (
// //           <div className="mt-3 space-y-2">
// //             {propertyTypes.map((type) => (
// //               <label key={type} className="flex items-center">
// //                 <input
// //                   type="checkbox"
// //                   checked={selectedTypes.includes(type)}
// //                   onChange={() => handleTypeToggle(type)}
// //                   className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
// //                 />
// //                 <span className="ml-2 text-gray-700">{formatType(type)}</span>
// //               </label>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {/* Amenities */}
// //       <div className="mb-4 md:mb-6">
// //         <button
// //           onClick={() => toggleSection('amenities')}
// //           className="flex justify-between items-center w-full text-left"
// //         >
// //           <h4 className="font-medium text-gray-700">Amenities</h4>
// //           <svg 
// //             className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.amenities ? 'rotate-180' : ''}`} 
// //             fill="none" 
// //             stroke="currentColor" 
// //             viewBox="0 0 24 24"
// //           >
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //           </svg>
// //         </button>
// //         {expandedSections.amenities && (
// //           <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
// //             {allAmenities.map((amenity) => (
// //               <label key={amenity} className="flex items-center">
// //                 <input
// //                   type="checkbox"
// //                   checked={selectedAmenities.includes(amenity)}
// //                   onChange={() => handleAmenityToggle(amenity)}
// //                   className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
// //                 />
// //                 <span className="ml-2 text-gray-700 text-sm">{amenity}</span>
// //               </label>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {/* Results Count */}
// //       <div className="pt-4 border-t border-gray-200">
// //         <p className="text-sm text-gray-600">
// //           {activeFiltersCount > 0 
// //             ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied` 
// //             : 'No filters applied'
// //           }
// //         </p>
// //       </div>

// //       {/* Custom Slider Styles */}
// //       <style jsx>{`
// //         .slider::-webkit-slider-thumb {
// //           appearance: none;
// //           height: 18px;
// //           width: 18px;
// //           border-radius: 50%;
// //           background: #f06123;
// //           cursor: pointer;
// //           border: 2px solid white;
// //           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
// //         }
// //         .slider::-moz-range-thumb {
// //           height: 18px;
// //           width: 18px;
// //           border-radius: 50%;
// //           background: #f06123;
// //           cursor: pointer;
// //           border: 2px solid white;
// //           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
// //         }
// //         .slider::-webkit-slider-track {
// //           width: 100%;
// //           height: 6px;
// //           background: #e5e7eb;
// //           border-radius: 3px;
// //         }
// //         .slider::-moz-range-track {
// //           width: 100%;
// //           height: 6px;
// //           background: #e5e7eb;
// //           border-radius: 3px;
// //           border: none;
// //         }
// //       `}</style>
// //     </div>
// //   );
// // }


























































// // 'use client';

// // interface SearchFiltersProps {
// //   priceRange: [number, number];
// //   onPriceRangeChange: (range: [number, number]) => void;
// //   selectedTypes: string[];
// //   onTypesChange: (types: string[]) => void;
// //   selectedAmenities: string[];
// //   onAmenitiesChange: (amenities: string[]) => void;
// //   propertyTypes: string[];
// //   allAmenities: string[];
// //   activeFiltersCount: number;
// //   onClearFilters: () => void;
// //   locations?: string[];
// //   selectedLocation?: string;
// //   onLocationChange?: (location: string) => void;
// //   minPrice?: number;
// //   maxPrice?: number;
// // }

// // export default function SearchFilters({
// //   priceRange,
// //   onPriceRangeChange,
// //   selectedTypes,
// //   onTypesChange,
// //   selectedAmenities,
// //   onAmenitiesChange,
// //   propertyTypes,
// //   allAmenities,
// //   activeFiltersCount,
// //   onClearFilters,
// //   locations = [],
// //   selectedLocation = '',
// //   onLocationChange,
// //   minPrice = 0,
// //   maxPrice = 500
// // }: SearchFiltersProps) {
// //   const handleTypeToggle = (type: string) => {
// //     if (selectedTypes.includes(type)) {
// //       onTypesChange(selectedTypes.filter(t => t !== type));
// //     } else {
// //       onTypesChange([...selectedTypes, type]);
// //     }
// //   };

// //   const handleAmenityToggle = (amenity: string) => {
// //     if (selectedAmenities.includes(amenity)) {
// //       onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
// //     } else {
// //       onAmenitiesChange([...selectedAmenities, amenity]);
// //     }
// //   };

// //   const handleMinPriceChange = (value: number) => {
// //     const newMin = Math.min(value, priceRange[1] - 10);
// //     onPriceRangeChange([newMin, priceRange[1]]);
// //   };

// //   const handleMaxPriceChange = (value: number) => {
// //     const newMax = Math.max(value, priceRange[0] + 10);
// //     onPriceRangeChange([priceRange[0], newMax]);
// //   };

// //   const formatType = (type: string) => {
// //     return type.charAt(0).toUpperCase() + type.slice(1);
// //   };

// //   return (
// //     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
// //       {/* Header */}
// //       <div className="flex justify-between items-center mb-6">
// //         <h3 className="text-lg font-semibold text-[#383a3c]">Filters</h3>
// //         {activeFiltersCount > 0 && (
// //           <button
// //             onClick={onClearFilters}
// //             className="text-sm text-[#f06123] hover:text-orange-600 font-medium"
// //           >
// //             Clear all
// //           </button>
// //         )}
// //       </div>

// //       {/* Location Filter */}
// //       {locations.length > 0 && onLocationChange && (
// //         <div className="mb-6">
// //           <h4 className="font-medium text-gray-700 mb-3">Location</h4>
// //           <select
// //             value={selectedLocation}
// //             onChange={(e) => onLocationChange(e.target.value)}
// //             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// //           >
// //             <option value="">All Locations</option>
// //             {locations.map((location) => (
// //               <option key={location} value={location}>
// //                 {location}
// //               </option>
// //             ))}
// //           </select>
// //         </div>
// //       )}

// //       {/* Price Range */}
// //       <div className="mb-6">
// //         <h4 className="font-medium text-gray-700 mb-3">Price Range (per night)</h4>
// //         <div className="space-y-4">
// //           {/* Price Display */}
// //           <div className="flex justify-between text-sm">
// //             <span className="text-gray-600">Min: ${priceRange[0]}</span>
// //             <span className="text-gray-600">Max: ${priceRange[1]}</span>
// //           </div>
          
// //           {/* Min Price Slider */}
// //           <div className="space-y-2">
// //             <label className="text-xs text-gray-500">Minimum Price</label>
// //             <input
// //               type="range"
// //               min={minPrice}
// //               max={maxPrice}
// //               step="10"
// //               value={priceRange[0]}
// //               onChange={(e) => handleMinPriceChange(Number(e.target.value))}
// //               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
// //             />
// //           </div>

// //           {/* Max Price Slider */}
// //           <div className="space-y-2">
// //             <label className="text-xs text-gray-500">Maximum Price</label>
// //             <input
// //               type="range"
// //               min={minPrice}
// //               max={maxPrice}
// //               step="10"
// //               value={priceRange[1]}
// //               onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
// //               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
// //             />
// //           </div>

// //           {/* Price Inputs */}
// //           <div className="grid grid-cols-2 gap-3">
// //             <div>
// //               <label className="block text-xs text-gray-500 mb-1">Min Price</label>
// //               <input
// //                 type="number"
// //                 min={minPrice}
// //                 max={maxPrice}
// //                 value={priceRange[0]}
// //                 onChange={(e) => handleMinPriceChange(Number(e.target.value))}
// //                 className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //               />
// //             </div>
// //             <div>
// //               <label className="block text-xs text-gray-500 mb-1">Max Price</label>
// //               <input
// //                 type="number"
// //                 min={minPrice}
// //                 max={maxPrice}
// //                 value={priceRange[1]}
// //                 onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
// //                 className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //               />
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Property Types */}
// //       <div className="mb-6">
// //         <h4 className="font-medium text-gray-700 mb-3">Property Type</h4>
// //         <div className="space-y-2">
// //           {propertyTypes.map((type) => (
// //             <label key={type} className="flex items-center">
// //               <input
// //                 type="checkbox"
// //                 checked={selectedTypes.includes(type)}
// //                 onChange={() => handleTypeToggle(type)}
// //                 className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
// //               />
// //               <span className="ml-2 text-gray-700">{formatType(type)}</span>
// //             </label>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Amenities */}
// //       <div className="mb-6">
// //         <h4 className="font-medium text-gray-700 mb-3">Amenities</h4>
// //         <div className="space-y-2 max-h-48 overflow-y-auto">
// //           {allAmenities.map((amenity) => (
// //             <label key={amenity} className="flex items-center">
// //               <input
// //                 type="checkbox"
// //                 checked={selectedAmenities.includes(amenity)}
// //                 onChange={() => handleAmenityToggle(amenity)}
// //                 className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
// //               />
// //               <span className="ml-2 text-gray-700 text-sm">{amenity}</span>
// //             </label>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Results Count */}
// //       <div className="pt-4 border-t border-gray-200">
// //         <p className="text-sm text-gray-600">
// //           {activeFiltersCount > 0 
// //             ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied` 
// //             : 'No filters applied'
// //           }
// //         </p>
// //       </div>

// //       {/* Custom Slider Styles */}
// //       <style jsx>{`
// //         .slider::-webkit-slider-thumb {
// //           appearance: none;
// //           height: 18px;
// //           width: 18px;
// //           border-radius: 50%;
// //           background: #f06123;
// //           cursor: pointer;
// //           border: 2px solid white;
// //           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
// //         }
// //         .slider::-moz-range-thumb {
// //           height: 18px;
// //           width: 18px;
// //           border-radius: 50%;
// //           background: #f06123;
// //           cursor: pointer;
// //           border: 2px solid white;
// //           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
// //         }
// //         .slider::-webkit-slider-track {
// //           width: 100%;
// //           height: 6px;
// //           background: #e5e7eb;
// //           border-radius: 3px;
// //         }
// //         .slider::-moz-range-track {
// //           width: 100%;
// //           height: 6px;
// //           background: #e5e7eb;
// //           border-radius: 3px;
// //           border: none;
// //         }
// //       `}</style>
// //     </div>
// //   );
// // }
















































// // 'use client';

// // interface SearchFiltersProps {
// //   priceRange: [number, number];
// //   onPriceRangeChange: (range: [number, number]) => void;
// //   selectedTypes: string[];
// //   onTypesChange: (types: string[]) => void;
// //   selectedAmenities: string[];
// //   onAmenitiesChange: (amenities: string[]) => void;
// //   propertyTypes: string[];
// //   allAmenities: string[];
// //   activeFiltersCount: number;
// //   onClearFilters: () => void;
// // }

// // export default function SearchFilters({
// //   priceRange,
// //   onPriceRangeChange,
// //   selectedTypes,
// //   onTypesChange,
// //   selectedAmenities,
// //   onAmenitiesChange,
// //   propertyTypes,
// //   allAmenities,
// //   activeFiltersCount,
// //   onClearFilters
// // }: SearchFiltersProps) {
// //   const handleTypeToggle = (type: string) => {
// //     if (selectedTypes.includes(type)) {
// //       onTypesChange(selectedTypes.filter(t => t !== type));
// //     } else {
// //       onTypesChange([...selectedTypes, type]);
// //     }
// //   };

// //   const handleAmenityToggle = (amenity: string) => {
// //     if (selectedAmenities.includes(amenity)) {
// //       onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
// //     } else {
// //       onAmenitiesChange([...selectedAmenities, amenity]);
// //     }
// //   };

// //   const formatType = (type: string) => {
// //     return type.charAt(0).toUpperCase() + type.slice(1);
// //   };

// //   return (
// //     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
// //       {/* Header */}
// //       <div className="flex justify-between items-center mb-6">
// //         <h3 className="text-lg font-semibold text-[#383a3c]">Filters</h3>
// //         {activeFiltersCount > 0 && (
// //           <button
// //             onClick={onClearFilters}
// //             className="text-sm text-[#f06123] hover:text-orange-600 font-medium"
// //           >
// //             Clear all
// //           </button>
// //         )}
// //       </div>

// //       {/* Price Range */}
// //       <div className="mb-6">
// //         <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
// //         <div className="space-y-3">
// //           <div className="flex justify-between text-sm text-gray-600">
// //             <span>${priceRange[0]}</span>
// //             <span>${priceRange[1]}</span>
// //           </div>
// //           <input
// //             type="range"
// //             min="0"
// //             max="500"
// //             step="10"
// //             value={priceRange[0]}
// //             onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
// //             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
// //           />
// //           <input
// //             type="range"
// //             min="0"
// //             max="500"
// //             step="10"
// //             value={priceRange[1]}
// //             onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
// //             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
// //           />
// //           <style jsx>{`
// //             .slider::-webkit-slider-thumb {
// //               appearance: none;
// //               height: 20px;
// //               width: 20px;
// //               border-radius: 50%;
// //               background: #f06123;
// //               cursor: pointer;
// //             }
// //             .slider::-moz-range-thumb {
// //               height: 20px;
// //               width: 20px;
// //               border-radius: 50%;
// //               background: #f06123;
// //               cursor: pointer;
// //               border: none;
// //             }
// //           `}</style>
// //         </div>
// //       </div>

// //       {/* Property Types */}
// //       <div className="mb-6">
// //         <h4 className="font-medium text-gray-700 mb-3">Property Type</h4>
// //         <div className="space-y-2">
// //           {propertyTypes.map((type) => (
// //             <label key={type} className="flex items-center">
// //               <input
// //                 type="checkbox"
// //                 checked={selectedTypes.includes(type)}
// //                 onChange={() => handleTypeToggle(type)}
// //                 className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
// //               />
// //               <span className="ml-2 text-gray-700">{formatType(type)}</span>
// //             </label>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Amenities */}
// //       <div className="mb-6">
// //         <h4 className="font-medium text-gray-700 mb-3">Amenities</h4>
// //         <div className="space-y-2 max-h-48 overflow-y-auto">
// //           {allAmenities.map((amenity) => (
// //             <label key={amenity} className="flex items-center">
// //               <input
// //                 type="checkbox"
// //                 checked={selectedAmenities.includes(amenity)}
// //                 onChange={() => handleAmenityToggle(amenity)}
// //                 className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
// //               />
// //               <span className="ml-2 text-gray-700">{amenity}</span>
// //             </label>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Results Count */}
// //       <div className="pt-4 border-t border-gray-200">
// //         <p className="text-sm text-gray-600">
// //           {activeFiltersCount > 0 ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied` : 'No filters applied'}
// //         </p>
// //       </div>
// //     </div>
// //   );
// // }

