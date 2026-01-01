// app/admin/housekeeping/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { housekeepingAPI } from '@/lib/api';

interface HousekeepingRequest {
  _id: string;
  requestNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  property: {
    _id: string;
    title: string;
    location: string;
  };
  booking: {
    _id: string;
    checkIn: string;
    checkOut: string;
  };
  type: 'cleaning' | 'linen' | 'amenities' | 'maintenance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'verified' | 'cancelled';
  assignedTo?: string;
  notes?: string;
  adminNotes?: string;
  estimatedDuration: number;
  actualDuration?: number;
  createdAt: string;
  completedAt?: string;
  verifiedAt?: string;
  scheduledTime?: string;
}

export default function AdminHousekeepingPage() {
  const [requests, setRequests] = useState<HousekeepingRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterStatus, setFilterStatus] = useState<'all' | HousekeepingRequest['status']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | HousekeepingRequest['priority']>('all');
  const [filterType, setFilterType] = useState<'all' | HousekeepingRequest['type']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  
  const [selectedRequest, setSelectedRequest] = useState<HousekeepingRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [assignStaff, setAssignStaff] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [actualDuration, setActualDuration] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [requestsResponse, statsResponse] = await Promise.all([
        housekeepingAPI.getAllRequests(),
        housekeepingAPI.getHousekeepingStats()
      ]);
      
      setRequests(requestsResponse.requests || []);
      setStats(statsResponse.stats);
    } catch (error: any) {
      console.error('Failed to fetch housekeeping data:', error);
      setError(error.response?.data?.message || 'Failed to load housekeeping data');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: HousekeepingRequest['status']) => {
    try {
      const updateData: any = { status };
      
      // Add actual duration when completing
      if (status === 'completed' && actualDuration) {
        updateData.actualDuration = parseInt(actualDuration);
      }
      
      await housekeepingAPI.updateRequestStatus(id, updateData);
      await fetchData(); // Refresh data
      setActualDuration('');
      alert('Request status updated successfully');
    } catch (error: any) {
      console.error('Failed to update request status:', error);
      alert(error.response?.data?.message || 'Failed to update request status');
    }
  };

  const assignToStaff = async (id: string, staffName: string) => {
    if (!staffName.trim()) {
      alert('Please enter staff name');
      return;
    }

    try {
      await housekeepingAPI.updateRequestStatus(id, { assignedTo: staffName });
      await fetchData(); // Refresh data
      setAssignStaff('');
      alert('Staff assigned successfully');
    } catch (error: any) {
      console.error('Failed to assign staff:', error);
      alert(error.response?.data?.message || 'Failed to assign staff');
    }
  };

  const addRequestNotes = async (id: string, adminNotes: string) => {
    try {
      await housekeepingAPI.updateRequestStatus(id, { adminNotes });
      await fetchData(); // Refresh data
      setAddNotes('');
      setShowDetailsModal(false);
      alert('Notes added successfully');
    } catch (error: any) {
      console.error('Failed to add notes:', error);
      alert(error.response?.data?.message || 'Failed to add notes');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return '🧹';
      case 'linen': return '🛏️';
      case 'amenities': return '☕';
      case 'maintenance': return '🔧';
      default: return '📋';
    }
  };

  const viewRequestDetails = (request: HousekeepingRequest) => {
    setSelectedRequest(request);
    setAddNotes(request.adminNotes || '');
    setShowDetailsModal(true);
  };

  // Filter and sort requests
  const filteredRequests = requests
    .filter(request => 
      (filterStatus === 'all' || request.status === filterStatus) &&
      (filterPriority === 'all' || request.priority === filterPriority) &&
      (filterType === 'all' || request.type === filterType)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { pending: 1, 'in-progress': 2, completed: 3, verified: 4, cancelled: 0 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Housekeeping Management</h1>
            <p className="text-gray-600 mt-2">Loading housekeeping data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading housekeeping data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Housekeeping Management</h1>
          <p className="text-gray-600 mt-2">Manage cleaning requests and maintenance tasks from guests</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>
          <button
            onClick={fetchData}
            className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

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
              onClick={fetchData}
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.totalRequests}</div>
            <div className="text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
            <div className="text-gray-600">Awaiting Action</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressRequests}</div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <div className="text-gray-600">Completed Today</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            >
              <option value="all">All Types</option>
              <option value="cleaning">Cleaning</option>
              <option value="linen">Linen</option>
              <option value="amenities">Amenities</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        {/* Quick Action Filters */}
        <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
          <button
            onClick={() => {
              setFilterStatus('pending');
              setFilterPriority('all');
              setFilterType('all');
            }}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer"
          >
            ⏳ Pending Only
          </button>
          <button
            onClick={() => {
              setFilterPriority('urgent');
              setFilterStatus('all');
              setFilterType('all');
            }}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 cursor-pointer"
          >
            🔴 Urgent Only
          </button>
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterPriority('all');
              setFilterType('all');
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#383a3c]">
            {filteredRequests.length} Requests
            {(filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all') && ' (Filtered)'}
          </h3>
          <div className="text-sm text-gray-500">
            Showing {filteredRequests.length} of {requests.length} total requests
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRequests.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div 
                          className="font-medium text-[#383a3c] cursor-pointer hover:text-[#f06123]"
                          onClick={() => viewRequestDetails(request)}
                        >
                          {request.requestNumber}
                        </div>
                        <div className="text-gray-500 text-sm">{request.property.title}</div>
                        <div className="text-gray-600 text-sm mt-1 line-clamp-2">{request.description}</div>
                        {request.assignedTo && (
                          <div className="text-blue-600 text-xs mt-1">Assigned to: {request.assignedTo}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.user.firstName} {request.user.lastName}
                      </div>
                      <div className="text-gray-500 text-sm">{request.user.email}</div>
                      {request.user.phone && (
                        <div className="text-gray-500 text-sm">{request.user.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(request.type)}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {request.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)} capitalize`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}>
                        {request.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.actualDuration 
                        ? `${request.actualDuration}m` 
                        : request.estimatedDuration 
                          ? `Est. ${request.estimatedDuration}m` 
                          : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(request.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {/* Status Update Actions */}
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateRequestStatus(request._id, 'in-progress')}
                              className="text-blue-600 hover:text-blue-700 cursor-pointer text-left text-sm"
                            >
                              Start Task
                            </button>
                            <div className="flex space-x-1">
                              <input
                                type="text"
                                value={assignStaff}
                                onChange={(e) => setAssignStaff(e.target.value)}
                                placeholder="Assign staff..."
                                className="text-xs px-2 py-1 border rounded w-24"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={() => assignToStaff(request._id, assignStaff)}
                                className="text-green-600 hover:text-green-700 cursor-pointer text-xs"
                              >
                                Assign
                              </button>
                            </div>
                          </>
                        )}
                        
                        {request.status === 'in-progress' && (
                          <div className="space-y-1">
                            <button
                              onClick={() => updateRequestStatus(request._id, 'completed')}
                              className="text-green-600 hover:text-green-700 cursor-pointer text-left text-sm block w-full"
                            >
                              Mark Complete
                            </button>
                            <div className="flex space-x-1">
                              <input
                                type="number"
                                value={actualDuration}
                                onChange={(e) => setActualDuration(e.target.value)}
                                placeholder="Actual mins"
                                className="text-xs px-2 py-1 border rounded w-20"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={() => {
                                  if (actualDuration) {
                                    updateRequestStatus(request._id, 'completed');
                                  }
                                }}
                                className="text-green-600 hover:text-green-700 cursor-pointer text-xs"
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {request.status === 'completed' && (
                          <button
                            onClick={() => updateRequestStatus(request._id, 'verified')}
                            className="text-purple-600 hover:text-purple-700 cursor-pointer text-left text-sm"
                          >
                            Verify
                          </button>
                        )}

                        {/* Common Actions */}
                        <button 
                          onClick={() => viewRequestDetails(request)}
                          className="text-gray-600 hover:text-gray-700 cursor-pointer text-left text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🧹</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No requests found</h3>
              <p className="text-gray-500">
                {filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all'
                  ? 'No requests match your current filters.' 
                  : 'No housekeeping requests have been made yet.'
                }
              </p>
              {(filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterType('all');
                  }}
                  className="mt-4 bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Request Details - {selectedRequest.requestNumber}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property</label>
                <p className="text-gray-900">{selectedRequest.property.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Guest</label>
                <p className="text-gray-900">{selectedRequest.user.firstName} {selectedRequest.user.lastName}</p>
                <p className="text-gray-600 text-sm">{selectedRequest.user.email}</p>
                {selectedRequest.user.phone && (
                  <p className="text-gray-600 text-sm">{selectedRequest.user.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <div className="flex items-center">
                  <span className="text-lg mr-2">{getTypeIcon(selectedRequest.type)}</span>
                  <p className="text-gray-900 capitalize">{selectedRequest.type}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)} capitalize`}>
                  {selectedRequest.priority}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)} capitalize`}>
                  {selectedRequest.status.replace('-', ' ')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Requested At</label>
                <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              {selectedRequest.assignedTo && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <p className="text-gray-900">{selectedRequest.assignedTo}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p>
            </div>

            {selectedRequest.notes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Notes</label>
                <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">{selectedRequest.notes}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
              <textarea
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                placeholder="Add notes or updates about this request..."
              />
              <button
                onClick={() => addRequestNotes(selectedRequest._id, addNotes)}
                className="mt-2 bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
              >
                Save Notes
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}































































// // app/admin/housekeeping/page.tsx
// 'use client';

// import { useState } from 'react';

// interface HousekeepingRequest {
//   id: string;
//   apartment: string;
//   unit: string;
//   type: 'cleaning' | 'linen' | 'amenities' | 'maintenance' | 'other';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   description: string;
//   requestedBy: string;
//   requestedAt: Date;
//   status: 'pending' | 'in-progress' | 'completed' | 'verified';
//   assignedTo?: string;
//   completedAt?: Date;
//   notes?: string;
//   estimatedDuration?: number; // in minutes
//   actualDuration?: number; // in minutes
// }

// export default function HousekeepingManager() {
//   const [requests, setRequests] = useState<HousekeepingRequest[]>([
//     {
//       id: 'HK-001',
//       apartment: 'Luxury Apartment',
//       unit: 'Unit 301',
//       type: 'cleaning',
//       priority: 'high',
//       description: 'Post-checkout deep cleaning required',
//       requestedBy: 'Michael Chen',
//       requestedAt: new Date('2024-01-20T10:00:00'),
//       status: 'pending',
//       estimatedDuration: 120
//     },
//     {
//       id: 'HK-002',
//       apartment: 'Beachfront Villa',
//       unit: 'Villa 102',
//       type: 'linen',
//       priority: 'medium',
//       description: 'Fresh linen and towel replacement',
//       requestedBy: 'Sarah Johnson',
//       requestedAt: new Date('2024-01-20T09:30:00'),
//       status: 'in-progress',
//       assignedTo: 'Clean Team A',
//       estimatedDuration: 45,
//       actualDuration: 30
//     },
//     {
//       id: 'HK-003',
//       apartment: 'City View Apartment',
//       unit: 'Unit 205',
//       type: 'amenities',
//       priority: 'low',
//       description: 'Restock toiletries and coffee supplies',
//       requestedBy: 'Emma Davis',
//       requestedAt: new Date('2024-01-20T08:15:00'),
//       status: 'completed',
//       assignedTo: 'Clean Team B',
//       completedAt: new Date('2024-01-20T10:30:00'),
//       estimatedDuration: 30,
//       actualDuration: 25
//     }
//   ]);

//   const [filterStatus, setFilterStatus] = useState<'all' | HousekeepingRequest['status']>('all');
//   const [filterPriority, setFilterPriority] = useState<'all' | HousekeepingRequest['priority']>('all');
//   const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
//   const [selectedRequest, setSelectedRequest] = useState<HousekeepingRequest | null>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [assignStaff, setAssignStaff] = useState('');
//   const [addNotes, setAddNotes] = useState('');

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
//       case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
//       case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       case 'low': return 'bg-green-100 text-green-800 border-green-200';
//       default: return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'completed': return 'bg-green-100 text-green-800';
//       case 'in-progress': return 'bg-blue-100 text-blue-800';
//       case 'verified': return 'bg-purple-100 text-purple-800';
//       case 'pending': return 'bg-gray-100 text-gray-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const updateRequestStatus = (id: string, status: HousekeepingRequest['status']) => {
//     setRequests(requests.map(req => 
//       req.id === id 
//         ? { 
//             ...req, 
//             status,
//             ...(status === 'completed' && !req.completedAt ? { completedAt: new Date() } : {}),
//             ...(status === 'in-progress' && !req.assignedTo ? { assignedTo: 'Unassigned' } : {})
//           }
//         : req
//     ));
//   };

//   const assignToStaff = (id: string, staffName: string) => {
//     setRequests(requests.map(req => 
//       req.id === id ? { ...req, assignedTo: staffName } : req
//     ));
//     setAssignStaff('');
//   };

//   const addRequestNotes = (id: string, notes: string) => {
//     setRequests(requests.map(req => 
//       req.id === id ? { ...req, notes } : req
//     ));
//     setAddNotes('');
//     setShowDetailsModal(false);
//   };

//   const deleteRequest = (id: string) => {
//     if (confirm('Are you sure you want to delete this request?')) {
//       setRequests(requests.filter(req => req.id !== id));
//     }
//   };

//   const viewRequestDetails = (request: HousekeepingRequest) => {
//     setSelectedRequest(request);
//     setShowDetailsModal(true);
//   };

//   // Filter and sort requests
//   const filteredRequests = requests
//     .filter(request => 
//       (filterStatus === 'all' || request.status === filterStatus) &&
//       (filterPriority === 'all' || request.priority === filterPriority)
//     )
//     .sort((a, b) => {
//       switch (sortBy) {
//         case 'priority':
//           const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
//           return priorityOrder[b.priority] - priorityOrder[a.priority];
//         case 'status':
//           const statusOrder = { pending: 1, 'in-progress': 2, completed: 3, verified: 4 };
//           return statusOrder[a.status] - statusOrder[b.status];
//         default:
//           return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
//       }
//     });

//   const pendingRequests = requests.filter(r => r.status === 'pending').length;
//   const inProgressRequests = requests.filter(r => r.status === 'in-progress').length;
//   const completedToday = requests.filter(r => 
//     r.status === 'completed' && 
//     r.completedAt && 
//     new Date(r.completedAt).toDateString() === new Date().toDateString()
//   ).length;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Housekeeping Management</h2>
//           <p className="text-gray-600">Manage cleaning requests and maintenance tasks from guests</p>
//         </div>
//         <div className="flex space-x-3">
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value as any)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//           >
//             <option value="all">All Status</option>
//             <option value="pending">Pending</option>
//             <option value="in-progress">In Progress</option>
//             <option value="completed">Completed</option>
//             <option value="verified">Verified</option>
//           </select>
//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value as any)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//           >
//             <option value="date">Sort by Date</option>
//             <option value="priority">Sort by Priority</option>
//             <option value="status">Sort by Status</option>
//           </select>
//         </div>
//       </div>

//       {/* Enhanced Stats Overview */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
//           <div className="text-gray-600">Total Requests</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-orange-600">{pendingRequests}</div>
//           <div className="text-gray-600">Awaiting Action</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-blue-600">{inProgressRequests}</div>
//           <div className="text-gray-600">In Progress</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-green-600">{completedToday}</div>
//           <div className="text-gray-600">Completed Today</div>
//         </div>
//       </div>

//       {/* Quick Actions Bar */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-wrap gap-4 items-center">
//           <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
//           <button
//             onClick={() => setFilterPriority('urgent')}
//             className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 cursor-pointer"
//           >
//             🔴 Urgent
//           </button>
//           <button
//             onClick={() => setFilterStatus('pending')}
//             className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer"
//           >
//             ⏳ Pending
//           </button>
//           <button
//             onClick={() => setFilterStatus('in-progress')}
//             className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 cursor-pointer"
//           >
//             🔄 In Progress
//           </button>
//           <button
//             onClick={() => {
//               setFilterStatus('all');
//               setFilterPriority('all');
//             }}
//             className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 cursor-pointer"
//           >
//             Clear Filters
//           </button>
//         </div>
//       </div>

//       {/* Enhanced Requests Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Details</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredRequests.map((request) => (
//                 <tr key={request.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4">
//                     <div>
//                       <div 
//                         className="font-medium text-[#383a3c] cursor-pointer hover:text-[#f06123]"
//                         onClick={() => viewRequestDetails(request)}
//                       >
//                         {request.id}
//                       </div>
//                       <div className="text-gray-500 text-sm">{request.apartment} - {request.unit}</div>
//                       <div className="text-gray-600 text-sm mt-1">{request.description}</div>
//                       <div className="text-gray-400 text-xs mt-1">By: {request.requestedBy}</div>
//                       {request.assignedTo && (
//                         <div className="text-blue-600 text-xs mt-1">Assigned to: {request.assignedTo}</div>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
//                       {request.type}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)} capitalize`}>
//                       {request.priority}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}>
//                       {request.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {request.actualDuration 
//                       ? `${request.actualDuration}m` 
//                       : request.estimatedDuration 
//                         ? `Est. ${request.estimatedDuration}m` 
//                         : '-'
//                     }
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     <div>{request.requestedAt.toLocaleDateString()}</div>
//                     <div className="text-gray-500">{request.requestedAt.toLocaleTimeString()}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                     <div className="flex flex-col space-y-2">
//                       {request.status === 'pending' && (
//                         <>
//                           <button
//                             onClick={() => updateRequestStatus(request.id, 'in-progress')}
//                             className="text-blue-600 hover:text-blue-700 cursor-pointer text-left"
//                           >
//                             Start Task
//                           </button>
//                           <div className="flex space-x-1">
//                             <input
//                               type="text"
//                               value={assignStaff}
//                               onChange={(e) => setAssignStaff(e.target.value)}
//                               placeholder="Assign staff..."
//                               className="text-xs px-2 py-1 border rounded w-24"
//                               onClick={(e) => e.stopPropagation()}
//                             />
//                             <button
//                               onClick={() => assignToStaff(request.id, assignStaff)}
//                               className="text-green-600 hover:text-green-700 cursor-pointer text-xs"
//                             >
//                               Assign
//                             </button>
//                           </div>
//                         </>
//                       )}
//                       {request.status === 'in-progress' && (
//                         <button
//                           onClick={() => updateRequestStatus(request.id, 'completed')}
//                           className="text-green-600 hover:text-green-700 cursor-pointer text-left"
//                         >
//                           Mark Complete
//                         </button>
//                       )}
//                       {request.status === 'completed' && (
//                         <button
//                           onClick={() => updateRequestStatus(request.id, 'verified')}
//                           className="text-purple-600 hover:text-purple-700 cursor-pointer text-left"
//                         >
//                           Verify
//                         </button>
//                       )}
//                       <button 
//                         onClick={() => viewRequestDetails(request)}
//                         className="text-gray-600 hover:text-gray-700 cursor-pointer text-left"
//                       >
//                         View Details
//                       </button>
//                       <button 
//                         onClick={() => deleteRequest(request.id)}
//                         className="text-red-600 hover:text-red-700 cursor-pointer text-left"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Request Details Modal */}
//       {showDetailsModal && selectedRequest && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-xl font-bold">Request Details - {selectedRequest.id}</h3>
//               <button
//                 onClick={() => setShowDetailsModal(false)}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
            
//             <div className="grid grid-cols-2 gap-4 mb-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Property</label>
//                 <p className="text-gray-900">{selectedRequest.apartment} - {selectedRequest.unit}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Requested By</label>
//                 <p className="text-gray-900">{selectedRequest.requestedBy}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Type</label>
//                 <p className="text-gray-900 capitalize">{selectedRequest.type}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Priority</label>
//                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)} capitalize`}>
//                   {selectedRequest.priority}
//                 </span>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Status</label>
//                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)} capitalize`}>
//                   {selectedRequest.status}
//                 </span>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Requested At</label>
//                 <p className="text-gray-900">{selectedRequest.requestedAt.toLocaleString()}</p>
//               </div>
//             </div>

//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//               <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p>
//             </div>

//             {selectedRequest.notes && (
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
//                 <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{selectedRequest.notes}</p>
//               </div>
//             )}

//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">Add Notes</label>
//               <textarea
//                 value={addNotes}
//                 onChange={(e) => setAddNotes(e.target.value)}
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 placeholder="Add notes or updates about this request..."
//               />
//               <button
//                 onClick={() => addRequestNotes(selectedRequest.id, addNotes)}
//                 className="mt-2 bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//               >
//                 Save Notes
//               </button>
//             </div>

//             <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
//               <button
//                 onClick={() => setShowDetailsModal(false)}
//                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






























































