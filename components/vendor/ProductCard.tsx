// components/vendor/ProductCard.tsx - Updated
'use client';

import { useState } from 'react';
import { useVendor } from '@/contexts/VendorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
    description: string;
    rating: number;
  };
  isAvailable: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  preparationTime: number;
  tags: string[];
}

interface ProductCardProps {
  product: VendorProduct;
  onAddToCart: (product: VendorProduct) => void;
  disabled?: boolean;
}

export default function ProductCard({ product, onAddToCart, disabled = false }: ProductCardProps) {
  const { addToCart } = useVendor();
  const { user } = useAuth();
  const router = useRouter();
  
  const [quantity, setQuantity] = useState(product.minOrderQuantity);
  const [showDetails, setShowDetails] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (disabled) {
      alert('You need an active, confirmed booking to place orders. Please book a property first.');
      router.push('/properties');
      return;
    }

    if (!product.isAvailable) {
      alert('This product is currently unavailable');
      return;
    }

    if (quantity < product.minOrderQuantity) {
      alert(`Minimum order quantity is ${product.minOrderQuantity}`);
      return;
    }

    if (quantity > product.maxOrderQuantity) {
      alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
      return;
    }

    if (quantity > product.stockQuantity) {
      alert(`Only ${product.stockQuantity} items available in stock`);
      return;
    }

    addToCart(product, quantity, specialInstructions);
    onAddToCart(product);
    
    // Reset form
    setQuantity(product.minOrderQuantity);
    setSpecialInstructions('');
    setShowDetails(false);
    
    // Show success message
    alert(`${quantity} ${product.name} added to cart!`);
  };

  // const getImageUrl = (imagePath: string) => {
  //   if (!imagePath) return '/default-product.jpg';
  //   if (imagePath.startsWith('http')) return imagePath;
  //   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  //   return `${baseUrl}${imagePath}`;
  // };

  // const mainImage = product.images.find(img => img.isMain)?.url || product.images[0]?.url;


  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/default-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}${imagePath}`;
  };

  // Get the first image (since there's no isMain property in the interface)
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0].url 
    : '/default-product.jpg';


  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-200 ${
      disabled ? 'opacity-75' : ''
    }`}>
      {/* Product Image */}
      <div className="relative">
        <img
          src={getImageUrl(mainImage)}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-[#f06123] text-white px-2 py-1 rounded-lg text-sm font-semibold">
          ₦{product.price.toLocaleString()}
        </div>
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs font-medium capitalize">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-[#383a3c] text-lg line-clamp-1">{product.name}</h3>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {product.vendor.businessName}
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {product.preparationTime}min
          </span>
        </div>

        {/* Stock and Limits */}
        <div className="text-xs text-gray-500 mb-3">
          {product.stockQuantity > 0 ? (
            <span className="text-green-600">{product.stockQuantity} in stock</span>
          ) : (
            <span className="text-red-600">Out of stock</span>
          )}
          <span className="mx-2">•</span>
          Min: {product.minOrderQuantity}, Max: {product.maxOrderQuantity}
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Qty:</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!product.isAvailable || disabled}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] disabled:bg-gray-100"
            >
              {Array.from(
                { length: Math.min(product.maxOrderQuantity, product.stockQuantity) - product.minOrderQuantity + 1 },
                (_, i) => i + product.minOrderQuantity
              ).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
          >
            {showDetails ? 'Less' : 'More'} Details
          </button>
        </div>

        {/* Additional Details */}
        {showDetails && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or instructions..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
                rows={2}
              />
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.isAvailable || disabled}
          className={`w-full py-2 rounded-lg font-semibold transition duration-200 ${
            product.isAvailable && !disabled
              ? 'bg-[#f06123] text-white hover:bg-orange-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {disabled ? 'Book Property First' : product.isAvailable ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}





































// 'use client';

// import { useState } from 'react';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';

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
//     description: string;
//     rating: number;
//   };
//   isAvailable: boolean;
//   stockQuantity: number;
//   minOrderQuantity: number;
//   maxOrderQuantity: number;
//   preparationTime: number;
//   tags: string[];
// }

// interface ProductCardProps {
//   product: VendorProduct;
//   onAddToCart: (product: VendorProduct) => void;
// }

// export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
//   const { addToCart } = useVendor();
//   const { user } = useAuth();
//   const router = useRouter();
  
//   const [quantity, setQuantity] = useState(product.minOrderQuantity);
//   const [showDetails, setShowDetails] = useState(false);
//   const [specialInstructions, setSpecialInstructions] = useState('');

//   const handleAddToCart = () => {
//     if (!user) {
//       router.push('/login');
//       return;
//     }

//     if (!product.isAvailable) {
//       alert('This product is currently unavailable');
//       return;
//     }

//     if (quantity < product.minOrderQuantity) {
//       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
//       return;
//     }

//     if (quantity > product.maxOrderQuantity) {
//       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
//       return;
//     }

//     if (quantity > product.stockQuantity) {
//       alert(`Only ${product.stockQuantity} items available in stock`);
//       return;
//     }

//     addToCart(product, quantity, specialInstructions);
//     onAddToCart(product);
    
//     // Reset form
//     setQuantity(product.minOrderQuantity);
//     setSpecialInstructions('');
//     setShowDetails(false);
    
//     // Show success message
//     alert(`${quantity} ${product.name} added to cart!`);
//   };

//   const getImageUrl = (imagePath: string) => {
//     if (!imagePath) return '/default-product.jpg';
//     if (imagePath.startsWith('http')) return imagePath;
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//     return `${baseUrl}${imagePath}`;
//   };

//   const mainImage = product.images.find(img => img.isMain)?.url || product.images[0]?.url;

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-200">
//       {/* Product Image */}
//       <div className="relative">
//         <img
//           src={getImageUrl(mainImage)}
//           alt={product.name}
//           className="w-full h-48 object-cover"
//         />
//         {!product.isAvailable && (
//           <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//             <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
//               Out of Stock
//             </span>
//           </div>
//         )}
//         <div className="absolute top-3 right-3 bg-[#f06123] text-white px-2 py-1 rounded-lg text-sm font-semibold">
//           ₦{product.price.toLocaleString()}
//         </div>
//         <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs font-medium capitalize">
//           {product.category}
//         </div>
//       </div>

//       {/* Product Info */}
//       <div className="p-4">
//         <div className="flex justify-between items-start mb-2">
//           <h3 className="font-semibold text-[#383a3c] text-lg line-clamp-1">{product.name}</h3>
//         </div>

//         <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

//         <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
//           <span className="flex items-center">
//             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//             </svg>
//             {product.vendor.businessName}
//           </span>
//           <span className="flex items-center">
//             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             {product.preparationTime}min
//           </span>
//         </div>

//         {/* Stock and Limits */}
//         <div className="text-xs text-gray-500 mb-3">
//           {product.stockQuantity > 0 ? (
//             <span className="text-green-600">{product.stockQuantity} in stock</span>
//           ) : (
//             <span className="text-red-600">Out of stock</span>
//           )}
//           <span className="mx-2">•</span>
//           Min: {product.minOrderQuantity}, Max: {product.maxOrderQuantity}
//         </div>

//         {/* Quantity Selector */}
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center space-x-2">
//             <label className="text-sm text-gray-700">Qty:</label>
//             <select
//               value={quantity}
//               onChange={(e) => setQuantity(Number(e.target.value))}
//               disabled={!product.isAvailable}
//               className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] disabled:bg-gray-100"
//             >
//               {Array.from(
//                 { length: Math.min(product.maxOrderQuantity, product.stockQuantity) - product.minOrderQuantity + 1 },
//                 (_, i) => i + product.minOrderQuantity
//               ).map(num => (
//                 <option key={num} value={num}>{num}</option>
//               ))}
//             </select>
//           </div>

//           <button
//             onClick={() => setShowDetails(!showDetails)}
//             className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
//           >
//             {showDetails ? 'Less' : 'More'} Details
//           </button>
//         </div>

//         {/* Additional Details */}
//         {showDetails && (
//           <div className="mb-3 p-3 bg-gray-50 rounded-lg">
//             <div className="mb-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Special Instructions (Optional)
//               </label>
//               <textarea
//                 value={specialInstructions}
//                 onChange={(e) => setSpecialInstructions(e.target.value)}
//                 placeholder="Any special requests or instructions..."
//                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
//                 rows={2}
//               />
//             </div>

//             {/* Tags */}
//             {product.tags.length > 0 && (
//               <div className="flex flex-wrap gap-1">
//                 {product.tags.map((tag, index) => (
//                   <span
//                     key={index}
//                     className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
//                   >
//                     {tag}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Add to Cart Button */}
//         <button
//           onClick={handleAddToCart}
//           disabled={!product.isAvailable}
//           className={`w-full py-2 rounded-lg font-semibold transition duration-200 ${
//             product.isAvailable
//               ? 'bg-[#f06123] text-white hover:bg-orange-600'
//               : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//           }`}
//         >
//           {product.isAvailable ? 'Add to Cart' : 'Out of Stock'}
//         </button>
//       </div>
//     </div>
//   );
// }