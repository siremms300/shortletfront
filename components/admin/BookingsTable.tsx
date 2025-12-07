// components/admin/BookingsTable.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingsAPI } from '@/lib/api';

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  serviceFee: number;
  paymentStatus: string;
  bookingStatus: string;
  paymentMethod: 'paystack' | 'bank_transfer' | 'onsite';
  paymentReference: string;
  createdAt: string;
  bankTransferDetails?: {
    status: string;
    proofOfPayment?: string;
  };
  onsitePaymentDetails?: {
    status: string;
  };
}

export default function BookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAdminBookings();
      setBookings(response.bookings || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'paystack': return 'bg-blue-100 text-blue-800';
      case 'bank_transfer': return 'bg-green-100 text-green-800';
      case 'onsite': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'paystack': return 'Paystack';
      case 'bank_transfer': return 'Bank Transfer';
      case 'onsite': return 'Onsite';
      default: return method;
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsAPI.updateBookingStatus(bookingId, 'cancelled');
        alert('Booking cancelled successfully');
        fetchBookings(); // Refresh the list
      } catch (error: any) {
        alert(error.message || 'Failed to cancel booking');
      }
    }
  };

  const handleVerifyBankTransfer = async (bookingId: string) => {
    if (confirm('Mark this bank transfer as verified?')) {
      try {
        await bookingsAPI.verifyBankTransfer(bookingId, 'verified');
        alert('Payment verified successfully');
        fetchBookings(); // Refresh the list
      } catch (error: any) {
        alert(error.message || 'Failed to verify payment');
      }
    }
  };

  const handleMarkOnsiteCollected = async (bookingId: string) => {
    if (confirm('Mark this onsite payment as collected?')) {
      try {
        await bookingsAPI.markOnsitePaymentCollected(bookingId, {
          receiptNumber: `REC-${Date.now()}`
        });
        alert('Payment marked as collected');
        fetchBookings(); // Refresh the list
      } catch (error: any) {
        alert(error.message || 'Failed to mark payment as collected');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center py-8">
          <div className="text-red-600 text-lg mb-2">Error loading bookings</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#383a3c]">All Bookings</h3>
        <button
          onClick={fetchBookings}
          className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#383a3c]">
                  #{booking._id.slice(-8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.property.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.user.firstName} {booking.user.lastName}
                  <div className="text-gray-500 text-xs">{booking.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{booking.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(booking.paymentMethod)}`}>
                    {getPaymentMethodText(booking.paymentMethod)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.bookingStatus)} capitalize`}>
                    {booking.bookingStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(booking.paymentStatus)} capitalize`}>
                    {booking.paymentStatus}
                  </span>
                  {/* Show additional status for bank transfers */}
                  {booking.paymentMethod === 'bank_transfer' && booking.bankTransferDetails && (
                    <div className="mt-1 text-xs">
                      {booking.bankTransferDetails.status === 'pending' && (
                        <span className="text-yellow-600">Awaiting verification</span>
                      )}
                      {booking.bankTransferDetails.status === 'verified' && (
                        <span className="text-green-600">Verified ✓</span>
                      )}
                      {booking.bankTransferDetails.status === 'rejected' && (
                        <span className="text-red-600">Rejected</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link 
                    href={`/admin/bookings/${booking._id}`}
                    className="text-[#f06123] hover:text-orange-600"
                  >
                    View
                  </Link>
                  
                  {/* Special actions for different payment methods */}
                  {booking.paymentMethod === 'bank_transfer' && 
                   booking.paymentStatus === 'pending' && 
                   booking.bankTransferDetails?.status === 'pending' && (
                    <button 
                      onClick={() => handleVerifyBankTransfer(booking._id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      Verify
                    </button>
                  )}
                  
                  {booking.paymentMethod === 'onsite' && 
                   booking.paymentStatus === 'pending' && (
                    <button 
                      onClick={() => handleMarkOnsiteCollected(booking._id)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      Mark Collected
                    </button>
                  )}
                  
                  {booking.bookingStatus !== 'cancelled' && (
                    <button 
                      onClick={() => handleCancelBooking(booking._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {bookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings found</h3>
            <p className="text-gray-500">There are no bookings in the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}






















































// // components/admin/BookingsTable.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { bookingsAPI } from '@/lib/api';

// interface Booking {
//   _id: string;
//   property: {
//     _id: string;
//     title: string;
//     location: string;
//   };
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   checkIn: string;
//   checkOut: string;
//   guests: number;
//   totalAmount: number;
//   serviceFee: number;
//   paymentStatus: string;
//   bookingStatus: string;
//   paymentReference: string;
//   createdAt: string;
// }

// export default function BookingsTable() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchBookings();
//   }, []);

//   const fetchBookings = async () => {
//     try {
//       setLoading(true);
//       const response = await bookingsAPI.getAdminBookings();
//       setBookings(response.bookings || []);
//     } catch (error: any) {
//       setError(error.message || 'Failed to fetch bookings');
//       console.error('Error fetching bookings:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'completed': return 'bg-blue-100 text-blue-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getPaymentStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'failed': return 'bg-red-100 text-red-800';
//       case 'refunded': return 'bg-blue-100 text-blue-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const handleCancelBooking = async (bookingId: string) => {
//     if (confirm('Are you sure you want to cancel this booking?')) {
//       try {
//         await bookingsAPI.updateBookingStatus(bookingId, 'cancelled');
//         alert('Booking cancelled successfully');
//         fetchBookings(); // Refresh the list
//       } catch (error: any) {
//         alert(error.message || 'Failed to cancel booking');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
//         <div className="flex items-center justify-center py-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//           <span className="ml-3 text-gray-600">Loading bookings...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
//         <div className="text-center py-8">
//           <div className="text-red-600 text-lg mb-2">Error loading bookings</div>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={fetchBookings}
//             className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//       <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//         <h3 className="text-lg font-semibold text-[#383a3c]">All Bookings</h3>
//         <button
//           onClick={fetchBookings}
//           className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
//         >
//           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           Refresh
//         </button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {bookings.map((booking) => (
//               <tr key={booking._id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#383a3c]">
//                   #{booking._id.slice(-8)}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   {booking.property.title}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   {booking.user.firstName} {booking.user.lastName}
//                   <div className="text-gray-500 text-xs">{booking.user.email}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   ₦{booking.totalAmount.toLocaleString()}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.bookingStatus)} capitalize`}>
//                     {booking.bookingStatus}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(booking.paymentStatus)} capitalize`}>
//                     {booking.paymentStatus}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                   <Link 
//                     href={`/admin/bookings/${booking._id}`}
//                     className="text-[#f06123] hover:text-orange-600"
//                   >
//                     View
//                   </Link>
//                   {booking.bookingStatus !== 'cancelled' && (
//                     <button 
//                       onClick={() => handleCancelBooking(booking._id)}
//                       className="text-red-600 hover:text-red-700"
//                     >
//                       Cancel
//                     </button>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
        
//         {bookings.length === 0 && (
//           <div className="text-center py-12">
//             <div className="text-6xl mb-4">📅</div>
//             <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings found</h3>
//             <p className="text-gray-500">There are no bookings in the system yet.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }























































// 'use client';

// export default function BookingsTable() {
//   const bookings = [
//     {
//       id: 1,
//       property: "Luxury Apartment in City Center",
//       guest: "John Doe",
//       checkIn: "2024-02-15",
//       checkOut: "2024-02-20",
//       total: 600,
//       status: "confirmed",
//       bookedAt: "2024-01-10"
//     },
//     {
//       id: 2,
//       property: "Beachfront Villa",
//       guest: "Sarah Johnson",
//       checkIn: "2024-03-01",
//       checkOut: "2024-03-05",
//       total: 800,
//       status: "pending",
//       bookedAt: "2024-01-12"
//     },
//     {
//       id: 3,
//       property: "Cozy Studio Apartment",
//       guest: "Mike Wilson",
//       checkIn: "2024-01-20",
//       checkOut: "2024-01-25",
//       total: 375,
//       status: "completed",
//       bookedAt: "2024-01-05"
//     }
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'completed': return 'bg-blue-100 text-blue-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {bookings.map((booking) => (
//               <tr key={booking.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#383a3c]">#{booking.id}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.property}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.guest}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   {booking.checkIn} to {booking.checkOut}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${booking.total}</td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)} capitalize`}>
//                     {booking.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                   <a href={`/admin/bookings/${booking.id}`} className="text-[#f06123] hover:text-orange-600">View</a>
//                   <button className="text-red-600 hover:text-red-700">Cancel</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


