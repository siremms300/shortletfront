// components/dashboard/ProfileForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import DocumentVerification from './DocumentVerification';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bio: string;
  profileImagePath: string;
  role: string;
  isVerified: boolean;
  verificationStatus: string;
  documents: any[];
}

// Helper function to get full image URL
const getImageUrl = (imagePath: string) => {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
  }
  
  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path, construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/${imagePath.replace(/^public\//, '')}`;
};

export default function ProfileForm() {
  const { user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'verification'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load profile data when component mounts or authUser changes
  useEffect(() => {
    if (authUser) {
      setProfile({
        _id: authUser._id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phone: authUser.phone || '',
        dateOfBirth: authUser.dateOfBirth || '',
        bio: authUser.bio || '',
        profileImagePath: getImageUrl(authUser.profileImagePath || ""),
        role: authUser.role,
        isVerified: authUser.isVerified,
        verificationStatus: authUser.verificationStatus || 'unverified',
        documents: authUser.documents || [],
      });
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      
      // Append profile data
      formData.append('firstName', profile.firstName);
      formData.append('lastName', profile.lastName);
      formData.append('email', profile.email);
      formData.append('phone', profile.phone);
      formData.append('dateOfBirth', profile.dateOfBirth);
      formData.append('bio', profile.bio);

      const response = await api.put(`/users/${profile._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Update auth context with new user data
      if (authUser) {
        const updatedUser = {
          ...authUser,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          bio: profile.bio,
          profileImagePath: response.data.user.profileImagePath,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.put(`/users/${profile._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newProfileImagePath = getImageUrl(response.data.user.profileImagePath);

      // Update profile image in state
      setProfile(prev => prev ? { 
        ...prev, 
        profileImagePath: newProfileImagePath 
      } : null);

      // Update auth context
      if (authUser) {
        const updatedUser = {
          ...authUser,
          profileImagePath: response.data.user.profileImagePath,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setMessage('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original auth user data
    if (authUser) {
      setProfile({
        _id: authUser._id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phone: authUser.phone || '',
        dateOfBirth: authUser.dateOfBirth || '',
        bio: authUser.bio || '',
        profileImagePath: getImageUrl(authUser.profileImagePath || ""),
        role: authUser.role,
        isVerified: authUser.isVerified,
        verificationStatus: authUser.verificationStatus || 'unverified',
        documents: authUser.documents || [],
      });
    }
    setIsEditing(false);
    setError('');
    setMessage('');
  };

  const getVerificationBadge = (status: string) => {
    const badges = {
      verified: { color: 'bg-green-100 text-green-800', text: 'Verified', icon: '✅' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review', icon: '⏳' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Verification Failed', icon: '❌' },
      unverified: { color: 'bg-gray-100 text-gray-800', text: 'Not Verified', icon: '🔍' },
    };

    const badge = badges[status as keyof typeof badges] || badges.unverified;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <span className="mr-2">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
              activeTab === 'profile'
                ? 'text-[#f06123] border-b-2 border-[#f06123]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Personal Information
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
              activeTab === 'verification'
                ? 'text-[#f06123] border-b-2 border-[#f06123]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🛡️ Identity Verification
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Verification Status Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
                <p className="text-gray-600 mt-1">
                  {profile.verificationStatus === 'verified' 
                    ? 'Your identity has been successfully verified. Thank you for completing the process!'
                    : profile.verificationStatus === 'pending'
                    ? 'Your documents are under review. This usually takes 1-2 business days.'
                    : profile.verificationStatus === 'rejected'
                    ? 'Some documents need attention. Please check the verification tab for details.'
                    : 'Verify your identity to access all features and build trust with hosts.'
                  }
                </p>
              </div>
              <div className="text-right">
                {getVerificationBadge(profile.verificationStatus)}
                <button
                  type="button"
                  onClick={() => setActiveTab('verification')}
                  className="mt-2 text-[#f06123] hover:text-orange-600 font-medium text-sm"
                >
                  {profile.verificationStatus === 'verified' ? 'View Documents' : 'Start Verification'}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Profile Photo</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={profile.profileImagePath}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#f06123]"
                  onError={(e) => {
                    // If image fails to load, fallback to default
                    e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                  }}
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-[#f06123] text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[#383a3c]">Your Avatar</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {isEditing 
                    ? 'Click the camera icon to upload a new photo' 
                    : 'This is your profile picture'
                  }
                </p>
                {isLoading && (
                  <p className="text-sm text-[#f06123] mt-1">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#383a3c]">Personal Information</h2>
              <button
                type="button"
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className="text-[#f06123] hover:text-orange-600 font-medium"
                disabled={isLoading}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={!isEditing || isLoading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={!isEditing || isLoading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing || isLoading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Role
                </label>
                <input
                  type="text"
                  value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                disabled={!isEditing || isLoading}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <DocumentVerification 
          user={profile} 
          onUpdate={(updatedUser) => setProfile(updatedUser)}
        />
      )}
    </div>
  );
}


























































































// // components/dashboard/ProfileForm.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { api } from '@/lib/api';
// import DocumentVerification from './DocumentVerification';

// interface UserProfile {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   dateOfBirth: string;
//   bio: string;
//   profileImagePath: string;
//   role: string;
//   isVerified: boolean;
//   verificationStatus: string;
//   documents: any[];
// }

// export default function ProfileForm() {
//   const { user: authUser, logout } = useAuth();
//   const [activeTab, setActiveTab] = useState<'profile' | 'verification'>('profile');
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   // Load profile data when component mounts or authUser changes
//   useEffect(() => {
//     if (authUser) {
//       setProfile({
//         _id: authUser._id,
//         firstName: authUser.firstName,
//         lastName: authUser.lastName,
//         email: authUser.email,
//         phone: authUser.phone || '',
//         dateOfBirth: authUser.dateOfBirth || '',
//         bio: authUser.bio || '',
//         profileImagePath: authUser.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
//         role: authUser.role,
//         isVerified: authUser.isVerified,
//         verificationStatus: authUser.verificationStatus || 'unverified',
//         documents: authUser.documents || [],
//       });
//     }
//   }, [authUser]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!profile) return;

//     setIsLoading(true);
//     setError('');
//     setMessage('');

//     try {
//       const formData = new FormData();
      
//       // Append profile data
//       formData.append('firstName', profile.firstName);
//       formData.append('lastName', profile.lastName);
//       formData.append('email', profile.email);
//       formData.append('phone', profile.phone);
//       formData.append('dateOfBirth', profile.dateOfBirth);
//       formData.append('bio', profile.bio);

//       const response = await api.put(`/users/${profile._id}`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       setMessage('Profile updated successfully!');
//       setIsEditing(false);
      
//       // Update auth context with new user data
//       if (authUser) {
//         localStorage.setItem('user', JSON.stringify({
//           ...authUser,
//           firstName: profile.firstName,
//           lastName: profile.lastName,
//           email: profile.email,
//           phone: profile.phone,
//           dateOfBirth: profile.dateOfBirth,
//           bio: profile.bio,
//         }));
//       }

//     } catch (err: any) {
//       console.error('Error updating profile:', err);
//       setError(err.response?.data?.message || 'Failed to update profile');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (field: keyof UserProfile, value: string) => {
//     if (profile) {
//       setProfile(prev => prev ? { ...prev, [field]: value } : null);
//     }
//   };

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || !profile) return;

//     setIsLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('profileImage', file);

//       const response = await api.put(`/users/${profile._id}`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       // Update profile image in state
//       setProfile(prev => prev ? { 
//         ...prev, 
//         profileImagePath: response.data.user.profileImagePath 
//       } : null);

//       // Update auth context
//       if (authUser) {
//         localStorage.setItem('user', JSON.stringify({
//           ...authUser,
//           profileImagePath: response.data.user.profileImagePath,
//         }));
//       }

//       setMessage('Profile picture updated successfully!');
//     } catch (err: any) {
//       console.error('Error uploading image:', err);
//       setError(err.response?.data?.message || 'Failed to upload image');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     // Reset form to original auth user data
//     if (authUser) {
//       setProfile({
//         _id: authUser._id,
//         firstName: authUser.firstName,
//         lastName: authUser.lastName,
//         email: authUser.email,
//         phone: authUser.phone || '',
//         dateOfBirth: authUser.dateOfBirth || '',
//         bio: authUser.bio || '',
//         profileImagePath: authUser.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
//         role: authUser.role,
//         isVerified: authUser.isVerified,
//         verificationStatus: authUser.verificationStatus || 'unverified',
//         documents: authUser.documents || [],
//       });
//     }
//     setIsEditing(false);
//     setError('');
//     setMessage('');
//   };

//   const getVerificationBadge = (status: string) => {
//     const badges = {
//       verified: { color: 'bg-green-100 text-green-800', text: 'Verified', icon: '✅' },
//       pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review', icon: '⏳' },
//       rejected: { color: 'bg-red-100 text-red-800', text: 'Verification Failed', icon: '❌' },
//       unverified: { color: 'bg-gray-100 text-gray-800', text: 'Not Verified', icon: '🔍' },
//     };

//     const badge = badges[status as keyof typeof badges] || badges.unverified;
    
//     return (
//       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
//         <span className="mr-2">{badge.icon}</span>
//         {badge.text}
//       </span>
//     );
//   };

//   if (!profile) {
//     return (
//       <div className="flex justify-center items-center py-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl">
//       {/* Tab Navigation */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
//         <div className="flex border-b border-gray-200">
//           <button
//             onClick={() => setActiveTab('profile')}
//             className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
//               activeTab === 'profile'
//                 ? 'text-[#f06123] border-b-2 border-[#f06123]'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             👤 Personal Information
//           </button>
//           <button
//             onClick={() => setActiveTab('verification')}
//             className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
//               activeTab === 'verification'
//                 ? 'text-[#f06123] border-b-2 border-[#f06123]'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             🛡️ Identity Verification
//           </button>
//         </div>
//       </div>

//       {/* Messages */}
//       {message && (
//         <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
//           {message}
//         </div>
//       )}
      
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
//           {error}
//         </div>
//       )}

//       {/* Profile Tab */}
//       {activeTab === 'profile' && (
//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* Verification Status Banner */}
//           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
//                 <p className="text-gray-600 mt-1">
//                   {profile.verificationStatus === 'verified' 
//                     ? 'Your identity has been successfully verified. Thank you for completing the process!'
//                     : profile.verificationStatus === 'pending'
//                     ? 'Your documents are under review. This usually takes 1-2 business days.'
//                     : profile.verificationStatus === 'rejected'
//                     ? 'Some documents need attention. Please check the verification tab for details.'
//                     : 'Verify your identity to access all features and build trust with hosts.'
//                   }
//                 </p>
//               </div>
//               <div className="text-right">
//                 {getVerificationBadge(profile.verificationStatus)}
//                 <button
//                   type="button"
//                   onClick={() => setActiveTab('verification')}
//                   className="mt-2 text-[#f06123] hover:text-orange-600 font-medium text-sm"
//                 >
//                   {profile.verificationStatus === 'verified' ? 'View Documents' : 'Start Verification'}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Profile Photo */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Profile Photo</h2>
//             <div className="flex items-center space-x-6">
//               <div className="relative">
//                 <img
//                   src={profile.profileImagePath}
//                   alt="Profile"
//                   className="w-24 h-24 rounded-full object-cover border-2 border-[#f06123]"
//                 />
//                 {isEditing && (
//                   <label className="absolute bottom-0 right-0 bg-[#f06123] text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition duration-200">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                       className="hidden"
//                       disabled={isLoading}
//                     />
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
//                     </svg>
//                   </label>
//                 )}
//               </div>
//               <div>
//                 <h3 className="font-semibold text-[#383a3c]">Your Avatar</h3>
//                 <p className="text-gray-600 text-sm mt-1">
//                   {isEditing 
//                     ? 'Click the camera icon to upload a new photo' 
//                     : 'This is your profile picture'
//                   }
//                 </p>
//                 {isLoading && (
//                   <p className="text-sm text-[#f06123] mt-1">Uploading...</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Personal Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-xl font-semibold text-[#383a3c]">Personal Information</h2>
//               <button
//                 type="button"
//                 onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
//                 className="text-[#f06123] hover:text-orange-600 font-medium"
//                 disabled={isLoading}
//               >
//                 {isEditing ? 'Cancel' : 'Edit'}
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   First Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={profile.firstName}
//                   onChange={(e) => handleChange('firstName', e.target.value)}
//                   disabled={!isEditing || isLoading}
//                   required
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Last Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={profile.lastName}
//                   onChange={(e) => handleChange('lastName', e.target.value)}
//                   disabled={!isEditing || isLoading}
//                   required
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Email Address *
//                 </label>
//                 <input
//                   type="email"
//                   value={profile.email}
//                   onChange={(e) => handleChange('email', e.target.value)}
//                   disabled={!isEditing || isLoading}
//                   required
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Phone Number
//                 </label>
//                 <input
//                   type="tel"
//                   value={profile.phone}
//                   onChange={(e) => handleChange('phone', e.target.value)}
//                   disabled={!isEditing || isLoading}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
//                   placeholder="+1 (555) 123-4567"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Date of Birth
//                 </label>
//                 <input
//                   type="date"
//                   value={profile.dateOfBirth}
//                   onChange={(e) => handleChange('dateOfBirth', e.target.value)}
//                   disabled={!isEditing || isLoading}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Account Role
//                 </label>
//                 <input
//                   type="text"
//                   value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
//                   disabled
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
//                 />
//               </div>
//             </div>

//             <div className="mt-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Bio
//               </label>
//               <textarea
//                 value={profile.bio}
//                 onChange={(e) => handleChange('bio', e.target.value)}
//                 disabled={!isEditing || isLoading}
//                 rows={4}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
//                 placeholder="Tell us a bit about yourself..."
//               />
//             </div>

//             {isEditing && (
//               <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={handleCancel}
//                   disabled={isLoading}
//                   className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isLoading ? 'Saving...' : 'Save Changes'}
//                 </button>
//               </div>
//             )}
//           </div>
//         </form>
//       )}

//       {/* Verification Tab */}
//       {activeTab === 'verification' && (
//         <DocumentVerification 
//           user={profile} 
//           onUpdate={(updatedUser) => setProfile(updatedUser)}
//         />
//       )}
//     </div>
//   );
// }


































































// // components/dashboard/ProfileForm.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { api } from '@/lib/api';
// import DocumentVerification from './DocumentVerification';

// interface UserProfile {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   dateOfBirth: string;
//   bio: string;
//   profileImagePath: string;
//   role: string;
//   isVerified: boolean;
//   verificationStatus: string;
//   documents: any[];
// }

// export default function ProfileForm() {
//   const { user: authUser, logout } = useAuth();
//   const [activeTab, setActiveTab] = useState<'profile' | 'verification'>('profile');
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   // Load profile data when component mounts or authUser changes
//   useEffect(() => {
//     if (authUser) {
//       setProfile({
//         _id: authUser._id,
//         firstName: authUser.firstName,
//         lastName: authUser.lastName,
//         email: authUser.email,
//         phone: authUser.phone || '',
//         dateOfBirth: authUser.dateOfBirth || '',
//         bio: authUser.bio || '',
//         profileImagePath: authUser.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
//         role: authUser.role,
//         isVerified: authUser.isVerified,
//         verificationStatus: authUser.verificationStatus || 'unverified',
//         documents: authUser.documents || [],
//       });
//     }
//   }, [authUser]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!profile) return;

//     setIsLoading(true);
//     setError('');
//     setMessage('');

//     try {
//       const formData = new FormData();
      
//       // Append profile data
//       formData.append('firstName', profile.firstName);
//       formData.append('lastName', profile.lastName);
//       formData.append('email', profile.email);
//       formData.append('phone', profile.phone);
//       formData.append('dateOfBirth', profile.dateOfBirth);
//       formData.append('bio', profile.bio);

//       const response = await api.put(`/users/${profile._id}`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       setMessage('Profile updated successfully!');
//       setIsEditing(false);
      
//       // Update auth context with new user data
//       if (authUser) {
//         localStorage.setItem('user', JSON.stringify({
//           ...authUser,
//           firstName: profile.firstName,
//           lastName: profile.lastName,
//           email: profile.email,
//           phone: profile.phone,
//           dateOfBirth: profile.dateOfBirth,
//           bio: profile.bio,
//         }));
//       }

//     } catch (err: any) {
//       console.error('Error updating profile:', err);
//       setError(err.response?.data?.message || 'Failed to update profile');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (field: keyof UserProfile, value: string) => {
//     if (profile) {
//       setProfile(prev => prev ? { ...prev, [field]: value } : null);
//     }
//   };

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || !profile) return;

//     setIsLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('profileImage', file);

//       const response = await api.put(`/users/${profile._id}`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       // Update profile image in state
//       setProfile(prev => prev ? { 
//         ...prev, 
//         profileImagePath: response.data.user.profileImagePath 
//       } : null);

//       // Update auth context
//       if (authUser) {
//         localStorage.setItem('user', JSON.stringify({
//           ...authUser,
//           profileImagePath: response.data.user.profileImagePath,
//         }));
//       }

//       setMessage('Profile picture updated successfully!');
//     } catch (err: any) {
//       console.error('Error uploading image:', err);
//       setError(err.response?.data?.message || 'Failed to upload image');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     // Reset form to original auth user data
//     if (authUser) {
//       setProfile({
//         _id: authUser._id,
//         firstName: authUser.firstName,
//         lastName: authUser.lastName,
//         email: authUser.email,
//         phone: authUser.phone || '',
//         dateOfBirth: authUser.dateOfBirth || '',
//         bio: authUser.bio || '',
//         profileImagePath: authUser.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
//         role: authUser.role,
//         isVerified: authUser.isVerified,
//         verificationStatus: authUser.verificationStatus || 'unverified',
//         documents: authUser.documents || [],
//       });
//     }
//     setIsEditing(false);
//     setError('');
//     setMessage('');
//   };

//   const getVerificationBadge = (status: string) => {
//     const badges = {
//       verified: { color: 'bg-green-100 text-green-800', text: 'Verified', icon: '✅' },
//       pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review', icon: '⏳' },
//       rejected: { color: 'bg-red-100 text-red-800', text: 'Verification Failed', icon: '❌' },
//       unverified: { color: 'bg-gray-100 text-gray-800', text: 'Not Verified', icon: '🔍' },
//     };

//     const badge = badges[status as keyof typeof badges] || badges.unverified;
    
//     return (
//       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
//         <span className="mr-2">{badge.icon}</span>
//         {badge.text}
//       </span>
//     );
//   };

//   if (!profile) {
//     return (
//       <div className="flex justify-center items-center py-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl">
//       {/* Tab Navigation */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
//         <div className="flex border-b border-gray-200">
//           <button
//             onClick={() => setActiveTab('profile')}
//             className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
//               activeTab === 'profile'
//                 ? 'text-[#f06123] border-b-2 border-[#f06123]'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             👤 Personal Information
//           </button>
//           <button
//             onClick={() => setActiveTab('verification')}
//             className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
//               activeTab === 'verification'
//                 ? 'text-[#f06123] border-b-2 border-[#f06123]'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             🛡️ Identity Verification
//           </button>
//         </div>
//       </div>

//       {/* Messages */}
//       {message && (
//         <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
//           {message}
//         </div>
//       )}
      
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
//           {error}
//         </div>
//       )}

//       {/* Profile Tab */}
//       {activeTab === 'profile' && (
//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* Verification Status Banner */}
//           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
//                 <p className="text-gray-600 mt-1">
//                   {profile.verificationStatus === 'verified' 
//                     ? 'Your identity has been successfully verified. Thank you for completing the process!'
//                     : profile.verificationStatus === 'pending'
//                     ? 'Your documents are under review. This usually takes 1-2 business days.'
//                     : profile.verificationStatus === 'rejected'
//                     ? 'Some documents need attention. Please check the verification tab for details.'
//                     : 'Verify your identity to access all features and build trust with hosts.'
//                   }
//                 </p>
//               </div>
//               <div className="text-right">
//                 {getVerificationBadge(profile.verificationStatus)}
//                 <button
//                   type="button"
//                   onClick={() => setActiveTab('verification')}
//                   className="mt-2 text-[#f06123] hover:text-orange-600 font-medium text-sm"
//                 >
//                   {profile.verificationStatus === 'verified' ? 'View Documents' : 'Start Verification'}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Profile Photo */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Profile Photo</h2>
//             <div className="flex items-center space-x-6">
//               <div className="relative">
//                 <img
//                   src={profile.profileImagePath}
//                   alt="Profile"
//                   className="w-24 h-24 rounded-full object-cover border-2 border-[#f06123]"
//                 />
//                 {isEditing && (
//                   <label className="absolute bottom-0 right-0 bg-[#f06123] text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition duration-200">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                       className="hidden"
//                       disabled={isLoading}
//                     />
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
//                     </svg>
//                   </label>
//                 )}
//               </div>
//               <div>
//                 <h3 className="font-semibold text-[#383a3c]">Your Avatar</h3>
//                 <p className="text-gray-600 text-sm mt-1">
//                   {isEditing 
//                     ? 'Click the camera icon to upload a new photo' 
//                     : 'This is your profile picture'
//                   }
//                 </p>
//                 {isLoading && (
//                   <p className="text-sm text-[#f06123] mt-1">Uploading...</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Personal Information */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-xl font-semibold text-[#383a3c]">Personal Information</h2>
//               <button
//                 type="button"
//                 onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
//                 className="text-[#f06123] hover:text-orange-600 font-medium"
//                 disabled={isLoading}
//               >
//                 {isEditing ? 'Cancel' : 'Edit'}
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* ... (rest of personal info fields remain the same) ... */}
//             </div>

//             {isEditing && (
//               <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={handleCancel}
//                   disabled={isLoading}
//                   className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isLoading ? 'Saving...' : 'Save Changes'}
//                 </button>
//               </div>
//             )}
//           </div>
//         </form>
//       )}

//       {/* Verification Tab */}
//       {activeTab === 'verification' && (
//         <DocumentVerification 
//           user={profile} 
//           onUpdate={(updatedUser) => setProfile(updatedUser)}
//         />
//       )}
//     </div>
//   );
// }



























































// // // components/dashboard/ProfileForm.tsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { api } from '@/lib/api';

// // interface UserProfile {
// //   _id: string;
// //   firstName: string;
// //   lastName: string;
// //   email: string;
// //   phone: string;
// //   dateOfBirth: string;
// //   bio: string;
// //   profileImagePath: string;
// //   role: string;
// //   isVerified: boolean;
// // }

// // export default function ProfileForm() {
// //   const { user: authUser, logout } = useAuth();
// //   const [profile, setProfile] = useState<UserProfile | null>(null);
// //   const [isEditing, setIsEditing] = useState(false);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [message, setMessage] = useState('');
// //   const [error, setError] = useState('');

// //   // Load profile data when component mounts or authUser changes
// //   useEffect(() => {
// //     if (authUser) {
// //       setProfile({
// //         _id: authUser._id,
// //         firstName: authUser.firstName,
// //         lastName: authUser.lastName,
// //         email: authUser.email,
// //         phone: authUser.phone || '',
// //         dateOfBirth: authUser.dateOfBirth || '',
// //         bio: authUser.bio || '',
// //         profileImagePath: authUser.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
// //         role: authUser.role,
// //         isVerified: authUser.isVerified,
// //       });
// //     }
// //   }, [authUser]);

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!profile) return;

// //     setIsLoading(true);
// //     setError('');
// //     setMessage('');

// //     try {
// //       const formData = new FormData();
      
// //       // Append profile data
// //       formData.append('firstName', profile.firstName);
// //       formData.append('lastName', profile.lastName);
// //       formData.append('email', profile.email);
// //       formData.append('phone', profile.phone);
// //       formData.append('dateOfBirth', profile.dateOfBirth);
// //       formData.append('bio', profile.bio);

// //       const response = await api.put(`/users/${profile._id}`, formData, {
// //         headers: {
// //           'Content-Type': 'multipart/form-data',
// //         },
// //       });

// //       setMessage('Profile updated successfully!');
// //       setIsEditing(false);
      
// //       // Update auth context with new user data
// //       if (authUser) {
// //         localStorage.setItem('user', JSON.stringify({
// //           ...authUser,
// //           firstName: profile.firstName,
// //           lastName: profile.lastName,
// //           email: profile.email,
// //           phone: profile.phone,
// //           dateOfBirth: profile.dateOfBirth,
// //           bio: profile.bio,
// //         }));
// //       }

// //     } catch (err: any) {
// //       console.error('Error updating profile:', err);
// //       setError(err.response?.data?.message || 'Failed to update profile');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const handleChange = (field: keyof UserProfile, value: string) => {
// //     if (profile) {
// //       setProfile(prev => prev ? { ...prev, [field]: value } : null);
// //     }
// //   };

// //   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file || !profile) return;

// //     setIsLoading(true);
// //     setError('');

// //     try {
// //       const formData = new FormData();
// //       formData.append('profileImage', file);

// //       const response = await api.put(`/users/${profile._id}`, formData, {
// //         headers: {
// //           'Content-Type': 'multipart/form-data',
// //         },
// //       });

// //       // Update profile image in state
// //       setProfile(prev => prev ? { 
// //         ...prev, 
// //         profileImagePath: response.data.user.profileImagePath 
// //       } : null);

// //       // Update auth context
// //       if (authUser) {
// //         localStorage.setItem('user', JSON.stringify({
// //           ...authUser,
// //           profileImagePath: response.data.user.profileImagePath,
// //         }));
// //       }

// //       setMessage('Profile picture updated successfully!');
// //     } catch (err: any) {
// //       console.error('Error uploading image:', err);
// //       setError(err.response?.data?.message || 'Failed to upload image');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const handleCancel = () => {
// //     // Reset form to original auth user data
// //     if (authUser) {
// //       setProfile({
// //         _id: authUser._id,
// //         firstName: authUser.firstName,
// //         lastName: authUser.lastName,
// //         email: authUser.email,
// //         phone: authUser.phone || '',
// //         dateOfBirth: authUser.dateOfBirth || '',
// //         bio: authUser.bio || '',
// //         profileImagePath: authUser.profileImagePath || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
// //         role: authUser.role,
// //         isVerified: authUser.isVerified,
// //       });
// //     }
// //     setIsEditing(false);
// //     setError('');
// //     setMessage('');
// //   };

// //   if (!profile) {
// //     return (
// //       <div className="flex justify-center items-center py-12">
// //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="max-w-4xl">
// //       {/* Messages */}
// //       {message && (
// //         <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
// //           {message}
// //         </div>
// //       )}
      
// //       {error && (
// //         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
// //           {error}
// //         </div>
// //       )}

// //       <form onSubmit={handleSubmit} className="space-y-8">
// //         {/* Profile Photo */}
// //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //           <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Profile Photo</h2>
// //           <div className="flex items-center space-x-6">
// //             <div className="relative">
// //               <img
// //                 src={profile.profileImagePath}
// //                 alt="Profile"
// //                 className="w-24 h-24 rounded-full object-cover border-2 border-[#f06123]"
// //               />
// //               {isEditing && (
// //                 <label className="absolute bottom-0 right-0 bg-[#f06123] text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition duration-200">
// //                   <input
// //                     type="file"
// //                     accept="image/*"
// //                     onChange={handleImageUpload}
// //                     className="hidden"
// //                     disabled={isLoading}
// //                   />
// //                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
// //                   </svg>
// //                 </label>
// //               )}
// //             </div>
// //             <div>
// //               <h3 className="font-semibold text-[#383a3c]">Your Avatar</h3>
// //               <p className="text-gray-600 text-sm mt-1">
// //                 {isEditing 
// //                   ? 'Click the camera icon to upload a new photo' 
// //                   : 'This is your profile picture'
// //                 }
// //               </p>
// //               {isLoading && (
// //                 <p className="text-sm text-[#f06123] mt-1">Uploading...</p>
// //               )}
// //             </div>
// //           </div>
// //         </div>

// //         {/* Personal Information */}
// //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //           <div className="flex justify-between items-center mb-6">
// //             <h2 className="text-xl font-semibold text-[#383a3c]">Personal Information</h2>
// //             <button
// //               type="button"
// //               onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
// //               className="text-[#f06123] hover:text-orange-600 font-medium"
// //               disabled={isLoading}
// //             >
// //               {isEditing ? 'Cancel' : 'Edit'}
// //             </button>
// //           </div>

// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 First Name *
// //               </label>
// //               <input
// //                 type="text"
// //                 value={profile.firstName}
// //                 onChange={(e) => handleChange('firstName', e.target.value)}
// //                 disabled={!isEditing || isLoading}
// //                 required
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Last Name *
// //               </label>
// //               <input
// //                 type="text"
// //                 value={profile.lastName}
// //                 onChange={(e) => handleChange('lastName', e.target.value)}
// //                 disabled={!isEditing || isLoading}
// //                 required
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Email Address *
// //               </label>
// //               <input
// //                 type="email"
// //                 value={profile.email}
// //                 onChange={(e) => handleChange('email', e.target.value)}
// //                 disabled={!isEditing || isLoading}
// //                 required
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Phone Number
// //               </label>
// //               <input
// //                 type="tel"
// //                 value={profile.phone}
// //                 onChange={(e) => handleChange('phone', e.target.value)}
// //                 disabled={!isEditing || isLoading}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// //                 placeholder="+1 (555) 123-4567"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Date of Birth
// //               </label>
// //               <input
// //                 type="date"
// //                 value={profile.dateOfBirth}
// //                 onChange={(e) => handleChange('dateOfBirth', e.target.value)}
// //                 disabled={!isEditing || isLoading}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Account Role
// //               </label>
// //               <input
// //                 type="text"
// //                 value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
// //                 disabled
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
// //               />
// //             </div>
// //           </div>

// //           <div className="mt-6">
// //             <label className="block text-sm font-medium text-gray-700 mb-2">
// //               Bio
// //             </label>
// //             <textarea
// //               value={profile.bio}
// //               onChange={(e) => handleChange('bio', e.target.value)}
// //               disabled={!isEditing || isLoading}
// //               rows={4}
// //               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
// //               placeholder="Tell us a bit about yourself..."
// //             />
// //           </div>

// //           {isEditing && (
// //             <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
// //               <button
// //                 type="button"
// //                 onClick={handleCancel}
// //                 disabled={isLoading}
// //                 className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 disabled:opacity-50"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="submit"
// //                 disabled={isLoading}
// //                 className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
// //               >
// //                 {isLoading ? 'Saving...' : 'Save Changes'}
// //               </button>
// //             </div>
// //           )}
// //         </div>
// //       </form>
// //     </div>
// //   );
// // }






















































// // // 'use client';

// // // import { useState } from 'react';

// // // interface UserProfile {
// // //   firstName: string;
// // //   lastName: string;
// // //   email: string;
// // //   phone: string;
// // //   dateOfBirth: string;
// // //   bio: string;
// // //   profileImage: string;
// // // }

// // // export default function ProfileForm() {
// // //   const [profile, setProfile] = useState<UserProfile>({
// // //     firstName: 'John',
// // //     lastName: 'Doe',
// // //     email: 'john.doe@example.com',
// // //     phone: '+1 (555) 123-4567',
// // //     dateOfBirth: '1990-01-01',
// // //     bio: 'Travel enthusiast and property investor. Love exploring new places and experiencing different cultures.',
// // //     profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
// // //   });

// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [isLoading, setIsLoading] = useState(false);

// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     setIsLoading(true);
    
// // //     // Simulate API call
// // //     await new Promise(resolve => setTimeout(resolve, 1000));
    
// // //     setIsLoading(false);
// // //     setIsEditing(false);
// // //     // In real app, you would update the profile via API
// // //   };

// // //   const handleChange = (field: keyof UserProfile, value: string) => {
// // //     setProfile(prev => ({ ...prev, [field]: value }));
// // //   };

// // //   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     const file = e.target.files?.[0];
// // //     if (file) {
// // //       const reader = new FileReader();
// // //       reader.onload = (e) => {
// // //         handleChange('profileImage', e.target?.result as string);
// // //       };
// // //       reader.readAsDataURL(file);
// // //     }
// // //   };

// // //   return (
// // //     <div className="max-w-4xl">
// // //       <form onSubmit={handleSubmit} className="space-y-8">
// // //         {/* Profile Photo */}
// // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// // //           <h2 className="text-xl font-semibold text-[#383a3c] mb-6">Profile Photo</h2>
// // //           <div className="flex items-center space-x-6">
// // //             <div className="relative">
// // //               <img
// // //                 src={profile.profileImage}
// // //                 alt="Profile"
// // //                 className="w-24 h-24 rounded-full object-cover"
// // //               />
// // //               {isEditing && (
// // //                 <label className="absolute bottom-0 right-0 bg-[#f06123] text-white p-1 rounded-full cursor-pointer hover:bg-orange-600 transition duration-200">
// // //                   <input
// // //                     type="file"
// // //                     accept="image/*"
// // //                     onChange={handleImageUpload}
// // //                     className="hidden"
// // //                   />
// // //                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
// // //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
// // //                   </svg>
// // //                 </label>
// // //               )}
// // //             </div>
// // //             <div>
// // //               <h3 className="font-semibold text-[#383a3c]">Your Avatar</h3>
// // //               <p className="text-gray-600 text-sm mt-1">
// // //                 {isEditing 
// // //                   ? 'Click the camera icon to upload a new photo' 
// // //                   : 'This is your profile picture'
// // //                 }
// // //               </p>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Personal Information */}
// // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// // //           <div className="flex justify-between items-center mb-6">
// // //             <h2 className="text-xl font-semibold text-[#383a3c]">Personal Information</h2>
// // //             <button
// // //               type="button"
// // //               onClick={() => setIsEditing(!isEditing)}
// // //               className="text-[#f06123] hover:text-orange-600 font-medium"
// // //             >
// // //               {isEditing ? 'Cancel' : 'Edit'}
// // //             </button>
// // //           </div>

// // //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// // //             <div>
// // //               <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                 First Name
// // //               </label>
// // //               <input
// // //                 type="text"
// // //                 value={profile.firstName}
// // //                 onChange={(e) => handleChange('firstName', e.target.value)}
// // //                 disabled={!isEditing}
// // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// // //               />
// // //             </div>

// // //             <div>
// // //               <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                 Last Name
// // //               </label>
// // //               <input
// // //                 type="text"
// // //                 value={profile.lastName}
// // //                 onChange={(e) => handleChange('lastName', e.target.value)}
// // //                 disabled={!isEditing}
// // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// // //               />
// // //             </div>

// // //             <div>
// // //               <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                 Email Address
// // //               </label>
// // //               <input
// // //                 type="email"
// // //                 value={profile.email}
// // //                 onChange={(e) => handleChange('email', e.target.value)}
// // //                 disabled={!isEditing}
// // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// // //               />
// // //             </div>

// // //             <div>
// // //               <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                 Phone Number
// // //               </label>
// // //               <input
// // //                 type="tel"
// // //                 value={profile.phone}
// // //                 onChange={(e) => handleChange('phone', e.target.value)}
// // //                 disabled={!isEditing}
// // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// // //               />
// // //             </div>

// // //             <div>
// // //               <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                 Date of Birth
// // //               </label>
// // //               <input
// // //                 type="date"
// // //                 value={profile.dateOfBirth}
// // //                 onChange={(e) => handleChange('dateOfBirth', e.target.value)}
// // //                 disabled={!isEditing}
// // //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
// // //               />
// // //             </div>
// // //           </div>

// // //           <div className="mt-6">
// // //             <label className="block text-sm font-medium text-gray-700 mb-2">
// // //               Bio
// // //             </label>
// // //             <textarea
// // //               value={profile.bio}
// // //               onChange={(e) => handleChange('bio', e.target.value)}
// // //               disabled={!isEditing}
// // //               rows={4}
// // //               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
// // //             />
// // //           </div>

// // //           {isEditing && (
// // //             <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
// // //               <button
// // //                 type="button"
// // //                 onClick={() => setIsEditing(false)}
// // //                 className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
// // //               >
// // //                 Cancel
// // //               </button>
// // //               <button
// // //                 type="submit"
// // //                 disabled={isLoading}
// // //                 className="px-6 py-3 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
// // //               >
// // //                 {isLoading ? 'Saving...' : 'Save Changes'}
// // //               </button>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </form>
// // //     </div>
// // //   );
// // // }


