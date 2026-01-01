// components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

// Helper function to get full image URL
const getImageUrl = (imagePath: string) => {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
  }
  
  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path, construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/${imagePath.replace(/^public\//, '')}`;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: '📊' },
  { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
  { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
  { name: 'Vendor Orders', href: '/dashboard/vendor-orders', icon: '🛒' }, 
  { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
  { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: '🧹' },
  { name: 'Support', href: '/dashboard/support', icon: '💬' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // Page will redirect, so no need to reset state
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
          <div className="p-6">
            {/* Logo */}
            <div className="mb-8">
              <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
                HolsApartment
              </Link>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
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
            </nav>

            {/* User Section with Logout */}
            <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#f06123]">
                    <img
                      src={getImageUrl(user?.profileImagePath || "")}
                      alt={`${user?.firstName} ${user?.lastName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                      }}
                    />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
                  >
                    View profile
                  </Link>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="mr-2">🚪</span>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Full screen overlay */}
      <div
        className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
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
        <nav className="mt-8 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center px-3 py-4 text-base font-medium rounded-lg transition duration-200 ${
                  isActive
                    ? 'bg-[#f06123] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile User Section with Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 space-y-4 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#f06123]">
                <img
                  src={getImageUrl(user?.profileImagePath || "")}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                  }}
                />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-base font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <Link
                href="/dashboard/profile"
                onClick={onClose}
                className="text-sm font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
              >
                View profile
              </Link>
            </div>
          </div>
          
          {/* Enhanced Logout Button for Mobile */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-200 disabled:bg-red-400 disabled:cursor-not-allowed shadow-sm"
            >
              <span className="mr-3">🚪</span>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}







































































// // components/dashboard/Sidebar.tsx
// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState } from 'react';

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const navigation = [
//   { name: 'Overview', href: '/dashboard', icon: '📊' },
//   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
//   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
//   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
//   { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: '🧹' },
//   { name: 'Support', href: '/dashboard/support', icon: '💬' },
// ];

// export default function Sidebar({ isOpen, onClose }: SidebarProps) {
//   const pathname = usePathname();
//   const { user, logout } = useAuth();
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   const handleLogout = async () => {
//     setIsLoggingOut(true);
//     await logout();
//     // Page will redirect, so no need to reset state
//   };

//   return (
//     <>
//       {/* Desktop Sidebar */}
//       <div className="hidden lg:block">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
//           <div className="p-6">
//             {/* Logo */}
//             <div className="mb-8">
//               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//                 HolsApartment
//               </Link>
//             </div>
            
//             {/* Navigation */}
//             <nav className="space-y-2">
//               {navigation.map((item) => {
//                 const isActive = pathname === item.href;
//                 return (
//                   <Link
//                     key={item.name}
//                     href={item.href}
//                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
//                       isActive
//                         ? 'bg-[#f06123] text-white shadow-sm'
//                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                     }`}
//                   >
//                     <span className="mr-3 text-lg">{item.icon}</span>
//                     {item.name}
//                   </Link>
//                 );
//               })}
//             </nav>

//             {/* User Section with Logout */}
//             <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#f06123]">
//                     <img
//                       src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                       alt={`${user?.firstName} ${user?.lastName}`}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-gray-700">
//                     {user?.firstName} {user?.lastName}
//                   </p>
//                   <Link
//                     href="/dashboard/profile"
//                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
//                   >
//                     View profile
//                   </Link>
//                 </div>
//               </div>
              
//               <button
//                 onClick={handleLogout}
//                 disabled={isLoggingOut}
//                 className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <span className="mr-2">🚪</span>
//                 {isLoggingOut ? 'Logging out...' : 'Logout'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Sidebar - Full screen overlay */}
//       <div
//         className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
//           isOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         {/* Mobile Sidebar Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200">
//           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
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
//         <nav className="mt-8 px-4 space-y-2">
//           {navigation.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={onClose}
//                 className={`flex items-center px-3 py-4 text-base font-medium rounded-lg transition duration-200 ${
//                   isActive
//                     ? 'bg-[#f06123] text-white shadow-sm'
//                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                 }`}
//               >
//                 <span className="mr-3 text-xl">{item.icon}</span>
//                 {item.name}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Mobile User Section with Logout */}
//         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 space-y-4 bg-gray-50">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#f06123]">
//                 <img
//                   src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                   alt={`${user?.firstName} ${user?.lastName}`}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//             <div className="ml-3">
//               <p className="text-base font-medium text-gray-700">
//                 {user?.firstName} {user?.lastName}
//               </p>
//               <Link
//                 href="/dashboard/profile"
//                 onClick={onClose}
//                 className="text-sm font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
//               >
//                 View profile
//               </Link>
//             </div>
//           </div>
          
//           {/* Enhanced Logout Button for Mobile */}
//           <div className="pt-2">
//             <button
//               onClick={handleLogout}
//               disabled={isLoggingOut}
//               className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-200 rounded-lg transition duration-200 disabled:bg-red-400 disabled:cursor-not-allowed shadow-sm"
//             >
//               <span className="mr-3">🚪</span>
//               {isLoggingOut ? 'Logging out...' : 'Logout'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }





























































// // components/dashboard/Sidebar.tsx
// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState } from 'react';

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const navigation = [
//   { name: 'Overview', href: '/dashboard', icon: '📊' },
//   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
//   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
//   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
//   { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: '🧹' },
//   { name: 'Support', href: '/dashboard/support', icon: '💬' },
// ];

// export default function Sidebar({ isOpen, onClose }: SidebarProps) {
//   const pathname = usePathname();
//   const { user, logout } = useAuth();
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   const handleLogout = async () => {
//     setIsLoggingOut(true);
//     await logout();
//     // Page will redirect, so no need to reset state
//   };

//   return (
//     <>
//       {/* Desktop Sidebar */}
//       <div className="hidden lg:block">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
//           <div className="p-6">
//             {/* Logo */}
//             <div className="mb-8">
//               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//                 HolsApartment
//               </Link>
//             </div>
            
//             {/* Navigation */}
//             <nav className="space-y-2">
//               {navigation.map((item) => {
//                 const isActive = pathname === item.href;
//                 return (
//                   <Link
//                     key={item.name}
//                     href={item.href}
//                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
//                       isActive
//                         ? 'bg-[#f06123] text-white shadow-sm'
//                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                     }`}
//                   >
//                     <span className="mr-3 text-lg">{item.icon}</span>
//                     {item.name}
//                   </Link>
//                 );
//               })}
//             </nav>

//             {/* User Section with Logout */}
//             <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#f06123]">
//                     <img
//                       src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                       alt={`${user?.firstName} ${user?.lastName}`}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-gray-700">
//                     {user?.firstName} {user?.lastName}
//                   </p>
//                   <Link
//                     href="/dashboard/profile"
//                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
//                   >
//                     View profile
//                   </Link>
//                 </div>
//               </div>
              
//               <button
//                 onClick={handleLogout}
//                 disabled={isLoggingOut}
//                 className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <span className="mr-2">🚪</span>
//                 {isLoggingOut ? 'Logging out...' : 'Logout'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Sidebar - Full screen overlay */}
//       <div
//         className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
//           isOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         {/* Mobile Sidebar Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200">
//           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
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
//         <nav className="mt-8 px-4 space-y-2">
//           {navigation.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={onClose}
//                 className={`flex items-center px-3 py-4 text-base font-medium rounded-lg transition duration-200 ${
//                   isActive
//                     ? 'bg-[#f06123] text-white shadow-sm'
//                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                 }`}
//               >
//                 <span className="mr-3 text-xl">{item.icon}</span>
//                 {item.name}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Mobile User Section with Logout */}
//         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 space-y-4">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#f06123]">
//                 <img
//                   src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                   alt={`${user?.firstName} ${user?.lastName}`}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//             <div className="ml-3">
//               <p className="text-base font-medium text-gray-700">
//                 {user?.firstName} {user?.lastName}
//               </p>
//               <Link
//                 href="/dashboard/profile"
//                 onClick={onClose}
//                 className="text-sm font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
//               >
//                 View profile
//               </Link>
//             </div>
//           </div>
          
//           <button
//             onClick={handleLogout}
//             disabled={isLoggingOut}
//             className="w-full flex items-center px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <span className="mr-3">🚪</span>
//             {isLoggingOut ? 'Logging out...' : 'Logout'}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }



















































// // components/dashboard/Sidebar.tsx
// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const navigation = [
//   { name: 'Overview', href: '/dashboard', icon: '📊' },
//   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
//   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
//   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
//   { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: '🧹' },
//   { name: 'Support', href: '/dashboard/support', icon: '💬' },
// ];

// export default function Sidebar({ isOpen, onClose }: SidebarProps) {
//   const pathname = usePathname();
//   const { user } = useAuth();

//   return (
//     <>
//       {/* Desktop Sidebar */}
//       <div className="hidden lg:block">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
//           <div className="p-6">
//             {/* Logo */}
//             <div className="mb-8">
//               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//                 HolsApartment
//               </Link>
//             </div>
            
//             {/* Navigation */}
//             <nav className="space-y-2">
//               {navigation.map((item) => {
//                 const isActive = pathname === item.href;
//                 return (
//                   <Link
//                     key={item.name}
//                     href={item.href}
//                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
//                       isActive
//                         ? 'bg-[#f06123] text-white shadow-sm'
//                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                     }`}
//                   >
//                     <span className="mr-3 text-lg">{item.icon}</span>
//                     {item.name}
//                   </Link>
//                 );
//               })}
//             </nav>

//             {/* User Section */}
//             <div className="border-t border-gray-200 mt-6 pt-6">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <img
//                     className="w-10 h-10 rounded-full"
//                     src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                     alt="User"
//                   />
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-gray-700">
//                     {user?.firstName} {user?.lastName}
//                   </p>
//                   <Link
//                     href="/dashboard/profile"
//                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
//                   >
//                     View profile
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Sidebar - Full screen overlay */}
//       <div
//         className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
//           isOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         {/* Mobile Sidebar Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200">
//           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
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
//         <nav className="mt-8 px-4 space-y-2">
//           {navigation.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={onClose}
//                 className={`flex items-center px-3 py-4 text-base font-medium rounded-lg transition duration-200 ${
//                   isActive
//                     ? 'bg-[#f06123] text-white shadow-sm'
//                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
//                 }`}
//               >
//                 <span className="mr-3 text-xl">{item.icon}</span>
//                 {item.name}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Mobile User Section */}
//         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <img
//                 className="w-12 h-12 rounded-full"
//                 src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                 alt="User"
//               />
//             </div>
//             <div className="ml-3">
//               <p className="text-base font-medium text-gray-700">
//                 {user?.firstName} {user?.lastName}
//               </p>
//               <Link
//                 href="/dashboard/profile"
//                 onClick={onClose}
//                 className="text-sm font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
//               >
//                 View profile
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }































































// // // components/dashboard/Sidebar.tsx
// // 'use client';

// // import Link from 'next/link';
// // import { usePathname } from 'next/navigation';

// // interface SidebarProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// // }

// // const navigation = [
// //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// //   { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: '🧹' },
// //   { name: 'Support', href: '/dashboard/support', icon: '💬' },
// // ];

// // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// //   const pathname = usePathname();

// //   return (
// //     <>
// //       {/* Desktop Sidebar */}
// //       <div className="hidden lg:block">
// //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
// //           <div className="p-6">
// //             {/* Logo */}
// //             <div className="mb-8">
// //               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
// //                 HolsApartment
// //               </Link>
// //             </div>
            
// //             {/* Navigation */}
// //             <nav className="space-y-2">
// //               {navigation.map((item) => {
// //                 const isActive = pathname === item.href;
// //                 return (
// //                   <Link
// //                     key={item.name}
// //                     href={item.href}
// //                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// //                       isActive
// //                         ? 'bg-[#f06123] text-white shadow-sm'
// //                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// //                     }`}
// //                   >
// //                     <span className="mr-3 text-lg">{item.icon}</span>
// //                     {item.name}
// //                   </Link>
// //                 );
// //               })}
// //             </nav>

// //             {/* User Section */}
// //             <div className="border-t border-gray-200 mt-6 pt-6">
// //               <div className="flex items-center">
// //                 <div className="flex-shrink-0">
// //                   <img
// //                     className="w-10 h-10 rounded-full"
// //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// //                     alt="User"
// //                   />
// //                 </div>
// //                 <div className="ml-3">
// //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// //                   <Link
// //                     href="/dashboard/profile"
// //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// //                   >
// //                     View profile
// //                   </Link>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Mobile Sidebar - Full screen overlay */}
// //       <div
// //         className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
// //           isOpen ? 'translate-x-0' : '-translate-x-full'
// //         }`}
// //       >
// //         {/* Mobile Sidebar Header */}
// //         <div className="flex items-center justify-between p-4 border-b border-gray-200">
// //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// //           <button
// //             onClick={onClose}
// //             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// //           >
// //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// //             </svg>
// //           </button>
// //         </div>
        
// //         {/* Mobile Navigation */}
// //         <nav className="mt-8 px-4 space-y-2">
// //           {navigation.map((item) => {
// //             const isActive = pathname === item.href;
// //             return (
// //               <Link
// //                 key={item.name}
// //                 href={item.href}
// //                 onClick={onClose}
// //                 className={`flex items-center px-3 py-4 text-base font-medium rounded-lg transition duration-200 ${
// //                   isActive
// //                     ? 'bg-[#f06123] text-white shadow-sm'
// //                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// //                 }`}
// //               >
// //                 <span className="mr-3 text-xl">{item.icon}</span>
// //                 {item.name}
// //               </Link>
// //             );
// //           })}
// //         </nav>

// //         {/* Mobile User Section */}
// //         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
// //           <div className="flex items-center">
// //             <div className="flex-shrink-0">
// //               <img
// //                 className="w-12 h-12 rounded-full"
// //                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// //                 alt="User"
// //               />
// //             </div>
// //             <div className="ml-3">
// //               <p className="text-base font-medium text-gray-700">John Doe</p>
// //               <Link
// //                 href="/dashboard/profile"
// //                 onClick={onClose}
// //                 className="text-sm font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// //               >
// //                 View profile
// //               </Link>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </>
// //   );
// // }




































// // // 'use client';

// // // import Link from 'next/link';
// // // import { usePathname } from 'next/navigation';

// // // interface SidebarProps {
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // // }

// // // const navigation = [
// // //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// // //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// // //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// // //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// // // ];

// // // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// // //   const pathname = usePathname();

// // //   return (
// // //     <>
// // //       {/* Desktop Sidebar */}
// // //       <div className="hidden lg:block">
// // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
// // //           <div className="p-6">
// // //             {/* Logo */}
// // //             <div className="mb-8">
// // //               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
// // //                 HolsApartment
// // //               </Link>
// // //             </div>
            
// // //             {/* Navigation */}
// // //             <nav className="space-y-2">
// // //               {navigation.map((item) => {
// // //                 const isActive = pathname === item.href;
// // //                 return (
// // //                   <Link
// // //                     key={item.name}
// // //                     href={item.href}
// // //                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // //                       isActive
// // //                         ? 'bg-[#f06123] text-white shadow-sm'
// // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // //                     }`}
// // //                   >
// // //                     <span className="mr-3 text-lg">{item.icon}</span>
// // //                     {item.name}
// // //                   </Link>
// // //                 );
// // //               })}
// // //             </nav>

// // //             {/* User Section */}
// // //             <div className="border-t border-gray-200 mt-6 pt-6">
// // //               <div className="flex items-center">
// // //                 <div className="flex-shrink-0">
// // //                   <img
// // //                     className="w-10 h-10 rounded-full"
// // //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // //                     alt="User"
// // //                   />
// // //                 </div>
// // //                 <div className="ml-3">
// // //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// // //                   <Link
// // //                     href="/dashboard/profile"
// // //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // //                   >
// // //                     View profile
// // //                   </Link>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Mobile Sidebar - Full screen overlay */}
// // //       <div
// // //         className={`fixed inset-0 z-50 bg-white transform transition duration-200 ease-in-out lg:hidden ${
// // //           isOpen ? 'translate-x-0' : '-translate-x-full'
// // //         }`}
// // //       >
// // //         {/* Mobile Sidebar Header */}
// // //         <div className="flex items-center justify-between p-4 border-b border-gray-200">
// // //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// // //           <button
// // //             onClick={onClose}
// // //             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// // //           >
// // //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // //             </svg>
// // //           </button>
// // //         </div>
        
// // //         {/* Mobile Navigation */}
// // //         <nav className="mt-8 px-4 space-y-2">
// // //           {navigation.map((item) => {
// // //             const isActive = pathname === item.href;
// // //             return (
// // //               <Link
// // //                 key={item.name}
// // //                 href={item.href}
// // //                 onClick={onClose}
// // //                 className={`flex items-center px-3 py-4 text-base font-medium rounded-lg transition duration-200 ${
// // //                   isActive
// // //                     ? 'bg-[#f06123] text-white shadow-sm'
// // //                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // //                 }`}
// // //               >
// // //                 <span className="mr-3 text-xl">{item.icon}</span>
// // //                 {item.name}
// // //               </Link>
// // //             );
// // //           })}
// // //         </nav>

// // //         {/* Mobile User Section */}
// // //         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
// // //           <div className="flex items-center">
// // //             <div className="flex-shrink-0">
// // //               <img
// // //                 className="w-12 h-12 rounded-full"
// // //                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // //                 alt="User"
// // //               />
// // //             </div>
// // //             <div className="ml-3">
// // //               <p className="text-base font-medium text-gray-700">John Doe</p>
// // //               <Link
// // //                 href="/dashboard/profile"
// // //                 onClick={onClose}
// // //                 className="text-sm font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // //               >
// // //                 View profile
// // //               </Link>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </>
// // //   );
// // // }











































// // // // 'use client';

// // // // import Link from 'next/link';
// // // // import { usePathname } from 'next/navigation';

// // // // interface SidebarProps {
// // // //   isOpen: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // const navigation = [
// // // //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// // // //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// // // //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// // // //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// // // // ];

// // // // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// // // //   const pathname = usePathname();

// // // //   return (
// // // //     <>
// // // //       {/* Desktop Sidebar */}
// // // //       <div className="hidden lg:block">
// // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
// // // //           <div className="p-6">
// // // //             {/* Logo */}
// // // //             <div className="mb-8">
// // // //               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
// // // //                 HolsApartment
// // // //               </Link>
// // // //             </div>
            
// // // //             {/* Navigation */}
// // // //             <nav className="space-y-2">
// // // //               {navigation.map((item) => {
// // // //                 const isActive = pathname === item.href;
// // // //                 return (
// // // //                   <Link
// // // //                     key={item.name}
// // // //                     href={item.href}
// // // //                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                       isActive
// // // //                         ? 'bg-[#f06123] text-white shadow-sm'
// // // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                     }`}
// // // //                   >
// // // //                     <span className="mr-3 text-lg">{item.icon}</span>
// // // //                     {item.name}
// // // //                   </Link>
// // // //                 );
// // // //               })}
// // // //             </nav>

// // // //             {/* User Section */}
// // // //             <div className="border-t border-gray-200 mt-6 pt-6">
// // // //               <div className="flex items-center">
// // // //                 <div className="flex-shrink-0">
// // // //                   <img
// // // //                     className="w-10 h-10 rounded-full"
// // // //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                     alt="User"
// // // //                   />
// // // //                 </div>
// // // //                 <div className="ml-3">
// // // //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //                   <Link
// // // //                     href="/dashboard/profile"
// // // //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //                   >
// // // //                     View profile
// // // //                   </Link>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile Sidebar - No border radius, full width */}
// // // //       <div
// // // //         className={`fixed inset-y-0 left-0 z-50 w-full bg-white transform transition duration-200 ease-in-out lg:hidden ${
// // // //           isOpen ? 'translate-x-0' : '-translate-x-full'
// // // //         }`}
// // // //       >
// // // //         <div className="flex items-center justify-between p-4 border-b border-gray-200">
// // // //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// // // //           <button
// // // //             onClick={onClose}
// // // //             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// // // //           >
// // // //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // // //             </svg>
// // // //           </button>
// // // //         </div>
        
// // // //         <nav className="mt-8 px-4 space-y-2">
// // // //           {navigation.map((item) => {
// // // //             const isActive = pathname === item.href;
// // // //             return (
// // // //               <Link
// // // //                 key={item.name}
// // // //                 href={item.href}
// // // //                 onClick={onClose}
// // // //                 className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                   isActive
// // // //                     ? 'bg-[#f06123] text-white shadow-sm'
// // // //                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                 }`}
// // // //               >
// // // //                 <span className="mr-3 text-lg">{item.icon}</span>
// // // //                 {item.name}
// // // //               </Link>
// // // //             );
// // // //           })}
// // // //         </nav>

// // // //         {/* Mobile User Section */}
// // // //         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
// // // //           <div className="flex items-center">
// // // //             <div className="flex-shrink-0">
// // // //               <img
// // // //                 className="w-10 h-10 rounded-full"
// // // //                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                 alt="User"
// // // //               />
// // // //             </div>
// // // //             <div className="ml-3">
// // // //               <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //               <Link
// // // //                 href="/dashboard/profile"
// // // //                 onClick={onClose}
// // // //                 className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //               >
// // // //                 View profile
// // // //               </Link>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // }












































// // // // 'use client';

// // // // import Link from 'next/link';
// // // // import { usePathname } from 'next/navigation';

// // // // interface SidebarProps {
// // // //   isOpen: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // const navigation = [
// // // //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// // // //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// // // //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// // // //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// // // // ];

// // // // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// // // //   const pathname = usePathname();

// // // //   return (
// // // //     <>
// // // //       {/* Desktop Sidebar - Now a regular component in the flow */}
// // // //       <div className="hidden lg:block">
// // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-8">
// // // //           <div className="p-6">
// // // //             {/* Logo */}
// // // //             <div className="mb-8">
// // // //               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
// // // //                 HolsApartment
// // // //               </Link>
// // // //             </div>
            
// // // //             {/* Navigation */}
// // // //             <nav className="space-y-2">
// // // //               {navigation.map((item) => {
// // // //                 const isActive = pathname === item.href;
// // // //                 return (
// // // //                   <Link
// // // //                     key={item.name}
// // // //                     href={item.href}
// // // //                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                       isActive
// // // //                         ? 'bg-[#f06123] text-white shadow-sm'
// // // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                     }`}
// // // //                   >
// // // //                     <span className="mr-3 text-lg">{item.icon}</span>
// // // //                     {item.name}
// // // //                   </Link>
// // // //                 );
// // // //               })}
// // // //             </nav>

// // // //             {/* User Section */}
// // // //             <div className="border-t border-gray-200 mt-6 pt-6">
// // // //               <div className="flex items-center">
// // // //                 <div className="flex-shrink-0">
// // // //                   <img
// // // //                     className="w-10 h-10 rounded-full"
// // // //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                     alt="User"
// // // //                   />
// // // //                 </div>
// // // //                 <div className="ml-3">
// // // //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //                   <Link
// // // //                     href="/dashboard/profile"
// // // //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //                   >
// // // //                     View profile
// // // //                   </Link>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile Sidebar */}
// // // //       <div
// // // //         className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition duration-200 ease-in-out lg:hidden ${
// // // //           isOpen ? 'translate-x-0' : '-translate-x-full'
// // // //         }`}
// // // //       >
// // // //         <div className="flex items-center justify-between p-6 border-b border-gray-200">
// // // //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// // // //           <button
// // // //             onClick={onClose}
// // // //             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// // // //           >
// // // //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // // //             </svg>
// // // //           </button>
// // // //         </div>
        
// // // //         <nav className="mt-8 px-6 space-y-2">
// // // //           {navigation.map((item) => {
// // // //             const isActive = pathname === item.href;
// // // //             return (
// // // //               <Link
// // // //                 key={item.name}
// // // //                 href={item.href}
// // // //                 onClick={onClose}
// // // //                 className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                   isActive
// // // //                     ? 'bg-[#f06123] text-white shadow-sm'
// // // //                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                 }`}
// // // //               >
// // // //                 <span className="mr-3 text-lg">{item.icon}</span>
// // // //                 {item.name}
// // // //               </Link>
// // // //             );
// // // //           })}
// // // //         </nav>

// // // //         {/* Mobile User Section */}
// // // //         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-6">
// // // //           <div className="flex items-center">
// // // //             <div className="flex-shrink-0">
// // // //               <img
// // // //                 className="w-10 h-10 rounded-full"
// // // //                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                 alt="User"
// // // //               />
// // // //             </div>
// // // //             <div className="ml-3">
// // // //               <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //               <Link
// // // //                 href="/dashboard/profile"
// // // //                 onClick={onClose}
// // // //                 className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //               >
// // // //                 View profile
// // // //               </Link>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // }





























// // // // 'use client';

// // // // import Link from 'next/link';
// // // // import { usePathname } from 'next/navigation';

// // // // interface SidebarProps {
// // // //   isOpen: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // const navigation = [
// // // //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// // // //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// // // //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// // // //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// // // // ];

// // // // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// // // //   const pathname = usePathname();

// // // //   return (
// // // //     <>
// // // //       {/* Desktop Sidebar - Fixed but with proper z-index */}
// // // //       <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
// // // //         <div className="flex flex-col w-64 h-full bg-white border-r border-gray-200">
// // // //           <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
// // // //             {/* Logo */}
// // // //             <div className="flex items-center flex-shrink-0 px-4 mb-8">
// // // //               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
// // // //                 HolsApartment
// // // //               </Link>
// // // //             </div>
            
// // // //             {/* Navigation */}
// // // //             <nav className="flex-1 px-4 space-y-2">
// // // //               {navigation.map((item) => {
// // // //                 const isActive = pathname === item.href;
// // // //                 return (
// // // //                   <Link
// // // //                     key={item.name}
// // // //                     href={item.href}
// // // //                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                       isActive
// // // //                         ? 'bg-[#f06123] text-white shadow-sm'
// // // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                     }`}
// // // //                   >
// // // //                     <span className="mr-3 text-lg">{item.icon}</span>
// // // //                     {item.name}
// // // //                   </Link>
// // // //                 );
// // // //               })}
// // // //             </nav>

// // // //             {/* User Section */}
// // // //             <div className="flex-shrink-0 border-t border-gray-200 p-4">
// // // //               <div className="flex items-center">
// // // //                 <div className="flex-shrink-0">
// // // //                   <img
// // // //                     className="w-10 h-10 rounded-full"
// // // //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                     alt="User"
// // // //                   />
// // // //                 </div>
// // // //                 <div className="ml-3">
// // // //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //                   <Link
// // // //                     href="/dashboard/profile"
// // // //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //                   >
// // // //                     View profile
// // // //                   </Link>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile Sidebar */}
// // // //       <div
// // // //         className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition duration-200 ease-in-out lg:hidden ${
// // // //           isOpen ? 'translate-x-0' : '-translate-x-full'
// // // //         }`}
// // // //       >
// // // //         <div className="flex items-center justify-between p-4 border-b border-gray-200">
// // // //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// // // //           <button
// // // //             onClick={onClose}
// // // //             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// // // //           >
// // // //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // // //             </svg>
// // // //           </button>
// // // //         </div>
        
// // // //         <nav className="mt-8 px-4 space-y-2">
// // // //           {navigation.map((item) => {
// // // //             const isActive = pathname === item.href;
// // // //             return (
// // // //               <Link
// // // //                 key={item.name}
// // // //                 href={item.href}
// // // //                 onClick={onClose}
// // // //                 className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                   isActive
// // // //                     ? 'bg-[#f06123] text-white shadow-sm'
// // // //                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                 }`}
// // // //               >
// // // //                 <span className="mr-3 text-lg">{item.icon}</span>
// // // //                 {item.name}
// // // //               </Link>
// // // //             );
// // // //           })}
// // // //         </nav>

// // // //         {/* Mobile User Section */}
// // // //         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
// // // //           <div className="flex items-center">
// // // //             <div className="flex-shrink-0">
// // // //               <img
// // // //                 className="w-10 h-10 rounded-full"
// // // //                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                 alt="User"
// // // //               />
// // // //             </div>
// // // //             <div className="ml-3">
// // // //               <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //               <Link
// // // //                 href="/dashboard/profile"
// // // //                 onClick={onClose}
// // // //                 className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //               >
// // // //                 View profile
// // // //               </Link>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // }































// // // // 'use client';

// // // // import Link from 'next/link';
// // // // import { usePathname } from 'next/navigation';

// // // // interface SidebarProps {
// // // //   isOpen: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // const navigation = [
// // // //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// // // //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// // // //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// // // //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// // // // ];

// // // // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// // // //   const pathname = usePathname();

// // // //   return (
// // // //     <>
// // // //       {/* Desktop Sidebar */}
// // // //       <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
// // // //         <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
// // // //           <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
// // // //             {/* Logo */}
// // // //             <div className="flex items-center flex-shrink-0 px-4 mb-8">
// // // //               <Link href="/" className="text-2xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
// // // //                 HolsApartment
// // // //               </Link>
// // // //             </div>
            
// // // //             {/* Navigation */}
// // // //             <nav className="flex-1 px-4 space-y-2">
// // // //               {navigation.map((item) => {
// // // //                 const isActive = pathname === item.href;
// // // //                 return (
// // // //                   <Link
// // // //                     key={item.name}
// // // //                     href={item.href}
// // // //                     className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                       isActive
// // // //                         ? 'bg-[#f06123] text-white shadow-sm'
// // // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                     }`}
// // // //                   >
// // // //                     <span className="mr-3 text-lg">{item.icon}</span>
// // // //                     {item.name}
// // // //                   </Link>
// // // //                 );
// // // //               })}
// // // //             </nav>

// // // //             {/* User Section */}
// // // //             <div className="flex-shrink-0 border-t border-gray-200 p-4">
// // // //               <div className="flex items-center">
// // // //                 <div className="flex-shrink-0">
// // // //                   <img
// // // //                     className="w-10 h-10 rounded-full"
// // // //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                     alt="User"
// // // //                   />
// // // //                 </div>
// // // //                 <div className="ml-3">
// // // //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //                   <Link
// // // //                     href="/dashboard/profile"
// // // //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //                   >
// // // //                     View profile
// // // //                   </Link>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile Sidebar */}
// // // //       <div
// // // //         className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition duration-200 ease-in-out lg:hidden ${
// // // //           isOpen ? 'translate-x-0' : '-translate-x-full'
// // // //         }`}
// // // //       >
// // // //         <div className="flex items-center justify-between p-4 border-b border-gray-200">
// // // //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// // // //           <button
// // // //             onClick={onClose}
// // // //             className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// // // //           >
// // // //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // // //             </svg>
// // // //           </button>
// // // //         </div>
        
// // // //         <nav className="mt-8 px-4 space-y-2">
// // // //           {navigation.map((item) => {
// // // //             const isActive = pathname === item.href;
// // // //             return (
// // // //               <Link
// // // //                 key={item.name}
// // // //                 href={item.href}
// // // //                 onClick={onClose}
// // // //                 className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                   isActive
// // // //                     ? 'bg-[#f06123] text-white shadow-sm'
// // // //                     : 'text-gray-700 hover:bg-gray-100 hover:text-[#383a3c]'
// // // //                 }`}
// // // //               >
// // // //                 <span className="mr-3 text-lg">{item.icon}</span>
// // // //                 {item.name}
// // // //               </Link>
// // // //             );
// // // //           })}
// // // //         </nav>

// // // //         {/* Mobile User Section */}
// // // //         <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
// // // //           <div className="flex items-center">
// // // //             <div className="flex-shrink-0">
// // // //               <img
// // // //                 className="w-10 h-10 rounded-full"
// // // //                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                 alt="User"
// // // //               />
// // // //             </div>
// // // //             <div className="ml-3">
// // // //               <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //               <Link
// // // //                 href="/dashboard/profile"
// // // //                 onClick={onClose}
// // // //                 className="text-xs font-medium text-[#f06123] hover:text-orange-600 transition duration-200"
// // // //               >
// // // //                 View profile
// // // //               </Link>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Desktop Spacer */}
// // // //       <div className="hidden lg:block w-64 flex-shrink-0"></div>
// // // //     </>
// // // //   );
// // // // }


































// // // // 'use client';

// // // // import Link from 'next/link';
// // // // import { usePathname } from 'next/navigation';

// // // // interface SidebarProps {
// // // //   isOpen: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // const navigation = [
// // // //   { name: 'Overview', href: '/dashboard', icon: '📊' },
// // // //   { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
// // // //   { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
// // // //   { name: 'Wishlist', href: '/dashboard/wishlist', icon: '❤️' },
// // // // ];

// // // // export default function Sidebar({ isOpen, onClose }: SidebarProps) {
// // // //   const pathname = usePathname();

// // // //   return (
// // // //     <>
// // // //       {/* Desktop Sidebar */}
// // // //       <div className="hidden lg:flex lg:flex-shrink-0">
// // // //         <div className="flex flex-col w-64 bg-white border-r border-gray-200">
// // // //           <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
// // // //             {/* Logo */}
// // // //             <div className="flex items-center flex-shrink-0 px-4">
// // // //               <Link href="/" className="text-2xl font-bold text-[#383a3c]">
// // // //                 HolsApartment
// // // //               </Link>
// // // //             </div>
            
// // // //             {/* Navigation */}
// // // //             <nav className="mt-8 flex-1 px-4 space-y-2">
// // // //               {navigation.map((item) => {
// // // //                 const isActive = pathname === item.href;
// // // //                 return (
// // // //                   <Link
// // // //                     key={item.name}
// // // //                     href={item.href}
// // // //                     className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                       isActive
// // // //                         ? 'bg-[#f06123] text-white'
// // // //                         : 'text-gray-700 hover:bg-gray-100'
// // // //                     }`}
// // // //                   >
// // // //                     <span className="mr-3 text-lg">{item.icon}</span>
// // // //                     {item.name}
// // // //                   </Link>
// // // //                 );
// // // //               })}
// // // //             </nav>

// // // //             {/* User section */}
// // // //             <div className="flex-shrink-0 border-t border-gray-200 p-4">
// // // //               <div className="flex items-center">
// // // //                 <div className="flex-shrink-0">
// // // //                   <img
// // // //                     className="w-10 h-10 rounded-full"
// // // //                     src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //                     alt="User"
// // // //                   />
// // // //                 </div>
// // // //                 <div className="ml-3">
// // // //                   <p className="text-sm font-medium text-gray-700">John Doe</p>
// // // //                   <Link
// // // //                     href="/dashboard/profile"
// // // //                     className="text-xs font-medium text-[#f06123] hover:text-orange-600"
// // // //                   >
// // // //                     View profile
// // // //                   </Link>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile Sidebar */}
// // // //       <div
// // // //         className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition duration-200 ease-in-out lg:hidden ${
// // // //           isOpen ? 'translate-x-0' : '-translate-x-full'
// // // //         }`}
// // // //       >
// // // //         <div className="flex items-center justify-between p-4 border-b border-gray-200">
// // // //           <div className="text-xl font-bold text-[#383a3c]">HolsApartment</div>
// // // //           <button
// // // //             onClick={onClose}
// // // //             className="text-gray-400 hover:text-gray-600"
// // // //           >
// // // //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // // //             </svg>
// // // //           </button>
// // // //         </div>
        
// // // //         <nav className="mt-8 px-4 space-y-2">
// // // //           {navigation.map((item) => {
// // // //             const isActive = pathname === item.href;
// // // //             return (
// // // //               <Link
// // // //                 key={item.name}
// // // //                 href={item.href}
// // // //                 onClick={onClose}
// // // //                 className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
// // // //                   isActive
// // // //                     ? 'bg-[#f06123] text-white'
// // // //                     : 'text-gray-700 hover:bg-gray-100'
// // // //                 }`}
// // // //               >
// // // //                 <span className="mr-3 text-lg">{item.icon}</span>
// // // //                 {item.name}
// // // //               </Link>
// // // //             );
// // // //           })}
// // // //         </nav>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // }