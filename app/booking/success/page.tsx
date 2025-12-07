'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBooking } from '@/contexts/BookingContext';
import Link from 'next/link';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const { verifyPayment } = useBooking();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const reference = searchParams.get('reference');
        if (!reference) {
          setStatus('error');
          setMessage('No payment reference found');
          return;
        }

        const result = await verifyPayment(reference);
        setStatus('success');
        setMessage('Payment successful! Your booking has been confirmed.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Payment verification failed');
      }
    };

    verify();
  }, [searchParams, verifyPayment]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#f06123] mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/dashboard/bookings"
                className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 block"
              >
                View My Bookings
              </Link>
              <Link
                href="/properties"
                className="w-full border border-[#383a3c] text-[#383a3c] py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200 block"
              >
                Browse More Properties
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/properties"
                className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 block"
              >
                Try Again
              </Link>
              <Link
                href="/contact"
                className="w-full border border-[#383a3c] text-[#383a3c] py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200 block"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

