// components/dashboard/DashboardLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.push('/admin');
    }
  }, [isLoading, isAdmin, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
      </div>
    );
  }

  // Don't render anything if user is admin (will redirect in useEffect)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Only show dashboard layout for non-admin users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dashboard Header - Replaces website header on mobile */}
      <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <a href="/" className="text-xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
            HolsApartment
          </a>
          
          {/* Empty div for balance - no avatar needed here */}
          <div className="w-6"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 pt-0 lg:pt-8">
          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <div className="lg:w-64">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Page Content */}
            <main className="px-4 lg:px-0 py-4 lg:py-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}






































// // components/dashboard/DashboardLayout.tsx
// 'use client';

// import { useState } from 'react';
// import Sidebar from './Sidebar';

// interface DashboardLayoutProps {
//   children: React.ReactNode;
// }

// export default function DashboardLayout({ children }: DashboardLayoutProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar backdrop */}
//       {sidebarOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Dashboard Header - Replaces website header on mobile */}
//       <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
//         <div className="flex items-center justify-between px-4 py-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
          
//           <a href="/" className="text-xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//             HolsApartment
//           </a>
          
//           {/* Empty div for balance - no avatar needed here */}
//           <div className="w-6"></div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto">
//         <div className="flex flex-col lg:flex-row gap-8 pt-0 lg:pt-8">
//           {/* Sidebar - Hidden on mobile, shown on desktop */}
//           <div className="lg:w-64">
//             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//           </div>

//           {/* Main Content Area */}
//           <div className="flex-1 min-w-0">
//             {/* Page Content */}
//             <main className="px-4 lg:px-0 py-4 lg:py-0">
//               {children}
//             </main>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }













































// // components/dashboard/DashboardLayout.tsx
// 'use client';

// import { useState } from 'react';
// import Sidebar from './Sidebar';
// import { useAuth } from '@/contexts/AuthContext';

// interface DashboardLayoutProps {
//   children: React.ReactNode;
// }

// export default function DashboardLayout({ children }: DashboardLayoutProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const { user } = useAuth();

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar backdrop */}
//       {sidebarOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Dashboard Header - Replaces website header on mobile */}
//       <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
//         <div className="flex items-center justify-between px-4 py-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
          
//           <a href="/" className="text-xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//             HolsApartment
//           </a>
          
//           {/* Mobile - Only show user avatar, no logout button */}
//           <div className="flex items-center">
//             <span className="text-sm text-gray-600 mr-3 hidden sm:block">
//               Hi, {user?.firstName}
//             </span>
//             <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#f06123]">
//               <img
//                 src={user?.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
//                 alt={`${user?.firstName} ${user?.lastName}`}
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto">
//         <div className="flex flex-col lg:flex-row gap-8 pt-0 lg:pt-8">
//           {/* Sidebar - Hidden on mobile, shown on desktop */}
//           <div className="lg:w-64">
//             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//           </div>

//           {/* Main Content Area */}
//           <div className="flex-1 min-w-0">
//             {/* Page Content */}
//             <main className="px-4 lg:px-0 py-4 lg:py-0">
//               {children}
//             </main>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
















































// // components/dashboard/DashboardLayout.tsx
// 'use client';

// import { useState } from 'react';
// import Sidebar from './Sidebar';
// import { useAuth } from '@/contexts/AuthContext';

// interface DashboardLayoutProps {
//   children: React.ReactNode;
// }

// export default function DashboardLayout({ children }: DashboardLayoutProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const { user, logout } = useAuth();

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar backdrop */}
//       {sidebarOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Dashboard Header - Replaces website header on mobile */}
//       <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
//         <div className="flex items-center justify-between px-4 py-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
          
//           <a href="/" className="text-xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//             HolsApartment
//           </a>
          
//           <div className="flex items-center space-x-2">
//             <span className="text-sm text-gray-600 hidden sm:block">
//               Hi, {user?.firstName}
//             </span>
//             <button 
//               onClick={logout}
//               className="text-sm bg-[#f06123] text-white px-3 py-1 rounded hover:bg-orange-600 transition duration-200"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto">
//         <div className="flex flex-col lg:flex-row gap-8 pt-0 lg:pt-8">
//           {/* Sidebar - Hidden on mobile, shown on desktop */}
//           <div className="lg:w-64">
//             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//           </div>

//           {/* Main Content Area */}
//           <div className="flex-1 min-w-0">
//             {/* Page Content */}
//             <main className="px-4 lg:px-0 py-4 lg:py-0">
//               {children}
//             </main>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }











































































// 'use client';

// import { useState } from 'react';
// import Sidebar from './Sidebar';

// interface DashboardLayoutProps {
//   children: React.ReactNode;
// }

// export default function DashboardLayout({ children }: DashboardLayoutProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile sidebar backdrop */}
//       {sidebarOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Dashboard Header - Replaces website header on mobile */}
//       <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
//         <div className="flex items-center justify-between px-4 py-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
          
//           <a href="/" className="text-xl font-bold text-[#383a3c] hover:text-[#f06123] transition duration-200">
//             HolsApartment
//           </a>
          
//           <div className="w-10"></div> {/* Spacer for balance */}
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto">
//         <div className="flex flex-col lg:flex-row gap-8 pt-0 lg:pt-8">
//           {/* Sidebar - Hidden on mobile, shown on desktop */}
//           <div className="lg:w-64">
//             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//           </div>

//           {/* Main Content Area */}
//           <div className="flex-1 min-w-0">
//             {/* Page Content */}
//             <main className="px-4 lg:px-0 py-4 lg:py-0">
//               {children}
//             </main>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }













































// // 'use client';

// // import { useState } from 'react';
// // import Sidebar from './Sidebar';

// // interface DashboardLayoutProps {
// //   children: React.ReactNode;
// // }

// // export default function DashboardLayout({ children }: DashboardLayoutProps) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false);

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Mobile sidebar backdrop */}
// //       {sidebarOpen && (
// //         <div 
// //           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}

// //       <div className="max-w-7xl mx-auto">
// //         <div className="flex flex-col lg:flex-row gap-8 pt-4 lg:pt-8">
// //           {/* Sidebar */}
// //           <div className="lg:w-64">
// //             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
// //           </div>

// //           {/* Main Content Area */}
// //           <div className="flex-1 min-w-0">
// //             {/* Mobile Header */}
// //             <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
// //               <div className="flex items-center justify-between px-4 py-4">
// //                 <button
// //                   onClick={() => setSidebarOpen(true)}
// //                   className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// //                 >
// //                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
// //                   </svg>
// //                 </button>
// //                 <h1 className="text-lg font-semibold text-[#383a3c]">Dashboard</h1>
// //                 <div className="w-10"></div>
// //               </div>
// //             </header>

// //             {/* Page Content */}
// //             <main className="px-4 lg:px-0 py-4 lg:py-0">
// //               {children}
// //             </main>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }









































// // 'use client';

// // import { useState } from 'react';
// // import Sidebar from './Sidebar';

// // interface DashboardLayoutProps {
// //   children: React.ReactNode;
// // }

// // export default function DashboardLayout({ children }: DashboardLayoutProps) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false);

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Mobile sidebar backdrop */}
// //       {sidebarOpen && (
// //         <div 
// //           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}

// //       <div className="max-w-7xl mx-auto">
// //         <div className="flex flex-col lg:flex-row gap-8 pt-8">
// //           {/* Sidebar - Now part of the content flow */}
// //           <div className="lg:w-64">
// //             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
// //           </div>

// //           {/* Main Content Area */}
// //           <div className="flex-1 min-w-0">
// //             {/* Mobile Header */}
// //             <header className="bg-white rounded-2xl shadow-sm border border-gray-200 lg:hidden mb-6">
// //               <div className="flex items-center justify-between px-6 py-4">
// //                 <button
// //                   onClick={() => setSidebarOpen(true)}
// //                   className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// //                 >
// //                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
// //                   </svg>
// //                 </button>
// //                 <h1 className="text-lg font-semibold text-[#383a3c]">Dashboard</h1>
// //                 <div className="w-10"></div>
// //               </div>
// //             </header>

// //             {/* Page Content */}
// //             <main>
// //               {children}
// //             </main>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }































// // 'use client';

// // import { useState } from 'react';
// // import Sidebar from './Sidebar';

// // interface DashboardLayoutProps {
// //   children: React.ReactNode;
// // }

// // export default function DashboardLayout({ children }: DashboardLayoutProps) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false);

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Mobile sidebar backdrop */}
// //       {sidebarOpen && (
// //         <div 
// //           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}

// //       {/* Sidebar */}
// //       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

// //       {/* Main Content Area */}
// //       <div className="lg:pl-64">
// //         {/* Mobile Header */}
// //         <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
// //           <div className="flex items-center justify-between px-4 py-3">
// //             <button
// //               onClick={() => setSidebarOpen(true)}
// //               className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// //             >
// //               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
// //               </svg>
// //             </button>
// //             <h1 className="text-lg font-semibold text-[#383a3c]">Dashboard</h1>
// //             <div className="w-10"></div>
// //           </div>
// //         </header>

// //         {/* Page Content */}
// //         <main className="min-h-screen">
// //           <div className="p-4 lg:p-8">
// //             {children}
// //           </div>
// //         </main>
// //       </div>
// //     </div>
// //   );
// // }

























// // 'use client';

// // import { useState } from 'react';
// // import Sidebar from './Sidebar';

// // interface DashboardLayoutProps {
// //   children: React.ReactNode;
// // }

// // export default function DashboardLayout({ children }: DashboardLayoutProps) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false);

// //   return (
// //     <div className="min-h-screen bg-gray-50 flex">
// //       {/* Sidebar */}
// //       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

// //       {/* Main Content */}
// //       <div className="flex-1 flex flex-col min-w-0">
// //         {/* Mobile Header */}
// //         <header className="lg:hidden bg-white shadow-sm border-b border-gray-200">
// //           <div className="flex items-center justify-between px-4 py-3">
// //             <button
// //               onClick={() => setSidebarOpen(true)}
// //               className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
// //             >
// //               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
// //               </svg>
// //             </button>
// //             <h1 className="text-lg font-semibold text-[#383a3c]">Dashboard</h1>
// //             <div className="w-10"></div>
// //           </div>
// //         </header>

// //         {/* Page Content */}
// //         <main className="flex-1 p-4 lg:p-8">
// //           {children}
// //         </main>
// //       </div>

// //       {/* Mobile Sidebar Backdrop */}
// //       {sidebarOpen && (
// //         <div 
// //           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}
// //     </div>
// //   );
// // }
























// // 'use client';

// // import { useState } from 'react';
// // import Sidebar from './Sidebar';

// // interface DashboardLayoutProps {
// //   children: React.ReactNode;
// // }

// // export default function DashboardLayout({ children }: DashboardLayoutProps) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false);

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Mobile sidebar backdrop */}
// //       {sidebarOpen && (
// //         <div 
// //           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}

// //       {/* Sidebar */}
// //       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

// //       {/* Main content */}
// //       <div className="lg:ml-64">
// //         {/* Mobile header */}
// //         <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
// //           <div className="flex items-center justify-between px-4 py-3">
// //             <button
// //               onClick={() => setSidebarOpen(true)}
// //               className="text-gray-500 hover:text-gray-600"
// //             >
// //               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
// //               </svg>
// //             </button>
// //             <h1 className="text-lg font-semibold text-[#383a3c]">Dashboard</h1>
// //             <div className="w-6"></div> {/* Spacer for balance */}
// //           </div>
// //         </header>

// //         {/* Page content */}
// //         <main className="p-4 lg:p-8">
// //           {children}
// //         </main>
// //       </div>
// //     </div>
// //   );
// // }

