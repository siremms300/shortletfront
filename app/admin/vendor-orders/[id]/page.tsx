// app/admin/vendor-orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendorAPI } from '@/lib/api';
import Link from 'next/link';

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
    contactPerson?: {
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
  customerNotes: string;
  vendorNotes: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminVendorOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const orderId = params.id as string;

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all orders and find the specific one
      const response = await vendorAPI.getAllVendorOrders();
      const foundOrder = response.orders?.find((order: VendorOrder) => order._id === orderId);
      
      if (foundOrder) {
        console.log('Found order:', foundOrder);
        setOrder(foundOrder);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      await vendorAPI.updateOrderStatus(order._id, newStatus);
      
      // Update local state
      setOrder({
        ...order,
        orderStatus: newStatus
      });
      
      alert('Order status updated successfully');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

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

  const getImageUrl = (images: Array<{ url: string }> | undefined) => {
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
            {error || "The order you're looking for doesn't exist."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/admin/vendor-orders')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
            >
              Back to Orders
            </button>
            <button
              onClick={fetchOrderData}
              className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vendorContact = getVendorContactInfo(order.vendor);

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
            href="/admin/vendor-orders"
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
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
                  <img
                    src={getImageUrl(item.product.images)}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-product.jpg';
                    }}
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#383a3c]">{item.product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.product.description}</p>
                    <p className="text-gray-500 text-sm">Preparation: {item.product.preparationTime} mins</p>
                    
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
                <span className="font-medium text-right">{order.deliveryAddress.property}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address</span>
                <span className="font-medium text-right">{order.deliveryAddress.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Period</span>
                <span className="font-medium text-right">
                  {formatDate(order.booking.checkIn)} - {formatDate(order.booking.checkOut)}
                </span>
              </div>
              {order.preferredDeliveryTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Delivery Time</span>
                  <span className="font-medium text-right">
                    {formatDate(order.preferredDeliveryTime)}
                  </span>
                </div>
              )}
              {order.deliveryAddress.specialInstructions && (
                <div>
                  <span className="text-gray-600 block mb-1">Special Instructions</span>
                  <p className="font-medium">{order.deliveryAddress.specialInstructions}</p>
                </div>
              )}
              {order.customerNotes && (
                <div>
                  <span className="text-gray-600 block mb-1">Customer Notes</span>
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
                {order.vendor.businessName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-[#383a3c]">{order.vendor.businessName}</h3>
                <p className="text-gray-600 text-sm">Contact: {vendorContact.name}</p>
                <p className="text-gray-600 text-sm">{vendorContact.phone}</p>
                <p className="text-gray-600 text-sm">{vendorContact.email}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Customer Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-right">
                  {order.user.firstName} {order.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-right">{order.user.email}</span>
              </div>
              {order.user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium text-right">{order.user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Timeline & Actions */}
        <div className="space-y-6">
          {/* Order Status Update */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Update Order Status</h2>
            
            <div className="space-y-3">
              <select
                value={order.orderStatus}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f06123] disabled:bg-gray-100"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              {updating && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f06123] mr-2"></div>
                  Updating status...
                </div>
              )}
            </div>
          </div>

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
                    <p className="text-gray-500 text-sm">On the way to customer</p>
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

          {/* Vendor Notes */}
          {order.vendorNotes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[#383a3c] mb-2">Vendor Notes</h3>
              <p className="text-gray-600 text-sm">{order.vendorNotes}</p>
            </div>
          )}

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
                href={`/admin/vendors/${order.vendor._id}`}
                className="block w-full bg-[#f06123] text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition duration-200 text-center"
              >
                View Vendor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}