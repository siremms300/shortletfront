'use client';

import { useState, useEffect } from 'react';
import { amenitiesAPI } from '@/lib/api';
import BulkImportAmenities from '@/components/BulkImportAmenities';

interface Amenity {
  _id: string;
  name: string;
  description?: string;
  // icon: string;
  icon?: string; // Make icon optional
  category: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // icon: '🏠',
     icon: '', // Start with empty string
    category: 'general'
  });

  // Fetch amenities
  const fetchAmenities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await amenitiesAPI.getAmenities({ limit: 100 });
      setAmenities(response.amenities || []);
    } catch (err: any) {
      console.error('Error fetching amenities:', err);
      setError('Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      // icon: '🏠',
      icon: '', // Reset to empty string
      category: 'general'
    });
    setEditingAmenity(null);
  };

  // Create or update amenity
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     setError('');

  //     if (editingAmenity) {
  //       // Update existing amenity
  //       await amenitiesAPI.updateAmenity(editingAmenity._id, formData);
  //     } else {
  //       // Create new amenity
  //       await amenitiesAPI.createAmenity(formData);
  //     }

  //     // Refresh amenities and close modal
  //     await fetchAmenities();
  //     setShowAddModal(false);
  //     resetForm();
  //   } catch (err: any) {
  //     console.error('Error saving amenity:', err);
  //     setError(err.response?.data?.message || 'Failed to save amenity');
  //   }
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     setError('');

  //     // Prepare the data
  //     const submitData = {
  //       name: formData.name.trim(),
  //       description: formData.description.trim() || undefined,
  //       icon: formData.icon.trim() || undefined,
  //       category: formData.category
  //     };

  //     console.log('Submitting amenity data:', submitData);

  //     if (editingAmenity) {
  //       await amenitiesAPI.updateAmenity(editingAmenity._id, submitData);
  //     } else {
  //       await amenitiesAPI.createAmenity(submitData);
  //     }

  //     await fetchAmenities();
  //     setShowAddModal(false);
  //     resetForm();
  //   } catch (err: any) {
  //     console.error('Full error object:', err);
  //     console.error('Error response data:', err.response?.data);
  //     console.error('Error response status:', err.response?.status);
      
  //     // Get the actual error message from the backend
  //     const errorMessage = err.response?.data?.message || 
  //                         err.response?.data?.error || 
  //                         'Failed to save amenity';
      
  //     setError(errorMessage);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Amenity name is required');
        return;
      }

      // Prepare amenity data (NO images needed for amenities!)
      const amenityData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        category: formData.category
      };

      console.log('Creating amenity with data:', amenityData);

      if (editingAmenity) {
        // Update existing amenity
        await amenitiesAPI.updateAmenity(editingAmenity._id, amenityData);
      } else {
        // Create new amenity - this should NOT require images!
        await amenitiesAPI.createAmenity(amenityData);
      }

      // Refresh amenities and close modal
      await fetchAmenities();
      setShowAddModal(false);
      resetForm();
      
    } catch (err: any) {
      console.error('Error saving amenity:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 'Failed to save amenity';
      setError(errorMessage);
    }
  };

  // Edit amenity
  const handleEdit = (amenity: Amenity) => {
    setFormData({
      name: amenity.name,
      description: amenity.description || '',
      icon: amenity.icon,
      category: amenity.category
    });
    setEditingAmenity(amenity);
    setShowAddModal(true);
  };

  // Delete amenity
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this amenity?')) {
      return;
    }

    try {
      await amenitiesAPI.deleteAmenity(id);
      await fetchAmenities();
    } catch (err: any) {
      console.error('Error deleting amenity:', err);
      setError('Failed to delete amenity');
    }
  };

  // Category display names
  const categoryNames: { [key: string]: string } = {
    general: 'General',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    bedroom: 'Bedroom',
    entertainment: 'Entertainment',
    safety: 'Safety',
    accessibility: 'Accessibility',
    outdoor: 'Outdoor'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Amenities</h1>
          <p className="text-gray-600 mt-2">Manage property amenities</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
        >
          Add Amenity
        </button>
      </div> */}

      {/* // In the header section of AmenitiesPage, add this button next to "Add Amenity" */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Amenities</h1>
          <p className="text-gray-600 mt-2">Manage property amenities</p>
        </div>
        <div className="flex space-x-4">
          <BulkImportAmenities />
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
          >
            Add Amenity
          </button>
        </div>
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

      {/* Amenities Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {amenities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No amenities found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first amenity</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
            >
              Add First Amenity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map((amenity) => (
              <div 
                key={amenity._id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition duration-200 ${
                  amenity.isActive 
                    ? 'border-gray-200 bg-white hover:shadow-md' 
                    : 'border-gray-100 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{amenity.icon}</span>
                  <div>
                    <h3 className="font-medium text-[#383a3c]">{amenity.name}</h3>
                    <p className="text-sm text-gray-500">{categoryNames[amenity.category]}</p>
                    {amenity.description && (
                      <p className="text-xs text-gray-400 mt-1">{amenity.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(amenity)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(amenity._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Amenity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#383a3c]">
                  {editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="e.g., Swimming Pool"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Brief description of the amenity..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="e.g., 🏊‍♂️"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  >
                    {Object.entries(categoryNames).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
                  >
                    {editingAmenity ? 'Update Amenity' : 'Create Amenity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


