// app/dashboard/bookings/[id]/upload-proof/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsAPI } from '@/lib/api';

export default function UploadProofPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const bookingId = params.id as string;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a JPG, PNG, or PDF file');
        return;
      }

      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('proof', file);

      await bookingsAPI.uploadProofOfPayment(bookingId, formData);
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/bookings');
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Failed to upload proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#383a3c]">Upload Proof of Payment</h1>
          <p className="text-gray-600 mt-2">
            Upload proof of your bank transfer for booking #{bookingId.slice(-8)}
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Proof Uploaded Successfully!</h3>
            <p className="text-gray-600">
              Your proof of payment has been submitted. Our team will verify your payment and confirm your booking.
            </p>
            <p className="text-gray-500 mt-4">
              Redirecting to bookings...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Bank Details Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h3 className="font-semibold text-blue-900 mb-3">Bank Transfer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Account Name</label>
                    <div className="bg-white border border-blue-100 rounded-lg px-3 py-2">
                      <p className="font-medium">Hols Apartments Ltd</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Account Number</label>
                    <div className="bg-white border border-blue-100 rounded-lg px-3 py-2">
                      <p className="font-medium text-lg">0900408855</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Bank</label>
                    <div className="bg-white border border-blue-100 rounded-lg px-3 py-2">
                      <p className="font-medium">GT Bank</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ <strong>Important:</strong> Include your booking reference in the transfer description. 
                    Booking will be confirmed after verification by our team.
                  </p>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Proof of Payment
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="proof"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="proof" className="cursor-pointer">
                    <div className="text-4xl mb-2">📎</div>
                    <p className="text-gray-600 mb-2">
                      {file ? file.name : 'Click to upload proof (JPG, PNG, PDF)'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Maximum file size: 5MB
                    </p>
                  </label>
                </div>
                {file && (
                  <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-green-800">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">What to include in your proof:</h4>
                <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
                  <li>Screenshot of successful transaction</li>
                  <li>Bank transfer receipt</li>
                  <li>Transaction reference number must be visible</li>
                  <li>Your name and booking ID should be included</li>
                  <li>Amount transferred should match booking amount</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || loading}
                  className={`flex-1 ${
                    !file || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#f06123] hover:bg-orange-600'
                  } text-white py-3 rounded-lg font-semibold transition duration-200`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    'Submit Proof'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}