'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { propertiesAPI, amenitiesAPI } from '@/lib/api';

interface PageProps {
  params: {
    id: string;
  };
}

interface Amenity {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
}

interface Property {
  _id: string;
  title: string;
  type: string;
  price: number;
  location: string;
  description: string;
  specifications: {
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    squareFeet: number;
  };
  amenities: Amenity[];
  images: Array<{
    url: string;
    isMain: boolean;
    order: number;
  }>;
  status: string;
}

export default function EditPropertyPage({ params }: PageProps) {
  const [propertyId, setPropertyId] = useState<string>('');
  const [existingImages, setExistingImages] = useState<Array<{url: string, isMain: boolean, order: number}>>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    price: '',
    location: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    maxGuests: '',
    squareFeet: '',
    amenities: [] as string[]
  });
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Handle the async params
  useEffect(() => {
    const getParams = async () => {
      try {
        const resolvedParams = await params;
        setPropertyId(resolvedParams.id);
      } catch (err) {
        console.error('Error resolving params:', err);
        setError('Failed to load page parameters');
        setFetchLoading(false);
      }
    };
    getParams();
  }, [params]);

  // Fetch amenities on component mount
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await amenitiesAPI.getAmenities({ limit: 100 });
        setAmenities(response.amenities || []);
      } catch (error) {
        console.error('Error fetching amenities:', error);
      }
    };

    fetchAmenities();
  }, []);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setFetchLoading(true);
      setError('');
      
      const propertyData = await propertiesAPI.getPropertyById(propertyId);
      
      if (!propertyData) {
        setError('Property not found');
        return;
      }
      
      setProperty(propertyData);
      setExistingImages(propertyData.images || []);
      
      // Extract amenity IDs from the property's amenities array
      const propertyAmenityIds = propertyData.amenities?.map((amenity: Amenity) => amenity._id) || [];
      
      // Set form data with safe access
      setFormData({
        title: propertyData.title || '',
        type: propertyData.type || '',
        price: propertyData.price?.toString() || '',
        location: propertyData.location || '',
        description: propertyData.description || '',
        bedrooms: propertyData.specifications?.bedrooms?.toString() || '',
        bathrooms: propertyData.specifications?.bathrooms?.toString() || '',
        maxGuests: propertyData.specifications?.maxGuests?.toString() || '',
        squareFeet: propertyData.specifications?.squareFeet?.toString() || '',
        amenities: propertyAmenityIds
      });
      
    } catch (error: any) {
      console.error('Error fetching property:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load property data';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImageFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file, index) => {
      if (existingImages.length + newImages.length + newImageFiles.length >= 10) {
        alert('Maximum 10 images allowed');
        return;
      }

      newImageFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPreviews.push(result);
        
        if (newPreviews.length === Math.min(files.length, 10 - existingImages.length - newImages.length)) {
          setNewImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewImages(prev => [...prev, ...newImageFiles]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const moveExistingImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...existingImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setExistingImages(newImages);
  };

  const moveNewImage = (fromIndex: number, toIndex: number) => {
    const newImageFiles = [...newImages];
    const newPreviews = [...newImagePreviews];
    
    const [movedImage] = newImageFiles.splice(fromIndex, 1);
    const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
    newImageFiles.splice(toIndex, 0, movedImage);
    newPreviews.splice(toIndex, 0, movedPreview);
    
    setNewImages(newImageFiles);
    setNewImagePreviews(newPreviews);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyId) {
      alert('Property ID is missing');
      return;
    }
    
    setLoading(true);

    try {
      // Create FormData object
      const submitData = new FormData();
      
      // Append basic form data
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('price', formData.price);
      submitData.append('location', formData.location);
      submitData.append('description', formData.description);
      submitData.append('bedrooms', formData.bedrooms);
      submitData.append('bathrooms', formData.bathrooms);
      submitData.append('maxGuests', formData.maxGuests);
      submitData.append('squareFeet', formData.squareFeet);
      submitData.append('amenities', JSON.stringify(formData.amenities));

      // Append new images
      newImages.forEach((image) => {
        submitData.append('images', image);
      });

      // Update property
      const response = await propertiesAPI.updateProperty(propertyId, submitData);
      
      alert('Property updated successfully!');
      router.push('/admin/properties');
      
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert(error.response?.data?.message || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  // Group amenities by category for better organization
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

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

  // Show error state
  if (error && !fetchLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Error</h1>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Unable to load property data.</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
          <p className="text-gray-600 mt-2">Update property details and images</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Property Not Found</h1>
          <p className="text-gray-600 mt-2">The property you're looking for doesn't exist.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allImages = [...existingImages, ...newImagePreviews.map((preview, index) => ({
    url: preview,
    isMain: index === 0 && existingImages.length === 0,
    order: existingImages.length + index
  }))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
        <p className="text-gray-600 mt-2">Update property details and images</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Management Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
            {/* Current Images */}
            {allImages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Current Images ({allImages.length}/10)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      {/* Image Actions Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (index < existingImages.length) {
                                moveExistingImage(index, index - 1);
                              } else {
                                moveNewImage(index - existingImages.length, index - existingImages.length - 1);
                              }
                            }}
                            className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
                            title="Move left"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (index < existingImages.length) {
                              removeExistingImage(index);
                            } else {
                              removeNewImage(index - existingImages.length);
                            }
                          }}
                          className="p-1 bg-white rounded-full hover:bg-red-100 transition duration-200"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {index < allImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (index < existingImages.length) {
                                moveExistingImage(index, index + 1);
                              } else {
                                moveNewImage(index - existingImages.length, index - existingImages.length + 1);
                              }
                            }}
                            className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
                            title="Move right"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* Main Image Badge */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded-full text-xs font-medium">
                          Main
                        </div>
                      )}
                      {/* New Image Badge */}
                      {index >= existingImages.length && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          New
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Images */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewImageUpload}
                className="hidden"
                id="image-upload-edit"
              />
              <label htmlFor="image-upload-edit" className="cursor-pointer">
                <div className="text-4xl mb-3">➕</div>
                <p className="text-lg font-medium text-[#383a3c]">Add More Images</p>
                <p className="text-gray-500 text-sm mt-1">
                  Click to add more property images
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {allImages.length}/10 images • JPG, PNG, WebP supported
                </p>
              </label>
            </div>

            {allImages.length > 0 && (
              <p className="text-gray-500 text-sm mt-3">
                💡 The first image is the main display image. Drag images to reorder.
              </p>
            )}
          </div>

          {/* Property Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="Luxury Apartment in City Center" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                required
              >
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="studio">Studio</option>
                <option value="penthouse">Penthouse</option>
                <option value="cottage">Cottage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night ($)</label>
              <input 
                type="number" 
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="120" 
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="Victoria Island, Lagos" 
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea 
              rows={4} 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
              placeholder="Describe the property features, amenities, and nearby attractions..."
              required
            ></textarea>
          </div>

          {/* Property Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <input 
                type="number" 
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="2" 
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input 
                type="number" 
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="2" 
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
              <input 
                type="number" 
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="4" 
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
              <input 
                type="number" 
                name="squareFeet"
                value={formData.squareFeet}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
                placeholder="1200" 
                min="0"
              />
            </div>
          </div>

          {/* Dynamic Amenities Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Amenities</label>
              <span className="text-sm text-gray-500">
                {formData.amenities.length} selected
              </span>
            </div>
            
            {amenities.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-2">No amenities available</p>
                <p className="text-sm text-gray-400">
                  Add amenities in the amenities management page first
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      {categoryNames[category] || category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryAmenities.map((amenity) => (
                        <label key={amenity._id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={formData.amenities.includes(amenity._id)}
                            onChange={() => handleAmenityChange(amenity._id)}
                            className="mt-1 rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" 
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{amenity.icon || '🏠'}</span>
                              <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                            </div>
                            {amenity.description && (
                              <p className="text-xs text-gray-500 mt-1">{amenity.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Property'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



















































































// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { propertiesAPI } from '@/lib/api';

// interface PageProps {
//   params: {
//     id: string;
//   };
// }

// interface Property {
//   _id: string;
//   title: string;
//   type: string;
//   price: number;
//   location: string;
//   description: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//     squareFeet: number;
//   };
//   amenities: string[];
//   images: Array<{
//     url: string;
//     isMain: boolean;
//     order: number;
//   }>;
//   status: string;
// }

// export default function EditPropertyPage({ params }: PageProps) {
//   const [propertyId, setPropertyId] = useState<string>('');
//   const [existingImages, setExistingImages] = useState<Array<{url: string, isMain: boolean, order: number}>>([]);
//   const [newImages, setNewImages] = useState<File[]>([]);
//   const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [fetchLoading, setFetchLoading] = useState(true);
//   const [property, setProperty] = useState<Property | null>(null);
//   const [formData, setFormData] = useState({
//     title: '',
//     type: '',
//     price: '',
//     location: '',
//     description: '',
//     bedrooms: '',
//     bathrooms: '',
//     maxGuests: '',
//     squareFeet: '',
//     amenities: [] as string[]
//   });
//   const [error, setError] = useState<string>('');
//   const router = useRouter();

//   // Handle the async params
//   useEffect(() => {
//     const getParams = async () => {
//       try {
//         const resolvedParams = await params;
//         setPropertyId(resolvedParams.id);
//       } catch (err) {
//         console.error('Error resolving params:', err);
//         setError('Failed to load page parameters');
//         setFetchLoading(false);
//       }
//     };
//     getParams();
//   }, [params]);

//   useEffect(() => {
//     if (propertyId) {
//       fetchProperty();
//     }
//   }, [propertyId]);

//   const fetchProperty = async () => {
//     try {
//       setFetchLoading(true);
//       setError('');
      
//       const propertyData = await propertiesAPI.getPropertyById(propertyId);
      
//       if (!propertyData) {
//         setError('Property not found');
//         return;
//       }
      
//       setProperty(propertyData);
//       setExistingImages(propertyData.images || []);
      
//       // Set form data with safe access
//       setFormData({
//         title: propertyData.title || '',
//         type: propertyData.type || '',
//         price: propertyData.price?.toString() || '',
//         location: propertyData.location || '',
//         description: propertyData.description || '',
//         bedrooms: propertyData.specifications?.bedrooms?.toString() || '',
//         bathrooms: propertyData.specifications?.bathrooms?.toString() || '',
//         maxGuests: propertyData.specifications?.maxGuests?.toString() || '',
//         squareFeet: propertyData.specifications?.squareFeet?.toString() || '',
//         amenities: propertyData.amenities || []
//       });
      
//     } catch (error: any) {
//       console.error('Error fetching property:', error);
//       const errorMessage = error.response?.data?.message || 'Failed to load property data';
//       setError(errorMessage);
//       alert(errorMessage);
//     } finally {
//       setFetchLoading(false);
//     }
//   };

//   const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const newImageFiles: File[] = [];
//     const newPreviews: string[] = [];

//     Array.from(files).forEach((file, index) => {
//       if (existingImages.length + newImages.length + newImageFiles.length >= 10) {
//         alert('Maximum 10 images allowed');
//         return;
//       }

//       newImageFiles.push(file);
      
//       // Create preview
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const result = e.target?.result as string;
//         newPreviews.push(result);
        
//         if (newPreviews.length === Math.min(files.length, 10 - existingImages.length - newImages.length)) {
//           setNewImagePreviews(prev => [...prev, ...newPreviews]);
//         }
//       };
//       reader.readAsDataURL(file);
//     });

//     setNewImages(prev => [...prev, ...newImageFiles]);
//   };

//   const removeExistingImage = (index: number) => {
//     setExistingImages(prev => prev.filter((_, i) => i !== index));
//   };

//   const removeNewImage = (index: number) => {
//     setNewImages(prev => prev.filter((_, i) => i !== index));
//     setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const moveExistingImage = (fromIndex: number, toIndex: number) => {
//     const newImages = [...existingImages];
//     const [movedImage] = newImages.splice(fromIndex, 1);
//     newImages.splice(toIndex, 0, movedImage);
//     setExistingImages(newImages);
//   };

//   const moveNewImage = (fromIndex: number, toIndex: number) => {
//     const newImageFiles = [...newImages];
//     const newPreviews = [...newImagePreviews];
    
//     const [movedImage] = newImageFiles.splice(fromIndex, 1);
//     const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
//     newImageFiles.splice(toIndex, 0, movedImage);
//     newPreviews.splice(toIndex, 0, movedPreview);
    
//     setNewImages(newImageFiles);
//     setNewImagePreviews(newPreviews);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleAmenityChange = (amenity: string) => {
//     setFormData(prev => ({
//       ...prev,
//       amenities: prev.amenities.includes(amenity)
//         ? prev.amenities.filter(a => a !== amenity)
//         : [...prev.amenities, amenity]
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!propertyId) {
//       alert('Property ID is missing');
//       return;
//     }
    
//     setLoading(true);

//     try {
//       // Create FormData object
//       const submitData = new FormData();
      
//       // Append basic form data
//       submitData.append('title', formData.title);
//       submitData.append('type', formData.type);
//       submitData.append('price', formData.price);
//       submitData.append('location', formData.location);
//       submitData.append('description', formData.description);
//       submitData.append('bedrooms', formData.bedrooms);
//       submitData.append('bathrooms', formData.bathrooms);
//       submitData.append('maxGuests', formData.maxGuests);
//       submitData.append('squareFeet', formData.squareFeet);
//       submitData.append('amenities', JSON.stringify(formData.amenities));

//       // Append new images
//       newImages.forEach((image) => {
//         submitData.append('images', image);
//       });

//       // Update property
//       const response = await propertiesAPI.updateProperty(propertyId, submitData);
      
//       alert('Property updated successfully!');
//       router.push('/admin/properties');
      
//     } catch (error: any) {
//       console.error('Error updating property:', error);
//       alert(error.response?.data?.message || 'Failed to update property');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Show error state
//   if (error && !fetchLoading) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Error</h1>
//           <p className="text-gray-600 mt-2">{error}</p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-center">
//             <p className="text-red-600 mb-4">Unable to load property data.</p>
//             <button
//               onClick={() => router.back()}
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Go Back
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (fetchLoading) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//           <p className="text-gray-600 mt-2">Update property details and images</p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="animate-pulse">
//             <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
//             <div className="space-y-3">
//               <div className="h-4 bg-gray-200 rounded"></div>
//               <div className="h-4 bg-gray-200 rounded"></div>
//               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!property) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Property Not Found</h1>
//           <p className="text-gray-600 mt-2">The property you're looking for doesn't exist.</p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="text-center">
//             <button
//               onClick={() => router.back()}
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Go Back
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const allImages = [...existingImages, ...newImagePreviews.map((preview, index) => ({
//     url: preview,
//     isMain: index === 0 && existingImages.length === 0,
//     order: existingImages.length + index
//   }))];

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//         <p className="text-gray-600 mt-2">Update property details and images</p>
//       </div>
      
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Image Management Section */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
//             {/* Current Images */}
//             {allImages.length > 0 && (
//               <div className="mb-6">
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">
//                   Current Images ({allImages.length}/10)
//                 </h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                   {allImages.map((image, index) => (
//                     <div key={index} className="relative group">
//                       <img
//                         src={image.url}
//                         alt={`Property image ${index + 1}`}
//                         className="w-full h-24 object-cover rounded-lg"
//                       />
//                       {/* Image Actions Overlay */}
//                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
//                         {index > 0 && (
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (index < existingImages.length) {
//                                 moveExistingImage(index, index - 1);
//                               } else {
//                                 moveNewImage(index - existingImages.length, index - existingImages.length - 1);
//                               }
//                             }}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move left"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//                             </svg>
//                           </button>
//                         )}
//                         <button
//                           type="button"
//                           onClick={() => {
//                             if (index < existingImages.length) {
//                               removeExistingImage(index);
//                             } else {
//                               removeNewImage(index - existingImages.length);
//                             }
//                           }}
//                           className="p-1 bg-white rounded-full hover:bg-red-100 transition duration-200"
//                           title="Remove image"
//                         >
//                           <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                         {index < allImages.length - 1 && (
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (index < existingImages.length) {
//                                 moveExistingImage(index, index + 1);
//                               } else {
//                                 moveNewImage(index - existingImages.length, index - existingImages.length + 1);
//                               }
//                             }}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move right"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                             </svg>
//                           </button>
//                         )}
//                       </div>
//                       {/* Main Image Badge */}
//                       {index === 0 && (
//                         <div className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded-full text-xs font-medium">
//                           Main
//                         </div>
//                       )}
//                       {/* New Image Badge */}
//                       {index >= existingImages.length && (
//                         <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
//                           New
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Add More Images */}
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleNewImageUpload}
//                 className="hidden"
//                 id="image-upload-edit"
//               />
//               <label htmlFor="image-upload-edit" className="cursor-pointer">
//                 <div className="text-4xl mb-3">➕</div>
//                 <p className="text-lg font-medium text-[#383a3c]">Add More Images</p>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Click to add more property images
//                 </p>
//                 <p className="text-gray-400 text-xs mt-2">
//                   {allImages.length}/10 images • JPG, PNG, WebP supported
//                 </p>
//               </label>
//             </div>

//             {allImages.length > 0 && (
//               <p className="text-gray-500 text-sm mt-3">
//                 💡 The first image is the main display image. Drag images to reorder.
//               </p>
//             )}
//           </div>

//           {/* Property Details Form */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
//               <input 
//                 type="text" 
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Luxury Apartment in City Center" 
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
//               <select 
//                 name="type"
//                 value={formData.type}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 required
//               >
//                 <option value="apartment">Apartment</option>
//                 <option value="villa">Villa</option>
//                 <option value="studio">Studio</option>
//                 <option value="penthouse">Penthouse</option>
//                 <option value="cottage">Cottage</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night ($)</label>
//               <input 
//                 type="number" 
//                 name="price"
//                 value={formData.price}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="120" 
//                 min="1"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
//               <input 
//                 type="text" 
//                 name="location"
//                 value={formData.location}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Victoria Island, Lagos" 
//                 required
//               />
//             </div>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//             <textarea 
//               rows={4} 
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//               placeholder="Describe the property features, amenities, and nearby attractions..."
//               required
//             ></textarea>
//           </div>

//           {/* Property Specifications */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
//               <input 
//                 type="number" 
//                 name="bedrooms"
//                 value={formData.bedrooms}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
//               <input 
//                 type="number" 
//                 name="bathrooms"
//                 value={formData.bathrooms}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
//               <input 
//                 type="number" 
//                 name="maxGuests"
//                 value={formData.maxGuests}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="4" 
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
//               <input 
//                 type="number" 
//                 name="squareFeet"
//                 value={formData.squareFeet}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="1200" 
//                 min="0"
//               />
//             </div>
//           </div>

//           {/* Amenities */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//               {[
//                 'WiFi', 'Air Conditioning', 'Pool', 'Gym', 'Parking', 'Security', 
//                 'Kitchen', 'Elevator', 'Hot Tub', 'Fireplace', 'Washer', 'Dryer',
//                 'TV', 'Netflix', 'Balcony', 'Garden', 'BBQ', 'Beach Access'
//               ].map((amenity) => (
//                 <label key={amenity} className="flex items-center">
//                   <input 
//                     type="checkbox" 
//                     checked={formData.amenities.includes(amenity)}
//                     onChange={() => handleAmenityChange(amenity)}
//                     className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" 
//                   />
//                   <span className="ml-2 text-sm text-gray-700">{amenity}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button 
//               type="button" 
//               onClick={() => router.back()}
//               className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Updating...
//                 </>
//               ) : (
//                 'Update Property'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }





























































































// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { propertiesAPI } from '@/lib/api';

// interface PageProps {
//   params: {
//     id: string;
//   };
// }

// interface Property {
//   _id: string;
//   title: string;
//   type: string;
//   price: number;
//   location: string;
//   description: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//     squareFeet: number;
//   };
//   amenities: string[];
//   images: Array<{
//     url: string;
//     isMain: boolean;
//     order: number;
//   }>;
//   status: string;
// }

// export default function EditPropertyPage({ params }: PageProps) {
//   const [propertyId, setPropertyId] = useState<string>('');
//   const [existingImages, setExistingImages] = useState<Array<{url: string, isMain: boolean, order: number}>>([]);
//   const [newImages, setNewImages] = useState<File[]>([]);
//   const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [fetchLoading, setFetchLoading] = useState(true);
//   const [property, setProperty] = useState<Property | null>(null);
//   const [formData, setFormData] = useState({
//     title: '',
//     type: '',
//     price: '',
//     location: '',
//     description: '',
//     bedrooms: '',
//     bathrooms: '',
//     maxGuests: '',
//     squareFeet: '',
//     amenities: [] as string[]
//   });
//   const router = useRouter();

//   // Handle the async params
//   useEffect(() => {
//     const getParams = async () => {
//       const resolvedParams = await params;
//       setPropertyId(resolvedParams.id);
//     };
//     getParams();
//   }, [params]);

//   useEffect(() => {
//     if (propertyId) {
//       fetchProperty();
//     }
//   }, [propertyId]);

//   const fetchProperty = async () => {
//     try {
//       const propertyData = await propertiesAPI.getPropertyById(propertyId);
//       setProperty(propertyData);
//       setExistingImages(propertyData.images || []);
      
//       // Set form data
//       setFormData({
//         title: propertyData.title,
//         type: propertyData.type,
//         price: propertyData.price.toString(),
//         location: propertyData.location,
//         description: propertyData.description,
//         bedrooms: propertyData.specifications?.bedrooms?.toString() || '',
//         bathrooms: propertyData.specifications?.bathrooms?.toString() || '',
//         maxGuests: propertyData.specifications?.maxGuests?.toString() || '',
//         squareFeet: propertyData.specifications?.squareFeet?.toString() || '',
//         amenities: propertyData.amenities || []
//       });
//     } catch (error) {
//       console.error('Error fetching property:', error);
//       alert('Failed to load property data');
//     } finally {
//       setFetchLoading(false);
//     }
//   };

//   const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const newImageFiles: File[] = [];
//     const newPreviews: string[] = [];

//     Array.from(files).forEach((file, index) => {
//       if (existingImages.length + newImages.length + newImageFiles.length >= 10) {
//         alert('Maximum 10 images allowed');
//         return;
//       }

//       newImageFiles.push(file);
      
//       // Create preview
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const result = e.target?.result as string;
//         newPreviews.push(result);
        
//         if (newPreviews.length === Math.min(files.length, 10 - existingImages.length - newImages.length)) {
//           setNewImagePreviews(prev => [...prev, ...newPreviews]);
//         }
//       };
//       reader.readAsDataURL(file);
//     });

//     setNewImages(prev => [...prev, ...newImageFiles]);
//   };

//   const removeExistingImage = (index: number) => {
//     setExistingImages(prev => prev.filter((_, i) => i !== index));
//   };

//   const removeNewImage = (index: number) => {
//     setNewImages(prev => prev.filter((_, i) => i !== index));
//     setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const moveExistingImage = (fromIndex: number, toIndex: number) => {
//     const newImages = [...existingImages];
//     const [movedImage] = newImages.splice(fromIndex, 1);
//     newImages.splice(toIndex, 0, movedImage);
//     setExistingImages(newImages);
//   };

//   const moveNewImage = (fromIndex: number, toIndex: number) => {
//     const newImageFiles = [...newImages];
//     const newPreviews = [...newImagePreviews];
    
//     const [movedImage] = newImageFiles.splice(fromIndex, 1);
//     const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
//     newImageFiles.splice(toIndex, 0, movedImage);
//     newPreviews.splice(toIndex, 0, movedPreview);
    
//     setNewImages(newImageFiles);
//     setNewImagePreviews(newPreviews);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleAmenityChange = (amenity: string) => {
//     setFormData(prev => ({
//       ...prev,
//       amenities: prev.amenities.includes(amenity)
//         ? prev.amenities.filter(a => a !== amenity)
//         : [...prev.amenities, amenity]
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // Create FormData object
//       const submitData = new FormData();
      
//       // Append basic form data
//       submitData.append('title', formData.title);
//       submitData.append('type', formData.type);
//       submitData.append('price', formData.price);
//       submitData.append('location', formData.location);
//       submitData.append('description', formData.description);
//       submitData.append('bedrooms', formData.bedrooms);
//       submitData.append('bathrooms', formData.bathrooms);
//       submitData.append('maxGuests', formData.maxGuests);
//       submitData.append('squareFeet', formData.squareFeet);
//       submitData.append('amenities', JSON.stringify(formData.amenities));

//       // Append new images
//       newImages.forEach((image) => {
//         submitData.append('images', image);
//       });

//       // Update property
//       const response = await propertiesAPI.updateProperty(propertyId, submitData);
      
//       alert('Property updated successfully!');
//       router.push('/admin/properties');
      
//     } catch (error: any) {
//       console.error('Error updating property:', error);
//       alert(error.response?.data?.message || 'Failed to update property');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (fetchLoading) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//           <p className="text-gray-600 mt-2">Update property details and images</p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="animate-pulse">
//             <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
//             <div className="space-y-3">
//               <div className="h-4 bg-gray-200 rounded"></div>
//               <div className="h-4 bg-gray-200 rounded"></div>
//               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!property) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Property Not Found</h1>
//           <p className="text-gray-600 mt-2">The property you're looking for doesn't exist.</p>
//         </div>
//       </div>
//     );
//   }

//   const allImages = [...existingImages, ...newImagePreviews.map((preview, index) => ({
//     url: preview,
//     isMain: index === 0 && existingImages.length === 0,
//     order: existingImages.length + index
//   }))];

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//         <p className="text-gray-600 mt-2">Update property details and images</p>
//       </div>
      
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Image Management Section */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
//             {/* Current Images */}
//             {allImages.length > 0 && (
//               <div className="mb-6">
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">
//                   Current Images ({allImages.length}/10)
//                 </h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                   {allImages.map((image, index) => (
//                     <div key={index} className="relative group">
//                       <img
//                         src={image.url}
//                         alt={`Property image ${index + 1}`}
//                         className="w-full h-24 object-cover rounded-lg"
//                       />
//                       {/* Image Actions Overlay */}
//                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
//                         {index > 0 && (
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (index < existingImages.length) {
//                                 moveExistingImage(index, index - 1);
//                               } else {
//                                 moveNewImage(index - existingImages.length, index - existingImages.length - 1);
//                               }
//                             }}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move left"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//                             </svg>
//                           </button>
//                         )}
//                         <button
//                           type="button"
//                           onClick={() => {
//                             if (index < existingImages.length) {
//                               removeExistingImage(index);
//                             } else {
//                               removeNewImage(index - existingImages.length);
//                             }
//                           }}
//                           className="p-1 bg-white rounded-full hover:bg-red-100 transition duration-200"
//                           title="Remove image"
//                         >
//                           <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                         {index < allImages.length - 1 && (
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (index < existingImages.length) {
//                                 moveExistingImage(index, index + 1);
//                               } else {
//                                 moveNewImage(index - existingImages.length, index - existingImages.length + 1);
//                               }
//                             }}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move right"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                             </svg>
//                           </button>
//                         )}
//                       </div>
//                       {/* Main Image Badge */}
//                       {index === 0 && (
//                         <div className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded-full text-xs font-medium">
//                           Main
//                         </div>
//                       )}
//                       {/* New Image Badge */}
//                       {index >= existingImages.length && (
//                         <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
//                           New
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Add More Images */}
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleNewImageUpload}
//                 className="hidden"
//                 id="image-upload-edit"
//               />
//               <label htmlFor="image-upload-edit" className="cursor-pointer">
//                 <div className="text-4xl mb-3">➕</div>
//                 <p className="text-lg font-medium text-[#383a3c]">Add More Images</p>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Click to add more property images
//                 </p>
//                 <p className="text-gray-400 text-xs mt-2">
//                   {allImages.length}/10 images • JPG, PNG, WebP supported
//                 </p>
//               </label>
//             </div>

//             {allImages.length > 0 && (
//               <p className="text-gray-500 text-sm mt-3">
//                 💡 The first image is the main display image. Drag images to reorder.
//               </p>
//             )}
//           </div>

//           {/* Property Details Form */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
//               <input 
//                 type="text" 
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Luxury Apartment in City Center" 
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
//               <select 
//                 name="type"
//                 value={formData.type}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 required
//               >
//                 <option value="apartment">Apartment</option>
//                 <option value="villa">Villa</option>
//                 <option value="studio">Studio</option>
//                 <option value="penthouse">Penthouse</option>
//                 <option value="cottage">Cottage</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night ($)</label>
//               <input 
//                 type="number" 
//                 name="price"
//                 value={formData.price}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="120" 
//                 min="1"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
//               <input 
//                 type="text" 
//                 name="location"
//                 value={formData.location}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Victoria Island, Lagos" 
//                 required
//               />
//             </div>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//             <textarea 
//               rows={4} 
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//               placeholder="Describe the property features, amenities, and nearby attractions..."
//               required
//             ></textarea>
//           </div>

//           {/* Property Specifications */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
//               <input 
//                 type="number" 
//                 name="bedrooms"
//                 value={formData.bedrooms}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
//               <input 
//                 type="number" 
//                 name="bathrooms"
//                 value={formData.bathrooms}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
//               <input 
//                 type="number" 
//                 name="maxGuests"
//                 value={formData.maxGuests}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="4" 
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
//               <input 
//                 type="number" 
//                 name="squareFeet"
//                 value={formData.squareFeet}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="1200" 
//                 min="0"
//               />
//             </div>
//           </div>

//           {/* Amenities */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//               {[
//                 'WiFi', 'Air Conditioning', 'Pool', 'Gym', 'Parking', 'Security', 
//                 'Kitchen', 'Elevator', 'Hot Tub', 'Fireplace', 'Washer', 'Dryer',
//                 'TV', 'Netflix', 'Balcony', 'Garden', 'BBQ', 'Beach Access'
//               ].map((amenity) => (
//                 <label key={amenity} className="flex items-center">
//                   <input 
//                     type="checkbox" 
//                     checked={formData.amenities.includes(amenity)}
//                     onChange={() => handleAmenityChange(amenity)}
//                     className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" 
//                   />
//                   <span className="ml-2 text-sm text-gray-700">{amenity}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button 
//               type="button" 
//               onClick={() => router.back()}
//               className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Updating...
//                 </>
//               ) : (
//                 'Update Property'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
























































































// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { propertiesAPI } from '@/lib/api';

// interface PageProps {
//   params: {
//     id: string;
//   };
// }

// interface Property {
//   _id: string;
//   title: string;
//   type: string;
//   price: number;
//   location: string;
//   description: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//     squareFeet: number;
//   };
//   amenities: string[];
//   images: Array<{
//     url: string;
//     isMain: boolean;
//     order: number;
//   }>;
//   status: string;
// }

// export default function EditPropertyPage({ params }: PageProps) {
//   const [existingImages, setExistingImages] = useState<Array<{url: string, isMain: boolean, order: number}>>([]);
//   const [newImages, setNewImages] = useState<File[]>([]);
//   const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [fetchLoading, setFetchLoading] = useState(true);
//   const [property, setProperty] = useState<Property | null>(null);
//   const [formData, setFormData] = useState({
//     title: '',
//     type: '',
//     price: '',
//     location: '',
//     description: '',
//     bedrooms: '',
//     bathrooms: '',
//     maxGuests: '',
//     squareFeet: '',
//     amenities: [] as string[]
//   });
//   const router = useRouter();

//   useEffect(() => {
//     fetchProperty();
//   }, [params.id]);

//   const fetchProperty = async () => {
//     try {
//       const propertyData = await propertiesAPI.getPropertyById(params.id);
//       setProperty(propertyData);
//       setExistingImages(propertyData.images || []);
      
//       // Set form data
//       setFormData({
//         title: propertyData.title,
//         type: propertyData.type,
//         price: propertyData.price.toString(),
//         location: propertyData.location,
//         description: propertyData.description,
//         bedrooms: propertyData.specifications?.bedrooms?.toString() || '',
//         bathrooms: propertyData.specifications?.bathrooms?.toString() || '',
//         maxGuests: propertyData.specifications?.maxGuests?.toString() || '',
//         squareFeet: propertyData.specifications?.squareFeet?.toString() || '',
//         amenities: propertyData.amenities || []
//       });
//     } catch (error) {
//       console.error('Error fetching property:', error);
//       alert('Failed to load property data');
//     } finally {
//       setFetchLoading(false);
//     }
//   };

//   const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const newImageFiles: File[] = [];
//     const newPreviews: string[] = [];

//     Array.from(files).forEach((file, index) => {
//       if (existingImages.length + newImages.length + newImageFiles.length >= 10) {
//         alert('Maximum 10 images allowed');
//         return;
//       }

//       newImageFiles.push(file);
      
//       // Create preview
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const result = e.target?.result as string;
//         newPreviews.push(result);
        
//         if (newPreviews.length === Math.min(files.length, 10 - existingImages.length - newImages.length)) {
//           setNewImagePreviews(prev => [...prev, ...newPreviews]);
//         }
//       };
//       reader.readAsDataURL(file);
//     });

//     setNewImages(prev => [...prev, ...newImageFiles]);
//   };

//   const removeExistingImage = (index: number) => {
//     setExistingImages(prev => prev.filter((_, i) => i !== index));
//   };

//   const removeNewImage = (index: number) => {
//     setNewImages(prev => prev.filter((_, i) => i !== index));
//     setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const moveExistingImage = (fromIndex: number, toIndex: number) => {
//     const newImages = [...existingImages];
//     const [movedImage] = newImages.splice(fromIndex, 1);
//     newImages.splice(toIndex, 0, movedImage);
//     setExistingImages(newImages);
//   };

//   const moveNewImage = (fromIndex: number, toIndex: number) => {
//     const newImageFiles = [...newImages];
//     const newPreviews = [...newImagePreviews];
    
//     const [movedImage] = newImageFiles.splice(fromIndex, 1);
//     const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
//     newImageFiles.splice(toIndex, 0, movedImage);
//     newPreviews.splice(toIndex, 0, movedPreview);
    
//     setNewImages(newImageFiles);
//     setNewImagePreviews(newPreviews);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleAmenityChange = (amenity: string) => {
//     setFormData(prev => ({
//       ...prev,
//       amenities: prev.amenities.includes(amenity)
//         ? prev.amenities.filter(a => a !== amenity)
//         : [...prev.amenities, amenity]
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // Create FormData object
//       const submitData = new FormData();
      
//       // Append basic form data
//       submitData.append('title', formData.title);
//       submitData.append('type', formData.type);
//       submitData.append('price', formData.price);
//       submitData.append('location', formData.location);
//       submitData.append('description', formData.description);
//       submitData.append('bedrooms', formData.bedrooms);
//       submitData.append('bathrooms', formData.bathrooms);
//       submitData.append('maxGuests', formData.maxGuests);
//       submitData.append('squareFeet', formData.squareFeet);
//       submitData.append('amenities', JSON.stringify(formData.amenities));

//       // Append new images
//       newImages.forEach((image) => {
//         submitData.append('images', image);
//       });

//       // Update property
//       const response = await propertiesAPI.updateProperty(params.id, submitData);
      
//       alert('Property updated successfully!');
//       router.push('/admin/properties');
      
//     } catch (error: any) {
//       console.error('Error updating property:', error);
//       alert(error.response?.data?.message || 'Failed to update property');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (fetchLoading) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//           <p className="text-gray-600 mt-2">Update property details and images</p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="animate-pulse">
//             <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
//             <div className="space-y-3">
//               <div className="h-4 bg-gray-200 rounded"></div>
//               <div className="h-4 bg-gray-200 rounded"></div>
//               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!property) {
//     return (
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Property Not Found</h1>
//           <p className="text-gray-600 mt-2">The property you're looking for doesn't exist.</p>
//         </div>
//       </div>
//     );
//   }

//   const allImages = [...existingImages, ...newImagePreviews.map((preview, index) => ({
//     url: preview,
//     isMain: index === 0 && existingImages.length === 0,
//     order: existingImages.length + index
//   }))];

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//         <p className="text-gray-600 mt-2">Update property details and images</p>
//       </div>
      
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Image Management Section */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
//             {/* Current Images */}
//             {allImages.length > 0 && (
//               <div className="mb-6">
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">
//                   Current Images ({allImages.length}/10)
//                 </h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                   {allImages.map((image, index) => (
//                     <div key={index} className="relative group">
//                       <img
//                         src={image.url}
//                         alt={`Property image ${index + 1}`}
//                         className="w-full h-24 object-cover rounded-lg"
//                       />
//                       {/* Image Actions Overlay */}
//                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
//                         {index > 0 && (
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (index < existingImages.length) {
//                                 moveExistingImage(index, index - 1);
//                               } else {
//                                 moveNewImage(index - existingImages.length, index - existingImages.length - 1);
//                               }
//                             }}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move left"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//                             </svg>
//                           </button>
//                         )}
//                         <button
//                           type="button"
//                           onClick={() => {
//                             if (index < existingImages.length) {
//                               removeExistingImage(index);
//                             } else {
//                               removeNewImage(index - existingImages.length);
//                             }
//                           }}
//                           className="p-1 bg-white rounded-full hover:bg-red-100 transition duration-200"
//                           title="Remove image"
//                         >
//                           <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                         {index < allImages.length - 1 && (
//                           <button
//                             type="button"
//                             onClick={() => {
//                               if (index < existingImages.length) {
//                                 moveExistingImage(index, index + 1);
//                               } else {
//                                 moveNewImage(index - existingImages.length, index - existingImages.length + 1);
//                               }
//                             }}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move right"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                             </svg>
//                           </button>
//                         )}
//                       </div>
//                       {/* Main Image Badge */}
//                       {index === 0 && (
//                         <div className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded-full text-xs font-medium">
//                           Main
//                         </div>
//                       )}
//                       {/* New Image Badge */}
//                       {index >= existingImages.length && (
//                         <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
//                           New
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Add More Images */}
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleNewImageUpload}
//                 className="hidden"
//                 id="image-upload-edit"
//               />
//               <label htmlFor="image-upload-edit" className="cursor-pointer">
//                 <div className="text-4xl mb-3">➕</div>
//                 <p className="text-lg font-medium text-[#383a3c]">Add More Images</p>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Click to add more property images
//                 </p>
//                 <p className="text-gray-400 text-xs mt-2">
//                   {allImages.length}/10 images • JPG, PNG, WebP supported
//                 </p>
//               </label>
//             </div>

//             {allImages.length > 0 && (
//               <p className="text-gray-500 text-sm mt-3">
//                 💡 The first image is the main display image. Drag images to reorder.
//               </p>
//             )}
//           </div>

//           {/* Property Details Form */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
//               <input 
//                 type="text" 
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Luxury Apartment in City Center" 
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
//               <select 
//                 name="type"
//                 value={formData.type}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 required
//               >
//                 <option value="apartment">Apartment</option>
//                 <option value="villa">Villa</option>
//                 <option value="studio">Studio</option>
//                 <option value="penthouse">Penthouse</option>
//                 <option value="cottage">Cottage</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night ($)</label>
//               <input 
//                 type="number" 
//                 name="price"
//                 value={formData.price}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="120" 
//                 min="1"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
//               <input 
//                 type="text" 
//                 name="location"
//                 value={formData.location}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Victoria Island, Lagos" 
//                 required
//               />
//             </div>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//             <textarea 
//               rows={4} 
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//               placeholder="Describe the property features, amenities, and nearby attractions..."
//               required
//             ></textarea>
//           </div>

//           {/* Property Specifications */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
//               <input 
//                 type="number" 
//                 name="bedrooms"
//                 value={formData.bedrooms}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
//               <input 
//                 type="number" 
//                 name="bathrooms"
//                 value={formData.bathrooms}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
//               <input 
//                 type="number" 
//                 name="maxGuests"
//                 value={formData.maxGuests}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="4" 
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
//               <input 
//                 type="number" 
//                 name="squareFeet"
//                 value={formData.squareFeet}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="1200" 
//                 min="0"
//               />
//             </div>
//           </div>

//           {/* Amenities */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//               {[
//                 'WiFi', 'Air Conditioning', 'Pool', 'Gym', 'Parking', 'Security', 
//                 'Kitchen', 'Elevator', 'Hot Tub', 'Fireplace', 'Washer', 'Dryer',
//                 'TV', 'Netflix', 'Balcony', 'Garden', 'BBQ', 'Beach Access'
//               ].map((amenity) => (
//                 <label key={amenity} className="flex items-center">
//                   <input 
//                     type="checkbox" 
//                     checked={formData.amenities.includes(amenity)}
//                     onChange={() => handleAmenityChange(amenity)}
//                     className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" 
//                   />
//                   <span className="ml-2 text-sm text-gray-700">{amenity}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button 
//               type="button" 
//               onClick={() => router.back()}
//               className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Updating...
//                 </>
//               ) : (
//                 'Update Property'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }




































































// 'use client';

// import { useState } from 'react';

// interface PageProps {
//   params: {
//     id: string;
//   };
// }

// export default function EditPropertyPage({ params }: PageProps) {
//   const [images, setImages] = useState<string[]>([
//     "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
//     "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
//     "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"
//   ]);

//   // Mock data - in real app, fetch by ID
//   const property = {
//     id: parseInt(params.id),
//     title: "Luxury Apartment in City Center",
//     type: "apartment",
//     price: 120,
//     location: "Victoria Island, Lagos",
//     description: "This luxurious apartment in the heart of the city offers stunning views, modern amenities, and easy access to all major attractions.",
//     bedrooms: 2,
//     bathrooms: 2,
//     guests: 4,
//     amenities: ["WiFi", "Air Conditioning", "Pool", "Gym"],
//     status: "active"
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const newImages: string[] = [];
//     const fileReaders: FileReader[] = [];

//     Array.from(files).forEach((file, index) => {
//       if (images.length + newImages.length >= 10) {
//         alert('Maximum 10 images allowed');
//         return;
//       }

//       const fileReader = new FileReader();
//       fileReaders.push(fileReader);

//       fileReader.onload = (e) => {
//         const result = e.target?.result as string;
//         newImages.push(result);
        
//         if (newImages.length === Math.min(files.length, 10 - images.length)) {
//           setImages(prev => [...prev, ...newImages]);
//         }
//       };

//       fileReader.readAsDataURL(file);
//     });
//   };

//   const removeImage = (index: number) => {
//     setImages(prev => prev.filter((_, i) => i !== index));
//   };

//   const moveImage = (fromIndex: number, toIndex: number) => {
//     const newImages = [...images];
//     const [movedImage] = newImages.splice(fromIndex, 1);
//     newImages.splice(toIndex, 0, movedImage);
//     setImages(newImages);
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Edit Property</h1>
//         <p className="text-gray-600 mt-2">Update property details and images</p>
//       </div>
      
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <form className="space-y-6">
//           {/* Image Management Section */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
//             {/* Current Images */}
//             {images.length > 0 && (
//               <div className="mb-6">
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">
//                   Current Images ({images.length}/10)
//                 </h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                   {images.map((image, index) => (
//                     <div key={index} className="relative group">
//                       <img
//                         src={image}
//                         alt={`Property image ${index + 1}`}
//                         className="w-full h-24 object-cover rounded-lg"
//                       />
//                       {/* Image Actions Overlay */}
//                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
//                         {index > 0 && (
//                           <button
//                             type="button"
//                             onClick={() => moveImage(index, index - 1)}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move left"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//                             </svg>
//                           </button>
//                         )}
//                         <button
//                           type="button"
//                           onClick={() => removeImage(index)}
//                           className="p-1 bg-white rounded-full hover:bg-red-100 transition duration-200"
//                           title="Remove image"
//                         >
//                           <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                         {index < images.length - 1 && (
//                           <button
//                             type="button"
//                             onClick={() => moveImage(index, index + 1)}
//                             className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
//                             title="Move right"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                             </svg>
//                           </button>
//                         )}
//                       </div>
//                       {/* Main Image Badge */}
//                       {index === 0 && (
//                         <div className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded-full text-xs font-medium">
//                           Main
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Add More Images */}
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//                 id="image-upload-edit"
//               />
//               <label htmlFor="image-upload-edit" className="cursor-pointer">
//                 <div className="text-4xl mb-3">➕</div>
//                 <p className="text-lg font-medium text-[#383a3c]">Add More Images</p>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Click to add more property images
//                 </p>
//                 <p className="text-gray-400 text-xs mt-2">
//                   {images.length}/10 images • JPG, PNG, WebP supported
//                 </p>
//               </label>
//             </div>

//             {images.length > 0 && (
//               <p className="text-gray-500 text-sm mt-3">
//                 💡 The first image is the main display image. Drag images to reorder.
//               </p>
//             )}
//           </div>

//           {/* Rest of the form remains the same as before */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
//               <input 
//                 type="text" 
//                 defaultValue={property.title}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
//               <select 
//                 defaultValue={property.type}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//               >
//                 <option value="apartment">Apartment</option>
//                 <option value="villa">Villa</option>
//                 <option value="studio">Studio</option>
//                 <option value="penthouse">Penthouse</option>
//                 <option value="cottage">Cottage</option>
//               </select>
//             </div>
//             {/* ... other form fields ... */}
//           </div>
          
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button type="button" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
//               Cancel
//             </button>
//             <button type="submit" className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600">
//               Update Property
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

