// app/admin/bookings/[id]/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsAPI, accessPassAPI } from '@/lib/api';
import AccessPassForm from '@/components/admin/AccessPassForm';

interface AccessPass {
  code?: string;
  providedBy?: string;
  sentAt?: string;
  sentBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  expiresAt?: string;
  status: string;
  instructions?: string;
}

interface BankTransferDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  transferReference?: string;
  transferDate?: string;
  proofOfPayment?: string;
  verifiedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  verifiedAt?: string;
  status: string;
}

interface OnsitePaymentDetails {
  expectedAmount?: number;
  collectedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  collectedAt?: string;
  receiptNumber?: string;
  status: string;
}

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    type: string;
    price: number;
    specifications: {
      bedrooms: number;
      bathrooms: number;
      maxGuests: number;
    };
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
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
  paystackReference?: string;
  specialRequests?: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  accessPass?: AccessPass;
  bankTransferDetails?: BankTransferDetails;
  onsitePaymentDetails?: OnsitePaymentDetails;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAccessPassForm, setShowAccessPassForm] = useState(false);
  const [sendingAccessPass, setSendingAccessPass] = useState(false);

  const bookingId = params.id as string;

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getBookingById(bookingId);
      setBooking(response.booking);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch booking details');
      console.error('Error fetching booking:', error);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSendAccessPass = async (accessData: {
    accessCode: string;
    provider?: string;
    instructions?: string;
  }) => {
    try {
      setSendingAccessPass(true);
      const response = await accessPassAPI.sendAccessPass(bookingId, accessData);
      setBooking(response.booking);
      setShowAccessPassForm(false);
      alert('Access pass sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send access pass');
    } finally {
      setSendingAccessPass(false);
    }
  };

  const handleUpdateAccessPass = async (accessData: {
    accessCode: string;
    provider?: string;
    instructions?: string;
  }) => {
    try {
      setSendingAccessPass(true);
      const response = await accessPassAPI.updateAccessPass(bookingId, accessData);
      setBooking(response.booking);
      setShowAccessPassForm(false);
      alert('Access pass updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update access pass');
    } finally {
      setSendingAccessPass(false);
    }
  };

  const handleCancelBooking = async () => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsAPI.updateBookingStatus(bookingId, 'cancelled');
        alert('Booking cancelled successfully');
        fetchBooking(); // Refresh data
      } catch (error: any) {
        alert(error.message || 'Failed to cancel booking');
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, newStatus);
      alert(`Booking status updated to ${newStatus}`);
      fetchBooking(); // Refresh data
    } catch (error: any) {
      alert(error.message || 'Failed to update booking status');
    }
  };

  const handleVerifyBankTransfer = async (status: 'verified' | 'rejected') => {
    try {
      await bookingsAPI.verifyBankTransfer(bookingId, status);
      alert(`Payment ${status} successfully`);
      fetchBooking(); // Refresh data
    } catch (error: any) {
      alert(error.message || 'Failed to verify payment');
    }
  };

  const handleMarkOnsiteCollected = async () => {
    try {
      await bookingsAPI.markOnsitePaymentCollected(bookingId, {
        receiptNumber: `REC-${Date.now()}`
      });
      alert('Payment marked as collected');
      fetchBooking(); // Refresh data
    } catch (error: any) {
      alert(error.message || 'Failed to mark payment as collected');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
            <p className="text-gray-600 mt-2">Booking ID: #{bookingId?.slice(-8)}</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">Error loading booking</div>
          <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
          <button
            onClick={fetchBooking}
            className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 mr-2"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const subtotal = booking.property.price * nights;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
          <p className="text-gray-600 mt-2">Booking ID: #{booking._id.slice(-8)}</p>
        </div>
        <div className="space-x-3">
          <select
            value={booking.bookingStatus}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {booking.bookingStatus !== 'cancelled' && (
            <button 
              onClick={handleCancelBooking}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Specific Sections */}
          {booking.paymentMethod === 'bank_transfer' && booking.bankTransferDetails && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Bank Transfer Verification</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <p className="font-medium">{booking.bankTransferDetails.accountName || 'Hols Apartments Ltd'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <p className="font-medium">{booking.bankTransferDetails.accountNumber || '0900408855'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <p className="font-medium">{booking.bankTransferDetails.bankName || 'GT Bank'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Reference</label>
                    <p className="font-medium">{booking.bankTransferDetails.transferReference}</p>
                  </div>
                </div>

                {booking.bankTransferDetails.proofOfPayment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment</label>
                    <div className="mt-1">
                      <a 
                        href={booking.bankTransferDetails.proofOfPayment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f06123] hover:text-orange-600 underline inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Proof
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    booking.bankTransferDetails.status === 'verified' ? 'bg-green-100 text-green-800' :
                    booking.bankTransferDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.bankTransferDetails.status}
                  </span>
                </div>

                {booking.bankTransferDetails.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleVerifyBankTransfer('verified')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                      Verify Payment
                    </button>
                    <button
                      onClick={() => handleVerifyBankTransfer('rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
                    >
                      Reject Payment
                    </button>
                  </div>
                )}

                {booking.bankTransferDetails.verifiedAt && (
                  <div className="text-sm text-gray-600">
                    <p>Verified by: {booking.bankTransferDetails.verifiedBy?.firstName} {booking.bankTransferDetails.verifiedBy?.lastName}</p>
                    <p>Verified at: {formatDateTime(booking.bankTransferDetails.verifiedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.paymentMethod === 'onsite' && booking.onsitePaymentDetails && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Onsite Payment</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">Expected Amount</p>
                    <p className="text-xl font-bold">₦{booking.onsitePaymentDetails.expectedAmount?.toLocaleString() || booking.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.onsitePaymentDetails.status === 'collected' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.onsitePaymentDetails.status === 'collected' ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                </div>

                {booking.onsitePaymentDetails.status === 'pending' && (
                  <button
                    onClick={handleMarkOnsiteCollected}
                    className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
                  >
                    Mark as Collected
                  </button>
                )}

                {booking.onsitePaymentDetails.status === 'collected' && (
                  <div className="space-y-2">
                    <p>Collected by: {booking.onsitePaymentDetails.collectedBy?.firstName} {booking.onsitePaymentDetails.collectedBy?.lastName}</p>
                    <p>Collected at: {formatDateTime(booking.onsitePaymentDetails.collectedAt!)}</p>
                    <p>Receipt: {booking.onsitePaymentDetails.receiptNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Pass Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#383a3c]">Access Pass</h2>
              {booking.bookingStatus === 'confirmed' && (
                <button
                  onClick={() => setShowAccessPassForm(!showAccessPassForm)}
                  className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
                >
                  {booking.accessPass?.status === 'sent' ? 'Update Access Pass' : 'Send Access Pass'}
                </button>
              )}
            </div>

            {showAccessPassForm ? (
              <AccessPassForm
                booking={booking}
                onSend={handleSendAccessPass}
                onUpdate={handleUpdateAccessPass}
                onCancel={() => setShowAccessPassForm(false)}
                loading={sendingAccessPass}
              />
            ) : (
              <div className="space-y-4">
                {booking.accessPass?.status === 'sent' ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-800">Access Pass Sent</h3>
                          <p className="text-green-700 text-sm">
                            Sent on {formatDateTime(booking.accessPass.sentAt!)}
                            {booking.accessPass.sentBy && ` by ${booking.accessPass.sentBy.firstName} ${booking.accessPass.sentBy.lastName}`}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <code className="text-2xl font-bold text-[#f06123] font-mono">
                            {booking.accessPass.code}
                          </code>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                        <p className="text-gray-900">{booking.accessPass.providedBy || 'Not specified'}</p>
                      </div>
                    </div>

                    {booking.accessPass.instructions && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <p className="text-gray-900 whitespace-pre-line">{booking.accessPass.instructions}</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <p>Expires: {formatDateTime(booking.accessPass.expiresAt!)}</p>
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">🔐</div>
                    <h3 className="font-semibold text-yellow-800 mb-2">No Access Pass Sent</h3>
                    <p className="text-yellow-700 mb-4">
                      {booking.bookingStatus === 'confirmed' 
                        ? "Send the access pass to the guest for their stay."
                        : "Access pass can be sent after booking is confirmed."
                      }
                    </p>
                    {booking.bookingStatus === 'confirmed' && (
                      <button
                        onClick={() => setShowAccessPassForm(true)}
                        className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
                      >
                        Send Access Pass
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Property Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Property Name</span>
                <span className="font-medium">{booking.property.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property Type</span>
                <span className="font-medium capitalize">{booking.property.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{booking.property.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bedrooms</span>
                <span className="font-medium">{booking.property.specifications.bedrooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bathrooms</span>
                <span className="font-medium">{booking.property.specifications.bathrooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Guests</span>
                <span className="font-medium">{booking.property.specifications.maxGuests}</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Guest Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name</span>
                <span className="font-medium">{booking.user.firstName} {booking.user.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{booking.user.email}</span>
              </div>
              {booking.user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">{booking.user.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Guests</span>
                <span className="font-medium">{booking.guests}</span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Special Requests</h2>
              <p className="text-gray-700">{booking.specialRequests}</p>
            </div>
          )}

          {/* Cancellation Details */}
          {booking.bookingStatus === 'cancelled' && booking.cancellationReason && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">Cancellation Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancellation Reason</span>
                  <span className="font-medium">{booking.cancellationReason}</span>
                </div>
                {booking.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancelled At</span>
                    <span className="font-medium">{formatDate(booking.cancelledAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in</span>
                <span className="font-medium">{formatDate(booking.checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out</span>
                <span className="font-medium">{formatDate(booking.checkOut)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nights</span>
                <span className="font-medium">{nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium capitalize">
                  {booking.paymentMethod === 'paystack' ? 'Paystack' : 
                   booking.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Onsite'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium capitalize ${
                  booking.bookingStatus === 'confirmed' ? 'text-green-600' :
                  booking.bookingStatus === 'pending' ? 'text-yellow-600' :
                  booking.bookingStatus === 'cancelled' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {booking.bookingStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booked On</span>
                <span className="font-medium">{formatDate(booking.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Payment Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nightly Rate</span>
                <span className="font-medium">₦{booking.property.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({nights} nights)</span>
                <span className="font-medium">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium">₦{booking.serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-800 font-semibold">Total</span>
                <span className="text-[#383a3c] font-bold">₦{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-medium capitalize ${
                  booking.paymentStatus === 'paid' ? 'text-green-600' :
                  booking.paymentStatus === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {booking.paymentStatus}
                </span>
              </div>
              {booking.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-medium text-xs">{booking.paymentReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




















































// // app/admin/bookings/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { bookingsAPI, accessPassAPI } from '@/lib/api';
// import AccessPassForm from '@/components/admin/AccessPassForm';

// interface AccessPass {
//   code?: string;
//   providedBy?: string;
//   sentAt?: string;
//   sentBy?: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//   };
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
//     type: string;
//     price: number;
//     specifications: {
//       bedrooms: number;
//       bathrooms: number;
//       maxGuests: number;
//     };
//   };
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone?: string;
//   };
//   checkIn: string;
//   checkOut: string;
//   guests: number;
//   totalAmount: number;
//   serviceFee: number;
//   paymentStatus: string;
//   bookingStatus: string;
//   paymentReference: string;
//   paystackReference?: string;
//   specialRequests?: string;
//   createdAt: string;
//   cancelledAt?: string;
//   cancellationReason?: string;
//   accessPass?: AccessPass;
// }

// export default function BookingDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const [booking, setBooking] = useState<Booking | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [showAccessPassForm, setShowAccessPassForm] = useState(false);
//   const [sendingAccessPass, setSendingAccessPass] = useState(false);

//   const bookingId = params.id as string;

//   useEffect(() => {
//     if (bookingId) {
//       fetchBooking();
//     }
//   }, [bookingId]);

//   const fetchBooking = async () => {
//     try {
//       setLoading(true);
//       const response = await bookingsAPI.getBookingById(bookingId);
//       setBooking(response.booking);
//     } catch (error: any) {
//       setError(error.message || 'Failed to fetch booking details');
//       console.error('Error fetching booking:', error);
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

//   const formatDateTime = (dateString: string) => {
//     return new Date(dateString).toLocaleString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const calculateNights = (checkIn: string, checkOut: string) => {
//     const start = new Date(checkIn);
//     const end = new Date(checkOut);
//     return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
//   };

//   const handleSendAccessPass = async (accessData: {
//     accessCode: string;
//     provider?: string;
//     instructions?: string;
//   }) => {
//     try {
//       setSendingAccessPass(true);
//       const response = await accessPassAPI.sendAccessPass(bookingId, accessData);
//       setBooking(response.booking);
//       setShowAccessPassForm(false);
//       alert('Access pass sent successfully!');
//     } catch (error: any) {
//       alert(error.message || 'Failed to send access pass');
//     } finally {
//       setSendingAccessPass(false);
//     }
//   };

//   const handleUpdateAccessPass = async (accessData: {
//     accessCode: string;
//     provider?: string;
//     instructions?: string;
//   }) => {
//     try {
//       setSendingAccessPass(true);
//       const response = await accessPassAPI.updateAccessPass(bookingId, accessData);
//       setBooking(response.booking);
//       setShowAccessPassForm(false);
//       alert('Access pass updated successfully!');
//     } catch (error: any) {
//       alert(error.message || 'Failed to update access pass');
//     } finally {
//       setSendingAccessPass(false);
//     }
//   };

//   const handleCancelBooking = async () => {
//     if (confirm('Are you sure you want to cancel this booking?')) {
//       try {
//         await bookingsAPI.updateBookingStatus(bookingId, 'cancelled');
//         alert('Booking cancelled successfully');
//         fetchBooking(); // Refresh data
//       } catch (error: any) {
//         alert(error.message || 'Failed to cancel booking');
//       }
//     }
//   };

//   const handleUpdateStatus = async (newStatus: string) => {
//     try {
//       await bookingsAPI.updateBookingStatus(bookingId, newStatus);
//       alert(`Booking status updated to ${newStatus}`);
//       fetchBooking(); // Refresh data
//     } catch (error: any) {
//       alert(error.message || 'Failed to update booking status');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="space-y-8">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
//             <p className="text-gray-600 mt-2">Loading...</p>
//           </div>
//         </div>
//         <div className="flex items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//           <span className="ml-3 text-gray-600">Loading booking details...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error || !booking) {
//     return (
//       <div className="space-y-8">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
//             <p className="text-gray-600 mt-2">Booking ID: #{bookingId?.slice(-8)}</p>
//           </div>
//         </div>
//         <div className="text-center py-12">
//           <div className="text-red-600 text-lg mb-2">Error loading booking</div>
//           <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
//           <button
//             onClick={fetchBooking}
//             className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 mr-2"
//           >
//             Try Again
//           </button>
//           <button
//             onClick={() => router.push('/admin/bookings')}
//             className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50"
//           >
//             Back to Bookings
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const nights = calculateNights(booking.checkIn, booking.checkOut);
//   const subtotal = booking.property.price * nights;

//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
//           <p className="text-gray-600 mt-2">Booking ID: #{booking._id.slice(-8)}</p>
//         </div>
//         <div className="space-x-3">
//           <select
//             value={booking.bookingStatus}
//             onChange={(e) => handleUpdateStatus(e.target.value)}
//             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//           >
//             <option value="pending">Pending</option>
//             <option value="confirmed">Confirmed</option>
//             <option value="completed">Completed</option>
//             <option value="cancelled">Cancelled</option>
//           </select>
//           {booking.bookingStatus !== 'cancelled' && (
//             <button 
//               onClick={handleCancelBooking}
//               className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
//             >
//               Cancel Booking
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Main Content */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Access Pass Section */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-[#383a3c]">Access Pass</h2>
//               {booking.bookingStatus === 'confirmed' && (
//                 <button
//                   onClick={() => setShowAccessPassForm(!showAccessPassForm)}
//                   className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//                 >
//                   {booking.accessPass?.status === 'sent' ? 'Update Access Pass' : 'Send Access Pass'}
//                 </button>
//               )}
//             </div>

//             {showAccessPassForm ? (
//               <AccessPassForm
//                 booking={booking}
//                 onSend={handleSendAccessPass}
//                 onUpdate={handleUpdateAccessPass}
//                 onCancel={() => setShowAccessPassForm(false)}
//                 loading={sendingAccessPass}
//               />
//             ) : (
//               <div className="space-y-4">
//                 {booking.accessPass?.status === 'sent' ? (
//                   <>
//                     <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <h3 className="font-semibold text-green-800">Access Pass Sent</h3>
//                           <p className="text-green-700 text-sm">
//                             Sent on {formatDateTime(booking.accessPass.sentAt!)}
//                             {booking.accessPass.sentBy && ` by ${booking.accessPass.sentBy.firstName} ${booking.accessPass.sentBy.lastName}`}
//                           </p>
//                         </div>
//                         <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
//                           Active
//                         </span>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
//                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
//                           <code className="text-2xl font-bold text-[#f06123] font-mono">
//                             {booking.accessPass.code}
//                           </code>
//                         </div>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
//                         <p className="text-gray-900">{booking.accessPass.providedBy || 'Not specified'}</p>
//                       </div>
//                     </div>

//                     {booking.accessPass.instructions && (
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
//                         <p className="text-gray-900 whitespace-pre-line">{booking.accessPass.instructions}</p>
//                       </div>
//                     )}

//                     <div className="text-sm text-gray-600">
//                       <p>Expires: {formatDateTime(booking.accessPass.expiresAt!)}</p>
//                     </div>
//                   </>
//                 ) : (
//                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
//                     <div className="text-4xl mb-2">🔐</div>
//                     <h3 className="font-semibold text-yellow-800 mb-2">No Access Pass Sent</h3>
//                     <p className="text-yellow-700 mb-4">
//                       {booking.bookingStatus === 'confirmed' 
//                         ? "Send the access pass to the guest for their stay."
//                         : "Access pass can be sent after booking is confirmed."
//                       }
//                     </p>
//                     {booking.bookingStatus === 'confirmed' && (
//                       <button
//                         onClick={() => setShowAccessPassForm(true)}
//                         className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//                       >
//                         Send Access Pass
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Property Details */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Property Details</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Property Name</span>
//                 <span className="font-medium">{booking.property.title}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Property Type</span>
//                 <span className="font-medium capitalize">{booking.property.type}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Location</span>
//                 <span className="font-medium">{booking.property.location}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Bedrooms</span>
//                 <span className="font-medium">{booking.property.specifications.bedrooms}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Bathrooms</span>
//                 <span className="font-medium">{booking.property.specifications.bathrooms}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Max Guests</span>
//                 <span className="font-medium">{booking.property.specifications.maxGuests}</span>
//               </div>
//             </div>
//           </div>

//           {/* Guest Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Guest Information</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Full Name</span>
//                 <span className="font-medium">{booking.user.firstName} {booking.user.lastName}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Email</span>
//                 <span className="font-medium">{booking.user.email}</span>
//               </div>
//               {booking.user.phone && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Phone</span>
//                   <span className="font-medium">{booking.user.phone}</span>
//                 </div>
//               )}
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Guests</span>
//                 <span className="font-medium">{booking.guests}</span>
//               </div>
//             </div>
//           </div>

//           {/* Special Requests */}
//           {booking.specialRequests && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Special Requests</h2>
//               <p className="text-gray-700">{booking.specialRequests}</p>
//             </div>
//           )}

//           {/* Cancellation Details */}
//           {booking.bookingStatus === 'cancelled' && booking.cancellationReason && (
//             <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
//               <h2 className="text-xl font-semibold text-red-800 mb-4">Cancellation Details</h2>
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Cancellation Reason</span>
//                   <span className="font-medium">{booking.cancellationReason}</span>
//                 </div>
//                 {booking.cancelledAt && (
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Cancelled At</span>
//                     <span className="font-medium">{formatDate(booking.cancelledAt)}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Sidebar */}
//         <div className="space-y-6">
//           {/* Booking Summary */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Booking Summary</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Check-in</span>
//                 <span className="font-medium">{formatDate(booking.checkIn)}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Check-out</span>
//                 <span className="font-medium">{formatDate(booking.checkOut)}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Nights</span>
//                 <span className="font-medium">{nights}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Status</span>
//                 <span className={`font-medium capitalize ${
//                   booking.bookingStatus === 'confirmed' ? 'text-green-600' :
//                   booking.bookingStatus === 'pending' ? 'text-yellow-600' :
//                   booking.bookingStatus === 'cancelled' ? 'text-red-600' :
//                   'text-blue-600'
//                 }`}>
//                   {booking.bookingStatus}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Booked On</span>
//                 <span className="font-medium">{formatDate(booking.createdAt)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Payment Details */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Payment Details</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Nightly Rate</span>
//                 <span className="font-medium">₦{booking.property.price.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Subtotal ({nights} nights)</span>
//                 <span className="font-medium">₦{subtotal.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Service Fee</span>
//                 <span className="font-medium">₦{booking.serviceFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between border-t border-gray-200 pt-3">
//                 <span className="text-gray-800 font-semibold">Total</span>
//                 <span className="text-[#383a3c] font-bold">₦{booking.totalAmount.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Payment Status</span>
//                 <span className={`font-medium capitalize ${
//                   booking.paymentStatus === 'paid' ? 'text-green-600' :
//                   booking.paymentStatus === 'pending' ? 'text-yellow-600' :
//                   'text-red-600'
//                 }`}>
//                   {booking.paymentStatus}
//                 </span>
//               </div>
//               {booking.paymentReference && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Reference</span>
//                   <span className="font-medium text-xs">{booking.paymentReference}</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




























































// // // app/admin/bookings/[id]/page.tsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useParams, useRouter } from 'next/navigation';
// // import { bookingsAPI } from '@/lib/api';

// // interface Booking {
// //   _id: string;
// //   property: {
// //     _id: string;
// //     title: string;
// //     location: string;
// //     type: string;
// //     price: number;
// //     specifications: {
// //       bedrooms: number;
// //       bathrooms: number;
// //       maxGuests: number;
// //     };
// //   };
// //   user: {
// //     _id: string;
// //     firstName: string;
// //     lastName: string;
// //     email: string;
// //     phone?: string;
// //   };
// //   checkIn: string;
// //   checkOut: string;
// //   guests: number;
// //   totalAmount: number;
// //   serviceFee: number;
// //   paymentStatus: string;
// //   bookingStatus: string;
// //   paymentReference: string;
// //   paystackReference?: string;
// //   specialRequests?: string;
// //   createdAt: string;
// //   cancelledAt?: string;
// //   cancellationReason?: string;
// // }

// // export default function BookingDetailsPage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const [booking, setBooking] = useState<Booking | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');

// //   const bookingId = params.id as string;

// //   useEffect(() => {
// //     if (bookingId) {
// //       fetchBooking();
// //     }
// //   }, [bookingId]);

// //   const fetchBooking = async () => {
// //     try {
// //       setLoading(true);
// //       const response = await bookingsAPI.getBookingById(bookingId);
// //       setBooking(response.booking);
// //     } catch (error: any) {
// //       setError(error.message || 'Failed to fetch booking details');
// //       console.error('Error fetching booking:', error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString('en-US', {
// //       month: 'short',
// //       day: 'numeric',
// //       year: 'numeric'
// //     });
// //   };

// //   const calculateNights = (checkIn: string, checkOut: string) => {
// //     const start = new Date(checkIn);
// //     const end = new Date(checkOut);
// //     return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
// //   };

// //   const handleCancelBooking = async () => {
// //     if (confirm('Are you sure you want to cancel this booking?')) {
// //       try {
// //         await bookingsAPI.updateBookingStatus(bookingId, 'cancelled');
// //         alert('Booking cancelled successfully');
// //         fetchBooking(); // Refresh data
// //       } catch (error: any) {
// //         alert(error.message || 'Failed to cancel booking');
// //       }
// //     }
// //   };

// //   const handleUpdateStatus = async (newStatus: string) => {
// //     try {
// //       await bookingsAPI.updateBookingStatus(bookingId, newStatus);
// //       alert(`Booking status updated to ${newStatus}`);
// //       fetchBooking(); // Refresh data
// //     } catch (error: any) {
// //       alert(error.message || 'Failed to update booking status');
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="space-y-8">
// //         <div className="flex justify-between items-center">
// //           <div>
// //             <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
// //             <p className="text-gray-600 mt-2">Loading...</p>
// //           </div>
// //         </div>
// //         <div className="flex items-center justify-center py-12">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
// //           <span className="ml-3 text-gray-600">Loading booking details...</span>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error || !booking) {
// //     return (
// //       <div className="space-y-8">
// //         <div className="flex justify-between items-center">
// //           <div>
// //             <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
// //             <p className="text-gray-600 mt-2">Booking ID: #{bookingId?.slice(-8)}</p>
// //           </div>
// //         </div>
// //         <div className="text-center py-12">
// //           <div className="text-red-600 text-lg mb-2">Error loading booking</div>
// //           <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
// //           <button
// //             onClick={fetchBooking}
// //             className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 mr-2"
// //           >
// //             Try Again
// //           </button>
// //           <button
// //             onClick={() => router.push('/admin/bookings')}
// //             className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50"
// //           >
// //             Back to Bookings
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   const nights = calculateNights(booking.checkIn, booking.checkOut);
// //   const subtotal = booking.property.price * nights;

// //   return (
// //     <div className="space-y-8">
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
// //           <p className="text-gray-600 mt-2">Booking ID: #{booking._id.slice(-8)}</p>
// //         </div>
// //         <div className="space-x-3">
// //           <select
// //             value={booking.bookingStatus}
// //             onChange={(e) => handleUpdateStatus(e.target.value)}
// //             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
// //           >
// //             <option value="pending">Pending</option>
// //             <option value="confirmed">Confirmed</option>
// //             <option value="completed">Completed</option>
// //             <option value="cancelled">Cancelled</option>
// //           </select>
// //           {booking.bookingStatus !== 'cancelled' && (
// //             <button 
// //               onClick={handleCancelBooking}
// //               className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
// //             >
// //               Cancel Booking
// //             </button>
// //           )}
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //         {/* Main Content */}
// //         <div className="lg:col-span-2 space-y-6">
// //           {/* Property Details */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Property Details</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Property Name</span>
// //                 <span className="font-medium">{booking.property.title}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Property Type</span>
// //                 <span className="font-medium capitalize">{booking.property.type}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Location</span>
// //                 <span className="font-medium">{booking.property.location}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Bedrooms</span>
// //                 <span className="font-medium">{booking.property.specifications.bedrooms}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Bathrooms</span>
// //                 <span className="font-medium">{booking.property.specifications.bathrooms}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Max Guests</span>
// //                 <span className="font-medium">{booking.property.specifications.maxGuests}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Guest Information */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Guest Information</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Full Name</span>
// //                 <span className="font-medium">{booking.user.firstName} {booking.user.lastName}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Email</span>
// //                 <span className="font-medium">{booking.user.email}</span>
// //               </div>
// //               {booking.user.phone && (
// //                 <div className="flex justify-between">
// //                   <span className="text-gray-600">Phone</span>
// //                   <span className="font-medium">{booking.user.phone}</span>
// //                 </div>
// //               )}
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Guests</span>
// //                 <span className="font-medium">{booking.guests}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Special Requests */}
// //           {booking.specialRequests && (
// //             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Special Requests</h2>
// //               <p className="text-gray-700">{booking.specialRequests}</p>
// //             </div>
// //           )}

// //           {/* Cancellation Details */}
// //           {booking.bookingStatus === 'cancelled' && booking.cancellationReason && (
// //             <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
// //               <h2 className="text-xl font-semibold text-red-800 mb-4">Cancellation Details</h2>
// //               <div className="space-y-3">
// //                 <div className="flex justify-between">
// //                   <span className="text-gray-600">Cancellation Reason</span>
// //                   <span className="font-medium">{booking.cancellationReason}</span>
// //                 </div>
// //                 {booking.cancelledAt && (
// //                   <div className="flex justify-between">
// //                     <span className="text-gray-600">Cancelled At</span>
// //                     <span className="font-medium">{formatDate(booking.cancelledAt)}</span>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* Sidebar */}
// //         <div className="space-y-6">
// //           {/* Booking Summary */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Booking Summary</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Check-in</span>
// //                 <span className="font-medium">{formatDate(booking.checkIn)}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Check-out</span>
// //                 <span className="font-medium">{formatDate(booking.checkOut)}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Nights</span>
// //                 <span className="font-medium">{nights}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Status</span>
// //                 <span className={`font-medium capitalize ${
// //                   booking.bookingStatus === 'confirmed' ? 'text-green-600' :
// //                   booking.bookingStatus === 'pending' ? 'text-yellow-600' :
// //                   booking.bookingStatus === 'cancelled' ? 'text-red-600' :
// //                   'text-blue-600'
// //                 }`}>
// //                   {booking.bookingStatus}
// //                 </span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Booked On</span>
// //                 <span className="font-medium">{formatDate(booking.createdAt)}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Payment Details */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Payment Details</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Nightly Rate</span>
// //                 <span className="font-medium">₦{booking.property.price.toLocaleString()}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Subtotal ({nights} nights)</span>
// //                 <span className="font-medium">₦{subtotal.toLocaleString()}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Service Fee</span>
// //                 <span className="font-medium">₦{booking.serviceFee.toLocaleString()}</span>
// //               </div>
// //               <div className="flex justify-between border-t border-gray-200 pt-3">
// //                 <span className="text-gray-800 font-semibold">Total</span>
// //                 <span className="text-[#383a3c] font-bold">₦{booking.totalAmount.toLocaleString()}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Payment Status</span>
// //                 <span className={`font-medium capitalize ${
// //                   booking.paymentStatus === 'paid' ? 'text-green-600' :
// //                   booking.paymentStatus === 'pending' ? 'text-yellow-600' :
// //                   'text-red-600'
// //                 }`}>
// //                   {booking.paymentStatus}
// //                 </span>
// //               </div>
// //               {booking.paymentReference && (
// //                 <div className="flex justify-between">
// //                   <span className="text-gray-600">Reference</span>
// //                   <span className="font-medium text-xs">{booking.paymentReference}</span>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


















































// // interface PageProps {
// //   params: {
// //     id: string;
// //   };
// // }

// // export default function BookingDetailsPage({ params }: PageProps) {
// //   // Mock data - in real app, fetch by ID
// //   const booking = {
// //     id: parseInt(params.id),
// //     property: {
// //       name: "Luxury Apartment in City Center",
// //       type: "apartment",
// //       location: "Victoria Island, Lagos"
// //     },
// //     guest: {
// //       name: "John Doe",
// //       email: "john@example.com",
// //       phone: "+1 (555) 123-4567"
// //     },
// //     dates: {
// //       checkIn: "2024-02-15",
// //       checkOut: "2024-02-20",
// //       nights: 5
// //     },
// //     payment: {
// //       total: 600,
// //       subtotal: 500,
// //       serviceFee: 50,
// //       tax: 50,
// //       method: "Credit Card",
// //       status: "paid"
// //     },
// //     status: "confirmed",
// //     specialRequests: "Early check-in would be appreciated if possible.",
// //     bookedAt: "2024-01-10"
// //   };

// //   return (
// //     <div className="space-y-8">
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <h1 className="text-3xl font-bold text-[#383a3c]">Booking Details</h1>
// //           <p className="text-gray-600 mt-2">Booking ID: #{booking.id}</p>
// //         </div>
// //         <div className="space-x-3">
// //           <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
// //             Edit
// //           </button>
// //           <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
// //             Cancel Booking
// //           </button>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //         {/* Main Content */}
// //         <div className="lg:col-span-2 space-y-6">
// //           {/* Property Details */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Property Details</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Property Name</span>
// //                 <span className="font-medium">{booking.property.name}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Property Type</span>
// //                 <span className="font-medium capitalize">{booking.property.type}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Location</span>
// //                 <span className="font-medium">{booking.property.location}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Guest Information */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Guest Information</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Full Name</span>
// //                 <span className="font-medium">{booking.guest.name}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Email</span>
// //                 <span className="font-medium">{booking.guest.email}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Phone</span>
// //                 <span className="font-medium">{booking.guest.phone}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Special Requests */}
// //           {booking.specialRequests && (
// //             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Special Requests</h2>
// //               <p className="text-gray-700">{booking.specialRequests}</p>
// //             </div>
// //           )}
// //         </div>

// //         {/* Sidebar */}
// //         <div className="space-y-6">
// //           {/* Booking Summary */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Booking Summary</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Check-in</span>
// //                 <span className="font-medium">{booking.dates.checkIn}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Check-out</span>
// //                 <span className="font-medium">{booking.dates.checkOut}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Nights</span>
// //                 <span className="font-medium">{booking.dates.nights}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Status</span>
// //                 <span className="font-medium capitalize text-green-600">{booking.status}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Booked On</span>
// //                 <span className="font-medium">{booking.bookedAt}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Payment Details */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Payment Details</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Subtotal</span>
// //                 <span className="font-medium">${booking.payment.subtotal}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Service Fee</span>
// //                 <span className="font-medium">${booking.payment.serviceFee}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Tax</span>
// //                 <span className="font-medium">${booking.payment.tax}</span>
// //               </div>
// //               <div className="flex justify-between border-t border-gray-200 pt-3">
// //                 <span className="text-gray-800 font-semibold">Total</span>
// //                 <span className="text-[#383a3c] font-bold">${booking.payment.total}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Payment Method</span>
// //                 <span className="font-medium">{booking.payment.method}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Payment Status</span>
// //                 <span className="font-medium text-green-600 capitalize">{booking.payment.status}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


