// app/admin/bookings/page.tsx
import BookingsTable from '@/components/admin/BookingsTable';

export default function BookingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Bookings</h1>
        <p className="text-gray-600 mt-2">Manage all property bookings</p>
      </div>
      <BookingsTable />
    </div>
  );
}
