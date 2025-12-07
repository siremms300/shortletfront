// app/admin/vendors/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendorAPI } from '@/lib/api';
import Link from 'next/link';

interface Vendor {
  _id: string;
  businessName: string;
  description: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  services: string[];
  operatingHours: {
    open: string;
    close: string;
    timezone: string;
  };
  commissionRate: number;
  paymentTerms: string;
  status: string;
  rating: number;
  totalOrders: number;
  createdAt: string;
  notes?: string;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const vendorId = params.id as string;

  useEffect(() => {
    if (vendorId) {
      fetchVendor();
    }
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getVendorById(vendorId);
      setVendor(response);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!vendor) return;

    try {
      await vendorAPI.updateVendorStatus(vendorId, newStatus);
      setVendor({ ...vendor, status: newStatus });
      alert('Vendor status updated successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to update vendor status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Details</h1>
            <p className="text-gray-600 mt-2">Loading vendor information...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading vendor details...</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Details</h1>
            <p className="text-gray-600 mt-2">Vendor not found</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">
            {error || 'Vendor not found'}
          </div>
          <p className="text-gray-600 mb-4">The vendor you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/vendors')}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">{vendor.businessName}</h1>
          <p className="text-gray-600 mt-2">Vendor details and information</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/vendor-products?vendor=${vendor._id}`}
            className="border border-[#f06123] text-[#f06123] px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition duration-200"
          >
            View Products
          </Link>
          <Link
            href={`/admin/vendors/${vendor._id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Edit Vendor
          </Link>
          <button
            onClick={() => router.push('/admin/vendors')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <p className="text-gray-900">{vendor.businessName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={vendor.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(vendor.status)} border-0 focus:ring-1 focus:ring-[#f06123] cursor-pointer`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{vendor.description}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <p className="text-gray-900">{vendor.contactPerson.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{vendor.contactPerson.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{vendor.contactPerson.phone}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {vendor.address && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.address.street && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <p className="text-gray-900">{vendor.address.street}</p>
                  </div>
                )}
                {vendor.address.city && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <p className="text-gray-900">{vendor.address.city}</p>
                  </div>
                )}
                {vendor.address.state && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <p className="text-gray-900">{vendor.address.state}</p>
                  </div>
                )}
                {vendor.address.zipCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <p className="text-gray-900">{vendor.address.zipCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Services</h2>
            <div className="flex flex-wrap gap-2">
              {vendor.services.map((service, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {service.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          {vendor.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Notes</h2>
              <p className="text-gray-900">{vendor.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Operating Hours */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Operating Hours</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Open</span>
                <span className="font-medium">{formatTime(vendor.operatingHours.open)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Close</span>
                <span className="font-medium">{formatTime(vendor.operatingHours.close)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timezone</span>
                <span className="font-medium">{vendor.operatingHours.timezone}</span>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Business Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Rate</span>
                <span className="font-medium">{vendor.commissionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Terms</span>
                <span className="font-medium capitalize">{vendor.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-medium">{vendor.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating</span>
                <span className="font-medium">{vendor.rating || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joined</span>
                <span className="font-medium">{formatDate(vendor.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/admin/vendor-products/new?vendor=${vendor._id}`}
                className="w-full bg-[#f06123] text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-center block"
              >
                Add Product
              </Link>
              <Link
                href={`/admin/vendor-orders?vendor=${vendor._id}`}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 text-center block"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}