// // // components/admin/operational/HousekeepingManager.tsx
// // 'use client';

// // import { useState } from 'react';

// // interface HousekeepingRequest {
// //   id: string;
// //   apartment: string;
// //   unit: string;
// //   type: 'cleaning' | 'linen' | 'amenities' | 'maintenance' | 'other';
// //   priority: 'low' | 'medium' | 'high' | 'urgent';
// //   description: string;
// //   requestedBy: string;
// //   requestedAt: Date;
// //   status: 'pending' | 'in-progress' | 'completed' | 'verified';
// //   assignedTo?: string;
// //   completedAt?: Date;
// //   notes?: string;
// // }

// // export default function HousekeepingManager() {
// //   const [requests, setRequests] = useState<HousekeepingRequest[]>([
// //     {
// //       id: 'HK-001',
// //       apartment: 'Luxury Apartment',
// //       unit: 'Unit 301',
// //       type: 'cleaning',
// //       priority: 'high',
// //       description: 'Post-checkout deep cleaning required',
// //       requestedBy: 'Michael Chen',
// //       requestedAt: new Date('2024-01-20T10:00:00'),
// //       status: 'pending'
// //     },
// //     {
// //       id: 'HK-002',
// //       apartment: 'Beachfront Villa',
// //       unit: 'Villa 102',
// //       type: 'linen',
// //       priority: 'medium',
// //       description: 'Fresh linen and towel replacement',
// //       requestedBy: 'Sarah Johnson',
// //       requestedAt: new Date('2024-01-20T09:30:00'),
// //       status: 'in-progress',
// //       assignedTo: 'Clean Team A'
// //     }
// //   ]);

