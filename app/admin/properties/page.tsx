import PropertiesTable from '@/components/admin/PropertiesTable';

export default function PropertiesPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Properties</h1>
          <p className="text-gray-600 mt-2">Manage all properties in the system</p>
        </div>
        <a
          href="/admin/properties/new"
          className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
        >
          Add Property
        </a>
      </div>
      <PropertiesTable />
    </div>
  );
}






