// components/admin/operational/MaintenanceTracker.tsx
'use client';

import { useState, useEffect } from 'react';
import { maintenanceAPI } from '@/lib/api';
import { propertiesAPI } from '@/lib/api';
import { vendorAPI } from '@/lib/api';

interface MaintenanceIssue {
  _id: string;
  issueNumber: string;
  apartment: string;
  unit: string;
  category: 'plumbing' | 'electrical' | 'appliance' | 'furniture' | 'structural' | 'hvac' | 'pest-control' | 'safety' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  reportedBy: string;
  reportedByUser?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reportedAt: string;
  status: 'reported' | 'assigned' | 'in-progress' | 'completed' | 'verified' | 'reopened';
  assignedTo?: string;
  assignedToVendor?: {
    _id: string;
    name: string;
    specialty: string[];
    contact: string;
    email: string;
    rating: number;
  };
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  scheduledDate?: string;
  completedAt?: string;
  verifiedAt?: string;
  notes?: string;
  images?: string[];
  warranty?: boolean;
  nextMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  _id: string;
  title: string;
  type: string;
  location: string;
  specifications: {
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    squareFeet: number;
  };
  status: string;
}

interface Vendor {
  _id: string;
  vendorNumber: string;
  name: string;
  specialty: string[];
  contact: string;
  email: string;
  rating: number;
  responseTime: string;
  address?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceStats {
  totalIssues: number;
  activeIssues: number;
  urgentIssues: number;
  completedThisMonth: number;
  totalCost: number;
  pendingCost: number;
  categoryStats: Array<{
    _id: string;
    count: number;
    totalCost: number;
  }>;
  priorityStats: Array<{
    _id: string;
    count: number;
  }>;
}

export default function MaintenanceTracker() {
  const [issues, setIssues] = useState<MaintenanceIssue[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReportSidebar, setShowReportSidebar] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newIssue, setNewIssue] = useState({
    apartment: '',
    unit: '',
    category: 'plumbing' as MaintenanceIssue['category'],
    priority: 'medium' as MaintenanceIssue['priority'],
    description: '',
    assignedTo: '',
    estimatedCost: 0,
    estimatedDuration: 0,
    vendor: '',
    warranty: false
  });

  const [newVendor, setNewVendor] = useState({
    name: '',
    specialty: [] as string[],
    contact: '',
    email: '',
    rating: 5,
    responseTime: '',
    address: '',
    website: '',
    notes: ''
  });

