import UsersTable from '@/components/admin/UsersTable';

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Users</h1>
        <p className="text-gray-600 mt-2">Manage all users in the system</p>
      </div>
      <UsersTable />
    </div>
  );
}

