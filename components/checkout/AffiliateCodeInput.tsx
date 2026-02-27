// frontend/components/checkout/AffiliateCodeInput.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AffiliateCodeInputProps {
  bookingId: string;
  onCodeApplied?: (data: any) => void;
}

export default function AffiliateCodeInput({ bookingId, onCodeApplied }: AffiliateCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [applied, setApplied] = useState(false);
  const [affiliateInfo, setAffiliateInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateCode = async () => {
    if (!code.trim()) {
      setError('Please enter an affiliate code');
      return;
    }

    setValidating(true);
    setError('');
    
    try {
      const response = await api.get(`/affiliates/validate/${code.trim()}`);
      if (response.data.success) {
        setAffiliateInfo(response.data.affiliate);
        setSuccess(`Valid affiliate code! You'll get ${response.data.affiliate.commissionRate}% off? Just kidding - the affiliate earns that! 😊`);
      } else {
        setError('Invalid affiliate code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid affiliate code');
    } finally {
      setValidating(false);
    }
  };

  const applyCode = async () => {
    if (!code.trim() || !affiliateInfo) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await api.post(`/affiliates/bookings/${bookingId}/apply`, {
        affiliateCode: code.trim()
      });

      if (response.data.success) {
        setApplied(true);
        setSuccess('Affiliate code applied successfully!');
        if (onCodeApplied) {
          onCodeApplied(response.data.affiliateBooking);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply affiliate code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setApplied(false);
    setAffiliateInfo(null);
    setSuccess('');
    // Here you would also call an API to remove the code if needed
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white text-lg">🎯</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#383a3c]">Have an affiliate code?</h3>
          <p className="text-sm text-gray-600">Enter it below to support your referrer</p>
        </div>
      </div>

      {!applied ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., ES-001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase"
                maxLength={10}
                disabled={validating}
              />
              {code && !validating && !affiliateInfo && (
                <button
                  onClick={validateCode}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Check
                </button>
              )}
              {validating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
          </div>

          {affiliateInfo && !applied && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-purple-800">
                    Code from <span className="font-bold">{affiliateInfo.name}</span>
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    They'll earn {affiliateInfo.commissionRate}% commission on this booking
                  </p>
                </div>
                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {affiliateInfo.code}
                </div>
              </div>
              <button
                onClick={applyCode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying...
                  </>
                ) : (
                  'Apply Affiliate Code'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && !applied && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            By applying an affiliate code, you're supporting the person who referred you. The booking price remains the same.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800">
                  Affiliate code <span className="font-bold">{code}</span> applied
                </p>
                {affiliateInfo && (
                  <p className="text-xs text-green-600 mt-1">
                    You're supporting {affiliateInfo.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-green-700 hover:text-green-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}