'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVendor } from '@/contexts/VendorContext';
import { useAuth } from '@/contexts/AuthContext';
import { vendorAPI } from '@/lib/api';

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
    contactPerson?: { // Made optional
      name: string;
      email: string;
      phone: string;
    };
  };
  booking?: { // Made optional
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
      images?: Array<{ url: string }>;
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
  deliveryAddress?: { // Made optional
    property: string;
    unit: string;
    specialInstructions: string;
  };
  preferredDeliveryTime?: string;
  customerNotes: string;
  orderStatus: string;
  paymentStatus: string;
}

export default function VendorCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { initializeVendorPayment, verifyVendorPayment } = useVendor();
  
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const orderId = params.id as string;

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await vendorAPI.getUserVendorOrders();
      
      if (response.orders && Array.isArray(response.orders)) {
        const foundOrder = response.orders.find((order: VendorOrder) => order._id === orderId);
        
        if (foundOrder) {
          // Ensure all nested properties exist
          const processedOrder: VendorOrder = {
            ...foundOrder,
            vendor: {
              _id: foundOrder.vendor?._id || 'unknown',
              businessName: foundOrder.vendor?.businessName || 'Unknown Vendor',
              contactPerson: foundOrder.vendor?.contactPerson || {
                name: 'Not specified',
                email: 'Not specified',
                phone: 'Not specified'
              }
            },
            booking: foundOrder.booking || {
              _id: 'unknown',
              property: 'Not specified',
              checkIn: new Date().toISOString(),
              checkOut: new Date().toISOString()
            },
            deliveryAddress: foundOrder.deliveryAddress || {
              property: 'Not specified',
              unit: 'Not specified',
              specialInstructions: ''
            },
            // items: foundOrder.items?.map(item => ({
            items: foundOrder.items?.map((item: any) => ({
              ...item,
              product: {
                ...item.product,
                images: item.product.images || []
              }
            })) || []
          };
          setOrder(processedOrder);
        } else {
          setError('Order not found in your orders');
        }
      } else {
        setError('Failed to load orders');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order || !user) return;

    if (order.paymentStatus === 'paid') {
      setError('This order has already been paid');
      return;
    }

    if (order.orderStatus === 'cancelled') {
      setError('This order has been cancelled');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      console.log('Initializing payment for order:', order._id);
      const paymentData = await initializeVendorPayment(order._id, user.email);
      
      if (paymentData && paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setError(error.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefresh = () => {
    fetchOrderDetails();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Safe image URL handling
  const getImageUrl = (item: any) => {
    try {
      if (item?.product?.images && 
          Array.isArray(item.product.images) && 
          item.product.images.length > 0 && 
          item.product.images[0]?.url) {
        
        const imageUrl = item.product.images[0].url;
        
        if (!imageUrl) return '/default-product.jpg';
        if (imageUrl.startsWith('http')) return imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          return `${baseUrl}${imageUrl}`;
        }
        return imageUrl;
      }
      return '/default-product.jpg';
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '/default-product.jpg';
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = '/default-product.jpg';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'preparing': return 'text-blue-600 bg-blue-50';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  // Safe getter functions for nested properties
  const getVendorBusinessName = () => {
    return order?.vendor?.businessName || 'Unknown Vendor';
  };

  const getContactPersonName = () => {
    return order?.vendor?.contactPerson?.name || 'Not specified';
  };

  const getContactPersonPhone = () => {
    return order?.vendor?.contactPerson?.phone || 'Not specified';
  };

  const getContactPersonEmail = () => {
    return order?.vendor?.contactPerson?.email || 'Not specified';
  };

  const getDeliveryProperty = () => {
    return order?.deliveryAddress?.property || 'Not specified';
  };

  const getDeliveryUnit = () => {
    return order?.deliveryAddress?.unit || 'Not specified';
  };

  const getDeliveryInstructions = () => {
    return order?.deliveryAddress?.specialInstructions || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg mb-2">Order not found</div>
          <p className="text-gray-600 mb-4">
            {error || "The order you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#383a3c] mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your vendor order payment</p>
          
          {/* Order Status Badges */}
          <div className="flex justify-center gap-3 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.orderStatus)}`}>
              Order: {order.orderStatus.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
              Payment: {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-[#383a3c]">Order Summary</h2>
                <span className="text-sm text-gray-500">#{order.orderNumber}</span>
              </div>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                    <img
                      src={getImageUrl(item)}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={handleImageError}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
                      <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                      
                      {item.specialInstructions && (
                        <p className="text-gray-500 text-sm mt-1">
                          <strong>Note:</strong> {item.specialInstructions}
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
                ))}
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
                  <span className="font-medium text-right">{getDeliveryProperty()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address</span>
                  <span className="font-medium text-right">{getDeliveryUnit()}</span>
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
                    <span className="text-gray-600">Preferred Delivery</span>
                    <span className="font-medium text-right">
                      {formatDateTime(order.preferredDeliveryTime)}
                    </span>
                  </div>
                )}
                {getDeliveryInstructions() && (
                  <div>
                    <span className="text-gray-600 block mb-1">Special Instructions</span>
                    <p className="font-medium">{getDeliveryInstructions()}</p>
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
                  {getVendorBusinessName().charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-[#383a3c]">{getVendorBusinessName()}</h3>
                  <p className="text-gray-600 text-sm">Contact: {getContactPersonName()}</p>
                  <p className="text-gray-600 text-sm">{getContactPersonPhone()}</p>
                  <p className="text-gray-600 text-sm">{getContactPersonEmail()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Complete Payment</h2>
              
              {/* Order Number */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-mono font-bold text-[#383a3c]">{order.orderNumber}</p>
              </div>

              {/* Total Amount */}
              <div className="mb-6">
                <p className="text-2xl font-bold text-[#f06123] text-center">
                  ₦{order.totalAmount.toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm text-center">Total Amount</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Payment Button - Only show if not paid */}
              {order.paymentStatus !== 'paid' ? (
                <button
                  onClick={handlePayment}
                  disabled={processing || order.orderStatus === 'cancelled'}
                  className="w-full bg-[#f06123] text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : order.orderStatus === 'cancelled' ? (
                    'Order Cancelled'
                  ) : (
                    `Pay ₦${order.totalAmount.toLocaleString()}`
                  )}
                </button>
              ) : (
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 font-semibold">Payment Completed</p>
                  <p className="text-green-600 text-sm mt-1">Thank you for your order!</p>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure payment powered by Paystack
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
              >
                Refresh Order Status
              </button>
            </div>

            {/* Support Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Contact our support team for any questions about your order.
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">📞 +234-800-123-4567</p>
                <p className="text-gray-600">✉️ support@holsapartments.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



































































// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { vendorAPI } from '@/lib/api';

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
//       images?: Array<{ url: string }>; // Made optional
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
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   customerNotes: string;
//   orderStatus: string;
//   paymentStatus: string;
// }

// export default function VendorCheckoutPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuth();
//   const { initializeVendorPayment, verifyVendorPayment } = useVendor();
  
//   const [order, setOrder] = useState<VendorOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState('');
//   const orderId = params.id as string;

//   useEffect(() => {
//     if (user && orderId) {
//       fetchOrderDetails();
//     }
//   }, [user, orderId]);

//   const fetchOrderDetails = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       const response = await vendorAPI.getUserVendorOrders();
      
//       if (response.orders && Array.isArray(response.orders)) {
//         const foundOrder = response.orders.find((order: VendorOrder) => order._id === orderId);
        
//         if (foundOrder) {
//           // Ensure all items have proper image structure
//           const processedOrder = {
//             ...foundOrder,
//             items: foundOrder.items.map(item => ({
//               ...item,
//               product: {
//                 ...item.product,
//                 images: item.product.images || [] // Ensure images array exists
//               }
//             }))
//           };
//           setOrder(processedOrder);
//         } else {
//           setError('Order not found in your orders');
//         }
//       } else {
//         setError('Failed to load orders');
//       }
//     } catch (error: any) {
//       console.error('Error fetching order details:', error);
//       setError(error.message || 'Failed to load order details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePayment = async () => {
//     if (!order || !user) return;

//     if (order.paymentStatus === 'paid') {
//       setError('This order has already been paid');
//       return;
//     }

//     if (order.orderStatus === 'cancelled') {
//       setError('This order has been cancelled');
//       return;
//     }

//     try {
//       setProcessing(true);
//       setError('');

//       console.log('Initializing payment for order:', order._id);
//       const paymentData = await initializeVendorPayment(order._id, user.email);
      
//       if (paymentData && paymentData.authorization_url) {
//         window.location.href = paymentData.authorization_url;
//       } else {
//         throw new Error('No payment URL received');
//       }
      
//     } catch (error: any) {
//       console.error('Payment initialization error:', error);
//       setError(error.message || 'Failed to initialize payment. Please try again.');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleRefresh = () => {
//     fetchOrderDetails();
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         weekday: 'short',
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const formatDateTime = (dateString: string) => {
//     try {
//       return new Date(dateString).toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // FIXED: Safe image URL handling
//   const getImageUrl = (item: any) => {
//     try {
//       // Check if images exist and have at least one image with URL
//       if (item.product.images && 
//           Array.isArray(item.product.images) && 
//           item.product.images.length > 0 && 
//           item.product.images[0]?.url) {
        
//         const imageUrl = item.product.images[0].url;
        
//         if (!imageUrl) return '/default-product.jpg';
//         if (imageUrl.startsWith('http')) return imageUrl;
//         if (imageUrl.startsWith('/uploads/')) {
//           const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//           return `${baseUrl}${imageUrl}`;
//         }
//         return imageUrl;
//       }
      
//       // Return default image if no valid images
//       return '/default-product.jpg';
//     } catch (error) {
//       console.error('Error getting image URL:', error);
//       return '/default-product.jpg';
//     }
//   };

//   const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
//     (e.target as HTMLImageElement).src = '/default-product.jpg';
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'text-green-600 bg-green-50';
//       case 'pending': return 'text-yellow-600 bg-yellow-50';
//       case 'failed': return 'text-red-600 bg-red-50';
//       case 'cancelled': return 'text-gray-600 bg-gray-50';
//       default: return 'text-gray-600 bg-gray-50';
//     }
//   };

//   const getOrderStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'text-green-600 bg-green-50';
//       case 'preparing': return 'text-blue-600 bg-blue-50';
//       case 'out_for_delivery': return 'text-purple-600 bg-purple-50';
//       case 'delivered': return 'text-green-600 bg-green-50';
//       case 'cancelled': return 'text-red-600 bg-red-50';
//       default: return 'text-yellow-600 bg-yellow-50';
//     }
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
//             {error || "The order you're looking for doesn't exist or you don't have permission to view it."}
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 justify-center">
//             <button
//               onClick={handleRefresh}
//               className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//             >
//               Try Again
//             </button>
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Back to Marketplace
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-[#383a3c] mb-2">Checkout</h1>
//           <p className="text-gray-600">Complete your vendor order payment</p>
          
//           {/* Order Status Badges */}
//           <div className="flex justify-center gap-3 mt-4">
//             <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.orderStatus)}`}>
//               Order: {order.orderStatus.replace('_', ' ')}
//             </span>
//             <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
//               Payment: {order.paymentStatus}
//             </span>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Order Summary */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Order Details */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <div className="flex justify-between items-start mb-4">
//                 <h2 className="text-xl font-semibold text-[#383a3c]">Order Summary</h2>
//                 <span className="text-sm text-gray-500">#{order.orderNumber}</span>
//               </div>
              
//               <div className="space-y-4">
//                 {order.items.map((item, index) => (
//                   <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
//                     {/* FIXED: Safe image rendering */}
//                     <img
//                       src={getImageUrl(item)}
//                       alt={item.product.name}
//                       className="w-16 h-16 rounded-lg object-cover"
//                       onError={handleImageError}
//                     />
                    
//                     <div className="flex-1">
//                       <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
//                       <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
//                       <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                      
//                       {item.specialInstructions && (
//                         <p className="text-gray-500 text-sm mt-1">
//                           <strong>Note:</strong> {item.specialInstructions}
//                         </p>
//                       )}
//                     </div>

//                     <div className="text-right">
//                       <p className="font-semibold text-[#383a3c]">
//                         ₦{item.price.toLocaleString()} × {item.quantity}
//                       </p>
//                       <p className="text-[#f06123] font-bold">
//                         ₦{(item.price * item.quantity).toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Price Breakdown */}
//               <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Subtotal</span>
//                   <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Service Fee (10%)</span>
//                   <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Delivery Fee</span>
//                   <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
//                   <span>Total</span>
//                   <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Delivery Information */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
              
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Property</span>
//                   <span className="font-medium text-right">{order.deliveryAddress.property}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Address</span>
//                   <span className="font-medium text-right">{order.deliveryAddress.unit}</span>
//                 </div>
//                 {order.booking && (
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Booking Period</span>
//                     <span className="font-medium text-right">
//                       {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
//                     </span>
//                   </div>
//                 )}
//                 {order.preferredDeliveryTime && (
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Preferred Delivery</span>
//                     <span className="font-medium text-right">
//                       {formatDateTime(order.preferredDeliveryTime)}
//                     </span>
//                   </div>
//                 )}
//                 {order.deliveryAddress.specialInstructions && (
//                   <div>
//                     <span className="text-gray-600 block mb-1">Special Instructions</span>
//                     <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
//                   </div>
//                 )}
//                 {order.customerNotes && (
//                   <div>
//                     <span className="text-gray-600 block mb-1">Your Notes</span>
//                     <p className="font-medium">{order.customerNotes}</p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Vendor Information */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
              
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
//                   {order.vendor.businessName.charAt(0).toUpperCase()}
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName}</h3>
//                   <p className="text-gray-600 text-sm">Contact: {order.vendor.contactPerson.name}</p>
//                   <p className="text-gray-600 text-sm">{order.vendor.contactPerson.phone}</p>
//                   <p className="text-gray-600 text-sm">{order.vendor.contactPerson.email}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Payment Section */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Complete Payment</h2>
              
//               {/* Order Number */}
//               <div className="mb-4 p-3 bg-gray-50 rounded-lg">
//                 <p className="text-sm text-gray-600">Order Number</p>
//                 <p className="font-mono font-bold text-[#383a3c]">{order.orderNumber}</p>
//               </div>

//               {/* Total Amount */}
//               <div className="mb-6">
//                 <p className="text-2xl font-bold text-[#f06123] text-center">
//                   ₦{order.totalAmount.toLocaleString()}
//                 </p>
//                 <p className="text-gray-600 text-sm text-center">Total Amount</p>
//               </div>

//               {/* Error Message */}
//               {error && (
//                 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                   <div className="flex items-center">
//                     <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="text-red-700 text-sm">{error}</p>
//                   </div>
//                 </div>
//               )}

//               {/* Payment Button - Only show if not paid */}
//               {order.paymentStatus !== 'paid' ? (
//                 <button
//                   onClick={handlePayment}
//                   disabled={processing || order.orderStatus === 'cancelled'}
//                   className="w-full bg-[#f06123] text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 >
//                   {processing ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                       Processing...
//                     </div>
//                   ) : order.orderStatus === 'cancelled' ? (
//                     'Order Cancelled'
//                   ) : (
//                     `Pay ₦${order.totalAmount.toLocaleString()}`
//                   )}
//                 </button>
//               ) : (
//                 <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
//                   <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <p className="text-green-700 font-semibold">Payment Completed</p>
//                   <p className="text-green-600 text-sm mt-1">Thank you for your order!</p>
//                 </div>
//               )}

//               {/* Security Notice */}
//               <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <div className="flex items-center text-blue-800 text-sm">
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                   </svg>
//                   Secure payment powered by Paystack
//                 </div>
//               </div>

//               {/* Refresh Button */}
//               <button
//                 onClick={handleRefresh}
//                 className="w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
//               >
//                 Refresh Order Status
//               </button>
//             </div>

//             {/* Support Info */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
//               <p className="text-gray-600 text-sm mb-3">
//                 Contact our support team for any questions about your order.
//               </p>
//               <div className="space-y-1 text-sm">
//                 <p className="text-gray-600">📞 +234-800-123-4567</p>
//                 <p className="text-gray-600">✉️ support@holsapartments.com</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

























































// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { vendorAPI } from '@/lib/api';

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
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   customerNotes: string;
//   orderStatus: string;
//   paymentStatus: string;
// }

// export default function VendorCheckoutPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuth();
//   const { initializeVendorPayment, verifyVendorPayment } = useVendor();
  
//   const [order, setOrder] = useState<VendorOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState('');
//   const orderId = params.id as string;

//   useEffect(() => {
//     if (user && orderId) {
//       fetchOrderDetails();
//     }
//   }, [user, orderId]);

//   const fetchOrderDetails = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       // First, get user's orders to find the specific one
//       const response = await vendorAPI.getUserVendorOrders();
      
//       if (response.orders && Array.isArray(response.orders)) {
//         const foundOrder = response.orders.find((order: VendorOrder) => order._id === orderId);
        
//         if (foundOrder) {
//           setOrder(foundOrder);
//         } else {
//           setError('Order not found in your orders');
//         }
//       } else {
//         setError('Failed to load orders');
//       }
//     } catch (error: any) {
//       console.error('Error fetching order details:', error);
//       setError(error.message || 'Failed to load order details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Alternative: If you have a direct API endpoint to get order by ID
//   const fetchOrderById = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       // This would require adding a new endpoint to your API
//       // For now, we'll use the getUserVendorOrders approach
//       const response = await vendorAPI.getUserVendorOrders();
      
//       if (response.orders && Array.isArray(response.orders)) {
//         const foundOrder = response.orders.find((order: VendorOrder) => order._id === orderId);
        
//         if (foundOrder) {
//           setOrder(foundOrder);
//         } else {
//           setError('Order not found');
//         }
//       } else {
//         setError('Failed to load order');
//       }
//     } catch (error: any) {
//       console.error('Error fetching order:', error);
//       setError(error.message || 'Failed to load order');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePayment = async () => {
//     if (!order || !user) return;

//     // Check if order is already paid
//     if (order.paymentStatus === 'paid') {
//       setError('This order has already been paid');
//       return;
//     }

//     // Check if order is cancelled
//     if (order.orderStatus === 'cancelled') {
//       setError('This order has been cancelled');
//       return;
//     }

//     try {
//       setProcessing(true);
//       setError('');

//       console.log('Initializing payment for order:', order._id);
//       const paymentData = await initializeVendorPayment(order._id, user.email);
      
//       if (paymentData && paymentData.authorization_url) {
//         // Redirect to Paystack payment page
//         window.location.href = paymentData.authorization_url;
//       } else {
//         throw new Error('No payment URL received');
//       }
      
//     } catch (error: any) {
//       console.error('Payment initialization error:', error);
//       setError(error.message || 'Failed to initialize payment. Please try again.');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleRefresh = () => {
//     fetchOrderDetails();
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         weekday: 'short',
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const formatDateTime = (dateString: string) => {
//     try {
//       return new Date(dateString).toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateString;
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

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'text-green-600 bg-green-50';
//       case 'pending': return 'text-yellow-600 bg-yellow-50';
//       case 'failed': return 'text-red-600 bg-red-50';
//       case 'cancelled': return 'text-gray-600 bg-gray-50';
//       default: return 'text-gray-600 bg-gray-50';
//     }
//   };

//   const getOrderStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'text-green-600 bg-green-50';
//       case 'preparing': return 'text-blue-600 bg-blue-50';
//       case 'out_for_delivery': return 'text-purple-600 bg-purple-50';
//       case 'delivered': return 'text-green-600 bg-green-50';
//       case 'cancelled': return 'text-red-600 bg-red-50';
//       default: return 'text-yellow-600 bg-yellow-50';
//     }
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
//             {error || "The order you're looking for doesn't exist or you don't have permission to view it."}
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 justify-center">
//             <button
//               onClick={handleRefresh}
//               className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
//             >
//               Try Again
//             </button>
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Back to Marketplace
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-[#383a3c] mb-2">Checkout</h1>
//           <p className="text-gray-600">Complete your vendor order payment</p>
          
//           {/* Order Status Badges */}
//           <div className="flex justify-center gap-3 mt-4">
//             <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.orderStatus)}`}>
//               Order: {order.orderStatus.replace('_', ' ')}
//             </span>
//             <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
//               Payment: {order.paymentStatus}
//             </span>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Order Summary */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Order Details */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <div className="flex justify-between items-start mb-4">
//                 <h2 className="text-xl font-semibold text-[#383a3c]">Order Summary</h2>
//                 <span className="text-sm text-gray-500">#{order.orderNumber}</span>
//               </div>
              
//               <div className="space-y-4">
//                 {order.items.map((item, index) => (
//                   <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
//                     <img
//                       src={getImageUrl(item.product.images[0]?.url)}
//                       alt={item.product.name}
//                       className="w-16 h-16 rounded-lg object-cover"
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).src = '/default-product.jpg';
//                       }}
//                     />
                    
//                     <div className="flex-1">
//                       <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
//                       <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
//                       <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                      
//                       {item.specialInstructions && (
//                         <p className="text-gray-500 text-sm mt-1">
//                           <strong>Note:</strong> {item.specialInstructions}
//                         </p>
//                       )}
//                     </div>

//                     <div className="text-right">
//                       <p className="font-semibold text-[#383a3c]">
//                         ₦{item.price.toLocaleString()} × {item.quantity}
//                       </p>
//                       <p className="text-[#f06123] font-bold">
//                         ₦{(item.price * item.quantity).toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Price Breakdown */}
//               <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Subtotal</span>
//                   <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Service Fee (10%)</span>
//                   <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Delivery Fee</span>
//                   <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
//                   <span>Total</span>
//                   <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Delivery Information */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
              
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Property</span>
//                   <span className="font-medium text-right">{order.deliveryAddress.property}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Address</span>
//                   <span className="font-medium text-right">{order.deliveryAddress.unit}</span>
//                 </div>
//                 {order.booking && (
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Booking Period</span>
//                     <span className="font-medium text-right">
//                       {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
//                     </span>
//                   </div>
//                 )}
//                 {order.preferredDeliveryTime && (
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Preferred Delivery</span>
//                     <span className="font-medium text-right">
//                       {formatDateTime(order.preferredDeliveryTime)}
//                     </span>
//                   </div>
//                 )}
//                 {order.deliveryAddress.specialInstructions && (
//                   <div>
//                     <span className="text-gray-600 block mb-1">Special Instructions</span>
//                     <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
//                   </div>
//                 )}
//                 {order.customerNotes && (
//                   <div>
//                     <span className="text-gray-600 block mb-1">Your Notes</span>
//                     <p className="font-medium">{order.customerNotes}</p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Vendor Information */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
              
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
//                   {order.vendor.businessName.charAt(0).toUpperCase()}
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName}</h3>
//                   <p className="text-gray-600 text-sm">Contact: {order.vendor.contactPerson.name}</p>
//                   <p className="text-gray-600 text-sm">{order.vendor.contactPerson.phone}</p>
//                   <p className="text-gray-600 text-sm">{order.vendor.contactPerson.email}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Payment Section */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Complete Payment</h2>
              
//               {/* Order Number */}
//               <div className="mb-4 p-3 bg-gray-50 rounded-lg">
//                 <p className="text-sm text-gray-600">Order Number</p>
//                 <p className="font-mono font-bold text-[#383a3c]">{order.orderNumber}</p>
//               </div>

//               {/* Total Amount */}
//               <div className="mb-6">
//                 <p className="text-2xl font-bold text-[#f06123] text-center">
//                   ₦{order.totalAmount.toLocaleString()}
//                 </p>
//                 <p className="text-gray-600 text-sm text-center">Total Amount</p>
//               </div>

//               {/* Error Message */}
//               {error && (
//                 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                   <div className="flex items-center">
//                     <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="text-red-700 text-sm">{error}</p>
//                   </div>
//                 </div>
//               )}

//               {/* Payment Button - Only show if not paid */}
//               {order.paymentStatus !== 'paid' ? (
//                 <button
//                   onClick={handlePayment}
//                   disabled={processing || order.orderStatus === 'cancelled'}
//                   className="w-full bg-[#f06123] text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 >
//                   {processing ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                       Processing...
//                     </div>
//                   ) : order.orderStatus === 'cancelled' ? (
//                     'Order Cancelled'
//                   ) : (
//                     `Pay ₦${order.totalAmount.toLocaleString()}`
//                   )}
//                 </button>
//               ) : (
//                 <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
//                   <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <p className="text-green-700 font-semibold">Payment Completed</p>
//                   <p className="text-green-600 text-sm mt-1">Thank you for your order!</p>
//                 </div>
//               )}

//               {/* Security Notice */}
//               <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <div className="flex items-center text-blue-800 text-sm">
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                   </svg>
//                   Secure payment powered by Paystack
//                 </div>
//               </div>

//               {/* Refresh Button */}
//               <button
//                 onClick={handleRefresh}
//                 className="w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
//               >
//                 Refresh Order Status
//               </button>
//             </div>

//             {/* Support Info */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
//               <p className="text-gray-600 text-sm mb-3">
//                 Contact our support team for any questions about your order.
//               </p>
//               <div className="space-y-1 text-sm">
//                 <p className="text-gray-600">📞 +234-800-123-4567</p>
//                 <p className="text-gray-600">✉️ support@holsapartments.com</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }










































// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import { useAuth } from '@/contexts/AuthContext';

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
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   customerNotes: string;
// }

// export default function VendorCheckoutPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuth();
//   const { initializeVendorPayment, verifyVendorPayment } = useVendor();
  
//   const [order, setOrder] = useState<VendorOrder | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState('');
//   const orderId = params.id as string;

//   useEffect(() => {
//     if (user && orderId) {
//       // In a real app, you'd fetch the order details
//       // For now, we'll simulate the order data
//       simulateOrderFetch();
//     }
//   }, [user, orderId]);

//   const simulateOrderFetch = () => {
//     // This would be an API call in a real app
//     setTimeout(() => {
//       const mockOrder: VendorOrder = {
//         _id: orderId,
//         orderNumber: `VOR-${Date.now()}-001`,
//         user: {
//           _id: user?._id || '',
//           firstName: user?.firstName || '',
//           lastName: user?.lastName || '',
//           email: user?.email || '',
//         },
//         vendor: {
//           _id: 'vendor123',
//           businessName: 'Premium Food Services',
//           contactPerson: {
//             name: 'John Doe',
//             email: 'vendor@example.com',
//             phone: '+2348012345678'
//           }
//         },
//         booking: {
//           _id: 'booking123',
//           property: 'Luxury Apartment Lagos',
//           checkIn: '2024-02-15',
//           checkOut: '2024-02-20'
//         },
//         items: [
//           {
//             product: {
//               _id: 'prod1',
//               name: 'Gourmet Pizza',
//               description: 'Delicious pizza with premium ingredients',
//               price: 4500,
//               images: [{ url: '/default-product.jpg' }],
//               preparationTime: 30
//             },
//             quantity: 2,
//             price: 4500
//           },
//           {
//             product: {
//               _id: 'prod2',
//               name: 'Fresh Juice',
//               description: 'Freshly squeezed orange juice',
//               price: 1500,
//               images: [{ url: '/default-product.jpg' }],
//               preparationTime: 10
//             },
//             quantity: 4,
//             price: 1500
//           }
//         ],
//         subtotal: 15000,
//         serviceFee: 1500,
//         deliveryFee: 500,
//         totalAmount: 17000,
//         deliveryAddress: {
//           property: 'Luxury Apartment Lagos',
//           unit: 'Apartment 5B, Victoria Island',
//           specialInstructions: 'Please ring the bell twice'
//         },
//         customerNotes: 'Please make sure the pizza is extra crispy'
//       };
      
//       setOrder(mockOrder);
//       setLoading(false);
//     }, 1000);
//   };

//   const handlePayment = async () => {
//     if (!order || !user) return;

//     try {
//       setProcessing(true);
//       setError('');

//       const paymentData = await initializeVendorPayment(order._id, user.email);
      
//       // Redirect to Paystack payment page
//       window.location.href = paymentData.authorization_url;
      
//     } catch (error: any) {
//       console.error('Payment initialization error:', error);
//       setError(error.message || 'Failed to initialize payment');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const getImageUrl = (imagePath: string) => {
//     if (!imagePath) return '/default-product.jpg';
//     if (imagePath.startsWith('http')) return imagePath;
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//     return `${baseUrl}${imagePath}`;
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
//         <div className="text-center">
//           <div className="text-red-600 text-lg mb-2">Order not found</div>
//           <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
//           <button
//             onClick={() => router.push('/marketplace')}
//             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
//           >
//             Back to Marketplace
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-[#383a3c] mb-2">Checkout</h1>
//           <p className="text-gray-600">Complete your vendor order payment</p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Order Summary */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Order Details */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Order Summary</h2>
              
//               <div className="space-y-4">
//                 {order.items.map((item, index) => (
//                   <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
//                     <img
//                       src={getImageUrl(item.product.images[0]?.url)}
//                       alt={item.product.name}
//                       className="w-16 h-16 rounded-lg object-cover"
//                     />
                    
//                     <div className="flex-1">
//                       <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
//                       <p className="text-gray-600 text-sm">{item.product.description}</p>
//                       <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                      
//                       {item.specialInstructions && (
//                         <p className="text-gray-500 text-sm mt-1">
//                           <strong>Note:</strong> {item.specialInstructions}
//                         </p>
//                       )}
//                     </div>

//                     <div className="text-right">
//                       <p className="font-semibold text-[#383a3c]">
//                         ₦{item.price.toLocaleString()} × {item.quantity}
//                       </p>
//                       <p className="text-[#f06123] font-bold">
//                         ₦{(item.price * item.quantity).toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Price Breakdown */}
//               <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Subtotal</span>
//                   <span className="text-gray-900">₦{order.subtotal.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Service Fee (10%)</span>
//                   <span className="text-gray-900">₦{order.serviceFee.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Delivery Fee</span>
//                   <span className="text-gray-900">₦{order.deliveryFee.toLocaleString()}</span>
//                 </div>
//                 <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
//                   <span>Total</span>
//                   <span className="text-[#f06123]">₦{order.totalAmount.toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Delivery Information */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Delivery Information</h2>
              
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Property</span>
//                   <span className="font-medium">{order.deliveryAddress.property}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Address</span>
//                   <span className="font-medium">{order.deliveryAddress.unit}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Booking Period</span>
//                   <span className="font-medium">
//                     {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
//                   </span>
//                 </div>
//                 {order.deliveryAddress.specialInstructions && (
//                   <div>
//                     <span className="text-gray-600 block mb-1">Special Instructions</span>
//                     <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
//                   </div>
//                 )}
//                 {order.customerNotes && (
//                   <div>
//                     <span className="text-gray-600 block mb-1">Your Notes</span>
//                     <p className="font-medium">{order.customerNotes}</p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Vendor Information */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Vendor Information</h2>
              
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 bg-[#f06123] rounded-full flex items-center justify-center text-white font-bold text-lg">
//                   {order.vendor.businessName.charAt(0)}
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName}</h3>
//                   <p className="text-gray-600 text-sm">Contact: {order.vendor.contactPerson.name}</p>
//                   <p className="text-gray-600 text-sm">{order.vendor.contactPerson.phone}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Payment Section */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
//               <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Complete Payment</h2>
              
//               {/* Order Number */}
//               <div className="mb-4 p-3 bg-gray-50 rounded-lg">
//                 <p className="text-sm text-gray-600">Order Number</p>
//                 <p className="font-mono font-bold text-[#383a3c]">{order.orderNumber}</p>
//               </div>

//               {/* Total Amount */}
//               <div className="mb-6">
//                 <p className="text-2xl font-bold text-[#f06123] text-center">
//                   ₦{order.totalAmount.toLocaleString()}
//                 </p>
//                 <p className="text-gray-600 text-sm text-center">Total Amount</p>
//               </div>

//               {/* Error Message */}
//               {error && (
//                 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                   <p className="text-red-700 text-sm">{error}</p>
//                 </div>
//               )}

//               {/* Payment Button */}
//               <button
//                 onClick={handlePayment}
//                 disabled={processing}
//                 className="w-full bg-[#f06123] text-white py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
//               >
//                 {processing ? (
//                   <div className="flex items-center justify-center">
//                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                     Processing...
//                   </div>
//                 ) : (
//                   `Pay ₦${order.totalAmount.toLocaleString()}`
//                 )}
//               </button>

//               {/* Security Notice */}
//               <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <div className="flex items-center text-blue-800 text-sm">
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                   </svg>
//                   Secure payment powered by Paystack
//                 </div>
//               </div>

//               {/* Order Timeline */}
//               <div className="mt-6 pt-6 border-t border-gray-200">
//                 <h3 className="font-semibold text-[#383a3c] mb-3">Order Timeline</h3>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex items-center text-gray-600">
//                     <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
//                     Payment Pending
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
//                     Order Confirmation
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
//                     Preparation
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
//                     Out for Delivery
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
//                     Delivered
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Support Info */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <h3 className="font-semibold text-[#383a3c] mb-2">Need Help?</h3>
//               <p className="text-gray-600 text-sm mb-3">
//                 Contact our support team for any questions about your order.
//               </p>
//               <div className="space-y-1 text-sm">
//                 <p className="text-gray-600">📞 +234-800-123-4567</p>
//                 <p className="text-gray-600">✉️ support@holsapartments.com</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
