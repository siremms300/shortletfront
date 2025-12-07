// components/admin/StatsCards.tsx
'use client';

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

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const statItems = [
    {
      name: 'Total Properties',
      value: stats.totalProperties.toString(),
      change: `+${stats.propertyGrowth}%`,
      changeType: 'positive',
      icon: '🏠'
    },
    {
      name: 'Active Bookings',
      value: stats.activeBookings.toString(),
      change: `+${stats.bookingGrowth}%`,
      changeType: 'positive',
      icon: '📅'
    },
    {
      name: 'Total Revenue',
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      change: `+${stats.revenueGrowth}%`,
      changeType: 'positive',
      icon: '💰'
    },
    {
      name: 'Registered Users',
      value: stats.registeredUsers.toString(),
      change: `+${stats.userGrowth}%`,
      changeType: 'positive',
      icon: '👥'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => (
        <div
          key={stat.name}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-[#383a3c] mt-1">{stat.value}</p>
              <p className={`text-sm mt-1 ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} from last month
              </p>
            </div>
            <div className="text-3xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

























































// 'use client';

// export default function StatsCards() {
//   const stats = [
//     {
//       name: 'Total Properties',
//       value: '42',
//       change: '+12%',
//       changeType: 'positive',
//       icon: '🏠'
//     },
//     {
//       name: 'Active Bookings',
//       value: '18',
//       change: '+5%',
//       changeType: 'positive',
//       icon: '📅'
//     },
//     {
//       name: 'Total Revenue',
//       value: '$12,480',
//       change: '+23%',
//       changeType: 'positive',
//       icon: '💰'
//     },
//     {
//       name: 'Registered Users',
//       value: '1,248',
//       change: '+8%',
//       changeType: 'positive',
//       icon: '👥'
//     }
//   ];

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//       {stats.map((stat) => (
//         <div
//           key={stat.name}
//           className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200"
//         >
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">{stat.name}</p>
//               <p className="text-2xl font-bold text-[#383a3c] mt-1">{stat.value}</p>
//               <p className={`text-sm mt-1 ${
//                 stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
//               }`}>
//                 {stat.change} from last month
//               </p>
//             </div>
//             <div className="text-3xl">{stat.icon}</div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

