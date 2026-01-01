// app/dashboard/vendor-orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVendor } from '@/contexts/VendorContext';
import Link from 'next/link';

// interface VendorOrder {
//   _id: string;
//   orderNumber: string;
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone?: string;
//   };
//   vendor: {
//     _id: string;
//     businessName: string;
//     contactPerson?: {
//       name: string;
//       email: string;
//       phone: string;
//     };
//   };
//   booking: {
//     _id: string;
//     property: string;
//     checkIn: string;
//     checkOut: string;
//   };
//   items: Array<{
//     product: {
//       _id: string;
//       name: string;
//       description: string;
//       price: number;
//       images: Array<{ url: string }>;
//       preparationTime: number;
//     };
//     quantity: number;
//     price: number;
//     specialInstructions?: string;
//   }>;
//   subtotal: number;
//   serviceFee: number;
//   deliveryFee: number;
//   totalAmount: number;
//   orderStatus: string;
//   paymentStatus: string;
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   estimatedDeliveryTime?: string;
//   actualDeliveryTime?: string;
//   customerNotes: string;
//   vendorNotes: string;
//   createdAt: string;
//   updatedAt: string;
// }

interface VendorOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  vendor: {
    _id: string;
    businessName: string;
    contactPerson?: { // Make this optional
      name: string;
      email: string;
      phone: string;
    };
  };
  booking: {
    _id: string;
    property: string;
    checkIn: string;
    checkOut: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      description: string;
      price: number;
      images: Array<{ url: string }>;
      preparationTime: number;
    };
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryAddress: {
    property: string;
    unit: string;
    specialInstructions: string;
  };
  preferredDeliveryTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  customerNotes?: string; // Make optional
  vendorNotes?: string; // Make optional
  createdAt: string;
  updatedAt?: string; // Make optional
}

