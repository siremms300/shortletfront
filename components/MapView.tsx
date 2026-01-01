'use client';

import { useState, useMemo } from 'react';

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
  type: string;
  specifications: {
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
  };
}

interface MapViewProps {
  properties: Property[];
}

export default function MapView({ properties }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Get unique locations
  const locations = useMemo(() => {
    return [...new Set(properties.map(p => p.location))].sort();
  }, [properties]);

  // Filter properties by location
  const filteredProperties = selectedLocation === 'all' 
    ? properties 
    : properties.filter(p => p.location === selectedLocation);

  // Get property count by location
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(p => {
      counts[p.location] = (counts[p.location] || 0) + 1;
    });
    return counts;
  }, [properties]);

  const getPropertyImage = (property: Property) => {
    return property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#383a3c]">Properties Map</h2>
            <p className="text-gray-600 text-sm mt-1">
              {properties.length} properties in {locations.length} areas
            </p>
          </div>
          
          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] min-w-48"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>
                {location} ({locationCounts[location]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simple Location Visualization */}
      <div className="p-6">
        {/* Location Bars */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties by Location</h3>
          <div className="space-y-3">
            {locations.map(location => {
              const count = locationCounts[location];
              const percentage = (count / properties.length) * 100;
              const isSelected = selectedLocation === location;
              
              return (
                <div
                  key={location}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-[#f06123] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLocation(isSelected ? 'all' : location)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{location}</span>
                    <span className="text-sm text-gray-600">{count} properties</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#f06123] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Properties Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedLocation === 'all' 
              ? `All Properties (${filteredProperties.length})`
              : `Properties in ${selectedLocation} (${filteredProperties.length})`
            }
          </h3>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🏠</div>
              <p className="text-gray-500">No properties found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={getPropertyImage(property)}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-[#f06123] text-white px-2 py-1 rounded text-sm font-semibold">
                      ${property.price}/night
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {property.title}
                    </h4>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <span className="mr-3">📍 {property.location}</span>
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                        {property.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>🛏️ {property.specifications.bedrooms} beds</span>
                      <span>🚿 {property.specifications.bathrooms} baths</span>
                      <span>👥 {property.specifications.maxGuests} guests</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {property.rating || 'New'}
                        </span>
                      </div>
                      <a
                        href={`/properties/${property._id}`}
                        className="bg-[#f06123] text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
































































// 'use client';

// import { useState, useEffect } from 'react';

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
//   type: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//   };
//   coordinates?: {
//     lat: number;
//     lng: number;
//   };
// }

// interface MapViewProps {
//   properties: Property[];
// }

// // Default coordinates for Lagos, Nigeria
// const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 };

// // Generate realistic coordinates around Lagos for demo
// const generateCoordinates = (index: number, total: number) => {
//   const baseLat = 6.5244;
//   const baseLng = 3.3792;
//   const spread = 0.1; // Spread in degrees
  
//   // Generate positions in a spiral pattern for better distribution
//   const angle = (index * 2 * Math.PI) / total;
//   const radius = spread * Math.sqrt(index / total);
  
//   return {
//     lat: baseLat + radius * Math.cos(angle),
//     lng: baseLng + radius * Math.sin(angle)
//   };
// };

// export default function MapView({ properties }: MapViewProps) {
//   const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
//   const [mapLoaded, setMapLoaded] = useState(false);

//   // Generate coordinates for properties that don't have them
//   const propertiesWithCoords = properties.map((property, index) => ({
//     ...property,
//     coordinates: property.coordinates || generateCoordinates(index, properties.length)
//   }));

//   // Load Google Maps script
//   useEffect(() => {
//     if (!window.google) {
//       const script = document.createElement('script');
//       script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`;
//       script.async = true;
//       script.defer = true;
//       script.onload = () => setMapLoaded(true);
//       document.head.appendChild(script);
//     } else {
//       setMapLoaded(true);
//     }
//   }, []);

//   // Initialize map when component mounts and Google Maps is loaded
//   useEffect(() => {
//     if (!mapLoaded || propertiesWithCoords.length === 0) return;

//     const mapElement = document.getElementById('map');
//     if (!mapElement) return;

//     const map = new google.maps.Map(mapElement, {
//       center: DEFAULT_CENTER,
//       zoom: 11,
//       styles: [
//         {
//           featureType: 'poi',
//           elementType: 'labels',
//           stylers: [{ visibility: 'off' }]
//         },
//         {
//           featureType: 'transit',
//           elementType: 'labels',
//           stylers: [{ visibility: 'off' }]
//         }
//       ],
//       mapTypeControl: false,
//       streetViewControl: false,
//       fullscreenControl: true,
//       zoomControl: true
//     });

//     // Create markers for each property
//     const markers = propertiesWithCoords.map(property => {
//       const marker = new google.maps.Marker({
//         position: property.coordinates,
//         map: map,
//         title: property.title,
//         icon: {
//           url: 'data:image/svg+xml;base64,' + btoa(`
//             <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <circle cx="20" cy="20" r="18" fill="#f06123" stroke="white" stroke-width="2"/>
//               <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">$${property.price}</text>
//             </svg>
//           `),
//           scaledSize: new google.maps.Size(40, 40),
//           anchor: new google.maps.Point(20, 20)
//         }
//       });

//       const infoWindow = new google.maps.InfoWindow({
//         content: `
//           <div class="p-3 max-w-xs">
//             <img src="${property.images[0]?.url || '/default-property.jpg'}" 
//                  alt="${property.title}" 
//                  class="w-full h-24 object-cover rounded-lg mb-2">
//             <h4 class="font-semibold text-sm text-gray-900 mb-1">${property.title}</h4>
//             <p class="text-xs text-gray-600 mb-1">${property.location}</p>
//             <div class="flex justify-between items-center">
//               <span class="font-bold text-[#f06123]">$${property.price}/night</span>
//               <div class="flex items-center">
//                 <span class="text-yellow-500 text-xs">★</span>
//                 <span class="text-xs text-gray-600 ml-1">${property.rating || 'New'}</span>
//               </div>
//             </div>
//             <a href="/properties/${property._id}" 
//                class="block mt-2 text-center bg-[#f06123] text-white text-xs py-1 px-3 rounded hover:bg-orange-600 transition-colors">
//               View Details
//             </a>
//           </div>
//         `
//       });

//       marker.addListener('click', () => {
//         infoWindow.open(map, marker);
//         setSelectedProperty(property);
//       });

//       return { marker, infoWindow };
//     });

//     // Fit map to show all markers
//     if (markers.length > 0) {
//       const bounds = new google.maps.LatLngBounds();
//       markers.forEach(({ marker }) => bounds.extend(marker.getPosition()!));
//       map.fitBounds(bounds, { padding: 50 });
//     }

//     // Cleanup function
//     return () => {
//       markers.forEach(({ marker, infoWindow }) => {
//         infoWindow.close();
//         marker.setMap(null);
//       });
//     };
//   }, [mapLoaded, propertiesWithCoords]);

//   const handlePropertyClick = (property: Property) => {
//     setSelectedProperty(property);
//     // Scroll to property details
//     document.getElementById(`property-${property._id}`)?.scrollIntoView({
//       behavior: 'smooth'
//     });
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//       {/* Header */}
//       <div className="p-6 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-[#383a3c]">Map View</h3>
//             <p className="text-sm text-gray-600 mt-1">
//               {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} found in Lagos
//             </p>
//           </div>
//           <div className="flex items-center space-x-2 text-sm text-gray-600">
//             <div className="flex items-center">
//               <div className="w-3 h-3 bg-[#f06123] rounded-full mr-2"></div>
//               <span>Property</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-col lg:flex-row h-[600px]">
//         {/* Map Container */}
//         <div className="flex-1 relative">
//           <div 
//             id="map" 
//             className="w-full h-full"
//           />
          
//           {/* Loading State */}
//           {!mapLoaded && (
//             <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
//                 <p className="text-gray-600">Loading map...</p>
//               </div>
//             </div>
//           )}

//           {/* Fallback for no Google Maps */}
//           {mapLoaded && !window.google && (
//             <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
//               <div className="text-center p-6">
//                 <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
//                 </svg>
//                 <h4 className="text-lg font-semibold text-gray-600 mb-2">Map Unavailable</h4>
//                 <p className="text-gray-500 mb-4">Google Maps could not be loaded.</p>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-md mx-auto">
//                   {propertiesWithCoords.slice(0, 6).map((property, index) => (
//                     <div
//                       key={property._id}
//                       className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
//                       onClick={() => handlePropertyClick(property)}
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="w-6 h-6 bg-[#f06123] rounded-full flex items-center justify-center text-white text-xs font-bold">
//                           ${property.price}
//                         </div>
//                       </div>
//                       <p className="text-xs font-medium text-gray-900 truncate">{property.title}</p>
//                       <p className="text-xs text-gray-600 truncate">{property.location}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Property List Sidebar */}
//         <div className="lg:w-80 border-l border-gray-200 overflow-y-auto">
//           <div className="p-4">
//             <h4 className="font-semibold text-gray-900 mb-4">Properties on Map</h4>
//             <div className="space-y-3">
//               {propertiesWithCoords.map((property) => (
//                 <div
//                   key={property._id}
//                   id={`property-${property._id}`}
//                   className={`p-3 border rounded-lg cursor-pointer transition-all ${
//                     selectedProperty?._id === property._id
//                       ? 'border-[#f06123] bg-orange-50'
//                       : 'border-gray-200 hover:border-gray-300'
//                   }`}
//                   onClick={() => handlePropertyClick(property)}
//                 >
//                   <div className="flex space-x-3">
//                     <img
//                       src={property.images[0]?.url || '/default-property.jpg'}
//                       alt={property.title}
//                       className="w-16 h-12 object-cover rounded"
//                     />
//                     <div className="flex-1 min-w-0">
//                       <h5 className="font-medium text-sm text-gray-900 truncate">
//                         {property.title}
//                       </h5>
//                       <p className="text-xs text-gray-600 truncate">{property.location}</p>
//                       <div className="flex justify-between items-center mt-1">
//                         <span className="font-bold text-[#f06123] text-sm">
//                           ${property.price}
//                           <span className="text-gray-500 font-normal text-xs">/night</span>
//                         </span>
//                         <div className="flex items-center">
//                           <span className="text-yellow-500 text-xs">★</span>
//                           <span className="text-xs text-gray-600 ml-1">
//                             {property.rating || 'New'}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center justify-between mt-2">
//                     <div className="flex items-center space-x-2 text-xs text-gray-600">
//                       <span>{property.specifications.bedrooms} bed</span>
//                       <span>•</span>
//                       <span>{property.specifications.bathrooms} bath</span>
//                       <span>•</span>
//                       <span>{property.specifications.maxGuests} guests</span>
//                     </div>
//                     <a
//                       href={`/properties/${property._id}`}
//                       className="text-xs text-[#f06123] hover:text-orange-600 font-medium"
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       View →
//                     </a>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Map Controls Info */}
//       <div className="p-4 border-t border-gray-200 bg-gray-50">
//         <div className="flex items-center justify-between text-sm text-gray-600">
//           <div className="flex items-center space-x-4">
//             <span>💡 Click on map markers to view property details</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <span>📍 Lagos, Nigeria</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
































































// 'use client';

// interface Property {
//   id: number;
//   title: string;
//   location: string;
//   price: number;
//   image: string;
//   rating: number;
//   coordinates: {
//     lat: number;
//     lng: number;
//   };
// }

// interface MapViewProps {
//   properties: Property[];
// }

// export default function MapView({ properties }: MapViewProps) {
//   // For now, we'll create a static map with markers
//   // In a real app, you'd integrate with Google Maps or Mapbox
//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold text-[#383a3c]">Map View</h3>
//         <span className="text-sm text-gray-600">{properties.length} properties</span>
//       </div>
      
//       {/* Map Container */}
//       <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
//         {/* Static Map Background */}
//         <div 
//           className="absolute inset-0 bg-cover bg-center"
//           style={{
//             backgroundImage: 'url("https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800")'
//           }}
//         />
        
//         {/* Map Overlay */}
//         <div className="absolute inset-0 bg-blue-900 bg-opacity-20" />
        
//         {/* Property Markers */}
//         {properties.map((property, index) => {
//           // Simple positioning for demo
//           const positions = [
//             { top: '30%', left: '40%' },
//             { top: '50%', left: '60%' },
//             { top: '70%', left: '35%' },
//             { top: '40%', left: '70%' },
//             { top: '60%', left: '25%' },
//             { top: '20%', left: '50%' },
//           ];
          
//           const position = positions[index % positions.length];
          
//           return (
//             <div
//               key={property.id}
//               className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
//               style={position}
//             >
//               {/* Map Marker */}
//               <div className="relative">
//                 <div className="w-8 h-8 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transform group-hover:scale-110 transition-transform duration-200">
//                   ${property.price}
//                 </div>
//                 <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#f06123]"></div>
                
//                 {/* Tooltip */}
//                 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-white rounded-lg shadow-xl p-3 z-10">
//                   <img
//                     src={property.image}
//                     alt={property.title}
//                     className="w-full h-20 object-cover rounded-md mb-2"
//                   />
//                   <h4 className="font-semibold text-sm text-[#383a3c] mb-1">{property.title}</h4>
//                   <p className="text-xs text-gray-600 mb-1">{property.location}</p>
//                   <div className="flex justify-between items-center">
//                     <span className="font-bold text-[#f06123]">${property.price}/night</span>
//                     <div className="flex items-center">
//                       <span className="text-yellow-500 text-xs">★</span>
//                       <span className="text-xs text-gray-600 ml-1">{property.rating}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
      
//       {/* Map Legend */}
//       <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
//         <div className="flex items-center">
//           <div className="w-3 h-3 bg-[#f06123] rounded-full mr-2"></div>
//           <span>Property Location</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//           <span>Water Bodies</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//           <span>Parks & Gardens</span>
//         </div>
//       </div>
//     </div>
//   );
// }


