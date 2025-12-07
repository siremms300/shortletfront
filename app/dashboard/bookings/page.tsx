// app/dashboard/bookings/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';

interface AccessPass {
  code?: string;
  providedBy?: string;
  sentAt?: string;
  expiresAt?: string;
  status: string;
  instructions?: string;
}

interface BankTransferDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  transferReference?: string;
  proofOfPayment?: string;
  status: string;
}

interface OnsitePaymentDetails {
  expectedAmount?: number;
  status: string;
}

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    images: Array<{ url: string }>;
    price: number;
    specifications: {
      maxGuests: number;
    };
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
  accessPass?: AccessPass;
  bankTransferDetails?: BankTransferDetails;
  onsitePaymentDetails?: OnsitePaymentDetails;
  specialRequests?: string;
}

export default function BookingHistory() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [localLoading, setLocalLoading] = useState(true);
  const { bookings, getUserBookings, loading, cancelBooking } = useBooking();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      if (user) {
        setLocalLoading(true);
        try {
          await getUserBookings();
        } catch (error) {
          console.error('Failed to fetch bookings:', error);
        } finally {
          setLocalLoading(false);
        }
      } else {
        setLocalLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      await getUserBookings();
    } catch (error) {
      console.error('Failed to refresh bookings:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Filter bookings based on active tab and status
  const filteredBookings = bookings.filter(booking => {
    const checkOutDate = new Date(booking.checkOut);
    const today = new Date();
    
    if (activeTab === 'upcoming') {
      return checkOutDate >= today && booking.bookingStatus !== 'cancelled';
    } else {
      return checkOutDate < today || booking.bookingStatus === 'cancelled';
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending Payment';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'paystack':
        return 'Pay Online';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'onsite':
        return 'Pay Onsite';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'paystack':
        return 'bg-blue-100 text-blue-800';
      case 'bank_transfer':
        return 'bg-green-100 text-green-800';
      case 'onsite':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBooking(bookingId, 'User requested cancellation');
        alert('Booking cancelled successfully');
      } catch (error: any) {
        alert(error.message || 'Failed to cancel booking');
      }
    }
  };

  const isLoading = localLoading || loading;

  if (isLoading) {
    return (
      <div className="max-w-6xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
            <span className="ml-3 text-gray-600">Loading your bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#383a3c]">My Bookings</h1>
          <p className="text-gray-600">Manage your upcoming and past trips</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-[#f06123] text-[#f06123]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming Trips
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {bookings.filter(b => {
                  const checkOutDate = new Date(b.checkOut);
                  return checkOutDate >= new Date() && b.bookingStatus !== 'cancelled';
                }).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-[#f06123] text-[#f06123]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Trips
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {bookings.filter(b => {
                  const checkOutDate = new Date(b.checkOut);
                  return checkOutDate < new Date() || b.bookingStatus === 'cancelled';
                }).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Bookings List */}
        <div className="mt-6">
          {filteredBookings.length > 0 ? (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4">
                    <div className="flex space-x-4">
                      <img
                        src={booking.property.images[0]?.url || '/default-property.jpg'}
                        alt={booking.property.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div>
                        <Link
                          href={`/properties/${booking.property._id}`}
                          className="font-semibold text-[#383a3c] hover:text-[#f06123] transition duration-200"
                        >
                          {booking.property.title}
                        </Link>
                        <p className="text-gray-600 text-sm mt-1">
                          {booking.property.location}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                          <span>•</span>
                          <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
                            {getStatusText(booking.bookingStatus)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            {getPaymentStatusText(booking.paymentStatus)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(booking.paymentMethod)}`}>
                            {getPaymentMethodText(booking.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mt-4 md:mt-0">
                      <div className="text-right">
                        <div className="font-semibold text-[#383a3c]">
                          ₦{booking.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Booked on {formatDate(booking.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {booking.bookingStatus === 'confirmed' && activeTab === 'upcoming' && (
                          <button 
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Cancel Booking
                          </button>
                        )}
                        
                        {booking.bookingStatus === 'completed' && (
                          <Link
                            href={`/properties/${booking.property._id}#reviews`}
                            className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
                          >
                            Write a Review
                          </Link>
                        )}

                        {/* Show appropriate action based on payment method */}
                        {booking.paymentStatus === 'pending' && (
                          <div className="flex flex-col space-y-2">
                            {booking.paymentMethod === 'paystack' && (
                              <Link
                                href={`/booking/payment/${booking._id}`}
                                className="bg-[#f06123] text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition duration-200 text-center"
                              >
                                Complete Payment
                              </Link>
                            )}
                            
                            {booking.paymentMethod === 'bank_transfer' && (
                              booking.bankTransferDetails?.proofOfPayment ? (
                                <span className="text-green-600 text-sm font-medium">
                                  Proof uploaded ✓
                                </span>
                              ) : (
                                <Link
                                  href={`/dashboard/bookings/${booking._id}/upload-proof`}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition duration-200 text-center"
                                >
                                  Upload Proof
                                </Link>
                              )
                            )}
                            
                            {booking.paymentMethod === 'onsite' && (
                              <span className="text-yellow-600 text-sm font-medium">
                                Pay at property
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer Details Section */}
                  {booking.paymentMethod === 'bank_transfer' && booking.bankTransferDetails && (
                    <div className="border-t border-gray-200 bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Bank Transfer Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                            <div>
                              <span className="text-blue-700 text-sm">Account Name:</span>
                              <p className="font-medium">{booking.bankTransferDetails.accountName}</p>
                            </div>
                            <div>
                              <span className="text-blue-700 text-sm">Account Number:</span>
                              <p className="font-medium">{booking.bankTransferDetails.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-blue-700 text-sm">Bank:</span>
                              <p className="font-medium">{booking.bankTransferDetails.bankName}</p>
                            </div>
                          </div>
                          {booking.bankTransferDetails.transferReference && (
                            <p className="text-blue-700 text-sm mt-1">
                              Reference: {booking.bankTransferDetails.transferReference}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Proof Upload Status */}
                      <div className="mt-3">
                        {booking.bankTransferDetails.proofOfPayment ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-green-800 font-medium">Proof of payment uploaded</span>
                            </div>
                            <p className="text-green-700 text-sm mt-1">
                              Your payment proof is under review. You'll be notified when it's verified.
                            </p>
                            {booking.bankTransferDetails.status === 'pending' && (
                              <p className="text-yellow-700 text-sm mt-1">
                                Status: Awaiting verification
                              </p>
                            )}
                            {booking.bankTransferDetails.status === 'verified' && (
                              <p className="text-green-700 text-sm mt-1">
                                Status: Verified ✓
                              </p>
                            )}
                            {booking.bankTransferDetails.status === 'rejected' && (
                              <p className="text-red-700 text-sm mt-1">
                                Status: Rejected. Please upload a new proof.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.5 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span className="text-yellow-800 font-medium">Proof of payment required</span>
                            </div>
                            <p className="text-yellow-700 text-sm mt-1">
                              Please upload proof of your bank transfer to complete your booking.
                            </p>
                            <Link
                              href={`/dashboard/bookings/${booking._id}/upload-proof`}
                              className="inline-block mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition duration-200"
                            >
                              Upload Proof Now
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Onsite Payment Details Section */}
                  {booking.paymentMethod === 'onsite' && booking.onsitePaymentDetails && (
                    <div className="border-t border-gray-200 bg-yellow-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-yellow-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Onsite Payment Instructions
                          </h4>
                          <p className="text-yellow-700 mt-1">
                            Please proceed to the property for check-in and payment.
                          </p>
                          <div className="mt-2">
                            <p className="text-yellow-800 font-medium">
                              Expected Amount: ₦{booking.onsitePaymentDetails.expectedAmount?.toLocaleString() || booking.totalAmount.toLocaleString()}
                            </p>
                            {booking.onsitePaymentDetails.status === 'collected' && (
                              <p className="text-green-700 text-sm mt-1">
                                Payment collected ✓
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Access Pass Section for User */}
                  {booking.accessPass?.status === 'sent' && activeTab === 'upcoming' && (
                    <div className="border-t border-gray-200 bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-green-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Your Access Pass is Ready
                          </h4>
                          <p className="text-green-700 text-sm mt-1">
                            Sent on {formatDateTime(booking.accessPass.sentAt!)}
                            {booking.accessPass.expiresAt && ` • Expires ${formatDateTime(booking.accessPass.expiresAt)}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-1">Access Code</label>
                          <div className="bg-white border border-green-200 rounded-lg p-3">
                            <code className="text-2xl font-bold text-[#f06123] font-mono">
                              {booking.accessPass.code}
                            </code>
                          </div>
                        </div>

                        {booking.accessPass.instructions && (
                          <div>
                            <label className="block text-sm font-medium text-green-800 mb-1">Instructions</label>
                            <p className="text-green-700 text-sm whitespace-pre-line bg-white border border-green-200 rounded-lg p-3">
                              {booking.accessPass.instructions}
                            </p>
                          </div>
                        )}
                      </div>

                      {booking.accessPass.providedBy && (
                        <p className="text-green-700 text-sm mt-2">
                          Provided by: {booking.accessPass.providedBy}
                        </p>
                      )}

                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-1">How to Use Your Access Code:</h5>
                        <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
                          <li>Proceed to the property at your check-in time</li>
                          <li>Locate the smart lock/keypad at the main entrance</li>
                          <li>Enter the access code shown above</li>
                          <li>The door will unlock automatically</li>
                          <li>Keep this code secure and do not share it with others</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming trips. Start planning your next adventure!"
                  : "You haven't taken any trips yet. Your travel history will appear here."
                }
              </p>
              <Link
                href="/propertylist"
                className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
              >
                Browse Properties
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Booking Tips */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mt-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Booking Tips
        </h3>
        <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
          <li>Check-in time is typically after 2:00 PM</li>
          <li>Make sure to review the house rules before your stay</li>
          <li>Contact your host if you have any special requests</li>
          <li>Complete your payment to confirm your booking</li>
          <li>Access codes will be provided before your check-in time</li>
          <li>Don't forget to write a review after your stay!</li>
        </ul>
      </div>
    </div>
  );
}






























































// // app/dashboard/bookings/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useBooking } from '@/contexts/BookingContext';
// import { useAuth } from '@/contexts/AuthContext';

// interface AccessPass {
//   code?: string;
//   providedBy?: string;
//   sentAt?: string;
//   expiresAt?: string;
//   status: string;
//   instructions?: string;
// }

// interface Booking {
//   _id: string;
//   property: {
//     _id: string;
//     title: string;
//     location: string;
//     images: Array<{ url: string }>;
//     price: number;
//     specifications: {
//       maxGuests: number;
//     };
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
//   accessPass?: AccessPass;
// }

// export default function BookingHistory() {
//   const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
//   const [localLoading, setLocalLoading] = useState(true);
//   const { bookings, getUserBookings, loading, cancelBooking } = useBooking();
//   const { user } = useAuth();

//   useEffect(() => {
//     const fetchBookings = async () => {
//       if (user) {
//         setLocalLoading(true);
//         try {
//           await getUserBookings();
//         } catch (error) {
//           console.error('Failed to fetch bookings:', error);
//         } finally {
//           setLocalLoading(false);
//         }
//       } else {
//         setLocalLoading(false);
//       }
//     };

//     fetchBookings();
//   }, [user]);

//   const handleRefresh = async () => {
//     setLocalLoading(true);
//     try {
//       await getUserBookings();
//     } catch (error) {
//       console.error('Failed to refresh bookings:', error);
//     } finally {
//       setLocalLoading(false);
//     }
//   };

//   // Filter bookings based on active tab and status
//   const filteredBookings = bookings.filter(booking => {
//     const checkOutDate = new Date(booking.checkOut);
//     const today = new Date();
    
//     if (activeTab === 'upcoming') {
//       return checkOutDate >= today && booking.bookingStatus !== 'cancelled';
//     } else {
//       return checkOutDate < today || booking.bookingStatus === 'cancelled';
//     }
//   });

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const formatDateTime = (dateString: string) => {
//     return new Date(dateString).toLocaleString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       case 'completed':
//         return 'bg-blue-100 text-blue-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusText = (status: string) => {
//     switch (status) {
//       case 'confirmed':
//         return 'Confirmed';
//       case 'pending':
//         return 'Pending Payment';
//       case 'cancelled':
//         return 'Cancelled';
//       case 'completed':
//         return 'Completed';
//       default:
//         return status;
//     }
//   };

//   const getPaymentStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'failed':
//         return 'bg-red-100 text-red-800';
//       case 'refunded':
//         return 'bg-blue-100 text-blue-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getPaymentStatusText = (status: string) => {
//     switch (status) {
//       case 'paid':
//         return 'Paid';
//       case 'pending':
//         return 'Pending';
//       case 'failed':
//         return 'Failed';
//       case 'refunded':
//         return 'Refunded';
//       default:
//         return status;
//     }
//   };

//   const handleCancelBooking = async (bookingId: string) => {
//     if (confirm('Are you sure you want to cancel this booking?')) {
//       try {
//         await cancelBooking(bookingId, 'User requested cancellation');
//         alert('Booking cancelled successfully');
//       } catch (error: any) {
//         alert(error.message || 'Failed to cancel booking');
//       }
//     }
//   };

//   const isLoading = localLoading || loading;

//   if (isLoading) {
//     return (
//       <div className="max-w-6xl">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//             <span className="ml-3 text-gray-600">Loading your bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl">
//       {/* Header */}
//       <div className="mb-6 flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-[#383a3c]">My Bookings</h1>
//           <p className="text-gray-600">Manage your upcoming and past trips</p>
//         </div>
//         <button
//           onClick={handleRefresh}
//           className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
//         >
//           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           Refresh
//         </button>
//       </div>

//       {/* Tabs */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <div className="border-b border-gray-200">
//           <nav className="-mb-px flex space-x-8">
//             <button
//               onClick={() => setActiveTab('upcoming')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'upcoming'
//                   ? 'border-[#f06123] text-[#f06123]'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Upcoming Trips
//               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
//                 {bookings.filter(b => {
//                   const checkOutDate = new Date(b.checkOut);
//                   return checkOutDate >= new Date() && b.bookingStatus !== 'cancelled';
//                 }).length}
//               </span>
//             </button>
//             <button
//               onClick={() => setActiveTab('past')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'past'
//                   ? 'border-[#f06123] text-[#f06123]'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Past Trips
//               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
//                 {bookings.filter(b => {
//                   const checkOutDate = new Date(b.checkOut);
//                   return checkOutDate < new Date() || b.bookingStatus === 'cancelled';
//                 }).length}
//               </span>
//             </button>
//           </nav>
//         </div>

//         {/* Bookings List */}
//         <div className="mt-6">
//           {filteredBookings.length > 0 ? (
//             <div className="space-y-6">
//               {filteredBookings.map((booking) => (
//                 <div
//                   key={booking._id}
//                   className="border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <div className="flex flex-col md:flex-row md:items-center justify-between p-4">
//                     <div className="flex space-x-4">
//                       <img
//                         src={booking.property.images[0]?.url || '/default-property.jpg'}
//                         alt={booking.property.title}
//                         className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
//                       />
//                       <div>
//                         <Link
//                           href={`/properties/${booking.property._id}`}
//                           className="font-semibold text-[#383a3c] hover:text-[#f06123] transition duration-200"
//                         >
//                           {booking.property.title}
//                         </Link>
//                         <p className="text-gray-600 text-sm mt-1">
//                           {booking.property.location}
//                         </p>
//                         <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
//                           <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
//                           <span>•</span>
//                           <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
//                         </div>
//                         <div className="flex space-x-2 mt-2">
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
//                             {getStatusText(booking.bookingStatus)}
//                           </span>
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
//                             {getPaymentStatusText(booking.paymentStatus)}
//                           </span>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex items-center space-x-6 mt-4 md:mt-0">
//                       <div className="text-right">
//                         <div className="font-semibold text-[#383a3c]">
//                           ₦{booking.totalAmount.toLocaleString()}
//                         </div>
//                         <div className="text-gray-600 text-sm">
//                           Booked on {formatDate(booking.createdAt)}
//                         </div>
//                       </div>
                      
//                       <div className="flex flex-col items-end space-y-2">
//                         {booking.bookingStatus === 'confirmed' && activeTab === 'upcoming' && (
//                           <button 
//                             onClick={() => handleCancelBooking(booking._id)}
//                             className="text-red-600 hover:text-red-700 text-sm font-medium"
//                           >
//                             Cancel Booking
//                           </button>
//                         )}
                        
//                         {booking.bookingStatus === 'completed' && (
//                           <Link
//                             href={`/properties/${booking.property._id}#reviews`}
//                             className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
//                           >
//                             Write a Review
//                           </Link>
//                         )}

//                         {booking.paymentStatus === 'pending' && (
//                           <Link
//                             href={`/booking/payment/${booking._id}`}
//                             className="bg-[#f06123] text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition duration-200"
//                           >
//                             Complete Payment
//                           </Link>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Access Pass Section for User */}
//                   {booking.accessPass?.status === 'sent' && activeTab === 'upcoming' && (
//                     <div className="border-t border-gray-200 bg-green-50 p-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <h4 className="font-semibold text-green-800 flex items-center">
//                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                             </svg>
//                             Your Access Pass is Ready
//                           </h4>
//                           <p className="text-green-700 text-sm mt-1">
//                             Sent on {formatDateTime(booking.accessPass.sentAt!)}
//                             {booking.accessPass.expiresAt && ` • Expires ${formatDateTime(booking.accessPass.expiresAt)}`}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-green-800 mb-1">Access Code</label>
//                           <div className="bg-white border border-green-200 rounded-lg p-3">
//                             <code className="text-2xl font-bold text-[#f06123] font-mono">
//                               {booking.accessPass.code}
//                             </code>
//                           </div>
//                         </div>

//                         {booking.accessPass.instructions && (
//                           <div>
//                             <label className="block text-sm font-medium text-green-800 mb-1">Instructions</label>
//                             <p className="text-green-700 text-sm whitespace-pre-line bg-white border border-green-200 rounded-lg p-3">
//                               {booking.accessPass.instructions}
//                             </p>
//                           </div>
//                         )}
//                       </div>

//                       {booking.accessPass.providedBy && (
//                         <p className="text-green-700 text-sm mt-2">
//                           Provided by: {booking.accessPass.providedBy}
//                         </p>
//                       )}

//                       <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                         <h5 className="font-medium text-blue-800 mb-1">How to Use Your Access Code:</h5>
//                         <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
//                           <li>Proceed to the property at your check-in time</li>
//                           <li>Locate the smart lock/keypad at the main entrance</li>
//                           <li>Enter the access code shown above</li>
//                           <li>The door will unlock automatically</li>
//                           <li>Keep this code secure and do not share it with others</li>
//                         </ul>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-12">
//               <div className="text-6xl mb-4">📅</div>
//               <h3 className="text-lg font-semibold text-gray-600 mb-2">
//                 No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips
//               </h3>
//               <p className="text-gray-500 mb-6">
//                 {activeTab === 'upcoming' 
//                   ? "You don't have any upcoming trips. Start planning your next adventure!"
//                   : "You haven't taken any trips yet. Your travel history will appear here."
//                 }
//               </p>
//               <Link
//                 href="/propertylist"
//                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
//               >
//                 Browse Properties
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Booking Tips */}
//       <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mt-6">
//         <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
//           <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//           </svg>
//           Booking Tips
//         </h3>
//         <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
//           <li>Check-in time is typically after 2:00 PM</li>
//           <li>Make sure to review the house rules before your stay</li>
//           <li>Contact your host if you have any special requests</li>
//           <li>Complete your payment to confirm your booking</li>
//           <li>Access codes will be provided before your check-in time</li>
//           <li>Don't forget to write a review after your stay!</li>
//         </ul>
//       </div>
//     </div>
//   );
// }












































// // //app/dashboard/bookings/page.tsx

// // 'use client';

// // import { useState, useEffect } from 'react';
// // import Link from 'next/link';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useAuth } from '@/contexts/AuthContext';

// // interface Booking {
// //   _id: string;
// //   property: {
// //     _id: string;
// //     title: string;
// //     location: string;
// //     images: Array<{ url: string }>;
// //     price: number;
// //     specifications: {
// //       maxGuests: number;
// //     };
// //   };
// //   checkIn: string;
// //   checkOut: string;
// //   guests: number;
// //   totalAmount: number;
// //   serviceFee: number;
// //   paymentStatus: string;
// //   bookingStatus: string;
// //   paymentReference: string;
// //   createdAt: string;
// // }

// // export default function BookingHistory() {
// //   const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
// //   const [localLoading, setLocalLoading] = useState(true);
// //   const { bookings, getUserBookings, loading, cancelBooking } = useBooking();
// //   const { user } = useAuth();

// //   useEffect(() => {
// //     const fetchBookings = async () => {
// //       if (user) {
// //         setLocalLoading(true);
// //         try {
// //           await getUserBookings();
// //         } catch (error) {
// //           console.error('Failed to fetch bookings:', error);
// //         } finally {
// //           setLocalLoading(false);
// //         }
// //       } else {
// //         setLocalLoading(false);
// //       }
// //     };

// //     fetchBookings();
// //   }, [user]); // Remove getUserBookings from dependencies

// //   // Filter bookings based on active tab and status
// //   const filteredBookings = bookings.filter(booking => {
// //     const checkOutDate = new Date(booking.checkOut);
// //     const today = new Date();
    
// //     if (activeTab === 'upcoming') {
// //       return checkOutDate >= today && booking.bookingStatus !== 'cancelled';
// //     } else {
// //       return checkOutDate < today || booking.bookingStatus === 'cancelled';
// //     }
// //   });

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString('en-US', {
// //       month: 'short',
// //       day: 'numeric',
// //       year: 'numeric'
// //     });
// //   };

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'confirmed':
// //         return 'bg-green-100 text-green-800';
// //       case 'pending':
// //         return 'bg-yellow-100 text-yellow-800';
// //       case 'cancelled':
// //         return 'bg-red-100 text-red-800';
// //       case 'completed':
// //         return 'bg-blue-100 text-blue-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const getStatusText = (status: string) => {
// //     switch (status) {
// //       case 'confirmed':
// //         return 'Confirmed';
// //       case 'pending':
// //         return 'Pending Payment';
// //       case 'cancelled':
// //         return 'Cancelled';
// //       case 'completed':
// //         return 'Completed';
// //       default:
// //         return status;
// //     }
// //   };

// //   const getPaymentStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'paid':
// //         return 'bg-green-100 text-green-800';
// //       case 'pending':
// //         return 'bg-yellow-100 text-yellow-800';
// //       case 'failed':
// //         return 'bg-red-100 text-red-800';
// //       case 'refunded':
// //         return 'bg-blue-100 text-blue-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const getPaymentStatusText = (status: string) => {
// //     switch (status) {
// //       case 'paid':
// //         return 'Paid';
// //       case 'pending':
// //         return 'Pending';
// //       case 'failed':
// //         return 'Failed';
// //       case 'refunded':
// //         return 'Refunded';
// //       default:
// //         return status;
// //     }
// //   };

// //   const handleCancelBooking = async (bookingId: string) => {
// //     if (confirm('Are you sure you want to cancel this booking?')) {
// //       try {
// //         await cancelBooking(bookingId, 'User requested cancellation');
// //         alert('Booking cancelled successfully');
// //       } catch (error: any) {
// //         alert(error.message || 'Failed to cancel booking');
// //       }
// //     }
// //   };

// //   const handleRefresh = async () => {
// //     setLocalLoading(true);
// //     try {
// //       await getUserBookings();
// //     } catch (error) {
// //       console.error('Failed to refresh bookings:', error);
// //     } finally {
// //       setLocalLoading(false);
// //     }
// //   };

// //   const isLoading = localLoading || loading;

// //   if (isLoading) {
// //     return (
// //       <div className="max-w-6xl">
// //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //           <div className="flex items-center justify-center py-12">
// //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
// //             <span className="ml-3 text-gray-600">Loading your bookings...</span>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="max-w-6xl">
// //       {/* Header */}
// //       <div className="mb-6 flex justify-between items-center">
// //         <div>
// //           <h1 className="text-2xl font-bold text-[#383a3c]">My Bookings</h1>
// //           <p className="text-gray-600">Manage your upcoming and past trips</p>
// //         </div>
// //         <button
// //           onClick={handleRefresh}
// //           className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
// //         >
// //           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
// //           </svg>
// //           Refresh
// //         </button>
// //       </div>

// //       {/* Tabs */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //         <div className="border-b border-gray-200">
// //           <nav className="-mb-px flex space-x-8">
// //             <button
// //               onClick={() => setActiveTab('upcoming')}
// //               className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                 activeTab === 'upcoming'
// //                   ? 'border-[#f06123] text-[#f06123]'
// //                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //               }`}
// //             >
// //               Upcoming Trips
// //               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
// //                 {bookings.filter(b => {
// //                   const checkOutDate = new Date(b.checkOut);
// //                   return checkOutDate >= new Date() && b.bookingStatus !== 'cancelled';
// //                 }).length}
// //               </span>
// //             </button>
// //             <button
// //               onClick={() => setActiveTab('past')}
// //               className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                 activeTab === 'past'
// //                   ? 'border-[#f06123] text-[#f06123]'
// //                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //               }`}
// //             >
// //               Past Trips
// //               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
// //                 {bookings.filter(b => {
// //                   const checkOutDate = new Date(b.checkOut);
// //                   return checkOutDate < new Date() || b.bookingStatus === 'cancelled';
// //                 }).length}
// //               </span>
// //             </button>
// //           </nav>
// //         </div>

// //         {/* Bookings List */}
// //         <div className="mt-6">
// //           {filteredBookings.length > 0 ? (
// //             <div className="space-y-4">
// //               {filteredBookings.map((booking) => (
// //                 <div
// //                   key={booking._id}
// //                   className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
// //                 >
// //                   <div className="flex space-x-4">
// //                     <img
// //                       src={booking.property.images[0]?.url || '/default-property.jpg'}
// //                       alt={booking.property.title}
// //                       className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
// //                     />
// //                     <div>
// //                       <Link
// //                         href={`/properties/${booking.property._id}`}
// //                         className="font-semibold text-[#383a3c] hover:text-[#f06123] transition duration-200"
// //                       >
// //                         {booking.property.title}
// //                       </Link>
// //                       <p className="text-gray-600 text-sm mt-1">
// //                         {booking.property.location}
// //                       </p>
// //                       <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
// //                         <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
// //                         <span>•</span>
// //                         <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
// //                       </div>
// //                       <div className="flex space-x-2 mt-2">
// //                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
// //                           {getStatusText(booking.bookingStatus)}
// //                         </span>
// //                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
// //                           {getPaymentStatusText(booking.paymentStatus)}
// //                         </span>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-center space-x-6 mt-4 md:mt-0">
// //                     <div className="text-right">
// //                       <div className="font-semibold text-[#383a3c]">
// //                         ₦{booking.totalAmount.toLocaleString()}
// //                       </div>
// //                       <div className="text-gray-600 text-sm">
// //                         Booked on {formatDate(booking.createdAt)}
// //                       </div>
// //                     </div>
                    
// //                     <div className="flex flex-col items-end space-y-2">
// //                       {booking.bookingStatus === 'confirmed' && activeTab === 'upcoming' && (
// //                         <button 
// //                           onClick={() => handleCancelBooking(booking._id)}
// //                           className="text-red-600 hover:text-red-700 text-sm font-medium"
// //                         >
// //                           Cancel Booking
// //                         </button>
// //                       )}
                      
// //                       {booking.bookingStatus === 'completed' && (
// //                         <Link
// //                           href={`/properties/${booking.property._id}#reviews`}
// //                           className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
// //                         >
// //                           Write a Review
// //                         </Link>
// //                       )}

// //                       {/* {booking.paymentStatus === 'pending' && (
// //                         <Link
// //                           href={`/booking/payment/${booking._id}`}
// //                           className="bg-[#f06123] text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition duration-200"
// //                         >
// //                           Complete Payment
// //                         </Link>
// //                       )} */}

                      
// //                       {booking.paymentStatus === 'pending' && (
// //                         <Link
// //                           href={`/booking/payment/${booking._id}`}
// //                           className="bg-[#f06123] text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition duration-200"
// //                         >
// //                           Complete Payment
// //                         </Link>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div className="text-center py-12">
// //               <div className="text-6xl mb-4">📅</div>
// //               <h3 className="text-lg font-semibold text-gray-600 mb-2">
// //                 No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips
// //               </h3>
// //               <p className="text-gray-500 mb-6">
// //                 {activeTab === 'upcoming' 
// //                   ? "You don't have any upcoming trips. Start planning your next adventure!"
// //                   : "You haven't taken any trips yet. Your travel history will appear here."
// //                 }
// //               </p>
// //               <Link
// //                 href="/properties"
// //                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
// //               >
// //                 Browse Properties
// //               </Link>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Booking Tips */}
// //       <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mt-6">
// //         <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
// //           <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
// //           </svg>
// //           Booking Tips
// //         </h3>
// //         <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
// //           <li>Check-in time is typically after 2:00 PM</li>
// //           <li>Make sure to review the house rules before your stay</li>
// //           <li>Contact your host if you have any special requests</li>
// //           <li>Complete your payment to confirm your booking</li>
// //           <li>Don't forget to write a review after your stay!</li>
// //         </ul>
// //       </div>
// //     </div>
// //   );
// // }























































// // //app/dashboard/bookings/page.tsx

// // 'use client';

// // import { useState, useEffect } from 'react';
// // import Link from 'next/link';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useAuth } from '@/contexts/AuthContext';

// // interface Booking {
// //   _id: string;
// //   property: {
// //     _id: string;
// //     title: string;
// //     location: string;
// //     images: Array<{ url: string }>;
// //     price: number;
// //     specifications: {
// //       maxGuests: number;
// //     };
// //   };
// //   checkIn: string;
// //   checkOut: string;
// //   guests: number;
// //   totalAmount: number;
// //   serviceFee: number;
// //   paymentStatus: string;
// //   bookingStatus: string;
// //   paymentReference: string;
// //   createdAt: string;
// // }

// // export default function BookingHistory() {
// //   const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
// //   const { bookings, getUserBookings, loading, cancelBooking } = useBooking();
// //   const { user } = useAuth();

// //   useEffect(() => {
// //     if (user) {
// //       getUserBookings();
// //     }
// //   }, [user, getUserBookings]);

// //   // Filter bookings based on active tab and status
// //   const filteredBookings = bookings.filter(booking => {
// //     const checkOutDate = new Date(booking.checkOut);
// //     const today = new Date();
    
// //     if (activeTab === 'upcoming') {
// //       return checkOutDate >= today && booking.bookingStatus !== 'cancelled';
// //     } else {
// //       return checkOutDate < today || booking.bookingStatus === 'cancelled';
// //     }
// //   });

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString('en-US', {
// //       month: 'short',
// //       day: 'numeric',
// //       year: 'numeric'
// //     });
// //   };

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'confirmed':
// //         return 'bg-green-100 text-green-800';
// //       case 'pending':
// //         return 'bg-yellow-100 text-yellow-800';
// //       case 'cancelled':
// //         return 'bg-red-100 text-red-800';
// //       case 'completed':
// //         return 'bg-blue-100 text-blue-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const getStatusText = (status: string) => {
// //     switch (status) {
// //       case 'confirmed':
// //         return 'Confirmed';
// //       case 'pending':
// //         return 'Pending Payment';
// //       case 'cancelled':
// //         return 'Cancelled';
// //       case 'completed':
// //         return 'Completed';
// //       default:
// //         return status;
// //     }
// //   };

// //   const getPaymentStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'paid':
// //         return 'bg-green-100 text-green-800';
// //       case 'pending':
// //         return 'bg-yellow-100 text-yellow-800';
// //       case 'failed':
// //         return 'bg-red-100 text-red-800';
// //       case 'refunded':
// //         return 'bg-blue-100 text-blue-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const getPaymentStatusText = (status: string) => {
// //     switch (status) {
// //       case 'paid':
// //         return 'Paid';
// //       case 'pending':
// //         return 'Pending';
// //       case 'failed':
// //         return 'Failed';
// //       case 'refunded':
// //         return 'Refunded';
// //       default:
// //         return status;
// //     }
// //   };

// //   const handleCancelBooking = async (bookingId: string) => {
// //     if (confirm('Are you sure you want to cancel this booking?')) {
// //       try {
// //         await cancelBooking(bookingId, 'User requested cancellation');
// //         alert('Booking cancelled successfully');
// //       } catch (error: any) {
// //         alert(error.message || 'Failed to cancel booking');
// //       }
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="max-w-6xl">
// //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //           <div className="flex items-center justify-center py-12">
// //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
// //             <span className="ml-3 text-gray-600">Loading your bookings...</span>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="max-w-6xl">
// //       {/* Header */}
// //       <div className="mb-6">
// //         <h1 className="text-2xl font-bold text-[#383a3c]">My Bookings</h1>
// //         <p className="text-gray-600">Manage your upcoming and past trips</p>
// //       </div>

// //       {/* Tabs */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //         <div className="border-b border-gray-200">
// //           <nav className="-mb-px flex space-x-8">
// //             <button
// //               onClick={() => setActiveTab('upcoming')}
// //               className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                 activeTab === 'upcoming'
// //                   ? 'border-[#f06123] text-[#f06123]'
// //                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //               }`}
// //             >
// //               Upcoming Trips
// //               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
// //                 {bookings.filter(b => {
// //                   const checkOutDate = new Date(b.checkOut);
// //                   return checkOutDate >= new Date() && b.bookingStatus !== 'cancelled';
// //                 }).length}
// //               </span>
// //             </button>
// //             <button
// //               onClick={() => setActiveTab('past')}
// //               className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                 activeTab === 'past'
// //                   ? 'border-[#f06123] text-[#f06123]'
// //                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //               }`}
// //             >
// //               Past Trips
// //               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
// //                 {bookings.filter(b => {
// //                   const checkOutDate = new Date(b.checkOut);
// //                   return checkOutDate < new Date() || b.bookingStatus === 'cancelled';
// //                 }).length}
// //               </span>
// //             </button>
// //           </nav>
// //         </div>

// //         {/* Bookings List */}
// //         <div className="mt-6">
// //           {filteredBookings.length > 0 ? (
// //             <div className="space-y-4">
// //               {filteredBookings.map((booking) => (
// //                 <div
// //                   key={booking._id}
// //                   className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
// //                 >
// //                   <div className="flex space-x-4">
// //                     <img
// //                       src={booking.property.images[0]?.url || '/default-property.jpg'}
// //                       alt={booking.property.title}
// //                       className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
// //                     />
// //                     <div>
// //                       <Link
// //                         href={`/properties/${booking.property._id}`}
// //                         className="font-semibold text-[#383a3c] hover:text-[#f06123] transition duration-200"
// //                       >
// //                         {booking.property.title}
// //                       </Link>
// //                       <p className="text-gray-600 text-sm mt-1">
// //                         {booking.property.location}
// //                       </p>
// //                       <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
// //                         <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
// //                         <span>•</span>
// //                         <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
// //                       </div>
// //                       <div className="flex space-x-2 mt-2">
// //                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
// //                           {getStatusText(booking.bookingStatus)}
// //                         </span>
// //                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
// //                           {getPaymentStatusText(booking.paymentStatus)}
// //                         </span>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-center space-x-6 mt-4 md:mt-0">
// //                     <div className="text-right">
// //                       <div className="font-semibold text-[#383a3c]">
// //                         ₦{booking.totalAmount.toLocaleString()}
// //                       </div>
// //                       <div className="text-gray-600 text-sm">
// //                         Booked on {formatDate(booking.createdAt)}
// //                       </div>
// //                     </div>
                    
// //                     <div className="flex flex-col items-end space-y-2">
// //                       {booking.bookingStatus === 'confirmed' && activeTab === 'upcoming' && (
// //                         <button 
// //                           onClick={() => handleCancelBooking(booking._id)}
// //                           className="text-red-600 hover:text-red-700 text-sm font-medium"
// //                         >
// //                           Cancel Booking
// //                         </button>
// //                       )}
                      
// //                       {booking.bookingStatus === 'completed' && (
// //                         <Link
// //                           href={`/properties/${booking.property._id}#reviews`}
// //                           className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
// //                         >
// //                           Write a Review
// //                         </Link>
// //                       )}

// //                       {booking.paymentStatus === 'pending' && (
// //                         <Link
// //                           href={`/booking/payment/${booking._id}`}
// //                           className="bg-[#f06123] text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-600 transition duration-200"
// //                         >
// //                           Complete Payment
// //                         </Link>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div className="text-center py-12">
// //               <div className="text-6xl mb-4">📅</div>
// //               <h3 className="text-lg font-semibold text-gray-600 mb-2">
// //                 No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips
// //               </h3>
// //               <p className="text-gray-500 mb-6">
// //                 {activeTab === 'upcoming' 
// //                   ? "You don't have any upcoming trips. Start planning your next adventure!"
// //                   : "You haven't taken any trips yet. Your travel history will appear here."
// //                 }
// //               </p>
// //               <Link
// //                 href="/properties"
// //                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
// //               >
// //                 Browse Properties
// //               </Link>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Booking Tips */}
// //       <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mt-6">
// //         <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
// //           <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
// //           </svg>
// //           Booking Tips
// //         </h3>
// //         <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
// //           <li>Check-in time is typically after 2:00 PM</li>
// //           <li>Make sure to review the house rules before your stay</li>
// //           <li>Contact your host if you have any special requests</li>
// //           <li>Complete your payment to confirm your booking</li>
// //           <li>Don't forget to write a review after your stay!</li>
// //         </ul>
// //       </div>
// //     </div>
// //   );
// // }

















































// // //app/dashboard/bookings/page.tsx

// // 'use client';

// // import { useState } from 'react';
// // import Link from 'next/link';

// // interface Booking {
// //   id: number;
// //   property: {
// //     id: number;
// //     title: string;
// //     image: string;
// //     location: string;
// //   };
// //   checkIn: string;
// //   checkOut: string;
// //   guests: number;
// //   totalPrice: number;
// //   status: 'upcoming' | 'completed' | 'cancelled';
// //   bookingDate: string;
// // }

// // export default function BookingHistory() {
// //   const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

// //   const bookings: Booking[] = [
// //     {
// //       id: 1,
// //       property: {
// //         id: 1,
// //         title: "Luxury Apartment in City Center",
// //         image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300",
// //         location: "Victoria Island, Lagos"
// //       },
// //       checkIn: "2024-02-15",
// //       checkOut: "2024-02-20",
// //       guests: 2,
// //       totalPrice: 600,
// //       status: "upcoming",
// //       bookingDate: "2024-01-10"
// //     },
// //     {
// //       id: 2,
// //       property: {
// //         id: 2,
// //         title: "Beachfront Villa",
// //         image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=300",
// //         location: "Lekki, Lagos"
// //       },
// //       checkIn: "2024-03-01",
// //       checkOut: "2024-03-05",
// //       guests: 4,
// //       totalPrice: 800,
// //       status: "upcoming",
// //       bookingDate: "2024-01-12"
// //     },
// //     {
// //       id: 3,
// //       property: {
// //         id: 3,
// //         title: "Cozy Studio Apartment",
// //         image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300",
// //         location: "Ikeja, Lagos"
// //       },
// //       checkIn: "2023-12-20",
// //       checkOut: "2023-12-25",
// //       guests: 2,
// //       totalPrice: 375,
// //       status: "completed",
// //       bookingDate: "2023-11-15"
// //     },
// //     {
// //       id: 4,
// //       property: {
// //         id: 4,
// //         title: "Modern Penthouse",
// //         image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300",
// //         location: "Ikoyi, Lagos"
// //       },
// //       checkIn: "2023-11-10",
// //       checkOut: "2023-11-12",
// //       guests: 2,
// //       totalPrice: 360,
// //       status: "completed",
// //       bookingDate: "2023-10-20"
// //     }
// //   ];

// //   const filteredBookings = bookings.filter(booking => 
// //     activeTab === 'upcoming' ? booking.status === 'upcoming' : booking.status === 'completed'
// //   );

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString('en-US', {
// //       month: 'short',
// //       day: 'numeric',
// //       year: 'numeric'
// //     });
// //   };

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'upcoming':
// //         return 'bg-blue-100 text-blue-800';
// //       case 'completed':
// //         return 'bg-green-100 text-green-800';
// //       case 'cancelled':
// //         return 'bg-red-100 text-red-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const getStatusText = (status: string) => {
// //     switch (status) {
// //       case 'upcoming':
// //         return 'Upcoming';
// //       case 'completed':
// //         return 'Completed';
// //       case 'cancelled':
// //         return 'Cancelled';
// //       default:
// //         return status;
// //     }
// //   };

// //   return (
// //     <div className="max-w-6xl">
// //       {/* Tabs */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //         <div className="border-b border-gray-200">
// //           <nav className="-mb-px flex space-x-8">
// //             <button
// //               onClick={() => setActiveTab('upcoming')}
// //               className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                 activeTab === 'upcoming'
// //                   ? 'border-[#f06123] text-[#f06123]'
// //                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //               }`}
// //             >
// //               Upcoming Trips
// //               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
// //                 {bookings.filter(b => b.status === 'upcoming').length}
// //               </span>
// //             </button>
// //             <button
// //               onClick={() => setActiveTab('past')}
// //               className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                 activeTab === 'past'
// //                   ? 'border-[#f06123] text-[#f06123]'
// //                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //               }`}
// //             >
// //               Past Trips
// //               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
// //                 {bookings.filter(b => b.status === 'completed').length}
// //               </span>
// //             </button>
// //           </nav>
// //         </div>

// //         {/* Bookings List */}
// //         <div className="mt-6">
// //           {filteredBookings.length > 0 ? (
// //             <div className="space-y-4">
// //               {filteredBookings.map((booking) => (
// //                 <div
// //                   key={booking.id}
// //                   className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
// //                 >
// //                   <div className="flex space-x-4">
// //                     <img
// //                       src={booking.property.image}
// //                       alt={booking.property.title}
// //                       className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
// //                     />
// //                     <div>
// //                       <Link
// //                         href={`/properties/${booking.property.id}`}
// //                         className="font-semibold text-[#383a3c] hover:text-[#f06123] transition duration-200"
// //                       >
// //                         {booking.property.title}
// //                       </Link>
// //                       <p className="text-gray-600 text-sm mt-1">
// //                         {booking.property.location}
// //                       </p>
// //                       <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
// //                         <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
// //                         <span>•</span>
// //                         <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-center space-x-6 mt-4 md:mt-0">
// //                     <div className="text-right">
// //                       <div className="font-semibold text-[#383a3c]">
// //                         ${booking.totalPrice}
// //                       </div>
// //                       <div className="text-gray-600 text-sm">
// //                         Booked on {formatDate(booking.bookingDate)}
// //                       </div>
// //                     </div>
                    
// //                     <div className="flex flex-col items-end space-y-2">
// //                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
// //                         {getStatusText(booking.status)}
// //                       </span>
                      
// //                       {booking.status === 'upcoming' && (
// //                         <button className="text-red-600 hover:text-red-700 text-sm font-medium">
// //                           Cancel Booking
// //                         </button>
// //                       )}
                      
// //                       {booking.status === 'completed' && (
// //                         <Link
// //                           href={`/properties/${booking.property.id}#reviews`}
// //                           className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
// //                         >
// //                           Write a Review
// //                         </Link>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div className="text-center py-12">
// //               <div className="text-6xl mb-4">📅</div>
// //               <h3 className="text-lg font-semibold text-gray-600 mb-2">
// //                 No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips
// //               </h3>
// //               <p className="text-gray-500 mb-6">
// //                 {activeTab === 'upcoming' 
// //                   ? "You don't have any upcoming trips. Start planning your next adventure!"
// //                   : "You haven't taken any trips yet. Your travel history will appear here."
// //                 }
// //               </p>
// //               <Link
// //                 href="/properties"
// //                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
// //               >
// //                 Browse Properties
// //               </Link>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Booking Tips */}
// //       <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
// //         <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
// //           <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
// //           </svg>
// //           Booking Tips
// //         </h3>
// //         <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
// //           <li>Check-in time is typically after 2:00 PM</li>
// //           <li>Make sure to review the house rules before your stay</li>
// //           <li>Contact your host if you have any special requests</li>
// //           <li>Don't forget to write a review after your stay!</li>
// //         </ul>
// //       </div>
// //     </div>
// //   );
// // }





