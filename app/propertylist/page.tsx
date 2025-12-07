'use client';

import { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import SearchFilters from '@/components/SearchFilters';
import MapView from '@/components/MapView';
import { propertiesAPI, amenitiesAPI } from '@/lib/api'; // Add amenitiesAPI import

interface Amenity {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  price: number;
  images: Array<{
    url: string;
    isMain: boolean;
    order: number;
  }>;
  rating: number;
  totalBookings: number;
  type: string;
  specifications: {
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    squareFeet: number;
  };
  amenities: Amenity[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]); // All available amenities
  const [amenitiesLookup, setAmenitiesLookup] = useState<{[key: string]: string}>({});

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close filters when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && showFilters) {
        const sidebar = document.querySelector('.mobile-filters-sidebar');
        const filterButton = document.querySelector('.mobile-filter-button');
        
        if (sidebar && !sidebar.contains(event.target as Node) && 
            filterButton && !filterButton.contains(event.target as Node)) {
          closeFilters();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, showFilters]);

  // Prevent body scroll when filters are open
  useEffect(() => {
    if (isMobile && showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, showFilters]);

  const openFilters = () => {
    setShowFilters(true);
    setIsClosing(false);
  };

  const closeFilters = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowFilters(false);
      setIsClosing(false);
    }, 300);
  };

  // Extract unique values from properties for filters
  const propertyTypes = Array.from(new Set(properties.map(p => p.type)));
  const locations = Array.from(new Set(properties.map(p => p.location)));

  // Fetch all amenities and properties
  useEffect(() => {
    fetchAmenitiesAndProperties();
  }, []);

  const fetchAmenitiesAndProperties = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch amenities first
      const amenitiesResponse = await amenitiesAPI.getAmenities({ limit: 100 });
      const amenitiesData = amenitiesResponse.amenities || [];
      setAllAmenities(amenitiesData);

      // Create lookup for amenity names
      const lookup: {[key: string]: string} = {};
      amenitiesData.forEach(amenity => {
        lookup[amenity._id] = amenity.name;
      });
      setAmenitiesLookup(lookup);

      // Then fetch properties
      const propertiesResponse = await propertiesAPI.getProperties({ 
        limit: 50,
        status: 'active'
      });
      
      const propertiesArray = propertiesResponse.properties || propertiesResponse;
      setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      
      if (Array.isArray(propertiesArray) && propertiesArray.length > 0) {
        const prices = propertiesArray.map(p => p.price);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange([minPrice, maxPrice]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    if (properties.length === 0) return;

    setLoading(true);
    
    let filtered = properties.filter(property => {
      const matchesSearch = searchQuery === '' || 
                           property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = locationQuery === '' || 
                             property.location.toLowerCase().includes(locationQuery.toLowerCase());
      
      const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
      // Updated amenities matching to work with amenity objects
      const matchesAmenities = selectedAmenities.length === 0 || 
                              selectedAmenities.every(amenityId => 
                                property.amenities?.some(amenity => amenity._id === amenityId)
                              );
      
      return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesAmenities;
    });

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'bookings':
        filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    setFilteredProperties(filtered);
    setLoading(false);
  }, [searchQuery, locationQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setPriceRange([0, 500]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setSortBy('recommended');
    if (isMobile) {
      closeFilters();
    }
  };

  // Handler functions that automatically close mobile filters
  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    if (isMobile) {
      closeFilters();
    }
  };

  const handleTypesChange = (types: string[]) => {
    setSelectedTypes(types);
    if (isMobile) {
      closeFilters();
    }
  };

  const handleAmenitiesChange = (amenities: string[]) => {
    setSelectedAmenities(amenities);
    if (isMobile) {
      closeFilters();
    }
  };

  const handleLocationChange = (location: string) => {
    setLocationQuery(location);
    if (isMobile) {
      closeFilters();
    }
  };

  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    locationQuery ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
    selectedTypes.length,
    selectedAmenities.length
  ].reduce((a, b) => a + b, 0);

  const transformPropertyForCard = (property: Property) => ({
    id: property._id,
    title: property.title,
    location: property.location,
    price: property.price,
    image: property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg',
    rating: property.rating || 0,
    reviews: property.totalBookings || 0,
    bedrooms: property.specifications?.bedrooms,
    bathrooms: property.specifications?.bathrooms,
    maxGuests: property.specifications?.maxGuests,
    type: property.type
  });

  // Get amenity IDs for the filter component
  const amenityIds = allAmenities.map(amenity => amenity._id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
          <p className="text-lg md:text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
              <button
                onClick={fetchAmenitiesAndProperties}
                className="text-red-700 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Mobile Filter Button */}
        {isMobile && (
          <div className="mb-4">
            <button
              onClick={openFilters}
              className="mobile-filter-button w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="font-medium text-gray-700">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-[#f06123] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <svg 
                className="w-4 h-4 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Search and Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Inputs */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by property name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search by location..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* View Toggle and Sort */}
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 md:flex-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="bookings">Most Bookings</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Mobile Overlay */}
          {isMobile && (
            <>
              {/* Mobile Filter Overlay */}
              <div className={`
                fixed inset-0 z-50 transition-all duration-300 ease-in-out
                ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}
              `}>
                {/* Semi-transparent overlay */}
                <div 
                  className={`
                    absolute inset-0 bg-gray-600 transition-opacity duration-300
                    ${showFilters && !isClosing ? 'opacity-50' : 'opacity-0'}
                  `}
                  onClick={closeFilters}
                />
                
                {/* Sidebar */}
                <div 
                  className={`
                    mobile-filters-sidebar absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    ${showFilters && !isClosing ? 'translate-x-0' : 'translate-x-full'}
                  `}
                >
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex-shrink-0 border-b border-gray-200">
                      <div className="flex justify-between items-center p-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                          {activeFiltersCount > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={closeFilters}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Filters Content */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4">
                        <SearchFilters
                          priceRange={priceRange}
                          onPriceRangeChange={handlePriceRangeChange}
                          selectedTypes={selectedTypes}
                          onTypesChange={handleTypesChange}
                          selectedAmenities={selectedAmenities}
                          onAmenitiesChange={handleAmenitiesChange}
                          propertyTypes={propertyTypes}
                          allAmenities={amenityIds}
                          amenitiesLookup={amenitiesLookup}
                          activeFiltersCount={activeFiltersCount}
                          onClearFilters={clearFilters}
                          locations={locations}
                          selectedLocation={locationQuery}
                          onLocationChange={handleLocationChange}
                          isMobile={true}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
                      <button
                        onClick={closeFilters}
                        className="w-full bg-[#f06123] text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition duration-200 shadow-sm"
                      >
                        Show Results
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Desktop Filters */}
          {!isMobile && (
            <div className="lg:w-80">
              <SearchFilters
                priceRange={priceRange}
                onPriceRangeChange={handlePriceRangeChange}
                selectedTypes={selectedTypes}
                onTypesChange={setSelectedTypes}
                selectedAmenities={selectedAmenities}
                onAmenitiesChange={setSelectedAmenities}
                propertyTypes={propertyTypes}
                allAmenities={amenityIds}
                amenitiesLookup={amenitiesLookup}
                activeFiltersCount={activeFiltersCount}
                onClearFilters={clearFilters}
                locations={locations}
                selectedLocation={locationQuery}
                onLocationChange={setLocationQuery}
                isMobile={false}
              />
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-[#383a3c]">
                  {loading ? 'Loading...' : `${filteredProperties.length} Properties Found`}
                </h2>
                {activeFiltersCount > 0 && !loading && (
                  <p className="text-gray-600 text-sm mt-1">
                    {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
              </div>
            )}

            {/* Results */}
            {!loading && (
              <>
                {viewMode === 'grid' ? (
                  <>
                    {filteredProperties.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {filteredProperties.map((property) => (
                          <PropertyCard
                            key={property._id}
                            {...transformPropertyForCard(property)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-20 h-20 md:w-24 md:h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
                        <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
                        <button
                          onClick={clearFilters}
                          className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[500px] md:h-[600px]">
                    <MapView properties={filteredProperties} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





















































































// 'use client';

// import { useState, useEffect } from 'react';
// import PropertyCard from '@/components/PropertyCard';
// import SearchFilters from '@/components/SearchFilters';
// import MapView from '@/components/MapView';
// import { propertiesAPI } from '@/lib/api';

// interface Amenity {
//   _id: string;
//   name: string;
//   description?: string;
//   icon?: string;
//   category: string;
// }

// interface Property {
//   _id: string;
//   title: string;
//   location: string;
//   price: number;
//   images: Array<{
//     url: string;
//     isMain: boolean;
//     order: number;
//   }>;
//   rating: number;
//   totalBookings: number;
//   type: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//     squareFeet: number;
//   };
//   // Updated to use Amenity objects instead of strings
//   amenities: Amenity[];
//   coordinates?: {
//     lat: number;
//     lng: number;
//   };
// }

// export default function PropertiesPage() {
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [locationQuery, setLocationQuery] = useState('');
//   const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
//   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
//   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
//   const [sortBy, setSortBy] = useState('recommended');
//   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const [showFilters, setShowFilters] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [isClosing, setIsClosing] = useState(false);
//   const [amenitiesLookup, setAmenitiesLookup] = useState<{[key: string]: string}>({});

//   // Check if mobile on mount and resize
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 1024);
//     };
    
//     checkMobile();
//     window.addEventListener('resize', checkMobile);
    
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   // Close filters when clicking outside on mobile
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (isMobile && showFilters) {
//         const sidebar = document.querySelector('.mobile-filters-sidebar');
//         const filterButton = document.querySelector('.mobile-filter-button');
        
//         if (sidebar && !sidebar.contains(event.target as Node) && 
//             filterButton && !filterButton.contains(event.target as Node)) {
//           closeFilters();
//         }
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [isMobile, showFilters]);

//   // Prevent body scroll when filters are open
//   useEffect(() => {
//     if (isMobile && showFilters) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }

//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isMobile, showFilters]);

//   const openFilters = () => {
//     setShowFilters(true);
//     setIsClosing(false);
//   };

//   const closeFilters = () => {
//     setIsClosing(true);
//     setTimeout(() => {
//       setShowFilters(false);
//       setIsClosing(false);
//     }, 300);
//   };

//   // Extract unique values from properties for filters
//   const propertyTypes = Array.from(new Set(properties.map(p => p.type)));
  
//   // Extract unique amenity IDs and create lookup for names
//   const allAmenities = Array.from(new Set(
//     properties.flatMap(p => 
//       p.amenities?.map(amenity => amenity._id) || []
//     )
//   ));

//   const locations = Array.from(new Set(properties.map(p => p.location)));

//   // Create amenities lookup for displaying names
//   useEffect(() => {
//     if (properties.length > 0) {
//       const lookup: {[key: string]: string} = {};
//       properties.forEach(property => {
//         property.amenities?.forEach(amenity => {
//           lookup[amenity._id] = amenity.name;
//         });
//       });
//       setAmenitiesLookup(lookup);
//     }
//   }, [properties]);

//   // Fetch properties from backend
//   useEffect(() => {
//     fetchProperties();
//   }, []);

//   const fetchProperties = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       const response = await propertiesAPI.getProperties({ 
//         limit: 50,
//         status: 'active'
//       });
      
//       const propertiesArray = response.properties || response;
//       setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
//       setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      
//       if (Array.isArray(propertiesArray) && propertiesArray.length > 0) {
//         const prices = propertiesArray.map(p => p.price);
//         const minPrice = Math.floor(Math.min(...prices));
//         const maxPrice = Math.ceil(Math.max(...prices));
//         setPriceRange([minPrice, maxPrice]);
//       }
      
//     } catch (error) {
//       console.error('Error fetching properties:', error);
//       setError('Failed to load properties. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Apply filters
//   useEffect(() => {
//     if (properties.length === 0) return;

//     setLoading(true);
    
//     let filtered = properties.filter(property => {
//       const matchesSearch = searchQuery === '' || 
//                            property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
//       const matchesLocation = locationQuery === '' || 
//                              property.location.toLowerCase().includes(locationQuery.toLowerCase());
      
//       const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
//       const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
//       // Updated amenities matching to work with amenity objects
//       const matchesAmenities = selectedAmenities.length === 0 || 
//                               selectedAmenities.every(amenityId => 
//                                 property.amenities?.some(amenity => amenity._id === amenityId)
//                               );
      
//       return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesAmenities;
//     });

//     // Apply sorting
//     switch (sortBy) {
//       case 'price-low':
//         filtered.sort((a, b) => a.price - b.price);
//         break;
//       case 'price-high':
//         filtered.sort((a, b) => b.price - a.price);
//         break;
//       case 'rating':
//         filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//         break;
//       case 'bookings':
//         filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
//         break;
//       default:
//         filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
//         break;
//     }

//     setFilteredProperties(filtered);
//     setLoading(false);
//   }, [searchQuery, locationQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

//   const clearFilters = () => {
//     setSearchQuery('');
//     setLocationQuery('');
//     setPriceRange([0, 500]);
//     setSelectedTypes([]);
//     setSelectedAmenities([]);
//     setSortBy('recommended');
//     if (isMobile) {
//       closeFilters();
//     }
//   };

//   // Handler functions that automatically close mobile filters
//   const handlePriceRangeChange = (range: [number, number]) => {
//     setPriceRange(range);
//     if (isMobile) {
//       closeFilters();
//     }
//   };

//   const handleTypesChange = (types: string[]) => {
//     setSelectedTypes(types);
//     if (isMobile) {
//       closeFilters();
//     }
//   };

//   const handleAmenitiesChange = (amenities: string[]) => {
//     setSelectedAmenities(amenities);
//     if (isMobile) {
//       closeFilters();
//     }
//   };

//   const handleLocationChange = (location: string) => {
//     setLocationQuery(location);
//     if (isMobile) {
//       closeFilters();
//     }
//   };

//   const activeFiltersCount = [
//     searchQuery ? 1 : 0,
//     locationQuery ? 1 : 0,
//     priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
//     selectedTypes.length,
//     selectedAmenities.length
//   ].reduce((a, b) => a + b, 0);

//   const transformPropertyForCard = (property: Property) => ({
//     id: property._id,
//     title: property.title,
//     location: property.location,
//     price: property.price,
//     image: property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg',
//     rating: property.rating || 0,
//     reviews: property.totalBookings || 0,
//     bedrooms: property.specifications?.bedrooms,
//     bathrooms: property.specifications?.bathrooms,
//     maxGuests: property.specifications?.maxGuests,
//     type: property.type
//   });

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
//         <div className="container mx-auto px-4">
//           <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
//           <p className="text-lg md:text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-6 md:py-8">
//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center">
//                 <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <span className="text-red-700">{error}</span>
//               </div>
//               <button
//                 onClick={fetchProperties}
//                 className="text-red-700 hover:text-red-800 font-medium"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Mobile Filter Button */}
//         {isMobile && (
//           <div className="mb-4">
//             <button
//               onClick={openFilters}
//               className="mobile-filter-button w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
//             >
//               <div className="flex items-center">
//                 <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
//                 </svg>
//                 <span className="font-medium text-gray-700">Filters</span>
//                 {activeFiltersCount > 0 && (
//                   <span className="ml-2 bg-[#f06123] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                     {activeFiltersCount}
//                   </span>
//                 )}
//               </div>
//               <svg 
//                 className="w-4 h-4 text-gray-600" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//           </div>
//         )}

//         {/* Search and Controls Bar */}
//         <div className="flex flex-col lg:flex-row gap-4 mb-6">
//           {/* Search Inputs */}
//           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search by property name..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
//               />
//               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
//                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//               </div>
//             </div>
            
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search by location..."
//                 value={locationQuery}
//                 onChange={(e) => setLocationQuery(e.target.value)}
//                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
//               />
//               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
//                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                 </svg>
//               </div>
//             </div>
//           </div>

//           {/* View Toggle and Sort */}
//           <div className="flex gap-4">
//             <select
//               value={sortBy}
//               onChange={(e) => setSortBy(e.target.value)}
//               className="flex-1 md:flex-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base"
//             >
//               <option value="recommended">Recommended</option>
//               <option value="price-low">Price: Low to High</option>
//               <option value="price-high">Price: High to Low</option>
//               <option value="rating">Highest Rated</option>
//               <option value="bookings">Most Bookings</option>
//             </select>

//             <div className="flex border border-gray-300 rounded-lg overflow-hidden">
//               <button
//                 onClick={() => setViewMode('grid')}
//                 className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => setViewMode('map')}
//                 className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Filters Sidebar - Mobile Overlay */}
//           {isMobile && (
//             <>
//               {/* Mobile Filter Overlay */}
//               <div className={`
//                 fixed inset-0 z-50 transition-all duration-300 ease-in-out
//                 ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}
//               `}>
//                 {/* Semi-transparent overlay */}
//                 <div 
//                   className={`
//                     absolute inset-0 bg-gray-600 transition-opacity duration-300
//                     ${showFilters && !isClosing ? 'opacity-50' : 'opacity-0'}
//                   `}
//                   onClick={closeFilters}
//                 />
                
//                 {/* Sidebar */}
//                 <div 
//                   className={`
//                     mobile-filters-sidebar absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl
//                     transform transition-transform duration-300 ease-in-out
//                     ${showFilters && !isClosing ? 'translate-x-0' : 'translate-x-full'}
//                   `}
//                 >
//                   <div className="h-full flex flex-col">
//                     {/* Header */}
//                     <div className="flex-shrink-0 border-b border-gray-200">
//                       <div className="flex justify-between items-center p-4">
//                         <div>
//                           <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
//                           {activeFiltersCount > 0 && (
//                             <p className="text-sm text-gray-600 mt-1">
//                               {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
//                             </p>
//                           )}
//                         </div>
//                         <button
//                           onClick={closeFilters}
//                           className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
//                         >
//                           <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>

//                     {/* Filters Content */}
//                     <div className="flex-1 overflow-y-auto">
//                       <div className="p-4">
//                         <SearchFilters
//                           priceRange={priceRange}
//                           onPriceRangeChange={handlePriceRangeChange}
//                           selectedTypes={selectedTypes}
//                           onTypesChange={handleTypesChange}
//                           selectedAmenities={selectedAmenities}
//                           onAmenitiesChange={handleAmenitiesChange}
//                           propertyTypes={propertyTypes}
//                           allAmenities={allAmenities}
//                           amenitiesLookup={amenitiesLookup}
//                           activeFiltersCount={activeFiltersCount}
//                           onClearFilters={clearFilters}
//                           locations={locations}
//                           selectedLocation={locationQuery}
//                           onLocationChange={handleLocationChange}
//                           isMobile={true}
//                         />
//                       </div>
//                     </div>

//                     {/* Footer */}
//                     <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
//                       <button
//                         onClick={closeFilters}
//                         className="w-full bg-[#f06123] text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition duration-200 shadow-sm"
//                       >
//                         Show Results
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* Desktop Filters */}
//           {!isMobile && (
//             <div className="lg:w-80">
//               <SearchFilters
//                 priceRange={priceRange}
//                 onPriceRangeChange={handlePriceRangeChange}
//                 selectedTypes={selectedTypes}
//                 onTypesChange={setSelectedTypes}
//                 selectedAmenities={selectedAmenities}
//                 onAmenitiesChange={setSelectedAmenities}
//                 propertyTypes={propertyTypes}
//                 allAmenities={allAmenities}
//                 amenitiesLookup={amenitiesLookup}
//                 activeFiltersCount={activeFiltersCount}
//                 onClearFilters={clearFilters}
//                 locations={locations}
//                 selectedLocation={locationQuery}
//                 onLocationChange={setLocationQuery}
//                 isMobile={false}
//               />
//             </div>
//           )}

//           {/* Content Area */}
//           <div className="flex-1">
//             {/* Results Header */}
//             <div className="flex justify-between items-center mb-6">
//               <div>
//                 <h2 className="text-xl md:text-2xl font-semibold text-[#383a3c]">
//                   {loading ? 'Loading...' : `${filteredProperties.length} Properties Found`}
//                 </h2>
//                 {activeFiltersCount > 0 && !loading && (
//                   <p className="text-gray-600 text-sm mt-1">
//                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* Loading State */}
//             {loading && (
//               <div className="flex justify-center items-center py-12">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//               </div>
//             )}

//             {/* Results */}
//             {!loading && (
//               <>
//                 {viewMode === 'grid' ? (
//                   <>
//                     {filteredProperties.length > 0 ? (
//                       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
//                         {filteredProperties.map((property) => (
//                           <PropertyCard
//                             key={property._id}
//                             {...transformPropertyForCard(property)}
//                           />
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-12">
//                         <svg className="w-20 h-20 md:w-24 md:h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                         <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
//                         <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
//                         <button
//                           onClick={clearFilters}
//                           className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//                         >
//                           Clear All Filters
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   <div className="h-[500px] md:h-[600px]">
//                     <MapView properties={filteredProperties} />
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



























































// // 'use client';

// // import { useState, useEffect } from 'react';
// // import PropertyCard from '@/components/PropertyCard';
// // import SearchFilters from '@/components/SearchFilters';
// // import MapView from '@/components/MapView';
// // import { propertiesAPI } from '@/lib/api';

// // interface Property {
// //   _id: string;
// //   title: string;
// //   location: string;
// //   price: number;
// //   images: Array<{
// //     url: string;
// //     isMain: boolean;
// //     order: number;
// //   }>;
// //   rating: number;
// //   totalBookings: number;
// //   type: string;
// //   specifications: {
// //     bedrooms: number;
// //     bathrooms: number;
// //     maxGuests: number;
// //     squareFeet: number;
// //   };
// //   amenities: string[];
// //   coordinates?: {
// //     lat: number;
// //     lng: number;
// //   };
// // }

// // export default function PropertiesPage() {
// //   const [properties, setProperties] = useState<Property[]>([]);
// //   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [locationQuery, setLocationQuery] = useState('');
// //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
// //   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
// //   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
// //   const [sortBy, setSortBy] = useState('recommended');
// //   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string>('');
// //   const [showFilters, setShowFilters] = useState(false);
// //   const [isMobile, setIsMobile] = useState(false);
// //   const [isClosing, setIsClosing] = useState(false);

// //   // Check if mobile on mount and resize
// //   useEffect(() => {
// //     const checkMobile = () => {
// //       setIsMobile(window.innerWidth < 1024);
// //     };
    
// //     checkMobile();
// //     window.addEventListener('resize', checkMobile);
    
// //     return () => window.removeEventListener('resize', checkMobile);
// //   }, []);

// //   // Close filters when clicking outside on mobile
// //   useEffect(() => {
// //     const handleClickOutside = (event: MouseEvent) => {
// //       if (isMobile && showFilters) {
// //         const sidebar = document.querySelector('.mobile-filters-sidebar');
// //         const filterButton = document.querySelector('.mobile-filter-button');
        
// //         if (sidebar && !sidebar.contains(event.target as Node) && 
// //             filterButton && !filterButton.contains(event.target as Node)) {
// //           closeFilters();
// //         }
// //       }
// //     };

// //     document.addEventListener('mousedown', handleClickOutside);
// //     return () => document.removeEventListener('mousedown', handleClickOutside);
// //   }, [isMobile, showFilters]);

// //   // Prevent body scroll when filters are open
// //   useEffect(() => {
// //     if (isMobile && showFilters) {
// //       document.body.style.overflow = 'hidden';
// //     } else {
// //       document.body.style.overflow = 'unset';
// //     }

// //     return () => {
// //       document.body.style.overflow = 'unset';
// //     };
// //   }, [isMobile, showFilters]);

// //   const openFilters = () => {
// //     setShowFilters(true);
// //     setIsClosing(false);
// //   };

// //   const closeFilters = () => {
// //     setIsClosing(true);
// //     setTimeout(() => {
// //       setShowFilters(false);
// //       setIsClosing(false);
// //     }, 300);
// //   };

// //   // Extract unique values from properties for filters
// //   const propertyTypes = Array.from(new Set(properties.map(p => p.type)));
// //   const allAmenities = Array.from(new Set(properties.flatMap(p => p.amenities)));
// //   const locations = Array.from(new Set(properties.map(p => p.location)));

// //   // Fetch properties from backend
// //   useEffect(() => {
// //     fetchProperties();
// //   }, []);

// //   const fetchProperties = async () => {
// //     try {
// //       setLoading(true);
// //       setError('');
      
// //       const response = await propertiesAPI.getProperties({ 
// //         limit: 50,
// //         status: 'active'
// //       });
      
// //       const propertiesArray = response.properties || response;
// //       setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
// //       setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      
// //       if (Array.isArray(propertiesArray) && propertiesArray.length > 0) {
// //         const prices = propertiesArray.map(p => p.price);
// //         const minPrice = Math.floor(Math.min(...prices));
// //         const maxPrice = Math.ceil(Math.max(...prices));
// //         setPriceRange([minPrice, maxPrice]);
// //       }
      
// //     } catch (error) {
// //       console.error('Error fetching properties:', error);
// //       setError('Failed to load properties. Please try again later.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Apply filters
// //   useEffect(() => {
// //     if (properties.length === 0) return;

// //     setLoading(true);
    
// //     let filtered = properties.filter(property => {
// //       const matchesSearch = searchQuery === '' || 
// //                            property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
// //       const matchesLocation = locationQuery === '' || 
// //                              property.location.toLowerCase().includes(locationQuery.toLowerCase());
      
// //       const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
// //       const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
// //       const matchesAmenities = selectedAmenities.length === 0 || 
// //                               selectedAmenities.every(amenity => property.amenities.includes(amenity));
      
// //       return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesAmenities;
// //     });

// //     // Apply sorting
// //     switch (sortBy) {
// //       case 'price-low':
// //         filtered.sort((a, b) => a.price - b.price);
// //         break;
// //       case 'price-high':
// //         filtered.sort((a, b) => b.price - a.price);
// //         break;
// //       case 'rating':
// //         filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
// //         break;
// //       case 'bookings':
// //         filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
// //         break;
// //       default:
// //         filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
// //         break;
// //     }

// //     setFilteredProperties(filtered);
// //     setLoading(false);
// //   }, [searchQuery, locationQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

// //   const clearFilters = () => {
// //     setSearchQuery('');
// //     setLocationQuery('');
// //     setPriceRange([0, 500]);
// //     setSelectedTypes([]);
// //     setSelectedAmenities([]);
// //     setSortBy('recommended');
// //     if (isMobile) {
// //       closeFilters();
// //     }
// //   };

// //   // Handler functions that automatically close mobile filters
// //   const handlePriceRangeChange = (range: [number, number]) => {
// //     setPriceRange(range);
// //     if (isMobile) {
// //       closeFilters();
// //     }
// //   };

// //   const handleTypesChange = (types: string[]) => {
// //     setSelectedTypes(types);
// //     if (isMobile) {
// //       closeFilters();
// //     }
// //   };

// //   const handleAmenitiesChange = (amenities: string[]) => {
// //     setSelectedAmenities(amenities);
// //     if (isMobile) {
// //       closeFilters();
// //     }
// //   };

// //   const handleLocationChange = (location: string) => {
// //     setLocationQuery(location);
// //     if (isMobile) {
// //       closeFilters();
// //     }
// //   };

// //   const activeFiltersCount = [
// //     searchQuery ? 1 : 0,
// //     locationQuery ? 1 : 0,
// //     priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
// //     selectedTypes.length,
// //     selectedAmenities.length
// //   ].reduce((a, b) => a + b, 0);

// //   const transformPropertyForCard = (property: Property) => ({
// //     id: property._id,
// //     title: property.title,
// //     location: property.location,
// //     price: property.price,
// //     image: property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg',
// //     rating: property.rating || 0,
// //     reviews: property.totalBookings || 0,
// //     bedrooms: property.specifications?.bedrooms,
// //     bathrooms: property.specifications?.bathrooms,
// //     maxGuests: property.specifications?.maxGuests,
// //     type: property.type
// //   });

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Header */}
// //       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
// //         <div className="container mx-auto px-4">
// //           <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
// //           <p className="text-lg md:text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
// //         </div>
// //       </div>

// //       <div className="container mx-auto px-4 py-6 md:py-8">
// //         {/* Error Message */}
// //         {error && (
// //           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
// //             <div className="flex items-center justify-between">
// //               <div className="flex items-center">
// //                 <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                 </svg>
// //                 <span className="text-red-700">{error}</span>
// //               </div>
// //               <button
// //                 onClick={fetchProperties}
// //                 className="text-red-700 hover:text-red-800 font-medium"
// //               >
// //                 Retry
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         {/* Mobile Filter Button */}
// //         {isMobile && (
// //           <div className="mb-4">
// //             <button
// //               onClick={openFilters}
// //               className="mobile-filter-button w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
// //             >
// //               <div className="flex items-center">
// //                 <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
// //                 </svg>
// //                 <span className="font-medium text-gray-700">Filters</span>
// //                 {activeFiltersCount > 0 && (
// //                   <span className="ml-2 bg-[#f06123] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
// //                     {activeFiltersCount}
// //                   </span>
// //                 )}
// //               </div>
// //               <svg 
// //                 className="w-4 h-4 text-gray-600" 
// //                 fill="none" 
// //                 stroke="currentColor" 
// //                 viewBox="0 0 24 24"
// //               >
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //               </svg>
// //             </button>
// //           </div>
// //         )}

// //         {/* Search and Controls Bar */}
// //         <div className="flex flex-col lg:flex-row gap-4 mb-6">
// //           {/* Search Inputs */}
// //           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div className="relative">
// //               <input
// //                 type="text"
// //                 placeholder="Search by property name..."
// //                 value={searchQuery}
// //                 onChange={(e) => setSearchQuery(e.target.value)}
// //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// //               />
// //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// //                 </svg>
// //               </div>
// //             </div>
            
// //             <div className="relative">
// //               <input
// //                 type="text"
// //                 placeholder="Search by location..."
// //                 value={locationQuery}
// //                 onChange={(e) => setLocationQuery(e.target.value)}
// //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// //               />
// //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// //                 </svg>
// //               </div>
// //             </div>
// //           </div>

// //           {/* View Toggle and Sort */}
// //           <div className="flex gap-4">
// //             <select
// //               value={sortBy}
// //               onChange={(e) => setSortBy(e.target.value)}
// //               className="flex-1 md:flex-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base"
// //             >
// //               <option value="recommended">Recommended</option>
// //               <option value="price-low">Price: Low to High</option>
// //               <option value="price-high">Price: High to Low</option>
// //               <option value="rating">Highest Rated</option>
// //               <option value="bookings">Most Bookings</option>
// //             </select>

// //             <div className="flex border border-gray-300 rounded-lg overflow-hidden">
// //               <button
// //                 onClick={() => setViewMode('grid')}
// //                 className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// //               >
// //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
// //                 </svg>
// //               </button>
// //               <button
// //                 onClick={() => setViewMode('map')}
// //                 className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// //               >
// //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
// //                 </svg>
// //               </button>
// //             </div>
// //           </div>
// //         </div>

// //         <div className="flex flex-col lg:flex-row gap-8">
// //           {/* Filters Sidebar - Mobile Overlay */}
// //           {isMobile && (
// //             <>
// //               {/* Mobile Filter Overlay */}
// //               <div className={`
// //                 fixed inset-0 z-50 transition-all duration-300 ease-in-out
// //                 ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}
// //               `}>
// //                 {/* Semi-transparent overlay */}
// //                 <div 
// //                   className={`
// //                     absolute inset-0 bg-gray-600 transition-opacity duration-300
// //                     ${showFilters && !isClosing ? 'opacity-50' : 'opacity-0'}
// //                   `}
// //                   onClick={closeFilters}
// //                 />
                
// //                 {/* Sidebar */}
// //                 <div 
// //                   className={`
// //                     mobile-filters-sidebar absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl
// //                     transform transition-transform duration-300 ease-in-out
// //                     ${showFilters && !isClosing ? 'translate-x-0' : 'translate-x-full'}
// //                   `}
// //                 >
// //                   <div className="h-full flex flex-col">
// //                     {/* Header */}
// //                     <div className="flex-shrink-0 border-b border-gray-200">
// //                       <div className="flex justify-between items-center p-4">
// //                         <div>
// //                           <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
// //                           {activeFiltersCount > 0 && (
// //                             <p className="text-sm text-gray-600 mt-1">
// //                               {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// //                             </p>
// //                           )}
// //                         </div>
// //                         <button
// //                           onClick={closeFilters}
// //                           className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
// //                         >
// //                           <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// //                           </svg>
// //                         </button>
// //                       </div>
// //                     </div>

// //                     {/* Filters Content */}
// //                     <div className="flex-1 overflow-y-auto">
// //                       <div className="p-4">
// //                         <SearchFilters
// //                           priceRange={priceRange}
// //                           onPriceRangeChange={handlePriceRangeChange}
// //                           selectedTypes={selectedTypes}
// //                           onTypesChange={handleTypesChange}
// //                           selectedAmenities={selectedAmenities}
// //                           onAmenitiesChange={handleAmenitiesChange}
// //                           propertyTypes={propertyTypes}
// //                           allAmenities={allAmenities}
// //                           activeFiltersCount={activeFiltersCount}
// //                           onClearFilters={clearFilters}
// //                           locations={locations}
// //                           selectedLocation={locationQuery}
// //                           onLocationChange={handleLocationChange}
// //                           isMobile={true}
// //                         />
// //                       </div>
// //                     </div>

// //                     {/* Footer */}
// //                     <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
// //                       <button
// //                         onClick={closeFilters}
// //                         className="w-full bg-[#f06123] text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition duration-200 shadow-sm"
// //                       >
// //                         Show Results
// //                       </button>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </>
// //           )}

// //           {/* Desktop Filters */}
// //           {!isMobile && (
// //             <div className="lg:w-80">
// //               <SearchFilters
// //                 priceRange={priceRange}
// //                 onPriceRangeChange={handlePriceRangeChange}
// //                 selectedTypes={selectedTypes}
// //                 onTypesChange={setSelectedTypes}
// //                 selectedAmenities={selectedAmenities}
// //                 onAmenitiesChange={setSelectedAmenities}
// //                 propertyTypes={propertyTypes}
// //                 allAmenities={allAmenities}
// //                 activeFiltersCount={activeFiltersCount}
// //                 onClearFilters={clearFilters}
// //                 locations={locations}
// //                 selectedLocation={locationQuery}
// //                 onLocationChange={setLocationQuery}
// //                 isMobile={false}
// //               />
// //             </div>
// //           )}

// //           {/* Content Area */}
// //           <div className="flex-1">
// //             {/* Results Header */}
// //             <div className="flex justify-between items-center mb-6">
// //               <div>
// //                 <h2 className="text-xl md:text-2xl font-semibold text-[#383a3c]">
// //                   {loading ? 'Loading...' : `${filteredProperties.length} Properties Found`}
// //                 </h2>
// //                 {activeFiltersCount > 0 && !loading && (
// //                   <p className="text-gray-600 text-sm mt-1">
// //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// //                   </p>
// //                 )}
// //               </div>
// //             </div>

// //             {/* Loading State */}
// //             {loading && (
// //               <div className="flex justify-center items-center py-12">
// //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// //               </div>
// //             )}

// //             {/* Results */}
// //             {!loading && (
// //               <>
// //                 {viewMode === 'grid' ? (
// //                   <>
// //                     {filteredProperties.length > 0 ? (
// //                       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
// //                         {filteredProperties.map((property) => (
// //                           <PropertyCard
// //                             key={property._id}
// //                             {...transformPropertyForCard(property)}
// //                           />
// //                         ))}
// //                       </div>
// //                     ) : (
// //                       <div className="text-center py-12">
// //                         <svg className="w-20 h-20 md:w-24 md:h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                         </svg>
// //                         <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
// //                         <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// //                         <button
// //                           onClick={clearFilters}
// //                           className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //                         >
// //                           Clear All Filters
// //                         </button>
// //                       </div>
// //                     )}
// //                   </>
// //                 ) : (
// //                   <div className="h-[500px] md:h-[600px]">
// //                     <MapView properties={filteredProperties} />
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }












































































// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import PropertyCard from '@/components/PropertyCard';
// // // import SearchFilters from '@/components/SearchFilters';
// // // import MapView from '@/components/MapView';
// // // import { propertiesAPI } from '@/lib/api';

// // // interface Property {
// // //   _id: string;
// // //   title: string;
// // //   location: string;
// // //   price: number;
// // //   images: Array<{
// // //     url: string;
// // //     isMain: boolean;
// // //     order: number;
// // //   }>;
// // //   rating: number;
// // //   totalBookings: number;
// // //   type: string;
// // //   specifications: {
// // //     bedrooms: number;
// // //     bathrooms: number;
// // //     maxGuests: number;
// // //     squareFeet: number;
// // //   };
// // //   amenities: string[];
// // //   coordinates?: {
// // //     lat: number;
// // //     lng: number;
// // //   };
// // // }

// // // export default function PropertiesPage() {
// // //   const [properties, setProperties] = useState<Property[]>([]);
// // //   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
// // //   const [searchQuery, setSearchQuery] = useState('');
// // //   const [locationQuery, setLocationQuery] = useState('');
// // //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
// // //   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
// // //   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
// // //   const [sortBy, setSortBy] = useState('recommended');
// // //   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState<string>('');
// // //   const [showFilters, setShowFilters] = useState(false);
// // //   const [isMobile, setIsMobile] = useState(false);

// // //   // Check if mobile on mount and resize
// // //   useEffect(() => {
// // //     const checkMobile = () => {
// // //       setIsMobile(window.innerWidth < 1024);
// // //     };
    
// // //     checkMobile();
// // //     window.addEventListener('resize', checkMobile);
    
// // //     return () => window.removeEventListener('resize', checkMobile);
// // //   }, []);

// // //   // Extract unique values from properties for filters
// // //   const propertyTypes = Array.from(new Set(properties.map(p => p.type)));
// // //   const allAmenities = Array.from(new Set(properties.flatMap(p => p.amenities)));
// // //   const locations = Array.from(new Set(properties.map(p => p.location)));

// // //   // Fetch properties from backend
// // //   useEffect(() => {
// // //     fetchProperties();
// // //   }, []);

// // //   const fetchProperties = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError('');
      
// // //       const response = await propertiesAPI.getProperties({ 
// // //         limit: 50,
// // //         status: 'active'
// // //       });
      
// // //       const propertiesArray = response.properties || response;
// // //       setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
// // //       setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      
// // //       if (Array.isArray(propertiesArray) && propertiesArray.length > 0) {
// // //         const prices = propertiesArray.map(p => p.price);
// // //         const minPrice = Math.floor(Math.min(...prices));
// // //         const maxPrice = Math.ceil(Math.max(...prices));
// // //         setPriceRange([minPrice, maxPrice]);
// // //       }
      
// // //     } catch (error) {
// // //       console.error('Error fetching properties:', error);
// // //       setError('Failed to load properties. Please try again later.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   // Apply filters
// // //   useEffect(() => {
// // //     if (properties.length === 0) return;

// // //     setLoading(true);
    
// // //     let filtered = properties.filter(property => {
// // //       const matchesSearch = searchQuery === '' || 
// // //                            property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
// // //       const matchesLocation = locationQuery === '' || 
// // //                              property.location.toLowerCase().includes(locationQuery.toLowerCase());
      
// // //       const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
// // //       const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
// // //       const matchesAmenities = selectedAmenities.length === 0 || 
// // //                               selectedAmenities.every(amenity => property.amenities.includes(amenity));
      
// // //       return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesAmenities;
// // //     });

// // //     // Apply sorting
// // //     switch (sortBy) {
// // //       case 'price-low':
// // //         filtered.sort((a, b) => a.price - b.price);
// // //         break;
// // //       case 'price-high':
// // //         filtered.sort((a, b) => b.price - a.price);
// // //         break;
// // //       case 'rating':
// // //         filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
// // //         break;
// // //       case 'bookings':
// // //         filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
// // //         break;
// // //       default:
// // //         filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
// // //         break;
// // //     }

// // //     setFilteredProperties(filtered);
// // //     setLoading(false);
// // //   }, [searchQuery, locationQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

// // //   const clearFilters = () => {
// // //     setSearchQuery('');
// // //     setLocationQuery('');
// // //     setPriceRange([0, 500]);
// // //     setSelectedTypes([]);
// // //     setSelectedAmenities([]);
// // //     setSortBy('recommended');
// // //     if (isMobile) {
// // //       setShowFilters(false);
// // //     }
// // //   };

// // //   // Handler functions that automatically close mobile filters
// // //   const handlePriceRangeChange = (range: [number, number]) => {
// // //     setPriceRange(range);
// // //     if (isMobile) {
// // //       setShowFilters(false);
// // //     }
// // //   };

// // //   const handleTypesChange = (types: string[]) => {
// // //     setSelectedTypes(types);
// // //     if (isMobile) {
// // //       setShowFilters(false);
// // //     }
// // //   };

// // //   const handleAmenitiesChange = (amenities: string[]) => {
// // //     setSelectedAmenities(amenities);
// // //     if (isMobile) {
// // //       setShowFilters(false);
// // //     }
// // //   };

// // //   const handleLocationChange = (location: string) => {
// // //     setLocationQuery(location);
// // //     if (isMobile) {
// // //       setShowFilters(false);
// // //     }
// // //   };

// // //   const activeFiltersCount = [
// // //     searchQuery ? 1 : 0,
// // //     locationQuery ? 1 : 0,
// // //     priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
// // //     selectedTypes.length,
// // //     selectedAmenities.length
// // //   ].reduce((a, b) => a + b, 0);

// // //   const transformPropertyForCard = (property: Property) => ({
// // //     id: property._id,
// // //     title: property.title,
// // //     location: property.location,
// // //     price: property.price,
// // //     image: property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg',
// // //     rating: property.rating || 0,
// // //     reviews: property.totalBookings || 0,
// // //     bedrooms: property.specifications?.bedrooms,
// // //     bathrooms: property.specifications?.bathrooms,
// // //     maxGuests: property.specifications?.maxGuests,
// // //     type: property.type
// // //   });

// // //   return (
// // //     <div className="min-h-screen bg-gray-50">
// // //       {/* Header */}
// // //       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
// // //         <div className="container mx-auto px-4">
// // //           <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
// // //           <p className="text-lg md:text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
// // //         </div>
// // //       </div>

// // //       <div className="container mx-auto px-4 py-6 md:py-8">
// // //         {/* Error Message */}
// // //         {error && (
// // //           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
// // //             <div className="flex items-center justify-between">
// // //               <div className="flex items-center">
// // //                 <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // //                 </svg>
// // //                 <span className="text-red-700">{error}</span>
// // //               </div>
// // //               <button
// // //                 onClick={fetchProperties}
// // //                 className="text-red-700 hover:text-red-800 font-medium"
// // //               >
// // //                 Retry
// // //               </button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* Mobile Filter Button */}
// // //         {isMobile && (
// // //           <div className="mb-4">
// // //             <button
// // //               onClick={() => setShowFilters(!showFilters)}
// // //               className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm"
// // //             >
// // //               <div className="flex items-center">
// // //                 <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
// // //                 </svg>
// // //                 <span className="font-medium text-gray-700">Filters</span>
// // //                 {activeFiltersCount > 0 && (
// // //                   <span className="ml-2 bg-[#f06123] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
// // //                     {activeFiltersCount}
// // //                   </span>
// // //                 )}
// // //               </div>
// // //               <svg 
// // //                 className={`w-4 h-4 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
// // //                 fill="none" 
// // //                 stroke="currentColor" 
// // //                 viewBox="0 0 24 24"
// // //               >
// // //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// // //               </svg>
// // //             </button>
// // //           </div>
// // //         )}

// // //         {/* Search and Controls Bar */}
// // //         <div className="flex flex-col lg:flex-row gap-4 mb-6">
// // //           {/* Search Inputs */}
// // //           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
// // //             <div className="relative">
// // //               <input
// // //                 type="text"
// // //                 placeholder="Search by property name..."
// // //                 value={searchQuery}
// // //                 onChange={(e) => setSearchQuery(e.target.value)}
// // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// // //               />
// // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// // //                 </svg>
// // //               </div>
// // //             </div>
            
// // //             <div className="relative">
// // //               <input
// // //                 type="text"
// // //                 placeholder="Search by location..."
// // //                 value={locationQuery}
// // //                 onChange={(e) => setLocationQuery(e.target.value)}
// // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// // //               />
// // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// // //                 </svg>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* View Toggle and Sort */}
// // //           <div className="flex gap-4">
// // //             <select
// // //               value={sortBy}
// // //               onChange={(e) => setSortBy(e.target.value)}
// // //               className="flex-1 md:flex-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base"
// // //             >
// // //               <option value="recommended">Recommended</option>
// // //               <option value="price-low">Price: Low to High</option>
// // //               <option value="price-high">Price: High to Low</option>
// // //               <option value="rating">Highest Rated</option>
// // //               <option value="bookings">Most Bookings</option>
// // //             </select>

// // //             <div className="flex border border-gray-300 rounded-lg overflow-hidden">
// // //               <button
// // //                 onClick={() => setViewMode('grid')}
// // //                 className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // //               >
// // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
// // //                 </svg>
// // //               </button>
// // //               <button
// // //                 onClick={() => setViewMode('map')}
// // //                 className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // //               >
// // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
// // //                 </svg>
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         <div className="flex flex-col lg:flex-row gap-8">
// // //           {/* Filters Sidebar - Mobile Overlay */}
// // //           {isMobile ? (
// // //             <>
// // //               {/* Mobile Filter Overlay */}
// // //               {showFilters && (
// // //                 <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
// // //                   <div className="absolute inset-0" onClick={() => setShowFilters(false)}></div>
// // //                   <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white overflow-y-auto">
// // //                     <div className="p-4">
// // //                       <div className="flex justify-between items-center mb-4">
// // //                         <h3 className="text-lg font-semibold">Filters</h3>
// // //                         <button
// // //                           onClick={() => setShowFilters(false)}
// // //                           className="p-2 text-gray-500 hover:text-gray-700"
// // //                         >
// // //                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // //                           </svg>
// // //                         </button>
// // //                       </div>
// // //                       <SearchFilters
// // //                         priceRange={priceRange}
// // //                         onPriceRangeChange={handlePriceRangeChange}
// // //                         selectedTypes={selectedTypes}
// // //                         onTypesChange={handleTypesChange}
// // //                         selectedAmenities={selectedAmenities}
// // //                         onAmenitiesChange={handleAmenitiesChange}
// // //                         propertyTypes={propertyTypes}
// // //                         allAmenities={allAmenities}
// // //                         activeFiltersCount={activeFiltersCount}
// // //                         onClearFilters={clearFilters}
// // //                         locations={locations}
// // //                         selectedLocation={locationQuery}
// // //                         onLocationChange={handleLocationChange}
// // //                         isMobile={true}
// // //                       />
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </>
// // //           ) : (
// // //             /* Desktop Filters */
// // //             <div className="lg:w-80">
// // //               <SearchFilters
// // //                 priceRange={priceRange}
// // //                 onPriceRangeChange={handlePriceRangeChange}
// // //                 selectedTypes={selectedTypes}
// // //                 onTypesChange={setSelectedTypes}
// // //                 selectedAmenities={selectedAmenities}
// // //                 onAmenitiesChange={setSelectedAmenities}
// // //                 propertyTypes={propertyTypes}
// // //                 allAmenities={allAmenities}
// // //                 activeFiltersCount={activeFiltersCount}
// // //                 onClearFilters={clearFilters}
// // //                 locations={locations}
// // //                 selectedLocation={locationQuery}
// // //                 onLocationChange={setLocationQuery}
// // //                 isMobile={false}
// // //               />
// // //             </div>
// // //           )}

// // //           {/* Content Area */}
// // //           <div className="flex-1">
// // //             {/* Results Header */}
// // //             <div className="flex justify-between items-center mb-6">
// // //               <div>
// // //                 <h2 className="text-xl md:text-2xl font-semibold text-[#383a3c]">
// // //                   {loading ? 'Loading...' : `${filteredProperties.length} Properties Found`}
// // //                 </h2>
// // //                 {activeFiltersCount > 0 && !loading && (
// // //                   <p className="text-gray-600 text-sm mt-1">
// // //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// // //                   </p>
// // //                 )}
// // //               </div>
// // //             </div>

// // //             {/* Loading State */}
// // //             {loading && (
// // //               <div className="flex justify-center items-center py-12">
// // //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// // //               </div>
// // //             )}

// // //             {/* Results */}
// // //             {!loading && (
// // //               <>
// // //                 {viewMode === 'grid' ? (
// // //                   <>
// // //                     {filteredProperties.length > 0 ? (
// // //                       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
// // //                         {filteredProperties.map((property) => (
// // //                           <PropertyCard
// // //                             key={property._id}
// // //                             {...transformPropertyForCard(property)}
// // //                           />
// // //                         ))}
// // //                       </div>
// // //                     ) : (
// // //                       <div className="text-center py-12">
// // //                         <svg className="w-20 h-20 md:w-24 md:h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // //                         </svg>
// // //                         <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
// // //                         <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// // //                         <button
// // //                           onClick={clearFilters}
// // //                           className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// // //                         >
// // //                           Clear All Filters
// // //                         </button>
// // //                       </div>
// // //                     )}
// // //                   </>
// // //                 ) : (
// // //                   <div className="h-[500px] md:h-[600px]">
// // //                     <MapView properties={filteredProperties} />
// // //                   </div>
// // //                 )}
// // //               </>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }











































// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import PropertyCard from '@/components/PropertyCard';
// // // // import SearchFilters from '@/components/SearchFilters';
// // // // import MapView from '@/components/MapView';
// // // // import { propertiesAPI } from '@/lib/api';

// // // // interface Property {
// // // //   _id: string;
// // // //   title: string;
// // // //   location: string;
// // // //   price: number;
// // // //   images: Array<{
// // // //     url: string;
// // // //     isMain: boolean;
// // // //     order: number;
// // // //   }>;
// // // //   rating: number;
// // // //   totalBookings: number;
// // // //   type: string;
// // // //   specifications: {
// // // //     bedrooms: number;
// // // //     bathrooms: number;
// // // //     maxGuests: number;
// // // //     squareFeet: number;
// // // //   };
// // // //   amenities: string[];
// // // //   coordinates?: {
// // // //     lat: number;
// // // //     lng: number;
// // // //   };
// // // // }

// // // // export default function PropertiesPage() {
// // // //   const [properties, setProperties] = useState<Property[]>([]);
// // // //   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
// // // //   const [searchQuery, setSearchQuery] = useState('');
// // // //   const [locationQuery, setLocationQuery] = useState('');
// // // //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
// // // //   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
// // // //   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
// // // //   const [sortBy, setSortBy] = useState('recommended');
// // // //   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState<string>('');
// // // //   const [showFilters, setShowFilters] = useState(false);
// // // //   const [isMobile, setIsMobile] = useState(false);

// // // //   // Check if mobile on mount and resize
// // // //   useEffect(() => {
// // // //     const checkMobile = () => {
// // // //       setIsMobile(window.innerWidth < 1024);
// // // //     };
    
// // // //     checkMobile();
// // // //     window.addEventListener('resize', checkMobile);
    
// // // //     return () => window.removeEventListener('resize', checkMobile);
// // // //   }, []);

// // // //   // Extract unique values from properties for filters
// // // //   const propertyTypes = Array.from(new Set(properties.map(p => p.type)));
// // // //   const allAmenities = Array.from(new Set(properties.flatMap(p => p.amenities)));
// // // //   const locations = Array.from(new Set(properties.map(p => p.location)));

// // // //   // Fetch properties from backend
// // // //   useEffect(() => {
// // // //     fetchProperties();
// // // //   }, []);

// // // //   const fetchProperties = async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError('');
      
// // // //       const response = await propertiesAPI.getProperties({ 
// // // //         limit: 50,
// // // //         status: 'active'
// // // //       });
      
// // // //       const propertiesArray = response.properties || response;
// // // //       setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
// // // //       setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      
// // // //       if (Array.isArray(propertiesArray) && propertiesArray.length > 0) {
// // // //         const prices = propertiesArray.map(p => p.price);
// // // //         const minPrice = Math.floor(Math.min(...prices));
// // // //         const maxPrice = Math.ceil(Math.max(...prices));
// // // //         setPriceRange([minPrice, maxPrice]);
// // // //       }
      
// // // //     } catch (error) {
// // // //       console.error('Error fetching properties:', error);
// // // //       setError('Failed to load properties. Please try again later.');
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // Apply filters
// // // //   useEffect(() => {
// // // //     if (properties.length === 0) return;

// // // //     setLoading(true);
    
// // // //     let filtered = properties.filter(property => {
// // // //       const matchesSearch = searchQuery === '' || 
// // // //                            property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
// // // //       const matchesLocation = locationQuery === '' || 
// // // //                              property.location.toLowerCase().includes(locationQuery.toLowerCase());
      
// // // //       const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
// // // //       const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
// // // //       const matchesAmenities = selectedAmenities.length === 0 || 
// // // //                               selectedAmenities.every(amenity => property.amenities.includes(amenity));
      
// // // //       return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesAmenities;
// // // //     });

// // // //     // Apply sorting
// // // //     switch (sortBy) {
// // // //       case 'price-low':
// // // //         filtered.sort((a, b) => a.price - b.price);
// // // //         break;
// // // //       case 'price-high':
// // // //         filtered.sort((a, b) => b.price - a.price);
// // // //         break;
// // // //       case 'rating':
// // // //         filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
// // // //         break;
// // // //       case 'bookings':
// // // //         filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
// // // //         break;
// // // //       default:
// // // //         filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
// // // //         break;
// // // //     }

// // // //     setFilteredProperties(filtered);
// // // //     setLoading(false);
// // // //   }, [searchQuery, locationQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

// // // //   const clearFilters = () => {
// // // //     setSearchQuery('');
// // // //     setLocationQuery('');
// // // //     setPriceRange([0, 500]);
// // // //     setSelectedTypes([]);
// // // //     setSelectedAmenities([]);
// // // //     setSortBy('recommended');
// // // //   };

// // // //   const activeFiltersCount = [
// // // //     searchQuery ? 1 : 0,
// // // //     locationQuery ? 1 : 0,
// // // //     priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
// // // //     selectedTypes.length,
// // // //     selectedAmenities.length
// // // //   ].reduce((a, b) => a + b, 0);

// // // //   const handlePriceRangeChange = (range: [number, number]) => {
// // // //     setPriceRange(range);
// // // //   };

// // // //   const transformPropertyForCard = (property: Property) => ({
// // // //     id: property._id,
// // // //     title: property.title,
// // // //     location: property.location,
// // // //     price: property.price,
// // // //     image: property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg',
// // // //     rating: property.rating || 0,
// // // //     reviews: property.totalBookings || 0,
// // // //     bedrooms: property.specifications?.bedrooms,
// // // //     bathrooms: property.specifications?.bathrooms,
// // // //     maxGuests: property.specifications?.maxGuests,
// // // //     type: property.type
// // // //   });

// // // //   return (
// // // //     <div className="min-h-screen bg-gray-50">
// // // //       {/* Header */}
// // // //       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
// // // //         <div className="container mx-auto px-4">
// // // //           <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
// // // //           <p className="text-lg md:text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
// // // //         </div>
// // // //       </div>

// // // //       <div className="container mx-auto px-4 py-6 md:py-8">
// // // //         {/* Error Message */}
// // // //         {error && (
// // // //           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
// // // //             <div className="flex items-center justify-between">
// // // //               <div className="flex items-center">
// // // //                 <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // // //                 </svg>
// // // //                 <span className="text-red-700">{error}</span>
// // // //               </div>
// // // //               <button
// // // //                 onClick={fetchProperties}
// // // //                 className="text-red-700 hover:text-red-800 font-medium"
// // // //               >
// // // //                 Retry
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {/* Mobile Filter Button */}
// // // //         {isMobile && (
// // // //           <div className="mb-4">
// // // //             <button
// // // //               onClick={() => setShowFilters(!showFilters)}
// // // //               className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm"
// // // //             >
// // // //               <div className="flex items-center">
// // // //                 <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
// // // //                 </svg>
// // // //                 <span className="font-medium text-gray-700">Filters</span>
// // // //                 {activeFiltersCount > 0 && (
// // // //                   <span className="ml-2 bg-[#f06123] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
// // // //                     {activeFiltersCount}
// // // //                   </span>
// // // //                 )}
// // // //               </div>
// // // //               <svg 
// // // //                 className={`w-4 h-4 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
// // // //                 fill="none" 
// // // //                 stroke="currentColor" 
// // // //                 viewBox="0 0 24 24"
// // // //               >
// // // //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// // // //               </svg>
// // // //             </button>
// // // //           </div>
// // // //         )}

// // // //         {/* Search and Controls Bar */}
// // // //         <div className="flex flex-col lg:flex-row gap-4 mb-6">
// // // //           {/* Search Inputs */}
// // // //           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
// // // //             <div className="relative">
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="Search by property name..."
// // // //                 value={searchQuery}
// // // //                 onChange={(e) => setSearchQuery(e.target.value)}
// // // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// // // //               />
// // // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// // // //                 </svg>
// // // //               </div>
// // // //             </div>
            
// // // //             <div className="relative">
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="Search by location..."
// // // //                 value={locationQuery}
// // // //                 onChange={(e) => setLocationQuery(e.target.value)}
// // // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent text-base"
// // // //               />
// // // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// // // //                 </svg>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* View Toggle and Sort */}
// // // //           <div className="flex gap-4">
// // // //             <select
// // // //               value={sortBy}
// // // //               onChange={(e) => setSortBy(e.target.value)}
// // // //               className="flex-1 md:flex-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base"
// // // //             >
// // // //               <option value="recommended">Recommended</option>
// // // //               <option value="price-low">Price: Low to High</option>
// // // //               <option value="price-high">Price: High to Low</option>
// // // //               <option value="rating">Highest Rated</option>
// // // //               <option value="bookings">Most Bookings</option>
// // // //             </select>

// // // //             <div className="flex border border-gray-300 rounded-lg overflow-hidden">
// // // //               <button
// // // //                 onClick={() => setViewMode('grid')}
// // // //                 className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // // //               >
// // // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
// // // //                 </svg>
// // // //               </button>
// // // //               <button
// // // //                 onClick={() => setViewMode('map')}
// // // //                 className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // // //               >
// // // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
// // // //                 </svg>
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         <div className="flex flex-col lg:flex-row gap-8">
// // // //           {/* Filters Sidebar - Mobile Overlay */}
// // // //           {isMobile ? (
// // // //             <>
// // // //               {/* Mobile Filter Overlay */}
// // // //               {showFilters && (
// // // //                 <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
// // // //                   <div className="absolute inset-0" onClick={() => setShowFilters(false)}></div>
// // // //                   <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white overflow-y-auto">
// // // //                     <div className="p-4">
// // // //                       <div className="flex justify-between items-center mb-4">
// // // //                         <h3 className="text-lg font-semibold">Filters</h3>
// // // //                         <button
// // // //                           onClick={() => setShowFilters(false)}
// // // //                           className="p-2 text-gray-500 hover:text-gray-700"
// // // //                         >
// // // //                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // // //                           </svg>
// // // //                         </button>
// // // //                       </div>
// // // //                       <SearchFilters
// // // //                         priceRange={priceRange}
// // // //                         onPriceRangeChange={handlePriceRangeChange}
// // // //                         selectedTypes={selectedTypes}
// // // //                         onTypesChange={setSelectedTypes}
// // // //                         selectedAmenities={selectedAmenities}
// // // //                         onAmenitiesChange={setSelectedAmenities}
// // // //                         propertyTypes={propertyTypes}
// // // //                         allAmenities={allAmenities}
// // // //                         activeFiltersCount={activeFiltersCount}
// // // //                         onClearFilters={() => {
// // // //                           clearFilters();
// // // //                           setShowFilters(false);
// // // //                         }}
// // // //                         locations={locations}
// // // //                         selectedLocation={locationQuery}
// // // //                         onLocationChange={setLocationQuery}
// // // //                       />
// // // //                       <div className="mt-6">
// // // //                         <button
// // // //                           onClick={() => setShowFilters(false)}
// // // //                           className="w-full bg-[#f06123] text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition duration-200"
// // // //                         >
// // // //                           Show Results
// // // //                         </button>
// // // //                       </div>
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //               )}
// // // //             </>
// // // //           ) : (
// // // //             /* Desktop Filters */
// // // //             <div className="lg:w-80">
// // // //               <SearchFilters
// // // //                 priceRange={priceRange}
// // // //                 onPriceRangeChange={handlePriceRangeChange}
// // // //                 selectedTypes={selectedTypes}
// // // //                 onTypesChange={setSelectedTypes}
// // // //                 selectedAmenities={selectedAmenities}
// // // //                 onAmenitiesChange={setSelectedAmenities}
// // // //                 propertyTypes={propertyTypes}
// // // //                 allAmenities={allAmenities}
// // // //                 activeFiltersCount={activeFiltersCount}
// // // //                 onClearFilters={clearFilters}
// // // //                 locations={locations}
// // // //                 selectedLocation={locationQuery}
// // // //                 onLocationChange={setLocationQuery}
// // // //               />
// // // //             </div>
// // // //           )}

// // // //           {/* Content Area */}
// // // //           <div className="flex-1">
// // // //             {/* Results Header */}
// // // //             <div className="flex justify-between items-center mb-6">
// // // //               <div>
// // // //                 <h2 className="text-xl md:text-2xl font-semibold text-[#383a3c]">
// // // //                   {loading ? 'Loading...' : `${filteredProperties.length} Properties Found`}
// // // //                 </h2>
// // // //                 {activeFiltersCount > 0 && !loading && (
// // // //                   <p className="text-gray-600 text-sm mt-1">
// // // //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// // // //                   </p>
// // // //                 )}
// // // //               </div>
// // // //             </div>

// // // //             {/* Loading State */}
// // // //             {loading && (
// // // //               <div className="flex justify-center items-center py-12">
// // // //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// // // //               </div>
// // // //             )}

// // // //             {/* Results */}
// // // //             {!loading && (
// // // //               <>
// // // //                 {viewMode === 'grid' ? (
// // // //                   <>
// // // //                     {filteredProperties.length > 0 ? (
// // // //                       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
// // // //                         {filteredProperties.map((property) => (
// // // //                           <PropertyCard
// // // //                             key={property._id}
// // // //                             {...transformPropertyForCard(property)}
// // // //                           />
// // // //                         ))}
// // // //                       </div>
// // // //                     ) : (
// // // //                       <div className="text-center py-12">
// // // //                         <svg className="w-20 h-20 md:w-24 md:h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // // //                         </svg>
// // // //                         <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
// // // //                         <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// // // //                         <button
// // // //                           onClick={clearFilters}
// // // //                           className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// // // //                         >
// // // //                           Clear All Filters
// // // //                         </button>
// // // //                       </div>
// // // //                     )}
// // // //                   </>
// // // //                 ) : (
// // // //                   <div className="h-[500px] md:h-[600px]">
// // // //                     <MapView properties={filteredProperties} />
// // // //                   </div>
// // // //                 )}
// // // //               </>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }












































// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import PropertyCard from '@/components/PropertyCard';
// // // // import SearchFilters from '@/components/SearchFilters';
// // // // import MapView from '@/components/MapView';
// // // // import { propertiesAPI } from '@/lib/api';

// // // // interface Property {
// // // //   _id: string;
// // // //   title: string;
// // // //   location: string;
// // // //   price: number;
// // // //   images: Array<{
// // // //     url: string;
// // // //     isMain: boolean;
// // // //     order: number;
// // // //   }>;
// // // //   rating: number;
// // // //   totalBookings: number;
// // // //   type: string;
// // // //   specifications: {
// // // //     bedrooms: number;
// // // //     bathrooms: number;
// // // //     maxGuests: number;
// // // //     squareFeet: number;
// // // //   };
// // // //   amenities: string[];
// // // //   coordinates?: {
// // // //     lat: number;
// // // //     lng: number;
// // // //   };
// // // // }

// // // // export default function PropertiesPage() {
// // // //   const [properties, setProperties] = useState<Property[]>([]);
// // // //   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
// // // //   const [searchQuery, setSearchQuery] = useState('');
// // // //   const [locationQuery, setLocationQuery] = useState('');
// // // //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
// // // //   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
// // // //   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
// // // //   const [sortBy, setSortBy] = useState('recommended');
// // // //   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState<string>('');

// // // //   // Extract unique values from properties for filters
// // // //   const propertyTypes = Array.from(new Set(properties.map(p => p.type)));
// // // //   const allAmenities = Array.from(new Set(properties.flatMap(p => p.amenities)));
// // // //   const locations = Array.from(new Set(properties.map(p => p.location)));

// // // //   // Fetch properties from backend
// // // //   useEffect(() => {
// // // //     fetchProperties();
// // // //   }, []);

// // // //   const fetchProperties = async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError('');
      
// // // //       const response = await propertiesAPI.getProperties({ 
// // // //         limit: 50, // Get more properties for filtering
// // // //         status: 'active'
// // // //       });
      
// // // //       const propertiesArray = response.properties || response;
// // // //       setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
// // // //       setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
      
// // // //       // Set dynamic price range based on actual data
// // // //       if (Array.isArray(propertiesArray) && propertiesArray.length > 0) {
// // // //         const prices = propertiesArray.map(p => p.price);
// // // //         const minPrice = Math.floor(Math.min(...prices));
// // // //         const maxPrice = Math.ceil(Math.max(...prices));
// // // //         setPriceRange([minPrice, maxPrice]);
// // // //       }
      
// // // //     } catch (error) {
// // // //       console.error('Error fetching properties:', error);
// // // //       setError('Failed to load properties. Please try again later.');
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // Apply filters
// // // //   useEffect(() => {
// // // //     if (properties.length === 0) return;

// // // //     setLoading(true);
    
// // // //     let filtered = properties.filter(property => {
// // // //       // Search query filter (title)
// // // //       const matchesSearch = searchQuery === '' || 
// // // //                            property.title.toLowerCase().includes(searchQuery.toLowerCase());
      
// // // //       // Location filter
// // // //       const matchesLocation = locationQuery === '' || 
// // // //                              property.location.toLowerCase().includes(locationQuery.toLowerCase());
      
// // // //       // Price range filter
// // // //       const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
// // // //       // Property type filter
// // // //       const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
// // // //       // Amenities filter
// // // //       const matchesAmenities = selectedAmenities.length === 0 || 
// // // //                               selectedAmenities.every(amenity => property.amenities.includes(amenity));
      
// // // //       return matchesSearch && matchesLocation && matchesPrice && matchesType && matchesAmenities;
// // // //     });

// // // //     // Apply sorting
// // // //     switch (sortBy) {
// // // //       case 'price-low':
// // // //         filtered.sort((a, b) => a.price - b.price);
// // // //         break;
// // // //       case 'price-high':
// // // //         filtered.sort((a, b) => b.price - a.price);
// // // //         break;
// // // //       case 'rating':
// // // //         filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
// // // //         break;
// // // //       case 'bookings':
// // // //         filtered.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
// // // //         break;
// // // //       default:
// // // //         // Recommended (default ordering - newest first)
// // // //         filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
// // // //         break;
// // // //     }

// // // //     setFilteredProperties(filtered);
// // // //     setLoading(false);
// // // //   }, [searchQuery, locationQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

// // // //   const clearFilters = () => {
// // // //     setSearchQuery('');
// // // //     setLocationQuery('');
// // // //     setPriceRange([0, 500]);
// // // //     setSelectedTypes([]);
// // // //     setSelectedAmenities([]);
// // // //     setSortBy('recommended');
// // // //   };

// // // //   const activeFiltersCount = [
// // // //     searchQuery ? 1 : 0,
// // // //     locationQuery ? 1 : 0,
// // // //     priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
// // // //     selectedTypes.length,
// // // //     selectedAmenities.length
// // // //   ].reduce((a, b) => a + b, 0);

// // // //   const handlePriceRangeChange = (range: [number, number]) => {
// // // //     setPriceRange(range);
// // // //   };

// // // //   // Transform property for PropertyCard component
// // // //   const transformPropertyForCard = (property: Property) => ({
// // // //     id: property._id,
// // // //     title: property.title,
// // // //     location: property.location,
// // // //     price: property.price,
// // // //     image: property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg',
// // // //     rating: property.rating || 0,
// // // //     reviews: property.totalBookings || 0,
// // // //     bedrooms: property.specifications?.bedrooms,
// // // //     bathrooms: property.specifications?.bathrooms,
// // // //     maxGuests: property.specifications?.maxGuests,
// // // //     type: property.type
// // // //   });

// // // //   return (
// // // //     <div className="min-h-screen bg-gray-50">
// // // //       {/* Header */}
// // // //       <div className="bg-[#383a3c] text-[#fcfeff] py-16">
// // // //         <div className="container mx-auto px-4">
// // // //           <h1 className="text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
// // // //           <p className="text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
// // // //         </div>
// // // //       </div>

// // // //       <div className="container mx-auto px-4 py-8">
// // // //         {/* Error Message */}
// // // //         {error && (
// // // //           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
// // // //             <div className="flex items-center justify-between">
// // // //               <div className="flex items-center">
// // // //                 <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // // //                 </svg>
// // // //                 <span className="text-red-700">{error}</span>
// // // //               </div>
// // // //               <button
// // // //                 onClick={fetchProperties}
// // // //                 className="text-red-700 hover:text-red-800 font-medium"
// // // //               >
// // // //                 Retry
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {/* Search and Controls Bar */}
// // // //         <div className="flex flex-col lg:flex-row gap-4 mb-6">
// // // //           {/* Search Inputs */}
// // // //           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
// // // //             <div className="relative">
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="Search by property name..."
// // // //                 value={searchQuery}
// // // //                 onChange={(e) => setSearchQuery(e.target.value)}
// // // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //               />
// // // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// // // //                 </svg>
// // // //               </div>
// // // //             </div>
            
// // // //             <div className="relative">
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="Search by location..."
// // // //                 value={locationQuery}
// // // //                 onChange={(e) => setLocationQuery(e.target.value)}
// // // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //               />
// // // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// // // //                 </svg>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* View Toggle and Sort */}
// // // //           <div className="flex gap-4">
// // // //             <select
// // // //               value={sortBy}
// // // //               onChange={(e) => setSortBy(e.target.value)}
// // // //               className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// // // //             >
// // // //               <option value="recommended">Recommended</option>
// // // //               <option value="price-low">Price: Low to High</option>
// // // //               <option value="price-high">Price: High to Low</option>
// // // //               <option value="rating">Highest Rated</option>
// // // //               <option value="bookings">Most Bookings</option>
// // // //             </select>

// // // //             <div className="flex border border-gray-300 rounded-lg overflow-hidden">
// // // //               <button
// // // //                 onClick={() => setViewMode('grid')}
// // // //                 className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // // //               >
// // // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
// // // //                 </svg>
// // // //               </button>
// // // //               <button
// // // //                 onClick={() => setViewMode('map')}
// // // //                 className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // // //               >
// // // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
// // // //                 </svg>
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         <div className="flex flex-col lg:flex-row gap-8">
// // // //           {/* Filters Sidebar */}
// // // //           <div className="lg:w-80">
// // // //             <SearchFilters
// // // //               priceRange={priceRange}
// // // //               onPriceRangeChange={handlePriceRangeChange} 
// // // //               selectedTypes={selectedTypes}
// // // //               onTypesChange={setSelectedTypes}
// // // //               selectedAmenities={selectedAmenities}
// // // //               onAmenitiesChange={setSelectedAmenities}
// // // //               propertyTypes={propertyTypes}
// // // //               allAmenities={allAmenities}
// // // //               activeFiltersCount={activeFiltersCount}
// // // //               onClearFilters={clearFilters}
// // // //               locations={locations}
// // // //               selectedLocation={locationQuery}
// // // //               onLocationChange={setLocationQuery}
// // // //             />
// // // //           </div>

// // // //           {/* Content Area */}
// // // //           <div className="flex-1">
// // // //             {/* Results Header */}
// // // //             <div className="flex justify-between items-center mb-6">
// // // //               <div>
// // // //                 <h2 className="text-2xl font-semibold text-[#383a3c]">
// // // //                   {loading ? 'Loading...' : `${filteredProperties.length} Properties Found`}
// // // //                 </h2>
// // // //                 {activeFiltersCount > 0 && !loading && (
// // // //                   <p className="text-gray-600 text-sm mt-1">
// // // //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// // // //                   </p>
// // // //                 )}
// // // //               </div>
// // // //             </div>

// // // //             {/* Loading State */}
// // // //             {loading && (
// // // //               <div className="flex justify-center items-center py-12">
// // // //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// // // //               </div>
// // // //             )}

// // // //             {/* Results */}
// // // //             {!loading && (
// // // //               <>
// // // //                 {viewMode === 'grid' ? (
// // // //                   <>
// // // //                     {filteredProperties.length > 0 ? (
// // // //                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
// // // //                         {filteredProperties.map((property) => (
// // // //                           <PropertyCard
// // // //                             key={property._id}
// // // //                             {...transformPropertyForCard(property)}
// // // //                           />
// // // //                         ))}
// // // //                       </div>
// // // //                     ) : (
// // // //                       <div className="text-center py-12">
// // // //                         <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // // //                         </svg>
// // // //                         <h3 className="text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
// // // //                         <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// // // //                         <button
// // // //                           onClick={clearFilters}
// // // //                           className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// // // //                         >
// // // //                           Clear All Filters
// // // //                         </button>
// // // //                       </div>
// // // //                     )}
// // // //                   </>
// // // //                 ) : (
// // // //                   <MapView properties={filteredProperties} />
// // // //                 )}
// // // //               </>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }






























































// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import PropertyCard from '@/components/PropertyCard';
// // // // import SearchFilters from '@/components/SearchFilters';
// // // // import MapView from '@/components/MapView';

// // // // interface Property {
// // // //   id: number;
// // // //   title: string;
// // // //   location: string;
// // // //   price: number;
// // // //   image: string;
// // // //   rating: number;
// // // //   reviews: number;
// // // //   coordinates: {
// // // //     lat: number;
// // // //     lng: number;
// // // //   };
// // // //   amenities: string[];
// // // //   type: string;
// // // // }

// // // // const sampleProperties: Property[] = [
// // // //   {
// // // //     id: 1,
// // // //     title: "Luxury Apartment in City Center",
// // // //     location: "Victoria Island, Lagos",
// // // //     price: 120,
// // // //     image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
// // // //     rating: 4.8,
// // // //     reviews: 128,
// // // //     coordinates: { lat: 6.4281, lng: 3.4166 },
// // // //     amenities: ["WiFi", "Air Conditioning", "Pool", "Gym"],
// // // //     type: "apartment"
// // // //   },
// // // //   {
// // // //     id: 2,
// // // //     title: "Beachfront Villa",
// // // //     location: "Lekki, Lagos",
// // // //     price: 200,
// // // //     image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400",
// // // //     rating: 4.9,
// // // //     reviews: 89,
// // // //     coordinates: { lat: 6.4474, lng: 3.4733 },
// // // //     amenities: ["Beachfront", "Pool", "Parking", "Security"],
// // // //     type: "villa"
// // // //   },
// // // //   {
// // // //     id: 3,
// // // //     title: "Cozy Studio Apartment",
// // // //     location: "Ikeja, Lagos",
// // // //     price: 75,
// // // //     image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
// // // //     rating: 4.5,
// // // //     reviews: 64,
// // // //     coordinates: { lat: 6.6018, lng: 3.3515 },
// // // //     amenities: ["WiFi", "Kitchen", "Security"],
// // // //     type: "studio"
// // // //   },
// // // //   {
// // // //     id: 4,
// // // //     title: "Modern Penthouse",
// // // //     location: "Ikoyi, Lagos",
// // // //     price: 180,
// // // //     image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
// // // //     rating: 4.7,
// // // //     reviews: 92,
// // // //     coordinates: { lat: 6.4527, lng: 3.4351 },
// // // //     amenities: ["Pool", "Gym", "Concierge", "Parking"],
// // // //     type: "penthouse"
// // // //   },
// // // //   {
// // // //     id: 5,
// // // //     title: "Garden Cottage",
// // // //     location: "Surulere, Lagos",
// // // //     price: 65,
// // // //     image: "https://images.unsplash.com/photo-1575517111832-11a84da50959?w=400",
// // // //     rating: 4.6,
// // // //     reviews: 45,
// // // //     coordinates: { lat: 6.5010, lng: 3.3580 },
// // // //     amenities: ["Garden", "Parking", "Kitchen"],
// // // //     type: "cottage"
// // // //   },
// // // //   {
// // // //     id: 6,
// // // //     title: "Executive Serviced Apartment",
// // // //     location: "Yaba, Lagos",
// // // //     price: 95,
// // // //     image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
// // // //     rating: 4.4,
// // // //     reviews: 78,
// // // //     coordinates: { lat: 6.5095, lng: 3.3711 },
// // // //     amenities: ["WiFi", "Cleaning", "Security", "Concierge"],
// // // //     type: "apartment"
// // // //   }
// // // // ];

// // // // export default function PropertiesPage() {
// // // //   const [properties, setProperties] = useState<Property[]>(sampleProperties);
// // // //   const [filteredProperties, setFilteredProperties] = useState<Property[]>(sampleProperties);
// // // //   const [searchQuery, setSearchQuery] = useState('');
// // // //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]); // Fix: Specify tuple type
// // // //   const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
// // // //   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
// // // //   const [sortBy, setSortBy] = useState('recommended');
// // // //   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
// // // //   const [loading, setLoading] = useState(false);

// // // //   // All available filters
// // // //   const propertyTypes = ['apartment', 'villa', 'studio', 'penthouse', 'cottage'];
// // // //   const allAmenities = ['WiFi', 'Air Conditioning', 'Pool', 'Gym', 'Parking', 'Security', 'Beachfront', 'Kitchen', 'Concierge', 'Cleaning'];

// // // //   // Apply filters
// // // //   useEffect(() => {
// // // //     setLoading(true);
    
// // // //     let filtered = properties.filter(property => {
// // // //       // Search query filter
// // // //       const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // //                            property.location.toLowerCase().includes(searchQuery.toLowerCase());
      
// // // //       // Price range filter
// // // //       const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
      
// // // //       // Property type filter
// // // //       const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
      
// // // //       // Amenities filter
// // // //       const matchesAmenities = selectedAmenities.length === 0 || 
// // // //                               selectedAmenities.every(amenity => property.amenities.includes(amenity));
      
// // // //       return matchesSearch && matchesPrice && matchesType && matchesAmenities;
// // // //     });

// // // //     // Apply sorting
// // // //     switch (sortBy) {
// // // //       case 'price-low':
// // // //         filtered.sort((a, b) => a.price - b.price);
// // // //         break;
// // // //       case 'price-high':
// // // //         filtered.sort((a, b) => b.price - a.price);
// // // //         break;
// // // //       case 'rating':
// // // //         filtered.sort((a, b) => b.rating - a.rating);
// // // //         break;
// // // //       case 'reviews':
// // // //         filtered.sort((a, b) => b.reviews - a.reviews);
// // // //         break;
// // // //       default:
// // // //         // Recommended (default ordering)
// // // //         break;
// // // //     }

// // // //     setFilteredProperties(filtered);
// // // //     setLoading(false);
// // // //   }, [searchQuery, priceRange, selectedTypes, selectedAmenities, sortBy, properties]);

// // // //   const clearFilters = () => {
// // // //     setSearchQuery('');
// // // //     setPriceRange([0, 500]);
// // // //     setSelectedTypes([]);
// // // //     setSelectedAmenities([]);
// // // //     setSortBy('recommended');
// // // //   };

// // // //   const activeFiltersCount = [
// // // //     searchQuery ? 1 : 0,
// // // //     priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
// // // //     selectedTypes.length,
// // // //     selectedAmenities.length
// // // //   ].reduce((a, b) => a + b, 0);

// // // //   // Fix: Create a proper handler for price range changes
// // // //   const handlePriceRangeChange = (range: [number, number]) => {
// // // //     setPriceRange(range);
// // // //   };

// // // //   return (
// // // //     <div className="min-h-screen bg-gray-50">
// // // //       {/* Header */}
// // // //       <div className="bg-[#383a3c] text-[#fcfeff] py-16">
// // // //         <div className="container mx-auto px-4">
// // // //           <h1 className="text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
// // // //           <p className="text-xl opacity-90">Discover amazing shortlet apartments across Lagos</p>
// // // //         </div>
// // // //       </div>

// // // //       <div className="container mx-auto px-4 py-8">
// // // //         {/* Search and Controls Bar */}
// // // //         <div className="flex flex-col lg:flex-row gap-4 mb-6">
// // // //           {/* Search Input */}
// // // //           <div className="flex-1">
// // // //             <div className="relative">
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="Search by location or property name..."
// // // //                 value={searchQuery}
// // // //                 onChange={(e) => setSearchQuery(e.target.value)}
// // // //                 className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //               />
// // // //               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
// // // //                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// // // //                 </svg>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* View Toggle and Sort */}
// // // //           <div className="flex gap-4">
// // // //             <select
// // // //               value={sortBy}
// // // //               onChange={(e) => setSortBy(e.target.value)}
// // // //               className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// // // //             >
// // // //               <option value="recommended">Recommended</option>
// // // //               <option value="price-low">Price: Low to High</option>
// // // //               <option value="price-high">Price: High to Low</option>
// // // //               <option value="rating">Highest Rated</option>
// // // //               <option value="reviews">Most Reviews</option>
// // // //             </select>

// // // //             <div className="flex border border-gray-300 rounded-lg overflow-hidden">
// // // //               <button
// // // //                 onClick={() => setViewMode('grid')}
// // // //                 className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // // //               >
// // // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
// // // //                 </svg>
// // // //               </button>
// // // //               <button
// // // //                 onClick={() => setViewMode('map')}
// // // //                 className={`px-4 py-3 ${viewMode === 'map' ? 'bg-[#f06123] text-white' : 'bg-white text-gray-600'}`}
// // // //               >
// // // //                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
// // // //                 </svg>
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         <div className="flex flex-col lg:flex-row gap-8">
// // // //           {/* Filters Sidebar */}
// // // //           <div className="lg:w-80">
// // // //             <SearchFilters
// // // //               priceRange={priceRange}
// // // //               onPriceRangeChange={handlePriceRangeChange} 
// // // //               selectedTypes={selectedTypes}
// // // //               onTypesChange={setSelectedTypes}
// // // //               selectedAmenities={selectedAmenities}
// // // //               onAmenitiesChange={setSelectedAmenities}
// // // //               propertyTypes={propertyTypes}
// // // //               allAmenities={allAmenities}
// // // //               activeFiltersCount={activeFiltersCount}
// // // //               onClearFilters={clearFilters}
// // // //             />
// // // //           </div>

// // // //           {/* Content Area */}
// // // //           <div className="flex-1">
// // // //             {/* Results Header */}
// // // //             <div className="flex justify-between items-center mb-6">
// // // //               <div>
// // // //                 <h2 className="text-2xl font-semibold text-[#383a3c]">
// // // //                   {filteredProperties.length} Properties Found
// // // //                 </h2>
// // // //                 {activeFiltersCount > 0 && (
// // // //                   <p className="text-gray-600 text-sm mt-1">
// // // //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// // // //                   </p>
// // // //                 )}
// // // //               </div>
// // // //             </div>

// // // //             {/* Loading State */}
// // // //             {loading && (
// // // //               <div className="flex justify-center items-center py-12">
// // // //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// // // //               </div>
// // // //             )}

// // // //             {/* Results */}
// // // //             {!loading && (
// // // //               <>
// // // //                 {viewMode === 'grid' ? (
// // // //                   <>
// // // //                     {filteredProperties.length > 0 ? (
// // // //                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
// // // //                         {filteredProperties.map((property) => (
// // // //                           <PropertyCard
// // // //                             key={property.id}
// // // //                             id={property.id}
// // // //                             title={property.title}
// // // //                             location={property.location}
// // // //                             price={property.price}
// // // //                             image={property.image}
// // // //                             rating={property.rating}
// // // //                           />
// // // //                         ))}
// // // //                       </div>
// // // //                     ) : (
// // // //                       <div className="text-center py-12">
// // // //                         <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// // // //                         </svg>
// // // //                         <h3 className="text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
// // // //                         <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// // // //                         <button
// // // //                           onClick={clearFilters}
// // // //                           className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// // // //                         >
// // // //                           Clear All Filters
// // // //                         </button>
// // // //                       </div>
// // // //                     )}
// // // //                   </>
// // // //                 ) : (
// // // //                   <MapView properties={filteredProperties} />
// // // //                 )}
// // // //               </>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }




