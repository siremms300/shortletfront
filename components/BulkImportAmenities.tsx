'use client';

import { useState } from 'react';
import { amenitiesAPI } from '@/lib/api';

const defaultAmenities = [
  { name: 'WiFi', icon: '📶', category: 'general', description: 'High-speed internet access' },
  { name: 'Air Conditioning', icon: '❄️', category: 'general', description: 'Climate control system' },
  { name: 'Swimming Pool', icon: '🏊‍♂️', category: 'outdoor', description: 'Private or shared swimming pool' },
  { name: 'Gym', icon: '💪', category: 'general', description: 'Fitness equipment and space' },
  { name: 'Parking', icon: '🅿️', category: 'general', description: 'Car parking space' },
  { name: 'Security', icon: '🔒', category: 'safety', description: '24/7 security services' },
  { name: 'Kitchen', icon: '👨‍🍳', category: 'kitchen', description: 'Fully equipped kitchen' },
  { name: 'Elevator', icon: '🛗', category: 'accessibility', description: 'Building elevator access' },
  { name: 'Hot Tub', icon: '♨️', category: 'outdoor', description: 'Jacuzzi or hot tub' },
  { name: 'Fireplace', icon: '🔥', category: 'general', description: 'Indoor fireplace' },
  { name: 'Washer', icon: '🧼', category: 'general', description: 'Washing machine' },
  { name: 'Dryer', icon: '👕', category: 'general', description: 'Clothes dryer' },
  { name: 'TV', icon: '📺', category: 'entertainment', description: 'Television with cable' },
  { name: 'Netflix', icon: '🎬', category: 'entertainment', description: 'Streaming services' },
  { name: 'Balcony', icon: '🌅', category: 'outdoor', description: 'Private balcony' },
  { name: 'Garden', icon: '🌳', category: 'outdoor', description: 'Garden or yard space' },
  { name: 'BBQ', icon: '🍖', category: 'outdoor', description: 'Barbecue grill' },
  { name: 'Beach Access', icon: '🏖️', category: 'outdoor', description: 'Direct beach access' }
];

export default function BulkImportAmenities() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBulkImport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await amenitiesAPI.bulkCreateAmenities(defaultAmenities);
      
      setSuccess(`Successfully imported ${response.amenities?.length || 0} amenities`);
      setShowModal(false);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setError(err.response?.data?.message || 'Failed to import amenities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
      >
        Bulk Import
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#383a3c]">Bulk Import Amenities</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-700">{success}</span>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Amenities to be imported:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {defaultAmenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span>{amenity.icon}</span>
                      <span>{amenity.name}</span>
                      <span className="text-gray-500 text-xs">({amenity.category})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    'Import All Amenities'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

