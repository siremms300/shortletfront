// app/admin/vendor-products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendorAPI } from '@/lib/api';

interface Vendor {
  _id: string;
  businessName: string;
}

interface VendorProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: Array<{ url: string }>;
  vendor: {
    _id: string;
    businessName: string;
  };
  isAvailable: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  preparationTime: number;
  tags: string[];
}

export default function EditVendorProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'food',
    price: '',
    stockQuantity: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '10',
    preparationTime: '30',
    tags: '',
    vendorId: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const productId = params.id as string;
  const categories = [
    { value: 'food', label: 'Food' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'essentials', label: 'Essentials' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchData();
  }, [productId]);

  // const fetchData = async () => {
  //   try {
  //     setLoading(true);
  //     const [productResponse, vendorsResponse] = await Promise.all([
  //       vendorAPI.getAvailableProducts().then(res => 
  //         res.products?.find((p: any) => p._id === productId) || null
  //       ),
  //       vendorAPI.getVendors({ status: 'active' })
  //     ]);

  //     if (!productResponse) {
  //       setError('Product not found');
  //       return;
  //     }

  //     setProduct(productResponse);
  //     setVendors(vendorsResponse.vendors || []);
  //     setFormData({
  //       name: productResponse.name,
  //       description: productResponse.description,
  //       category: productResponse.category,
  //       price: productResponse.price.toString(),
  //       stockQuantity: productResponse.stockQuantity.toString(),
  //       minOrderQuantity: productResponse.minOrderQuantity.toString(),
  //       maxOrderQuantity: productResponse.maxOrderQuantity.toString(),
  //       preparationTime: productResponse.preparationTime.toString(),
  //       tags: productResponse.tags.join(', '),
  //       vendorId: productResponse.vendor._id
  //     });
  //     setExistingImages(productResponse.images.map(img => img.url));

  //   } catch (error: any) {
  //     setError(error.message || 'Failed to fetch data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [productResponse, vendorsResponse] = await Promise.all([
          vendorAPI.getAvailableProducts().then(res => 
            res.products?.find((p: any) => p._id === productId) || null
          ),
          vendorAPI.getVendors({ status: 'active' })
        ]);

        if (!productResponse) {
          setError('Product not found');
          return;
        }

        setProduct(productResponse);
        setVendors(vendorsResponse.vendors || []);
        setFormData({
          name: productResponse.name,
          description: productResponse.description,
          category: productResponse.category,
          price: productResponse.price.toString(),
          stockQuantity: productResponse.stockQuantity.toString(),
          minOrderQuantity: productResponse.minOrderQuantity.toString(),
          maxOrderQuantity: productResponse.maxOrderQuantity.toString(),
          preparationTime: productResponse.preparationTime.toString(),
          tags: productResponse.tags.join(', '),
          vendorId: productResponse.vendor._id
        });
        setExistingImages(productResponse.images.map((img: any) => img.url)); // Fix here

      } catch (error: any) {
        setError(error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) {
      setError('Please select a vendor');
      return;
    }

    try {
      setUpdating(true);
      setError('');

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price);
      submitData.append('stockQuantity', formData.stockQuantity);
      submitData.append('minOrderQuantity', formData.minOrderQuantity);
      submitData.append('maxOrderQuantity', formData.maxOrderQuantity);
      submitData.append('preparationTime', formData.preparationTime);
      submitData.append('tags', formData.tags);
      submitData.append('vendorId', formData.vendorId);

      images.forEach((image, index) => {
        submitData.append('images', image);
      });

      await vendorAPI.updateProduct(productId, submitData);
      
      alert('Product updated successfully!');
      router.push('/admin/vendor-products');
      
    } catch (error: any) {
      setError(error.message || 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/default-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Edit Product</h1>
            <p className="text-gray-600 mt-2">Loading product details...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">Product not found</div>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/vendor-products')}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
          >
            Back to Products
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
          <h1 className="text-3xl font-bold text-[#383a3c]">Edit Product</h1>
          <p className="text-gray-600 mt-2">Update product information</p>
        </div>
        <button
          onClick={() => router.back()}
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
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
              <select
                name="vendorId"
                value={formData.vendorId}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              >
                <option value="">Select a vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor._id}>{vendor.businessName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#383a3c]">Pricing & Inventory</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (₦) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Order Quantity</label>
                <input
                  type="number"
                  name="minOrderQuantity"
                  value={formData.minOrderQuantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Order Quantity</label>
                <input
                  type="number"
                  name="maxOrderQuantity"
                  value={formData.maxOrderQuantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Time (minutes)</label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
              />
            </div>

            {/* Image Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={getImageUrl(image)}
                          alt={`Product ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#f06123] text-white text-xs px-1 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
                >
                  Add More Images
                </label>
                <p className="text-gray-500 text-sm mt-2">Upload additional images</p>
              </div>

              {/* New Image Previews */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">New Images:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`New ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                Updating Product...
              </>
            ) : (
              'Update Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}





