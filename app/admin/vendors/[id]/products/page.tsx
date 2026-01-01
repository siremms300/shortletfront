// app/vendors/[id]/products/page.tsx
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
  images: Array<{ url: string }>;
  isAvailable: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  preparationTime: number;
  tags: string[];
  createdAt: string;
}

interface Vendor {
  _id: string;
  businessName: string;
}

export default function VendorProductsPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorId) {
      fetchVendorAndProducts();
    }
  }, [vendorId]);

  const fetchVendorAndProducts = async () => {
    try {
      setLoading(true);
      const [vendorResponse, productsResponse] = await Promise.all([
        vendorAPI.getVendorById(vendorId),
        vendorAPI.getVendorProducts(vendorId, { availableOnly: false })
      ]);

      setVendor(vendorResponse);
      setProducts(productsResponse.products || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch vendor data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      await vendorAPI.toggleProductAvailability(productId);
      alert(`Product ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchVendorAndProducts(); // Refresh the list
    } catch (error: any) {
      alert(error.message || 'Failed to update product availability');
    }
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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">Vendor not found</div>
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
          <h1 className="text-3xl font-bold text-[#383a3c]">{vendor.businessName} - Products</h1>
          <p className="text-gray-600 mt-2">Manage products for this vendor</p>
        </div>
        <div className="flex space-x-4">
          <Link
            // href={`/admin/vendor-products/${vendorId}/products/new`}
            href={`/admin/vendor-products/new`}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Product
          </Link>
          <Link
            href="/admin/vendors"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
          >
            Back to Vendors
          </Link>
        </div>
      </div>

      {/* Error Message */}
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
              onClick={fetchVendorAndProducts}
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className={`bg-white rounded-2xl shadow-sm border-2 transition duration-200 ${
              product.isAvailable ? 'border-gray-200 hover:shadow-md' : 'border-red-200 opacity-75'
            }`}
          >
            {/* Product Image */}
            <div className="relative">
              <img
                src={getImageUrl(product.images[0]?.url)}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-2xl flex items-center justify-center">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Unavailable
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 bg-[#f06123] text-white px-2 py-1 rounded-lg text-sm font-semibold">
                ₦{product.price.toLocaleString()}
              </div>
              <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs font-medium capitalize">
                {formatCategory(product.category)}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-[#383a3c] text-lg mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span className={product.stockQuantity === 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {product.stockQuantity} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Order Limits:</span>
                  <span>Min {product.minOrderQuantity}, Max {product.maxOrderQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prep Time:</span>
                  <span>{product.preparationTime} mins</span>
                </div>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      +{product.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleToggleAvailability(product._id, product.isAvailable)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    product.isAvailable
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {product.isAvailable ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex space-x-2">
                  <Link
                    href={`/admin/vendors/${vendorId}/products/${product._id}/edit`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">Get started by adding the first product for this vendor.</p>
          <Link
            // href={`/admin/vendor-products/${vendorId}/products/new`}
            href={`/admin/vendor-products/new`}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
          >
            Add First Product
          </Link>
        </div>
      )}
    </div>
  );
}
