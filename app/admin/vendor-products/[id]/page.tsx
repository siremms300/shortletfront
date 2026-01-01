// app/admin/vendor-products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendorAPI } from '@/lib/api';
import Link from 'next/link';

interface VendorProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: Array<{ url: string; isMain: boolean }>;
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
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct getProductById endpoint, we'll fetch all and filter
      const response = await vendorAPI.getAvailableProducts();
      const foundProduct = response.products?.find((p: any) => p._id === productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError('Product not found');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!product) return;

    try {
      await vendorAPI.toggleProductAvailability(productId);
      setProduct({ ...product, isAvailable: !product.isAvailable });
      alert(`Product ${!product.isAvailable ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      alert(error.message || 'Failed to update product availability');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
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
            <h1 className="text-3xl font-bold text-[#383a3c]">Product Details</h1>
            <p className="text-gray-600 mt-2">Loading product information...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Product Details</h1>
            <p className="text-gray-600 mt-2">Product not found</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">
            {error || 'Product not found'}
          </div>
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

  const mainImage = product.images.find(img => img.isMain) || product.images[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">{product.name}</h1>
          <p className="text-gray-600 mt-2">Product details and information</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleToggleAvailability}
            className={`${
              product.isAvailable 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-2 rounded-lg font-semibold transition duration-200`}
          >
            {product.isAvailable ? 'Deactivate' : 'Activate'}
          </button>
          <Link
            href={`/admin/vendor-products/${product._id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Edit Product
          </Link>
          <button
            onClick={() => router.push('/admin/vendor-products')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Product Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {product.images.length > 0 ? (
                product.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={getImageUrl(image.url)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {image.isMain && (
                      <span className="absolute top-2 left-2 bg-[#f06123] text-white px-2 py-1 rounded text-xs">
                        Main
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Product Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-medium">₦{product.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${
                  product.isAvailable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {product.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Quantity</span>
                <span className="font-medium">{product.stockQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Preparation Time</span>
                <span className="font-medium">{product.preparationTime} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Limits</span>
                <span className="font-medium">
                  {product.minOrderQuantity} - {product.maxOrderQuantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold">
                {product.vendor.businessName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-[#383a3c]">{product.vendor.businessName}</div>
                <Link
                  href={`/admin/vendors/${product.vendor._id}`}
                  className="text-[#f06123] hover:text-orange-600 text-sm"
                >
                  View Vendor
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/admin/vendor-products/${product._id}/edit`}
                className="w-full bg-[#f06123] text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-center block"
              >
                Edit Product
              </Link>
              <Link
                href={`/admin/vendor-products?vendor=${product.vendor._id}`}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 text-center block"
              >
                View Vendor Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}