export default function VendorOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { vendorOrders, getUserVendorOrders } = useVendor();
  
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderId = params.id as string;

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get from context
        if (vendorOrders.length === 0) {
          console.log('No vendor orders in context, fetching...');
          await getUserVendorOrders();
        } else {
          console.log('Vendor orders in context:', vendorOrders);
          const foundOrder = vendorOrders.find(order => order._id === orderId);
          if (foundOrder) {
            console.log('Found order in context:', foundOrder);
            setOrder(foundOrder);
          } else {
            setError('Order not found in your orders list');
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [vendorOrders, orderId, getUserVendorOrders]);

  // Additional effect to handle when vendorOrders updates
  useEffect(() => {
    if (vendorOrders.length > 0 && !order) {
      const foundOrder = vendorOrders.find(order => order._id === orderId);
      if (foundOrder) {
        console.log('Found order after context update:', foundOrder);
        setOrder(foundOrder);
        setError(null);
      } else {
        setError('Order not found in your orders list');
      }
      setLoading(false);
    }
  }, [vendorOrders, orderId, order]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Updated getImageUrl function
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

  // Safe vendor contact information getter
  const getVendorContactInfo = (vendor: VendorOrder['vendor']) => {
    if (!vendor.contactPerson) {
      return {
        name: 'Not Available',
        email: 'Not Available',
        phone: 'Not Available'
      };
    }
    return vendor.contactPerson;
  };

  // Safe product name getter
  const getProductName = (product: any) => {
    if (!product) return 'Unknown Product';
    if (typeof product === 'string') return 'Product (ID only)';
    return product.name || 'Unnamed Product';
  };

  // Safe product description getter
  const getProductDescription = (product: any) => {
    if (!product || typeof product === 'string') return 'No description available';
    return product.description || 'No description available';
  };

  // Safe product preparation time getter
  const getProductPreparationTime = (product: any) => {
    if (!product || typeof product === 'string') return 0;
    return product.preparationTime || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
          <p className="text-gray-500 text-sm mt-2">Order ID: {orderId}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg mb-2">{error || 'Order not found'}</div>
          <p className="text-gray-600 mb-4">
            {error || "The order you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard/vendor-orders')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
            >
              Back to Orders
            </button>
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vendorContact = getVendorContactInfo(order.vendor);

  console.log('Rendering order:', order);
  console.log('Order items:', order.items);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#383a3c]">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <Link
            href="/dashboard/vendor-orders"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
          >
            Back to Orders
          </Link>
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-wrap gap-3 mt-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
            Order: {order.orderStatus.replace('_', ' ')}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
            Payment: {order.paymentStatus}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Ordered: {formatDate(order.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  const productName = getProductName(item.product);
                  const productDescription = getProductDescription(item.product);
                  const preparationTime = getProductPreparationTime(item.product);
                  
                  return (
                    <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
                      <img
                        src={getImageUrl(item.product?.images)}
                        alt={productName}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-product.jpg';
                        }}
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#383a3c]">{productName}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{productDescription}</p>
                        <p className="text-gray-500 text-sm">Preparation: {preparationTime} mins</p>
                        
                        {item.specialInstructions && (
                          <p className="text-gray-500 text-sm mt-1">
                            <strong>Special Instructions:</strong> {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-[#383a3c]">
                          ₦{item.price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-[#f06123] font-bold">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items found in this order
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee (10%)</span>
                <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Property</span>
                <span className="font-medium text-right">{order.deliveryAddress?.property || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address</span>
                <span className="font-medium text-right">{order.deliveryAddress?.unit || 'Not specified'}</span>
              </div>
              {order.booking && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Period</span>
                  <span className="font-medium text-right">
                    {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
                  </span>
                </div>
              )}
              {order.preferredDeliveryTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Delivery Time</span>
                  <span className="font-medium text-right">
                    {formatDate(order.preferredDeliveryTime)}
                  </span>
                </div>
              )}
              {order.deliveryAddress?.specialInstructions && (
                <div>
                  <span className="text-gray-600 block mb-1">Special Instructions</span>
                  <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
                </div>
              )}
              {order.customerNotes && (
                <div>
                  <span className="text-gray-600 block mb-1">Your Notes</span>
                  <p className="font-medium">{order.customerNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
                {order.vendor?.businessName?.charAt(0).toUpperCase() || 'V'}
              </div>
              <div>
                <h3 className="font-semibold text-[#383a3c]">{order.vendor?.businessName || 'Vendor'}</h3>
                <p className="text-gray-600 text-sm">Contact: {vendorContact.name}</p>
                <p className="text-gray-600 text-sm">{vendorContact.phone}</p>
                <p className="text-gray-600 text-sm">{vendorContact.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline & Actions */}
        <div className="space-y-6">
          {/* Order Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Timeline</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <p className="font-medium">Order Confirmed</p>
                  <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  ['preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <p className="font-medium">Preparing Order</p>
                  {order.orderStatus === 'preparing' && order.estimatedDeliveryTime && (
                    <p className="text-gray-500 text-sm">
                      Estimated: {formatTime(order.estimatedDeliveryTime)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  ['out_for_delivery', 'delivered'].includes(order.orderStatus) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <p className="font-medium">Out for Delivery</p>
                  {order.orderStatus === 'out_for_delivery' && (
                    <p className="text-gray-500 text-sm">On the way to you</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <p className="font-medium">Delivered</p>
                  {order.actualDeliveryTime && (
                    <p className="text-gray-500 text-sm">{formatDate(order.actualDeliveryTime)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-3">
              Contact our support team for any questions about your order.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">📞 +234-800-123-4567</p>
              <p className="text-gray-600">✉️ support@holsapartments.com</p>
              <p className="text-gray-600">🕒 Mon-Sun: 8:00 AM - 10:00 PM</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-[#383a3c] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition duration-200"
              >
                Print Receipt
              </button>
              <Link
                href="/marketplace"
                className="block w-full bg-[#f06123] text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition duration-200 text-center"
              >
                Order Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}














































// // app/dashboard/vendor-orders/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import Link from 'next/link';

// interface VendorOrder {
//   _id: string;
//   orderNumber: string;
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone?: string;
//   };
//   vendor: {
//     _id: string;
//     businessName: string;
//     contactPerson?: {
//       name: string;
//       email: string;
//       phone: string;
//     };
//   };
//   booking: {
//     _id: string;
//     property: string;
//     checkIn: string;
//     checkOut: string;
//   };
//   items: Array<{
//     product: {
//       _id: string;
//       name: string;
//       description: string;
//       price: number;
//       images: Array<{ url: string }>;
//       preparationTime: number;
//     };
//     quantity: number;
//     price: number;
//     specialInstructions?: string;
//   }>;
//   subtotal: number;
//   serviceFee: number;
//   deliveryFee: number;
//   totalAmount: number;
//   orderStatus: string;
//   paymentStatus: string;
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   estimatedDeliveryTime?: string;
//   actualDeliveryTime?: string;
//   customerNotes: string;
//   vendorNotes: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export default function VendorOrderDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { vendorOrders, getUserVendorOrders } = useVendor();
  
//   const [order, setOrder] = useState<VendorOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const orderId = params.id as string;

//   useEffect(() => {
//     if (vendorOrders.length === 0) {
//       getUserVendorOrders();
//     }
//   }, [vendorOrders, getUserVendorOrders]);

//   useEffect(() => {
//     if (vendorOrders.length > 0) {
//       const foundOrder = vendorOrders.find(order => order._id === orderId);
//       if (foundOrder) {
//         setOrder(foundOrder);
//       }
//       setLoading(false);
//     }
//   }, [vendorOrders, orderId]);

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'preparing': return 'bg-blue-100 text-blue-800';
//       case 'out_for_delivery': return 'bg-yellow-100 text-yellow-800';
//       case 'delivered': return 'bg-green-100 text-green-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getPaymentStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'failed': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   // Updated getImageUrl function
//   const getImageUrl = (images: Array<{ url: string }> | undefined) => {
//     // Safe check for images array
//     if (!images || !Array.isArray(images) || images.length === 0 || !images[0]?.url) {
//       return '/default-product.jpg';
//     }
    
//     const imagePath = images[0].url;
    
//     if (imagePath.startsWith('http')) return imagePath;
//     if (imagePath.startsWith('/uploads/')) {
//       const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//       return `${baseUrl}${imagePath}`;
//     }
//     return imagePath;
//   };

//   // Safe vendor contact information getter
//   const getVendorContactInfo = (vendor: VendorOrder['vendor']) => {
//     if (!vendor.contactPerson) {
//       return {
//         name: 'Not Available',
//         email: 'Not Available',
//         phone: 'Not Available'
//       };
//     }
//     return vendor.contactPerson;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading order details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center max-w-md">
//           <div className="text-red-600 text-lg mb-2">Order not found</div>
//           <p className="text-gray-600 mb-4">
//             The order you're looking for doesn't exist or you don't have permission to view it.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 justify-center">
//             <button
//               onClick={() => router.push('/dashboard/vendor-orders')}
//               className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//             >
//               Back to Orders
//             </button>
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Browse Marketplace
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const vendorContact = getVendorContactInfo(order.vendor);

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-[#383a3c]">Order Details</h1>
//             <p className="text-gray-600">Order #{order.orderNumber}</p>
//           </div>
//           <Link
//             href="/dashboard/vendor-orders"
//             className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//           >
//             Back to Orders
//           </Link>
//         </div>
        
//         {/* Status Badges */}
//         <div className="flex flex-wrap gap-3 mt-4">
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
//             Order: {order.orderStatus.replace('_', ' ')}
//           </span>
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
//             Payment: {order.paymentStatus}
//           </span>
//           <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
//             Ordered: {formatDate(order.createdAt)}
//           </span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Order Details */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Order Items */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Items</h2>
            
//             <div className="space-y-4">
//               {order.items.map((item, index) => (
//                 <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
//                   <img
//                     src={getImageUrl(item.product.images)}
//                     alt={item.product.name}
//                     className="w-16 h-16 rounded-lg object-cover"
//                     onError={(e) => {
//                       (e.target as HTMLImageElement).src = '/default-product.jpg';
//                     }}
//                   />
                  
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
//                     <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
//                     <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                    
//                     {item.specialInstructions && (
//                       <p className="text-gray-500 text-sm mt-1">
//                         <strong>Special Instructions:</strong> {item.specialInstructions}
//                       </p>
//                     )}
//                   </div>

//                   <div className="text-right">
//                     <p className="font-semibold text-[#383a3c]">
//                       ₦{item.price.toLocaleString()} × {item.quantity}
//                     </p>
//                     <p className="text-[#f06123] font-bold">
//                       ₦{(item.price * item.quantity).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Price Breakdown */}
//             <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Subtotal</span>
//                 <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Service Fee (10%)</span>
//                 <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Delivery Fee</span>
//                 <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
//                 <span>Total</span>
//                 <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
//               </div>
//             </div>
//           </div>

//           {/* Delivery Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
            
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Property</span>
//                 <span className="font-medium text-right">{order.deliveryAddress.property}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Address</span>
//                 <span className="font-medium text-right">{order.deliveryAddress.unit}</span>
//               </div>
//               {order.booking && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Booking Period</span>
//                   <span className="font-medium text-right">
//                     {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
//                   </span>
//                 </div>
//               )}
//               {order.preferredDeliveryTime && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Preferred Delivery Time</span>
//                   <span className="font-medium text-right">
//                     {formatDate(order.preferredDeliveryTime)}
//                   </span>
//                 </div>
//               )}
//               {order.deliveryAddress.specialInstructions && (
//                 <div>
//                   <span className="text-gray-600 block mb-1">Special Instructions</span>
//                   <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
//                 </div>
//               )}
//               {order.customerNotes && (
//                 <div>
//                   <span className="text-gray-600 block mb-1">Your Notes</span>
//                   <p className="font-medium">{order.customerNotes}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Vendor Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
            
//             <div className="flex items-center space-x-4">
//               <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
//                 {order.vendor.businessName?.charAt(0).toUpperCase() || 'V'}
//               </div>
//               <div>
//                 <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName || 'Vendor'}</h3>
//                 <p className="text-gray-600 text-sm">Contact: {vendorContact.name}</p>
//                 <p className="text-gray-600 text-sm">{vendorContact.phone}</p>
//                 <p className="text-gray-600 text-sm">{vendorContact.email}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Order Timeline & Actions */}
//         <div className="space-y-6">
//           {/* Order Timeline */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Timeline</h2>
            
//             <div className="space-y-4">
//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Order Confirmed</p>
//                   <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Preparing Order</p>
//                   {order.orderStatus === 'preparing' && order.estimatedDeliveryTime && (
//                     <p className="text-gray-500 text-sm">
//                       Estimated: {formatTime(order.estimatedDeliveryTime)}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Out for Delivery</p>
//                   {order.orderStatus === 'out_for_delivery' && (
//                     <p className="text-gray-500 text-sm">On the way to you</p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Delivered</p>
//                   {order.actualDeliveryTime && (
//                     <p className="text-gray-500 text-sm">{formatDate(order.actualDeliveryTime)}</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Support Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
//             <p className="text-gray-600 text-sm mb-3">
//               Contact our support team for any questions about your order.
//             </p>
//             <div className="space-y-2 text-sm">
//               <p className="text-gray-600">📞 +234-800-123-4567</p>
//               <p className="text-gray-600">✉️ support@holsapartments.com</p>
//               <p className="text-gray-600">🕒 Mon-Sun: 8:00 AM - 10:00 PM</p>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="font-semibold text-[#383a3c] mb-3">Quick Actions</h3>
//             <div className="space-y-2">
//               <button
//                 onClick={() => window.print()}
//                 className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition duration-200"
//               >
//                 Print Receipt
//               </button>
//               <Link
//                 href="/marketplace"
//                 className="block w-full bg-[#f06123] text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition duration-200 text-center"
//               >
//                 Order Again
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }







































// // app/dashboard/vendor-orders/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import Link from 'next/link';

// interface VendorOrder {
//   _id: string;
//   orderNumber: string;
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone?: string;
//   };
//   vendor: {
//     _id: string;
//     businessName: string;
//     contactPerson: {
//       name: string;
//       email: string;
//       phone: string;
//     };
//   };
//   booking: {
//     _id: string;
//     property: string;
//     checkIn: string;
//     checkOut: string;
//   };
//   items: Array<{
//     product: {
//       _id: string;
//       name: string;
//       description: string;
//       price: number;
//       images: Array<{ url: string }>;
//       preparationTime: number;
//     };
//     quantity: number;
//     price: number;
//     specialInstructions?: string;
//   }>;
//   subtotal: number;
//   serviceFee: number;
//   deliveryFee: number;
//   totalAmount: number;
//   orderStatus: string;
//   paymentStatus: string;
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   estimatedDeliveryTime?: string;
//   actualDeliveryTime?: string;
//   customerNotes: string;
//   vendorNotes: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export default function VendorOrderDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { vendorOrders, getUserVendorOrders } = useVendor();
  
//   const [order, setOrder] = useState<VendorOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const orderId = params.id as string;

//   useEffect(() => {
//     if (vendorOrders.length === 0) {
//       getUserVendorOrders();
//     }
//   }, [vendorOrders, getUserVendorOrders]);

//   useEffect(() => {
//     if (vendorOrders.length > 0) {
//       const foundOrder = vendorOrders.find(order => order._id === orderId);
//       if (foundOrder) {
//         setOrder(foundOrder);
//       }
//       setLoading(false);
//     }
//   }, [vendorOrders, orderId]);

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'preparing': return 'bg-blue-100 text-blue-800';
//       case 'out_for_delivery': return 'bg-yellow-100 text-yellow-800';
//       case 'delivered': return 'bg-green-100 text-green-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getPaymentStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'failed': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   // Updated getImageUrl function
//   const getImageUrl = (images: Array<{ url: string }> | undefined) => {
//     // Safe check for images array
//     if (!images || !Array.isArray(images) || images.length === 0 || !images[0]?.url) {
//       return '/default-product.jpg';
//     }
    
//     const imagePath = images[0].url;
    
//     if (imagePath.startsWith('http')) return imagePath;
//     if (imagePath.startsWith('/uploads/')) {
//       const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//       return `${baseUrl}${imagePath}`;
//     }
//     return imagePath;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading order details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center max-w-md">
//           <div className="text-red-600 text-lg mb-2">Order not found</div>
//           <p className="text-gray-600 mb-4">
//             The order you're looking for doesn't exist or you don't have permission to view it.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 justify-center">
//             <button
//               onClick={() => router.push('/dashboard/vendor-orders')}
//               className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//             >
//               Back to Orders
//             </button>
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Browse Marketplace
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-[#383a3c]">Order Details</h1>
//             <p className="text-gray-600">Order #{order.orderNumber}</p>
//           </div>
//           <Link
//             href="/dashboard/vendor-orders"
//             className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//           >
//             Back to Orders
//           </Link>
//         </div>
        
//         {/* Status Badges */}
//         <div className="flex flex-wrap gap-3 mt-4">
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
//             Order: {order.orderStatus.replace('_', ' ')}
//           </span>
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
//             Payment: {order.paymentStatus}
//           </span>
//           <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
//             Ordered: {formatDate(order.createdAt)}
//           </span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Order Details */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Order Items */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Items</h2>
            
//             <div className="space-y-4">
//               {order.items.map((item, index) => (
//                 <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
//                   <img
//                     src={getImageUrl(item.product.images)}
//                     alt={item.product.name}
//                     className="w-16 h-16 rounded-lg object-cover"
//                     onError={(e) => {
//                       (e.target as HTMLImageElement).src = '/default-product.jpg';
//                     }}
//                   />
                  
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
//                     <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
//                     <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                    
//                     {item.specialInstructions && (
//                       <p className="text-gray-500 text-sm mt-1">
//                         <strong>Special Instructions:</strong> {item.specialInstructions}
//                       </p>
//                     )}
//                   </div>

//                   <div className="text-right">
//                     <p className="font-semibold text-[#383a3c]">
//                       ₦{item.price.toLocaleString()} × {item.quantity}
//                     </p>
//                     <p className="text-[#f06123] font-bold">
//                       ₦{(item.price * item.quantity).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Price Breakdown */}
//             <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Subtotal</span>
//                 <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Service Fee (10%)</span>
//                 <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Delivery Fee</span>
//                 <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
//                 <span>Total</span>
//                 <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
//               </div>
//             </div>
//           </div>

//           {/* Delivery Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
            
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Property</span>
//                 <span className="font-medium text-right">{order.deliveryAddress.property}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Address</span>
//                 <span className="font-medium text-right">{order.deliveryAddress.unit}</span>
//               </div>
//               {order.booking && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Booking Period</span>
//                   <span className="font-medium text-right">
//                     {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
//                   </span>
//                 </div>
//               )}
//               {order.preferredDeliveryTime && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Preferred Delivery Time</span>
//                   <span className="font-medium text-right">
//                     {formatDate(order.preferredDeliveryTime)}
//                   </span>
//                 </div>
//               )}
//               {order.deliveryAddress.specialInstructions && (
//                 <div>
//                   <span className="text-gray-600 block mb-1">Special Instructions</span>
//                   <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
//                 </div>
//               )}
//               {order.customerNotes && (
//                 <div>
//                   <span className="text-gray-600 block mb-1">Your Notes</span>
//                   <p className="font-medium">{order.customerNotes}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Vendor Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
            
//             <div className="flex items-center space-x-4">
//               <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
//                 {order.vendor.businessName.charAt(0).toUpperCase()}
//               </div>
//               <div>
//                 <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName}</h3>
//                 <p className="text-gray-600 text-sm">Contact: {order.vendor.contactPerson.name}</p>
//                 <p className="text-gray-600 text-sm">{order.vendor.contactPerson.phone}</p>
//                 <p className="text-gray-600 text-sm">{order.vendor.contactPerson.email}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Order Timeline & Actions */}
//         <div className="space-y-6">
//           {/* Order Timeline */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Timeline</h2>
            
//             <div className="space-y-4">
//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Order Confirmed</p>
//                   <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Preparing Order</p>
//                   {order.orderStatus === 'preparing' && order.estimatedDeliveryTime && (
//                     <p className="text-gray-500 text-sm">
//                       Estimated: {formatTime(order.estimatedDeliveryTime)}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Out for Delivery</p>
//                   {order.orderStatus === 'out_for_delivery' && (
//                     <p className="text-gray-500 text-sm">On the way to you</p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Delivered</p>
//                   {order.actualDeliveryTime && (
//                     <p className="text-gray-500 text-sm">{formatDate(order.actualDeliveryTime)}</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Support Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
//             <p className="text-gray-600 text-sm mb-3">
//               Contact our support team for any questions about your order.
//             </p>
//             <div className="space-y-2 text-sm">
//               <p className="text-gray-600">📞 +234-800-123-4567</p>
//               <p className="text-gray-600">✉️ support@holsapartments.com</p>
//               <p className="text-gray-600">🕒 Mon-Sun: 8:00 AM - 10:00 PM</p>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="font-semibold text-[#383a3c] mb-3">Quick Actions</h3>
//             <div className="space-y-2">
//               <button
//                 onClick={() => window.print()}
//                 className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition duration-200"
//               >
//                 Print Receipt
//               </button>
//               <Link
//                 href="/marketplace"
//                 className="block w-full bg-[#f06123] text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition duration-200 text-center"
//               >
//                 Order Again
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


















































// // app/dashboard/vendor-orders/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import Link from 'next/link';

// interface VendorOrder {
//   _id: string;
//   orderNumber: string;
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone?: string;
//   };
//   vendor: {
//     _id: string;
//     businessName: string;
//     contactPerson: {
//       name: string;
//       email: string;
//       phone: string;
//     };
//   };
//   booking: {
//     _id: string;
//     property: string;
//     checkIn: string;
//     checkOut: string;
//   };
//   items: Array<{
//     product: {
//       _id: string;
//       name: string;
//       description: string;
//       price: number;
//       images: Array<{ url: string }>;
//       preparationTime: number;
//     };
//     quantity: number;
//     price: number;
//     specialInstructions?: string;
//   }>;
//   subtotal: number;
//   serviceFee: number;
//   deliveryFee: number;
//   totalAmount: number;
//   orderStatus: string;
//   paymentStatus: string;
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   estimatedDeliveryTime?: string;
//   actualDeliveryTime?: string;
//   customerNotes: string;
//   vendorNotes: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export default function VendorOrderDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { vendorOrders, getUserVendorOrders } = useVendor();
  
//   const [order, setOrder] = useState<VendorOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const orderId = params.id as string;

//   useEffect(() => {
//     if (vendorOrders.length === 0) {
//       getUserVendorOrders();
//     }
//   }, [vendorOrders, getUserVendorOrders]);

//   useEffect(() => {
//     if (vendorOrders.length > 0) {
//       const foundOrder = vendorOrders.find(order => order._id === orderId);
//       if (foundOrder) {
//         setOrder(foundOrder);
//       }
//       setLoading(false);
//     }
//   }, [vendorOrders, orderId]);

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'preparing': return 'bg-blue-100 text-blue-800';
//       case 'out_for_delivery': return 'bg-yellow-100 text-yellow-800';
//       case 'delivered': return 'bg-green-100 text-green-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getPaymentStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'failed': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getImageUrl = (imagePath: string) => {
//     if (!imagePath) return '/default-product.jpg';
//     if (imagePath.startsWith('http')) return imagePath;
//     if (imagePath.startsWith('/uploads/')) {
//       const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//       return `${baseUrl}${imagePath}`;
//     }
//     return imagePath;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading order details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center max-w-md">
//           <div className="text-red-600 text-lg mb-2">Order not found</div>
//           <p className="text-gray-600 mb-4">
//             The order you're looking for doesn't exist or you don't have permission to view it.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 justify-center">
//             <button
//               onClick={() => router.push('/dashboard/vendor-orders')}
//               className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//             >
//               Back to Orders
//             </button>
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Browse Marketplace
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-[#383a3c]">Order Details</h1>
//             <p className="text-gray-600">Order #{order.orderNumber}</p>
//           </div>
//           <Link
//             href="/dashboard/vendor-orders"
//             className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//           >
//             Back to Orders
//           </Link>
//         </div>
        
//         {/* Status Badges */}
//         <div className="flex flex-wrap gap-3 mt-4">
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
//             Order: {order.orderStatus.replace('_', ' ')}
//           </span>
//           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
//             Payment: {order.paymentStatus}
//           </span>
//           <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
//             Ordered: {formatDate(order.createdAt)}
//           </span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Order Details */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Order Items */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Items</h2>
            
//             <div className="space-y-4">
//               {order.items.map((item, index) => (
//                 <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
//                   <img
//                     src={getImageUrl(item.product.images[0]?.url)}
//                     alt={item.product.name}
//                     className="w-16 h-16 rounded-lg object-cover"
//                     onError={(e) => {
//                       (e.target as HTMLImageElement).src = '/default-product.jpg';
//                     }}
//                   />
                  
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
//                     <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
//                     <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                    
//                     {item.specialInstructions && (
//                       <p className="text-gray-500 text-sm mt-1">
//                         <strong>Special Instructions:</strong> {item.specialInstructions}
//                       </p>
//                     )}
//                   </div>

//                   <div className="text-right">
//                     <p className="font-semibold text-[#383a3c]">
//                       ₦{item.price.toLocaleString()} × {item.quantity}
//                     </p>
//                     <p className="text-[#f06123] font-bold">
//                       ₦{(item.price * item.quantity).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Price Breakdown */}
//             <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Subtotal</span>
//                 <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Service Fee (10%)</span>
//                 <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600">Delivery Fee</span>
//                 <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
//                 <span>Total</span>
//                 <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
//               </div>
//             </div>
//           </div>

//           {/* Delivery Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
            
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Property</span>
//                 <span className="font-medium text-right">{order.deliveryAddress.property}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Address</span>
//                 <span className="font-medium text-right">{order.deliveryAddress.unit}</span>
//               </div>
//               {order.booking && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Booking Period</span>
//                   <span className="font-medium text-right">
//                     {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
//                   </span>
//                 </div>
//               )}
//               {order.preferredDeliveryTime && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Preferred Delivery Time</span>
//                   <span className="font-medium text-right">
//                     {formatDate(order.preferredDeliveryTime)}
//                   </span>
//                 </div>
//               )}
//               {order.deliveryAddress.specialInstructions && (
//                 <div>
//                   <span className="text-gray-600 block mb-1">Special Instructions</span>
//                   <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
//                 </div>
//               )}
//               {order.customerNotes && (
//                 <div>
//                   <span className="text-gray-600 block mb-1">Your Notes</span>
//                   <p className="font-medium">{order.customerNotes}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Vendor Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
            
//             <div className="flex items-center space-x-4">
//               <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
//                 {order.vendor.businessName.charAt(0).toUpperCase()}
//               </div>
//               <div>
//                 <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName}</h3>
//                 <p className="text-gray-600 text-sm">Contact: {order.vendor.contactPerson.name}</p>
//                 <p className="text-gray-600 text-sm">{order.vendor.contactPerson.phone}</p>
//                 <p className="text-gray-600 text-sm">{order.vendor.contactPerson.email}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Order Timeline & Actions */}
//         <div className="space-y-6">
//           {/* Order Timeline */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Timeline</h2>
            
//             <div className="space-y-4">
//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Order Confirmed</p>
//                   <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Preparing Order</p>
//                   {order.orderStatus === 'preparing' && order.estimatedDeliveryTime && (
//                     <p className="text-gray-500 text-sm">
//                       Estimated: {formatTime(order.estimatedDeliveryTime)}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   ['out_for_delivery', 'delivered'].includes(order.orderStatus) 
//                     ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Out for Delivery</p>
//                   {order.orderStatus === 'out_for_delivery' && (
//                     <p className="text-gray-500 text-sm">On the way to you</p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//                 <div>
//                   <p className="font-medium">Delivered</p>
//                   {order.actualDeliveryTime && (
//                     <p className="text-gray-500 text-sm">{formatDate(order.actualDeliveryTime)}</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Support Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
//             <p className="text-gray-600 text-sm mb-3">
//               Contact our support team for any questions about your order.
//             </p>
//             <div className="space-y-2 text-sm">
//               <p className="text-gray-600">📞 +234-800-123-4567</p>
//               <p className="text-gray-600">✉️ support@holsapartments.com</p>
//               <p className="text-gray-600">🕒 Mon-Sun: 8:00 AM - 10:00 PM</p>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="font-semibold text-[#383a3c] mb-3">Quick Actions</h3>
//             <div className="space-y-2">
//               <button
//                 onClick={() => window.print()}
//                 className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition duration-200"
//               >
//                 Print Receipt
//               </button>
//               <Link
//                 href="/marketplace"
//                 className="block w-full bg-[#f06123] text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition duration-200 text-center"
//               >
//                 Order Again
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

