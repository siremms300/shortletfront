// app/booking/payment/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { initializePayment } = useBooking();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Safely extract bookingId from params
  const bookingId = Array.isArray(params.id) ? params.id[0] : params.id;

  console.log('Payment page - bookingId:', bookingId); // Debug log

  useEffect(() => {
    if (user && bookingId && bookingId !== 'undefined') {
      handleInitializePayment();
    } else if (bookingId === 'undefined') {
      setError('Invalid booking ID');
    }
  }, [user, bookingId]);

  const handleInitializePayment = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      if (!bookingId || bookingId === 'undefined') {
        setError('Invalid booking ID');
        return;
      }

      console.log('Initializing payment for booking:', bookingId); // Debug log

      const paymentData = await initializePayment(bookingId, user.email);
      
      // Redirect to Paystack payment page
      window.location.href = paymentData.authorization_url;
      
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setError(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    handleInitializePayment();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#f06123] mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Initializing Payment</h2>
            <p className="text-gray-600">Redirecting to payment gateway...</p>
          </>
        )}

        {error && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard/bookings')}
                className="w-full border border-[#383a3c] text-[#383a3c] py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
              >
                Back to Bookings
              </button>
            </div>
          </>
        )}

        {!loading && !error && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Secure Payment</h2>
            <p className="text-gray-600 mb-6">You will be redirected to our secure payment gateway to complete your booking.</p>
            <button
              onClick={handleInitializePayment}
              className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
            >
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}











































// // app/booking/payment/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useBooking } from '@/contexts/BookingContext';
// import { useAuth } from '@/contexts/AuthContext';

// export default function PaymentPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { initializePayment } = useBooking();
//   const { user } = useAuth();
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const bookingId = params.id as string;

//   useEffect(() => {
//     if (user && bookingId) {
//       handleInitializePayment();
//     }
//   }, [user, bookingId]);

//   const handleInitializePayment = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       if (!user?.email) {
//         setError('User email not found');
//         return;
//       }

//       const paymentData = await initializePayment(bookingId, user.email);
      
//       // Redirect to Paystack payment page
//       window.location.href = paymentData.authorization_url;
      
//     } catch (error: any) {
//       console.error('Payment initialization error:', error);
//       setError(error.message || 'Failed to initialize payment');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRetry = () => {
//     handleInitializePayment();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
//       <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
//         {loading && (
//           <>
//             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#f06123] mx-auto mb-4"></div>
//             <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Initializing Payment</h2>
//             <p className="text-gray-600">Redirecting to payment gateway...</p>
//           </>
//         )}

//         {error && (
//           <>
//             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </div>
//             <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Payment Failed</h2>
//             <p className="text-gray-600 mb-6">{error}</p>
//             <div className="space-y-3">
//               <button
//                 onClick={handleRetry}
//                 className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//               >
//                 Try Again
//               </button>
//               <button
//                 onClick={() => router.push('/dashboard/bookings')}
//                 className="w-full border border-[#383a3c] text-[#383a3c] py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
//               >
//                 Back to Bookings
//               </button>
//             </div>
//           </>
//         )}

//         {!loading && !error && (
//           <>
//             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//               </svg>
//             </div>
//             <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Secure Payment</h2>
//             <p className="text-gray-600 mb-6">You will be redirected to our secure payment gateway to complete your booking.</p>
//             <button
//               onClick={handleInitializePayment}
//               className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//             >
//               Proceed to Payment
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

