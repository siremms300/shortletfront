// components/dashboard/DashboardOverview.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsAPI, propertiesAPI } from '@/lib/api';

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    images: Array<{ url: string }>;
    price: number;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  images: Array<{ url: string }>;
  price: number;
  isFeatured: boolean;
}

interface RecentBookingDisplay {
  id: string;
  property: string;
  date: string;
  status: string;
  image: string;
  totalAmount: number;
  guests: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper functions - defined at the top level of the component
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return '₦0';
    }
    return `₦${amount.toLocaleString()}`;
  };

  const getBookingStatus = (booking: Booking | null) => {
    if (!booking || booking.bookingStatus === 'cancelled') {
      return 'Cancelled';
    }

    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return 'Unknown';
    }

    if (checkOut < today) {
      return 'Completed';
    } else if (checkIn <= today && checkOut >= today) {
      return 'Ongoing';
    } else {
      return 'Upcoming';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    console.log('📊 [Dashboard] Initializing dashboard...');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📊 [Dashboard] Fetching dashboard data...');
      
      // Fetch user bookings and wishlist
      const [bookingsResponse, propertiesResponse] = await Promise.all([
        bookingsAPI.getUserBookings(),
        propertiesAPI.getProperties({ limit: 12 })
      ]);

      console.log('📊 [Dashboard] Bookings response:', bookingsResponse);
      console.log('📊 [Dashboard] Properties response:', propertiesResponse);

      const fetchedBookings = bookingsResponse?.bookings || [];
      setBookings(fetchedBookings);
      
      // Log first booking for debugging
      if (fetchedBookings.length > 0) {
        console.log('📊 [Dashboard] First booking data:', {
          booking: fetchedBookings[0],
          totalAmount: fetchedBookings[0].totalAmount,
          hasTotalAmount: fetchedBookings[0].totalAmount !== undefined,
          typeOfTotalAmount: typeof fetchedBookings[0].totalAmount
        });
      }

      // For now, simulate wishlist with featured properties
      // In a real app, you'd have a separate wishlist API endpoint
      const featuredProperties = (propertiesResponse || []).filter((prop: Property) => prop.isFeatured);
      setWishlist(featuredProperties.slice(0, 8));

      console.log('📊 [Dashboard] Data loaded:', {
        bookingsCount: fetchedBookings.length,
        wishlistCount: featuredProperties.length
      });

    } catch (error: any) {
      console.error('❌ [Dashboard] Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const upcomingTrips = bookings.filter(booking => {
    if (!booking || booking.bookingStatus === 'cancelled') return false;
    
    const checkOut = new Date(booking.checkOut);
    if (isNaN(checkOut.getTime())) return false;
    
    return checkOut >= new Date();
  }).length;

  const totalBookings = bookings.length;
  const activeRequests = 0; // Will be implemented later with service requests

  const stats = [
    { name: 'Upcoming Trips', value: upcomingTrips.toString(), href: '/dashboard/bookings' },
    { name: 'Wishlist Items', value: wishlist.length.toString(), href: '/dashboard/wishlist' },
    { name: 'Total Bookings', value: totalBookings.toString(), href: '/dashboard/bookings' },
    { name: 'Active Requests', value: activeRequests.toString(), href: '/dashboard/housekeeping' },
  ];

  // Get recent bookings (last 2)
  const recentBookings: RecentBookingDisplay[] = bookings
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 2)
    .map(booking => {
      // Safely access all properties with fallbacks
      const propertyTitle = booking?.property?.title || 'Unknown Property';
      const propertyImage = booking?.property?.images?.[0]?.url || '/default-property.jpg';
      const totalAmount = booking?.totalAmount || 0;
      const guests = booking?.guests || 1;
      
      return {
        id: booking?._id || 'unknown',
        property: propertyTitle,
        date: `${formatDate(booking?.checkIn || new Date().toISOString())} - ${formatDate(booking?.checkOut || new Date().toISOString())}`,
        status: getBookingStatus(booking),
        image: propertyImage,
        totalAmount,
        guests
      };
    });

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Welcome Section Skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">
            Welcome back, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">
          Welcome back, {user?.firstName || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200"
          >
            <div className="text-2xl font-bold text-[#383a3c]">{stat.value}</div>
            <div className="text-gray-600 text-sm mt-1">{stat.name}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Recent Bookings</h2>
            <Link
              href="/dashboard/bookings"
              className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  <img
                    src={booking.image}
                    alt={booking.property}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-property.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#383a3c] truncate">{booking.property}</h3>
                    <p className="text-gray-600 text-sm">{booking.date}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {formatCurrency(booking.totalAmount)} • {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏠</div>
                <p className="text-gray-600 mb-4">No bookings yet</p>
                <Link
                  href="/propertylist"
                  className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
                >
                  Find Properties
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Wishlist</h2>
            <Link
              href="/dashboard/wishlist"
              className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {wishlist.length > 0 ? (
              wishlist.slice(0, 3).map((property) => (
                <div
                  key={property._id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  <img
                    src={property.images[0]?.url || '/default-property.jpg'}
                    alt={property.title}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-property.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#383a3c] truncate">{property.title}</h3>
                    <p className="text-gray-600 text-sm truncate">{property.location}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {formatCurrency(property.price)} / night
                    </p>
                  </div>
                  <Link
                    href={`/properties/${property._id}`}
                    className="text-[#f06123] hover:text-orange-600 font-medium text-sm whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">❤️</div>
                <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                <Link
                  href="/propertylist"
                  className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
                >
                  Explore Properties
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/propertylist"
            className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-medium text-[#383a3c]">Find Properties</div>
            <div className="text-gray-600 text-sm mt-1">Discover new places to stay</div>
          </Link>

          <Link
            href="/dashboard/wishlist"
            className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
          >
            <div className="text-2xl mb-2">❤️</div>
            <div className="font-medium text-[#383a3c]">Your Wishlist</div>
            <div className="text-gray-600 text-sm mt-1">View saved properties</div>
          </Link>

          <Link
            href="/dashboard/bookings"
            className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium text-[#383a3c]">My Bookings</div>
            <div className="text-gray-600 text-sm mt-1">Manage your trips</div>
          </Link>

          <Link
            href="/dashboard/profile"
            className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-[#383a3c]">Edit Profile</div>
            <div className="text-gray-600 text-sm mt-1">Update your information</div>
          </Link>
        </div>
      </div>
    </div>
  );
}




































































// // components/dashboard/DashboardOverview.tsx
// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { bookingsAPI, propertiesAPI } from '@/lib/api';

// interface Booking {
//   _id: string;
//   property: {
//     _id: string;
//     title: string;
//     location: string;
//     images: Array<{ url: string }>;
//     price: number;
//   };
//   checkIn: string;
//   checkOut: string;
//   guests: number;
//   totalAmount: number;
//   paymentStatus: string;
//   bookingStatus: string;
//   createdAt: string;
// }

// interface Property {
//   _id: string;
//   title: string;
//   location: string;
//   images: Array<{ url: string }>;
//   price: number;
//   isFeatured: boolean;
// }

// export default function DashboardOverview() {
//   const { user } = useAuth();
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [wishlist, setWishlist] = useState<Property[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Helper functions - defined at the top level of the component
//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const getBookingStatus = (booking: Booking) => {
//     const today = new Date();
//     const checkIn = new Date(booking.checkIn);
//     const checkOut = new Date(booking.checkOut);

//     if (booking.bookingStatus === 'cancelled') {
//       return 'Cancelled';
//     } else if (checkOut < today) {
//       return 'Completed';
//     } else if (checkIn <= today && checkOut >= today) {
//       return 'Ongoing';
//     } else {
//       return 'Upcoming';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'upcoming': return 'bg-green-100 text-green-800';
//       case 'ongoing': return 'bg-blue-100 text-blue-800';
//       case 'completed': return 'bg-gray-100 text-gray-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch user bookings and wishlist
//       const [bookingsResponse, propertiesResponse] = await Promise.all([
//         bookingsAPI.getUserBookings(),
//         propertiesAPI.getProperties() // This will be used for wishlist simulation
//       ]);

//       setBookings(bookingsResponse.bookings || []);
      
//       // For now, simulate wishlist with featured properties
//       // In a real app, you'd have a separate wishlist API endpoint
//       const featuredProperties = (propertiesResponse.properties || []).filter((prop: Property) => prop.isFeatured);
//       setWishlist(featuredProperties.slice(0, 8));

//     } catch (error: any) {
//       console.error('Error fetching dashboard data:', error);
//       setError(error.message || 'Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate stats from real data
//   const upcomingTrips = bookings.filter(booking => {
//     const checkOut = new Date(booking.checkOut);
//     return checkOut >= new Date() && booking.bookingStatus !== 'cancelled';
//   }).length;

//   const totalBookings = bookings.length;
//   const activeRequests = 0; // Will be implemented later with service requests

//   const stats = [
//     { name: 'Upcoming Trips', value: upcomingTrips.toString(), href: '/dashboard/bookings' },
//     { name: 'Wishlist Items', value: wishlist.length.toString(), href: '/dashboard/wishlist' },
//     { name: 'Total Bookings', value: totalBookings.toString(), href: '/dashboard/bookings' },
//     { name: 'Active Requests', value: activeRequests.toString(), href: '/dashboard/housekeeping' },
//   ];

//   // Get recent bookings (last 2)
//   const recentBookings = bookings
//     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//     .slice(0, 2)
//     .map(booking => ({
//       id: booking._id,
//       property: booking.property.title,
//       date: `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`,
//       status: getBookingStatus(booking),
//       image: booking.property.images[0]?.url || '/default-property.jpg',
//       booking // Keep the full booking object for reference
//     }));

//   if (loading) {
//     return (
//       <div className="space-y-8">
//         {/* Welcome Section Skeleton */}
//         <div>
//           <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
//           <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
//         </div>

//         {/* Stats Grid Skeleton */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {[1, 2, 3, 4].map((n) => (
//             <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
//               <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
//               <div className="h-4 bg-gray-200 rounded w-1/2"></div>
//             </div>
//           ))}
//         </div>

//         {/* Content Skeleton */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {[1, 2].map((n) => (
//             <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
//               <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
//               <div className="space-y-4">
//                 {[1, 2].map((item) => (
//                   <div key={item} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
//                     <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
//                     <div className="flex-1">
//                       <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//                       <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//                     </div>
//                     <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">
//             Welcome back, {user?.firstName || 'User'}! 👋
//           </h1>
//           <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
//         </div>
        
//         <div className="text-center py-12">
//           <div className="text-red-600 text-lg mb-2">Error loading dashboard</div>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={fetchDashboardData}
//             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">
//           Welcome back, {user?.firstName || 'User'}! 👋
//         </h1>
//         <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => (
//           <Link
//             key={stat.name}
//             href={stat.href}
//             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200"
//           >
//             <div className="text-2xl font-bold text-[#383a3c]">{stat.value}</div>
//             <div className="text-gray-600 text-sm mt-1">{stat.name}</div>
//           </Link>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Recent Bookings */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Recent Bookings</h2>
//             <Link
//               href="/dashboard/bookings"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {recentBookings.length > 0 ? (
//               recentBookings.map((booking) => (
//                 <div
//                   key={booking.id}
//                   className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <img
//                     src={booking.image}
//                     alt={booking.property}
//                     className="w-16 h-16 rounded-lg object-cover"
//                   />
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{booking.property}</h3>
//                     <p className="text-gray-600 text-sm">{booking.date}</p>
//                     <p className="text-gray-500 text-xs mt-1">
//                       ₦{booking.booking.totalAmount.toLocaleString()} • {booking.booking.guests} guest{booking.booking.guests !== 1 ? 's' : ''}
//                     </p>
//                   </div>
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
//                   >
//                     {booking.status}
//                   </span>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8">
//                 <div className="text-4xl mb-3">🏠</div>
//                 <p className="text-gray-600 mb-4">No bookings yet</p>
//                 <Link
//                   href="/propertylist"
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                 >
//                   Find Properties
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Wishlist Preview */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Wishlist</h2>
//             <Link
//               href="/dashboard/wishlist"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {wishlist.length > 0 ? (
//               wishlist.slice(0, 3).map((property) => (
//                 <div
//                   key={property._id}
//                   className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <img
//                     src={property.images[0]?.url || '/default-property.jpg'}
//                     alt={property.title}
//                     className="w-16 h-16 rounded-lg object-cover"
//                   />
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{property.title}</h3>
//                     <p className="text-gray-600 text-sm">{property.location}</p>
//                     <p className="text-gray-500 text-xs mt-1">
//                       ₦{property.price.toLocaleString()} / night
//                     </p>
//                   </div>
//                   <Link
//                     href={`/properties/${property._id}`}
//                     className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//                   >
//                     View
//                   </Link>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8">
//                 <div className="text-4xl mb-3">❤️</div>
//                 <p className="text-gray-600 mb-4">Your wishlist is empty</p>
//                 <Link
//                   href="/propertylist"
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                 >
//                   Explore Properties
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Link
//             href="/propertylist"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">🔍</div>
//             <div className="font-medium text-[#383a3c]">Find Properties</div>
//             <div className="text-gray-600 text-sm mt-1">Discover new places to stay</div>
//           </Link>

//           <Link
//             href="/dashboard/wishlist"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">❤️</div>
//             <div className="font-medium text-[#383a3c]">Your Wishlist</div>
//             <div className="text-gray-600 text-sm mt-1">View saved properties</div>
//           </Link>

//           <Link
//             href="/dashboard/bookings"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">📅</div>
//             <div className="font-medium text-[#383a3c]">My Bookings</div>
//             <div className="text-gray-600 text-sm mt-1">Manage your trips</div>
//           </Link>

//           <Link
//             href="/dashboard/profile"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">👤</div>
//             <div className="font-medium text-[#383a3c]">Edit Profile</div>
//             <div className="text-gray-600 text-sm mt-1">Update your information</div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }



































































// // components/dashboard/DashboardOverview.tsx
// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { bookingsAPI, propertiesAPI } from '@/lib/api';

// interface Booking {
//   _id: string;
//   property: {
//     _id: string;
//     title: string;
//     location: string;
//     images: Array<{ url: string }>;
//     price: number;
//   };
//   checkIn: string;
//   checkOut: string;
//   guests: number;
//   totalAmount: number;
//   paymentStatus: string;
//   bookingStatus: string;
//   createdAt: string;
// }

// interface Property {
//   _id: string;
//   title: string;
//   location: string;
//   images: Array<{ url: string }>;
//   price: number;
//   isFeatured: boolean;
// }

// export default function DashboardOverview() {
//   const { user } = useAuth();
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [wishlist, setWishlist] = useState<Property[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch user bookings and wishlist
//       const [bookingsResponse, propertiesResponse] = await Promise.all([
//         bookingsAPI.getUserBookings(),
//         propertiesAPI.getProperties() // This will be used for wishlist simulation
//       ]);

//       setBookings(bookingsResponse.bookings || []);
      
//       // For now, simulate wishlist with featured properties
//       // In a real app, you'd have a separate wishlist API endpoint
//       const featuredProperties = (propertiesResponse.properties || []).filter((prop: Property) => prop.isFeatured);
//       setWishlist(featuredProperties.slice(0, 8));

//     } catch (error: any) {
//       console.error('Error fetching dashboard data:', error);
//       setError(error.message || 'Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate stats from real data
//   const upcomingTrips = bookings.filter(booking => {
//     const checkOut = new Date(booking.checkOut);
//     return checkOut >= new Date() && booking.bookingStatus !== 'cancelled';
//   }).length;

//   const totalBookings = bookings.length;
//   const activeRequests = 0; // Will be implemented later with service requests

//   const stats = [
//     { name: 'Upcoming Trips', value: upcomingTrips.toString(), href: '/dashboard/bookings' },
//     { name: 'Wishlist Items', value: wishlist.length.toString(), href: '/dashboard/wishlist' },
//     { name: 'Total Bookings', value: totalBookings.toString(), href: '/dashboard/bookings' },
//     { name: 'Active Requests', value: activeRequests.toString(), href: '/dashboard/housekeeping' },
//   ];

//   // Get recent bookings (last 2)
//   const recentBookings = bookings
//     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//     .slice(0, 2)
//     .map(booking => ({
//       id: booking._id,
//       property: booking.property.title,
//       date: `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`,
//       status: getBookingStatus(booking),
//       image: booking.property.images[0]?.url || '/default-property.jpg',
//       booking // Keep the full booking object for reference
//     }));

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const getBookingStatus = (booking: Booking) => {
//     const today = new Date();
//     const checkIn = new Date(booking.checkIn);
//     const checkOut = new Date(booking.checkOut);

//     if (booking.bookingStatus === 'cancelled') {
//       return 'Cancelled';
//     } else if (checkOut < today) {
//       return 'Completed';
//     } else if (checkIn <= today && checkOut >= today) {
//       return 'Ongoing';
//     } else {
//       return 'Upcoming';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'upcoming': return 'bg-green-100 text-green-800';
//       case 'ongoing': return 'bg-blue-100 text-blue-800';
//       case 'completed': return 'bg-gray-100 text-gray-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="space-y-8">
//         {/* Welcome Section Skeleton */}
//         <div>
//           <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
//           <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
//         </div>

//         {/* Stats Grid Skeleton */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {[1, 2, 3, 4].map((n) => (
//             <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
//               <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
//               <div className="h-4 bg-gray-200 rounded w-1/2"></div>
//             </div>
//           ))}
//         </div>

//         {/* Content Skeleton */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {[1, 2].map((n) => (
//             <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
//               <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
//               <div className="space-y-4">
//                 {[1, 2].map((item) => (
//                   <div key={item} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
//                     <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
//                     <div className="flex-1">
//                       <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//                       <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//                     </div>
//                     <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">
//             Welcome back, {user?.firstName || 'User'}! 👋
//           </h1>
//           <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
//         </div>
        
//         <div className="text-center py-12">
//           <div className="text-red-600 text-lg mb-2">Error loading dashboard</div>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={fetchDashboardData}
//             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">
//           Welcome back, {user?.firstName || 'User'}! 👋
//         </h1>
//         <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => (
//           <Link
//             key={stat.name}
//             href={stat.href}
//             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200"
//           >
//             <div className="text-2xl font-bold text-[#383a3c]">{stat.value}</div>
//             <div className="text-gray-600 text-sm mt-1">{stat.name}</div>
//           </Link>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Recent Bookings */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Recent Bookings</h2>
//             <Link
//               href="/dashboard/bookings"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {recentBookings.length > 0 ? (
//               recentBookings.map((booking) => (
//                 <div
//                   key={booking.id}
//                   className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <img
//                     src={booking.image}
//                     alt={booking.property}
//                     className="w-16 h-16 rounded-lg object-cover"
//                   />
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{booking.property}</h3>
//                     <p className="text-gray-600 text-sm">{booking.date}</p>
//                     <p className="text-gray-500 text-xs mt-1">
//                       ₦{booking.booking.totalAmount.toLocaleString()} • {booking.booking.guests} guest{booking.booking.guests !== 1 ? 's' : ''}
//                     </p>
//                   </div>
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
//                   >
//                     {booking.status}
//                   </span>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8">
//                 <div className="text-4xl mb-3">🏠</div>
//                 <p className="text-gray-600 mb-4">No bookings yet</p>
//                 <Link
//                   href="/properties"
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                 >
//                   Find Properties
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Wishlist Preview */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Wishlist</h2>
//             <Link
//               href="/dashboard/wishlist"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {wishlist.length > 0 ? (
//               wishlist.slice(0, 3).map((property) => (
//                 <div
//                   key={property._id}
//                   className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <img
//                     src={property.images[0]?.url || '/default-property.jpg'}
//                     alt={property.title}
//                     className="w-16 h-16 rounded-lg object-cover"
//                   />
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{property.title}</h3>
//                     <p className="text-gray-600 text-sm">{property.location}</p>
//                     <p className="text-gray-500 text-xs mt-1">
//                       ₦{property.price.toLocaleString()} / night
//                     </p>
//                   </div>
//                   <Link
//                     href={`/properties/${property._id}`}
//                     className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//                   >
//                     View
//                   </Link>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8">
//                 <div className="text-4xl mb-3">❤️</div>
//                 <p className="text-gray-600 mb-4">Your wishlist is empty</p>
//                 <Link
//                   href="/properties"
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                 >
//                   Explore Properties
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Link
//             href="/properties"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">🔍</div>
//             <div className="font-medium text-[#383a3c]">Find Properties</div>
//             <div className="text-gray-600 text-sm mt-1">Discover new places to stay</div>
//           </Link>

//           <Link
//             href="/dashboard/wishlist"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">❤️</div>
//             <div className="font-medium text-[#383a3c]">Your Wishlist</div>
//             <div className="text-gray-600 text-sm mt-1">View saved properties</div>
//           </Link>

//           <Link
//             href="/dashboard/bookings"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">📅</div>
//             <div className="font-medium text-[#383a3c]">My Bookings</div>
//             <div className="text-gray-600 text-sm mt-1">Manage your trips</div>
//           </Link>

//           <Link
//             href="/dashboard/profile"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">👤</div>
//             <div className="font-medium text-[#383a3c]">Edit Profile</div>
//             <div className="text-gray-600 text-sm mt-1">Update your information</div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }









































































































// // components/dashboard/DashboardOverview.tsx
// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';

// interface HousekeepingRequest {
//   id: string;
//   apartment: string;
//   unit: string;
//   type: 'cleaning' | 'linen' | 'amenities' | 'maintenance' | 'other';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   description: string;
//   requestedAt: Date;
//   status: 'pending' | 'in-progress' | 'completed' | 'verified';
//   assignedTo?: string;
//   completedAt?: Date;
//   notes?: string;
// }

// export default function DashboardOverview() {
//   const { user } = useAuth();
//   const [activeRequests, setActiveRequests] = useState<HousekeepingRequest[]>([]);
//   const [recentRequests, setRecentRequests] = useState<HousekeepingRequest[]>([]);

//   useEffect(() => {
//     // Mock data - in real app, fetch from API
//     const mockRequests: HousekeepingRequest[] = [
//       {
//         id: 'HK-001',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'cleaning',
//         priority: 'high',
//         description: 'Regular cleaning service',
//         requestedAt: new Date('2024-01-20T10:00:00'),
//         status: 'completed',
//         assignedTo: 'Clean Team A',
//         completedAt: new Date('2024-01-20T14:30:00')
//       },
//       {
//         id: 'HK-002',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'linen',
//         priority: 'medium',
//         description: 'Extra towel request',
//         requestedAt: new Date('2024-01-21T09:00:00'),
//         status: 'in-progress',
//         assignedTo: 'Housekeeping Staff'
//       },
//       {
//         id: 'HK-003',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'amenities',
//         priority: 'low',
//         description: 'Coffee pod refill',
//         requestedAt: new Date('2024-01-21T11:30:00'),
//         status: 'pending'
//       }
//     ];

//     setActiveRequests(mockRequests.filter(req => req.status !== 'completed'));
//     setRecentRequests(mockRequests.slice(0, 2));
//   }, []);

//   const stats = [
//     { name: 'Upcoming Trips', value: '2', href: '/dashboard/bookings' },
//     { name: 'Wishlist Items', value: '8', href: '/dashboard/wishlist' },
//     { name: 'Total Bookings', value: '12', href: '/dashboard/bookings' },
//     { name: 'Active Requests', value: activeRequests.length.toString(), href: '/dashboard/housekeeping' },
//   ];

//   const recentBookings = [
//     {
//       id: 1,
//       property: 'Luxury Apartment in City Center',
//       date: 'Jan 15 - Jan 20, 2024',
//       status: 'Upcoming',
//       image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300',
//     },
//     {
//       id: 2,
//       property: 'Beachfront Villa',
//       date: 'Dec 20 - Dec 25, 2023',
//       status: 'Completed',
//       image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=300',
//     },
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'completed': return 'bg-green-100 text-green-800';
//       case 'in-progress': return 'bg-blue-100 text-blue-800';
//       case 'verified': return 'bg-purple-100 text-purple-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getRequestIcon = (type: string) => {
//     switch (type) {
//       case 'cleaning': return '🧹';
//       case 'linen': return '🛏️';
//       case 'amenities': return '☕';
//       case 'maintenance': return '🔧';
//       default: return '📋';
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">
//           Welcome back, {user?.firstName || 'User'}! 👋
//         </h1>
//         <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => (
//           <Link
//             key={stat.name}
//             href={stat.href}
//             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200"
//           >
//             <div className="text-2xl font-bold text-[#383a3c]">{stat.value}</div>
//             <div className="text-gray-600 text-sm mt-1">{stat.name}</div>
//           </Link>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Recent Bookings */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Recent Bookings</h2>
//             <Link
//               href="/dashboard/bookings"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {recentBookings.map((booking) => (
//               <div
//                 key={booking.id}
//                 className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//               >
//                 <img
//                   src={booking.image}
//                   alt={booking.property}
//                   className="w-16 h-16 rounded-lg object-cover"
//                 />
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-[#383a3c]">{booking.property}</h3>
//                   <p className="text-gray-600 text-sm">{booking.date}</p>
//                 </div>
//                 <span
//                   className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     booking.status === 'Upcoming'
//                       ? 'bg-green-100 text-green-800'
//                       : 'bg-gray-100 text-gray-800'
//                   }`}
//                 >
//                   {booking.status}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Housekeeping Requests */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Service Requests</h2>
//             <Link
//               href="/dashboard/housekeeping"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {recentRequests.length > 0 ? (
//               recentRequests.map((request) => (
//                 <div
//                   key={request.id}
//                   className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <div className="text-2xl">{getRequestIcon(request.type)}</div>
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c] capitalize">{request.type} Service</h3>
//                     <p className="text-gray-600 text-sm">{request.description}</p>
//                     <p className="text-gray-500 text-xs mt-1">
//                       Requested: {request.requestedAt.toLocaleDateString()}
//                     </p>
//                   </div>
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}
//                   >
//                     {request.status.replace('-', ' ')}
//                   </span>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8">
//                 <div className="text-4xl mb-3">🧹</div>
//                 <p className="text-gray-600 mb-4">No active service requests</p>
//                 <Link
//                   href="/dashboard/housekeeping"
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                 >
//                   Request Service
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Link
//             href="/properties"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">🔍</div>
//             <div className="font-medium text-[#383a3c]">Find Properties</div>
//             <div className="text-gray-600 text-sm mt-1">Discover new places to stay</div>
//           </Link>

//           <Link
//             href="/dashboard/wishlist"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">❤️</div>
//             <div className="font-medium text-[#383a3c]">Your Wishlist</div>
//             <div className="text-gray-600 text-sm mt-1">View saved properties</div>
//           </Link>

//           <Link
//             href="/dashboard/housekeeping"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">🧹</div>
//             <div className="font-medium text-[#383a3c]">Request Service</div>
//             <div className="text-gray-600 text-sm mt-1">Housekeeping & maintenance</div>
//           </Link>

//           <Link
//             href="/dashboard/profile"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">👤</div>
//             <div className="font-medium text-[#383a3c]">Edit Profile</div>
//             <div className="text-gray-600 text-sm mt-1">Update your information</div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }
























































// // components/dashboard/DashboardOverview.tsx
// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';

// interface HousekeepingRequest {
//   id: string;
//   apartment: string;
//   unit: string;
//   type: 'cleaning' | 'linen' | 'amenities' | 'maintenance' | 'other';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   description: string;
//   requestedAt: Date;
//   status: 'pending' | 'in-progress' | 'completed' | 'verified';
//   assignedTo?: string;
//   completedAt?: Date;
//   notes?: string;
// }

// export default function DashboardOverview() {
//   const [activeRequests, setActiveRequests] = useState<HousekeepingRequest[]>([]);
//   const [recentRequests, setRecentRequests] = useState<HousekeepingRequest[]>([]);

//   useEffect(() => {
//     // Mock data - in real app, fetch from API
//     const mockRequests: HousekeepingRequest[] = [
//       {
//         id: 'HK-001',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'cleaning',
//         priority: 'high',
//         description: 'Regular cleaning service',
//         requestedAt: new Date('2024-01-20T10:00:00'),
//         status: 'completed',
//         assignedTo: 'Clean Team A',
//         completedAt: new Date('2024-01-20T14:30:00')
//       },
//       {
//         id: 'HK-002',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'linen',
//         priority: 'medium',
//         description: 'Extra towel request',
//         requestedAt: new Date('2024-01-21T09:00:00'),
//         status: 'in-progress',
//         assignedTo: 'Housekeeping Staff'
//       },
//       {
//         id: 'HK-003',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'amenities',
//         priority: 'low',
//         description: 'Coffee pod refill',
//         requestedAt: new Date('2024-01-21T11:30:00'),
//         status: 'pending'
//       }
//     ];

//     setActiveRequests(mockRequests.filter(req => req.status !== 'completed'));
//     setRecentRequests(mockRequests.slice(0, 2));
//   }, []);

//   const stats = [
//     { name: 'Upcoming Trips', value: '2', href: '/dashboard/bookings' },
//     { name: 'Wishlist Items', value: '8', href: '/dashboard/wishlist' },
//     { name: 'Total Bookings', value: '12', href: '/dashboard/bookings' },
//     { name: 'Active Requests', value: activeRequests.length.toString(), href: '/dashboard/housekeeping' },
//   ];

//   const recentBookings = [
//     {
//       id: 1,
//       property: 'Luxury Apartment in City Center',
//       date: 'Jan 15 - Jan 20, 2024',
//       status: 'Upcoming',
//       image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300',
//     },
//     {
//       id: 2,
//       property: 'Beachfront Villa',
//       date: 'Dec 20 - Dec 25, 2023',
//       status: 'Completed',
//       image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=300',
//     },
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'completed': return 'bg-green-100 text-green-800';
//       case 'in-progress': return 'bg-blue-100 text-blue-800';
//       case 'verified': return 'bg-purple-100 text-purple-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getRequestIcon = (type: string) => {
//     switch (type) {
//       case 'cleaning': return '🧹';
//       case 'linen': return '🛏️';
//       case 'amenities': return '☕';
//       case 'maintenance': return '🔧';
//       default: return '📋';
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Welcome back, John! 👋</h1>
//         <p className="text-gray-600 mt-2">Here's what's happening with your bookings and requests.</p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => (
//           <Link
//             key={stat.name}
//             href={stat.href}
//             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200"
//           >
//             <div className="text-2xl font-bold text-[#383a3c]">{stat.value}</div>
//             <div className="text-gray-600 text-sm mt-1">{stat.name}</div>
//           </Link>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Recent Bookings */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Recent Bookings</h2>
//             <Link
//               href="/dashboard/bookings"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {recentBookings.map((booking) => (
//               <div
//                 key={booking.id}
//                 className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//               >
//                 <img
//                   src={booking.image}
//                   alt={booking.property}
//                   className="w-16 h-16 rounded-lg object-cover"
//                 />
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-[#383a3c]">{booking.property}</h3>
//                   <p className="text-gray-600 text-sm">{booking.date}</p>
//                 </div>
//                 <span
//                   className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     booking.status === 'Upcoming'
//                       ? 'bg-green-100 text-green-800'
//                       : 'bg-gray-100 text-gray-800'
//                   }`}
//                 >
//                   {booking.status}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Housekeeping Requests */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-[#383a3c]">Service Requests</h2>
//             <Link
//               href="/dashboard/housekeeping"
//               className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="space-y-4">
//             {recentRequests.length > 0 ? (
//               recentRequests.map((request) => (
//                 <div
//                   key={request.id}
//                   className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <div className="text-2xl">{getRequestIcon(request.type)}</div>
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c] capitalize">{request.type} Service</h3>
//                     <p className="text-gray-600 text-sm">{request.description}</p>
//                     <p className="text-gray-500 text-xs mt-1">
//                       Requested: {request.requestedAt.toLocaleDateString()}
//                     </p>
//                   </div>
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}
//                   >
//                     {request.status.replace('-', ' ')}
//                   </span>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8">
//                 <div className="text-4xl mb-3">🧹</div>
//                 <p className="text-gray-600 mb-4">No active service requests</p>
//                 <Link
//                   href="/dashboard/housekeeping"
//                   className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                 >
//                   Request Service
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Link
//             href="/properties"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">🔍</div>
//             <div className="font-medium text-[#383a3c]">Find Properties</div>
//             <div className="text-gray-600 text-sm mt-1">Discover new places to stay</div>
//           </Link>

//           <Link
//             href="/dashboard/wishlist"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">❤️</div>
//             <div className="font-medium text-[#383a3c]">Your Wishlist</div>
//             <div className="text-gray-600 text-sm mt-1">View saved properties</div>
//           </Link>

//           <Link
//             href="/dashboard/housekeeping"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">🧹</div>
//             <div className="font-medium text-[#383a3c]">Request Service</div>
//             <div className="text-gray-600 text-sm mt-1">Housekeeping & maintenance</div>
//           </Link>

//           <Link
//             href="/dashboard/profile"
//             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
//           >
//             <div className="text-2xl mb-2">👤</div>
//             <div className="font-medium text-[#383a3c]">Edit Profile</div>
//             <div className="text-gray-600 text-sm mt-1">Update your information</div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }












































































// // 'use client';

// // import Link from 'next/link';

// // export default function DashboardOverview() {
// //   const stats = [
// //     { name: 'Upcoming Trips', value: '2', href: '/dashboard/bookings' },
// //     { name: 'Wishlist Items', value: '8', href: '/dashboard/wishlist' },
// //     { name: 'Total Bookings', value: '12', href: '/dashboard/bookings' },
// //     { name: 'Reviews Written', value: '5', href: '/dashboard/bookings' },
// //   ];

// //   const recentBookings = [
// //     {
// //       id: 1,
// //       property: 'Luxury Apartment in City Center',
// //       date: 'Jan 15 - Jan 20, 2024',
// //       status: 'Upcoming',
// //       image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300',
// //     },
// //     {
// //       id: 2,
// //       property: 'Beachfront Villa',
// //       date: 'Dec 20 - Dec 25, 2023',
// //       status: 'Completed',
// //       image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=300',
// //     },
// //   ];

// //   return (
// //     <div className="space-y-8">
// //       {/* Welcome Section */}
// //       <div>
// //         <h1 className="text-3xl font-bold text-[#383a3c]">Welcome back, John! 👋</h1>
// //         <p className="text-gray-600 mt-2">Here's what's happening with your bookings.</p>
// //       </div>

// //       {/* Stats Grid */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
// //         {stats.map((stat) => (
// //           <Link
// //             key={stat.name}
// //             href={stat.href}
// //             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200"
// //           >
// //             <div className="text-2xl font-bold text-[#383a3c]">{stat.value}</div>
// //             <div className="text-gray-600 text-sm mt-1">{stat.name}</div>
// //           </Link>
// //         ))}
// //       </div>

// //       {/* Recent Bookings */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //         <div className="flex justify-between items-center mb-6">
// //           <h2 className="text-xl font-semibold text-[#383a3c]">Recent Bookings</h2>
// //           <Link
// //             href="/dashboard/bookings"
// //             className="text-[#f06123] hover:text-orange-600 font-medium text-sm"
// //           >
// //             View all
// //           </Link>
// //         </div>

// //         <div className="space-y-4">
// //           {recentBookings.map((booking) => (
// //             <div
// //               key={booking.id}
// //               className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
// //             >
// //               <img
// //                 src={booking.image}
// //                 alt={booking.property}
// //                 className="w-16 h-16 rounded-lg object-cover"
// //               />
// //               <div className="flex-1">
// //                 <h3 className="font-semibold text-[#383a3c]">{booking.property}</h3>
// //                 <p className="text-gray-600 text-sm">{booking.date}</p>
// //               </div>
// //               <span
// //                 className={`px-3 py-1 rounded-full text-xs font-medium ${
// //                   booking.status === 'Upcoming'
// //                     ? 'bg-green-100 text-green-800'
// //                     : 'bg-gray-100 text-gray-800'
// //                 }`}
// //               >
// //                 {booking.status}
// //               </span>
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Quick Actions */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //         <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //           <Link
// //             href="/properties"
// //             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
// //           >
// //             <div className="text-2xl mb-2">🔍</div>
// //             <div className="font-medium text-[#383a3c]">Find Properties</div>
// //             <div className="text-gray-600 text-sm mt-1">Discover new places to stay</div>
// //           </Link>

// //           <Link
// //             href="/dashboard/wishlist"
// //             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
// //           >
// //             <div className="text-2xl mb-2">❤️</div>
// //             <div className="font-medium text-[#383a3c]">Your Wishlist</div>
// //             <div className="text-gray-600 text-sm mt-1">View saved properties</div>
// //           </Link>

// //           <Link
// //             href="/dashboard/profile"
// //             className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center"
// //           >
// //             <div className="text-2xl mb-2">👤</div>
// //             <div className="font-medium text-[#383a3c]">Edit Profile</div>
// //             <div className="text-gray-600 text-sm mt-1">Update your information</div>
// //           </Link>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

