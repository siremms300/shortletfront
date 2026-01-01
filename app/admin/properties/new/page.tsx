'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { propertiesAPI, amenitiesAPI } from '@/lib/api';

interface Amenity {
  _id: string;
  name: string;
  icon: string;
  category: string;
  description?: string;
}

export default function NewPropertyPage() {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
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
  const router = useRouter();

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file, index) => {
      if (images.length + newImages.length >= 10) {
        alert('Maximum 10 images allowed');
        return;
      }

      newImages.push(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPreviews.push(result);
        
        if (newPreviews.length === Math.min(files.length, 10 - images.length)) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    const [movedImage] = newImages.splice(fromIndex, 1);
    const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
    newImages.splice(toIndex, 0, movedImage);
    newPreviews.splice(toIndex, 0, movedPreview);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
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
    setLoading(true);

    try {
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

      // Append images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      const response = await propertiesAPI.createProperty(submitData);
      
      alert('Property created successfully!');
      router.push('/admin/properties');
      
    } catch (error: any) {
      console.error('Error creating property:', error);
      alert(error.response?.data?.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  // Group amenities by category
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Add New Property</h1>
        <p className="text-gray-600 mt-2">Create a new property listing</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section - Same as before */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-lg font-medium text-[#383a3c]">Upload Property Images</p>
                <p className="text-gray-500 text-sm mt-1">
                  Drag and drop images here or click to browse
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Maximum 10 images • JPG, PNG, WebP supported
                </p>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Uploaded Images ({imagePreviews.length}/10)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imagePreviews.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, index - 1)}
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
                          onClick={() => removeImage(index)}
                          className="p-1 bg-white rounded-full hover:bg-red-100 transition duration-200"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {index < imagePreviews.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, index + 1)}
                            className="p-1 bg-white rounded-full hover:bg-gray-100 transition duration-200"
                            title="Move right"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded-full text-xs font-medium">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="text-gray-500 text-sm mt-3">
                  💡 The first image will be used as the main display image. Drag images to reorder.
                </p>
              </div>
            )}
          </div>

          {/* Property Details Form - Same as before */}
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
                <option value="">Select type</option>
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

          {/* Property Specifications - Same as before */}
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
                              <span className="text-lg">{amenity.icon}</span>
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
              disabled={loading || images.length === 0}
              className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Property'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





























































// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { propertiesAPI } from '@/lib/api';

// export default function NewPropertyPage() {
//   const [images, setImages] = useState<File[]>([]);
//   const [imagePreviews, setImagePreviews] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
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

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const newImages: File[] = [];
//     const newPreviews: string[] = [];

//     // Process each selected file
//     Array.from(files).forEach((file, index) => {
//       if (images.length + newImages.length >= 10) {
//         alert('Maximum 10 images allowed');
//         return;
//       }

//       newImages.push(file);
      
//       // Create preview
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const result = e.target?.result as string;
//         newPreviews.push(result);
        
//         if (newPreviews.length === Math.min(files.length, 10 - images.length)) {
//           setImagePreviews(prev => [...prev, ...newPreviews]);
//         }
//       };
//       reader.readAsDataURL(file);
//     });

//     setImages(prev => [...prev, ...newImages]);
//   };

//   const removeImage = (index: number) => {
//     setImages(prev => prev.filter((_, i) => i !== index));
//     setImagePreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const moveImage = (fromIndex: number, toIndex: number) => {
//     const newImages = [...images];
//     const newPreviews = [...imagePreviews];
    
//     const [movedImage] = newImages.splice(fromIndex, 1);
//     const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
//     newImages.splice(toIndex, 0, movedImage);
//     newPreviews.splice(toIndex, 0, movedPreview);
    
//     setImages(newImages);
//     setImagePreviews(newPreviews);
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
//     e.preventDefault(); // Prevent default form submission
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

//       // Append images
//       images.forEach((image) => {
//         submitData.append('images', image);
//       });

//       // Make API call
//       const response = await propertiesAPI.createProperty(submitData);
      
//       alert('Property created successfully!');
//       router.push('/admin/properties'); // Redirect to properties list
      
//     } catch (error: any) {
//       console.error('Error creating property:', error);
//       alert(error.response?.data?.message || 'Failed to create property');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Add New Property</h1>
//         <p className="text-gray-600 mt-2">Create a new property listing</p>
//       </div>
      
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Image Upload Section */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
//             {/* Image Upload Area */}
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//                 id="image-upload"
//               />
//               <label htmlFor="image-upload" className="cursor-pointer">
//                 <div className="text-4xl mb-3">📸</div>
//                 <p className="text-lg font-medium text-[#383a3c]">Upload Property Images</p>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Drag and drop images here or click to browse
//                 </p>
//                 <p className="text-gray-400 text-xs mt-2">
//                   Maximum 10 images • JPG, PNG, WebP supported
//                 </p>
//               </label>
//             </div>

//             {/* Image Preview Grid */}
//             {imagePreviews.length > 0 && (
//               <div className="mt-6">
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">
//                   Uploaded Images ({imagePreviews.length}/10)
//                 </h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                   {imagePreviews.map((image, index) => (
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
//                         {index < imagePreviews.length - 1 && (
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
                
//                 {/* Image Order Instructions */}
//                 <p className="text-gray-500 text-sm mt-3">
//                   💡 The first image will be used as the main display image. Drag images to reorder.
//                 </p>
//               </div>
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
//                 <option value="">Select type</option>
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
//               disabled={loading || images.length === 0}
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Creating...
//                 </>
//               ) : (
//                 'Create Property'
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

// export default function NewPropertyPage() {
//   const [images, setImages] = useState<string[]>([]);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const newImages: string[] = [];
//     const fileReaders: FileReader[] = [];

//     // Process each selected file
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
        
//         // When all files are processed, update state
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
//         <h1 className="text-3xl font-bold text-[#383a3c]">Add New Property</h1>
//         <p className="text-gray-600 mt-2">Create a new property listing</p>
//       </div>
      
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <form className="space-y-6">
//           {/* Image Upload Section */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-4">Property Images</label>
            
//             {/* Image Upload Area */}
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f06123] transition duration-200">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//                 id="image-upload"
//               />
//               <label htmlFor="image-upload" className="cursor-pointer">
//                 <div className="text-4xl mb-3">📸</div>
//                 <p className="text-lg font-medium text-[#383a3c]">Upload Property Images</p>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Drag and drop images here or click to browse
//                 </p>
//                 <p className="text-gray-400 text-xs mt-2">
//                   Maximum 10 images • JPG, PNG, WebP supported
//                 </p>
//               </label>
//             </div>

//             {/* Image Preview Grid */}
//             {images.length > 0 && (
//               <div className="mt-6">
//                 <h4 className="text-sm font-medium text-gray-700 mb-3">
//                   Uploaded Images ({images.length}/10)
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
                
//                 {/* Image Order Instructions */}
//                 <p className="text-gray-500 text-sm mt-3">
//                   💡 The first image will be used as the main display image. Drag images to reorder.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Property Details Form */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Title</label>
//               <input 
//                 type="text" 
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="Luxury Apartment in City Center" 
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
//               <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]">
//                 <option value="">Select type</option>
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
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
//               <input 
//                 type="number" 
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="2" 
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
//               <input 
//                 type="number" 
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]" 
//                 placeholder="4" 
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
//               <input 
//                 type="number" 
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
//                     className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123]" 
//                   />
//                   <span className="ml-2 text-sm text-gray-700">{amenity}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button type="button" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={images.length === 0}
//             >
//               Create Property
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

