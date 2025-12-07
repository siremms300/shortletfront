// components/admin/AdminSidebar
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminNavigation = [
  {
    category: 'Dashboard',
    items: [
      { name: 'Overview', href: '/admin', icon: '📊' },
    ]
  },
  {
    category: 'Property Management',
    items: [
      { name: 'All Properties', href: '/admin/properties', icon: '🏠' },
      { name: 'Add Property', href: '/admin/properties/new', icon: '➕' },
      { name: 'Reviews', href: '/admin/reviews', icon: '⭐' },
    ]
  },
  {
    category: 'Vendor Management',
    items: [
      { name: 'All Vendors', href: '/admin/vendors', icon: '🏪' },
      { name: 'Vendor Orders', href: '/admin/vendor-orders', icon: '📦' },
       { name: 'Vendor Products', href: '/admin/vendor-products', icon: '📦' }, 
      { name: 'Add Product', href: '/admin/vendor-products/new', icon: '➕' }, 
    ]
  },
  {
    category: 'Operational Management',
    items: [
      { name: 'Housekeeping', href: '/admin/housekeeping', icon: '🧹' },
      { name: 'Inventory', href: '/admin/inventorymanager', icon: '📦' },
      { name: 'Maintenance', href: '/admin/maintenancetracker', icon: '🔧' },
      { name: 'Staff Scheduling', href: '/admin/staffscheduler', icon: '👥' },
      { name: 'Utility Tracking', href: '/admin/utilitytracker', icon: '💡' },
      { name: 'Expense Logging', href: '/admin/expenselogger', icon: '💰' },
    ]
  },
  {
    category: 'User Management',
    items: [
      { name: 'All Users', href: '/admin/users', icon: '👥' },
      { name: 'Host Applications', href: '/admin/host-applications', icon: '📝' },
    ]
  },
  {
    category: 'Booking Management',
    items: [
      { name: 'All Bookings', href: '/admin/bookings', icon: '📅' },
      { name: 'Calendar', href: '/admin/calendar', icon: '📆' },
    ]
  },
  {
    category: 'Financial',
    items: [
      { name: 'Transactions', href: '/admin/transactions', icon: '💰' },
      { name: 'Payouts', href: '/admin/payouts', icon: '💳' },
      { name: 'Reports', href: '/admin/reports', icon: '📈' },
    ]
  },
  {
    category: 'System',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
      { name: 'Amenities', href: '/admin/amenities', icon: '🏊' },
    ]
  },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
          <div className="p-6">
            {/* Admin Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#383a3c]">Admin Panel</h1>
              <p className="text-gray-600 text-sm mt-1">HolsApartment</p>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-6">
              {adminNavigation.map((section) => (
                <div key={section.category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                            isActive
                              ? 'bg-[#f06123] text-white shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
                          }`}
                        >
                          <span className="mr-3">{item.icon}</span>
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <div className="text-xl font-bold text-[#383a3c]">Admin Panel</div>
            <div className="text-gray-600 text-sm">HolsApartment</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div className="overflow-y-auto h-full pb-20">
          <nav className="p-4 space-y-6">
            {adminNavigation.map((section) => (
              <div key={section.category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center px-3 py-3 text-base font-medium rounded-lg transition duration-200 ${
                          isActive
                            ? 'bg-[#f06123] text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}






































// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// interface AdminSidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const adminNavigation = [
//   {
//     category: 'Dashboard',
//     items: [
//       { name: 'Overview', href: '/admin', icon: '📊' },
//     ]
//   },
//   {
//     category: 'Property Management',
//     items: [
//       { name: 'All Properties', href: '/admin/properties', icon: '🏠' },
//       { name: 'Add Property', href: '/admin/properties/new', icon: '➕' },
//       { name: 'Reviews', href: '/admin/reviews', icon: '⭐' },
//     ]
//   },
//   {
//     category: 'User Management',
//     items: [
//       { name: 'All Users', href: '/admin/users', icon: '👥' },
//       { name: 'Host Applications', href: '/admin/host-applications', icon: '📝' },
//     ]
//   },
//   {
//     category: 'Booking Management',
//     items: [
//       { name: 'All Bookings', href: '/admin/bookings', icon: '📅' },
//       { name: 'Calendar', href: '/admin/calendar', icon: '📆' },
//     ]
//   },
//   {
//     category: 'Financial',
//     items: [
//       { name: 'Transactions', href: '/admin/transactions', icon: '💰' },
//       { name: 'Payouts', href: '/admin/payouts', icon: '💳' },
//       { name: 'Reports', href: '/admin/reports', icon: '📈' },
//     ]
//   },
//   {
//     category: 'System',
//     items: [
//       { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
//       { name: 'Amenities', href: '/admin/amenities', icon: '🏊' },
//     ]
//   },
// ];

// export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
//   const pathname = usePathname();

//   return (
//     <>
//       {/* Desktop Sidebar */}
//       <div className="hidden lg:block">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
//           <div className="p-6">
//             {/* Admin Header */}
//             <div className="mb-8">
//               <h1 className="text-2xl font-bold text-[#383a3c]">Admin Panel</h1>
//               <p className="text-gray-600 text-sm mt-1">HolsApartment</p>
//             </div>
            
//             {/* Navigation */}
//             <nav className="space-y-6">
//               {adminNavigation.map((section) => (
//                 <div key={section.category}>
//                   <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                     {section.category}
//                   </h3>
//                   <div className="space-y-1">
//                     {section.items.map((item) => {
//                       const isActive = pathname === item.href;
//                       return (
//                         <Link
//                           key={item.name}
//                           href={item.href}
//                           className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
//                             isActive
//                               ? 'bg-[#f06123] text-white shadow-sm'
//                               : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                           }`}
//                         >
//                           <span className="mr-3">{item.icon}</span>
//                           {item.name}
//                         </Link>
//                       );
//                     })}
//                   </div>
//                 </div>
//               ))}
//             </nav>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Sidebar */}
//       <div
//         className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
//           isOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         {/* Mobile Sidebar Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200">
//           <div>
//             <div className="text-xl font-bold text-[#383a3c]">Admin Panel</div>
//             <div className="text-gray-600 text-sm">HolsApartment</div>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
        
//         {/* Mobile Navigation */}
//         <div className="overflow-y-auto h-full pb-20">
//           <nav className="p-4 space-y-6">
//             {adminNavigation.map((section) => (
//               <div key={section.category}>
//                 <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                   {section.category}
//                 </h3>
//                 <div className="space-y-1">
//                   {section.items.map((item) => {
//                     const isActive = pathname === item.href;
//                     return (
//                       <Link
//                         key={item.name}
//                         href={item.href}
//                         onClick={onClose}
//                         className={`flex items-center px-3 py-3 text-base font-medium rounded-lg transition duration-200 ${
//                           isActive
//                             ? 'bg-[#f06123] text-white shadow-sm'
//                             : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                         }`}
//                       >
//                         <span className="mr-3 text-lg">{item.icon}</span>
//                         {item.name}
//                       </Link>
//                     );
//                   })}
//                 </div>
//               </div>
//             ))}
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// }

