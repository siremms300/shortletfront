// app/dashboard/housekeeping/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { housekeepingAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';

interface HousekeepingRequest {
  _id: string;
  requestNumber: string;
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
  scheduledTime?: string;
}

export default function HousekeepingPage() {
  const { user } = useAuth();
  const { bookings } = useBooking();
  const [requests, setRequests] = useState<HousekeepingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | HousekeepingRequest['status']>('all');

  const [newRequest, setNewRequest] = useState({
    bookingId: '',
    type: 'cleaning' as HousekeepingRequest['type'],
    priority: 'medium' as HousekeepingRequest['priority'],
    description: '',
    notes: '',
    scheduledTime: ''
  });

  // Get confirmed bookings for the request form
  const confirmedBookings = bookings.filter(booking => 
    booking.bookingStatus === 'confirmed' && 
    booking.paymentStatus === 'paid'
  );

  const currentBooking = confirmedBookings.find(booking => {
    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return today >= checkIn && today <= checkOut;
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await housekeepingAPI.getUserRequests();
      setRequests(response.requests || []);
    } catch (error: any) {
      console.error('Failed to fetch requests:', error);
      setError(error.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  // const submitRequest = async () => {
  //   try {
  //     if (!newRequest.bookingId) {
  //       setError('Please select a booking');
  //       return;
  //     }

  //     if (!newRequest.description.trim()) {
  //       setError('Description is required');
  //       return;
  //     }

  //     setError('');
  //     const response = await housekeepingAPI.createRequest(newRequest);
      
  //     setRequests([response.request, ...requests]);
  //     setShowRequestForm(false);
  //     setNewRequest({
  //       bookingId: '',
  //       type: 'cleaning',
  //       priority: 'medium',
  //       description: '',
  //       notes: '',
  //       scheduledTime: ''
  //     });
      
  //     alert('Request submitted successfully!');
  //   } catch (error: any) {
  //     console.error('Failed to create request:', error);
  //     setError(error.response?.data?.message || 'Failed to submit request');
  //   }
  // };

  // In your submitRequest function, add debugging:
  const submitRequest = async () => {
    try {
      console.log('Submit request clicked');
      console.log('Current booking:', currentBooking);
      console.log('New request data:', newRequest);

      if (!currentBooking) {
        setError('No active booking found');
        return;
      }

      if (!newRequest.description.trim()) {
        setError('Description is required');
        return;
      }

      setError('');
      
      // Use the current booking ID
      const requestData = {
        ...newRequest,
        bookingId: currentBooking._id // Make sure this is set
      };

      console.log('Sending request data:', requestData);

      const response = await housekeepingAPI.createRequest(requestData);
      console.log('API response:', response);
      
      setRequests([response.request, ...requests]);
      setShowRequestForm(false);
      setNewRequest({
        bookingId: '',
        type: 'cleaning',
        priority: 'medium',
        description: '',
        notes: '',
        scheduledTime: ''
      });
      
      alert('Request submitted successfully!');
    } catch (error: any) {
      console.error('Failed to create request:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const cancelRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      const cancellationReason = prompt('Please provide a reason for cancellation:');
      if (!cancellationReason) return;

      await housekeepingAPI.cancelRequest(id, cancellationReason);
      await fetchRequests(); // Refresh the list
      alert('Request cancelled successfully');
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
      alert(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'verified': 
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in-progress': 
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled': 
        return 'bg-red-100 text-red-800 border border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return '🧹';
      case 'linen': return '🛏️';
      case 'amenities': return '☕';
      case 'maintenance': return '🔧';
      default: return '📋';
    }
  };

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(req => req.status === filterStatus);

  const activeRequests = requests.filter(req => 
    !['completed', 'verified', 'cancelled'].includes(req.status)
  ).length;

  const completedRequests = requests.filter(req => 
    ['completed', 'verified'].includes(req.status)
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Service Requests</h1>
            <p className="text-gray-600 mt-2">Loading your requests...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Service Requests</h1>
          <p className="text-gray-600 mt-2">Request housekeeping and maintenance services during your stay</p>
        </div>
        {currentBooking && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
          >
            + New Request
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {!currentBooking && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">No active booking found</p>
              <p className="text-yellow-700 text-sm">You can only make service requests during an active stay.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
          <div className="text-gray-600">Total Requests</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{activeRequests}</div>
          <div className="text-gray-600">Active Requests</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{completedRequests}</div>
          <div className="text-gray-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#f06123] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
              filterStatus === 'in-progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{getRequestIcon(request.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#383a3c] capitalize">
                        {request.type} Service
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)} capitalize`}>
                        {request.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}>
                        {request.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{request.description}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>Request #: {request.requestNumber}</div>
                      <div>Property: {request.property.title}</div>
                      <div>Requested: {new Date(request.createdAt).toLocaleString()}</div>
                      {request.assignedTo && (
                        <div>Assigned to: {request.assignedTo}</div>
                      )}
                      {request.completedAt && (
                        <div>Completed: {new Date(request.completedAt).toLocaleString()}</div>
                      )}
                      {request.adminNotes && (
                        <div className="bg-gray-50 p-2 rounded-lg mt-2">
                          <strong>Admin Notes:</strong> {request.adminNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 space-y-2">
                  <div>ID: {request.requestNumber}</div>
                  <div>Est. Time: {request.estimatedDuration}m</div>
                  {request.actualDuration && (
                    <div className="text-green-600">Actual: {request.actualDuration}m</div>
                  )}
                  {request.status === 'pending' && (
                    <button
                      onClick={() => cancelRequest(request._id)}
                      className="text-red-600 hover:text-red-700 text-sm cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🧹</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? "You haven't made any service requests yet."
                : `No ${filterStatus} requests found.`
              }
            </p>
            {currentBooking && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
              >
                Make Your First Request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      {showRequestForm && currentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">New Service Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({...newRequest, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="cleaning">🧹 Cleaning Service</option>
                  <option value="linen">🛏️ Linen & Towels</option>
                  <option value="amenities">☕ Amenities Refill</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({...newRequest, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="low">Low - Whenever convenient</option>
                  <option value="medium">Medium - Today would be good</option>
                  <option value="high">High - As soon as possible</option>
                  <option value="urgent">Urgent - Immediate attention needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Please describe what you need in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <strong>Current Property:</strong> {currentBooking.property.title}<br/>
                  <strong>Booking Period:</strong> {new Date(currentBooking.checkIn).toLocaleDateString()} - {new Date(currentBooking.checkOut).toLocaleDateString()}<br/>
                  <strong>Estimated Response:</strong> Within 2 hours<br/>
                  <strong>Emergency Contact:</strong> Call +1-555-HELP for urgent issues
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRequest}
                  disabled={!newRequest.description.trim()}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








































// // app/dashboard/housekeeping/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';

// interface HousekeepingRequest {
//   id: string;
//   apartment: string;
//   unit: string;
//   type: 'cleaning' | 'linen' | 'amenities' | 'maintenance' | 'other';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   description: string;
//   requestedAt: Date;
//   status: 'pending' | 'in-progress' | 'completed' | 'verified';
//   assignedTo?: string;
//   completedAt?: Date;
//   notes?: string;
//   estimatedDuration?: number;
//   actualDuration?: number;
// }

// export default function HousekeepingPage() {
//   const [requests, setRequests] = useState<HousekeepingRequest[]>([]);
//   const [showRequestForm, setShowRequestForm] = useState(false);
//   const [filterStatus, setFilterStatus] = useState<'all' | HousekeepingRequest['status']>('all');

//   const [newRequest, setNewRequest] = useState({
//     type: 'cleaning' as HousekeepingRequest['type'],
//     priority: 'medium' as HousekeepingRequest['priority'],
//     description: '',
//     notes: ''
//   });

//   useEffect(() => {
//     // Mock data - in real app, fetch from API
//     const mockRequests: HousekeepingRequest[] = [
//       {
//         id: 'HK-001',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'cleaning',
//         priority: 'high',
//         description: 'Regular cleaning service after checkout',
//         requestedAt: new Date('2024-01-20T10:00:00'),
//         status: 'completed',
//         assignedTo: 'Clean Team A',
//         completedAt: new Date('2024-01-20T14:30:00'),
//         estimatedDuration: 120,
//         actualDuration: 110
//       },
//       {
//         id: 'HK-002',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'linen',
//         priority: 'medium',
//         description: 'Extra towel and bedding request',
//         requestedAt: new Date('2024-01-21T09:00:00'),
//         status: 'in-progress',
//         assignedTo: 'Housekeeping Staff',
//         estimatedDuration: 30
//       },
//       {
//         id: 'HK-003',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'amenities',
//         priority: 'low',
//         description: 'Coffee pod and toiletries refill needed',
//         requestedAt: new Date('2024-01-21T11:30:00'),
//         status: 'pending',
//         estimatedDuration: 15
//       },
//       {
//         id: 'HK-004',
//         apartment: 'Luxury Apartment',
//         unit: 'Unit 301',
//         type: 'maintenance',
//         priority: 'high',
//         description: 'AC unit making strange noises',
//         requestedAt: new Date('2024-01-19T16:45:00'),
//         status: 'completed',
//         assignedTo: 'Maintenance Team',
//         completedAt: new Date('2024-01-20T11:00:00'),
//         estimatedDuration: 60,
//         actualDuration: 45,
//         notes: 'Technician replaced filter and cleaned unit'
//       }
//     ];

//     setRequests(mockRequests);
//   }, []);

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
//       case 'in-progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
//       case 'verified': return 'bg-purple-100 text-purple-800 border border-purple-200';
//       case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
//       default: return 'bg-gray-100 text-gray-800 border border-gray-200';
//     }
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'urgent': return 'bg-red-100 text-red-800';
//       case 'high': return 'bg-orange-100 text-orange-800';
//       case 'medium': return 'bg-yellow-100 text-yellow-800';
//       case 'low': return 'bg-green-100 text-green-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getRequestIcon = (type: string) => {
//     switch (type) {
//       case 'cleaning': return '🧹';
//       case 'linen': return '🛏️';
//       case 'amenities': return '☕';
//       case 'maintenance': return '🔧';
//       default: return '📋';
//     }
//   };

//   const submitRequest = () => {
//     const request: HousekeepingRequest = {
//       id: `HK-${String(requests.length + 1).padStart(3, '0')}`,
//       apartment: 'Luxury Apartment', // In real app, get from user's current booking
//       unit: 'Unit 301', // In real app, get from user's current booking
//       type: newRequest.type,
//       priority: newRequest.priority,
//       description: newRequest.description,
//       requestedAt: new Date(),
//       status: 'pending',
//       notes: newRequest.notes || undefined,
//       estimatedDuration: getEstimatedDuration(newRequest.type)
//     };

//     setRequests([request, ...requests]);
//     setShowRequestForm(false);
//     setNewRequest({
//       type: 'cleaning',
//       priority: 'medium',
//       description: '',
//       notes: ''
//     });
//   };

//   const getEstimatedDuration = (type: string): number => {
//     switch (type) {
//       case 'cleaning': return 120;
//       case 'linen': return 30;
//       case 'amenities': return 15;
//       case 'maintenance': return 60;
//       default: return 30;
//     }
//   };

//   const filteredRequests = filterStatus === 'all' 
//     ? requests 
//     : requests.filter(req => req.status === filterStatus);

//   const activeRequests = requests.filter(req => req.status !== 'completed').length;
//   const completedRequests = requests.filter(req => req.status === 'completed').length;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Service Requests</h1>
//           <p className="text-gray-600 mt-2">Request housekeeping and maintenance services during your stay</p>
//         </div>
//         <button
//           onClick={() => setShowRequestForm(true)}
//           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
//         >
//           + New Request
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
//           <div className="text-gray-600">Total Requests</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-orange-600">{activeRequests}</div>
//           <div className="text-gray-600">Active Requests</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-green-600">{completedRequests}</div>
//           <div className="text-gray-600">Completed</div>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-wrap gap-4 items-center">
//           <span className="text-sm font-medium text-gray-700">Filter by status:</span>
//           <button
//             onClick={() => setFilterStatus('all')}
//             className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
//               filterStatus === 'all'
//                 ? 'bg-[#f06123] text-white'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             All
//           </button>
//           <button
//             onClick={() => setFilterStatus('pending')}
//             className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
//               filterStatus === 'pending'
//                 ? 'bg-yellow-100 text-yellow-800'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             Pending
//           </button>
//           <button
//             onClick={() => setFilterStatus('in-progress')}
//             className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
//               filterStatus === 'in-progress'
//                 ? 'bg-blue-100 text-blue-800'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             In Progress
//           </button>
//           <button
//             onClick={() => setFilterStatus('completed')}
//             className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
//               filterStatus === 'completed'
//                 ? 'bg-green-100 text-green-800'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             Completed
//           </button>
//         </div>
//       </div>

//       {/* Requests List */}
//       <div className="space-y-4">
//         {filteredRequests.length > 0 ? (
//           filteredRequests.map((request) => (
//             <div
//               key={request.id}
//               className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex items-start space-x-4">
//                   <div className="text-3xl">{getRequestIcon(request.type)}</div>
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-3 mb-2">
//                       <h3 className="text-lg font-semibold text-[#383a3c] capitalize">
//                         {request.type} Service
//                       </h3>
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)} capitalize`}>
//                         {request.priority}
//                       </span>
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)} capitalize`}>
//                         {request.status.replace('-', ' ')}
//                       </span>
//                     </div>
//                     <p className="text-gray-700 mb-2">{request.description}</p>
//                     <div className="text-sm text-gray-500 space-y-1">
//                       <div>Requested: {request.requestedAt.toLocaleString()}</div>
//                       {request.assignedTo && (
//                         <div>Assigned to: {request.assignedTo}</div>
//                       )}
//                       {request.completedAt && (
//                         <div>Completed: {request.completedAt.toLocaleString()}</div>
//                       )}
//                       {request.notes && (
//                         <div className="bg-gray-50 p-2 rounded-lg mt-2">
//                           <strong>Admin Notes:</strong> {request.notes}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right text-sm text-gray-500">
//                   <div>ID: {request.id}</div>
//                   {request.estimatedDuration && (
//                     <div>Est. Time: {request.estimatedDuration}m</div>
//                   )}
//                   {request.actualDuration && (
//                     <div className="text-green-600">Actual: {request.actualDuration}m</div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
//             <div className="text-6xl mb-4">🧹</div>
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
//             <p className="text-gray-600 mb-6">
//               {filterStatus === 'all' 
//                 ? "You haven't made any service requests yet."
//                 : `No ${filterStatus} requests found.`
//               }
//             </p>
//             <button
//               onClick={() => setShowRequestForm(true)}
//               className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
//             >
//               Make Your First Request
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Request Form Modal */}
//       {showRequestForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">New Service Request</h3>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
//                 <select
//                   value={newRequest.type}
//                   onChange={(e) => setNewRequest({...newRequest, type: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                 >
//                   <option value="cleaning">🧹 Cleaning Service</option>
//                   <option value="linen">🛏️ Linen & Towels</option>
//                   <option value="amenities">☕ Amenities Refill</option>
//                   <option value="maintenance">🔧 Maintenance</option>
//                   <option value="other">📋 Other</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
//                 <select
//                   value={newRequest.priority}
//                   onChange={(e) => setNewRequest({...newRequest, priority: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                 >
//                   <option value="low">Low - Whenever convenient</option>
//                   <option value="medium">Medium - Today would be good</option>
//                   <option value="high">High - As soon as possible</option>
//                   <option value="urgent">Urgent - Immediate attention needed</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
//                 <textarea
//                   value={newRequest.description}
//                   onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
//                   rows={4}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Please describe what you need in detail..."
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
//                 <textarea
//                   value={newRequest.notes}
//                   onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
//                   rows={2}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Any additional information..."
//                 />
//               </div>

//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <div className="text-sm text-blue-800">
//                   <strong>Current Property:</strong> Luxury Apartment - Unit 301<br/>
//                   <strong>Estimated Response:</strong> Within 2 hours<br/>
//                   <strong>Emergency Contact:</strong> Call +1-555-HELP for urgent issues
//                 </div>
//               </div>

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowRequestForm(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={submitRequest}
//                   disabled={!newRequest.description.trim()}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
//                 >
//                   Submit Request
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




