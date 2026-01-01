export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Settings</h1>
        <p className="text-gray-600 mt-2">Manage site settings and configuration</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[#383a3c] mb-4">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input type="text" defaultValue="HolsApartment" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Email</label>
                <input type="email" defaultValue="contact@holsapartment.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Booking Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Instant Booking</label>
                  <p className="text-gray-500 text-sm">Allow users to book without approval</p>
                </div>
                <input type="checkbox" className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Require ID Verification</label>
                  <p className="text-gray-500 text-sm">Verify user identity before booking</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}