// //   const [showNewRequest, setShowNewRequest] = useState(false);
// //   const [newRequest, setNewRequest] = useState({
// //     apartment: '',
// //     unit: '',
// //     type: 'cleaning' as HousekeepingRequest['type'],
// //     priority: 'medium' as HousekeepingRequest['priority'],
// //     description: '',
// //     assignedTo: ''
// //   });

// //   const getPriorityColor = (priority: string) => {
// //     switch (priority) {
// //       case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
// //       case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
// //       case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
// //       case 'low': return 'bg-green-100 text-green-800 border-green-200';
// //       default: return 'bg-gray-100 text-gray-800 border-gray-200';
// //     }
// //   };

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'completed': return 'bg-green-100 text-green-800';
// //       case 'in-progress': return 'bg-blue-100 text-blue-800';
// //       case 'verified': return 'bg-purple-100 text-purple-800';
// //       case 'pending': return 'bg-gray-100 text-gray-800';
// //       default: return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const handleCreateRequest = () => {
// //     const request: HousekeepingRequest = {
// //       id: `HK-${String(requests.length + 1).padStart(3, '0')}`,
// //       apartment: newRequest.apartment,
// //       unit: newRequest.unit,
// //       type: newRequest.type,
// //       priority: newRequest.priority,
// //       description: newRequest.description,
// //       requestedBy: 'Admin',
// //       requestedAt: new Date(),
// //       status: 'pending',
// //       assignedTo: newRequest.assignedTo || undefined
// //     };
    
