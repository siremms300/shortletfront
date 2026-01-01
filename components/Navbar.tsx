// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState, useRef, useEffect } from 'react';

// // Helper function to get full image URL
// const getImageUrl = (imagePath: string) => {
//   if (!imagePath) {
//     return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
//   }
  
//   // If it's already a full URL (starts with http), return as is
//   if (imagePath.startsWith('http')) {
//     return imagePath;
//   }
  
//   // If it's a relative path from uploads folder
//   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
//   // Remove any leading "public/" and construct proper URL
//   const cleanPath = imagePath.replace(/^public\//, '');
  
//   return `${baseUrl}/${cleanPath}`;
// };

// export default function Navbar() {
//   const { user, logout, isAdmin } = useAuth();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleLogout = async () => {
//     await logout();
//     setIsDropdownOpen(false);
//   };

//   // Determine dashboard link based on user role
//   const getDashboardLink = () => {
//     return isAdmin ? '/admin' : '/dashboard';
//   };

//   // Determine dashboard text based on user role
//   const getDashboardText = () => {
//     return isAdmin ? 'Admin Dashboard' : 'Dashboard';
//   };

//   return (
//     <nav className="bg-[#383a3c] shadow-sm border-b fixed top-0 left-0 right-0 z-50">
//       <div className="container mx-auto px-4 py-3">
//         <div className="flex justify-between items-center">
//           <Link href="/" className="flex items-center">
//             <Image 
//               src="/logo.jpg" 
//               alt="HolsApartment Logo" 
//               width={160} 
//               height={40}
//               className="h-8 w-auto hover:opacity-80 transition duration-200"
//               priority
//             />
//           </Link>
//           <div className="space-x-4">
//             {user ? (
//               <div className="flex items-center space-x-4">
//                 {/* Desktop - Show Dashboard link and Avatar dropdown */}
//                 <div className="hidden md:flex items-center space-x-4">
//                   <Link 
//                     href={getDashboardLink()}
//                     className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                   >
//                     {getDashboardText()}
//                   </Link>
                  
//                   {/* Avatar Dropdown */}
//                   <div className="relative" ref={dropdownRef}>
//                     <button
//                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                       className="flex items-center space-x-2 focus:outline-none"
//                     >
//                       <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123] hover:border-orange-400 transition duration-200">
//                         <img
//                           src={getImageUrl(user?.profileImagePath || "")}
//                           alt={`${user.firstName} ${user.lastName}`}
//                           className="w-full h-full object-cover"
//                           onError={(e) => {
//                             e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
//                           }}
//                         />
//                       </div>
//                       <svg 
//                         className={`w-4 h-4 text-[#fcfeff] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </button>

//                     {/* Dropdown Menu */}
//                     {isDropdownOpen && (
//                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                         <div className="px-4 py-2 border-b border-gray-100">
//                           <p className="text-sm font-medium text-gray-900">
//                             {user.firstName} {user.lastName}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                           {isAdmin && (
//                             <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#f06123] text-white rounded-full">
//                               Admin
//                             </span>
//                           )}
//                         </div>
                        
//                         <Link
//                           href={getDashboardLink()}
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           {isAdmin ? '🛠️ Admin Panel' : '📊 Dashboard'}
//                         </Link>
                        
//                         <Link
//                           href="/dashboard/profile"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           👤 My Profile
//                         </Link>

//                         {/* Admin-only links */}
//                         {isAdmin && (
//                           <>
//                             <div className="border-t border-gray-100 my-1"></div>
//                             <Link
//                               href="/admin/users"
//                               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                               onClick={() => setIsDropdownOpen(false)}
//                             >
//                               👥 Manage Users
//                             </Link>
//                             <Link
//                               href="/admin/properties"
//                               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                               onClick={() => setIsDropdownOpen(false)}
//                             >
//                               🏠 Manage Properties
//                             </Link>
//                           </>
//                         )}
                        
//                         <div className="border-t border-gray-100 mt-1">
//                           <button
//                             onClick={handleLogout}
//                             className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
//                           >
//                             🚪 Logout
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Mobile - Show Dashboard button and Avatar */}
//                 <div className="md:hidden flex items-center space-x-3">
//                   <Link 
//                     href={getDashboardLink()}
//                     className="bg-[#f06123] text-[#fcfeff] px-3 py-2 rounded-lg hover:bg-orange-600 transition duration-200 text-sm font-medium"
//                   >
//                     {getDashboardText()}
//                   </Link>
//                   <button
//                     onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                     className="flex items-center"
//                   >
//                     <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123]">
//                       <img
//                         src={getImageUrl(user?.profileImagePath || "")}
//                         alt={`${user.firstName} ${user.lastName}`}
//                         className="w-full h-full object-cover"
//                         onError={(e) => {
//                           e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
//                         }}
//                       />
//                     </div>
//                   </button>

//                   {/* Mobile Dropdown Menu */}
//                   {isDropdownOpen && (
//                     <div className="absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                       <div className="px-4 py-2 border-b border-gray-100">
//                         <p className="text-sm font-medium text-gray-900">
//                           {user.firstName} {user.lastName}
//                         </p>
//                         <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                         {isAdmin && (
//                           <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#f06123] text-white rounded-full">
//                             Admin
//                           </span>
//                         )}
//                       </div>
                      
//                       <Link
//                         href={getDashboardLink()}
//                         className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                         onClick={() => setIsDropdownOpen(false)}
//                       >
//                         {isAdmin ? '🛠️ Admin Panel' : '📊 Dashboard'}
//                       </Link>
                      
//                       <Link
//                         href="/dashboard/profile"
//                         className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                         onClick={() => setIsDropdownOpen(false)}
//                       >
//                         👤 My Profile
//                       </Link>

//                       {/* Admin-only mobile links */}
//                       {isAdmin && (
//                         <>
//                           <div className="border-t border-gray-100 my-1"></div>
//                           <Link
//                             href="/admin/users"
//                             className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                             onClick={() => setIsDropdownOpen(false)}
//                           >
//                             👥 Manage Users
//                           </Link>
//                           <Link
//                             href="/admin/properties"
//                             className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                             onClick={() => setIsDropdownOpen(false)}
//                           >
//                             🏠 Manage Properties
//                           </Link>
//                         </>
//                       )}
                      
//                       <div className="border-t border-gray-100 mt-1">
//                         <button
//                           onClick={handleLogout}
//                           className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
//                         >
//                           🚪 Logout
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <>
//                 <Link 
//                   href="/login" 
//                   className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                 >
//                   Login
//                 </Link>
//                 <Link 
//                   href="/signup" 
//                   className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//                 >
//                   Sign Up
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }
























































































// client/components/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

// Helper function to get full image URL
const getImageUrl = (imagePath: string) => {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
  }
  
  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path from uploads folder
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Remove any leading "public/" and construct proper URL
  const cleanPath = imagePath.replace(/^public\//, '');
  
  return `${baseUrl}/${cleanPath}`;
};

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    return isAdmin ? '/admin' : '/dashboard';
  };

  // Determine dashboard text based on user role
  const getDashboardText = () => {
    return isAdmin ? 'Admin Dashboard' : 'Dashboard';
  };

  return (
    <nav className="bg-[#383a3c] shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="HolsApartment Logo" 
              width={160} 
              height={40}
              className="h-8 w-auto hover:opacity-80 transition duration-200"
              priority
            />
          </Link>
          <div className="space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Desktop - Show Dashboard link and Avatar dropdown */}
                <div className="hidden md:flex items-center space-x-4">
                  <Link 
                    href={getDashboardLink()}
                    className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
                  >
                    {getDashboardText()}
                  </Link>
                  
                  {/* Avatar Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123] hover:border-orange-400 transition duration-200">
                        <img
                          src={getImageUrl(user?.profileImagePath || "")}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                          }}
                        />
                      </div>
                      <svg 
                        className={`w-4 h-4 text-[#fcfeff] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          {isAdmin && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#f06123] text-white rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        
                        <Link
                          href={getDashboardLink()}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {isAdmin ? '🛠️ Admin Panel' : '📊 Dashboard'}
                        </Link>
                        
                        <Link
                          href="/dashboard/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          👤 My Profile
                        </Link>

                        {/* Admin-only links */}
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <Link
                              href="/admin/users"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              👥 Manage Users
                            </Link>
                            <Link
                              href="/admin/properties"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              🏠 Manage Properties
                            </Link>
                          </>
                        )}
                        
                        <div className="border-t border-gray-100 mt-1">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
                          >
                            🚪 Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile - Show Dashboard button and Avatar */}
                <div className="md:hidden flex items-center space-x-3">
                  <Link 
                    href={getDashboardLink()}
                    className="bg-[#f06123] text-[#fcfeff] px-3 py-2 rounded-lg hover:bg-orange-600 transition duration-200 text-sm font-medium"
                  >
                    {getDashboardText()}
                  </Link>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123]">
                      <img
                        src={getImageUrl(user?.profileImagePath || "")}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                        }}
                      />
                    </div>
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#f06123] text-white rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      <Link
                        href={getDashboardLink()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {isAdmin ? '🛠️ Admin Panel' : '📊 Dashboard'}
                      </Link>
                      
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        👤 My Profile
                      </Link>

                      {/* Admin-only mobile links */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Link
                            href="/admin/users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            👥 Manage Users
                          </Link>
                          <Link
                            href="/admin/properties"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            🏠 Manage Properties
                          </Link>
                        </>
                      )}
                      
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}



