'use client';

import { useState, useEffect } from 'react';
import { affiliateAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  createdAt: string;
  bookingStats?: {
    pending: { count: number; total: number };
    approved: { count: number; total: number };
    paid: { count: number; total: number };
  };
}

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalCommission: 0,
    pendingCommission: 0,
    totalEarnings: 0,
    totalBookings: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });

  useEffect(() => {
    fetchAffiliates();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [statusFilter, pagination.page]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const response = await affiliateAPI.getAffiliates({
        search: searchTerm,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setAffiliates(response.affiliates || []);
      setPagination(response.pagination || {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
      });
    } catch (error: any) {
      setError(error.message || 'Failed to fetch affiliates');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await affiliateAPI.getAffiliatesSummary();
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAffiliates();
  };

  const handleStatusChange = async (affiliateId: string, newStatus: string) => {
    try {
      await affiliateAPI.updateAffiliateStatus(affiliateId, newStatus);
      fetchAffiliates(); // Refresh the list
      fetchSummary(); // Refresh summary
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (affiliateId: string) => {
    if (!confirm('Are you sure you want to delete this affiliate? This action cannot be undone.')) {
      return;
    }

    try {
      await affiliateAPI.deleteAffiliate(affiliateId);
      fetchAffiliates();
      fetchSummary();
    } catch (error: any) {
      alert(error.message || 'Failed to delete affiliate');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && affiliates.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading affiliates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Affiliate Management</h1>
          <p className="text-gray-600 mt-2">Manage affiliates and track their performance</p>
        </div>
        <Link
          href="/admin/affiliates/new"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200 flex items-center shadow-lg hover:shadow-xl whitespace-nowrap"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Affiliate
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold mb-2">{summary.totalAffiliates}</div>
          <div className="text-purple-100">Total Affiliates</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold mb-2">{summary.activeAffiliates}</div>
          <div className="text-green-100">Active Affiliates</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold mb-2">{formatCurrency(summary.totalEarnings || 0)}</div>
          <div className="text-blue-100">Total Bookings</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold mb-2">{formatCurrency(summary.totalCommission || 0)}</div>
          <div className="text-orange-100">Total Commission</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="text-3xl font-bold mb-2">{formatCurrency(summary.pendingCommission || 0)}</div>
          <div className="text-yellow-100">Pending Commission</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or affiliate code..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
          >
            Search
          </button>
        </form>
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
              onClick={fetchAffiliates}
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Affiliates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {affiliates.map((affiliate) => (
                <tr key={affiliate._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/affiliates/${affiliate._id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-[#383a3c]">{affiliate.name}</div>
                      <div className="text-gray-500 text-sm">{affiliate.email}</div>
                      <div className="text-gray-400 text-xs">{affiliate.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-lg inline-block">
                      <code className="font-mono font-bold text-purple-700 text-lg">
                        {affiliate.affiliateCode}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-purple-600">
                      {affiliate.commissionRate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xl font-semibold text-[#383a3c]">
                      {affiliate.stats?.totalBookings || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-blue-600">
                      {formatCurrency(affiliate.stats?.totalEarnings || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-yellow-600">
                      {formatCurrency(affiliate.stats?.pendingCommission || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-green-600">
                      {formatCurrency(affiliate.stats?.paidCommission || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={affiliate.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(affiliate._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(affiliate.status)} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(affiliate.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/admin/affiliates/${affiliate._id}`}
                      className="text-purple-600 hover:text-purple-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/affiliates/${affiliate._id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(affiliate._id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {affiliates.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No affiliates found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first affiliate.</p>
            <Link
              href="/admin/affiliates/new"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200 inline-block"
            >
              Add First Affiliate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}