// components/admin/operational/OperationalOverview.tsx
'use client';

export default function OperationalOverview() {
  const operationalStats = [
    { name: 'Pending Housekeeping', value: 5, color: 'bg-orange-500', icon: '🧹' },
    { name: 'Low Stock Items', value: 3, color: 'bg-yellow-500', icon: '📦' },
    { name: 'Active Maintenance', value: 2, color: 'bg-red-500', icon: '🔧' },
    { name: 'Staff Working', value: 8, color: 'bg-green-500', icon: '👥' },
    { name: 'Pending Expenses', value: 4, color: 'bg-purple-500', icon: '💰' },
    { name: 'Utility Alerts', value: 1, color: 'bg-blue-500', icon: '💡' },
  ];

  const recentAlerts = [
    { type: 'housekeeping', message: 'Urgent cleaning required for Unit 301', time: '10 min ago', priority: 'high' },
    { type: 'inventory', message: 'Toilet paper running low', time: '1 hour ago', priority: 'medium' },
    { type: 'maintenance', message: 'AC repair completed in Villa 102', time: '2 hours ago', priority: 'low' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Operational Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time overview of property operations</p>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operationalStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-[#383a3c] mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.priority === 'high' ? 'bg-red-500' :
                  alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#383a3c]">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/operational/housekeeping" className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center">
              <div className="text-2xl mb-2">🧹</div>
              <div className="font-medium text-sm">Housekeeping</div>
            </a>
            <a href="/admin/operational/inventory" className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium text-sm">Inventory</div>
            </a>
            <a href="/admin/operational/maintenance" className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center">
              <div className="text-2xl mb-2">🔧</div>
              <div className="font-medium text-sm">Maintenance</div>
            </a>
            <a href="/admin/operational/expenses" className="p-4 border border-gray-200 rounded-lg hover:border-[#f06123] hover:bg-orange-50 transition duration-200 text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-medium text-sm">Expenses</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}