// // Add this to your navigation links
// <Link
//   href="/marketplace"
//   className="text-[#383a3c] hover:text-[#f06123] transition duration-200 font-medium"
// >
//   Marketplace
// </Link>

























































// // client/components/Navbar.tsx
// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState, useRef, useEffect } from 'react';

// // Helper function to get full image URL

// // Helper function to get full image URL
// const getImageUrl = (imagePath: string) => {
//   if (!imagePath) {
//     return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
//   }
  
//   // If it's already a full URL (starts with http), return as is
//   if (imagePath.startsWith('http')) {
//     return imagePath;
//   }
  
//   // If it's a relative path from uploads folder
//   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
//   // Remove any leading "public/" or "uploads/" and construct proper URL
//   const cleanPath = imagePath
//     .replace(/^public\//, '')
//     .replace(/^uploads\//, '');
  
//   return `${baseUrl}/public/uploads/${cleanPath}`;
// };

// export default function Navbar() {
//   const { user, logout } = useAuth();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleLogout = async () => {
//     await logout();
//     setIsDropdownOpen(false);
//   };

//   return (
//     <nav className="bg-[#383a3c] shadow-sm border-b">
//       <div className="container mx-auto px-4 py-4">
//         <div className="flex justify-between items-center">
//           <Link href="/" className="flex items-center">
//             <Image 
//               src="/logo.jpg" 
//               alt="HolsApartment Logo" 
//               width={160} 
//               height={40}
//               className="h-8 w-auto hover:opacity-80 transition duration-200"
//               priority
//             />
//           </Link>
//           <div className="space-x-4">
//             {user ? (
//               <div className="flex items-center space-x-4">
//                 {/* Desktop - Show Dashboard link and Avatar dropdown */}
//                 <div className="hidden md:flex items-center space-x-4">
//                   <Link 
//                     href="/dashboard" 
//                     className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                   >
//                     Dashboard
//                   </Link>
                  
//                   {/* Avatar Dropdown */}
//                   <div className="relative" ref={dropdownRef}>
//                     <button
//                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                       className="flex items-center space-x-2 focus:outline-none"
//                     >
//                       <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123] hover:border-orange-400 transition duration-200">
//                         <img
//                           src={getImageUrl(user?.profileImagePath || "")}
//                           alt={`${user.firstName} ${user.lastName}`}
//                           className="w-full h-full object-cover"
//                           onError={(e) => {
//                             e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
//                           }}
//                         />
//                       </div>
//                       <svg 
//                         className={`w-4 h-4 text-[#fcfeff] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </button>

//                     {/* Dropdown Menu */}
//                     {isDropdownOpen && (
//                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                         <div className="px-4 py-2 border-b border-gray-100">
//                           <p className="text-sm font-medium text-gray-900">
//                             {user.firstName} {user.lastName}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                         </div>
                        
//                         <Link
//                           href="/dashboard"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           📊 Dashboard
//                         </Link>
                        
//                         <Link
//                           href="/dashboard/profile"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           👤 My Profile
//                         </Link>
                        
//                         <div className="border-t border-gray-100 mt-1">
//                           <button
//                             onClick={handleLogout}
//                             className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
//                           >
//                             🚪 Logout
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Mobile - Show Dashboard button and Avatar */}
//                 <div className="md:hidden flex items-center space-x-3">
//                   <Link 
//                     href="/dashboard" 
//                     className="bg-[#f06123] text-[#fcfeff] px-3 py-2 rounded-lg hover:bg-orange-600 transition duration-200 text-sm font-medium"
//                   >
//                     Dashboard
//                   </Link>
//                   <Link href="/dashboard" className="flex items-center">
//                     <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123]">
//                       <img
//                         src={getImageUrl(user?.profileImagePath || "")}
//                         alt={`${user.firstName} ${user.lastName}`}
//                         className="w-full h-full object-cover"
//                         onError={(e) => {
//                           e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
//                         }}
//                       />
//                     </div>
//                   </Link>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 <Link 
//                   href="/login" 
//                   className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                 >
//                   Login
//                 </Link>
//                 <Link 
//                   href="/signup" 
//                   className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//                 >
//                   Sign Up
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }





























































