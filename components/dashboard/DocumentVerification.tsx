// components/dashboard/DocumentVerification.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Document {
  _id?: string;
  documentType: string;
  documentNumber: string;
  documentImagePath: string;
  status: string;
  uploadedAt: string;
  rejectionReason?: string;
}

interface UserProfile {
  _id: string;
  verificationStatus: string;
  documents: Document[];
}

// interface DocumentVerificationProps {
//   user: UserProfile;
//   onUpdate: (user: UserProfile) => void;
// }

interface DocumentVerificationProps {
  user: UserProfile;
  onUpdate: (user: Partial<UserProfile>) => void;
}

const documentTypes = [
  { value: 'nin', label: 'National ID (NIN)', icon: '🆔', description: 'National Identification Number' },
  { value: 'passport', label: 'International Passport', icon: '📘', description: 'Valid passport with photo' },
  { value: 'drivers_license', label: "Driver's License", icon: '🚗', description: 'Government-issued driver license' },
  { value: 'voters_card', label: "Voter's Card", icon: '🗳️', description: 'INEC voter identification card' },
  { value: 'utility_bill', label: 'Utility Bill', icon: '🏠', description: 'Recent electricity or water bill' },
  { value: 'other', label: 'Other Document', icon: '📄', description: 'Other government-issued ID' },
];

export default function DocumentVerification({ user, onUpdate }: DocumentVerificationProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved', icon: '✅' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review', icon: '⏳' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected', icon: '❌' },
      under_review: { color: 'bg-blue-100 text-blue-800', text: 'In Review', icon: '🔍' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const getDocumentIcon = (type: string) => {
    const doc = documentTypes.find(d => d.value === type);
    return doc ? doc.icon : '📄';
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument || !documentNumber || !documentFile) {
      setError('Please fill all fields and select a document');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('documentType', selectedDocument);
      formData.append('documentNumber', documentNumber);
      formData.append('document', documentFile);

      const response = await api.post(`/users/${user._id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Document uploaded successfully! It will be reviewed within 1-2 business days.');
      setSelectedDocument('');
      setDocumentNumber('');
      setDocumentFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('documentFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Update user data
      onUpdate(response.data.user);

    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or PDF file');
        return;
      }
      setDocumentFile(file);
      setError('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Verification Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Verification Status</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              {user.verificationStatus === 'verified' 
                ? 'Your identity has been verified. You can access all platform features.'
                : user.verificationStatus === 'pending'
                ? 'Your documents are being reviewed. You can still book properties.'
                : user.verificationStatus === 'rejected'
                ? 'Some documents were rejected. Please upload new ones.'
                : 'Upload at least one government-issued ID to verify your identity.'
              }
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
            user.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
          </div>
        </div>
      </div>

      {/* Upload New Document */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Upload New Document</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleDocumentUpload} className="space-y-6">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Document Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTypes.map((doc) => (
                <div
                  key={doc.value}
                  onClick={() => setSelectedDocument(doc.value)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition duration-200 ${
                    selectedDocument === doc.value
                      ? 'border-[#f06123] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{doc.label}</div>
                      <div className="text-sm text-gray-500">{doc.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Number *
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter your document number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition duration-200">
              <input
                id="documentFile"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <label htmlFor="documentFile" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-4xl">📎</div>
                  <div>
                    <span className="text-[#f06123] font-medium">Click to upload</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    JPEG, PNG, or PDF (Max 5MB)
                  </p>
                </div>
              </label>
              {documentFile && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">
                      {documentFile.name}
                    </span>
                    <span className="text-sm text-green-600">
                      {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !selectedDocument || !documentNumber || !documentFile}
              className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Documents */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Uploaded Documents</h2>
        
        {user.documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-gray-600">No documents uploaded yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload your first document to start the verification process
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {user.documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{getDocumentIcon(doc.documentType)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {doc.documentType.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">Number: {doc.documentNumber}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                    {doc.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(doc.status)}
                  {doc.status === 'rejected' && (
                    <button className="block mt-2 text-sm text-[#f06123] hover:text-orange-600">
                      Re-upload
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Benefits */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits of Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <span className="text-gray-700">Build trust with property hosts</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <span className="text-gray-700">Faster booking approvals</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <span className="text-gray-700">Access to premium properties</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <span className="text-gray-700">Enhanced security features</span>
          </div>
        </div>
      </div>
    </div>
  );
}