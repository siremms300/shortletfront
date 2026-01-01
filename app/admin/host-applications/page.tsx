export default function HostApplicationsPage() {
  const applications = [
    {
      id: 1,
      name: "Michael Brown",
      email: "michael@example.com",
      applied: "2024-01-15",
      status: "pending",
      properties: 2
    },
    {
      id: 2,
      name: "Emma Davis",
      email: "emma@example.com",
      applied: "2024-01-12",
      status: "approved",
      properties: 1
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Host Applications</h1>
        <p className="text-gray-600 mt-2">Review and manage host applications</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Properties</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-[#383a3c]">{app.name}</div>
                      <div className="text-gray-500 text-sm">{app.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.applied}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.properties}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    } capitalize`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-[#f06123] hover:text-orange-600">Review</button>
                    <button className="text-green-600 hover:text-green-700">Approve</button>
                    <button className="text-red-600 hover:text-red-700">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}