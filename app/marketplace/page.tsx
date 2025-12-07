// app/marketplace/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { vendorAPI } from '@/lib/api';
import { useVendor } from '@/contexts/VendorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/vendor/ProductCard';
import CartSidebar from '@/components/vendor/CartSidebar';
import VendorFilter from '@/components/vendor/VendorFilter';
import Link from 'next/link';

interface VendorProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: Array<{ url: string }>;
  vendor: {
    _id: string;
    businessName: string;
    description: string;
    rating: number;
  };
  isAvailable: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  preparationTime: number;
  tags: string[];
}

interface Vendor {
  _id: string;
  businessName: string;
  description: string;
  services: string[];
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const { cart, getCartItemCount } = useVendor();
  const { bookings, loading: bookingsLoading, getUserBookings } = useBooking();
  const router = useRouter();
  
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCart, setShowCart] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'food',
    'beverages', 
    'essentials',
    'amenities',
    'concierge',
    'other'
  ];

  // Get confirmed, paid bookings
  const confirmedBookings = bookings.filter(booking => {
    return (
      booking.bookingStatus === 'confirmed' &&
      booking.paymentStatus === 'paid'
    );
  });

  const hasConfirmedBooking = confirmedBookings.length > 0;

  // Debug logging
  useEffect(() => {
    console.log('=== MARKETPLACE DEBUG ===');
    console.log('User:', user);
    console.log('All bookings from context:', bookings);
    console.log('Bookings loading:', bookingsLoading);
    console.log('Confirmed bookings:', confirmedBookings);
    console.log('Has confirmed booking:', hasConfirmedBooking);
    console.log('=== END DEBUG ===');
  }, [bookings, confirmedBookings, hasConfirmedBooking, user, bookingsLoading]);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, priceRange, searchQuery]);

  const fetchMarketplaceData = async () => {
    try {
      setProductsLoading(true);
      setError('');

      const productsResponse = await vendorAPI.getAvailableProducts();
      setProducts(productsResponse.products || []);
      
      // Set price range based on actual products
      if (productsResponse.products && productsResponse.products.length > 0) {
        const prices = productsResponse.products.map(p => p.price);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange([minPrice, maxPrice]);
      }

    } catch (error: any) {
      console.error('Error fetching marketplace data:', error);
      setError(error.message || 'Failed to load marketplace');
    } finally {
      setProductsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: VendorProduct) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasConfirmedBooking) {
      alert('You need a confirmed, paid booking to place orders in the marketplace. Please complete your booking payment first.');
      router.push('/dashboard/bookings');
      return;
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 100000]);
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedCategory ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0,
    searchQuery ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const handleRefreshBookings = async () => {
    try {
      console.log('Manually refreshing bookings...');
      await getUserBookings();
    } catch (error) {
      console.error('Failed to refresh bookings:', error);
    }
  };

  const isLoading = productsLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
            <span className="ml-3 text-gray-600">Loading marketplace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Vendor Marketplace</h1>
          <p className="text-lg md:text-xl opacity-90">
            Order food, essentials, and services during your stay
          </p>
          
          {/* Booking Requirement Notice */}
          {!hasConfirmedBooking && (
            <div className="mt-4 bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-yellow-100 font-medium">
                    You need a confirmed booking to place orders
                  </p>
                  <p className="text-yellow-200 text-sm mt-1">
                    Complete your booking payment to access our vendor services
                  </p>
                </div>
              </div>
              <div className="mt-3 flex space-x-3">
                <Link
                  href="/dashboard/bookings"
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-200 text-sm"
                >
                  Complete Booking
                </Link>
                <button
                  onClick={handleRefreshBookings}
                  className="border border-yellow-400 text-yellow-100 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 hover:bg-opacity-20 transition duration-200 text-sm"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                onClick={fetchMarketplaceData}
                className="text-red-700 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <VendorFilter
              categories={categories}
              vendors={[]}
              selectedCategory={selectedCategory}
              selectedVendor={''}
              priceRange={priceRange}
              searchQuery={searchQuery}
              onCategoryChange={setSelectedCategory}
              onVendorChange={() => {}}
              onPriceRangeChange={setPriceRange}
              onSearchChange={setSearchQuery}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />

            {/* Confirmed Bookings Info */}
            {hasConfirmedBooking && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Your Bookings
                </h3>
                <div className="space-y-2">
                  {confirmedBookings.map(booking => {
                    const today = new Date();
                    const checkIn = new Date(booking.checkIn);
                    const checkOut = new Date(booking.checkOut);
                    const isActiveStay = today >= checkIn && today <= checkOut;
                    
                    return (
                      <div key={booking._id} className="text-sm text-green-700">
                        <div className="font-medium">{booking.property.title}</div>
                        <div className="text-xs">
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                        <div className={`text-xs mt-1 ${isActiveStay ? 'text-green-600' : 'text-blue-600'}`}>
                          {isActiveStay ? '✓ Active stay' : '✓ Upcoming stay'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header Bar */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#383a3c]">
                  {filteredProducts.length} Products Available
                </h2>
                {activeFiltersCount > 0 && (
                  <p className="text-gray-600 text-sm mt-1">
                    {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Refresh Bookings Button */}
                <button
                  onClick={handleRefreshBookings}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Bookings
                </button>

                {/* Cart Button - Only show if user has confirmed booking */}
                {hasConfirmedBooking && (
                  <button
                    onClick={() => setShowCart(true)}
                    className="relative bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    View Cart
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {getCartItemCount()}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    disabled={!hasConfirmedBooking}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
                <button
                  onClick={clearFilters}
                  className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={showCart} 
        onClose={() => setShowCart(false)}
      />
    </div>
  );
}




























































// // app/marketplace/page.tsx - Updated with confirmed booking access
// 'use client';

// import { useState, useEffect } from 'react';
// import { vendorAPI } from '@/lib/api';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { useBooking } from '@/contexts/BookingContext';
// import { useRouter } from 'next/navigation';
// import ProductCard from '@/components/vendor/ProductCard';
// import CartSidebar from '@/components/vendor/CartSidebar';
// import VendorFilter from '@/components/vendor/VendorFilter';
// import Link from 'next/link';

// interface VendorProduct {
//   _id: string;
//   name: string;
//   description: string;
//   category: string;
//   price: number;
//   images: Array<{ url: string }>;
//   vendor: {
//     _id: string;
//     businessName: string;
//     description: string;
//     rating: number;
//   };
//   isAvailable: boolean;
//   stockQuantity: number;
//   minOrderQuantity: number;
//   maxOrderQuantity: number;
//   preparationTime: number;
//   tags: string[];
// }

// interface Vendor {
//   _id: string;
//   businessName: string;
//   description: string;
//   services: string[];
// }

// export default function MarketplacePage() {
//   const { user } = useAuth();
//   const { cart, getCartItemCount } = useVendor();
//   const { bookings } = useBooking();
//   const router = useRouter();
  
//   const [products, setProducts] = useState<VendorProduct[]>([]);
//   const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [showCart, setShowCart] = useState(false);
  
//   // Filters
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
//   const [searchQuery, setSearchQuery] = useState('');

//   const categories = [
//     'food',
//     'beverages', 
//     'essentials',
//     'amenities',
//     'concierge',
//     'other'
//   ];

//   // Get confirmed, paid bookings (user can access marketplace for entire booking period)
//   const confirmedBookings = bookings.filter(booking => {
//     return (
//       booking.bookingStatus === 'confirmed' &&
//       booking.paymentStatus === 'paid'
//     );
//   });

//   const hasConfirmedBooking = confirmedBookings.length > 0;

//   // Debug logging
//   useEffect(() => {
//     console.log('All bookings:', bookings);
//     console.log('Confirmed bookings:', confirmedBookings);
//     console.log('Has confirmed booking:', hasConfirmedBooking);
    
//     bookings.forEach(booking => {
//       console.log(`Booking ${booking._id}:`, {
//         checkIn: booking.checkIn,
//         checkOut: booking.checkOut,
//         status: booking.bookingStatus,
//         payment: booking.paymentStatus,
//         isConfirmed: booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid'
//       });
//     });
//   }, [bookings, confirmedBookings, hasConfirmedBooking]);

//   useEffect(() => {
//     fetchMarketplaceData();
//   }, []);

//   useEffect(() => {
//     filterProducts();
//   }, [products, selectedCategory, priceRange, searchQuery]);

//   const fetchMarketplaceData = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       const productsResponse = await vendorAPI.getAvailableProducts();
//       setProducts(productsResponse.products || []);
      
//       // Set price range based on actual products
//       if (productsResponse.products && productsResponse.products.length > 0) {
//         const prices = productsResponse.products.map(p => p.price);
//         const minPrice = Math.floor(Math.min(...prices));
//         const maxPrice = Math.ceil(Math.max(...prices));
//         setPriceRange([minPrice, maxPrice]);
//       }

//     } catch (error: any) {
//       console.error('Error fetching marketplace data:', error);
//       setError(error.message || 'Failed to load marketplace');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterProducts = () => {
//     let filtered = products;

//     if (selectedCategory) {
//       filtered = filtered.filter(product => product.category === selectedCategory);
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(product =>
//         product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
//       );
//     }

//     filtered = filtered.filter(product =>
//       product.price >= priceRange[0] && product.price <= priceRange[1]
//     );

//     setFilteredProducts(filtered);
//   };

//   const handleAddToCart = (product: VendorProduct) => {
//     if (!user) {
//       router.push('/login');
//       return;
//     }

//     if (!hasConfirmedBooking) {
//       alert('You need a confirmed, paid booking to place orders in the marketplace. Please complete your booking payment first.');
//       router.push('/dashboard/bookings');
//       return;
//     }
//     // This will be handled by the ProductCard component through the context
//   };

//   const clearFilters = () => {
//     setSelectedCategory('');
//     setPriceRange([0, 100000]);
//     setSearchQuery('');
//   };

//   const activeFiltersCount = [
//     selectedCategory ? 1 : 0,
//     priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0,
//     searchQuery ? 1 : 0
//   ].reduce((a, b) => a + b, 0);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 py-8">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//             <span className="ml-3 text-gray-600">Loading marketplace...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
//         <div className="max-w-7xl mx-auto px-4">
//           <h1 className="text-3xl md:text-4xl font-bold mb-4">Vendor Marketplace</h1>
//           <p className="text-lg md:text-xl opacity-90">
//             Order food, essentials, and services during your stay
//           </p>
          
//           {/* Booking Requirement Notice */}
//           {!hasConfirmedBooking && (
//             <div className="mt-4 bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-4">
//               <div className="flex items-center">
//                 <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                 </svg>
//                 <div>
//                   <p className="text-yellow-100 font-medium">
//                     You need a confirmed booking to place orders
//                   </p>
//                   <p className="text-yellow-200 text-sm mt-1">
//                     Complete your booking payment to access our vendor services
//                   </p>
//                 </div>
//               </div>
//               <div className="mt-3 flex space-x-3">
//                 <Link
//                   href="/dashboard/bookings"
//                   className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-200 text-sm"
//                 >
//                   Complete Booking
//                 </Link>
//                 <Link
//                   href="/properties"
//                   className="border border-yellow-400 text-yellow-100 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 hover:bg-opacity-20 transition duration-200 text-sm"
//                 >
//                   Browse Properties
//                 </Link>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-8">
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
//                 onClick={fetchMarketplaceData}
//                 className="text-red-700 hover:text-red-800 font-medium"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Filters Sidebar */}
//           <div className="lg:w-80">
//             <VendorFilter
//               categories={categories}
//               vendors={[]} // Remove vendor filter for now
//               selectedCategory={selectedCategory}
//               selectedVendor={''}
//               priceRange={priceRange}
//               searchQuery={searchQuery}
//               onCategoryChange={setSelectedCategory}
//               onVendorChange={() => {}} // Empty function for vendor change
//               onPriceRangeChange={setPriceRange}
//               onSearchChange={setSearchQuery}
//               onClearFilters={clearFilters}
//               activeFiltersCount={activeFiltersCount}
//             />

//             {/* Confirmed Bookings Info */}
//             {hasConfirmedBooking && (
//               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
//                 <h3 className="font-semibold text-green-800 mb-2 flex items-center">
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                   </svg>
//                   Your Bookings
//                 </h3>
//                 <div className="space-y-2">
//                   {confirmedBookings.map(booking => {
//                     const today = new Date();
//                     const checkIn = new Date(booking.checkIn);
//                     const checkOut = new Date(booking.checkOut);
//                     const isActiveStay = today >= checkIn && today <= checkOut;
                    
//                     return (
//                       <div key={booking._id} className="text-sm text-green-700">
//                         <div className="font-medium">{booking.property.title}</div>
//                         <div className="text-xs">
//                           {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
//                         </div>
//                         <div className={`text-xs mt-1 ${isActiveStay ? 'text-green-600' : 'text-blue-600'}`}>
//                           {isActiveStay ? '✓ Active stay' : '✓ Upcoming stay'}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Main Content */}
//           <div className="flex-1">
//             {/* Header Bar */}
//             <div className="flex justify-between items-center mb-6">
//               <div>
//                 <h2 className="text-2xl font-bold text-[#383a3c]">
//                   {filteredProducts.length} Products Available
//                 </h2>
//                 {activeFiltersCount > 0 && (
//                   <p className="text-gray-600 text-sm mt-1">
//                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
//                   </p>
//                 )}
//               </div>

//               {/* Cart Button - Only show if user has confirmed booking */}
//               {hasConfirmedBooking && (
//                 <button
//                   onClick={() => setShowCart(true)}
//                   className="relative bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
//                 >
//                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                   </svg>
//                   View Cart
//                   {getCartItemCount() > 0 && (
//                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
//                       {getCartItemCount()}
//                     </span>
//                   )}
//                 </button>
//               )}
//             </div>

//             {/* Products Grid */}
//             {filteredProducts.length > 0 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {filteredProducts.map((product) => (
//                   <ProductCard
//                     key={product._id}
//                     product={product}
//                     onAddToCart={handleAddToCart}
//                     disabled={!hasConfirmedBooking}
//                   />
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <div className="text-6xl mb-4">🛒</div>
//                 <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
//                 <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
//                 <button
//                   onClick={clearFilters}
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//                 >
//                   Clear All Filters
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Cart Sidebar */}
//       <CartSidebar 
//         isOpen={showCart} 
//         onClose={() => setShowCart(false)}
//       />
//     </div>
//   );
// }
























// // // app/marketplace/page.tsx - Updated with flexible booking filter
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { vendorAPI } from '@/lib/api';
// // import { useVendor } from '@/contexts/VendorContext';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useRouter } from 'next/navigation';
// // import ProductCard from '@/components/vendor/ProductCard';
// // import CartSidebar from '@/components/vendor/CartSidebar';
// // import VendorFilter from '@/components/vendor/VendorFilter';
// // import Link from 'next/link';

// // interface VendorProduct {
// //   _id: string;
// //   name: string;
// //   description: string;
// //   category: string;
// //   price: number;
// //   images: Array<{ url: string }>;
// //   vendor: {
// //     _id: string;
// //     businessName: string;
// //     description: string;
// //     rating: number;
// //   };
// //   isAvailable: boolean;
// //   stockQuantity: number;
// //   minOrderQuantity: number;
// //   maxOrderQuantity: number;
// //   preparationTime: number;
// //   tags: string[];
// // }

// // interface Vendor {
// //   _id: string;
// //   businessName: string;
// //   description: string;
// //   services: string[];
// // }

// // export default function MarketplacePage() {
// //   const { user } = useAuth();
// //   const { cart, getCartItemCount } = useVendor();
// //   const { bookings } = useBooking();
// //   const router = useRouter();
  
// //   const [products, setProducts] = useState<VendorProduct[]>([]);
// //   const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [showCart, setShowCart] = useState(false);
  
// //   // Filters
// //   const [selectedCategory, setSelectedCategory] = useState('');
// //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
// //   const [searchQuery, setSearchQuery] = useState('');

// //   const categories = [
// //     'food',
// //     'beverages', 
// //     'essentials',
// //     'amenities',
// //     'concierge',
// //     'other'
// //   ];

// //   // Get active bookings (current stays including today)
// //   const activeBookings = bookings.filter(booking => {
// //     const today = new Date();
// //     const checkIn = new Date(booking.checkIn);
// //     const checkOut = new Date(booking.checkOut);
    
// //     // User can access marketplace if:
// //     // 1. They have a confirmed, paid booking
// //     // 2. Today is between check-in and check-out dates (inclusive)
// //     return (
// //       booking.bookingStatus === 'confirmed' &&
// //       booking.paymentStatus === 'paid' &&
// //       today >= checkIn && 
// //       today <= checkOut
// //     );
// //   });

// //   const hasActiveBooking = activeBookings.length > 0;

// //   // Debug logging
// //   useEffect(() => {
// //     console.log('All bookings:', bookings);
// //     console.log('Active bookings filter:', activeBookings);
// //     console.log('Today:', new Date());
// //     console.log('Has active booking:', hasActiveBooking);
    
// //     bookings.forEach(booking => {
// //       const today = new Date();
// //       const checkIn = new Date(booking.checkIn);
// //       const checkOut = new Date(booking.checkOut);
      
// //       console.log(`Booking ${booking._id}:`, {
// //         checkIn: booking.checkIn,
// //         checkOut: booking.checkOut,
// //         status: booking.bookingStatus,
// //         payment: booking.paymentStatus,
// //         isTodayInRange: today >= checkIn && today <= checkOut,
// //         isActive: booking.bookingStatus === 'confirmed' && 
// //                  booking.paymentStatus === 'paid' &&
// //                  today >= checkIn && 
// //                  today <= checkOut
// //       });
// //     });
// //   }, [bookings, activeBookings, hasActiveBooking]);

// //   useEffect(() => {
// //     fetchMarketplaceData();
// //   }, []);

// //   useEffect(() => {
// //     filterProducts();
// //   }, [products, selectedCategory, priceRange, searchQuery]);

// //   const fetchMarketplaceData = async () => {
// //     try {
// //       setLoading(true);
// //       setError('');

// //       const productsResponse = await vendorAPI.getAvailableProducts();
// //       setProducts(productsResponse.products || []);
      
// //       // Set price range based on actual products
// //       if (productsResponse.products && productsResponse.products.length > 0) {
// //         const prices = productsResponse.products.map(p => p.price);
// //         const minPrice = Math.floor(Math.min(...prices));
// //         const maxPrice = Math.ceil(Math.max(...prices));
// //         setPriceRange([minPrice, maxPrice]);
// //       }

// //     } catch (error: any) {
// //       console.error('Error fetching marketplace data:', error);
// //       setError(error.message || 'Failed to load marketplace');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const filterProducts = () => {
// //     let filtered = products;

// //     if (selectedCategory) {
// //       filtered = filtered.filter(product => product.category === selectedCategory);
// //     }

// //     if (searchQuery) {
// //       filtered = filtered.filter(product =>
// //         product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
// //       );
// //     }

// //     filtered = filtered.filter(product =>
// //       product.price >= priceRange[0] && product.price <= priceRange[1]
// //     );

// //     setFilteredProducts(filtered);
// //   };

// //   const handleAddToCart = (product: VendorProduct) => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }

// //     if (!hasActiveBooking) {
// //       alert('You need an active, confirmed booking to place orders in the marketplace. Please book a property first.');
// //       router.push('/properties');
// //       return;
// //     }
// //     // This will be handled by the ProductCard component through the context
// //   };

// //   const clearFilters = () => {
// //     setSelectedCategory('');
// //     setPriceRange([0, 100000]);
// //     setSearchQuery('');
// //   };

// //   const activeFiltersCount = [
// //     selectedCategory ? 1 : 0,
// //     priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0,
// //     searchQuery ? 1 : 0
// //   ].reduce((a, b) => a + b, 0);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gray-50">
// //         <div className="max-w-7xl mx-auto px-4 py-8">
// //           <div className="flex items-center justify-center py-12">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// //             <span className="ml-3 text-gray-600">Loading marketplace...</span>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Header */}
// //       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
// //         <div className="max-w-7xl mx-auto px-4">
// //           <h1 className="text-3xl md:text-4xl font-bold mb-4">Vendor Marketplace</h1>
// //           <p className="text-lg md:text-xl opacity-90">
// //             Order food, essentials, and services during your stay
// //           </p>
          
// //           {/* Booking Requirement Notice */}
// //           {!hasActiveBooking && (
// //             <div className="mt-4 bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-4">
// //               <div className="flex items-center">
// //                 <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// //                 </svg>
// //                 <div>
// //                   <p className="text-yellow-100 font-medium">
// //                     You need an active booking to place orders
// //                   </p>
// //                   <p className="text-yellow-200 text-sm mt-1">
// //                     Book a property first to access our vendor services
// //                   </p>
// //                 </div>
// //               </div>
// //               <div className="mt-3 flex space-x-3">
// //                 <Link
// //                   href="/properties"
// //                   className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-200 text-sm"
// //                 >
// //                   Browse Properties
// //                 </Link>
// //                 <Link
// //                   href="/dashboard/bookings"
// //                   className="border border-yellow-400 text-yellow-100 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 hover:bg-opacity-20 transition duration-200 text-sm"
// //                 >
// //                   Check My Bookings
// //                 </Link>
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-4 py-8">
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
// //                 onClick={fetchMarketplaceData}
// //                 className="text-red-700 hover:text-red-800 font-medium"
// //               >
// //                 Retry
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         <div className="flex flex-col lg:flex-row gap-8">
// //           {/* Filters Sidebar */}
// //           <div className="lg:w-80">
// //             <VendorFilter
// //               categories={categories}
// //               vendors={[]} // Remove vendor filter for now
// //               selectedCategory={selectedCategory}
// //               selectedVendor={''}
// //               priceRange={priceRange}
// //               searchQuery={searchQuery}
// //               onCategoryChange={setSelectedCategory}
// //               onVendorChange={() => {}} // Empty function for vendor change
// //               onPriceRangeChange={setPriceRange}
// //               onSearchChange={setSearchQuery}
// //               onClearFilters={clearFilters}
// //               activeFiltersCount={activeFiltersCount}
// //             />

// //             {/* Active Bookings Info */}
// //             {hasActiveBooking && (
// //               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
// //                 <h3 className="font-semibold text-green-800 mb-2 flex items-center">
// //                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
// //                   </svg>
// //                   Active Bookings
// //                 </h3>
// //                 <div className="space-y-2">
// //                   {activeBookings.map(booking => (
// //                     <div key={booking._id} className="text-sm text-green-700">
// //                       <div className="font-medium">{booking.property.title}</div>
// //                       <div className="text-xs">
// //                         {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
// //                       </div>
// //                       <div className="text-xs text-green-600 mt-1">
// //                         ✓ Active stay
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             )}
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             {/* Header Bar */}
// //             <div className="flex justify-between items-center mb-6">
// //               <div>
// //                 <h2 className="text-2xl font-bold text-[#383a3c]">
// //                   {filteredProducts.length} Products Available
// //                 </h2>
// //                 {activeFiltersCount > 0 && (
// //                   <p className="text-gray-600 text-sm mt-1">
// //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// //                   </p>
// //                 )}
// //               </div>

// //               {/* Cart Button - Only show if user has active booking */}
// //               {hasActiveBooking && (
// //                 <button
// //                   onClick={() => setShowCart(true)}
// //                   className="relative bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
// //                 >
// //                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
// //                   </svg>
// //                   View Cart
// //                   {getCartItemCount() > 0 && (
// //                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
// //                       {getCartItemCount()}
// //                     </span>
// //                   )}
// //                 </button>
// //               )}
// //             </div>

// //             {/* Products Grid */}
// //             {filteredProducts.length > 0 ? (
// //               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //                 {filteredProducts.map((product) => (
// //                   <ProductCard
// //                     key={product._id}
// //                     product={product}
// //                     onAddToCart={handleAddToCart}
// //                     disabled={!hasActiveBooking}
// //                   />
// //                 ))}
// //               </div>
// //             ) : (
// //               <div className="text-center py-12">
// //                 <div className="text-6xl mb-4">🛒</div>
// //                 <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
// //                 <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// //                 <button
// //                   onClick={clearFilters}
// //                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //                 >
// //                   Clear All Filters
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Cart Sidebar */}
// //       <CartSidebar 
// //         isOpen={showCart} 
// //         onClose={() => setShowCart(false)}
// //       />
// //     </div>
// //   );
// // }








































// // app/marketplace/page.tsx - Updated
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { vendorAPI } from '@/lib/api';
// // import { useVendor } from '@/contexts/VendorContext';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useRouter } from 'next/navigation';
// // import ProductCard from '@/components/vendor/ProductCard';
// // import CartSidebar from '@/components/vendor/CartSidebar';
// // import VendorFilter from '@/components/vendor/VendorFilter';
// // import Link from 'next/link';


// // interface VendorProduct {
// //   _id: string;
// //   name: string;
// //   description: string;
// //   category: string;
// //   price: number;
// //   images: Array<{ url: string }>;
// //   vendor: {
// //     _id: string;
// //     businessName: string;
// //     description: string;
// //     rating: number;
// //   };
// //   isAvailable: boolean;
// //   stockQuantity: number;
// //   minOrderQuantity: number;
// //   maxOrderQuantity: number;
// //   preparationTime: number;
// //   tags: string[];
// // }

// // interface Vendor {
// //   _id: string;
// //   businessName: string;
// //   description: string;
// //   services: string[];
// // }


// // export default function MarketplacePage() {
// //   const { user } = useAuth();
// //   const { cart, getCartItemCount } = useVendor();
// //   const { bookings } = useBooking();
// //   const router = useRouter();
  
// //   const [products, setProducts] = useState<VendorProduct[]>([]);
// //   const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [showCart, setShowCart] = useState(false);
  
// //   // Filters
// //   const [selectedCategory, setSelectedCategory] = useState('');
// //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
// //   const [searchQuery, setSearchQuery] = useState('');

// //   const categories = [
// //     'food',
// //     'beverages', 
// //     'essentials',
// //     'amenities',
// //     'concierge',
// //     'other'
// //   ];

// //   // Get upcoming confirmed bookings
// //   const upcomingBookings = bookings.filter(booking => {
// //     const checkOut = new Date(booking.checkOut);
// //     const today = new Date();
// //     return checkOut >= today && 
// //            booking.bookingStatus === 'confirmed' && 
// //            booking.paymentStatus === 'paid';
// //   });

// //   const hasActiveBooking = upcomingBookings.length > 0;

// //   useEffect(() => {
// //     fetchMarketplaceData();
// //   }, []);

// //   useEffect(() => {
// //     filterProducts();
// //   }, [products, selectedCategory, priceRange, searchQuery]);

// //   const fetchMarketplaceData = async () => {
// //     try {
// //       setLoading(true);
// //       setError('');

// //       const productsResponse = await vendorAPI.getAvailableProducts();
// //       setProducts(productsResponse.products || []);
      
// //       // Set price range based on actual products
// //       if (productsResponse.products && productsResponse.products.length > 0) {
// //         const prices = productsResponse.products.map(p => p.price);
// //         const minPrice = Math.floor(Math.min(...prices));
// //         const maxPrice = Math.ceil(Math.max(...prices));
// //         setPriceRange([minPrice, maxPrice]);
// //       }

// //     } catch (error: any) {
// //       console.error('Error fetching marketplace data:', error);
// //       setError(error.message || 'Failed to load marketplace');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const filterProducts = () => {
// //     let filtered = products;

// //     if (selectedCategory) {
// //       filtered = filtered.filter(product => product.category === selectedCategory);
// //     }

// //     if (searchQuery) {
// //       filtered = filtered.filter(product =>
// //         product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
// //       );
// //     }

// //     filtered = filtered.filter(product =>
// //       product.price >= priceRange[0] && product.price <= priceRange[1]
// //     );

// //     setFilteredProducts(filtered);
// //   };

// //   const handleAddToCart = (product: VendorProduct) => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }

// //     if (!hasActiveBooking) {
// //       alert('You need an active, confirmed booking to place orders in the marketplace. Please book a property first.');
// //       router.push('/properties');
// //       return;
// //     }
// //     // This will be handled by the ProductCard component through the context
// //   };

// //   const clearFilters = () => {
// //     setSelectedCategory('');
// //     setPriceRange([0, 100000]);
// //     setSearchQuery('');
// //   };

// //   const activeFiltersCount = [
// //     selectedCategory ? 1 : 0,
// //     priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0,
// //     searchQuery ? 1 : 0
// //   ].reduce((a, b) => a + b, 0);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gray-50">
// //         <div className="max-w-7xl mx-auto px-4 py-8">
// //           <div className="flex items-center justify-center py-12">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// //             <span className="ml-3 text-gray-600">Loading marketplace...</span>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Header */}
// //       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
// //         <div className="max-w-7xl mx-auto px-4">
// //           <h1 className="text-3xl md:text-4xl font-bold mb-4">Vendor Marketplace</h1>
// //           <p className="text-lg md:text-xl opacity-90">
// //             Order food, essentials, and services during your stay
// //           </p>
          
// //           {/* Booking Requirement Notice */}
// //           {!hasActiveBooking && (
// //             <div className="mt-4 bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-4">
// //               <div className="flex items-center">
// //                 <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// //                 </svg>
// //                 <div>
// //                   <p className="text-yellow-100 font-medium">
// //                     You need an active booking to place orders
// //                   </p>
// //                   <p className="text-yellow-200 text-sm mt-1">
// //                     Book a property first to access our vendor services
// //                   </p>
// //                 </div>
// //               </div>
// //               <div className="mt-3 flex space-x-3">
// //                 <Link
// //                   href="/properties"
// //                   className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-200 text-sm"
// //                 >
// //                   Browse Properties
// //                 </Link>
// //                 <Link
// //                   href="/dashboard/bookings"
// //                   className="border border-yellow-400 text-yellow-100 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 hover:bg-opacity-20 transition duration-200 text-sm"
// //                 >
// //                   Check My Bookings
// //                 </Link>
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-4 py-8">
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
// //                 onClick={fetchMarketplaceData}
// //                 className="text-red-700 hover:text-red-800 font-medium"
// //               >
// //                 Retry
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         <div className="flex flex-col lg:flex-row gap-8">
// //           {/* Filters Sidebar */}
// //           <div className="lg:w-80">
// //             <VendorFilter
// //               categories={categories}
// //               vendors={[]} // Remove vendor filter for now
// //               selectedCategory={selectedCategory}
// //               selectedVendor={''}
// //               priceRange={priceRange}
// //               searchQuery={searchQuery}
// //               onCategoryChange={setSelectedCategory}
// //               onVendorChange={() => {}} // Empty function for vendor change
// //               onPriceRangeChange={setPriceRange}
// //               onSearchChange={setSearchQuery}
// //               onClearFilters={clearFilters}
// //               activeFiltersCount={activeFiltersCount}
// //             />

// //             {/* Active Bookings Info */}
// //             {hasActiveBooking && (
// //               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
// //                 <h3 className="font-semibold text-green-800 mb-2 flex items-center">
// //                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
// //                   </svg>
// //                   Active Bookings
// //                 </h3>
// //                 <div className="space-y-2">
// //                   {upcomingBookings.map(booking => (
// //                     <div key={booking._id} className="text-sm text-green-700">
// //                       <div className="font-medium">{booking.property.title}</div>
// //                       <div className="text-xs">
// //                         {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             )}
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             {/* Header Bar */}
// //             <div className="flex justify-between items-center mb-6">
// //               <div>
// //                 <h2 className="text-2xl font-bold text-[#383a3c]">
// //                   {filteredProducts.length} Products Available
// //                 </h2>
// //                 {activeFiltersCount > 0 && (
// //                   <p className="text-gray-600 text-sm mt-1">
// //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// //                   </p>
// //                 )}
// //               </div>

// //               {/* Cart Button - Only show if user has active booking */}
// //               {hasActiveBooking && (
// //                 <button
// //                   onClick={() => setShowCart(true)}
// //                   className="relative bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
// //                 >
// //                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
// //                   </svg>
// //                   View Cart
// //                   {getCartItemCount() > 0 && (
// //                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
// //                       {getCartItemCount()}
// //                     </span>
// //                   )}
// //                 </button>
// //               )}
// //             </div>

// //             {/* Products Grid */}
// //             {filteredProducts.length > 0 ? (
// //               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //                 {filteredProducts.map((product) => (
// //                   <ProductCard
// //                     key={product._id}
// //                     product={product}
// //                     onAddToCart={handleAddToCart}
// //                     disabled={!hasActiveBooking}
// //                   />
// //                 ))}
// //               </div>
// //             ) : (
// //               <div className="text-center py-12">
// //                 <div className="text-6xl mb-4">🛒</div>
// //                 <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
// //                 <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// //                 <button
// //                   onClick={clearFilters}
// //                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //                 >
// //                   Clear All Filters
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Cart Sidebar */}
// //       <CartSidebar 
// //         isOpen={showCart} 
// //         onClose={() => setShowCart(false)}
// //       />
// //     </div>
// //   );
// // }











































// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { vendorAPI } from '@/lib/api';
// // import { useVendor } from '@/contexts/VendorContext';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { useRouter } from 'next/navigation';
// // import ProductCard from '@/components/vendor/ProductCard';
// // import CartSidebar from '@/components/vendor/CartSidebar';
// // import VendorFilter from '@/components/vendor/VendorFilter';

// // interface VendorProduct {
// //   _id: string;
// //   name: string;
// //   description: string;
// //   category: string;
// //   price: number;
// //   images: Array<{ url: string }>;
// //   vendor: {
// //     _id: string;
// //     businessName: string;
// //     description: string;
// //     rating: number;
// //   };
// //   isAvailable: boolean;
// //   stockQuantity: number;
// //   minOrderQuantity: number;
// //   maxOrderQuantity: number;
// //   preparationTime: number;
// //   tags: string[];
// // }

// // interface Vendor {
// //   _id: string;
// //   businessName: string;
// //   description: string;
// //   services: string[];
// // }

// // export default function MarketplacePage() {
// //   const { user } = useAuth();
// //   const { cart, getCartItemCount } = useVendor();
// //   const router = useRouter();
  
// //   const [products, setProducts] = useState<VendorProduct[]>([]);
// //   const [vendors, setVendors] = useState<Vendor[]>([]);
// //   const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [showCart, setShowCart] = useState(false);
  
// //   // Filters
// //   const [selectedCategory, setSelectedCategory] = useState('');
// //   const [selectedVendor, setSelectedVendor] = useState('');
// //   const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
// //   const [searchQuery, setSearchQuery] = useState('');

// //   const categories = [
// //     'food',
// //     'beverages', 
// //     'essentials',
// //     'amenities',
// //     'concierge',
// //     'other'
// //   ];

// //   useEffect(() => {
// //     fetchMarketplaceData();
// //   }, []);

// //   useEffect(() => {
// //     filterProducts();
// //   }, [products, selectedCategory, selectedVendor, priceRange, searchQuery]);

// // //   const fetchMarketplaceData = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError('');

// // //       const [productsResponse, vendorsResponse] = await Promise.all([
// // //         vendorAPI.getAvailableProducts(),
// // //         vendorAPI.getVendors({ status: 'active' })
// // //       ]);

// // //       setProducts(productsResponse.products || []);
// // //       setVendors(vendorsResponse.vendors || []);
      
// // //       // Set price range based on actual products
// // //       if (productsResponse.products && productsResponse.products.length > 0) {
// // //         const prices = productsResponse.products.map(p => p.price);
// // //         const minPrice = Math.floor(Math.min(...prices));
// // //         const maxPrice = Math.ceil(Math.max(...prices));
// // //         setPriceRange([minPrice, maxPrice]);
// // //       }

// // //     } catch (error: any) {
// // //       console.error('Error fetching marketplace data:', error);
// // //       setError(error.message || 'Failed to load marketplace');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// //     // In your marketplace page - Update the fetchMarketplaceData function
// //     const fetchMarketplaceData = async () => {
// //     try {
// //         setLoading(true);
// //         setError('');

// //         // Only fetch products, not vendors (vendors are included in product data)
// //         const productsResponse = await vendorAPI.getAvailableProducts();

// //         setProducts(productsResponse.products || []);
        
// //         // Extract unique vendors from products for the filter
// //         const vendorsFromProducts = [...new Set(
// //         productsResponse.products?.map(p => p.vendor?._id).filter(Boolean) || []
// //         )];
        
// //         // If you need vendor details, you can fetch them individually
// //         // or create a separate public vendor listing endpoint
// //         setVendors([]); // Clear vendors or handle differently

// //         // Set price range based on actual products
// //         if (productsResponse.products && productsResponse.products.length > 0) {
// //         const prices = productsResponse.products.map(p => p.price);
// //         const minPrice = Math.floor(Math.min(...prices));
// //         const maxPrice = Math.ceil(Math.max(...prices));
// //         setPriceRange([minPrice, maxPrice]);
// //         }

// //     } catch (error: any) {
// //         console.error('Error fetching marketplace data:', error);
// //         setError(error.message || 'Failed to load marketplace');
// //     } finally {
// //         setLoading(false);
// //     }
// //     };

// //   const filterProducts = () => {
// //     let filtered = products;

// //     if (selectedCategory) {
// //       filtered = filtered.filter(product => product.category === selectedCategory);
// //     }

// //     if (selectedVendor) {
// //       filtered = filtered.filter(product => product.vendor._id === selectedVendor);
// //     }

// //     if (searchQuery) {
// //       filtered = filtered.filter(product =>
// //         product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
// //       );
// //     }

// //     filtered = filtered.filter(product =>
// //       product.price >= priceRange[0] && product.price <= priceRange[1]
// //     );

// //     setFilteredProducts(filtered);
// //   };

// //   const handleAddToCart = (product: VendorProduct) => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }
// //     // This will be handled by the ProductCard component
// //   };

// //   const clearFilters = () => {
// //     setSelectedCategory('');
// //     setSelectedVendor('');
// //     setPriceRange([0, 100000]);
// //     setSearchQuery('');
// //   };

// //   const activeFiltersCount = [
// //     selectedCategory ? 1 : 0,
// //     selectedVendor ? 1 : 0,
// //     priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0,
// //     searchQuery ? 1 : 0
// //   ].reduce((a, b) => a + b, 0);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gray-50">
// //         <div className="max-w-7xl mx-auto px-4 py-8">
// //           <div className="flex items-center justify-center py-12">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// //             <span className="ml-3 text-gray-600">Loading marketplace...</span>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Header */}
// //       <div className="bg-[#383a3c] text-[#fcfeff] py-12 md:py-16">
// //         <div className="max-w-7xl mx-auto px-4">
// //           <h1 className="text-3xl md:text-4xl font-bold mb-4">Vendor Marketplace</h1>
// //           <p className="text-lg md:text-xl opacity-90">
// //             Order food, essentials, and services during your stay
// //           </p>
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-4 py-8">
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
// //                 onClick={fetchMarketplaceData}
// //                 className="text-red-700 hover:text-red-800 font-medium"
// //               >
// //                 Retry
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         <div className="flex flex-col lg:flex-row gap-8">
// //           {/* Filters Sidebar */}
// //           <div className="lg:w-80">
// //             <VendorFilter
// //               categories={categories}
// //               vendors={vendors}
// //               selectedCategory={selectedCategory}
// //               selectedVendor={selectedVendor}
// //               priceRange={priceRange}
// //               searchQuery={searchQuery}
// //               onCategoryChange={setSelectedCategory}
// //               onVendorChange={setSelectedVendor}
// //               onPriceRangeChange={setPriceRange}
// //               onSearchChange={setSearchQuery}
// //               onClearFilters={clearFilters}
// //               activeFiltersCount={activeFiltersCount}
// //             />
// //           </div>

// //           {/* Main Content */}
// //           <div className="flex-1">
// //             {/* Header Bar */}
// //             <div className="flex justify-between items-center mb-6">
// //               <div>
// //                 <h2 className="text-2xl font-bold text-[#383a3c]">
// //                   {filteredProducts.length} Products Available
// //                 </h2>
// //                 {activeFiltersCount > 0 && (
// //                   <p className="text-gray-600 text-sm mt-1">
// //                     {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
// //                   </p>
// //                 )}
// //               </div>

// //               {/* Cart Button */}
// //               <button
// //                 onClick={() => setShowCart(true)}
// //                 className="relative bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
// //               >
// //                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
// //                 </svg>
// //                 View Cart
// //                 {getCartItemCount() > 0 && (
// //                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
// //                     {getCartItemCount()}
// //                   </span>
// //                 )}
// //               </button>
// //             </div>

// //             {/* Products Grid */}
// //             {filteredProducts.length > 0 ? (
// //               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //                 {filteredProducts.map((product) => (
// //                   <ProductCard
// //                     key={product._id}
// //                     product={product}
// //                     onAddToCart={handleAddToCart}
// //                   />
// //                 ))}
// //               </div>
// //             ) : (
// //               <div className="text-center py-12">
// //                 <div className="text-6xl mb-4">🛒</div>
// //                 <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
// //                 <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
// //                 <button
// //                   onClick={clearFilters}
// //                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //                 >
// //                   Clear All Filters
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Cart Sidebar */}
// //       <CartSidebar 
// //         isOpen={showCart} 
// //         onClose={() => setShowCart(false)}
// //       />
// //     </div>
// //   );
// // }
