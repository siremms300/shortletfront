// app/admin/vendors/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendorAPI } from '@/lib/api';

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
  notes?: string;
}

const availableServices = [
  'food_delivery',
  'housekeeping',
  'concierge',
  'maintenance',
  'supplies'
];

const paymentTermsOptions = ['weekly', 'bi-weekly', 'monthly'];

export default function EditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    contactPerson: {
      name: '',
      email: '',
      phone: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    services: [] as string[],
    operatingHours: {
      open: '09:00',
      close: '17:00',
      timezone: 'Africa/Lagos'
    },
    commissionRate: 15,
    paymentTerms: 'bi-weekly',
    status: 'active',
    notes: ''
  });
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
      setFormData({
        businessName: response.businessName,
        description: response.description,
        contactPerson: response.contactPerson,
        address: response.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        services: response.services,
        operatingHours: response.operatingHours,
        commissionRate: response.commissionRate,
        paymentTerms: response.paymentTerms,
        status: response.status,
        notes: response.notes || ''
      });
    } catch (error: any) {
      setError(error.message || 'Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactPerson.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [field]: value
        }
      }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else if (name.startsWith('operatingHours.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError('');

      await vendorAPI.updateVendor(vendorId, formData);
      
      alert('Vendor updated successfully!');
      router.push(`/admin/vendors/${vendorId}`);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update vendor');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Edit Vendor</h1>
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
            <h1 className="text-3xl font-bold text-[#383a3c]">Edit Vendor</h1>
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
          <h1 className="text-3xl font-bold text-[#383a3c]">Edit Vendor</h1>
          <p className="text-gray-600 mt-2">Update vendor information</p>
        </div>
        <button
          onClick={() => router.push(`/admin/vendors/${vendorId}`)}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
        >
          Cancel
        </button>
      </div>

      {/* Error Message */}
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Business Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
              <input
                type="number"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              >
                {paymentTermsOptions.map(term => (
                  <option key={term} value={term}>
                    {term.charAt(0).toUpperCase() + term.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Contact Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Name *</label>
              <input
                type="text"
                name="contactPerson.name"
                value={formData.contactPerson.name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="contactPerson.email"
                value={formData.contactPerson.email}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                name="contactPerson.phone"
                value={formData.contactPerson.phone}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
              <div className="space-y-2">
                {availableServices.map(service => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]"
                    />
                    <span className="ml-2 text-gray-700 capitalize">
                      {service.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Operating Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Open Time</label>
              <input
                type="time"
                name="operatingHours.open"
                value={formData.operatingHours.open}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Close Time</label>
              <input
                type="time"
                name="operatingHours.close"
                value={formData.operatingHours.close}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                name="operatingHours.timezone"
                value={formData.operatingHours.timezone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              >
                <option value="Africa/Lagos">West Africa Time (WAT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Address (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
            placeholder="Additional notes about this vendor..."
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={updating}
            className="bg-[#f06123] text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating Vendor...
              </>
            ) : (
              'Update Vendor'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}