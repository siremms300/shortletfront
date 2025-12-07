// app/admin/layout.tsx
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminRouteGuard>
  );
}