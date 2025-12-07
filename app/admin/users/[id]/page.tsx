// app/admin/users/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usersAPI } from '@/lib/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  profileImagePath?: string;
  createdAt: string;
  lastLogin?: string;
  bio?: string;
  verificationStatus: string;
  documents: Document[];
}

interface Document {
  _id: string;
  documentType: string;
  documentNumber: string;
  documentPath: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await usersAPI.getAdminUserById(userId);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    try {
      setActionLoading('verify-user');
      await usersAPI.verifyUser(userId);
      setUser(prev => prev ? { ...prev, isVerified: true } : null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async () => {
    try {
      setActionLoading('suspend-user');
      await usersAPI.suspendUser(userId);
      setUser(prev => prev ? { ...prev, isActive: false } : null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async () => {
    try {
      setActionLoading('activate-user');
      await usersAPI.activateUser(userId);
      setUser(prev => prev ? { ...prev, isActive: true } : null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveDocument = async (documentId: string) => {
    try {
      setActionLoading(`approve-doc-${documentId}`);
      await usersAPI.verifyDocument(documentId);
      // Refresh user data to get updated documents
      await fetchUserData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve document');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDocument = async (documentId: string, rejectionReason: string) => {
    if (!rejectionReason?.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(`reject-doc-${documentId}`);
      await usersAPI.rejectDocument(documentId, rejectionReason);
      // Refresh user data to get updated documents
      await fetchUserData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject document');
    } finally {
      setActionLoading(null);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/${imagePath.replace(/^public\//, '')}`;
  };

  const getDocumentUrl = (documentPath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Remove 'public/' prefix if it exists and construct proper URL
    const cleanPath = documentPath.replace(/^public\//, '');
    return `${baseUrl}/${cleanPath}`;
  };

  const downloadDocument = async (documentPath: string, documentName: string) => {
    try {
      const documentUrl = getDocumentUrl(documentPath);
      
      // Test if the file exists and is accessible
      const testResponse = await fetch(documentUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error('Document not found or inaccessible');
      }

      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = documentUrl;
      a.download = documentName || 'document.pdf';
      
      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document. The file may not be accessible.');
      
      // Fallback: open in new tab
      const documentUrl = getDocumentUrl(documentPath);
      window.open(documentUrl, '_blank');
    }
  };

  const viewDocument = (documentPath: string) => {
    const documentUrl = getDocumentUrl(documentPath);
    window.open(documentUrl, '_blank');
  };

  const getDocumentTypeDisplayName = (documentType: string) => {
    const typeMap: { [key: string]: string } = {
      'nin': 'National ID (NIN)',
      'passport': 'Passport',
      'drivers_license': "Driver's License",
      'voters_card': "Voter's Card",
      'utility_bill': 'Utility Bill',
      'other': 'Other Document'
    };
    return typeMap[documentType] || documentType;
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || 'file';
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error || 'User not found'}</div>
          <button 
            onClick={fetchUserData}
            className="px-4 py-2 bg-[#f06123] text-white rounded-lg hover:bg-orange-600 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">User Details</h1>
          <p className="text-gray-600 mt-2">User ID: {user._id}</p>
        </div>
        <div className="space-x-3">
          {!user.isVerified && (
            <button 
              onClick={handleVerifyUser}
              disabled={actionLoading === 'verify-user'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-200"
            >
              {actionLoading === 'verify-user' ? 'Verifying...' : 'Verify User'}
            </button>
          )}
          {user.isActive ? (
            <button 
              onClick={handleSuspendUser}
              disabled={actionLoading === 'suspend-user'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition duration-200"
            >
              {actionLoading === 'suspend-user' ? 'Suspending...' : 'Suspend User'}
            </button>
          ) : (
            <button 
              onClick={handleActivateUser}
              disabled={actionLoading === 'activate-user'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-200"
            >
              {actionLoading === 'activate-user' ? 'Activating...' : 'Activate User'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={user.profileImagePath ? getImageUrl(user.profileImagePath) : 
                         `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f06123&color=fff`}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f06123&color=fff`;
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#383a3c]">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email Address</label>
                  <p className="mt-1 text-[#383a3c]">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="mt-1 text-[#383a3c]">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Role</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    } capitalize`}>
                      {user.role}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Verification</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                      user.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
              {user.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Bio</label>
                  <p className="mt-1 text-[#383a3c]">{user.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#383a3c]">Uploaded Documents</h2>
              <span className="text-sm text-gray-500">
                {user.documents?.length || 0} document(s)
              </span>
            </div>
            
            {user.documents && user.documents.length > 0 ? (
              <div className="space-y-4">
                {user.documents.map((doc) => (
                  <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">
                            {doc.status === 'approved' ? '✅' : 
                             doc.status === 'rejected' ? '❌' : '📄'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-[#383a3c]">
                            {getDocumentTypeDisplayName(doc.documentType)}
                          </h4>
                          <p className="text-gray-600 text-sm">ID: {doc.documentNumber}</p>
                          <p className="text-gray-500 text-xs">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          {doc.verifiedAt && (
                            <p className="text-green-500 text-xs">
                              Approved: {new Date(doc.verifiedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                        
                        <button
                          onClick={() => viewDocument(doc.documentPath)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition duration-200"
                        >
                          View
                        </button>
                        
                        <button
                          onClick={() => downloadDocument(doc.documentPath, `${doc.documentType}_${doc.documentNumber}.${getFileExtension(doc.documentPath)}`)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition duration-200"
                        >
                          Download
                        </button>
                        
                        {doc.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveDocument(doc._id)}
                              disabled={actionLoading === `approve-doc-${doc._id}`}
                              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 transition duration-200"
                            >
                              {actionLoading === `approve-doc-${doc._id}` ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Please enter rejection reason:');
                                if (reason) handleRejectDocument(doc._id, reason);
                              }}
                              disabled={actionLoading === `reject-doc-${doc._id}`}
                              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-50 transition duration-200"
                            >
                              {actionLoading === `reject-doc-${doc._id}` ? '...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {doc.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {doc.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📄</div>
                <p>No documents uploaded yet</p>
                <p className="text-sm mt-1">User has not uploaded any verification documents</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login</span>
                <span className="font-medium">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documents</span>
                <span className="font-medium">{user.documents?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email Verified</span>
                <span className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Status</span>
                <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = `mailto:${user.email}`}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                Send Message
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
                Reset Password
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition duration-200">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
























































// // app/admin/users/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import { usersAPI } from '@/lib/api';

// interface User {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   role: string;
//   isVerified: boolean;
//   isActive: boolean;
//   profileImagePath?: string;
//   createdAt: string;
//   lastLogin?: string;
//   bio?: string;
//   verificationStatus: string;
//   documents: Document[];
// }

// interface Document {
//   _id: string;
//   documentType: string;
//   documentNumber: string;
//   documentPath: string;
//   status: 'pending' | 'approved' | 'rejected' | 'under_review';
//   uploadedAt: string;
//   verifiedAt?: string;
//   verifiedBy?: string;
//   rejectionReason?: string;
// }

// export default function UserDetailsPage() {
//   const params = useParams();
//   const userId = params.id as string;

//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (userId) {
//       fetchUserData();
//     }
//   }, [userId]);

//   const fetchUserData = async () => {
//     try {
//       const userData = await usersAPI.getAdminUserById(userId);
//       setUser(userData);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch user data');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyUser = async () => {
//     try {
//       await usersAPI.verifyUser(userId);
//       setUser(prev => prev ? { ...prev, isVerified: true } : null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to verify user');
//     }
//   };

//   const handleSuspendUser = async () => {
//     try {
//       await usersAPI.suspendUser(userId);
//       setUser(prev => prev ? { ...prev, isActive: false } : null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to suspend user');
//     }
//   };

//   const handleActivateUser = async () => {
//     try {
//       await usersAPI.activateUser(userId);
//       setUser(prev => prev ? { ...prev, isActive: true } : null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to activate user');
//     }
//   };

//   const handleApproveDocument = async (documentId: string) => {
//     try {
//       await usersAPI.verifyDocument(documentId);
//       // Refresh user data to get updated documents
//       fetchUserData();
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to approve document');
//     }
//   };

//   const handleRejectDocument = async (documentId: string, rejectionReason: string) => {
//     try {
//       await usersAPI.rejectDocument(documentId, rejectionReason);
//       // Refresh user data to get updated documents
//       fetchUserData();
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to reject document');
//     }
//   };

//   const getImageUrl = (imagePath: string) => {
//     if (!imagePath) return '';
//     if (imagePath.startsWith('http')) return imagePath;
    
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//     return `${baseUrl}/${imagePath.replace(/^public\//, '')}`;
//   };

//   // const getDocumentUrl = (documentPath: string) => {
//   //   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//   //   return `${baseUrl}/${documentPath.replace(/^public\//, '')}`;
//   // };

//   const getDocumentUrl = (documentPath: string) => {
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
//     // Remove 'public/' prefix if it exists and construct proper URL
//     const cleanPath = documentPath.replace(/^public\//, '');
//     return `${baseUrl}/${cleanPath}`;
//   };

//   // const downloadDocument = async (documentPath: string, documentName: string) => {
//   //   try {
//   //     const documentUrl = getDocumentUrl(documentPath);
//   //     const response = await fetch(documentUrl);
//   //     const blob = await response.blob();
//   //     const url = window.URL.createObjectURL(blob);
//   //     const a = document.createElement('a');
//   //     a.style.display = 'none';
//   //     a.href = url;
//   //     a.download = documentName;
//   //     document.body.appendChild(a);
//   //     a.click();
//   //     window.URL.revokeObjectURL(url);
//   //     document.body.removeChild(a);
//   //   } catch (err) {
//   //     setError('Failed to download document');
//   //   }
//   // };

//   const downloadDocument = async (documentPath: string, documentName: string) => {
//     try {
//       const documentUrl = getDocumentUrl(documentPath);
      
//       // Create a temporary anchor element to trigger download
//       const a = document.createElement('a');
//       a.style.display = 'none';
//       a.href = documentUrl;
//       a.download = documentName || 'document.pdf';
      
//       // Append to body, click, and remove
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
      
//       // Fallback: open in new tab if download doesn't work
//       setTimeout(() => {
//         window.open(documentUrl, '_blank');
//       }, 1000);
      
//     } catch (err) {
//       console.error('Download error:', err);
//       setError('Failed to download document. Trying to open in new tab...');
      
//       // Fallback: open in new tab
//       const documentUrl = getDocumentUrl(documentPath);
//       window.open(documentUrl, '_blank');
//     }
//   };

//   const viewDocument = (documentPath: string) => {
//     const documentUrl = getDocumentUrl(documentPath);
//     window.open(documentUrl, '_blank');
//   };


//   if (isLoading) {
//     return (
//       <div className="space-y-8">
//         <div className="flex justify-center items-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !user) {
//     return (
//       <div className="space-y-8">
//         <div className="text-center text-red-600 py-12">
//           {error || 'User not found'}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">User Details</h1>
//           <p className="text-gray-600 mt-2">User ID: {user._id}</p>
//         </div>
//         <div className="space-x-3">
//           {!user.isVerified && (
//             <button 
//               onClick={handleVerifyUser}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
//             >
//               Verify User
//             </button>
//           )}
//           {user.isActive ? (
//             <button 
//               onClick={handleSuspendUser}
//               className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
//             >
//               Suspend User
//             </button>
//           ) : (
//             <button 
//               onClick={handleActivateUser}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
//             >
//               Activate User
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Main Content */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Personal Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Personal Information</h2>
//             <div className="space-y-4">
//               <div className="flex items-center space-x-4">
//                 <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
//                   <img
//                     src={user.profileImagePath ? getImageUrl(user.profileImagePath) : 
//                          `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f06123&color=fff`}
//                     alt={`${user.firstName} ${user.lastName}`}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-[#383a3c]">
//                     {user.firstName} {user.lastName}
//                   </h3>
//                   <p className="text-gray-600">{user.email}</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Email Address</label>
//                   <p className="mt-1 text-[#383a3c]">{user.email}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Phone Number</label>
//                   <p className="mt-1 text-[#383a3c]">{user.phone || 'Not provided'}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Role</label>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
//                       user.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
//                     } capitalize`}>
//                       {user.role}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Status</label>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                     }`}>
//                       {user.isActive ? 'Active' : 'Suspended'}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Verification</label>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
//                       user.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
//                       user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
//                       'bg-gray-100 text-gray-800'
//                     }`}>
//                       {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
//                     </span>
//                   </p>
//                 </div>
//               </div>
//               {user.bio && (
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Bio</label>
//                   <p className="mt-1 text-[#383a3c]">{user.bio}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* User Documents */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-[#383a3c]">Uploaded Documents</h2>
//               <span className="text-sm text-gray-500">
//                 {user.documents?.length || 0} document(s)
//               </span>
//             </div>
            
//             {user.documents && user.documents.length > 0 ? (
//               <div className="space-y-4">
//                 {user.documents.map((doc) => (
//                   <div key={doc._id} className="border border-gray-200 rounded-lg p-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-4">
//                         <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
//                           <span className="text-2xl">📄</span>
//                         </div>
//                         <div>
//                           <h4 className="font-medium text-[#383a3c] capitalize">
//                             {doc.documentType.replace('_', ' ')} Document
//                           </h4>
//                           <p className="text-gray-600 text-sm">ID: {doc.documentNumber}</p>
//                           <p className="text-gray-500 text-xs">
//                             Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
//                           </p>
//                           {doc.verifiedAt && (
//                             <p className="text-green-500 text-xs">
//                               Approved: {new Date(doc.verifiedAt).toLocaleDateString()}
//                             </p>
//                           )}
//                         </div>
//                       </div>
                      
//                       <div className="flex items-center space-x-3">
//                         <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
//                           doc.status === 'approved' ? 'bg-green-100 text-green-800' :
//                           doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
//                           'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {doc.status}
//                         </span>
                        
//                         <button
//                           onClick={() => downloadDocument(doc.documentPath, `${doc.documentType}_${doc.documentNumber}.pdf`)}
//                           className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition duration-200"
//                         >
//                           Download
//                         </button>
                        
//                         <a
//                           href={getDocumentUrl(doc.documentPath)}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition duration-200"
//                         >
//                           View
//                         </a>
                        
//                         {doc.status === 'pending' && (
//                           <div className="flex space-x-2">
//                             <button
//                               onClick={() => handleApproveDocument(doc._id)}
//                               className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition duration-200"
//                             >
//                               Approve
//                             </button>
//                             <button
//                               onClick={() => {
//                                 const reason = prompt('Please enter rejection reason:');
//                                 if (reason) handleRejectDocument(doc._id, reason);
//                               }}
//                               className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition duration-200"
//                             >
//                               Reject
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
                    
//                     {doc.rejectionReason && (
//                       <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
//                         <p className="text-sm text-red-800">
//                           <strong>Rejection Reason:</strong> {doc.rejectionReason}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-gray-500">
//                 No documents uploaded
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Sidebar */}
//         <div className="space-y-6">
//           {/* Account Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Account Information</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Member Since</span>
//                 <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Last Login</span>
//                 <span className="font-medium">
//                   {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Documents</span>
//                 <span className="font-medium">{user.documents?.length || 0}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Email Verified</span>
//                 <span className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-red-600'}`}>
//                   {user.isVerified ? 'Yes' : 'No'}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Account Status</span>
//                 <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
//                   {user.isActive ? 'Active' : 'Suspended'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
//             <div className="space-y-3">
//               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
//                 Send Message
//               </button>
//               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
//                 Reset Password
//               </button>
//               <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition duration-200">
//                 Delete Account
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }













// // app/admin/users/[id]/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import { usersAPI } from '@/lib/api';

// interface User {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   role: string;
//   isVerified: boolean;
//   isActive: boolean;
//   profileImagePath?: string;
//   createdAt: string;
//   lastLogin?: string;
//   bio?: string;
// }

// interface Document {
//   _id: string;
//   filename: string;
//   originalName: string;
//   path: string;
//   documentType: string;
//   status: 'pending' | 'verified' | 'rejected';
//   uploadedAt: string;
// }

// export default function UserDetailsPage() {
//   const params = useParams();
//   const userId = params.id as string;

//   const [user, setUser] = useState<User | null>(null);
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (userId) {
//       fetchUserData();
//       fetchUserDocuments();
//     }
//   }, [userId]);

//   const fetchUserData = async () => {
//     try {
//       const userData = await usersAPI.getUserById(userId);
//       setUser(userData);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch user data');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchUserDocuments = async () => {
//     try {
//       const docs = await usersAPI.getUserDocuments(userId);
//       setDocuments(docs);
//     } catch (err: any) {
//       console.error('Failed to fetch documents:', err);
//     }
//   };

//   const handleVerifyUser = async () => {
//     try {
//       await usersAPI.verifyUser(userId);
//       setUser(prev => prev ? { ...prev, isVerified: true } : null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to verify user');
//     }
//   };

//   const handleSuspendUser = async () => {
//     try {
//       await usersAPI.suspendUser(userId);
//       setUser(prev => prev ? { ...prev, isActive: false } : null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to suspend user');
//     }
//   };

//   const handleActivateUser = async () => {
//     try {
//       await usersAPI.activateUser(userId);
//       setUser(prev => prev ? { ...prev, isActive: true } : null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to activate user');
//     }
//   };

//   const handleVerifyDocument = async (documentId: string) => {
//     try {
//       // You'll need to implement this API endpoint
//       // await usersAPI.verifyDocument(documentId);
//       setDocuments(docs => 
//         docs.map(doc => 
//           doc._id === documentId ? { ...doc, status: 'verified' } : doc
//         )
//       );
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to verify document');
//     }
//   };

//   const getImageUrl = (imagePath: string) => {
//     if (!imagePath) return '';
//     if (imagePath.startsWith('http')) return imagePath;
    
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//     return `${baseUrl}/${imagePath.replace(/^public\//, '')}`;
//   };

//   const getDocumentUrl = (documentPath: string) => {
//     const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
//     return `${baseUrl}/${documentPath.replace(/^public\//, '')}`;
//   };

//   if (isLoading) {
//     return (
//       <div className="space-y-8">
//         <div className="flex justify-center items-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !user) {
//     return (
//       <div className="space-y-8">
//         <div className="text-center text-red-600 py-12">
//           {error || 'User not found'}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-[#383a3c]">User Details</h1>
//           <p className="text-gray-600 mt-2">User ID: {user._id}</p>
//         </div>
//         <div className="space-x-3">
//           {!user.isVerified && (
//             <button 
//               onClick={handleVerifyUser}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
//             >
//               Verify User
//             </button>
//           )}
//           {user.isActive ? (
//             <button 
//               onClick={handleSuspendUser}
//               className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
//             >
//               Suspend User
//             </button>
//           ) : (
//             <button 
//               onClick={handleActivateUser}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
//             >
//               Activate User
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Main Content */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Personal Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Personal Information</h2>
//             <div className="space-y-4">
//               <div className="flex items-center space-x-4">
//                 <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
//                   <img
//                     src={user.profileImagePath ? getImageUrl(user.profileImagePath) : 
//                          `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f06123&color=fff`}
//                     alt={`${user.firstName} ${user.lastName}`}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-[#383a3c]">
//                     {user.firstName} {user.lastName}
//                   </h3>
//                   <p className="text-gray-600">{user.email}</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Email Address</label>
//                   <p className="mt-1 text-[#383a3c]">{user.email}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Phone Number</label>
//                   <p className="mt-1 text-[#383a3c]">{user.phone || 'Not provided'}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Role</label>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
//                       user.role === 'host' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
//                     } capitalize`}>
//                       {user.role}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Status</label>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                     }`}>
//                       {user.isActive ? 'Active' : 'Suspended'}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Verification</label>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
//                     }`}>
//                       {user.isVerified ? 'Verified' : 'Pending Verification'}
//                     </span>
//                   </p>
//                 </div>
//               </div>
//               {user.bio && (
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600">Bio</label>
//                   <p className="mt-1 text-[#383a3c]">{user.bio}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* User Documents */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Uploaded Documents</h2>
//             {documents.length > 0 ? (
//               <div className="space-y-4">
//                 {documents.map((doc) => (
//                   <div key={doc._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
//                     <div className="flex items-center space-x-4">
//                       <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
//                         <span className="text-2xl">📄</span>
//                       </div>
//                       <div>
//                         <h4 className="font-medium text-[#383a3c]">{doc.originalName}</h4>
//                         <p className="text-gray-600 text-sm capitalize">{doc.documentType}</p>
//                         <p className="text-gray-500 text-xs">
//                           Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
//                         doc.status === 'verified' ? 'bg-green-100 text-green-800' :
//                         doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
//                         'bg-yellow-100 text-yellow-800'
//                       }`}>
//                         {doc.status}
//                       </span>
//                       <a
//                         href={getDocumentUrl(doc.path)}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
//                       >
//                         View
//                       </a>
//                       {doc.status === 'pending' && (
//                         <button
//                           onClick={() => handleVerifyDocument(doc._id)}
//                           className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
//                         >
//                           Verify
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-gray-500">
//                 No documents uploaded
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Sidebar */}
//         <div className="space-y-6">
//           {/* Account Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Account Information</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Member Since</span>
//                 <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Last Login</span>
//                 <span className="font-medium">
//                   {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Documents</span>
//                 <span className="font-medium">{documents.length}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Email Verified</span>
//                 <span className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-red-600'}`}>
//                   {user.isVerified ? 'Yes' : 'No'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
//             <div className="space-y-3">
//               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
//                 Send Message
//               </button>
//               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
//                 Reset Password
//               </button>
//               <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition duration-200">
//                 Delete Account
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }















































// // interface PageProps {
// //   params: {
// //     id: string;
// //   };
// // }

// // export default function UserDetailsPage({ params }: PageProps) {
// //   // Mock data - in real app, fetch by ID
// //   const user = {
// //     id: parseInt(params.id),
// //     name: "John Doe",
// //     email: "john@example.com",
// //     phone: "+1 (555) 123-4567",
// //     role: "user",
// //     status: "active",
// //     joined: "2024-01-15",
// //     lastLogin: "2024-01-20",
// //     bookings: [
// //       { id: 1, property: "Luxury Apartment", date: "2024-02-15", status: "upcoming" },
// //       { id: 2, property: "Beachfront Villa", date: "2023-12-20", status: "completed" }
// //     ],
// //     profile: {
// //       bio: "Travel enthusiast and property investor. Love exploring new places and experiencing different cultures.",
// //       verified: true
// //     }
// //   };

// //   return (
// //     <div className="space-y-8">
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <h1 className="text-3xl font-bold text-[#383a3c]">User Details</h1>
// //           <p className="text-gray-600 mt-2">User ID: #{user.id}</p>
// //         </div>
// //         <div className="space-x-3">
// //           <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
// //             Edit User
// //           </button>
// //           <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
// //             Suspend User
// //           </button>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //         {/* Main Content */}
// //         <div className="lg:col-span-2 space-y-6">
// //           {/* Personal Information */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Personal Information</h2>
// //             <div className="space-y-4">
// //               <div className="flex items-center space-x-4">
// //                 <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
// //                   <span className="text-2xl text-gray-600">👤</span>
// //                 </div>
// //                 <div>
// //                   <h3 className="text-lg font-semibold text-[#383a3c]">{user.name}</h3>
// //                   <p className="text-gray-600">{user.email}</p>
// //                 </div>
// //               </div>
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-600">Email Address</label>
// //                   <p className="mt-1 text-[#383a3c]">{user.email}</p>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-600">Phone Number</label>
// //                   <p className="mt-1 text-[#383a3c]">{user.phone}</p>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-600">Role</label>
// //                   <p className="mt-1">
// //                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
// //                       user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
// //                       user.role === 'host' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
// //                     } capitalize`}>
// //                       {user.role}
// //                     </span>
// //                   </p>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-600">Status</label>
// //                   <p className="mt-1">
// //                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
// //                       user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
// //                     } capitalize`}>
// //                       {user.status}
// //                     </span>
// //                   </p>
// //                 </div>
// //               </div>
// //               {user.profile.bio && (
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-600">Bio</label>
// //                   <p className="mt-1 text-[#383a3c]">{user.profile.bio}</p>
// //                 </div>
// //               )}
// //             </div>
// //           </div>

// //           {/* Booking History */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Booking History</h2>
// //             <div className="space-y-4">
// //               {user.bookings.map((booking) => (
// //                 <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
// //                   <div>
// //                     <h4 className="font-medium text-[#383a3c]">{booking.property}</h4>
// //                     <p className="text-gray-600 text-sm">Date: {booking.date}</p>
// //                   </div>
// //                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${
// //                     booking.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
// //                   } capitalize`}>
// //                     {booking.status}
// //                   </span>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         </div>

// //         {/* Sidebar */}
// //         <div className="space-y-6">
// //           {/* Account Information */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Account Information</h2>
// //             <div className="space-y-3">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Member Since</span>
// //                 <span className="font-medium">{user.joined}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Last Login</span>
// //                 <span className="font-medium">{user.lastLogin}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Total Bookings</span>
// //                 <span className="font-medium">{user.bookings.length}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Email Verified</span>
// //                 <span className="font-medium text-green-600">Yes</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Quick Actions */}
// //           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c] mb-4">Quick Actions</h2>
// //             <div className="space-y-3">
// //               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
// //                 Send Message
// //               </button>
// //               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
// //                 Reset Password
// //               </button>
// //               <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200">
// //                 View All Bookings
// //               </button>
// //               <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition duration-200">
// //                 Delete Account
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