// //     setRequests([request, ...requests]);
// //     setShowNewRequest(false);
// //     setNewRequest({
// //       apartment: '',
// //       unit: '',
// //       type: 'cleaning',
// //       priority: 'medium',
// //       description: '',
// //       assignedTo: ''
// //     });
// //   };

// //   const updateRequestStatus = (id: string, status: HousekeepingRequest['status']) => {
// //     setRequests(requests.map(req => 
// //       req.id === id 
// //         ? { 
// //             ...req, 
// //             status,
// //             ...(status === 'completed' && !req.completedAt ? { completedAt: new Date() } : {})
// //           }
// //         : req
// //     ));
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <h2 className="text-2xl font-bold text-[#383a3c]">Housekeeping Management</h2>
// //           <p className="text-gray-600">Manage cleaning requests and maintenance tasks</p>
// //         </div>
// //         <button
// //           onClick={() => setShowNewRequest(true)}
// //           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// //         >
// //           + Create Request
// //         </button>
// //       </div>

// //       {/* Stats Overview */}
// //       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
// //           <div className="text-gray-600">Total Requests</div>
// //         </div>
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-orange-600">
// //             {requests.filter(r => r.status === 'pending').length}
// //           </div>
// //           <div className="text-gray-600">Pending</div>
// //         </div>
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-blue-600">
// //             {requests.filter(r => r.status === 'in-progress').length}
// //           </div>
// //           <div className="text-gray-600">In Progress</div>
// //         </div>
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-green-600">
// //             {requests.filter(r => r.status === 'completed').length}
// //           </div>
// //           <div className="text-gray-600">Completed</div>
// //         </div>
// //       </div>

// //       {/* Create Request Modal */}
// //       {showNewRequest && (
// //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
// //           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
// //             <h3 className="text-xl font-bold mb-4">Create Housekeeping Request</h3>
// //             <div className="space-y-4">
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
// //                 <input
// //                   type="text"
// //                   value={newRequest.apartment}
// //                   onChange={(e) => setNewRequest({...newRequest, apartment: e.target.value})}
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// //                   placeholder="Enter apartment name"
// //                 />
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
// //                 <input
// //                   type="text"
// //                   value={newRequest.unit}
// //                   onChange={(e) => setNewRequest({...newRequest, unit: e.target.value})}
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// //                   placeholder="Enter unit number"
// //                 />
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
// //                 <select
// //                   value={newRequest.type}
// //                   onChange={(e) => setNewRequest({...newRequest, type: e.target.value as any})}
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// //                 >
// //                   <option value="cleaning">Cleaning</option>
// //                   <option value="linen">Linen Service</option>
// //                   <option value="amenities">Amenities Restock</option>
// //                   <option value="maintenance">Maintenance</option>
// //                   <option value="other">Other</option>
// //                 </select>
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
// //                 <select
// //                   value={newRequest.priority}
// //                   onChange={(e) => setNewRequest({...newRequest, priority: e.target.value as any})}
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// //                 >
// //                   <option value="low">Low</option>
// //                   <option value="medium">Medium</option>
// //                   <option value="high">High</option>
// //                   <option value="urgent">Urgent</option>
// //                 </select>
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
// //                 <textarea
// //                   value={newRequest.description}
// //                   onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
// //                   rows={3}
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// //                   placeholder="Describe the housekeeping requirement..."
// //                 />
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Optional)</label>
// //                 <input
// //                   type="text"
// //                   value={newRequest.assignedTo}
// //                   onChange={(e) => setNewRequest({...newRequest, assignedTo: e.target.value})}
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
// //                   placeholder="Staff or team name"
// //                 />
// //               </div>
// //               <div className="flex space-x-3 pt-4">
// //                 <button
// //                   onClick={() => setShowNewRequest(false)}
// //                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   onClick={handleCreateRequest}
// //                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
// //                 >
// //                   Create Request
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Requests Table */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
// //         <div className="overflow-x-auto">
// //           <table className="w-full">
// //             <thead className="bg-gray-50">
// //               <tr>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
// //               </tr>
// //             </thead>
// //             <tbody className="bg-white divide-y divide-gray-200">
// //               {requests.map((request) => (
// //                 <tr key={request.id} className="hover:bg-gray-50">
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <div>
// //                       <div className="font-medium text-[#383a3c]">{request.id}</div>
// //                       <div className="text-gray-500 text-sm">{request.apartment} - {request.unit}</div>
// //                       <div className="text-gray-600 text-sm mt-1">{request.description}</div>
// //                     </div>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
// //                       {request.type}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)} capitalize`}>
// //                       {request.priority}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}>
// //                       {request.status}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
// //                     {request.assignedTo || 'Not assigned'}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
// //                     {request.requestedAt.toLocaleDateString()} at {request.requestedAt.toLocaleTimeString()}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
// //                     {request.status === 'pending' && (
// //                       <button
// //                         onClick={() => updateRequestStatus(request.id, 'in-progress')}
// //                         className="text-blue-600 hover:text-blue-700"
// //                       >
// //                         Start
// //                       </button>
// //                     )}
// //                     {request.status === 'in-progress' && (
// //                       <button
// //                         onClick={() => updateRequestStatus(request.id, 'completed')}
// //                         className="text-green-600 hover:text-green-700"
// //                       >
// //                         Complete
// //                       </button>
// //                     )}
// //                     {request.status === 'completed' && (
// //                       <button
// //                         onClick={() => updateRequestStatus(request.id, 'verified')}
// //                         className="text-purple-600 hover:text-purple-700"
// //                       >
// //                         Verify
// //                       </button>
// //                     )}
// //                     <button className="text-red-600 hover:text-red-700">Delete</button>
// //                   </td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


