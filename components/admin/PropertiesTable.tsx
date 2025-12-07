'use client';

import { useState, useEffect } from 'react';
import { propertiesAPI } from '@/lib/api';

interface Property {
  _id: string;
  title: string;
  location: string;
  price: number;
  status: string;
  type: string;
  totalBookings: number;
  rating: number;
  owner: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function PropertiesTable() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAdminProperties();
      setProperties(response.properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await propertiesAPI.deleteProperty(id);
        setProperties(properties.filter(property => property._id !== id));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((property) => (
              <tr key={property._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-[#383a3c]">{property.title}</div>
                    <div className="text-gray-500 text-sm">{property.location}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{property.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${property.price}/night</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.totalBookings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1">{property.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <a href={`/admin/properties/${property._id}/edit`} className="text-[#f06123] hover:text-orange-600">Edit</a>
                  <button 
                    onClick={() => handleDelete(property._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}






















































// 'use client';

// export default function PropertiesTable() {
//   const properties = [
//     {
//       id: 1,
//       title: "Luxury Apartment in City Center",
//       location: "Victoria Island, Lagos",
//       price: 120,
//       status: "active",
//       type: "apartment",
//       bookings: 24,
//       rating: 4.8,
//       createdAt: "2024-01-15"
//     },
//     {
//       id: 2,
//       title: "Beachfront Villa",
//       location: "Lekki, Lagos",
//       price: 200,
//       status: "active",
//       type: "villa",
//       bookings: 18,
//       rating: 4.9,
//       createdAt: "2024-01-10"
//     },
//     {
//       id: 3,
//       title: "Cozy Studio Apartment",
//       location: "Ikeja, Lagos",
//       price: 75,
//       status: "inactive",
//       type: "studio",
//       bookings: 12,
//       rating: 4.5,
//       createdAt: "2024-01-05"
//     }
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return 'bg-green-100 text-green-800';
//       case 'inactive': return 'bg-gray-100 text-gray-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {properties.map((property) => (
//               <tr key={property.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div>
//                     <div className="font-medium text-[#383a3c]">{property.title}</div>
//                     <div className="text-gray-500 text-sm">{property.location}</div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{property.type}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${property.price}/night</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.bookings}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   <div className="flex items-center">
//                     <span className="text-yellow-500">★</span>
//                     <span className="ml-1">{property.rating}</span>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
//                     {property.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                   <a href={`/admin/properties/${property.id}/edit`} className="text-[#f06123] hover:text-orange-600">Edit</a>
//                   <button className="text-red-600 hover:text-red-700">Delete</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }




