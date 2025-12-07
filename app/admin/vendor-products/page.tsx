// app/admin/vendor-products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { vendorAPI } from '@/lib/api';

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
  createdAt: string;
}

interface Vendor {
  _id: string;
  businessName: string;
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['food', 'beverages', 'essentials', 'amenities', 'concierge', 'other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, vendorsResponse] = await Promise.all([
        vendorAPI.getAvailableProducts({ availableOnly: false }), // Get all products including unavailable
        vendorAPI.getVendors()
      ]);
      
      console.log('Products response:', productsResponse);
      console.log('Vendors response:', vendorsResponse);
      
      setProducts(productsResponse.products || productsResponse || []);
      setVendors(vendorsResponse.vendors || vendorsResponse || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      await vendorAPI.toggleProductAvailability(productId);
      // Update local state
      setProducts(products.map(product => 
        product._id === productId 
          ? { ...product, isAvailable: !currentStatus }
          : product
      ));
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to update product');
    }
  };

  const filteredProducts = products.filter(product => {
    if (selectedVendor && product.vendor?._id !== selectedVendor) return false;
    if (selectedCategory && product.category !== selectedCategory) return false;
    return true;
  });

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getImageUrl = (images: Array<{ url: string }> | undefined) => {
    if (!images || images.length === 0 || !images[0]?.url) {
      return '/default-product.jpg';
    }
    
    const imagePath = images[0].url;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${baseUrl}${imagePath}`;
    }
    return imagePath;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Products</h1>
            <p className="text-gray-600 mt-2">Manage all vendor products</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Products</h1>
          <p className="text-gray-600 mt-2">Manage all vendor products</p>
        </div>
        <Link
          href="/admin/vendor-products/new"
          className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> Loaded {products.length} products, {vendors.length} vendors
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>{vendor.businessName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{formatCategory(category)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedVendor('');
                setSelectedCategory('');
              }}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
            >
              Clear Filters
            </button>
          </div>
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
              onClick={fetchData}
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#383a3c]">
            {filteredProducts.length} Products
            {selectedVendor && ` for ${vendors.find(v => v._id === selectedVendor)?.businessName}`}
          </h3>
          <button
            onClick={fetchData}
            className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          {filteredProducts.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={getImageUrl(product.images)}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-product.jpg';
                          }}
                        />
                        <div>
                          <div className="font-medium text-[#383a3c]">{product.name}</div>
                          <div className="text-gray-500 text-sm line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.vendor?.businessName || 'Unknown Vendor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stockQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link 
                        href={`/admin/vendor-products/${product._id}`}
                        className="text-[#f06123] hover:text-orange-600"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/admin/vendor-products/${product._id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleToggleAvailability(product._id, product.isAvailable)}
                        className={`${
                          product.isAvailable 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {product.isAvailable ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-gray-500">
                {selectedVendor || selectedCategory 
                  ? 'No products match your current filters.' 
                  : 'No products have been added yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








































// // app/admin/vendor-products/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { vendorAPI } from '@/lib/api';

// interface VendorProduct {
//   _id: string;
//   name: string;
//   description: string;
//   category: string;
//   price: number;
//   images: Array<{ url: string }>;
//   vendor: {
//     _id: string;
//     businessName: string;
//   };
//   isAvailable: boolean;
//   stockQuantity: number;
//   minOrderQuantity: number;
//   maxOrderQuantity: number;
//   preparationTime: number;
//   tags: string[];
//   createdAt: string;
// }

// interface Vendor {
//   _id: string;
//   businessName: string;
// }

// export default function VendorProductsPage() {
//   const [products, setProducts] = useState<VendorProduct[]>([]);
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [selectedVendor, setSelectedVendor] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('');

//   const categories = ['food', 'beverages', 'essentials', 'amenities', 'concierge', 'other'];

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const [productsResponse, vendorsResponse] = await Promise.all([
//         vendorAPI.getAvailableProducts(),
//         vendorAPI.getVendors()
//       ]);
//       setProducts(productsResponse.products || []);
//       setVendors(vendorsResponse.vendors || []);
//     } catch (error: any) {
//       setError(error.message || 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
//     try {
//       await vendorAPI.toggleProductAvailability(productId);
//       setProducts(products.map(product => 
//         product._id === productId 
//           ? { ...product, isAvailable: !currentStatus }
//           : product
//       ));
//     } catch (error: any) {
//       alert(error.message || 'Failed to update product');
//     }
//   };

//   const filteredProducts = products.filter(product => {
//     if (selectedVendor && product.vendor._id !== selectedVendor) return false;
//     if (selectedCategory && product.category !== selectedCategory) return false;
//     return true;
//   });

//   const formatCategory = (category: string) => {
//     return category.charAt(0).toUpperCase() + category.slice(1);
//   };

//   const getImageUrl = (imagePath: string) => {
//     if (!imagePath) return '/default-product.jpg';
//     if (imagePath.startsWith('http')) return imagePath;
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//     return `${baseUrl}${imagePath}`;
//   };

//   if (loading) {
//     return (
//       <div className="space-y-8">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Products</h1>
//             <p className="text-gray-600 mt-2">Manage all vendor products</p>
//           </div>
//         </div>
//         <div className="flex items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//           <span className="ml-3 text-gray-600">Loading products...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">Vendor Products</h1>
//           <p className="text-gray-600 mt-2">Manage all vendor products</p>
//         </div>
//         <Link
//           href="/admin/vendor-products/new"
//           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center"
//         >
//           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//           </svg>
//           Add Product
//         </Link>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Vendor</label>
//             <select
//               value={selectedVendor}
//               onChange={(e) => setSelectedVendor(e.target.value)}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
//             >
//               <option value="">All Vendors</option>
//               {vendors.map(vendor => (
//                 <option key={vendor._id} value={vendor._id}>{vendor.businessName}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
//             <select
//               value={selectedCategory}
//               onChange={(e) => setSelectedCategory(e.target.value)}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123]"
//             >
//               <option value="">All Categories</option>
//               {categories.map(category => (
//                 <option key={category} value={category}>{formatCategory(category)}</option>
//               ))}
//             </select>
//           </div>
//           <div className="flex items-end">
//             <button
//               onClick={() => {
//                 setSelectedVendor('');
//                 setSelectedCategory('');
//               }}
//               className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
//             >
//               Clear Filters
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <span className="text-red-700">{error}</span>
//             </div>
//             <button
//               onClick={fetchData}
//               className="text-red-700 hover:text-red-800 font-medium"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Products Grid */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//           <h3 className="text-lg font-semibold text-[#383a3c]">
//             {filteredProducts.length} Products
//           </h3>
//           <button
//             onClick={fetchData}
//             className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
//           >
//             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredProducts.map((product) => (
//                 <tr key={product._id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <img
//                         src={getImageUrl(product.images[0]?.url)}
//                         alt={product.name}
//                         className="w-10 h-10 rounded-lg object-cover mr-3"
//                       />
//                       <div>
//                         <div className="font-medium text-[#383a3c]">{product.name}</div>
//                         <div className="text-gray-500 text-sm line-clamp-1">{product.description}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {product.vendor.businessName}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
//                     {product.category}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     ₦{product.price.toLocaleString()}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {product.stockQuantity}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       product.isAvailable 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-red-100 text-red-800'
//                     }`}>
//                       {product.isAvailable ? 'Available' : 'Unavailable'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                     <Link 
//                       href={`/admin/vendor-products/${product._id}`}
//                       className="text-[#f06123] hover:text-orange-600"
//                     >
//                       View
//                     </Link>
//                     <Link 
//                       href={`/admin/vendor-products/${product._id}/edit`}
//                       className="text-blue-600 hover:text-blue-700"
//                     >
//                       Edit
//                     </Link>
//                     <button 
//                       onClick={() => handleToggleAvailability(product._id, product.isAvailable)}
//                       className={`${
//                         product.isAvailable 
//                           ? 'text-red-600 hover:text-red-700' 
//                           : 'text-green-600 hover:text-green-700'
//                       }`}
//                     >
//                       {product.isAvailable ? 'Deactivate' : 'Activate'}
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
          
//           {filteredProducts.length === 0 && (
//             <div className="text-center py-12">
//               <div className="text-6xl mb-4">📦</div>
//               <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
//               <p className="text-gray-500">No products match your current filters.</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

