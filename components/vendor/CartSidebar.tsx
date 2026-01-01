// components/vendor/CartSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useVendor } from '@/contexts/VendorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { 
    cart, 
    removeFromCart, 
    updateCartItem, 
    clearCart, 
    getCartTotal,
    createVendorOrder 
  } = useVendor();
  
  const { user } = useAuth();
  const { bookings } = useBooking();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');

  const serviceFee = getCartTotal() * 0.1; // 10% service fee
  const deliveryFee = 500; // Fixed delivery fee
  const totalAmount = getCartTotal() + serviceFee + deliveryFee;

  // Get confirmed, paid bookings
  const confirmedBookings = bookings.filter(booking => {
    return (
      booking.bookingStatus === 'confirmed' &&
      booking.paymentStatus === 'paid'
    );
  });

  // Auto-select the first booking if only one exists
  useEffect(() => {
    if (confirmedBookings.length === 1 && !selectedBooking) {
      setSelectedBooking(confirmedBookings[0]._id);
    }
  }, [confirmedBookings, selectedBooking]);

  // Safe image URL getter
  const getImageUrl = (images: Array<{ url: string }> | undefined) => {
    // Safe check for images array
    if (!images || !Array.isArray(images) || images.length === 0 || !images[0]?.url) {
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

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!selectedBooking) {
      alert('Please select a booking for delivery');
      return;
    }

    // Check if all items are from the same vendor
    const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
    if (vendors.length > 1) {
      alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
      return;
    }

    try {
      setLoading(true);

      const selectedBookingData = confirmedBookings.find(b => b._id === selectedBooking);
      if (!selectedBookingData) {
        throw new Error('Selected booking not found');
      }

      // Prepare order data matching backend expectations
      const orderData = {
        bookingId: selectedBooking,
        vendorId: vendors[0], // Use the vendor ID from the first product
        items: cart.map(item => ({
          productId: item.product._id, // Backend expects productId, not product
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        deliveryAddress: {
          property: selectedBookingData.property.title,
          unit: selectedBookingData.property.location,
          specialInstructions: deliveryInstructions
        },
        preferredDeliveryTime: preferredDeliveryTime || undefined,
        customerNotes: deliveryInstructions
      };

      console.log('Sending order data:', orderData);

      const response = await createVendorOrder(orderData);
      
      if (response.success) {
        // Redirect to payment page
        router.push(`/vendor/checkout/${response.order._id}`);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const product = cart.find(item => item.product._id === productId)?.product;
    if (!product) return;

    if (newQuantity < product.minOrderQuantity) {
      alert(`Minimum order quantity is ${product.minOrderQuantity}`);
      return;
    }

    if (newQuantity > product.maxOrderQuantity) {
      alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
      return;
    }

    if (newQuantity > product.stockQuantity) {
      alert(`Only ${product.stockQuantity} items available in stock`);
      return;
    }

    updateCartItem(productId, newQuantity);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#383a3c]">Shopping Cart</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Add some products from the marketplace to get started
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Vendor Info */}
                  {cart.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Ordering from: <strong>{cart[0]?.product.vendor.businessName}</strong>
                      </p>
                    </div>
                  )}

                  {/* Cart Items */}
                  {cart.map((item) => (
                    <div
                      key={item.product._id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <img
                        src={getImageUrl(item.product.images)}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-product.jpg';
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#383a3c] text-sm line-clamp-1">
                          {item.product.name}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          ₦{item.product.price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-[#f06123] font-semibold text-sm">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                        
                        {item.specialInstructions && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                          disabled={item.quantity <= item.product.minOrderQuantity}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Delivery Information */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-[#383a3c] mb-3">Delivery Information</h3>
                    
                    {/* Booking Selection */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Booking for Delivery *
                      </label>
                      {confirmedBookings.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-yellow-700 text-sm">
                            No confirmed bookings found. You need a confirmed, paid booking to place an order.
                          </p>
                          <Link 
                            href="/dashboard/bookings"
                            className="text-[#f06123] hover:text-orange-600 text-sm font-medium mt-2 inline-block"
                          >
                            View My Bookings
                          </Link>
                        </div>
                      ) : (
                        <select
                          value={selectedBooking}
                          onChange={(e) => setSelectedBooking(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                          required
                        >
                          <option value="">Choose a booking...</option>
                          {confirmedBookings.map(booking => {
                            const today = new Date();
                            const checkIn = new Date(booking.checkIn);
                            const checkOut = new Date(booking.checkOut);
                            const isActiveStay = today >= checkIn && today <= checkOut;
                            
                            return (
                              <option key={booking._id} value={booking._id}>
                                {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()} {isActiveStay ? '(Active)' : '(Upcoming)'}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    {/* Preferred Delivery Time */}
                    {selectedBooking && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Delivery Time (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={preferredDeliveryTime}
                          onChange={(e) => setPreferredDeliveryTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
                        />
                      </div>
                    )}

                    {/* Delivery Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Instructions (Optional)
                      </label>
                      <textarea
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="Any special delivery instructions, gate codes, or specific locations..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-[#383a3c] mb-3">Order Summary</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₦{getCartTotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee (10%)</span>
                        <span>₦{serviceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>₦{deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span className="text-[#f06123]">₦{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading || !selectedBooking || confirmedBookings.length === 0}
                  className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Proceed to Checkout - ₦${totalAmount.toLocaleString()}`
                  )}
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




































































// // components/vendor/CartSidebar.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { useBooking } from '@/contexts/BookingContext';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';

// interface CartSidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
//   const { 
//     cart, 
//     removeFromCart, 
//     updateCartItem, 
//     clearCart, 
//     getCartTotal,
//     createVendorOrder 
//   } = useVendor();
  
//   const { user } = useAuth();
//   const { bookings } = useBooking();
//   const router = useRouter();
  
//   const [loading, setLoading] = useState(false);
//   const [selectedBooking, setSelectedBooking] = useState('');
//   const [deliveryInstructions, setDeliveryInstructions] = useState('');
//   const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');

//   const serviceFee = getCartTotal() * 0.1;
//   const deliveryFee = 500;
//   const totalAmount = getCartTotal() + serviceFee + deliveryFee;

//   // Get confirmed, paid bookings
//   const confirmedBookings = bookings.filter(booking => 
//     booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid'
//   );

//   // Auto-select the first booking if only one exists
//   useEffect(() => {
//     if (confirmedBookings.length === 1 && !selectedBooking) {
//       setSelectedBooking(confirmedBookings[0]._id);
//     }
//   }, [confirmedBookings, selectedBooking]);

//   const handleCheckout = async () => {
//     if (!user) {
//       router.push('/login');
//       return;
//     }

//     if (cart.length === 0) {
//       alert('Your cart is empty');
//       return;
//     }

//     if (!selectedBooking) {
//       alert('Please select a booking for delivery');
//       return;
//     }

//     // Check if all items are from the same vendor
//     const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
//     if (vendors.length > 1) {
//       alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
//       return;
//     }

//     try {
//       setLoading(true);

//       const selectedBookingData = confirmedBookings.find(b => b._id === selectedBooking);
//       if (!selectedBookingData) {
//         throw new Error('Selected booking not found');
//       }

//       const orderData = {
//         bookingId: selectedBooking,
//         vendorId: vendors[0],
//         items: cart.map(item => ({
//           productId: item.product._id,
//           quantity: item.quantity,
//           specialInstructions: item.specialInstructions
//         })),
//         deliveryAddress: {
//           property: selectedBookingData.property.title,
//           unit: selectedBookingData.property.location,
//           specialInstructions: deliveryInstructions
//         },
//         preferredDeliveryTime: preferredDeliveryTime || undefined,
//         customerNotes: deliveryInstructions
//       };

//       console.log('Sending order data:', orderData);
//       const response = await createVendorOrder(orderData);
      
//       if (response.success) {
//         router.push(`/vendor/checkout/${response.order._id}`);
//         onClose();
//       } else {
//         throw new Error(response.message || 'Failed to create order');
//       }
      
//     } catch (error: any) {
//       console.error('Checkout error:', error);
//       alert(error.message || 'Failed to create order. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleQuantityChange = (productId: string, newQuantity: number) => {
//     const product = cart.find(item => item.product._id === productId)?.product;
//     if (!product) return;

//     if (newQuantity < product.minOrderQuantity) {
//       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
//       return;
//     }

//     if (newQuantity > product.maxOrderQuantity) {
//       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
//       return;
//     }

//     if (newQuantity > product.stockQuantity) {
//       alert(`Only ${product.stockQuantity} items available in stock`);
//       return;
//     }

//     updateCartItem(productId, newQuantity);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-hidden">
//       {/* Backdrop */}
//       <div 
//         className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
//         onClick={onClose}
//       />
      
//       {/* Sidebar */}
//       <div className="absolute inset-y-0 right-0 max-w-full flex">
//         <div className="relative w-96 max-w-full"> {/* Fixed width */}
//           <div className="h-full flex flex-col bg-white shadow-xl">
//             {/* Header - Compact */}
//             <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
//               <h2 className="text-lg font-semibold text-gray-900">Shopping Cart ({cart.length})</h2>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             {/* Cart Content */}
//             <div className="flex-1 overflow-y-auto">
//               {cart.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-full p-6 text-center">
//                   <div className="text-4xl mb-3">🛒</div>
//                   <h3 className="text-base font-semibold text-gray-600 mb-2">Your cart is empty</h3>
//                   <p className="text-gray-500 text-sm mb-4">
//                     Add some products from the marketplace
//                   </p>
//                   <button
//                     onClick={onClose}
//                     className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition duration-200 text-sm"
//                   >
//                     Continue Shopping
//                   </button>
//                 </div>
//               ) : (
//                 <div className="p-4 space-y-3"> {/* Reduced spacing */}
//                   {/* Vendor Info */}
//                   {cart.length > 0 && (
//                     <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
//                       <p className="text-xs text-blue-800">
//                         Ordering from: <strong>{cart[0]?.product.vendor.businessName}</strong>
//                       </p>
//                     </div>
//                   )}

//                   {/* Cart Items */}
//                   <div className="space-y-2 max-h-80 overflow-y-auto"> {/* Fixed height for items */}
//                     {cart.map((item) => (
//                       <div
//                         key={item.product._id}
//                         className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg bg-white"
//                       >
//                         <img
//                           src={item.product.images[0]?.url || '/default-product.jpg'}
//                           alt={item.product.name}
//                           className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
//                         />
                        
//                         <div className="flex-1 min-w-0">
//                           <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
//                             {item.product.name}
//                           </h4>
//                           <p className="text-gray-600 text-xs">
//                             ₦{item.product.price.toLocaleString()} × {item.quantity}
//                           </p>
//                           <p className="text-orange-500 font-semibold text-sm">
//                             ₦{(item.product.price * item.quantity).toLocaleString()}
//                           </p>
                          
//                           {item.specialInstructions && (
//                             <p className="text-gray-500 text-xs mt-1 line-clamp-1">
//                               Note: {item.specialInstructions}
//                             </p>
//                           )}
//                         </div>

//                         <div className="flex flex-col items-end space-y-2">
//                           <div className="flex items-center space-x-1">
//                             <button
//                               onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
//                               disabled={item.quantity <= item.product.minOrderQuantity}
//                               className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//                             >
//                               -
//                             </button>
//                             <span className="w-6 text-center text-xs">{item.quantity}</span>
//                             <button
//                               onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
//                               disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
//                               className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//                             >
//                               +
//                             </button>
//                           </div>

//                           <button
//                             onClick={() => removeFromCart(item.product._id)}
//                             className="text-red-500 hover:text-red-600 p-1 transition-colors"
//                           >
//                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                             </svg>
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Delivery Information */}
//                   <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
//                     <h3 className="font-semibold text-gray-900 text-sm mb-2">Delivery Information</h3>
                    
//                     {/* Booking Selection */}
//                     <div className="mb-2">
//                       <label className="block text-xs font-medium text-gray-700 mb-1">
//                         Select Booking *
//                       </label>
//                       {confirmedBookings.length === 0 ? (
//                         <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
//                           <p className="text-yellow-700 text-xs">
//                             No confirmed bookings found.
//                           </p>
//                           <Link 
//                             href="/dashboard/bookings"
//                             className="text-orange-500 hover:text-orange-600 text-xs font-medium mt-1 inline-block"
//                           >
//                             View My Bookings
//                           </Link>
//                         </div>
//                       ) : (
//                         <select
//                           value={selectedBooking}
//                           onChange={(e) => setSelectedBooking(e.target.value)}
//                           className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
//                           required
//                         >
//                           <option value="">Choose a booking...</option>
//                           {confirmedBookings.map(booking => {
//                             const today = new Date();
//                             const checkIn = new Date(booking.checkIn);
//                             const checkOut = new Date(booking.checkOut);
//                             const isActiveStay = today >= checkIn && today <= checkOut;
                            
//                             return (
//                               <option key={booking._id} value={booking._id}>
//                                 {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} {isActiveStay ? '(Active)' : '(Upcoming)'}
//                               </option>
//                             );
//                           })}
//                         </select>
//                       )}
//                     </div>

//                     {/* Preferred Delivery Time */}
//                     {selectedBooking && (
//                       <div className="mb-2">
//                         <label className="block text-xs font-medium text-gray-700 mb-1">
//                           Preferred Time (Optional)
//                         </label>
//                         <input
//                           type="datetime-local"
//                           value={preferredDeliveryTime}
//                           onChange={(e) => setPreferredDeliveryTime(e.target.value)}
//                           className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
//                         />
//                       </div>
//                     )}

//                     {/* Delivery Instructions */}
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">
//                         Instructions (Optional)
//                       </label>
//                       <textarea
//                         value={deliveryInstructions}
//                         onChange={(e) => setDeliveryInstructions(e.target.value)}
//                         placeholder="Gate codes, specific locations..."
//                         className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
//                         rows={2}
//                       />
//                     </div>
//                   </div>

//                   {/* Order Summary */}
//                   <div className="p-3 border border-gray-200 rounded-lg bg-white">
//                     <h3 className="font-semibold text-gray-900 text-sm mb-2">Order Summary</h3>
                    
//                     <div className="space-y-1 text-xs">
//                       <div className="flex justify-between">
//                         <span>Subtotal</span>
//                         <span>₦{getCartTotal().toLocaleString()}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Service Fee (10%)</span>
//                         <span>₦{serviceFee.toLocaleString()}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Delivery Fee</span>
//                         <span>₦{deliveryFee.toLocaleString()}</span>
//                       </div>
//                       <div className="flex justify-between font-semibold border-t border-gray-200 pt-1 text-sm">
//                         <span>Total</span>
//                         <span className="text-orange-500">₦{totalAmount.toLocaleString()}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             {cart.length > 0 && (
//               <div className="border-t border-gray-200 p-4 space-y-2 bg-white">
//                 <button
//                   onClick={handleCheckout}
//                   disabled={loading || !selectedBooking || confirmedBookings.length === 0}
//                   className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
//                 >
//                   {loading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
//                       Processing...
//                     </div>
//                   ) : (
//                     `Checkout - ₦${totalAmount.toLocaleString()}`
//                   )}
//                 </button>
                
//                 <button
//                   onClick={clearCart}
//                   className="w-full border border-gray-300 text-gray-700 py-1 rounded-lg font-medium hover:bg-gray-50 transition duration-200 text-sm"
//                 >
//                   Clear Cart
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



































// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222



// // components/vendor/CartSidebar.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { useBooking } from '@/contexts/BookingContext';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';

// interface CartSidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
//   const { 
//     cart, 
//     removeFromCart, 
//     updateCartItem, 
//     clearCart, 
//     getCartTotal,
//     createVendorOrder 
//   } = useVendor();
  
//   const { user } = useAuth();
//   const { bookings } = useBooking();
//   const router = useRouter();
  
//   const [loading, setLoading] = useState(false);
//   const [selectedBooking, setSelectedBooking] = useState('');
//   const [deliveryInstructions, setDeliveryInstructions] = useState('');
//   const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');

//   const serviceFee = getCartTotal() * 0.1; // 10% service fee
//   const deliveryFee = 500; // Fixed delivery fee
//   const totalAmount = getCartTotal() + serviceFee + deliveryFee;

//   // Get confirmed, paid bookings
//   const confirmedBookings = bookings.filter(booking => {
//     return (
//       booking.bookingStatus === 'confirmed' &&
//       booking.paymentStatus === 'paid'
//     );
//   });

//   // Auto-select the first booking if only one exists
//   useEffect(() => {
//     if (confirmedBookings.length === 1 && !selectedBooking) {
//       setSelectedBooking(confirmedBookings[0]._id);
//     }
//   }, [confirmedBookings, selectedBooking]);

// //   const handleCheckout = async () => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }

// //     if (cart.length === 0) {
// //       alert('Your cart is empty');
// //       return;
// //     }

// //     if (!selectedBooking) {
// //       alert('Please select a booking for delivery');
// //       return;
// //     }

// //     // Check if all items are from the same vendor
// //     const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
// //     if (vendors.length > 1) {
// //       alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
// //       return;
// //     }

// //     try {
// //       setLoading(true);

// //       const selectedBookingData = confirmedBookings.find(b => b._id === selectedBooking);
// //       if (!selectedBookingData) {
// //         throw new Error('Selected booking not found');
// //       }

// //       const orderData = {
// //         bookingId: selectedBooking,
// //         vendorId: vendors[0],
// //         items: cart.map(item => ({
// //           productId: item.product._id,
// //           quantity: item.quantity,
// //           specialInstructions: item.specialInstructions
// //         })),
// //         deliveryAddress: {
// //           property: selectedBookingData.property.title,
// //           unit: selectedBookingData.property.location,
// //           specialInstructions: deliveryInstructions
// //         },
// //         preferredDeliveryTime: preferredDeliveryTime || undefined,
// //         customerNotes: deliveryInstructions
// //       };

// //       const response = await createVendorOrder(orderData);
      
// //       // Redirect to payment page
// //       router.push(`/vendor/checkout/${response.order._id}`);
// //       onClose();
      
// //     } catch (error: any) {
// //       console.error('Checkout error:', error);
// //       alert(error.message || 'Failed to create order. Please try again.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

//     // In CartSidebar.tsx - Fix handleCheckout function
//     const handleCheckout = async () => {
//     if (!user) {
//         router.push('/login');
//         return;
//     }

//     if (cart.length === 0) {
//         alert('Your cart is empty');
//         return;
//     }

//     if (!selectedBooking) {
//         alert('Please select a booking for delivery');
//         return;
//     }

//     // Check if all items are from the same vendor
//     const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
//     if (vendors.length > 1) {
//         alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
//         return;
//     }

//     try {
//         setLoading(true);

//         const selectedBookingData = confirmedBookings.find(b => b._id === selectedBooking);
//         if (!selectedBookingData) {
//         throw new Error('Selected booking not found');
//         }

//         // Prepare order data matching backend expectations
//         const orderData = {
//         bookingId: selectedBooking,
//         vendorId: vendors[0], // Use the vendor ID from the first product
//         items: cart.map(item => ({
//             productId: item.product._id, // Backend expects productId, not product
//             quantity: item.quantity,
//             specialInstructions: item.specialInstructions
//         })),
//         deliveryAddress: {
//             property: selectedBookingData.property.title,
//             unit: selectedBookingData.property.location,
//             specialInstructions: deliveryInstructions
//         },
//         preferredDeliveryTime: preferredDeliveryTime || undefined,
//         customerNotes: deliveryInstructions
//         };

//         console.log('Sending order data:', orderData);

//         const response = await createVendorOrder(orderData);
        
//         if (response.success) {
//         // Redirect to payment page
//         router.push(`/vendor/checkout/${response.order._id}`);
//         onClose();
//         } else {
//         throw new Error(response.message || 'Failed to create order');
//         }
        
//     } catch (error: any) {
//         console.error('Checkout error:', error);
//         alert(error.message || 'Failed to create order. Please try again.');
//     } finally {
//         setLoading(false);
//     }
//     };

//   const handleQuantityChange = (productId: string, newQuantity: number) => {
//     const product = cart.find(item => item.product._id === productId)?.product;
//     if (!product) return;

//     if (newQuantity < product.minOrderQuantity) {
//       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
//       return;
//     }

//     if (newQuantity > product.maxOrderQuantity) {
//       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
//       return;
//     }

//     if (newQuantity > product.stockQuantity) {
//       alert(`Only ${product.stockQuantity} items available in stock`);
//       return;
//     }

//     updateCartItem(productId, newQuantity);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-hidden">
//       {/* Backdrop */}
//       <div 
//         className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
//         onClick={onClose}
//       />
      
//       {/* Sidebar */}
//       <div className="absolute inset-y-0 right-0 max-w-full flex">
//         <div className="relative w-screen max-w-md">
//           <div className="h-full flex flex-col bg-white shadow-xl">
//             {/* Header */}
//             <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
//               <h2 className="text-lg font-semibold text-[#383a3c]">Shopping Cart</h2>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             {/* Cart Content */}
//             <div className="flex-1 overflow-y-auto">
//               {cart.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-full p-8">
//                   <div className="text-6xl mb-4">🛒</div>
//                   <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
//                   <p className="text-gray-500 text-center mb-6">
//                     Add some products from the marketplace to get started
//                   </p>
//                   <button
//                     onClick={onClose}
//                     className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//                   >
//                     Continue Shopping
//                   </button>
//                 </div>
//               ) : (
//                 <div className="p-4 space-y-4">
//                   {/* Vendor Info */}
//                   {cart.length > 0 && (
//                     <div className="bg-blue-50 p-3 rounded-lg">
//                       <p className="text-sm text-blue-800">
//                         Ordering from: <strong>{cart[0]?.product.vendor.businessName}</strong>
//                       </p>
//                     </div>
//                   )}

//                   {/* Cart Items */}
//                   {cart.map((item) => (
//                     <div
//                       key={item.product._id}
//                       className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
//                     >
//                       <img
//                         src={item.product.images[0]?.url || '/default-product.jpg'}
//                         alt={item.product.name}
//                         className="w-16 h-16 rounded-lg object-cover"
//                       />
                      
//                       <div className="flex-1 min-w-0">
//                         <h4 className="font-semibold text-[#383a3c] text-sm line-clamp-1">
//                           {item.product.name}
//                         </h4>
//                         <p className="text-gray-600 text-sm">
//                           ₦{item.product.price.toLocaleString()} × {item.quantity}
//                         </p>
//                         <p className="text-[#f06123] font-semibold text-sm">
//                           ₦{(item.product.price * item.quantity).toLocaleString()}
//                         </p>
                        
//                         {item.specialInstructions && (
//                           <p className="text-gray-500 text-xs mt-1 line-clamp-1">
//                             Note: {item.specialInstructions}
//                           </p>
//                         )}
//                       </div>

//                       <div className="flex items-center space-x-2">
//                         <button
//                           onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
//                           disabled={item.quantity <= item.product.minOrderQuantity}
//                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           -
//                         </button>
//                         <span className="w-8 text-center text-sm">{item.quantity}</span>
//                         <button
//                           onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
//                           disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
//                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           +
//                         </button>
//                       </div>

//                       <button
//                         onClick={() => removeFromCart(item.product._id)}
//                         className="text-red-600 hover:text-red-700 p-1"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                         </svg>
//                       </button>
//                     </div>
//                   ))}

//                   {/* Delivery Information */}
//                   <div className="p-4 border border-gray-200 rounded-lg">
//                     <h3 className="font-semibold text-[#383a3c] mb-3">Delivery Information</h3>
                    
//                     {/* Booking Selection */}
//                     <div className="mb-3">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Select Booking for Delivery *
//                       </label>
//                       {confirmedBookings.length === 0 ? (
//                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//                           <p className="text-yellow-700 text-sm">
//                             No confirmed bookings found. You need a confirmed, paid booking to place an order.
//                           </p>
//                           <Link 
//                             href="/dashboard/bookings"
//                             className="text-[#f06123] hover:text-orange-600 text-sm font-medium mt-2 inline-block"
//                           >
//                             View My Bookings
//                           </Link>
//                         </div>
//                       ) : (
//                         <select
//                           value={selectedBooking}
//                           onChange={(e) => setSelectedBooking(e.target.value)}
//                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
//                           required
//                         >
//                           <option value="">Choose a booking...</option>
//                           {confirmedBookings.map(booking => {
//                             const today = new Date();
//                             const checkIn = new Date(booking.checkIn);
//                             const checkOut = new Date(booking.checkOut);
//                             const isActiveStay = today >= checkIn && today <= checkOut;
                            
//                             return (
//                               <option key={booking._id} value={booking._id}>
//                                 {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()} {isActiveStay ? '(Active)' : '(Upcoming)'}
//                               </option>
//                             );
//                           })}
//                         </select>
//                       )}
//                     </div>

//                     {/* Preferred Delivery Time */}
//                     {selectedBooking && (
//                       <div className="mb-3">
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Preferred Delivery Time (Optional)
//                         </label>
//                         <input
//                           type="datetime-local"
//                           value={preferredDeliveryTime}
//                           onChange={(e) => setPreferredDeliveryTime(e.target.value)}
//                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
//                         />
//                       </div>
//                     )}

//                     {/* Delivery Instructions */}
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Delivery Instructions (Optional)
//                       </label>
//                       <textarea
//                         value={deliveryInstructions}
//                         onChange={(e) => setDeliveryInstructions(e.target.value)}
//                         placeholder="Any special delivery instructions, gate codes, or specific locations..."
//                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
//                         rows={3}
//                       />
//                     </div>
//                   </div>

//                   {/* Order Summary */}
//                   <div className="p-4 border border-gray-200 rounded-lg">
//                     <h3 className="font-semibold text-[#383a3c] mb-3">Order Summary</h3>
                    
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span>Subtotal</span>
//                         <span>₦{getCartTotal().toLocaleString()}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Service Fee (10%)</span>
//                         <span>₦{serviceFee.toLocaleString()}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Delivery Fee</span>
//                         <span>₦{deliveryFee.toLocaleString()}</span>
//                       </div>
//                       <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
//                         <span>Total</span>
//                         <span className="text-[#f06123]">₦{totalAmount.toLocaleString()}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             {cart.length > 0 && (
//               <div className="border-t border-gray-200 p-4 space-y-3">
//                 <button
//                   onClick={handleCheckout}
//                   disabled={loading || !selectedBooking || confirmedBookings.length === 0}
//                   className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 >
//                   {loading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                       Processing...
//                     </div>
//                   ) : (
//                     `Proceed to Checkout - ₦${totalAmount.toLocaleString()}`
//                   )}
//                 </button>
                
//                 <button
//                   onClick={clearCart}
//                   className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
//                 >
//                   Clear Cart
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }










































// // // components/vendor/CartSidebar.tsx - Updated with confirmed booking access
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useVendor } from '@/contexts/VendorContext';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useRouter } from 'next/navigation';
// // import Link from 'next/link';

// // interface CartSidebarProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// // }

// // export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
// //   const { 
// //     cart, 
// //     removeFromCart, 
// //     updateCartItem, 
// //     clearCart, 
// //     getCartTotal,
// //     createVendorOrder 
// //   } = useVendor();
  
// //   const { user } = useAuth();
// //   const { bookings } = useBooking();
// //   const router = useRouter();
  
// //   const [loading, setLoading] = useState(false);
// //   const [selectedBooking, setSelectedBooking] = useState('');
// //   const [deliveryInstructions, setDeliveryInstructions] = useState('');
// //   const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');

// //   const serviceFee = getCartTotal() * 0.1; // 10% service fee
// //   const deliveryFee = 500; // Fixed delivery fee
// //   const totalAmount = getCartTotal() + serviceFee + deliveryFee;

// //   // Get confirmed, paid bookings (user can access marketplace for entire booking period)
// //   const confirmedBookings = bookings.filter(booking => {
// //     return (
// //       booking.bookingStatus === 'confirmed' &&
// //       booking.paymentStatus === 'paid'
// //     );
// //   });

// //   // Auto-select the first booking if only one exists
// //   useEffect(() => {
// //     if (confirmedBookings.length === 1 && !selectedBooking) {
// //       setSelectedBooking(confirmedBookings[0]._id);
// //     }
// //   }, [confirmedBookings, selectedBooking]);

// //   const handleCheckout = async () => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }

// //     if (cart.length === 0) {
// //       alert('Your cart is empty');
// //       return;
// //     }

// //     if (!selectedBooking) {
// //       alert('Please select a booking for delivery');
// //       return;
// //     }

// //     // Check if all items are from the same vendor
// //     const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
// //     if (vendors.length > 1) {
// //       alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
// //       return;
// //     }

// //     try {
// //       setLoading(true);

// //       const selectedBookingData = confirmedBookings.find(b => b._id === selectedBooking);
// //       if (!selectedBookingData) {
// //         throw new Error('Selected booking not found');
// //       }

// //       const orderData = {
// //         bookingId: selectedBooking,
// //         vendorId: vendors[0],
// //         items: cart.map(item => ({
// //           productId: item.product._id,
// //           quantity: item.quantity,
// //           specialInstructions: item.specialInstructions
// //         })),
// //         deliveryAddress: {
// //           property: selectedBookingData.property.title,
// //           unit: selectedBookingData.property.location,
// //           specialInstructions: deliveryInstructions
// //         },
// //         preferredDeliveryTime: preferredDeliveryTime || undefined,
// //         customerNotes: deliveryInstructions
// //       };

// //       const response = await createVendorOrder(orderData);
      
// //       // Redirect to payment page
// //       router.push(`/vendor/checkout/${response.order._id}`);
// //       onClose();
      
// //     } catch (error: any) {
// //       console.error('Checkout error:', error);
// //       alert(error.message || 'Failed to create order. Please try again.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleQuantityChange = (productId: string, newQuantity: number) => {
// //     const product = cart.find(item => item.product._id === productId)?.product;
// //     if (!product) return;

// //     if (newQuantity < product.minOrderQuantity) {
// //       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
// //       return;
// //     }

// //     if (newQuantity > product.maxOrderQuantity) {
// //       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
// //       return;
// //     }

// //     if (newQuantity > product.stockQuantity) {
// //       alert(`Only ${product.stockQuantity} items available in stock`);
// //       return;
// //     }

// //     updateCartItem(productId, newQuantity);
// //   };

// //   if (!isOpen) return null;

// //   return (
// //     <div className="fixed inset-0 z-50 overflow-hidden">
// //       {/* Backdrop */}
// //       <div 
// //         className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
// //         onClick={onClose}
// //       />
      
// //       {/* Sidebar */}
// //       <div className="absolute inset-y-0 right-0 max-w-full flex">
// //         <div className="relative w-screen max-w-md">
// //           <div className="h-full flex flex-col bg-white shadow-xl">
// //             {/* Header */}
// //             <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
// //               <h2 className="text-lg font-semibold text-[#383a3c]">Shopping Cart</h2>
// //               <button
// //                 onClick={onClose}
// //                 className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
// //               >
// //                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// //                 </svg>
// //               </button>
// //             </div>

// //             {/* Cart Content */}
// //             <div className="flex-1 overflow-y-auto">
// //               {cart.length === 0 ? (
// //                 <div className="flex flex-col items-center justify-center h-full p-8">
// //                   <div className="text-6xl mb-4">🛒</div>
// //                   <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
// //                   <p className="text-gray-500 text-center mb-6">
// //                     Add some products from the marketplace to get started
// //                   </p>
// //                   <button
// //                     onClick={onClose}
// //                     className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// //                   >
// //                     Continue Shopping
// //                   </button>
// //                 </div>
// //               ) : (
// //                 <div className="p-4 space-y-4">
// //                   {/* Vendor Info */}
// //                   <div className="bg-blue-50 p-3 rounded-lg">
// //                     <p className="text-sm text-blue-800">
// //                       Ordering from: <strong>{cart[0]?.product.vendor.businessName}</strong>
// //                     </p>
// //                   </div>

// //                   {/* Cart Items */}
// //                   {cart.map((item) => (
// //                     <div
// //                       key={item.product._id}
// //                       className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
// //                     >
// //                       <img
// //                         src={item.product.images[0]?.url || '/default-product.jpg'}
// //                         alt={item.product.name}
// //                         className="w-16 h-16 rounded-lg object-cover"
// //                       />
                      
// //                       <div className="flex-1 min-w-0">
// //                         <h4 className="font-semibold text-[#383a3c] text-sm line-clamp-1">
// //                           {item.product.name}
// //                         </h4>
// //                         <p className="text-gray-600 text-sm">
// //                           ₦{item.product.price.toLocaleString()} × {item.quantity}
// //                         </p>
// //                         <p className="text-[#f06123] font-semibold text-sm">
// //                           ₦{(item.product.price * item.quantity).toLocaleString()}
// //                         </p>
                        
// //                         {item.specialInstructions && (
// //                           <p className="text-gray-500 text-xs mt-1 line-clamp-1">
// //                             Note: {item.specialInstructions}
// //                           </p>
// //                         )}
// //                       </div>

// //                       <div className="flex items-center space-x-2">
// //                         <button
// //                           onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
// //                           disabled={item.quantity <= item.product.minOrderQuantity}
// //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// //                         >
// //                           -
// //                         </button>
// //                         <span className="w-8 text-center text-sm">{item.quantity}</span>
// //                         <button
// //                           onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
// //                           disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
// //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// //                         >
// //                           +
// //                         </button>
// //                       </div>

// //                       <button
// //                         onClick={() => removeFromCart(item.product._id)}
// //                         className="text-red-600 hover:text-red-700 p-1"
// //                       >
// //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
// //                         </svg>
// //                       </button>
// //                     </div>
// //                   ))}

// //                   {/* Delivery Information */}
// //                   <div className="p-4 border border-gray-200 rounded-lg">
// //                     <h3 className="font-semibold text-[#383a3c] mb-3">Delivery Information</h3>
                    
// //                     {/* Booking Selection */}
// //                     <div className="mb-3">
// //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// //                         Select Booking for Delivery *
// //                       </label>
// //                       {confirmedBookings.length === 0 ? (
// //                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
// //                           <p className="text-yellow-700 text-sm">
// //                             No confirmed bookings found. You need a confirmed, paid booking to place an order.
// //                           </p>
// //                           <Link 
// //                             href="/dashboard/bookings"
// //                             className="text-[#f06123] hover:text-orange-600 text-sm font-medium mt-2 inline-block"
// //                           >
// //                             View My Bookings
// //                           </Link>
// //                         </div>
// //                       ) : (
// //                         <select
// //                           value={selectedBooking}
// //                           onChange={(e) => setSelectedBooking(e.target.value)}
// //                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //                           required
// //                         >
// //                           <option value="">Choose a booking...</option>
// //                           {confirmedBookings.map(booking => {
// //                             const today = new Date();
// //                             const checkIn = new Date(booking.checkIn);
// //                             const checkOut = new Date(booking.checkOut);
// //                             const isActiveStay = today >= checkIn && today <= checkOut;
                            
// //                             return (
// //                               <option key={booking._id} value={booking._id}>
// //                                 {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()} {isActiveStay ? '(Active)' : '(Upcoming)'}
// //                               </option>
// //                             );
// //                           })}
// //                         </select>
// //                       )}
// //                     </div>

// //                     {/* Preferred Delivery Time */}
// //                     {selectedBooking && (
// //                       <div className="mb-3">
// //                         <label className="block text-sm font-medium text-gray-700 mb-2">
// //                           Preferred Delivery Time (Optional)
// //                         </label>
// //                         <input
// //                           type="datetime-local"
// //                           value={preferredDeliveryTime}
// //                           onChange={(e) => setPreferredDeliveryTime(e.target.value)}
// //                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //                         />
// //                       </div>
// //                     )}

// //                     {/* Delivery Instructions */}
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// //                         Delivery Instructions (Optional)
// //                       </label>
// //                       <textarea
// //                         value={deliveryInstructions}
// //                         onChange={(e) => setDeliveryInstructions(e.target.value)}
// //                         placeholder="Any special delivery instructions, gate codes, or specific locations..."
// //                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
// //                         rows={3}
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* Order Summary */}
// //                   <div className="p-4 border border-gray-200 rounded-lg">
// //                     <h3 className="font-semibold text-[#383a3c] mb-3">Order Summary</h3>
                    
// //                     <div className="space-y-2 text-sm">
// //                       <div className="flex justify-between">
// //                         <span>Subtotal</span>
// //                         <span>₦{getCartTotal().toLocaleString()}</span>
// //                       </div>
// //                       <div className="flex justify-between">
// //                         <span>Service Fee (10%)</span>
// //                         <span>₦{serviceFee.toLocaleString()}</span>
// //                       </div>
// //                       <div className="flex justify-between">
// //                         <span>Delivery Fee</span>
// //                         <span>₦{deliveryFee.toLocaleString()}</span>
// //                       </div>
// //                       <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
// //                         <span>Total</span>
// //                         <span className="text-[#f06123]">₦{totalAmount.toLocaleString()}</span>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>

// //             {/* Footer */}
// //             {cart.length > 0 && (
// //               <div className="border-t border-gray-200 p-4 space-y-3">
// //                 <button
// //                   onClick={handleCheckout}
// //                   disabled={loading || !selectedBooking || confirmedBookings.length === 0}
// //                   className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
// //                 >
// //                   {loading ? (
// //                     <div className="flex items-center justify-center">
// //                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
// //                       Processing...
// //                     </div>
// //                   ) : (
// //                     `Proceed to Checkout - ₦${totalAmount.toLocaleString()}`
// //                   )}
// //                 </button>
                
// //                 <button
// //                   onClick={clearCart}
// //                   className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
// //                 >
// //                   Clear Cart
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
















// // // components/vendor/CartSidebar.tsx - Updated with flexible booking filter
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useVendor } from '@/contexts/VendorContext';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useRouter } from 'next/navigation';
// // import Link from 'next/link';

// // interface CartSidebarProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// // }

// // export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
// //   const { 
// //     cart, 
// //     removeFromCart, 
// //     updateCartItem, 
// //     clearCart, 
// //     getCartTotal,
// //     createVendorOrder 
// //   } = useVendor();
  
// //   const { user } = useAuth();
// //   const { bookings } = useBooking();
// //   const router = useRouter();
  
// //   const [loading, setLoading] = useState(false);
// //   const [selectedBooking, setSelectedBooking] = useState('');
// //   const [deliveryInstructions, setDeliveryInstructions] = useState('');
// //   const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');

// //   const serviceFee = getCartTotal() * 0.1; // 10% service fee
// //   const deliveryFee = 500; // Fixed delivery fee
// //   const totalAmount = getCartTotal() + serviceFee + deliveryFee;

// //   // Get active bookings (current stays including today)
// //   const activeBookings = bookings.filter(booking => {
// //     const today = new Date();
// //     const checkIn = new Date(booking.checkIn);
// //     const checkOut = new Date(booking.checkOut);
    
// //     return (
// //       booking.bookingStatus === 'confirmed' &&
// //       booking.paymentStatus === 'paid' &&
// //       today >= checkIn && 
// //       today <= checkOut
// //     );
// //   });

// //   // Auto-select the first booking if only one exists
// //   useEffect(() => {
// //     if (activeBookings.length === 1 && !selectedBooking) {
// //       setSelectedBooking(activeBookings[0]._id);
// //     }
// //   }, [activeBookings, selectedBooking]);

// //   const handleCheckout = async () => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }

// //     if (cart.length === 0) {
// //       alert('Your cart is empty');
// //       return;
// //     }

// //     if (!selectedBooking) {
// //       alert('Please select a booking for delivery');
// //       return;
// //     }

// //     // Check if all items are from the same vendor
// //     const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
// //     if (vendors.length > 1) {
// //       alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
// //       return;
// //     }

// //     try {
// //       setLoading(true);

// //       const selectedBookingData = activeBookings.find(b => b._id === selectedBooking);
// //       if (!selectedBookingData) {
// //         throw new Error('Selected booking not found');
// //       }

// //       const orderData = {
// //         bookingId: selectedBooking,
// //         vendorId: vendors[0],
// //         items: cart.map(item => ({
// //           productId: item.product._id,
// //           quantity: item.quantity,
// //           specialInstructions: item.specialInstructions
// //         })),
// //         deliveryAddress: {
// //           property: selectedBookingData.property.title,
// //           unit: selectedBookingData.property.location,
// //           specialInstructions: deliveryInstructions
// //         },
// //         preferredDeliveryTime: preferredDeliveryTime || undefined,
// //         customerNotes: deliveryInstructions
// //       };

// //       const response = await createVendorOrder(orderData);
      
// //       // Redirect to payment page
// //       router.push(`/vendor/checkout/${response.order._id}`);
// //       onClose();
      
// //     } catch (error: any) {
// //       console.error('Checkout error:', error);
// //       alert(error.message || 'Failed to create order. Please try again.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleQuantityChange = (productId: string, newQuantity: number) => {
// //     const product = cart.find(item => item.product._id === productId)?.product;
// //     if (!product) return;

// //     if (newQuantity < product.minOrderQuantity) {
// //       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
// //       return;
// //     }

// //     if (newQuantity > product.maxOrderQuantity) {
// //       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
// //       return;
// //     }

// //     if (newQuantity > product.stockQuantity) {
// //       alert(`Only ${product.stockQuantity} items available in stock`);
// //       return;
// //     }

// //     updateCartItem(productId, newQuantity);
// //   };

// //   if (!isOpen) return null;

// //   return (
// //     <div className="fixed inset-0 z-50 overflow-hidden">
// //       {/* Backdrop */}
// //       <div 
// //         className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
// //         onClick={onClose}
// //       />
      
// //       {/* Sidebar */}
// //       <div className="absolute inset-y-0 right-0 max-w-full flex">
// //         <div className="relative w-screen max-w-md">
// //           <div className="h-full flex flex-col bg-white shadow-xl">
// //             {/* Header */}
// //             <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
// //               <h2 className="text-lg font-semibold text-[#383a3c]">Shopping Cart</h2>
// //               <button
// //                 onClick={onClose}
// //                 className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
// //               >
// //                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// //                 </svg>
// //               </button>
// //             </div>

// //             {/* Cart Content */}
// //             <div className="flex-1 overflow-y-auto">
// //               {cart.length === 0 ? (
// //                 <div className="flex flex-col items-center justify-center h-full p-8">
// //                   <div className="text-6xl mb-4">🛒</div>
// //                   <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
// //                   <p className="text-gray-500 text-center mb-6">
// //                     Add some products from the marketplace to get started
// //                   </p>
// //                   <button
// //                     onClick={onClose}
// //                     className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// //                   >
// //                     Continue Shopping
// //                   </button>
// //                 </div>
// //               ) : (
// //                 <div className="p-4 space-y-4">
// //                   {/* Vendor Info */}
// //                   <div className="bg-blue-50 p-3 rounded-lg">
// //                     <p className="text-sm text-blue-800">
// //                       Ordering from: <strong>{cart[0]?.product.vendor.businessName}</strong>
// //                     </p>
// //                   </div>

// //                   {/* Cart Items */}
// //                   {cart.map((item) => (
// //                     <div
// //                       key={item.product._id}
// //                       className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
// //                     >
// //                       <img
// //                         src={item.product.images[0]?.url || '/default-product.jpg'}
// //                         alt={item.product.name}
// //                         className="w-16 h-16 rounded-lg object-cover"
// //                       />
                      
// //                       <div className="flex-1 min-w-0">
// //                         <h4 className="font-semibold text-[#383a3c] text-sm line-clamp-1">
// //                           {item.product.name}
// //                         </h4>
// //                         <p className="text-gray-600 text-sm">
// //                           ₦{item.product.price.toLocaleString()} × {item.quantity}
// //                         </p>
// //                         <p className="text-[#f06123] font-semibold text-sm">
// //                           ₦{(item.product.price * item.quantity).toLocaleString()}
// //                         </p>
                        
// //                         {item.specialInstructions && (
// //                           <p className="text-gray-500 text-xs mt-1 line-clamp-1">
// //                             Note: {item.specialInstructions}
// //                           </p>
// //                         )}
// //                       </div>

// //                       <div className="flex items-center space-x-2">
// //                         <button
// //                           onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
// //                           disabled={item.quantity <= item.product.minOrderQuantity}
// //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// //                         >
// //                           -
// //                         </button>
// //                         <span className="w-8 text-center text-sm">{item.quantity}</span>
// //                         <button
// //                           onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
// //                           disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
// //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// //                         >
// //                           +
// //                         </button>
// //                       </div>

// //                       <button
// //                         onClick={() => removeFromCart(item.product._id)}
// //                         className="text-red-600 hover:text-red-700 p-1"
// //                       >
// //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
// //                         </svg>
// //                       </button>
// //                     </div>
// //                   ))}

// //                   {/* Delivery Information */}
// //                   <div className="p-4 border border-gray-200 rounded-lg">
// //                     <h3 className="font-semibold text-[#383a3c] mb-3">Delivery Information</h3>
                    
// //                     {/* Booking Selection */}
// //                     <div className="mb-3">
// //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// //                         Select Booking for Delivery *
// //                       </label>
// //                       {activeBookings.length === 0 ? (
// //                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
// //                           <p className="text-yellow-700 text-sm">
// //                             No active bookings found. You need a confirmed, current booking to place an order.
// //                           </p>
// //                           <Link 
// //                             href="/dashboard/bookings"
// //                             className="text-[#f06123] hover:text-orange-600 text-sm font-medium mt-2 inline-block"
// //                           >
// //                             View My Bookings
// //                           </Link>
// //                         </div>
// //                       ) : (
// //                         <select
// //                           value={selectedBooking}
// //                           onChange={(e) => setSelectedBooking(e.target.value)}
// //                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //                           required
// //                         >
// //                           <option value="">Choose a booking...</option>
// //                           {activeBookings.map(booking => (
// //                             <option key={booking._id} value={booking._id}>
// //                               {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
// //                             </option>
// //                           ))}
// //                         </select>
// //                       )}
// //                     </div>

// //                     {/* Preferred Delivery Time */}
// //                     {selectedBooking && (
// //                       <div className="mb-3">
// //                         <label className="block text-sm font-medium text-gray-700 mb-2">
// //                           Preferred Delivery Time (Optional)
// //                         </label>
// //                         <input
// //                           type="datetime-local"
// //                           value={preferredDeliveryTime}
// //                           onChange={(e) => setPreferredDeliveryTime(e.target.value)}
// //                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// //                         />
// //                       </div>
// //                     )}

// //                     {/* Delivery Instructions */}
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// //                         Delivery Instructions (Optional)
// //                       </label>
// //                       <textarea
// //                         value={deliveryInstructions}
// //                         onChange={(e) => setDeliveryInstructions(e.target.value)}
// //                         placeholder="Any special delivery instructions, gate codes, or specific locations..."
// //                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
// //                         rows={3}
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* Order Summary */}
// //                   <div className="p-4 border border-gray-200 rounded-lg">
// //                     <h3 className="font-semibold text-[#383a3c] mb-3">Order Summary</h3>
                    
// //                     <div className="space-y-2 text-sm">
// //                       <div className="flex justify-between">
// //                         <span>Subtotal</span>
// //                         <span>₦{getCartTotal().toLocaleString()}</span>
// //                       </div>
// //                       <div className="flex justify-between">
// //                         <span>Service Fee (10%)</span>
// //                         <span>₦{serviceFee.toLocaleString()}</span>
// //                       </div>
// //                       <div className="flex justify-between">
// //                         <span>Delivery Fee</span>
// //                         <span>₦{deliveryFee.toLocaleString()}</span>
// //                       </div>
// //                       <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
// //                         <span>Total</span>
// //                         <span className="text-[#f06123]">₦{totalAmount.toLocaleString()}</span>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>

// //             {/* Footer */}
// //             {cart.length > 0 && (
// //               <div className="border-t border-gray-200 p-4 space-y-3">
// //                 <button
// //                   onClick={handleCheckout}
// //                   disabled={loading || !selectedBooking || activeBookings.length === 0}
// //                   className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
// //                 >
// //                   {loading ? (
// //                     <div className="flex items-center justify-center">
// //                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
// //                       Processing...
// //                     </div>
// //                   ) : (
// //                     `Proceed to Checkout - ₦${totalAmount.toLocaleString()}`
// //                   )}
// //                 </button>
                
// //                 <button
// //                   onClick={clearCart}
// //                   className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
// //                 >
// //                   Clear Cart
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
































// // // components/vendor/CartSidebar.tsx - Updated
// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import { useVendor } from '@/contexts/VendorContext';
// // // import { useAuth } from '@/contexts/AuthContext';
// // // import { useBooking } from '@/contexts/BookingContext';
// // // import { useRouter } from 'next/navigation';
// // // import Link from 'next/link';

// // // interface CartSidebarProps {
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // // }

// // // export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
// // //   const { 
// // //     cart, 
// // //     removeFromCart, 
// // //     updateCartItem, 
// // //     clearCart, 
// // //     getCartTotal,
// // //     createVendorOrder 
// // //   } = useVendor();
  
// // //   const { user } = useAuth();
// // //   const { bookings } = useBooking();
// // //   const router = useRouter();
  
// // //   const [loading, setLoading] = useState(false);
// // //   const [selectedBooking, setSelectedBooking] = useState('');
// // //   const [deliveryInstructions, setDeliveryInstructions] = useState('');
// // //   const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('');

// // //   const serviceFee = getCartTotal() * 0.1; // 10% service fee
// // //   const deliveryFee = 500; // Fixed delivery fee
// // //   const totalAmount = getCartTotal() + serviceFee + deliveryFee;

// // //   // Get upcoming confirmed bookings for delivery
// // //   const upcomingBookings = bookings.filter(booking => {
// // //     const checkOut = new Date(booking.checkOut);
// // //     const today = new Date();
// // //     return checkOut >= today && 
// // //            booking.bookingStatus === 'confirmed' && 
// // //            booking.paymentStatus === 'paid';
// // //   });

// // //   // Auto-select the first booking if only one exists
// // //   useEffect(() => {
// // //     if (upcomingBookings.length === 1 && !selectedBooking) {
// // //       setSelectedBooking(upcomingBookings[0]._id);
// // //     }
// // //   }, [upcomingBookings, selectedBooking]);

// // //   const handleCheckout = async () => {
// // //     if (!user) {
// // //       router.push('/login');
// // //       return;
// // //     }

// // //     if (cart.length === 0) {
// // //       alert('Your cart is empty');
// // //       return;
// // //     }

// // //     if (!selectedBooking) {
// // //       alert('Please select a booking for delivery');
// // //       return;
// // //     }

// // //     // Check if all items are from the same vendor
// // //     const vendors = [...new Set(cart.map(item => item.product.vendor._id))];
// // //     if (vendors.length > 1) {
// // //       alert('Please order from one vendor at a time. Your cart contains items from multiple vendors.');
// // //       return;
// // //     }

// // //     try {
// // //       setLoading(true);

// // //       const selectedBookingData = upcomingBookings.find(b => b._id === selectedBooking);
// // //       if (!selectedBookingData) {
// // //         throw new Error('Selected booking not found');
// // //       }

// // //       const orderData = {
// // //         bookingId: selectedBooking,
// // //         vendorId: vendors[0],
// // //         items: cart.map(item => ({
// // //           productId: item.product._id,
// // //           quantity: item.quantity,
// // //           specialInstructions: item.specialInstructions
// // //         })),
// // //         deliveryAddress: {
// // //           property: selectedBookingData.property.title,
// // //           unit: selectedBookingData.property.location,
// // //           specialInstructions: deliveryInstructions
// // //         },
// // //         preferredDeliveryTime: preferredDeliveryTime || undefined,
// // //         customerNotes: deliveryInstructions
// // //       };

// // //       const response = await createVendorOrder(orderData);
      
// // //       // Redirect to payment page
// // //       router.push(`/vendor/checkout/${response.order._id}`);
// // //       onClose();
      
// // //     } catch (error: any) {
// // //       console.error('Checkout error:', error);
// // //       alert(error.message || 'Failed to create order. Please try again.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const handleQuantityChange = (productId: string, newQuantity: number) => {
// // //     const product = cart.find(item => item.product._id === productId)?.product;
// // //     if (!product) return;

// // //     if (newQuantity < product.minOrderQuantity) {
// // //       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
// // //       return;
// // //     }

// // //     if (newQuantity > product.maxOrderQuantity) {
// // //       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
// // //       return;
// // //     }

// // //     if (newQuantity > product.stockQuantity) {
// // //       alert(`Only ${product.stockQuantity} items available in stock`);
// // //       return;
// // //     }

// // //     updateCartItem(productId, newQuantity);
// // //   };

// // //   if (!isOpen) return null;

// // //   return (
// // //     <div className="fixed inset-0 z-50 overflow-hidden">
// // //       {/* Backdrop */}
// // //       <div 
// // //         className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
// // //         onClick={onClose}
// // //       />
      
// // //       {/* Sidebar */}
// // //       <div className="absolute inset-y-0 right-0 max-w-full flex">
// // //         <div className="relative w-screen max-w-md">
// // //           <div className="h-full flex flex-col bg-white shadow-xl">
// // //             {/* Header */}
// // //             <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
// // //               <h2 className="text-lg font-semibold text-[#383a3c]">Shopping Cart</h2>
// // //               <button
// // //                 onClick={onClose}
// // //                 className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
// // //               >
// // //                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // //                 </svg>
// // //               </button>
// // //             </div>

// // //             {/* Cart Content */}
// // //             <div className="flex-1 overflow-y-auto">
// // //               {cart.length === 0 ? (
// // //                 <div className="flex flex-col items-center justify-center h-full p-8">
// // //                   <div className="text-6xl mb-4">🛒</div>
// // //                   <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
// // //                   <p className="text-gray-500 text-center mb-6">
// // //                     Add some products from the marketplace to get started
// // //                   </p>
// // //                   <button
// // //                     onClick={onClose}
// // //                     className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // //                   >
// // //                     Continue Shopping
// // //                   </button>
// // //                 </div>
// // //               ) : (
// // //                 <div className="p-4 space-y-4">
// // //                   {/* Vendor Info */}
// // //                   <div className="bg-blue-50 p-3 rounded-lg">
// // //                     <p className="text-sm text-blue-800">
// // //                       Ordering from: <strong>{cart[0]?.product.vendor.businessName}</strong>
// // //                     </p>
// // //                   </div>

// // //                   {/* Cart Items */}
// // //                   {cart.map((item) => (
// // //                     <div
// // //                       key={item.product._id}
// // //                       className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
// // //                     >
// // //                       <img
// // //                         src={item.product.images[0]?.url || '/default-product.jpg'}
// // //                         alt={item.product.name}
// // //                         className="w-16 h-16 rounded-lg object-cover"
// // //                       />
                      
// // //                       <div className="flex-1 min-w-0">
// // //                         <h4 className="font-semibold text-[#383a3c] text-sm line-clamp-1">
// // //                           {item.product.name}
// // //                         </h4>
// // //                         <p className="text-gray-600 text-sm">
// // //                           ₦{item.product.price.toLocaleString()} × {item.quantity}
// // //                         </p>
// // //                         <p className="text-[#f06123] font-semibold text-sm">
// // //                           ₦{(item.product.price * item.quantity).toLocaleString()}
// // //                         </p>
                        
// // //                         {item.specialInstructions && (
// // //                           <p className="text-gray-500 text-xs mt-1 line-clamp-1">
// // //                             Note: {item.specialInstructions}
// // //                           </p>
// // //                         )}
// // //                       </div>

// // //                       <div className="flex items-center space-x-2">
// // //                         <button
// // //                           onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
// // //                           disabled={item.quantity <= item.product.minOrderQuantity}
// // //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// // //                         >
// // //                           -
// // //                         </button>
// // //                         <span className="w-8 text-center text-sm">{item.quantity}</span>
// // //                         <button
// // //                           onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
// // //                           disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
// // //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// // //                         >
// // //                           +
// // //                         </button>
// // //                       </div>

// // //                       <button
// // //                         onClick={() => removeFromCart(item.product._id)}
// // //                         className="text-red-600 hover:text-red-700 p-1"
// // //                       >
// // //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
// // //                         </svg>
// // //                       </button>
// // //                     </div>
// // //                   ))}

// // //                   {/* Delivery Information */}
// // //                   <div className="p-4 border border-gray-200 rounded-lg">
// // //                     <h3 className="font-semibold text-[#383a3c] mb-3">Delivery Information</h3>
                    
// // //                     {/* Booking Selection */}
// // //                     <div className="mb-3">
// // //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                         Select Booking for Delivery *
// // //                       </label>
// // //                       {upcomingBookings.length === 0 ? (
// // //                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
// // //                           <p className="text-yellow-700 text-sm">
// // //                             No active bookings found. You need a confirmed, upcoming booking to place an order.
// // //                           </p>
// // //                           <Link 
// // //                             href="/dashboard/bookings"
// // //                             className="text-[#f06123] hover:text-orange-600 text-sm font-medium mt-2 inline-block"
// // //                           >
// // //                             View My Bookings
// // //                           </Link>
// // //                         </div>
// // //                       ) : (
// // //                         <select
// // //                           value={selectedBooking}
// // //                           onChange={(e) => setSelectedBooking(e.target.value)}
// // //                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// // //                           required
// // //                         >
// // //                           <option value="">Choose a booking...</option>
// // //                           {upcomingBookings.map(booking => (
// // //                             <option key={booking._id} value={booking._id}>
// // //                               {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
// // //                             </option>
// // //                           ))}
// // //                         </select>
// // //                       )}
// // //                     </div>

// // //                     {/* Preferred Delivery Time */}
// // //                     {selectedBooking && (
// // //                       <div className="mb-3">
// // //                         <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                           Preferred Delivery Time (Optional)
// // //                         </label>
// // //                         <input
// // //                           type="datetime-local"
// // //                           value={preferredDeliveryTime}
// // //                           onChange={(e) => setPreferredDeliveryTime(e.target.value)}
// // //                           className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// // //                         />
// // //                       </div>
// // //                     )}

// // //                     {/* Delivery Instructions */}
// // //                     <div>
// // //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                         Delivery Instructions (Optional)
// // //                       </label>
// // //                       <textarea
// // //                         value={deliveryInstructions}
// // //                         onChange={(e) => setDeliveryInstructions(e.target.value)}
// // //                         placeholder="Any special delivery instructions, gate codes, or specific locations..."
// // //                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
// // //                         rows={3}
// // //                       />
// // //                     </div>
// // //                   </div>

// // //                   {/* Order Summary */}
// // //                   <div className="p-4 border border-gray-200 rounded-lg">
// // //                     <h3 className="font-semibold text-[#383a3c] mb-3">Order Summary</h3>
                    
// // //                     <div className="space-y-2 text-sm">
// // //                       <div className="flex justify-between">
// // //                         <span>Subtotal</span>
// // //                         <span>₦{getCartTotal().toLocaleString()}</span>
// // //                       </div>
// // //                       <div className="flex justify-between">
// // //                         <span>Service Fee (10%)</span>
// // //                         <span>₦{serviceFee.toLocaleString()}</span>
// // //                       </div>
// // //                       <div className="flex justify-between">
// // //                         <span>Delivery Fee</span>
// // //                         <span>₦{deliveryFee.toLocaleString()}</span>
// // //                       </div>
// // //                       <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
// // //                         <span>Total</span>
// // //                         <span className="text-[#f06123]">₦{totalAmount.toLocaleString()}</span>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </div>

// // //             {/* Footer */}
// // //             {cart.length > 0 && (
// // //               <div className="border-t border-gray-200 p-4 space-y-3">
// // //                 <button
// // //                   onClick={handleCheckout}
// // //                   disabled={loading || !selectedBooking || upcomingBookings.length === 0}
// // //                   className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
// // //                 >
// // //                   {loading ? (
// // //                     <div className="flex items-center justify-center">
// // //                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
// // //                       Processing...
// // //                     </div>
// // //                   ) : (
// // //                     `Proceed to Checkout - ₦${totalAmount.toLocaleString()}`
// // //                   )}
// // //                 </button>
                
// // //                 <button
// // //                   onClick={clearCart}
// // //                   className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
// // //                 >
// // //                   Clear Cart
// // //                 </button>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // } 




























// // // 'use client';

// // // import { useState } from 'react';
// // // import { useVendor } from '@/contexts/VendorContext';
// // // import { useAuth } from '@/contexts/AuthContext';
// // // import { useBooking } from '@/contexts/BookingContext';
// // // import { useRouter } from 'next/navigation';

// // // interface CartSidebarProps {
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // // }

// // // export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
// // //   const { 
// // //     cart, 
// // //     removeFromCart, 
// // //     updateCartItem, 
// // //     clearCart, 
// // //     getCartTotal,
// // //     createVendorOrder 
// // //   } = useVendor();
  
// // //   const { user } = useAuth();
// // //   const { bookings } = useBooking();
// // //   const router = useRouter();
  
// // //   const [loading, setLoading] = useState(false);
// // //   const [selectedBooking, setSelectedBooking] = useState('');
// // //   const [deliveryInstructions, setDeliveryInstructions] = useState('');

// // //   const serviceFee = getCartTotal() * 0.1; // 10% service fee
// // //   const deliveryFee = 500; // Fixed delivery fee
// // //   const totalAmount = getCartTotal() + serviceFee + deliveryFee;

// // //   // Get upcoming bookings for delivery
// // //   const upcomingBookings = bookings.filter(booking => {
// // //     const checkOut = new Date(booking.checkOut);
// // //     return checkOut >= new Date() && booking.bookingStatus !== 'cancelled';
// // //   });

// // //   const handleCheckout = async () => {
// // //     if (!user) {
// // //       router.push('/login');
// // //       return;
// // //     }

// // //     if (cart.length === 0) {
// // //       alert('Your cart is empty');
// // //       return;
// // //     }

// // //     if (!selectedBooking) {
// // //       alert('Please select a booking for delivery');
// // //       return;
// // //     }

// // //     try {
// // //       setLoading(true);

// // //       const orderData = {
// // //         bookingId: selectedBooking,
// // //         vendorId: cart[0].product.vendor._id, // Assuming all items from same vendor
// // //         items: cart.map(item => ({
// // //           productId: item.product._id,
// // //           quantity: item.quantity,
// // //           specialInstructions: item.specialInstructions
// // //         })),
// // //         deliveryAddress: {
// // //           specialInstructions: deliveryInstructions
// // //         },
// // //         customerNotes: deliveryInstructions
// // //       };

// // //       const response = await createVendorOrder(orderData);
      
// // //       // Redirect to payment page
// // //       router.push(`/vendor/checkout/${response.order._id}`);
// // //       onClose();
      
// // //     } catch (error: any) {
// // //       alert(error.message || 'Failed to create order');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const handleQuantityChange = (productId: string, newQuantity: number) => {
// // //     const product = cart.find(item => item.product._id === productId)?.product;
// // //     if (!product) return;

// // //     if (newQuantity < product.minOrderQuantity) {
// // //       alert(`Minimum order quantity is ${product.minOrderQuantity}`);
// // //       return;
// // //     }

// // //     if (newQuantity > product.maxOrderQuantity) {
// // //       alert(`Maximum order quantity is ${product.maxOrderQuantity}`);
// // //       return;
// // //     }

// // //     if (newQuantity > product.stockQuantity) {
// // //       alert(`Only ${product.stockQuantity} items available in stock`);
// // //       return;
// // //     }

// // //     updateCartItem(productId, newQuantity);
// // //   };

// // //   if (!isOpen) return null;

// // //   return (
// // //     <div className="fixed inset-0 z-50 overflow-hidden">
// // //       {/* Backdrop */}
// // //       <div 
// // //         className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
// // //         onClick={onClose}
// // //       />
      
// // //       {/* Sidebar */}
// // //       <div className="absolute inset-y-0 right-0 max-w-full flex">
// // //         <div className="relative w-screen max-w-md">
// // //           <div className="h-full flex flex-col bg-white shadow-xl">
// // //             {/* Header */}
// // //             <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
// // //               <h2 className="text-lg font-semibold text-[#383a3c]">Shopping Cart</h2>
// // //               <button
// // //                 onClick={onClose}
// // //                 className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
// // //               >
// // //                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
// // //                 </svg>
// // //               </button>
// // //             </div>

// // //             {/* Cart Content */}
// // //             <div className="flex-1 overflow-y-auto">
// // //               {cart.length === 0 ? (
// // //                 <div className="flex flex-col items-center justify-center h-full p-8">
// // //                   <div className="text-6xl mb-4">🛒</div>
// // //                   <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
// // //                   <p className="text-gray-500 text-center mb-6">
// // //                     Add some products from the marketplace to get started
// // //                   </p>
// // //                   <button
// // //                     onClick={onClose}
// // //                     className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // //                   >
// // //                     Continue Shopping
// // //                   </button>
// // //                 </div>
// // //               ) : (
// // //                 <div className="p-4 space-y-4">
// // //                   {/* Cart Items */}
// // //                   {cart.map((item) => (
// // //                     <div
// // //                       key={item.product._id}
// // //                       className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
// // //                     >
// // //                       <img
// // //                         src={item.product.images[0]?.url || '/default-product.jpg'}
// // //                         alt={item.product.name}
// // //                         className="w-16 h-16 rounded-lg object-cover"
// // //                       />
                      
// // //                       <div className="flex-1 min-w-0">
// // //                         <h4 className="font-semibold text-[#383a3c] text-sm line-clamp-1">
// // //                           {item.product.name}
// // //                         </h4>
// // //                         <p className="text-gray-600 text-sm">
// // //                           ₦{item.product.price.toLocaleString()} × {item.quantity}
// // //                         </p>
// // //                         <p className="text-[#f06123] font-semibold text-sm">
// // //                           ₦{(item.product.price * item.quantity).toLocaleString()}
// // //                         </p>
                        
// // //                         {item.specialInstructions && (
// // //                           <p className="text-gray-500 text-xs mt-1 line-clamp-1">
// // //                             Note: {item.specialInstructions}
// // //                           </p>
// // //                         )}
// // //                       </div>

// // //                       <div className="flex items-center space-x-2">
// // //                         <button
// // //                           onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
// // //                           disabled={item.quantity <= item.product.minOrderQuantity}
// // //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// // //                         >
// // //                           -
// // //                         </button>
// // //                         <span className="w-8 text-center text-sm">{item.quantity}</span>
// // //                         <button
// // //                           onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
// // //                           disabled={item.quantity >= item.product.maxOrderQuantity || item.quantity >= item.product.stockQuantity}
// // //                           className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// // //                         >
// // //                           +
// // //                         </button>
// // //                       </div>

// // //                       <button
// // //                         onClick={() => removeFromCart(item.product._id)}
// // //                         className="text-red-600 hover:text-red-700 p-1"
// // //                       >
// // //                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
// // //                         </svg>
// // //                       </button>
// // //                     </div>
// // //                   ))}

// // //                   {/* Delivery Information */}
// // //                   <div className="p-4 border border-gray-200 rounded-lg">
// // //                     <h3 className="font-semibold text-[#383a3c] mb-3">Delivery Information</h3>
                    
// // //                     {/* Booking Selection */}
// // //                     <div className="mb-3">
// // //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                         Select Booking for Delivery *
// // //                       </label>
// // //                       <select
// // //                         value={selectedBooking}
// // //                         onChange={(e) => setSelectedBooking(e.target.value)}
// // //                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123]"
// // //                         required
// // //                       >
// // //                         <option value="">Choose a booking...</option>
// // //                         {upcomingBookings.map(booking => (
// // //                           <option key={booking._id} value={booking._id}>
// // //                             {booking.property.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
// // //                           </option>
// // //                         ))}
// // //                       </select>
// // //                     </div>

// // //                     {/* Delivery Instructions */}
// // //                     <div>
// // //                       <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                         Delivery Instructions (Optional)
// // //                       </label>
// // //                       <textarea
// // //                         value={deliveryInstructions}
// // //                         onChange={(e) => setDeliveryInstructions(e.target.value)}
// // //                         placeholder="Any special delivery instructions..."
// // //                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f06123] resize-none"
// // //                         rows={3}
// // //                       />
// // //                     </div>
// // //                   </div>

// // //                   {/* Order Summary */}
// // //                   <div className="p-4 border border-gray-200 rounded-lg">
// // //                     <h3 className="font-semibold text-[#383a3c] mb-3">Order Summary</h3>
                    
// // //                     <div className="space-y-2 text-sm">
// // //                       <div className="flex justify-between">
// // //                         <span>Subtotal</span>
// // //                         <span>₦{getCartTotal().toLocaleString()}</span>
// // //                       </div>
// // //                       <div className="flex justify-between">
// // //                         <span>Service Fee (10%)</span>
// // //                         <span>₦{serviceFee.toLocaleString()}</span>
// // //                       </div>
// // //                       <div className="flex justify-between">
// // //                         <span>Delivery Fee</span>
// // //                         <span>₦{deliveryFee.toLocaleString()}</span>
// // //                       </div>
// // //                       <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
// // //                         <span>Total</span>
// // //                         <span className="text-[#f06123]">₦{totalAmount.toLocaleString()}</span>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </div>

// // //             {/* Footer */}
// // //             {cart.length > 0 && (
// // //               <div className="border-t border-gray-200 p-4 space-y-3">
// // //                 <button
// // //                   onClick={handleCheckout}
// // //                   disabled={loading || !selectedBooking}
// // //                   className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
// // //                 >
// // //                   {loading ? (
// // //                     <div className="flex items-center justify-center">
// // //                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
// // //                       Processing...
// // //                     </div>
// // //                   ) : (
// // //                     `Proceed to Checkout - ₦${totalAmount.toLocaleString()}`
// // //                   )}
// // //                 </button>
                
// // //                 <button
// // //                   onClick={clearCart}
// // //                   className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
// // //                 >
// // //                   Clear Cart
// // //                 </button>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }