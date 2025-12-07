// app/vendor/payment/success/page.tsx - UPDATED
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVendor } from '@/contexts/VendorContext';
import Link from 'next/link';

export default function VendorPaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyVendorPayment } = useVendor();
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');

      console.log('Vendor Payment Success Page - Reference:', reference);
      console.log('Vendor Payment Success Page - Trxref:', trxref);

      if (!reference && !trxref) {
        setError('No payment reference found');
        setVerifying(false);
        return;
      }

      const paymentReference = reference || trxref;

      try {
        console.log('Verifying vendor payment with reference:', paymentReference);
        const response = await verifyVendorPayment(paymentReference!);
        
        console.log('Vendor payment verification successful:', response);
        
        // If we get here, payment was successful
        setSuccess(true);
        setOrder(response.order);
        
      } catch (error: any) {
        console.error('Vendor payment verification error:', error);
        setError(error.message || 'Failed to verify payment');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, verifyVendorPayment]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Vendor Payment</h1>
          <p className="text-gray-600">Please wait while we confirm your vendor order payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/marketplace')}
              className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
            >
              Back to Marketplace
            </button>
            <Link
              href="/dashboard/vendor-orders"
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success && order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. Your vendor order has been confirmed.
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
            <p className="text-sm text-gray-600 mt-2">Total Paid</p>
            <p className="text-[#f06123] font-bold text-xl">₦{order.totalAmount?.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">Vendor</p>
            <p className="font-semibold">{order.vendor?.businessName}</p>
            <p className="text-sm text-gray-600 mt-2">Status</p>
            <p className="font-semibold text-green-600 capitalize">
              {order.orderStatus?.replace('_', ' ')}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/vendor-orders"
              className="block w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
            >
              View Order Details
            </Link>
            <button
              onClick={() => router.push('/marketplace')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}







































// // app/vendor/payment/success/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import { useVendor } from '@/contexts/VendorContext';
// import Link from 'next/link';

// export default function VendorPaymentSuccess() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const { verifyVendorPayment } = useVendor();
  
//   const [verifying, setVerifying] = useState(true);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState('');
//   const [order, setOrder] = useState<any>(null);

//   useEffect(() => {
//     const verifyPayment = async () => {
//       const reference = searchParams.get('reference');
//       const trxref = searchParams.get('trxref');

//       if (!reference && !trxref) {
//         setError('No payment reference found');
//         setVerifying(false);
//         return;
//       }

//       const paymentReference = reference || trxref;

//       try {
//         console.log('Verifying vendor payment with reference:', paymentReference);
//         const response = await verifyVendorPayment(paymentReference!);
        
//         if (response.success) {
//           setSuccess(true);
//           setOrder(response.order);
//         } else {
//           setError(response.message || 'Payment verification failed');
//         }
//       } catch (error: any) {
//         console.error('Vendor payment verification error:', error);
//         setError(error.message || 'Failed to verify payment');
//       } finally {
//         setVerifying(false);
//       }
//     };

//     verifyPayment();
//   }, [searchParams, verifyVendorPayment]);

//   if (verifying) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123] mx-auto mb-4"></div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
//           <p className="text-gray-600">Please wait while we confirm your payment...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center max-w-md">
//           <div className="text-red-600 text-6xl mb-4">❌</div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <div className="space-y-3">
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               Back to Marketplace
//             </button>
//             <Link
//               href="/dashboard/orders"
//               className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
//             >
//               View My Orders
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (success && order) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center max-w-md">
//           <div className="text-green-600 text-6xl mb-4">✅</div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
//           <p className="text-gray-600 mb-4">
//             Thank you for your order. Your vendor order has been confirmed.
//           </p>
          
//           <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
//             <p className="text-sm text-gray-600">Order Number</p>
//             <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
//             <p className="text-sm text-gray-600 mt-2">Total Paid</p>
//             <p className="text-[#f06123] font-bold text-xl">₦{order.totalAmount?.toLocaleString()}</p>
//             <p className="text-sm text-gray-600 mt-2">Vendor</p>
//             <p className="font-semibold">{order.vendor?.businessName}</p>
//           </div>

//           <div className="space-y-3">
//             <Link
//               href="/dashboard/orders"
//               className="block w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
//             >
//               View Order Details
//             </Link>
//             <button
//               onClick={() => router.push('/marketplace')}
//               className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
//             >
//               Continue Shopping
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }