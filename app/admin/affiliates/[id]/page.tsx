'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { affiliateAPI } from '@/lib/api';
import Link from 'next/link';

interface Affiliate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  affiliateCode: string;
  initials: string;
  commissionRate: number;
  status: string;
  stats: {
    totalBookings: number;
    totalEarnings: number;
    totalCommission: number;
    paidCommission: number;
    pendingCommission: number;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AffiliateBooking {
  _id: string;
  booking: {
    _id: string;
    property: {
      title: string;
      location: string;
    };
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  };
  bookingAmount: number;
  commissionAmount: number;
  commissionStatus: string;
  appliedAt: string;
}

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [bookings, setBookings] = useState<AffiliateBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingPagination, setBookingPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [bookingStatus, setBookingStatus] = useState('all');

  const affiliateId = params.id as string;

  useEffect(() => {
    if (affiliateId) {
      fetchAffiliate();
      fetchBookings();
    }
  }, [affiliateId]);

  useEffect(() => {
    if (affiliateId) {
      fetchBookings();
    }
  }, [bookingPagination.page, bookingStatus]);

  const fetchAffiliate = async () => {
    try {
      setLoading(true);
      const response = await affiliateAPI.getAffiliateById(affiliateId);
      setAffiliate(response.affiliate);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch affiliate details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await affiliateAPI.getAffiliateBookings(affiliateId, {
        page: bookingPagination.page,
        limit: bookingPagination.limit,
        status: bookingStatus !== 'all' ? bookingStatus : undefined
      });
      setBookings(response.bookings || []);
      setBookingPagination(response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      });
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await affiliateAPI.updateAffiliateStatus(affiliateId, newStatus);
      fetchAffiliate();
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleCommissionStatusChange = async (commissionId: string, status: string) => {
    try {
      await affiliateAPI.updateCommissionStatus(commissionId, status);
      fetchBookings();
      fetchAffiliate(); // Refresh stats
    } catch (error: any) {
      alert(error.message || 'Failed to update commission status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommissionStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading affiliate details...</span>
        </div>
      </div>
    );
  }

  if (error || !affiliate) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">
            {error || 'Affiliate not found'}
          </div>
          <p className="text-gray-600 mb-4">The affiliate you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/affiliates')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
          >
            Back to Affiliates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#383a3c]">{affiliate.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(affiliate.status)}`}>
              {affiliate.status}
            </span>
          </div>
          <p className="text-gray-600 mt-2">Affiliate since {formatDate(affiliate.createdAt)}</p>
        </div>
        <div className="flex gap-3">
          <select
            value={affiliate.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(affiliate.status)} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <Link
            href={`/admin/affiliates/${affiliateId}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Edit
          </Link>
          <Link
            href="/admin/affiliates"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Affiliate Code Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-purple-100 mb-2">Affiliate Code</p>
            <div className="text-5xl font-mono font-bold tracking-wider">
              {affiliate.affiliateCode}
            </div>
            <p className="text-purple-100 mt-3">
              Share this code with customers to earn {affiliate.commissionRate}% commission
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg px-8 py-4 text-center">
            <div className="text-3xl font-bold">{affiliate.commissionRate}%</div>
            <div className="text-sm text-purple-100">Commission Rate</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-[#383a3c]">{affiliate.stats?.totalBookings || 0}</div>
          <div className="text-gray-600">Total Bookings</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(affiliate.stats?.totalEarnings || 0)}</div>
          <div className="text-gray-600">Total Booking Value</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600">{formatCurrency(affiliate.stats?.totalCommission || 0)}</div>
          <div className="text-gray-600">Total Commission</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-green-600">{formatCurrency(affiliate.stats?.paidCommission || 0)}</div>
          <div className="text-gray-600">Paid Commission</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payouts'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payouts
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{affiliate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{affiliate.phone}</p>
                  </div>
                  {affiliate.contactPerson?.name && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-medium">{affiliate.contactPerson.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Email</p>
                        <p className="font-medium">{affiliate.contactPerson.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Phone</p>
                        <p className="font-medium">{affiliate.contactPerson.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium">{affiliate.contactPerson.position}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              {affiliate.bankDetails?.accountName && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Bank Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Name</p>
                      <p className="font-medium">{affiliate.bankDetails.accountName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">{affiliate.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{affiliate.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bank Code</p>
                      <p className="font-medium">{affiliate.bankDetails.bankCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              {affiliate.address?.street && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Address</h2>
                  <p className="font-medium">
                    {affiliate.address.street}<br />
                    {affiliate.address.city}, {affiliate.address.state}<br />
                    {affiliate.address.country}
                  </p>
                </div>
              )}

              {/* Notes */}
              {affiliate.notes && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Notes</h2>
                  <p className="text-gray-700 whitespace-pre-line">{affiliate.notes}</p>
                </div>
              )}
            </div>

            {/* Commission Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Commission Summary</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-medium text-yellow-600">{formatCurrency(affiliate.stats?.pendingCommission || 0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 rounded-full h-2"
                        style={{
                          width: `${affiliate.stats?.totalCommission ? 
                            (affiliate.stats.pendingCommission / affiliate.stats.totalCommission) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Paid</span>
                      <span className="font-medium text-green-600">{formatCurrency(affiliate.stats?.paidCommission || 0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2"
                        style={{
                          width: `${affiliate.stats?.totalCommission ? 
                            (affiliate.stats.paidCommission / affiliate.stats.totalCommission) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Commission</span>
                      <span className="text-purple-600">{formatCurrency(affiliate.stats?.totalCommission || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href={`/admin/affiliates/${affiliateId}/payout`}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-200 text-center block"
                  >
                    Process Payout
                  </Link>
                  <Link
                    href={`/admin/affiliates/${affiliateId}/edit`}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 text-center block"
                  >
                    Edit Affiliate
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Booking Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Commissions</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#383a3c]">
                          #{booking.booking?._id?.slice(-8) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.booking?.property?.title || 'Unknown Property'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {booking.booking?.property?.location || ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.booking?.checkIn ? formatDate(booking.booking.checkIn) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {formatCurrency(booking.bookingAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                          {formatCurrency(booking.commissionAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={booking.commissionStatus}
                            onChange={(e) => handleCommissionStatusChange(booking._id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCommissionStatusColor(booking.commissionStatus)} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(booking.appliedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/bookings/${booking.booking?._id}`}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            View Booking
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No bookings found</p>
                </div>
              )}

              {/* Pagination */}
              {bookingPagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(bookingPagination.page - 1) * bookingPagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(bookingPagination.page * bookingPagination.limit, bookingPagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{bookingPagination.total}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBookingPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={bookingPagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setBookingPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={bookingPagination.page === bookingPagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Payout Management</h3>
            <p className="text-gray-500 mb-6">
              Process payouts for this affiliate. This feature is coming soon.
            </p>
            <button
              onClick={() => alert('Payout feature coming soon!')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
            >
              Process Payout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}