// // client/components/Navbar.tsx
// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState, useRef, useEffect } from 'react';

// export default function Navbar() {
//   const { user, logout } = useAuth();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleLogout = async () => {
//     await logout();
//     setIsDropdownOpen(false);
//   };

//   return (
//     <nav className="bg-[#383a3c] shadow-sm border-b">
//       <div className="container mx-auto px-4 py-4">
//         <div className="flex justify-between items-center">
//           <Link href="/" className="flex items-center">
//             <Image 
//               src="/logo.jpg" 
//               alt="HolsApartment Logo" 
//               width={160} 
//               height={40}
//               className="h-8 w-auto hover:opacity-80 transition duration-200"
//               priority
//             />
//           </Link>
//           <div className="space-x-4">
//             {user ? (
//               <div className="flex items-center space-x-4">
//                 {/* Desktop - Show Dashboard link and Avatar dropdown */}
//                 <div className="hidden md:flex items-center space-x-4">
//                   <Link 
//                     href="/dashboard" 
//                     className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                   >
//                     Dashboard
//                   </Link>
                  
//                   {/* Avatar Dropdown */}
//                   <div className="relative" ref={dropdownRef}>
//                     <button
//                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                       className="flex items-center space-x-2 focus:outline-none"
//                     >
//                       <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123] hover:border-orange-400 transition duration-200">
//                         <img
//                           src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                           alt={`${user.firstName} ${user.lastName}`}
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                       <svg 
//                         className={`w-4 h-4 text-[#fcfeff] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </button>

//                     {/* Dropdown Menu */}
//                     {isDropdownOpen && (
//                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                         <div className="px-4 py-2 border-b border-gray-100">
//                           <p className="text-sm font-medium text-gray-900">
//                             {user.firstName} {user.lastName}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                         </div>
                        
//                         <Link
//                           href="/dashboard"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           📊 Dashboard
//                         </Link>
                        
//                         <Link
//                           href="/dashboard/profile"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           👤 My Profile
//                         </Link>
                        
//                         <div className="border-t border-gray-100 mt-1">
//                           <button
//                             onClick={handleLogout}
//                             className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
//                           >
//                             🚪 Logout
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Mobile - Show Dashboard button and Avatar */}
//                 <div className="md:hidden flex items-center space-x-3">
//                   <Link 
//                     href="/dashboard" 
//                     className="bg-[#f06123] text-[#fcfeff] px-3 py-2 rounded-lg hover:bg-orange-600 transition duration-200 text-sm font-medium"
//                   >
//                     Dashboard
//                   </Link>
//                   <Link href="/dashboard" className="flex items-center">
//                     <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123]">
//                       <img
//                         src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                         alt={`${user.firstName} ${user.lastName}`}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   </Link>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 <Link 
//                   href="/login" 
//                   className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                 >
//                   Login
//                 </Link>
//                 <Link 
//                   href="/signup" 
//                   className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//                 >
//                   Sign Up
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }



































// // client/components/Navbar.tsx
// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState, useRef, useEffect } from 'react';

// export default function Navbar() {
//   const { user, logout } = useAuth();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleLogout = async () => {
//     await logout();
//     setIsDropdownOpen(false);
//   };

//   return (
//     <nav className="bg-[#383a3c] shadow-sm border-b">
//       <div className="container mx-auto px-4 py-4">
//         <div className="flex justify-between items-center">
//           <Link href="/" className="flex items-center">
//             <Image 
//               src="/logo.jpg" 
//               alt="HolsApartment Logo" 
//               width={160} 
//               height={40}
//               className="h-8 w-auto hover:opacity-80 transition duration-200"
//               priority
//             />
//           </Link>
//           <div className="space-x-4">
//             {user ? (
//               <div className="flex items-center space-x-4">
//                 {/* Desktop - Show Dashboard link and Avatar dropdown */}
//                 <div className="hidden md:flex items-center space-x-4">
//                   <Link 
//                     href="/dashboard" 
//                     className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                   >
//                     Dashboard
//                   </Link>
                  
//                   {/* Avatar Dropdown */}
//                   <div className="relative" ref={dropdownRef}>
//                     <button
//                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                       className="flex items-center space-x-2 focus:outline-none"
//                     >
//                       <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123] hover:border-orange-400 transition duration-200">
//                         <img
//                           src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                           alt={`${user.firstName} ${user.lastName}`}
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                       <svg 
//                         className={`w-4 h-4 text-[#fcfeff] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </button>

