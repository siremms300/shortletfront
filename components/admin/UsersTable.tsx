// components/admin/UsersTable.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersAPI } from '@/lib/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  profileImagePath?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);



  // components/admin/UsersTable.tsx - Update the API call
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await usersAPI.getUsers(); // This should call GET /users (admin route)
      setUsers(usersData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchUsers = async () => {
  //   try {
  //     setIsLoading(true);
  //     const usersData = await usersAPI.getUsers();
  //     setUsers(usersData);
  //   } catch (err: any) {
  //     setError(err.response?.data?.message || 'Failed to fetch users');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleVerifyUser = async (userId: string) => {
    try {
      await usersAPI.verifyUser(userId);
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isVerified: true } : user
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify user');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await usersAPI.suspendUser(userId);
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: false } : user
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await usersAPI.activateUser(userId);
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: true } : user
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await usersAPI.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600 py-8">
          {error}
          <button 
            onClick={fetchUsers}
            className="ml-4 px-4 py-2 bg-[#f06123] text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#383a3c]">
          All Users ({users.length})
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.profileImagePath ? 
                          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${user.profileImagePath.replace(/^public\//, '')}` : 
                          `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f06123&color=fff`
                        }
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    user.role === 'host' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    href={`/admin/users/${user._id}`}
                    className="text-[#f06123] hover:text-orange-600"
                  >
                    View
                  </Link>
                  {!user.isVerified && (
                    <button
                      onClick={() => handleVerifyUser(user._id)}
                      className="text-green-600 hover:text-green-800 ml-2"
                    >
                      Verify
                    </button>
                  )}
                  {user.isActive ? (
                    <button
                      onClick={() => handleSuspendUser(user._id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateUser(user._id)}
                      className="text-green-600 hover:text-green-800 ml-2"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
}



















































// 'use client';

// export default function UsersTable() {
//   const users = [
//     {
//       id: 1,
//       name: "John Doe",
//       email: "john@example.com",
//       role: "user",
//       status: "active",
//       joined: "2024-01-15",
//       bookings: 5
//     },
//     {
//       id: 2,
//       name: "Sarah Johnson",
//       email: "sarah@example.com",
//       role: "host",
//       status: "active",
//       joined: "2024-01-10",
//       bookings: 12
//     },
//     {
//       id: 3,
//       name: "Mike Wilson",
//       email: "mike@example.com",
//       role: "user",
//       status: "inactive",
//       joined: "2024-01-05",
//       bookings: 2
//     }
//   ];

//   const getRoleColor = (role: string) => {
//     switch (role) {
//       case 'admin': return 'bg-purple-100 text-purple-800';
//       case 'host': return 'bg-blue-100 text-blue-800';
//       case 'user': return 'bg-gray-100 text-gray-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {users.map((user) => (
//               <tr key={user.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div>
//                     <div className="font-medium text-[#383a3c]">{user.name}</div>
//                     <div className="text-gray-500 text-sm">{user.email}</div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)} capitalize`}>
//                     {user.role}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.bookings}</td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
//                     {user.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.joined}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                   <a href={`/admin/users/${user.id}`} className="text-[#f06123] hover:text-orange-600">View</a>
//                   <button className="text-red-600 hover:text-red-700">Suspend</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

