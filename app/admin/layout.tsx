// app/admin/layout.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      } else if (!isAdmin) {
        // Redirect to dashboard if not admin
        router.push('/dashboard');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}






























// import AdminLayout from '@/components/admin/AdminLayout';

// export default function AdminRootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <AdminLayout>{children}</AdminLayout>;
// }