  const [costUpdate, setCostUpdate] = useState({
    actualCost: 0,
    notes: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [issuesResponse, vendorsResponse, statsResponse, propertiesResponse] = await Promise.all([
        maintenanceAPI.getIssues(),
        maintenanceAPI.getVendors(),
        maintenanceAPI.getStats(),
        propertiesAPI.getProperties({ limit: 100 }) // Get all properties for dropdown
      ]);
      
      setIssues(issuesResponse.issues || []);
      setVendors(vendorsResponse.vendors || []);
      setProperties(propertiesResponse.properties || []);
      setStats(statsResponse.stats);
    } catch (error: any) {
      console.error('Failed to fetch maintenance data:', error);
      setError(error.response?.data?.message || 'Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  // Vendor management functions
  const handleAddVendor = async () => {
    try {
      if (!newVendor.name || !newVendor.contact || !newVendor.email || !newVendor.responseTime || newVendor.specialty.length === 0) {
        setError('Name, contact, email, response time, and at least one specialty are required');
        return;
      }

      const response = await maintenanceAPI.createVendor(newVendor);
      
      setVendors(prev => [...prev, response.vendor]);
      setShowAddVendorModal(false);
      setNewVendor({
        name: '',
        specialty: [],
        contact: '',
        email: '',
        rating: 5,
        responseTime: '',
        address: '',
        website: '',
        notes: ''
      });
      
      alert('Vendor added successfully!');
    } catch (error: any) {
      console.error('Failed to add vendor:', error);
      setError(error.response?.data?.message || 'Failed to add vendor');
    }
  };

  const handleRemoveVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to remove this vendor?')) return;

    try {
      await maintenanceAPI.deleteVendor(vendorId);
      setVendors(prev => prev.filter(vendor => vendor._id !== vendorId));
      alert('Vendor removed successfully!');
    } catch (error: any) {
      console.error('Failed to remove vendor:', error);
      alert(error.response?.data?.message || 'Failed to remove vendor');
    }
  };

  const toggleVendorSpecialty = (specialty: string) => {
    setNewVendor(prev => ({
      ...prev,
      specialty: prev.specialty.includes(specialty)
        ? prev.specialty.filter(s => s !== specialty)
        : [...prev.specialty, specialty]
    }));
  };

  // Issue management functions
  const handleReportIssue = async () => {
    try {
      if (!newIssue.apartment || !newIssue.unit || !newIssue.description) {
        setError('Apartment, unit, and description are required');
        return;
      }

      const issueData = {
        apartment: newIssue.apartment,
        unit: newIssue.unit,
        category: newIssue.category,
        priority: newIssue.priority,
        description: newIssue.description,
        assignedTo: newIssue.assignedTo,
        estimatedCost: newIssue.estimatedCost || 0,
        estimatedDuration: newIssue.estimatedDuration || 0,
        vendor: newIssue.vendor,
        warranty: newIssue.warranty
      };

      const response = await maintenanceAPI.createIssue(issueData);
      
      setIssues(prev => [response.issue, ...prev]);
      setShowReportSidebar(false);
      setNewIssue({
        apartment: '',
        unit: '',
        category: 'plumbing',
        priority: 'medium',
        description: '',
        assignedTo: '',
        estimatedCost: 0,
        estimatedDuration: 0,
        vendor: '',
        warranty: false
      });
      
      await fetchData(); // Refresh stats
      alert('Issue reported successfully!');
    } catch (error: any) {
      console.error('Failed to report issue:', error);
      setError(error.response?.data?.message || 'Failed to report issue');
    }
  };

  const updateIssueStatus = async (id: string, status: MaintenanceIssue['status']) => {
    try {
      await maintenanceAPI.updateIssueStatus(id, { status });
      await fetchData(); // Refresh data
      alert('Issue status updated successfully!');
    } catch (error: any) {
      console.error('Failed to update issue status:', error);
      setError(error.response?.data?.message || 'Failed to update issue status');
    }
  };

  const assignVendor = async (id: string, vendorName: string) => {
    try {
      if (!vendorName) return;
      
      await maintenanceAPI.updateIssue(id, { vendor: vendorName });
      await fetchData(); // Refresh data
      alert('Vendor assigned successfully!');
    } catch (error: any) {
      console.error('Failed to assign vendor:', error);
      setError(error.response?.data?.message || 'Failed to assign vendor');
    }
  };

  const updateCosts = async (id: string, actualCost: number, notes: string) => {
    try {
      await maintenanceAPI.updateIssue(id, { actualCost, notes: notes || '' });
      await fetchData(); // Refresh data
      setCostUpdate({ actualCost: 0, notes: '' });
      alert('Costs updated successfully!');
    } catch (error: any) {
      console.error('Failed to update costs:', error);
      setError(error.response?.data?.message || 'Failed to update costs');
    }
  };

  const deleteIssue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance issue?')) return;

    try {
      await maintenanceAPI.deleteIssue(id);
      await fetchData(); // Refresh data
      alert('Issue deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete issue:', error);
      alert(error.response?.data?.message || 'Failed to delete issue');
    }
  };

  const reopenIssue = async (id: string) => {
    try {
      await maintenanceAPI.updateIssueStatus(id, { status: 'reopened' });
      await fetchData(); // Refresh data
      alert('Issue reopened successfully!');
    } catch (error: any) {
      console.error('Failed to reopen issue:', error);
      setError(error.response?.data?.message || 'Failed to reopen issue');
    }
  };

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      case 'reopened': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing': return '🚰';
      case 'electrical': return '⚡';
      case 'appliance': return '🔌';
      case 'furniture': return '🛋️';
      case 'structural': return '🏗️';
      case 'hvac': return '❄️';
      case 'pest-control': return '🐛';
      case 'safety': return '🛡️';
      default: return '🔧';
    }
  };

  // Filter and calculate statistics
  const filteredIssues = issues
    .filter(issue => 
      (filterStatus === 'all' || issue.status === filterStatus) &&
      (filterPriority === 'all' || issue.priority === filterPriority) &&
      (filterCategory === 'all' || issue.category === filterCategory) &&
      (issue.apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
       issue.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
       issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       issue.issueNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const vendorSpecialties = [
    'plumbing', 'electrical', 'hvac', 'appliance', 'furniture', 
    'structural', 'pest-control', 'safety', 'cleaning', 'painting'
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#383a3c]">Maintenance Tracker</h2>
            <p className="text-gray-600">Loading maintenance data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading maintenance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#383a3c]">Maintenance Tracker</h2>
          <p className="text-gray-600">Track and manage property maintenance issues and vendors</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowVendorsModal(true)}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer"
          >
            📋 Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setShowReportSidebar(true)}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
          >
            + Report Issue
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
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Stats Overview */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.totalIssues}</div>
              <div className="text-gray-600">Total Issues</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.activeIssues}</div>
              <div className="text-gray-600">Active Issues</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.urgentIssues}</div>
              <div className="text-gray-600">Urgent Priority</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">${(stats.totalCost + stats.pendingCost).toFixed(2)}</div>
              <div className="text-gray-600">Total Cost (Est.)</div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="text-green-800 font-semibold">Actual Costs</div>
              <div className="text-2xl font-bold text-green-600">${stats.totalCost.toFixed(2)}</div>
              <div className="text-green-700 text-sm">Spent this month</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="text-yellow-800 font-semibold">Pending Costs</div>
              <div className="text-2xl font-bold text-yellow-600">${stats.pendingCost.toFixed(2)}</div>
              <div className="text-yellow-700 text-sm">Estimated pending</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="text-blue-800 font-semibold">Vendors Available</div>
              <div className="text-2xl font-bold text-blue-600">{vendors.length}</div>
              <div className="text-blue-700 text-sm">Active vendors</div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions & Alerts */}
      {stats && stats.urgentIssues > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-orange-600 text-lg">⚠️</div>
              <div>
                <h4 className="font-semibold text-orange-800">Urgent Issues Alert</h4>
                <p className="text-orange-700 text-sm">
                  {stats.urgentIssues} urgent issue{stats.urgentIssues > 1 ? 's' : ''} require{stats.urgentIssues === 1 ? 's' : ''} immediate attention
                </p>
              </div>
            </div>
            <button 
              onClick={() => setFilterPriority('urgent')}
              className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-200 cursor-pointer"
            >
              View Urgent Issues
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by property, unit, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="reported">Reported</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="verified">Verified</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="appliance">Appliance</option>
            <option value="furniture">Furniture</option>
            <option value="structural">Structural</option>
            <option value="hvac">HVAC</option>
            <option value="pest-control">Pest Control</option>
            <option value="safety">Safety</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={fetchData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilterPriority('urgent')}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 cursor-pointer"
          >
            🔴 Show Urgent
          </button>
          <button
            onClick={() => setFilterStatus('reported')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 cursor-pointer"
          >
            ⏳ Unassigned
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 cursor-pointer"
          >
            🔧 In Progress
          </button>
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterPriority('all');
              setFilterCategory('all');
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Maintenance Issues Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#383a3c]">
            {filteredIssues.length} Issues
            {(filterCategory !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && ' (Filtered)'}
          </h3>
          <div className="text-sm text-gray-500">
            Showing {filteredIssues.length} of {issues.length} total issues
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredIssues.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div 
                          className="font-medium text-[#383a3c] cursor-pointer hover:text-[#f06123]"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowDetailsModal(true);
                          }}
                        >
                          {issue.issueNumber}
                        </div>
                        <div className="text-gray-900 font-semibold">{issue.apartment} - {issue.unit}</div>
                        <div className="text-gray-600 text-sm mt-1 line-clamp-2">{issue.description}</div>
                        <div className="text-gray-400 text-xs mt-1">Reported by: {issue.reportedBy}</div>
                        {issue.assignedToVendor && (
                          <div className="text-blue-600 text-xs mt-1">Vendor: {issue.assignedToVendor.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                        <span className="text-sm text-gray-900 capitalize">{issue.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)} capitalize`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)} capitalize`}>
                        {issue.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {issue.actualCost ? (
                          <div className="text-green-600 font-semibold">${issue.actualCost}</div>
                        ) : issue.estimatedCost ? (
                          <div className="text-yellow-600">Est. ${issue.estimatedCost}</div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>Reported: {new Date(issue.reportedAt).toLocaleDateString()}</div>
                        {issue.completedAt && (
                          <div className="text-green-600">Completed: {new Date(issue.completedAt).toLocaleDateString()}</div>
                        )}
                        {issue.scheduledDate && (
                          <div className="text-blue-600">Scheduled: {new Date(issue.scheduledDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        {issue.status === 'reported' && (
                          <>
                            <button
                              onClick={() => updateIssueStatus(issue._id, 'assigned')}
                              className="text-blue-600 hover:text-blue-700 cursor-pointer text-left text-sm"
                            >
                              Assign
                            </button>
                            <select
                              onChange={(e) => assignVendor(issue._id, e.target.value)}
                              className="text-xs border rounded px-2 py-1 cursor-pointer"
                              defaultValue=""
                            >
                              <option value="">Assign Vendor</option>
                              {vendors.map(vendor => (
                                <option key={vendor._id} value={vendor.name}>
                                  {vendor.name}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        {issue.status === 'assigned' && (
                          <button
                            onClick={() => updateIssueStatus(issue._id, 'in-progress')}
                            className="text-yellow-600 hover:text-yellow-700 cursor-pointer text-left text-sm"
                          >
                            Start Work
                          </button>
                        )}
                        {issue.status === 'in-progress' && (
                          <button
                            onClick={() => updateIssueStatus(issue._id, 'completed')}
                            className="text-green-600 hover:text-green-700 cursor-pointer text-left text-sm"
                          >
                            Mark Complete
                          </button>
                        )}
                        {issue.status === 'completed' && (
                          <button
                            onClick={() => updateIssueStatus(issue._id, 'verified')}
                            className="text-purple-600 hover:text-purple-700 cursor-pointer text-left text-sm"
                          >
                            Verify
                          </button>
                        )}
                        {(issue.status === 'completed' || issue.status === 'verified') && (
                          <button
                            onClick={() => reopenIssue(issue._id)}
                            className="text-orange-600 hover:text-orange-700 cursor-pointer text-left text-sm"
                          >
                            Reopen
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowDetailsModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-700 cursor-pointer text-left text-sm"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => deleteIssue(issue._id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer text-left text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance issues</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by reporting a new maintenance issue.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowReportSidebar(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f06123]"
                >
                  + Report Issue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Issue Sidebar - Updated with Real Properties */}
      {showReportSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Report Maintenance Issue</h3>
                <button
                  onClick={() => setShowReportSidebar(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newIssue.apartment}
                    onChange={(e) => setNewIssue({...newIssue, apartment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property._id} value={property.title}>
                        {property.title} - {property.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit/Area *</label>
                  <input
                    type="text"
                    value={newIssue.unit}
                    onChange={(e) => setNewIssue({...newIssue, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Enter unit number or specific area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newIssue.category}
                    onChange={(e) => setNewIssue({...newIssue, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="appliance">Appliance</option>
                    <option value="furniture">Furniture</option>
                    <option value="structural">Structural</option>
                    <option value="hvac">HVAC</option>
                    <option value="pest-control">Pest Control</option>
                    <option value="safety">Safety</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue({...newIssue, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Describe the maintenance issue in detail..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newIssue.estimatedCost}
                      onChange={(e) => setNewIssue({...newIssue, estimatedCost: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration (hrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newIssue.estimatedDuration}
                      onChange={(e) => setNewIssue({...newIssue, estimatedDuration: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Vendor</label>
                  <select
                    value={newIssue.vendor}
                    onChange={(e) => setNewIssue({...newIssue, vendor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor.name}>
                        {vendor.name} ({vendor.specialty[0]})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newIssue.warranty}
                    onChange={(e) => setNewIssue({...newIssue, warranty: e.target.checked})}
                    className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                  />
                  <label className="ml-2 text-sm text-gray-700">Covered by warranty</label>
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowReportSidebar(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportIssue}
                    className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendors Modal */}
      {showVendorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Maintenance Vendors ({vendors.length})</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddVendorModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 cursor-pointer"
                >
                  + Add Vendor
                </button>
                <button
                  onClick={() => setShowVendorsModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {vendors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No Vendors Added</h4>
                <p className="text-gray-500 mb-6">Get started by adding your first maintenance vendor</p>
                <button
                  onClick={() => setShowAddVendorModal(true)}
                  className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  + Add First Vendor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                  <div key={vendor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          ⭐ {vendor.rating}
                        </div>
                        <button
                          onClick={() => handleRemoveVendor(vendor._id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                          title="Remove Vendor"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Specialty:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vendor.specialty.map(spec => (
                            <span key={spec} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs capitalize">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response:</span>
                        <span className="text-blue-600">{vendor.responseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="text-gray-900">{vendor.contact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900">{vendor.email}</span>
                      </div>
                      {vendor.address && (
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <div className="text-gray-900 text-xs mt-1">{vendor.address}</div>
                        </div>
                      )}
                      {vendor.website && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Website:</span>
                          <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {vendor.website}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <a 
                        href={`tel:${vendor.contact}`}
                        className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 cursor-pointer text-center"
                      >
                        Contact
                      </a>
                      <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-50 cursor-pointer">
                        History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => setShowVendorsModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add New Vendor</h3>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    value={newVendor.contact}
                    onChange={(e) => setNewVendor({...newVendor, contact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="+1-555-0101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="vendor@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Time *</label>
                  <select
                    value={newVendor.responseTime}
                    onChange={(e) => setNewVendor({...newVendor, responseTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="">Select response time</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="4 hours">4 hours</option>
                    <option value="8 hours">8 hours</option>
                    <option value="24 hours">24 hours</option>
                    <option value="48 hours">48 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialties *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {vendorSpecialties.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newVendor.specialty.includes(specialty)}
                        onChange={() => toggleVendorSpecialty(specialty)}
                        className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 capitalize">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={newVendor.rating}
                    onChange={(e) => setNewVendor({...newVendor, rating: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="5">5 ⭐ - Excellent</option>
                    <option value="4.5">4.5 ⭐ - Very Good</option>
                    <option value="4">4 ⭐ - Good</option>
                    <option value="3.5">3.5 ⭐ - Average</option>
                    <option value="3">3 ⭐ - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="text"
                    value={newVendor.website}
                    onChange={(e) => setNewVendor({...newVendor, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="www.example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({...newVendor, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Full business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({...newVendor, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Additional notes about this vendor..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddVendorModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVendor}
                  disabled={!newVendor.name || !newVendor.contact || !newVendor.email || !newVendor.responseTime || newVendor.specialty.length === 0}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Add Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {showDetailsModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Maintenance Issue - {selectedIssue.issueNumber}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Issue Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property:</span>
                      <span className="font-medium">{selectedIssue.apartment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium">{selectedIssue.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{selectedIssue.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`font-medium ${getPriorityColor(selectedIssue.priority)} px-2 py-1 rounded-full text-xs`}>
                        {selectedIssue.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${getStatusColor(selectedIssue.status)} px-2 py-1 rounded-full text-xs`}>
                        {selectedIssue.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedIssue.description}</p>
                </div>

                {selectedIssue.assignedToVendor && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Assigned Vendor</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="font-medium">{selectedIssue.assignedToVendor.name}</div>
                      <div className="text-sm text-gray-600">{selectedIssue.assignedToVendor.contact}</div>
                      <div className="text-sm text-gray-600">{selectedIssue.assignedToVendor.email}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedIssue.assignedToVendor.specialty.map(spec => (
                          <span key={spec} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs capitalize">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cost Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Cost:</span>
                      <span className="font-medium">
                        {selectedIssue.estimatedCost ? `$${selectedIssue.estimatedCost}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Cost:</span>
                      <span className="font-medium text-green-600">
                        {selectedIssue.actualCost ? `$${selectedIssue.actualCost}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Warranty:</span>
                      <span className="font-medium">
                        {selectedIssue.warranty ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reported:</span>
                      <span className="font-medium">{new Date(selectedIssue.reportedAt).toLocaleString()}</span>
                    </div>
                    {selectedIssue.scheduledDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled:</span>
                        <span className="font-medium text-blue-600">
                          {new Date(selectedIssue.scheduledDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedIssue.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">
                          {new Date(selectedIssue.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedIssue.verifiedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verified:</span>
                        <span className="font-medium text-purple-600">
                          {new Date(selectedIssue.verifiedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedIssue.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedIssue.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
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