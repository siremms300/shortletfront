// app/admin/page.tsx
import DashboardOverview from '@/components/admin/DashboardOverview';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your administration panel</p>
      </div>
      <DashboardOverview />
    </div>
  );
}









// import DashboardOverview from '@/components/admin/DashboardOverview';

// export default function AdminPage() {
//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Admin Dashboard</h1>
//         <p className="text-gray-600 mt-2">Welcome to your administration panel</p>
//       </div>
//       <DashboardOverview />
//     </div>
//   );
// }