//                     {/* Dropdown Menu */}
//                     {isDropdownOpen && (
//                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                         <div className="px-4 py-2 border-b border-gray-100">
//                           <p className="text-sm font-medium text-gray-900">
//                             {user.firstName} {user.lastName}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                         </div>
                        
//                         <Link
//                           href="/dashboard"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           📊 Dashboard
//                         </Link>
                        
//                         <Link
//                           href="/dashboard/profile"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
//                           onClick={() => setIsDropdownOpen(false)}
//                         >
//                           👤 My Profile
//                         </Link>
                        
//                         <div className="border-t border-gray-100 mt-1">
//                           <button
//                             onClick={handleLogout}
//                             className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
//                           >
//                             🚪 Logout
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Mobile - Only show Avatar (no logout button) */}
//                 <div className="md:hidden">
//                   <Link href="/dashboard" className="flex items-center space-x-2">
//                     <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123]">
//                       <img
//                         src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                         alt={`${user.firstName} ${user.lastName}`}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   </Link>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 <Link 
//                   href="/login" 
//                   className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
//                 >
//                   Login
//                 </Link>
//                 <Link 
//                   href="/signup" 
//                   className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//                 >
//                   Sign Up
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }


































// // // client/components/Navbar.tsx
// // 'use client';

// // import Link from 'next/link';
// // import Image from 'next/image';
// // import { useAuth } from '@/contexts/AuthContext';

// // export default function Navbar() {
// //   const { user, logout } = useAuth();

// //   return (
// //     <nav className="bg-[#383a3c] shadow-sm border-b">
// //       <div className="container mx-auto px-4 py-4">
// //         <div className="flex justify-between items-center">
// //           <Link href="/" className="flex items-center">
// //             <Image 
// //               src="/logo.jpg" 
// //               alt="HolsApartment Logo" 
// //               width={160} 
// //               height={40}
// //               className="h-8 w-auto hover:opacity-80 transition duration-200"
// //               priority
// //             />
// //           </Link>
// //           <div className="space-x-4">
// //             {user ? (
// //               <div className="flex items-center space-x-4">
// //                 <span className="text-[#fcfeff]">Hello, {user.firstName}</span>
// //                 <Link 
// //                   href="/dashboard" 
// //                   className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
// //                 >
// //                   Dashboard
// //                 </Link>
// //                 <button 
// //                   onClick={logout}
// //                   className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //                 >
// //                   Logout
// //                 </button>
// //               </div>
// //             ) : (
// //               <>
// //                 <Link 
// //                   href="/login" 
// //                   className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
// //                 >
// //                   Login
// //                 </Link>
// //                 <Link 
// //                   href="/signup" 
// //                   className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //                 >
// //                   Sign Up
// //                 </Link>
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </nav>
// //   );
// // }


































































// // import Link from 'next/link';
// // import Image from 'next/image';

// // export default function Navbar() {
// //   return (
// //     <nav className="bg-[#383a3c] shadow-sm border-b">
// //       <div className="container mx-auto px-4 py-4">
// //         <div className="flex justify-between items-center">
// //           <Link href="/" className="flex items-center">
// //             <Image 
// //               src="/logo.jpg" 
// //               alt="HolsApartment Logo" 
// //               width={160} 
// //               height={40}
// //               className="h-8 w-auto hover:opacity-80 transition duration-200"
// //               priority
// //             />
// //           </Link>
// //           <div className="space-x-4">
// //             <Link 
// //               href="/login" 
// //               className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
// //             >
// //               Login
// //             </Link>
// //             <Link 
// //               href="/signup" 
// //               className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //             >
// //               Sign Up
// //             </Link>
// //           </div>
// //         </div>
// //       </div>
// //     </nav>
// //   );
// // }




















// // // import Link from 'next/link';

// // // export default function Navbar() {
// // //   return (
// // //     <nav className="bg-[#383a3c] shadow-sm border-b">
// // //       <div className="container mx-auto px-4 py-4">
// // //         <div className="flex justify-between items-center">
// // //           <Link href="/" className="text-2xl font-bold text-[#fcfeff] hover:text-[#f06123] transition duration-200">
// // //             HolsApartment
// // //           </Link>
// // //           <div className="space-x-4">
// // //             <Link 
// // //               href="/login" 
// // //               className="text-[#fcfeff] hover:text-[#f06123] transition duration-200"
// // //             >
// // //               Login
// // //             </Link>
// // //             <Link 
// // //               href="/signup" 
// // //               className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// // //             >
// // //               Sign Up
// // //             </Link>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </nav>
// // //   );
// // // }