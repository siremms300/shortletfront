// components/admin/DashboardOverview.tsx
'use client';

import { useState, useEffect } from 'react';
import { bookingsAPI, propertiesAPI, usersAPI } from '@/lib/api';
import StatsCards from './StatsCards';

interface Activity {
  id: string;
  type: 'booking' | 'user' | 'review' | 'property';
  message: string;
  time: string;
  user: string;
}

interface DashboardStats {
  totalProperties: number;
  activeBookings: number;
  totalRevenue: number;
  registeredUsers: number;
  propertyGrowth: number;
  bookingGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
}

export default function DashboardOverview() {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [bookingsResponse, propertiesResponse, usersResponse] = await Promise.all([
        bookingsAPI.getAdminBookings(),
        propertiesAPI.getAdminProperties(),
        usersAPI.getUsers()
      ]);

      const bookings = bookingsResponse.bookings || [];
      const properties = propertiesResponse.properties || [];
      const users = usersResponse || [];

      // Calculate stats
      const dashboardStats = calculateDashboardStats(bookings, properties, users);
      setStats(dashboardStats);

      // Generate recent activity
      const activity = generateRecentActivity(bookings, properties, users);
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (bookings: any[], properties: any[], users: any[]): DashboardStats => {
    const totalProperties = properties.length;
    const activeBookings = bookings.filter(booking => 
      booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'pending'
    ).length;
    
    const totalRevenue = bookings
      .filter(booking => booking.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const registeredUsers = users.length;

    // Simple growth calculations (in a real app, you'd compare with previous period)
    const propertyGrowth = 12; // Mock growth percentage
    const bookingGrowth = 8;   // Mock growth percentage
    const revenueGrowth = 23;  // Mock growth percentage
    const userGrowth = 5;      // Mock growth percentage

    return {
      totalProperties,
      activeBookings,
      totalRevenue,
      registeredUsers,
      propertyGrowth,
      bookingGrowth,
      revenueGrowth,
      userGrowth
    };
  };

  const generateRecentActivity = (bookings: any[], properties: any[], users: any[]): Activity[] => {
    const activities: Activity[] = [];

    // Recent bookings (last 5)
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    recentBookings.forEach(booking => {
      activities.push({
        id: booking._id,
        type: 'booking',
        message: `New ${booking.bookingStatus} booking for ${booking.property.title}`,
        time: formatTimeAgo(booking.createdAt),
        user: `${booking.user.firstName} ${booking.user.lastName}`
      });
    });

    // Recent users (last 2)
    const recentUsers = users
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    recentUsers.forEach((user: any) => {
      activities.push({
        id: user._id,
        type: 'user',
        message: 'New user registered',
        time: formatTimeAgo(user.createdAt),
        user: `${user.firstName} ${user.lastName}`
      });
    });

    // Sort all activities by time
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'user':
        return '👤';
      case 'review':
        return '⭐';
      case 'property':
        return '🏠';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Recent Activity</h2>
            <button
              onClick={fetchDashboardData}
              className="text-[#f06123] hover:text-orange-600 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition duration-200">
                  <div className="text-2xl mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium">{activity.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-gray-500 text-sm">by {activity.user}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No recent activity</h3>
                <p className="text-gray-500">Activity will appear here as users interact with the platform.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <a
              href="/admin/properties/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
            >
              <span className="text-2xl mr-4">➕</span>
              <div>
                <div className="font-medium text-[#383a3c]">Add New Property</div>
                <div className="text-gray-600 text-sm">List a new property for rent</div>
              </div>
            </a>

            <a
              href="/admin/bookings"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
            >
              <span className="text-2xl mr-4">📅</span>
              <div>
                <div className="font-medium text-[#383a3c]">Manage Bookings</div>
                <div className="text-gray-600 text-sm">View and manage all bookings</div>
              </div>
            </a>

            <a
              href="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
            >
              <span className="text-2xl mr-4">👥</span>
              <div>
                <div className="font-medium text-[#383a3c]">User Management</div>
                <div className="text-gray-600 text-sm">Manage users and permissions</div>
              </div>
            </a>

            <a
              href="/admin/reports"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
            >
              <span className="text-2xl mr-4">📈</span>
              <div>
                <div className="font-medium text-[#383a3c]">View Reports</div>
                <div className="text-gray-600 text-sm">Financial and analytics reports</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}






























































// 'use client';

// import StatsCards from './StatsCards';

// export default function DashboardOverview() {
//   const recentActivity = [
//     {
//       id: 1,
//       type: 'booking',
//       message: 'New booking received for Luxury Apartment',
//       time: '2 minutes ago',
//       user: 'Michael Chen'
//     },
//     {
//       id: 2,
//       type: 'user',
//       message: 'New user registered',
//       time: '5 minutes ago',
//       user: 'Sarah Johnson'
//     },
//     {
//       id: 3,
//       type: 'review',
//       message: 'New review submitted',
//       time: '1 hour ago',
//       user: 'David Wilson'
//     },
//     {
//       id: 4,
//       type: 'property',
//       message: 'New property listed',
//       time: '2 hours ago',
//       user: 'Emma Davis'
//     }
//   ];

//   const getActivityIcon = (type: string) => {
//     switch (type) {
//       case 'booking':
//         return '📅';
//       case 'user':
//         return '👤';
//       case 'review':
//         return '⭐';
//       case 'property':
//         return '🏠';
//       default:
//         return '🔔';
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Stats Overview */}
//       <StatsCards />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Recent Activity */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Recent Activity</h2>
//           <div className="space-y-4">
//             {recentActivity.map((activity) => (
//               <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition duration-200">
//                 <div className="text-2xl mt-1">{getActivityIcon(activity.type)}</div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-gray-800 font-medium">{activity.message}</p>
//                   <div className="flex items-center space-x-2 mt-1">
//                     <span className="text-gray-500 text-sm">by {activity.user}</span>
//                     <span className="text-gray-400">•</span>
//                     <span className="text-gray-500 text-sm">{activity.time}</span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Quick Actions</h2>
//           <div className="grid grid-cols-1 gap-4">
//             <a
//               href="/admin/properties/new"
//               className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
//             >
//               <span className="text-2xl mr-4">➕</span>
//               <div>
//                 <div className="font-medium text-[#383a3c]">Add New Property</div>
//                 <div className="text-gray-600 text-sm">List a new property for rent</div>
//               </div>
//             </a>

//             <a
//               href="/admin/bookings"
//               className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
//             >
//               <span className="text-2xl mr-4">📅</span>
//               <div>
//                 <div className="font-medium text-[#383a3c]">Manage Bookings</div>
//                 <div className="text-gray-600 text-sm">View and manage all bookings</div>
//               </div>
//             </a>

//             <a
//               href="/admin/users"
//               className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
//             >
//               <span className="text-2xl mr-4">👥</span>
//               <div>
//                 <div className="font-medium text-[#383a3c]">User Management</div>
//                 <div className="text-gray-600 text-sm">Manage users and permissions</div>
//               </div>
//             </a>

//             <a
//               href="/admin/reports"
//               className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200"
//             >
//               <span className="text-2xl mr-4">📈</span>
//               <div>
//                 <div className="font-medium text-[#383a3c]">View Reports</div>
//                 <div className="text-gray-600 text-sm">Financial and analytics reports</div>
//               </div>
//             </a>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


