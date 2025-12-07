// app/admin/vendors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { vendorAPI } from '@/lib/api';
import Link from 'next/link';

interface Vendor {
  _id: string;
  businessName: string;
  description: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  services: string[];
  status: string;
  totalOrders: number;
  rating: number;
  commissionRate: number;
  createdAt: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchVendors();
    fetchStats();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getVendors();
      console.log('Vendors response:', response); // Debug log
      setVendors(response.vendors || response || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await vendorAPI.getVendorStats();
      console.log('Stats response:', response); // Debug log
      setStats(response);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      // Don't set error for stats to avoid blocking the main content
    }
  };

  const handleStatusUpdate = async (vendorId: string, newStatus: string) => {
    try {
      await vendorAPI.updateVendorStatus(vendorId, newStatus);
      alert('Vendor status updated successfully');
      fetchVendors(); // Refresh the list
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to update vendor status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Management</h1>
            <p className="text-gray-600 mt-2">Manage all vendors and their products</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading vendors...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Management</h1>
          <p className="text-gray-600 mt-2">Manage all vendors and their products</p>
        </div>
        <Link
          href="/admin/vendors/new"
          className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Vendor
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-[#383a3c]">{stats.totalVendors || 0}</div>
          <div className="text-gray-600 text-sm">Total Vendors</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-[#383a3c]">{stats.activeVendors || 0}</div>
          <div className="text-gray-600 text-sm">Active Vendors</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-[#383a3c]">{stats.totalProducts || 0}</div>
          <div className="text-gray-600 text-sm">Total Products</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-[#383a3c]">{stats.totalOrders || 0}</div>
          <div className="text-gray-600 text-sm">Total Orders</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-[#383a3c]">₦{(stats.totalRevenue || 0).toLocaleString()}</div>
          <div className="text-gray-600 text-sm">Total Revenue</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={fetchVendors}
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> Loaded {vendors.length} vendors
          </div>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#383a3c]">All Vendors ({vendors.length})</h3>
          <button
            onClick={fetchVendors}
            className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          {vendors.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-[#383a3c]">{vendor.businessName}</div>
                        <div className="text-gray-500 text-sm mt-1 line-clamp-2">{vendor.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.contactPerson?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{vendor.contactPerson?.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{vendor.contactPerson?.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {vendor.services?.slice(0, 3).map((service, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                          >
                            {service.replace('_', ' ')}
                          </span>
                        ))}
                        {vendor.services?.length > 3 && (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                            +{vendor.services.length - 3} more
                          </span>
                        )}
                        {(!vendor.services || vendor.services.length === 0) && (
                          <span className="text-gray-500 text-xs">No services</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.totalOrders || 0} orders
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.commissionRate || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={vendor.status}
                        onChange={(e) => handleStatusUpdate(vendor._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(vendor.status)} border-0 focus:ring-1 focus:ring-[#f06123]`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/vendors/${vendor._id}`}
                        className="text-[#f06123] hover:text-orange-600"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/vendors/${vendor._id}/products`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Products
                      </Link>
                      <Link
                        href={`/admin/vendors/${vendor._id}/edit`}
                        className="text-green-600 hover:text-green-700"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No vendors found</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first vendor.</p>
              <Link
                href="/admin/vendors/new"
                className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
              >
                Add First Vendor
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}































// // app/admin/vendors/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { vendorAPI } from '@/lib/api';
// import Link from 'next/link';

// interface Vendor {
//   _id: string;
//   businessName: string;
//   description: string;
//   contactPerson: {
//     name: string;
//     email: string;
//     phone: string;
//   };
//   services: string[];
//   status: string;
//   totalOrders: number;
//   rating: number;
//   commissionRate: number;
//   createdAt: string;
// }

// export default function AdminVendorsPage() {
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [stats, setStats] = useState({
//     totalVendors: 0,
//     activeVendors: 0,
//     totalProducts: 0,
//     totalOrders: 0,
//     totalRevenue: 0
//   });

//   useEffect(() => {
//     fetchVendors();
//     fetchStats();
//   }, []);

//   const fetchVendors = async () => {
//     try {
//       setLoading(true);
//       const response = await vendorAPI.getVendors();
//       setVendors(response.vendors || []);
//     } catch (error: any) {
//       setError(error.message || 'Failed to fetch vendors');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const response = await vendorAPI.getVendorStats();
//       setStats(response);
//     } catch (error) {
//       console.error('Failed to fetch vendor stats:', error);
//     }
//   };

//   const handleStatusUpdate = async (vendorId: string, newStatus: string) => {
//     try {
//       await vendorAPI.updateVendorStatus(vendorId, newStatus);
//       alert('Vendor status updated successfully');
//       fetchVendors(); // Refresh the list
//     } catch (error: any) {
//       alert(error.message || 'Failed to update vendor status');
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return 'bg-green-100 text-green-800';
//       case 'inactive': return 'bg-gray-100 text-gray-800';
//       case 'suspended': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="space-y-8">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Management</h1>
//             <p className="text-gray-600 mt-2">Manage all vendors and their products</p>
//           </div>
//         </div>
//         <div className="flex items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//           <span className="ml-3 text-gray-600">Loading vendors...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Management</h1>
//           <p className="text-gray-600 mt-2">Manage all vendors and their products</p>
//         </div>
//         <Link
//           href="/admin/vendors/new"
//           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
//         >
//           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//           </svg>
//           Add New Vendor
//         </Link>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-2xl font-bold text-[#383a3c]">{stats.totalVendors}</div>
//           <div className="text-gray-600 text-sm">Total Vendors</div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-2xl font-bold text-[#383a3c]">{stats.activeVendors}</div>
//           <div className="text-gray-600 text-sm">Active Vendors</div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-2xl font-bold text-[#383a3c]">{stats.totalProducts}</div>
//           <div className="text-gray-600 text-sm">Total Products</div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-2xl font-bold text-[#383a3c]">{stats.totalOrders}</div>
//           <div className="text-gray-600 text-sm">Total Orders</div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-2xl font-bold text-[#383a3c]">₦{stats.totalRevenue.toLocaleString()}</div>
//           <div className="text-gray-600 text-sm">Total Revenue</div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <span className="text-red-700">{error}</span>
//             </div>
//             <button
//               onClick={fetchVendors}
//               className="text-red-700 hover:text-red-800 font-medium"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Vendors Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//           <h3 className="text-lg font-semibold text-[#383a3c]">All Vendors</h3>
//           <button
//             onClick={fetchVendors}
//             className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
//           >
//             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {vendors.map((vendor) => (
//                 <tr key={vendor._id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div>
//                       <div className="font-semibold text-[#383a3c]">{vendor.businessName}</div>
//                       <div className="text-gray-500 text-sm mt-1 line-clamp-2">{vendor.description}</div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-900">{vendor.contactPerson.name}</div>
//                     <div className="text-sm text-gray-500">{vendor.contactPerson.email}</div>
//                     <div className="text-sm text-gray-500">{vendor.contactPerson.phone}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex flex-wrap gap-1">
//                       {vendor.services.slice(0, 3).map((service, index) => (
//                         <span
//                           key={index}
//                           className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
//                         >
//                           {service.replace('_', ' ')}
//                         </span>
//                       ))}
//                       {vendor.services.length > 3 && (
//                         <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
//                           +{vendor.services.length - 3} more
//                         </span>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {vendor.totalOrders} orders
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {vendor.commissionRate}%
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <select
//                       value={vendor.status}
//                       onChange={(e) => handleStatusUpdate(vendor._id, e.target.value)}
//                       className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(vendor.status)} border-0 focus:ring-1 focus:ring-[#f06123]`}
//                     >
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                       <option value="suspended">Suspended</option>
//                     </select>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                     <Link
//                       href={`/admin/vendors/${vendor._id}`}
//                       className="text-[#f06123] hover:text-orange-600"
//                     >
//                       View
//                     </Link>
//                     <Link
//                       href={`/admin/vendors/${vendor._id}/products`}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       Products
//                     </Link>
//                     <Link
//                       href={`/admin/vendors/${vendor._id}/edit`}
//                       className="text-green-600 hover:text-green-700"
//                     >
//                       Edit
//                     </Link>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {vendors.length === 0 && (
//             <div className="text-center py-12">
//               <div className="text-6xl mb-4">🏪</div>
//               <h3 className="text-lg font-semibold text-gray-600 mb-2">No vendors found</h3>
//               <p className="text-gray-500 mb-6">Get started by adding your first vendor.</p>
//               <Link
//                 href="/admin/vendors/new"
//                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
//               >
//                 Add First Vendor
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }















