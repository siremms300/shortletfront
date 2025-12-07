// app/dashboard/vendor-orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useVendor } from '@/contexts/VendorContext';
import Link from 'next/link';

interface VendorOrder {
  _id: string;
  orderNumber: string;
  vendor: {
    _id: string;
    businessName: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      description?: string;
      images?: Array<{ url: string }>;
    } | string; // Product can be object or string ID
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export default function VendorOrdersPage() {
  const { vendorOrders, getUserVendorOrders, loading } = useVendor();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    getUserVendorOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const filteredOrders = vendorOrders.filter(order => {
    if (activeTab === 'active') {
      return !['delivered', 'cancelled'].includes(order.orderStatus);
    } else if (activeTab === 'completed') {
      return ['delivered', 'cancelled'].includes(order.orderStatus);
    }
    return true;
  });

  const getOrderItemsSummary = (items: any[]) => {
    if (items.length === 0) return 'No items';
    
    // Get the first item's product name safely
    const firstItem = items[0];
    const productName = getProductName(firstItem.product);
    
    if (items.length === 1) {
      return `${firstItem.quantity} × ${productName}`;
    }
    
    // For multiple items, show count and first item name
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    return `${totalItems} items including ${productName}`;
  };

  // Debug function to check order data
  const debugOrders = () => {
    console.log('=== VENDOR ORDERS DEBUG ===');
    vendorOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, order.orderNumber);
      console.log('Items structure:', order.items);
      order.items.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}:`, {
          product: item.product,
          productType: typeof item.product,
          hasName: !!item.product?.name,
          name: getProductName(item.product)
        });
      });
    });
    console.log('=== END DEBUG ===');
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#383a3c]">Vendor Orders</h1>
            <p className="text-gray-600">Manage your vendor service orders</p>
          </div>
          {/* Debug button - remove in production */}
          {/* {process.env.NODE_ENV === 'development' && (
            <button
              onClick={debugOrders}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
            >
              Debug Data
            </button>
          )} */}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-[#f06123] text-[#f06123]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Orders
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {vendorOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-[#f06123] text-[#f06123]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Orders
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {vendorOrders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus)).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-[#f06123] text-[#f06123]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {vendorOrders.filter(o => ['delivered', 'cancelled'].includes(o.orderStatus)).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Orders List */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-[#383a3c]">
                            Order {order.orderNumber}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                            {getStatusText(order.orderStatus)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Vendor:</strong> {order.vendor.businessName}
                          </p>
                          <p>
                            <strong>Items:</strong> {getOrderItemsSummary(order.items)}
                          </p>
                          <p>
                            <strong>Ordered:</strong> {formatDate(order.createdAt)}
                          </p>
                          {order.estimatedDeliveryTime && (
                            <p>
                              <strong>Estimated Delivery:</strong> {formatDate(order.estimatedDeliveryTime)}
                            </p>
                          )}
                        </div>

                        {/* Detailed items list for debugging */}
                        {/* {process.env.NODE_ENV === 'development' && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <strong>Debug Items:</strong>
                            {order.items.map((item, index) => (
                              <div key={index} className="ml-2">
                                {item.quantity} × {getProductName(item.product)} 
                                (Type: {typeof item.product})
                              </div>
                            ))}
                          </div>
                        )} */}
                      </div>

                      <div className="mt-4 md:mt-0 text-right">
                        <div className="font-bold text-[#383a3c] text-lg">
                          ₦{order.totalAmount.toLocaleString()}
                        </div>
                        <Link
                          href={`/dashboard/vendor-orders/${order._id}`}
                          className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for Active Orders */}
                  {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className={order.orderStatus === 'confirmed' ? 'font-semibold text-[#f06123]' : ''}>
                          Confirmed
                        </span>
                        <span className={order.orderStatus === 'preparing' ? 'font-semibold text-[#f06123]' : ''}>
                          Preparing
                        </span>
                        <span className={order.orderStatus === 'out_for_delivery' ? 'font-semibold text-[#f06123]' : ''}>
                          Out for Delivery
                        </span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No {activeTab !== 'all' ? activeTab : ''} orders found
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'all'
                  ? "You haven't placed any vendor orders yet."
                  : `You don't have any ${activeTab} vendor orders.`
                }
              </p>
              <Link
                href="/marketplace"
                className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
              >
                Browse Marketplace
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Vendor Order Information
        </h3>
        <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
          <li>Orders are typically delivered within the vendor's preparation time</li>
          <li>You'll receive notifications when your order status updates</li>
          <li>Contact support if you have any issues with your order</li>
          <li>Vendor contact information is provided in order details</li>
          <li>Payment is processed securely through our platform</li>
        </ul>
      </div>
    </div>
  );
}













































// //  app/dashboard/vendor-orders/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useVendor } from '@/contexts/VendorContext';
// import Link from 'next/link';

// interface VendorOrder {
//   _id: string;
//   orderNumber: string;
//   vendor: {
//     _id: string;
//     businessName: string;
//   };
//   items: Array<{
//     product: {
//       name: string;
//     };
//     quantity: number;
//   }>;
//   totalAmount: number;
//   orderStatus: string;
//   paymentStatus: string;
//   createdAt: string;
//   estimatedDeliveryTime?: string;
// }

// export default function VendorOrdersPage() {
//   const { vendorOrders, getUserVendorOrders, loading } = useVendor();
//   const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

//   useEffect(() => {
//     getUserVendorOrders();
//   }, []);

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed':
//       case 'preparing':
//         return 'bg-blue-100 text-blue-800';
//       case 'out_for_delivery':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'delivered':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusText = (status: string) => {
//     return status.split('_').map(word => 
//       word.charAt(0).toUpperCase() + word.slice(1)
//     ).join(' ');
//   };

//   const getPaymentStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'failed':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const filteredOrders = vendorOrders.filter(order => {
//     if (activeTab === 'active') {
//       return !['delivered', 'cancelled'].includes(order.orderStatus);
//     } else if (activeTab === 'completed') {
//       return ['delivered', 'cancelled'].includes(order.orderStatus);
//     }
//     return true;
//   });

//   const getOrderItemsSummary = (items: any[]) => {
//     if (items.length === 0) return '';
//     if (items.length === 1) return `${items[0].quantity} × ${items[0].product.name}`;
//     return `${items.length} items`;
//   };

//   return (
//     <div className="max-w-6xl">
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-[#383a3c]">Vendor Orders</h1>
//         <p className="text-gray-600">Manage your vendor service orders</p>
//       </div>

//       {/* Tabs */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
//         <div className="border-b border-gray-200">
//           <nav className="-mb-px flex space-x-8">
//             <button
//               onClick={() => setActiveTab('all')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'all'
//                   ? 'border-[#f06123] text-[#f06123]'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               All Orders
//               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
//                 {vendorOrders.length}
//               </span>
//             </button>
//             <button
//               onClick={() => setActiveTab('active')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'active'
//                   ? 'border-[#f06123] text-[#f06123]'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Active Orders
//               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
//                 {vendorOrders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus)).length}
//               </span>
//             </button>
//             <button
//               onClick={() => setActiveTab('completed')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'completed'
//                   ? 'border-[#f06123] text-[#f06123]'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Completed
//               <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
//                 {vendorOrders.filter(o => ['delivered', 'cancelled'].includes(o.orderStatus)).length}
//               </span>
//             </button>
//           </nav>
//         </div>

//         {/* Orders List */}
//         <div className="mt-6">
//           {loading ? (
//             <div className="flex items-center justify-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//               <span className="ml-3 text-gray-600">Loading orders...</span>
//             </div>
//           ) : filteredOrders.length > 0 ? (
//             <div className="space-y-4">
//               {filteredOrders.map((order) => (
//                 <div
//                   key={order._id}
//                   className="border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
//                 >
//                   <div className="p-4">
//                     <div className="flex flex-col md:flex-row md:items-center justify-between">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-4 mb-2">
//                           <h3 className="font-semibold text-[#383a3c]">
//                             Order {order.orderNumber}
//                           </h3>
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
//                             {getStatusText(order.orderStatus)}
//                           </span>
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
//                             {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
//                           </span>
//                         </div>

//                         <div className="text-sm text-gray-600 space-y-1">
//                           <p>
//                             <strong>Vendor:</strong> {order.vendor.businessName}
//                           </p>
//                           <p>
//                             <strong>Items:</strong> {getOrderItemsSummary(order.items)}
//                           </p>
//                           <p>
//                             <strong>Ordered:</strong> {formatDate(order.createdAt)}
//                           </p>
//                           {order.estimatedDeliveryTime && (
//                             <p>
//                               <strong>Estimated Delivery:</strong> {formatDate(order.estimatedDeliveryTime)}
//                             </p>
//                           )}
//                         </div>
//                       </div>

//                       <div className="mt-4 md:mt-0 text-right">
//                         <div className="font-bold text-[#383a3c] text-lg">
//                           ₦{order.totalAmount.toLocaleString()}
//                         </div>
//                         <Link
//                           href={`/dashboard/vendor-orders/${order._id}`}
//                           className="text-[#f06123] hover:text-orange-600 text-sm font-medium"
//                         >
//                           View Details
//                         </Link>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Progress Bar for Active Orders */}
//                   {!['delivered', 'cancelled'].includes(order.orderStatus) && (
//                     <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
//                       <div className="flex items-center justify-between text-xs text-gray-600">
//                         <span className={order.orderStatus === 'confirmed' ? 'font-semibold text-[#f06123]' : ''}>
//                           Confirmed
//                         </span>
//                         <span className={order.orderStatus === 'preparing' ? 'font-semibold text-[#f06123]' : ''}>
//                           Preparing
//                         </span>
//                         <span className={order.orderStatus === 'out_for_delivery' ? 'font-semibold text-[#f06123]' : ''}>
//                           Out for Delivery
//                         </span>
//                         <span>Delivered</span>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-12">
//               <div className="text-6xl mb-4">📦</div>
//               <h3 className="text-lg font-semibold text-gray-600 mb-2">
//                 No {activeTab !== 'all' ? activeTab : ''} orders found
//               </h3>
//               <p className="text-gray-500 mb-6">
//                 {activeTab === 'all'
//                   ? "You haven't placed any vendor orders yet."
//                   : `You don't have any ${activeTab} vendor orders.`
//                 }
//               </p>
//               <Link
//                 href="/marketplace"
//                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
//               >
//                 Browse Marketplace
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Help Section */}
//       <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
//         <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
//           <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//           </svg>
//           Vendor Order Information
//         </h3>
//         <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
//           <li>Orders are typically delivered within the vendor's preparation time</li>
//           <li>You'll receive notifications when your order status updates</li>
//           <li>Contact support if you have any issues with your order</li>
//           <li>Vendor contact information is provided in order details</li>
//           <li>Payment is processed securely through our platform</li>
//         </ul>
//       </div>
//     </div>
//   );
// }
