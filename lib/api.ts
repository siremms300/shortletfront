// /lib/api.ts
import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://holsapartmentsbackend.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client-side only interceptor for adding tokens
if (typeof window !== 'undefined') {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle token refresh (client-side only)
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Redirect to login if refresh fails
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

// Create a separate API instance for server components that doesn't use localStorage
export const serverApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API calls
export const authAPI = {
  register: async (userData: FormData) => {
    const response = await api.post('/auth/register', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};

// Users API calls
export const usersAPI = {
  // Get all users (Admin only)
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID (users can get their own, admin can get any)
  getUserById: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get user by ID for admin (admin only)
  getAdminUserById: async (userId: string) => {
    const response = await api.get(`/users/admin/${userId}`);
    return response.data;
  },

  // Update user profile (users can update their own)
  updateProfile: async (userId: string, userData: any) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Update user as admin (admin only)
  updateUser: async (userId: string, userData: any) => {
    const response = await api.put(`/users/admin/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (userId: string) => {
    const response = await api.delete(`/users/admin/${userId}`);
    return response.data;
  },

  // Get user documents (users can get their own)
  getUserDocuments: async (userId: string) => {
    const response = await api.get(`/users/${userId}/documents`);
    return response.data;
  },

  // Upload document
  uploadDocument: async (userId: string, documentData: FormData) => {
    const response = await api.post(`/users/${userId}/documents`, documentData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Verify user (admin only)
  verifyUser: async (userId: string) => {
    const response = await api.patch(`/users/admin/${userId}/verify`);
    return response.data;
  },

  // Suspend user (admin only)
  suspendUser: async (userId: string) => {
    const response = await api.patch(`/users/admin/${userId}/suspend`);
    return response.data;
  },

  // Activate user (admin only)
  activateUser: async (userId: string) => {
    const response = await api.patch(`/users/admin/${userId}/activate`);
    return response.data;
  },

  // Verify document (admin only)
  verifyDocument: async (documentId: string) => {
    const response = await api.patch(`/users/admin/documents/${documentId}/verify`);
    return response.data;
  },

  // Reject document (admin only)
  rejectDocument: async (documentId: string, rejectionReason: string) => {
    const response = await api.patch(`/users/admin/documents/${documentId}/reject`, { rejectionReason });
    return response.data;
  },

  // Approve document (admin only) - using 'approved' status
  approveDocument: async (documentId: string) => {
    const response = await api.patch(`/users/admin/documents/${documentId}/approve`);
    return response.data;
  }
};

// Property API calls (using serverApi for server components)  @@@@@@@@@2 the code below works 
// export const propertiesAPI = {
//   // Get all properties (public - no auth required)
//   // getProperties: async (params?: any) => {
//   //   const response = await serverApi.get('/properties', { params });
//   //   return response.data;
//   // },

//   // lib/api.ts - Update propertiesAPI.getProperties method
//   getProperties: async (params?: any) => {
//     try {
//       console.log('🔍 [Frontend API] Fetching properties with params:', params);
      
//       const response = await serverApi.get('/properties', { params });
//       console.log('📥 [Frontend API] Properties response:', {
//         hasProperties: !!response.data.properties,
//         dataType: Array.isArray(response.data) ? 'array' : 'object',
//         data: response.data
//       });
      
//       // Handle both response formats
//       let properties = [];
      
//       if (response.data.properties) {
//         // Response format: { properties: [], totalPages, currentPage, total }
//         properties = response.data.properties;
//       } else if (Array.isArray(response.data)) {
//         // Response format: [] (array directly)
//         properties = response.data;
//       } else if (response.data && typeof response.data === 'object') {
//         // Check if it's a single property or other format
//         properties = [response.data];
//       }
      
//       console.log('✅ [Frontend API] Extracted properties:', properties.length);
//       return properties;
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching properties:', error);
//       throw new Error(error.response?.data?.message || 'Failed to fetch properties');
//     }
//   },

//   // Get featured properties (public - no auth required)
//   getFeaturedProperties: async () => {
//     const response = await serverApi.get('/properties/featured');
//     return response.data;
//   },

//   // Get property by ID (public - no auth required)
//   // getPropertyById: async (id: string) => {
//   //   const response = await serverApi.get(`/properties/${id}`);
//   //   return response.data;
//   // },

  
//   // getPropertyById: async (id: string) => {
//   //   try {
//   //     // Validate ID before making the request
//   //     if (!id || id === 'undefined') {
//   //       throw new Error('Property ID is required');
//   //     }

//   //     const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
//   //     if (!isValidObjectId) {
//   //       throw new Error('Invalid property ID format');
//   //     }

//   //     const response = await serverApi.get(`/properties/${id}`);
//   //     return response.data;
//   //   } catch (error: any) {
//   //     console.error('API Error fetching property:', error);
      
//   //     // Re-throw with more specific error messages
//   //     if (error.response?.status === 400) {
//   //       throw new Error('Invalid property ID format');
//   //     }
//   //     if (error.response?.status === 404) {
//   //       throw new Error('Property not found');
//   //     }
//   //     throw new Error(error.response?.data?.message || 'Failed to fetch property');
//   //   }
//   // },
 


//   getPropertyById: async (id: string) => {
//     try {
//       console.log('🔍 [Frontend API] Fetching property with ID:', id);

//       // Validate ID before making the request
//       if (!id || id === 'undefined') {
//         console.error('❌ [Frontend API] Invalid property ID - undefined');
//         throw new Error('Property ID is required');
//       }

//       const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
//       if (!isValidObjectId) {
//         console.error('❌ [Frontend API] Invalid ObjectId format:', id);
//         throw new Error('Invalid property ID format');
//       }

//       console.log('✅ [Frontend API] ID validation passed, making request...');
      
//       const response = await serverApi.get(`/properties/${id}`);
//       console.log('✅ [Frontend API] Property fetched successfully');
//       return response.data;

//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching property:', error);
      
//       // Handle specific HTTP status codes
//       if (error.response?.status === 400) {
//         throw new Error(error.response.data?.message || 'Invalid property ID format');
//       }
//       if (error.response?.status === 404) {
//         throw new Error(error.response.data?.message || 'Property not found');
//       }
//       if (error.response?.status === 500) {
//         const serverMessage = error.response.data?.message || 'Server error';
//         console.error('💥 [Frontend API] Server error details:', error.response.data);
//         throw new Error(`Server error: ${serverMessage}`);
//       }
      
//       throw new Error(error.message || 'Failed to fetch property');
//     }
//   },
 

//   // Create property (requires auth)
//   createProperty: async (propertyData: FormData) => {
//     const response = await api.post('/properties', propertyData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Update property (requires auth)
//   updateProperty: async (id: string, propertyData: FormData) => {
//     const response = await api.put(`/properties/${id}`, propertyData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Delete property (requires auth)
//   deleteProperty: async (id: string) => {
//     const response = await api.delete(`/properties/${id}`);
//     return response.data;
//   },

//   // Get user's properties (requires auth)
//   getUserProperties: async () => {
//     const response = await api.get('/properties/user/my-properties');
//     return response.data;
//   },

//   // Admin: Get all properties (requires admin auth)
//   getAdminProperties: async (params?: any) => {
//     const response = await api.get('/properties/admin/all', { params });
//     return response.data;
//   },

//   // Admin: Update property status (requires admin auth)
//   updatePropertyStatus: async (id: string, status: string) => {
//     const response = await api.patch(`/properties/admin/${id}/status`, { status });
//     return response.data;
//   },

//   // Admin: Toggle featured status (requires admin auth)
//   toggleFeatured: async (id: string) => {
//     const response = await api.patch(`/properties/admin/${id}/feature`);
//     return response.data;
//   }
// };

// Property API calls (using serverApi for server components)
// export const propertiesAPI = {
//   // Get all properties (public - no auth required)
//   getProperties: async (params?: any) => {
//     try {
//       console.log('🔍 [Frontend API] Fetching properties with params:', params);
      
//       const response = await serverApi.get('/properties', { params });
//       console.log('📥 [Frontend API] Properties response:', {
//         hasProperties: !!response.data.properties,
//         dataType: Array.isArray(response.data) ? 'array' : 'object',
//         data: response.data
//       });
      
//       // Handle both response formats
//       let properties = [];
      
//       if (response.data.properties) {
//         // Response format: { properties: [], totalPages, currentPage, total }
//         properties = response.data.properties;
//       } else if (Array.isArray(response.data)) {
//         // Response format: [] (array directly)
//         properties = response.data;
//       } else if (response.data && typeof response.data === 'object') {
//         // Check if it's a single property or other format
//         properties = [response.data];
//       }
      
//       console.log('✅ [Frontend API] Extracted properties:', properties.length);
      
//       // Ensure all properties have the new price structure
//       const enhancedProperties = properties.map((property: any) => {
//         // If property doesn't have calculatedPrices, create it
//         if (!property.calculatedPrices && property.price) {
//           const utilityPercentage = property.utilityPercentage || 20;
//           const serviceChargePercentage = property.serviceChargePercentage || 10;
//           const vatPercentage = property.vatPercentage || 7.5;
//           const actualPrice = property.price;
          
//           const utility = (actualPrice * utilityPercentage) / 100;
//           const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//           const accommodation = actualPrice - utility - serviceCharge;
//           const vat = (accommodation * vatPercentage) / 100;
//           const total = actualPrice + vat;
          
//           return {
//             ...property,
//             utilityPercentage,
//             serviceChargePercentage,
//             vatPercentage,
//             calculatedPrices: {
//               actualPrice,
//               utility: Math.round(utility * 100) / 100,
//               serviceCharge: Math.round(serviceCharge * 100) / 100,
//               accommodation: Math.round(accommodation * 100) / 100,
//               vat: Math.round(vat * 100) / 100,
//               total: Math.round(total * 100) / 100
//             }
//           };
//         }
//         return property;
//       });
      
//       return enhancedProperties;
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching properties:', error);
//       throw new Error(error.response?.data?.message || 'Failed to fetch properties');
//     }
//   },

//   // Get featured properties (public - no auth required)
//   getFeaturedProperties: async () => {
//     try {
//       const response = await serverApi.get('/properties/featured');
      
//       // Ensure featured properties have the new price structure
//       const featuredProperties = Array.isArray(response.data) ? response.data : [];
      
//       return featuredProperties.map((property: any) => {
//         if (!property.calculatedPrices && property.price) {
//           const utilityPercentage = property.utilityPercentage || 20;
//           const serviceChargePercentage = property.serviceChargePercentage || 10;
//           const vatPercentage = property.vatPercentage || 7.5;
//           const actualPrice = property.price;
          
//           const utility = (actualPrice * utilityPercentage) / 100;
//           const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//           const accommodation = actualPrice - utility - serviceCharge;
//           const vat = (accommodation * vatPercentage) / 100;
//           const total = actualPrice + vat;
          
//           return {
//             ...property,
//             utilityPercentage,
//             serviceChargePercentage,
//             vatPercentage,
//             calculatedPrices: {
//               actualPrice,
//               utility: Math.round(utility * 100) / 100,
//               serviceCharge: Math.round(serviceCharge * 100) / 100,
//               accommodation: Math.round(accommodation * 100) / 100,
//               vat: Math.round(vat * 100) / 100,
//               total: Math.round(total * 100) / 100
//             }
//           };
//         }
//         return property;
//       });
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching featured properties:', error);
//       throw new Error(error.response?.data?.message || 'Failed to fetch featured properties');
//     }
//   },

//   // Get property by ID
//   getPropertyById: async (id: string) => {
//     try {
//       console.log('🔍 [Frontend API] Fetching property with ID:', id);

//       // Validate ID before making the request
//       if (!id || id === 'undefined') {
//         console.error('❌ [Frontend API] Invalid property ID - undefined');
//         throw new Error('Property ID is required');
//       }

//       const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
//       if (!isValidObjectId) {
//         console.error('❌ [Frontend API] Invalid ObjectId format:', id);
//         throw new Error('Invalid property ID format');
//       }

//       console.log('✅ [Frontend API] ID validation passed, making request...');
      
//       const response = await serverApi.get(`/properties/${id}`);
//       console.log('✅ [Frontend API] Property fetched successfully');
      
//       // Ensure the property has the new price structure
//       const property = response.data;
      
//       if (property && !property.calculatedPrices && property.price) {
//         const utilityPercentage = property.utilityPercentage || 20;
//         const serviceChargePercentage = property.serviceChargePercentage || 10;
//         const vatPercentage = property.vatPercentage || 7.5;
//         const actualPrice = property.price;
        
//         const utility = (actualPrice * utilityPercentage) / 100;
//         const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//         const accommodation = actualPrice - utility - serviceCharge;
//         const vat = (accommodation * vatPercentage) / 100;
//         const total = actualPrice + vat;
        
//         return {
//           ...property,
//           utilityPercentage,
//           serviceChargePercentage,
//           vatPercentage,
//           calculatedPrices: {
//             actualPrice,
//             utility: Math.round(utility * 100) / 100,
//             serviceCharge: Math.round(serviceCharge * 100) / 100,
//             accommodation: Math.round(accommodation * 100) / 100,
//             vat: Math.round(vat * 100) / 100,
//             total: Math.round(total * 100) / 100
//           }
//         };
//       }
      
//       return property;
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching property:', error);
      
//       // Handle specific HTTP status codes
//       if (error.response?.status === 400) {
//         throw new Error(error.response.data?.message || 'Invalid property ID format');
//       }
//       if (error.response?.status === 404) {
//         throw new Error(error.response.data?.message || 'Property not found');
//       }
//       if (error.response?.status === 500) {
//         const serverMessage = error.response.data?.message || 'Server error';
//         console.error('💥 [Frontend API] Server error details:', error.response.data);
//         throw new Error(`Server error: ${serverMessage}`);
//       }
      
//       throw new Error(error.message || 'Failed to fetch property');
//     }
//   },

//   // Create property (requires auth)
//   // createProperty: async (propertyData: FormData) => {
//   //   try {
//   //     const response = await api.post('/properties', propertyData, {
//   //       headers: { 'Content-Type': 'multipart/form-data' },
//   //     });
      
//   //     // Ensure response has calculatedPrices
//   //     if (response.data.property && !response.data.property.calculatedPrices) {
//   //       const property = response.data.property;
//   //       const utilityPercentage = property.utilityPercentage || 20;
//   //       const serviceChargePercentage = property.serviceChargePercentage || 10;
//   //       const vatPercentage = property.vatPercentage || 7.5;
//   //       const actualPrice = property.price;
        
//   //       const utility = (actualPrice * utilityPercentage) / 100;
//   //       const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//   //       const accommodation = actualPrice - utility - serviceCharge;
//   //       const vat = (accommodation * vatPercentage) / 100;
//   //       const total = actualPrice + vat;
        
//   //       response.data.property.calculatedPrices = {
//   //         actualPrice,
//   //         utility: Math.round(utility * 100) / 100,
//   //         serviceCharge: Math.round(serviceCharge * 100) / 100,
//   //         accommodation: Math.round(accommodation * 100) / 100,
//   //         vat: Math.round(vat * 100) / 100,
//   //         total: Math.round(total * 100) / 100
//   //       };
//   //     }
      
//   //     return response.data;
//   //   } catch (error: any) {
//   //     console.error('💥 [Frontend API] Error creating property:', error);
//   //     throw new Error(error.response?.data?.message || 'Failed to create property');
//   //   }
//   // },



//   // Update propertiesAPI.createProperty to properly handle discount data
//   createProperty: async (propertyData: FormData) => {
//     try {
//       // Log FormData contents for debugging
//       console.log('📤 Sending FormData with discount:');
//       for (const [key, value] of propertyData.entries()) {
//         if (key === 'discount') {
//           console.log('  - discount:', value);
//         }
//       }
      
//       const response = await api.post('/properties', propertyData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
      
//       console.log('📥 Create property response:', response.data);
      
//       return response.data;
//     } catch (error: any) {
//       console.error('💥 Error creating property:', error);
//       throw new Error(error.response?.data?.message || 'Failed to create property');
//     }
//   },

//   // Update propertiesAPI.updateProperty
//   updateProperty: async (id: string, propertyData: FormData) => {
//     try {
//       // Log FormData contents for debugging
//       console.log('📤 Sending FormData with discount for update:');
//       for (const [key, value] of propertyData.entries()) {
//         if (key === 'discount') {
//           console.log('  - discount:', value);
//         }
//       }
      
//       const response = await api.put(`/properties/${id}`, propertyData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
      
//       console.log('📥 Update property response:', response.data);
      
//       return response.data;
//     } catch (error: any) {
//       console.error('💥 Error updating property:', error);
//       throw new Error(error.response?.data?.message || 'Failed to update property');
//     }
//   },




//   // Update property (requires auth)
//   // updateProperty: async (id: string, propertyData: FormData) => {
//   //   try {
//   //     const response = await api.put(`/properties/${id}`, propertyData, {
//   //       headers: { 'Content-Type': 'multipart/form-data' },
//   //     });
      
//   //     // Ensure response has calculatedPrices
//   //     if (response.data.property && !response.data.property.calculatedPrices) {
//   //       const property = response.data.property;
//   //       const utilityPercentage = property.utilityPercentage || 20;
//   //       const serviceChargePercentage = property.serviceChargePercentage || 10;
//   //       const vatPercentage = property.vatPercentage || 7.5;
//   //       const actualPrice = property.price;
        
//   //       const utility = (actualPrice * utilityPercentage) / 100;
//   //       const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//   //       const accommodation = actualPrice - utility - serviceCharge;
//   //       const vat = (accommodation * vatPercentage) / 100;
//   //       const total = actualPrice + vat;
        
//   //       response.data.property.calculatedPrices = {
//   //         actualPrice,
//   //         utility: Math.round(utility * 100) / 100,
//   //         serviceCharge: Math.round(serviceCharge * 100) / 100,
//   //         accommodation: Math.round(accommodation * 100) / 100,
//   //         vat: Math.round(vat * 100) / 100,
//   //         total: Math.round(total * 100) / 100
//   //       };
//   //     }
      
//   //     return response.data;
//   //   } catch (error: any) {
//   //     console.error('💥 [Frontend API] Error updating property:', error);
//   //     throw new Error(error.response?.data?.message || 'Failed to update property');
//   //   }
//   // },

//   // Delete property (requires auth)
//   deleteProperty: async (id: string) => {
//     try {
//       const response = await api.delete(`/properties/${id}`);
//       return response.data;
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error deleting property:', error);
//       throw new Error(error.response?.data?.message || 'Failed to delete property');
//     }
//   },

//   // Get user's properties (requires auth)
//   getUserProperties: async () => {
//     try {
//       const response = await api.get('/properties/user/my-properties');
      
//       // Ensure properties have the new price structure
//       const userProperties = Array.isArray(response.data) ? response.data : [];
      
//       return userProperties.map((property: any) => {
//         if (!property.calculatedPrices && property.price) {
//           const utilityPercentage = property.utilityPercentage || 20;
//           const serviceChargePercentage = property.serviceChargePercentage || 10;
//           const vatPercentage = property.vatPercentage || 7.5;
//           const actualPrice = property.price;
          
//           const utility = (actualPrice * utilityPercentage) / 100;
//           const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//           const accommodation = actualPrice - utility - serviceCharge;
//           const vat = (accommodation * vatPercentage) / 100;
//           const total = actualPrice + vat;
          
//           return {
//             ...property,
//             utilityPercentage,
//             serviceChargePercentage,
//             vatPercentage,
//             calculatedPrices: {
//               actualPrice,
//               utility: Math.round(utility * 100) / 100,
//               serviceCharge: Math.round(serviceCharge * 100) / 100,
//               accommodation: Math.round(accommodation * 100) / 100,
//               vat: Math.round(vat * 100) / 100,
//               total: Math.round(total * 100) / 100
//             }
//           };
//         }
//         return property;
//       });
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching user properties:', error);
//       throw new Error(error.response?.data?.message || 'Failed to fetch user properties');
//     }
//   },

//   // Admin: Get all properties (requires admin auth)
//   getAdminProperties: async (params?: any) => {
//     try {
//       const response = await api.get('/properties/admin/all', { params });
      
//       // Ensure admin properties have the new price structure
//       let properties = [];
      
//       if (response.data.properties) {
//         properties = response.data.properties;
//       } else if (Array.isArray(response.data)) {
//         properties = response.data;
//       }
      
//       const enhancedProperties = properties.map((property: any) => {
//         if (!property.calculatedPrices && property.price) {
//           const utilityPercentage = property.utilityPercentage || 20;
//           const serviceChargePercentage = property.serviceChargePercentage || 10;
//           const vatPercentage = property.vatPercentage || 7.5;
//           const actualPrice = property.price;
          
//           const utility = (actualPrice * utilityPercentage) / 100;
//           const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//           const accommodation = actualPrice - utility - serviceCharge;
//           const vat = (accommodation * vatPercentage) / 100;
//           const total = actualPrice + vat;
          
//           return {
//             ...property,
//             utilityPercentage,
//             serviceChargePercentage,
//             vatPercentage,
//             calculatedPrices: {
//               actualPrice,
//               utility: Math.round(utility * 100) / 100,
//               serviceCharge: Math.round(serviceCharge * 100) / 100,
//               accommodation: Math.round(accommodation * 100) / 100,
//               vat: Math.round(vat * 100) / 100,
//               total: Math.round(total * 100) / 100
//             }
//           };
//         }
//         return property;
//       });
      
//       return {
//         ...response.data,
//         properties: enhancedProperties
//       };
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error fetching admin properties:', error);
//       throw new Error(error.response?.data?.message || 'Failed to fetch admin properties');
//     }
//   },

//   // Admin: Update property status (requires admin auth)
//   updatePropertyStatus: async (id: string, status: string) => {
//     try {
//       const response = await api.patch(`/properties/admin/${id}/status`, { status });
//       return response.data;
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error updating property status:', error);
//       throw new Error(error.response?.data?.message || 'Failed to update property status');
//     }
//   },

//   // Admin: Toggle featured status (requires admin auth)
//   toggleFeatured: async (id: string) => {
//     try {
//       const response = await api.patch(`/properties/admin/${id}/feature`);
//       return response.data;
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Error toggling featured status:', error);
//       throw new Error(error.response?.data?.message || 'Failed to toggle featured status');
//     }
//   }
// };



// Helper function to enrich property with calculated prices and discount info
const enrichPropertyWithDiscount = (property: any): any => {
  if (!property) return property;
  
  // If property has discount, log it
  if (property.discount && property.discount.isActive) {
    console.log('💰 Property has active discount:', {
      id: property._id,
      type: property.discount.type,
      value: property.discount.value,
      originalPrice: property.price,
      discountedPrice: property.discountedPrice
    });
  }
  
  // Ensure calculatedPrices exists
  if (!property.calculatedPrices && property.price) {
    const utilityPercentage = property.utilityPercentage || 20;
    const serviceChargePercentage = property.serviceChargePercentage || 10;
    const vatPercentage = property.vatPercentage || 7.5;
    
    // Use discounted price if available
    const actualPrice = property.discountedPrice || property.price;
    
    const utility = (actualPrice * utilityPercentage) / 100;
    const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
    const accommodation = actualPrice - utility - serviceCharge;
    const vat = (accommodation * vatPercentage) / 100;
    const total = actualPrice + vat;
    
    return {
      ...property,
      utilityPercentage,
      serviceChargePercentage,
      vatPercentage,
      calculatedPrices: {
        actualPrice,
        utility: Math.round(utility * 100) / 100,
        serviceCharge: Math.round(serviceCharge * 100) / 100,
        accommodation: Math.round(accommodation * 100) / 100,
        vat: Math.round(vat * 100) / 100,
        total: Math.round(total * 100) / 100
      },
      // Also add priceBreakdown for backward compatibility
      priceBreakdown: {
        actualPrice,
        utilityPercentage,
        utility: Math.round(utility * 100) / 100,
        serviceChargePercentage,
        serviceCharge: Math.round(serviceCharge * 100) / 100,
        accommodation: Math.round(accommodation * 100) / 100,
        vatPercentage,
        vat: Math.round(vat * 100) / 100,
        total: Math.round(total * 100) / 100,
        hasDiscount: !!(property.discount && property.discount.isActive),
        discountPercentage: property.discountPercentage,
        discountType: property.discount?.type,
        discountValue: property.discount?.value
      }
    };
  }
  
  return property;
};

// Helper to enrich array of properties
const enrichProperties = (properties: any[]): any[] => {
  if (!Array.isArray(properties)) return [];
  return properties.map(property => enrichPropertyWithDiscount(property));
};

// Property API calls
export const propertiesAPI = {
  // Get all properties (public)
  getProperties: async (params?: any) => {
    try {
      console.log('🔍 [Frontend API] Fetching properties with params:', params);
      
      const response = await serverApi.get('/properties', { params });
      console.log('📥 [Frontend API] Properties response:', {
        hasProperties: !!response.data.properties,
        dataType: Array.isArray(response.data) ? 'array' : 'object',
      });
      
      // Handle both response formats and enrich with discount data
      if (response.data.properties) {
        // Response format: { properties: [], totalPages, currentPage, total }
        const enrichedProperties = enrichProperties(response.data.properties);
        return {
          ...response.data,
          properties: enrichedProperties
        };
      } else if (Array.isArray(response.data)) {
        // Response format: [] (array directly)
        return enrichProperties(response.data);
      } else if (response.data && typeof response.data === 'object') {
        // Single property or other format
        return enrichProperties([response.data])[0];
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch properties');
    }
  },

  // Get featured properties (public)
  getFeaturedProperties: async () => {
    try {
      const response = await serverApi.get('/properties/featured');
      
      // Ensure featured properties have discount data
      const featuredProperties = Array.isArray(response.data) ? response.data : [];
      return enrichProperties(featuredProperties);
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching featured properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch featured properties');
    }
  },

  // Get property by ID
  getPropertyById: async (id: string) => {
    try {
      console.log('🔍 [Frontend API] Fetching property with ID:', id);

      if (!id || id === 'undefined') {
        console.error('❌ [Frontend API] Invalid property ID - undefined');
        throw new Error('Property ID is required');
      }

      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      if (!isValidObjectId) {
        console.error('❌ [Frontend API] Invalid ObjectId format:', id);
        throw new Error('Invalid property ID format');
      }

      console.log('✅ [Frontend API] ID validation passed, making request...');
      
      const response = await serverApi.get(`/properties/${id}`);
      console.log('✅ [Frontend API] Property fetched successfully');
      
      // Enrich the property with discount data
      return enrichPropertyWithDiscount(response.data);
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching property:', error);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid property ID format');
      }
      if (error.response?.status === 404) {
        throw new Error(error.response.data?.message || 'Property not found');
      }
      if (error.response?.status === 500) {
        const serverMessage = error.response.data?.message || 'Server error';
        console.error('💥 [Frontend API] Server error details:', error.response.data);
        throw new Error(`Server error: ${serverMessage}`);
      }
      
      throw new Error(error.message || 'Failed to fetch property');
    }
  },

  // Create property
  createProperty: async (propertyData: FormData) => {
    try {
      // Log FormData contents for debugging
      console.log('📤 Sending FormData with discount:');
      for (const [key, value] of propertyData.entries()) {
        if (key === 'discount') {
          console.log('  - discount:', value);
        }
      }
      
      const response = await api.post('/properties', propertyData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('📥 Create property response:', response.data);
      
      // Enrich the created property
      if (response.data.property) {
        response.data.property = enrichPropertyWithDiscount(response.data.property);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 Error creating property:', error);
      throw new Error(error.response?.data?.message || 'Failed to create property');
    }
  },

  // Update property
  updateProperty: async (id: string, propertyData: FormData) => {
    try {
      // Log FormData contents for debugging
      console.log('📤 Sending FormData with discount for update:');
      for (const [key, value] of propertyData.entries()) {
        if (key === 'discount') {
          console.log('  - discount:', value);
        }
      }
      
      const response = await api.put(`/properties/${id}`, propertyData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('📥 Update property response:', response.data);
      
      // Enrich the updated property
      if (response.data.property) {
        response.data.property = enrichPropertyWithDiscount(response.data.property);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 Error updating property:', error);
      throw new Error(error.response?.data?.message || 'Failed to update property');
    }
  },

  // Delete property
  deleteProperty: async (id: string) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('💥 Error deleting property:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete property');
    }
  },

  // Get user's properties
  getUserProperties: async () => {
    try {
      const response = await api.get('/properties/user/my-properties');
      
      // Enrich user properties
      const userProperties = Array.isArray(response.data) ? response.data : [];
      return enrichProperties(userProperties);
    } catch (error: any) {
      console.error('💥 Error fetching user properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user properties');
    }
  },

  // Admin: Get all properties
  getAdminProperties: async (params?: any) => {
    try {
      const response = await api.get('/properties/admin/all', { params });
      
      // Handle both response formats
      if (response.data.properties) {
        const enrichedProperties = enrichProperties(response.data.properties);
        return {
          ...response.data,
          properties: enrichedProperties
        };
      } else if (Array.isArray(response.data)) {
        return enrichProperties(response.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 Error fetching admin properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin properties');
    }
  },

  // Admin: Update property status
  updatePropertyStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/properties/admin/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('💥 Error updating property status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update property status');
    }
  },

  // Admin: Toggle featured status
  toggleFeatured: async (id: string) => {
    try {
      const response = await api.patch(`/properties/admin/${id}/feature`);
      return response.data;
    } catch (error: any) {
      console.error('💥 Error toggling featured status:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle featured status');
    }
  }
};








// Amenities API calls
// export const amenitiesAPI = {
//   // Get all amenities
//   getAmenities: async (params = {}) => {
//     const response = await api.get('/amenities', { params });
//     return response.data;
//   },

//   // Get amenity by ID
//   getAmenityById: async (id) => {
//     const response = await api.get(`/amenities/${id}`);
//     return response.data;
//   },

//   // Create amenity
//   createAmenity: async (amenityData) => {
//     const response = await api.post('/amenities', amenityData);
//     return response.data;
//   },

//   // Update amenity
//   updateAmenity: async (id, amenityData) => {
//     const response = await api.put(`/amenities/${id}`, amenityData);
//     return response.data;
//   },

//   // Delete amenity
//   deleteAmenity: async (id) => {
//     const response = await api.delete(`/amenities/${id}`);
//     return response.data;
//   },

//   // Get amenity categories
//   getCategories: async () => {
//     const response = await api.get('/amenities/categories');
//     return response.data;
//   },

//   // Bulk create amenities (admin only)
//   bulkCreateAmenities: async (amenities) => {
//     const response = await api.post('/amenities/bulk', { amenities });
//     return response.data;
//   },

//   // Hard delete amenity (admin only)
//   hardDeleteAmenity: async (id) => {
//     const response = await api.delete(`/amenities/admin/${id}/hard`);
//     return response.data;
//   }
// };

export const amenitiesAPI = {
  // Get all amenities
  getAmenities: async (params: any = {}) => {
    const response = await api.get('/amenities', { params });
    return response.data;
  },

  // Get amenity by ID - FIXED: Added type annotation
  getAmenityById: async (id: string) => {
    const response = await api.get(`/amenities/${id}`);
    return response.data;
  },

  // Create amenity - FIXED: Added type annotation
  createAmenity: async (amenityData: any) => {
    const response = await api.post('/amenities', amenityData);
    return response.data;
  },

  // Update amenity - FIXED: Added type annotations
  updateAmenity: async (id: string, amenityData: any) => {
    const response = await api.put(`/amenities/${id}`, amenityData);
    return response.data;
  },

  // Delete amenity - FIXED: Added type annotation
  deleteAmenity: async (id: string) => {
    const response = await api.delete(`/amenities/${id}`);
    return response.data;
  },

  // Get amenity categories
  getCategories: async () => {
    const response = await api.get('/amenities/categories');
    return response.data;
  },

  // Bulk create amenities (admin only) - FIXED: Added type annotation
  bulkCreateAmenities: async (amenities: any) => {
    const response = await api.post('/amenities/bulk', { amenities });
    return response.data;
  },

  // Hard delete amenity (admin only) - FIXED: Added type annotation
  hardDeleteAmenity: async (id: string) => {
    const response = await api.delete(`/amenities/admin/${id}/hard`);
    return response.data;
  }
};
 

// Booking API calls
// export const bookingsAPI = {
//   // Check availability
//   checkAvailability: async (propertyId, checkIn, checkOut) => {
//     const response = await api.get(`/bookings/property/${propertyId}/availability`, {
//       params: { checkIn, checkOut }
//     });
//     return response.data;
//   },

//   // Create booking
//   // createBooking: async (bookingData) => {
//   //   const response = await api.post('/bookings', bookingData);
//   //   return response.data;
//   // },

//   // lib/api.ts - Update createBooking function
//   createBooking: async (bookingData: any) => {
//     console.log('📤 [Frontend API] Creating booking:', bookingData);
    
//     try {
//       const response = await api.post('/bookings', bookingData);
//       console.log('📥 [Frontend API] Create booking response:', response.data);
      
//       // ✅ FIX: Handle backend response structure
//       if (!response.data) {
//         console.error('❌ [Frontend API] Empty response from server');
//         throw new Error('No response from server');
//       }
      
//       // Check if it's a success response
//       if (response.data.success === false) {
//         console.error('❌ [Frontend API] Server returned error:', response.data.message);
//         throw new Error(response.data.message || 'Booking creation failed');
//       }
      
//       // Success response - could be { success: true, ... } or just { message, booking }
//       return response.data;
      
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Create booking error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   },

//   // Initialize payment
//   // initializePayment: async (bookingId, email) => {
//   //   const response = await api.post(`/bookings/${bookingId}/initialize-payment`, { email });
//   //   return response.data;
//   // },

//   // lib/api.ts - Update initializePayment function
//   // initializePayment: async (bookingId: string, email: string) => {
//   //   console.log('📤 [Frontend API] Initializing payment:', { bookingId, email });
    
//   //   try {
//   //     const response = await api.post(`/bookings/${bookingId}/initialize-payment`, { email });
//   //     console.log('📥 [Frontend API] Payment initialization response:', response.data);
      
//   //     if (!response.data.success) {
//   //       console.error('❌ [Frontend API] Server returned error:', response.data.message);
//   //       throw new Error(response.data.message || 'Payment initialization failed');
//   //     }
      
//   //     // ✅ Now we can directly access authorization_url
//   //     if (!response.data.authorization_url) {
//   //       console.error('❌ [Frontend API] Missing authorization_url:', response.data);
//   //       throw new Error('No payment URL received from server');
//   //     }
      
//   //     return {
//   //       authorization_url: response.data.authorization_url,
//   //       reference: response.data.reference,
//   //       access_code: response.data.access_code
//   //     };
//   //   } catch (error: any) {
//   //     console.error('💥 [Frontend API] Payment initialization error:', {
//   //       message: error.message,
//   //       response: error.response?.data,
//   //       status: error.response?.status
//   //     });
//   //     throw error;
//   //   }
//   // },

//   // lib/api.ts - Update initializePayment function
//   // initializePayment: async (bookingId: string, email: string) => {
//   //   console.log('📤 [Frontend API] Initializing payment:', { bookingId, email });
    
//   //   try {
//   //     const response = await api.post(`/bookings/${bookingId}/initialize-payment`, { email });
//   //     console.log('📥 [Frontend API] Payment initialization response:', response.data);
      
//   //     // ✅ FIX: Check for success flag
//   //     if (!response.data.success) {
//   //       console.error('❌ [Frontend API] Server returned error:', response.data.message);
//   //       throw new Error(response.data.message || 'Payment initialization failed');
//   //     }
      
//   //     // ✅ FIX: Extract payment data from response
//   //     if (!response.data.authorization_url) {
//   //       console.error('❌ [Frontend API] Missing authorization_url:', response.data);
//   //       throw new Error('No payment URL received from server');
//   //     }
      
//   //     return {
//   //       authorization_url: response.data.authorization_url,
//   //       reference: response.data.reference,
//   //       access_code: response.data.access_code
//   //     };
//   //   } catch (error: any) {
//   //     console.error('💥 [Frontend API] Payment initialization error:', {
//   //       message: error.message,
//   //       response: error.response?.data,
//   //       status: error.response?.status
//   //     });
//   //     throw error;
//   //   }
//   // },

//   // lib/api.ts - Update initializePayment function
//   initializePayment: async (bookingId: string, email: string) => {
//     console.log('📤 [Frontend API] Initializing payment:', { bookingId, email });
    
//     try {
//       const response = await api.post(`/bookings/${bookingId}/initialize-payment`, { email });
//       console.log('📥 [Frontend API] Payment initialization response:', response.data);
      
//       // ✅ FIX: Check if response indicates success
//       if (!response.data) {
//         console.error('❌ [Frontend API] Empty response from server');
//         throw new Error('No response from server');
//       }
      
//       // Check if it's a success response
//       if (response.data.success === false) {
//         console.error('❌ [Frontend API] Server returned error:', response.data.message);
//         throw new Error(response.data.message || 'Payment initialization failed');
//       }
      
//       // Extract payment data from response
//       const paymentData = {
//         authorization_url: response.data.authorization_url,
//         reference: response.data.reference,
//         access_code: response.data.access_code
//       };
      
//       if (!paymentData.authorization_url) {
//         console.error('❌ [Frontend API] Missing authorization_url:', response.data);
//         throw new Error('No payment URL received from server');
//       }
      
//       console.log('✅ [Frontend API] Payment data extracted:', paymentData);
//       return paymentData;
      
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Payment initialization error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   },

//   // Verify payment
//   verifyPayment: async (reference) => {
//     const response = await api.post('/bookings/verify-payment', { reference });
//     return response.data;
//   },

//   // In your lib/api.ts, add this to bookingsAPI
//   // retryPayment: async (bookingId, email) => {
//   //   const response = await api.post(`/bookings/${bookingId}/retry-payment`, { email });
//   //   return response.data;
//   // },

//   // Get user bookings
//   getUserBookings: async () => {
//     const response = await api.get('/bookings/my-bookings');
//     return response.data;
//   },

//   // Get booking by ID
//   getBookingById: async (id) => {
//     const response = await api.get(`/bookings/${id}`);
//     return response.data;
//   },

//   // Cancel booking
//   cancelBooking: async (id, cancellationReason) => {
//     const response = await api.patch(`/bookings/${id}/cancel`, { cancellationReason });
//     return response.data;
//   },

//   // Admin: Get all bookings
//   getAdminBookings: async (params = {}) => {
//     const response = await api.get('/bookings/admin/all', { params });
//     return response.data;
//   },

//     uploadProofOfPayment: async (bookingId: string, proofFile: FormData) => {
//     const response = await api.post(`/bookings/${bookingId}/upload-proof`, proofFile, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Admin: Verify bank transfer
//   verifyBankTransfer: async (bookingId: string, status: string) => {
//     const response = await api.patch(`/bookings/admin/${bookingId}/verify-transfer`, { status });
//     return response.data;
//   },

//   // Admin: Mark onsite payment as collected
//   markOnsitePaymentCollected: async (bookingId: string, data: any) => {
//     const response = await api.patch(`/bookings/admin/${bookingId}/mark-onsite-collected`, data);
//     return response.data;
//   },


//    // Admin: Mark onsite payment as collected
//   // markOnsitePaymentCollected: async (bookingId: string, data: {
//   //   receiptNumber?: string;
//   //   collectedAt?: string; // ISO string format
//   // }) => {
//   //   // Ensure collectedAt is valid ISO string
//   //   const requestData = {
//   //     ...data,
//   //     collectedAt: data.collectedAt || new Date().toISOString()
//   //   };
    
//   //   const response = await api.patch(`/bookings/admin/${bookingId}/mark-onsite-collected`, requestData);
//   //   return response.data;
//   // }



  

//   // Admin: Update booking status
//   updateBookingStatus: async (id, status) => {
//     const response = await api.patch(`/bookings/admin/${id}/status`, { status });
//     return response.data;
//   }
// };

// Booking API calls @@@@@ the code below works 
// export const bookingsAPI = {
//   // Check availability
//   checkAvailability: async (propertyId: string, checkIn: string, checkOut: string) => {
//     const response = await api.get(`/bookings/property/${propertyId}/availability`, {
//       params: { checkIn, checkOut }
//     });
//     return response.data;
//   },

//   // Create booking
//   createBooking: async (bookingData: any) => {
//     console.log('📤 [Frontend API] Creating booking:', bookingData);
    
//     try {
//       const response = await api.post('/bookings', bookingData);
//       console.log('📥 [Frontend API] Create booking response:', response.data);
      
//       // ✅ FIX: Handle backend response structure
//       if (!response.data) {
//         console.error('❌ [Frontend API] Empty response from server');
//         throw new Error('No response from server');
//       }
      
//       // Check if it's a success response
//       if (response.data.success === false) {
//         console.error('❌ [Frontend API] Server returned error:', response.data.message);
//         throw new Error(response.data.message || 'Booking creation failed');
//       }
      
//       // Success response - could be { success: true, ... } or just { message, booking }
//       return response.data;
      
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Create booking error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   },

//   // Initialize payment
//   initializePayment: async (bookingId: string, email: string) => {
//     console.log('📤 [Frontend API] Initializing payment:', { bookingId, email });
    
//     try {
//       const response = await api.post(`/bookings/${bookingId}/initialize-payment`, { email });
//       console.log('📥 [Frontend API] Payment initialization response:', response.data);
      
//       // ✅ FIX: Check if response indicates success
//       if (!response.data) {
//         console.error('❌ [Frontend API] Empty response from server');
//         throw new Error('No response from server');
//       }
      
//       // Check if it's a success response
//       if (response.data.success === false) {
//         console.error('❌ [Frontend API] Server returned error:', response.data.message);
//         throw new Error(response.data.message || 'Payment initialization failed');
//       }
      
//       // Extract payment data from response
//       const paymentData = {
//         authorization_url: response.data.authorization_url,
//         reference: response.data.reference,
//         access_code: response.data.access_code
//       };
      
//       if (!paymentData.authorization_url) {
//         console.error('❌ [Frontend API] Missing authorization_url:', response.data);
//         throw new Error('No payment URL received from server');
//       }
      
//       console.log('✅ [Frontend API] Payment data extracted:', paymentData);
//       return paymentData;
      
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Payment initialization error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   },

//   // Verify payment
//   verifyPayment: async (reference: string) => {
//     const response = await api.post('/bookings/verify-payment', { reference });
//     return response.data;
//   },

//   // In your lib/api.ts, add this to bookingsAPI
//   retryPayment: async (bookingId: string, email: string) => {
//     const response = await api.post(`/bookings/${bookingId}/retry-payment`, { email });
//     return response.data;
//   },

//   // Get user bookings
//   getUserBookings: async () => {
//     const response = await api.get('/bookings/my-bookings');
//     return response.data;
//   },

//   // Get booking by ID
//   getBookingById: async (id: string) => {
//     const response = await api.get(`/bookings/${id}`);
//     return response.data;
//   },

//   // Cancel booking
//   cancelBooking: async (id: string, cancellationReason: string) => {
//     const response = await api.patch(`/bookings/${id}/cancel`, { cancellationReason });
//     return response.data;
//   },

//   // Admin: Get all bookings
//   getAdminBookings: async (params: any = {}) => {
//     const response = await api.get('/bookings/admin/all', { params });
//     return response.data;
//   },

//   uploadProofOfPayment: async (bookingId: string, proofFile: FormData) => {
//     const response = await api.post(`/bookings/${bookingId}/upload-proof`, proofFile, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Admin: Verify bank transfer
//   verifyBankTransfer: async (bookingId: string, status: string) => {
//     const response = await api.patch(`/bookings/admin/${bookingId}/verify-transfer`, { status });
//     return response.data;
//   },

//   // Admin: Mark onsite payment as collected
//   markOnsitePaymentCollected: async (bookingId: string, data: any) => {
//     const response = await api.patch(`/bookings/admin/${bookingId}/mark-onsite-collected`, data);
//     return response.data;
//   },

//   // Admin: Update booking status
//   updateBookingStatus: async (id: string, status: string) => {
//     const response = await api.patch(`/bookings/admin/${id}/status`, { status });
//     return response.data;
//   }
// };

 
// Update the bookingsAPI.createBooking to handle new response format @@@@@@@@ the code below works 
// export const bookingsAPI = {
//   createBooking: async (bookingData: any) => {
//     console.log('📤 [Frontend API] Creating booking:', bookingData);
    
//     try {
//       const response = await api.post('/bookings', bookingData);
//       console.log('📥 [Frontend API] Create booking response:', response.data);
      
//       if (!response.data) {
//         console.error('❌ [Frontend API] Empty response from server');
//         throw new Error('No response from server');
//       }
      
//       if (response.data.success === false) {
//         console.error('❌ [Frontend API] Server returned error:', response.data.message);
//         throw new Error(response.data.message || 'Booking creation failed');
//       }
      
//       return response.data;
      
//     } catch (error: any) {
//       console.error('💥 [Frontend API] Create booking error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   },
//   // ... other booking API functions
// };

// Booking API calls - Updated for new price structure
export const bookingsAPI = {
  // Check availability
  checkAvailability: async (propertyId: string, checkIn: string, checkOut: string) => {
    try {
      const response = await api.get(`/bookings/property/${propertyId}/availability`, {
        params: { checkIn, checkOut }
      });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error checking availability:', error);
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  },

  // Create booking with new price structure
  createBooking: async (bookingData: any) => {
    console.log('📤 [Frontend API] Creating booking:', bookingData);
    
    try {
      const response = await api.post('/bookings', bookingData);
      console.log('📥 [Frontend API] Create booking response:', response.data);
      
      if (!response.data) {
        console.error('❌ [Frontend API] Empty response from server');
        throw new Error('No response from server');
      }
      
      if (response.data.success === false) {
        console.error('❌ [Frontend API] Server returned error:', response.data.message);
        throw new Error(response.data.message || 'Booking creation failed');
      }
      
      // Ensure booking has priceBreakdown
      if (response.data.booking && !response.data.booking.priceBreakdown) {
        console.log('⚠️ [Frontend API] Booking missing priceBreakdown, enriching response');
        response.data.booking = enrichBookingWithPriceBreakdown(response.data.booking);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Create booking error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Initialize payment
  initializePayment: async (bookingId: string, email: string) => {
    console.log('📤 [Frontend API] Initializing payment:', { bookingId, email });
    
    try {
      const response = await api.post(`/bookings/${bookingId}/initialize-payment`, { email });
      console.log('📥 [Frontend API] Payment initialization response:', response.data);
      
      if (!response.data) {
        console.error('❌ [Frontend API] No payment response');
        throw new Error('No response from payment service');
      }
      
      if (response.data.success === false) {
        console.error('❌ [Frontend API] Server returned error:', response.data.message);
        throw new Error(response.data.message || 'Payment initialization failed');
      }
      
      const paymentData = {
        authorization_url: response.data.authorization_url,
        reference: response.data.reference,
        access_code: response.data.access_code
      };
      
      if (!paymentData.authorization_url) {
        console.error('❌ [Frontend API] Missing authorization_url:', response.data);
        throw new Error('No payment URL received from server');
      }
      
      console.log('✅ [Frontend API] Payment data extracted:', paymentData);
      return paymentData;
    } catch (error: any) {
      console.error('💥 [Frontend API] Payment initialization error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Verify payment
  verifyPayment: async (reference: string) => {
    try {
      const response = await api.post('/bookings/verify-payment', { reference });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error verifying payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  },

  // Retry payment
  retryPayment: async (bookingId: string, email: string) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/retry-payment`, { email });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error retrying payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to retry payment');
    }
  },

  // Get user bookings
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      
      if (response.data.success && response.data.bookings) {
        // Ensure all bookings have priceBreakdown
        const enrichedBookings = response.data.bookings.map((booking: any) => 
          enrichBookingWithPriceBreakdown(booking)
        );
        
        return {
          ...response.data,
          bookings: enrichedBookings
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching user bookings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user bookings');
    }
  },

  // Get booking by ID
  getBookingById: async (id: string) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      
      if (response.data.success && response.data.booking) {
        response.data.booking = enrichBookingWithPriceBreakdown(response.data.booking);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching booking by ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch booking');
    }
  },

  // Cancel booking
  cancelBooking: async (id: string, cancellationReason: string) => {
    try {
      const response = await api.patch(`/bookings/${id}/cancel`, { cancellationReason });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error cancelling booking:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
  },

  // Upload proof of payment
  uploadProofOfPayment: async (bookingId: string, proofFile: FormData) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/upload-proof`, proofFile, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error uploading proof of payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload proof of payment');
    }
  },

  // Admin: Get all bookings
  getAdminBookings: async (params: any = {}) => {
    try {
      const response = await api.get('/bookings/admin/all', { params });
      
      if (response.data.success && response.data.bookings) {
        // Ensure all bookings have priceBreakdown
        const enrichedBookings = response.data.bookings.map((booking: any) => 
          enrichBookingWithPriceBreakdown(booking)
        );
        
        return {
          ...response.data,
          bookings: enrichedBookings
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching admin bookings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin bookings');
    }
  },

  // Admin: Verify bank transfer
  verifyBankTransfer: async (bookingId: string, status: string) => {
    try {
      const response = await api.patch(`/bookings/admin/${bookingId}/verify-transfer`, { status });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error verifying bank transfer:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify bank transfer');
    }
  },

  // Admin: Mark onsite payment as collected
  markOnsitePaymentCollected: async (bookingId: string, data: any) => {
    try {
      const response = await api.patch(`/bookings/admin/${bookingId}/mark-onsite-collected`, data);
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error marking onsite payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark onsite payment');
    }
  },

  // Admin: Update booking status
  updateBookingStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/bookings/admin/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error updating booking status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update booking status');
    }
  }
};

// Helper function to enrich booking with price breakdown
function enrichBookingWithPriceBreakdown(booking: any): any {
  if (booking.priceBreakdown) {
    return booking;
  }
  
  // Calculate price breakdown from booking data
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  const property = booking.property || {};
  const propertyPrice = property.price || 0;
  const utilityPercentage = property.utilityPercentage || 20;
  const serviceChargePercentage = property.serviceChargePercentage || 10;
  const vatPercentage = property.vatPercentage || 7.5;
  
  const actualPrice = propertyPrice * totalNights;
  const utility = (actualPrice * utilityPercentage) / 100;
  const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
  const accommodation = actualPrice - utility - serviceCharge;
  const vat = (accommodation * vatPercentage) / 100;
  const totalAmount = actualPrice + vat;
  
  return {
    ...booking,
    priceBreakdown: {
      actualPrice: Math.round(actualPrice * 100) / 100,
      utilityPercentage,
      utility: Math.round(utility * 100) / 100,
      serviceChargePercentage,
      serviceCharge: Math.round(serviceCharge * 100) / 100,
      accommodation: Math.round(accommodation * 100) / 100,
      vatPercentage,
      vat: Math.round(vat * 100) / 100,
      subtotal: Math.round(actualPrice * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    }
  };
}

// lib/api.ts - Add access pass API calls
export const accessPassAPI = {
  // Send access pass to user
  sendAccessPass: async (bookingId: string, accessData: {
    accessCode: string;
    provider?: string;
    instructions?: string;
  }) => {
    const response = await api.post(`/access/bookings/${bookingId}/send-access-pass`, accessData);
    return response.data;
  },

  // Update access pass
  updateAccessPass: async (bookingId: string, accessData: {
    accessCode: string;
    provider?: string;
    instructions?: string;
  }) => {
    const response = await api.put(`/access/bookings/${bookingId}/access-pass`, accessData);
    return response.data;
  },

  // Get access pass info
  getAccessPassInfo: async (bookingId: string) => {
    const response = await api.get(`/access/bookings/${bookingId}/access-pass`);
    return response.data;
  }
};

// Vendor API calls
// export const vendorAPI = {
//   // Vendor Management (Admin only)
//   createVendor: async (vendorData: any) => {
//     const response = await api.post('/api/vendors', vendorData);
//     return response.data;
//   },

//   getVendors: async (params = {}) => {
//     const response = await api.get('/api/vendors', { params });
//     return response.data;
//   },

//   getVendorById: async (id: string) => {
//     const response = await api.get(`/api/vendors/${id}`);
//     return response.data;
//   },

//   updateVendor: async (id: string, vendorData: any) => {
//     const response = await api.put(`/api/vendors/${id}`, vendorData);
//     return response.data;
//   },

//   updateVendorStatus: async (id: string, status: string) => {
//     const response = await api.patch(`/api/vendors/${id}/status`, { status });
//     return response.data;
//   },

//   getVendorStats: async () => {
//     const response = await api.get('/api/vendors/stats');
//     return response.data;
//   },

//   // Vendor Products (Admin only)
//   createProduct: async (productData: FormData) => {
//     const response = await api.post('/api/vendor-products', productData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   getVendorProducts: async (vendorId: string, params = {}) => {
//     const response = await api.get(`/api/vendor-products/vendor/${vendorId}`, { params });
//     return response.data;
//   },

//   getAvailableProducts: async (params = {}) => {
//     const response = await api.get('/api/vendor-products', { params });
//     return response.data;
//   },

//   updateProduct: async (id: string, productData: FormData) => {
//     const response = await api.put(`/api/vendor-products/${id}`, productData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   toggleProductAvailability: async (id: string) => {
//     const response = await api.patch(`/api/vendor-products/${id}/availability`);
//     return response.data;
//   },

//   // Vendor Orders
//   createOrder: async (orderData: any) => {
//     const response = await api.post('/api/vendor-orders', orderData);
//     return response.data;
//   },

//   initializeVendorPayment: async (orderId: string, email: string) => {
//     const response = await api.post(`/api/vendor-orders/${orderId}/initialize-payment`, { email });
//     return response.data;
//   },

//   verifyVendorPayment: async (reference: string) => {
//     const response = await api.post('/api/vendor-orders/verify-payment', { reference });
//     return response.data;
//   },

//   getUserVendorOrders: async () => {
//     const response = await api.get('/api/vendor-orders/my-orders');
//     return response.data;
//   },

//   getAllVendorOrders: async (params = {}) => {
//     const response = await api.get('/api/vendor-orders', { params });
//     return response.data;
//   },

//   updateOrderStatus: async (id: string, status: string, vendorNotes?: string) => {
//     const response = await api.patch(`/api/vendor-orders/${id}/status`, { status, vendorNotes });
//     return response.data;
//   }
// }; 


// export const vendorAPI = {
//   // Products
//   getAvailableProducts: async () => {
//     const response = await api.get('/api/vendor-products');
//     return response.data;
//   },

//   getVendorProducts: async (vendorId: string) => {
//     const response = await api.get(`/api/vendor-products/vendor/${vendorId}`);
//     return response.data;
//   },

//   // Orders
//   createOrder: async (orderData: any) => {
//     const response = await api.post('/api/vendor-orders', orderData);
//     return response.data;
//   },

//   initializeVendorPayment: async (orderId: string, email: string) => {
//     const response = await api.post(`/api/vendor-orders/${orderId}/initialize-payment`, { email });
//     return response.data;
//   },

//   verifyVendorPayment: async (reference: string) => {
//     const response = await api.post('/api/vendor-orders/verify-payment', { reference });
//     return response.data;
//   },

//   getUserVendorOrders: async () => {
//     const response = await api.get('/api/vendor-orders/my-orders');
//     return response.data;
//   },

//   getVendorOrderById: async (orderId: string) => {
//     const response = await api.get(`/api/vendor-orders/${orderId}`);
//     return response.data;
//   },
// };

  // lib/api.ts - Update vendor API calls
  export const vendorAPI = {
    // Vendor Management (Admin only)
    createVendor: async (vendorData: any) => {
      const response = await api.post('/api/vendors', vendorData);
      return response.data;
    },

    getVendors: async (params = {}) => {
      const response = await api.get('/api/vendors', { params });
      return response.data;
    },

    getVendorById: async (id: string) => {
      const response = await api.get(`/api/vendors/${id}`);
      return response.data;
    },

    updateVendor: async (id: string, vendorData: any) => {
      const response = await api.put(`/api/vendors/${id}`, vendorData);
      return response.data;
    },

    updateVendorStatus: async (id: string, status: string) => {
      const response = await api.patch(`/api/vendors/${id}/status`, { status });
      return response.data;
    },

    getVendorStats: async () => {
      const response = await api.get('/api/vendors/stats');
      return response.data;
    },

    // Vendor Products (Admin only)
    createProduct: async (productData: FormData) => {
      const response = await api.post('/api/vendor-products', productData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    getVendorProducts: async (vendorId: string, params = {}) => {
      const response = await api.get(`/api/vendor-products/vendor/${vendorId}`, { params });
      return response.data;
    },

    getAvailableProducts: async (params = {}) => {
      const response = await api.get('/api/vendor-products', { params });
      return response.data;
    },

    updateProduct: async (id: string, productData: FormData) => {
      const response = await api.put(`/api/vendor-products/${id}`, productData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    toggleProductAvailability: async (id: string) => {
      const response = await api.patch(`/api/vendor-products/${id}/availability`);
      return response.data;
    },

    // Vendor Orders
    getAllVendorOrders: async (params = {}) => {
      const response = await api.get('/api/vendor-orders', { params });
      return response.data;
    },

    updateOrderStatus: async (id: string, status: string, vendorNotes?: string) => {
      const response = await api.patch(`/api/vendor-orders/${id}/status`, { status, vendorNotes });
      return response.data;
    },

    getVendorOrderById: async (id: string) => {
      const response = await api.get(`/api/vendor-orders/${id}`);
      return response.data;
    },

    getUserVendorOrders: async () => {
      const response = await api.get('/api/vendor-orders/my-orders');
      return response.data;
    },

    // Orders
    createOrder: async (orderData: any) => {
      const response = await api.post('/api/vendor-orders', orderData);
      return response.data;
    },

    initializeVendorPayment: async (orderId: string, email: string) => {
      const response = await api.post(`/api/vendor-orders/${orderId}/initialize-payment`, { email });
      return response.data;
    },

    verifyVendorPayment: async (reference: string) => {
      const response = await api.post('/api/vendor-orders/verify-payment', { reference });
      return response.data;
    },

    
  };

// Add to your lib/api.ts
  export const housekeepingAPI = {
    // User requests
    createRequest: async (requestData: any) => {
      const response = await api.post('/housekeeping/requests', requestData);
      return response.data;
    },

    getUserRequests: async () => {
      const response = await api.get('/housekeeping/requests');
      return response.data;
    },

    getRequestById: async (id: string) => {
      const response = await api.get(`/housekeeping/requests/${id}`);
      return response.data;
    },

    updateRequest: async (id: string, updateData: any) => {
      const response = await api.put(`/housekeeping/requests/${id}`, updateData);
      return response.data;
    },

    cancelRequest: async (id: string, cancellationReason: string) => {
      const response = await api.patch(`/housekeeping/requests/${id}/cancel`, { cancellationReason });
      return response.data;
    },

    // Admin functions
    getAllRequests: async (params?: any) => {
      const response = await api.get('/housekeeping/admin/requests', { params });
      return response.data;
    },

    updateRequestStatus: async (id: string, statusData: any) => {
      const response = await api.patch(`/housekeeping/admin/requests/${id}/status`, statusData);
      return response.data;
    },

    getHousekeepingStats: async () => {
      const response = await api.get('/housekeeping/admin/stats');
      return response.data;
    }
  };

  // export const inventoryAPI = {
  //   // Inventory items
  //   getItems: async (params?: any) => {
  //     const response = await api.get('/inventory/items', { params });
  //     return response.data;
  //   },

  //   getItemById: async (id: string) => {
  //     const response = await api.get(`/inventory/items/${id}`);
  //     return response.data;
  //   },

  //   createItem: async (itemData: any) => {
  //     const response = await api.post('/inventory/items', itemData);
  //     return response.data;
  //   },

  //   updateItem: async (id: string, itemData: any) => {
  //     const response = await api.put(`/inventory/items/${id}`, itemData);
  //     return response.data;
  //   },

  //   deleteItem: async (id: string) => {
  //     const response = await api.delete(`/inventory/items/${id}`);
  //     return response.data;
  //   },

  //   // Stock management
  //   updateStock: async (id: string, stockData: any) => {
  //     const response = await api.patch(`/inventory/items/${id}/stock`, stockData);
  //     return response.data;
  //   },

  //   getStockMovements: async (id: string) => {
  //     const response = await api.get(`/inventory/items/${id}/movements`);
  //     return response.data;
  //   },

  //   // Statistics
  //   getStats: async () => {
  //     const response = await api.get('/inventory/stats');
  //     return response.data;
  //   }
  // };



export const inventoryAPI = {
  // Get all inventory items
  getItems: async (params?: any) => {
    try {
      const response = await api.get('/inventory/items', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get inventory items error:', error);
      throw error;
    }
  },

  // Get inventory item by ID
  getItemById: async (id: string) => {
    try {
      const response = await api.get(`/inventory/items/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get inventory item error:', error);
      throw error;
    }
  },

  // Create new inventory item
  createItem: async (itemData: any) => {
    try {
      // Ensure numbers are properly parsed
      const processedData = {
        ...itemData,
        currentStock: Number(itemData.currentStock) || 0,
        minStock: Number(itemData.minStock) || 0,
        reorderLevel: Number(itemData.reorderLevel) || 0,
        cost: Number(itemData.cost) || 0
      };
      
      const response = await api.post('/inventory/items', processedData);
      return response.data;
    } catch (error: any) {
      console.error('Create inventory item error:', error);
      throw error;
    }
  },

  // Update inventory item
  updateItem: async (id: string, itemData: any) => {
    try {
      const response = await api.put(`/inventory/items/${id}`, itemData);
      return response.data;
    } catch (error: any) {
      console.error('Update inventory item error:', error);
      throw error;
    }
  },

  // Delete inventory item
  deleteItem: async (id: string) => {
    try {
      const response = await api.delete(`/inventory/items/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete inventory item error:', error);
      throw error;
    }
  },

  // Update stock level
  updateStock: async (id: string, stockData: any) => {
    try {
      console.log('Updating stock with data:', { id, stockData });
      
      // Ensure quantity is a positive number
      const processedData = {
        type: stockData.type,
        quantity: Number(stockData.quantity) || 0,
        reason: stockData.reason || 'Stock adjustment'
      };
      
      const response = await api.patch(`/inventory/items/${id}/stock`, processedData);
      console.log('Update stock response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update stock error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Get stock movements
  getStockMovements: async (id: string) => {
    try {
      const response = await api.get(`/inventory/items/${id}/movements`);
      return response.data;
    } catch (error: any) {
      console.error('Get stock movements error:', error);
      throw error;
    }
  },

  // Get inventory statistics
  getStats: async () => {
    try {
      const response = await api.get('/inventory/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get inventory stats error:', error);
      throw error;
    }
  }
};



  export const maintenanceAPI = {
    // Maintenance issues
    getIssues: async (params?: any) => {
      const response = await api.get('/maintenance/issues', { params });
      return response.data;
    },

    getIssueById: async (id: string) => {
      const response = await api.get(`/maintenance/issues/${id}`);
      return response.data;
    },

    createIssue: async (issueData: any) => {
      const response = await api.post('/maintenance/issues', issueData);
      return response.data;
    },

    updateIssue: async (id: string, issueData: any) => {
      const response = await api.put(`/maintenance/issues/${id}`, issueData);
      return response.data;
    },

    deleteIssue: async (id: string) => {
      const response = await api.delete(`/maintenance/issues/${id}`);
      return response.data;
    },

    updateIssueStatus: async (id: string, statusData: any) => {
      const response = await api.patch(`/maintenance/issues/${id}/status`, statusData);
      return response.data;
    },

    // Maintenance vendors
    getVendors: async (params?: any) => {
      const response = await api.get('/maintenance/vendors', { params });
      return response.data;
    },

    getVendorById: async (id: string) => {
      const response = await api.get(`/maintenance/vendors/${id}`);
      return response.data;
    },

    createVendor: async (vendorData: any) => {
      const response = await api.post('/maintenance/vendors', vendorData);
      return response.data;
    },

    updateVendor: async (id: string, vendorData: any) => {
      const response = await api.put(`/maintenance/vendors/${id}`, vendorData);
      return response.data;
    },

    deleteVendor: async (id: string) => {
      const response = await api.delete(`/maintenance/vendors/${id}`);
      return response.data;
    },

    // Statistics
    getStats: async () => {
      const response = await api.get('/maintenance/stats');
      return response.data;
    },

    getVendorStats: async () => {
      const response = await api.get('/maintenance/vendors/stats');
      return response.data;
    }
  };

  // Staff API
// export const staffAPI = {
//   // Staff management
//   getStaff: async (params?: any) => {
//     const response = await api.get('/staff/staff', { params });
//     return response.data;
//   },

//   getStaffStats: async () => {
//     const response = await api.get('/staff/staff/stats');
//     return response.data;
//   },

//   createStaff: async (staffData: any) => {
//     const response = await api.post('/staff/staff', staffData);
//     return response.data;
//   },

//   updateStaff: async (id: string, staffData: any) => {
//     const response = await api.put(`/staff/staff/${id}`, staffData);
//     return response.data;
//   },

//   deleteStaff: async (id: string) => {
//     const response = await api.delete(`/staff/staff/${id}`);
//     return response.data;
//   },

//   // Attendance
//   getAttendance: async (params?: any) => {
//     const response = await api.get('/staff/attendance', { params });
//     return response.data;
//   },

//   checkIn: async (checkInData: any) => {
//     const response = await api.post('/staff/attendance/checkin', checkInData);
//     return response.data;
//   },

//   checkOut: async (checkOutData: any) => {
//     const response = await api.post('/staff/attendance/checkout', checkOutData);
//     return response.data;
//   },

//   // Daily reports
//   getReports: async (params?: any) => {
//     const response = await api.get('/staff/reports', { params });
//     return response.data;
//   },

//   createReport: async (reportData: any) => {
//     const response = await api.post('/staff/reports', reportData);
//     return response.data;
//   },

//   // Leave requests
//   getLeaveRequests: async (params?: any) => {
//     const response = await api.get('/staff/leaves', { params });
//     return response.data;
//   },

//   createLeaveRequest: async (leaveData: any) => {
//     const response = await api.post('/staff/leaves', leaveData);
//     return response.data;
//   },

//   updateLeaveStatus: async (id: string, statusData: any) => {
//     const response = await api.patch(`/staff/leaves/${id}/status`, statusData);
//     return response.data;
//   }
// }


export const staffAPI = {
  // Staff management
  getStaff: async (params?: any) => {
    try {
      const response = await api.get('/staff/staff', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get staff error:', error);
      throw error;
    }
  },

  getStaffById: async (id: string) => {
    try {
      const response = await api.get(`/staff/staff/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get staff by ID error:', error);
      throw error;
    }
  },

  getStaffStats: async () => {
    try {
      const response = await api.get('/staff/staff/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get staff stats error:', error);
      throw error;
    }
  },

  createStaff: async (staffData: any) => {
    try {
      const response = await api.post('/staff/staff', staffData);
      return response.data;
    } catch (error: any) {
      console.error('Create staff error:', error);
      throw error;
    }
  },

  updateStaff: async (id: string, staffData: any) => {
    try {
      const response = await api.put(`/staff/staff/${id}`, staffData);
      return response.data;
    } catch (error: any) {
      console.error('Update staff error:', error);
      throw error;
    }
  },

  deleteStaff: async (id: string) => {
    try {
      const response = await api.delete(`/staff/staff/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete staff error:', error);
      throw error;
    }
  },

  // Attendance
  getAttendance: async (params?: any) => {
    try {
      const response = await api.get('/staff/attendance', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get attendance error:', error);
      throw error;
    }
  },

  checkIn: async (checkInData: any) => {
    try {
      const response = await api.post('/staff/attendance/checkin', checkInData);
      return response.data;
    } catch (error: any) {
      console.error('Check-in error:', error);
      throw error;
    }
  },

  checkOut: async (checkOutData: any) => {
    try {
      const response = await api.post('/staff/attendance/checkout', checkOutData);
      return response.data;
    } catch (error: any) {
      console.error('Check-out error:', error);
      throw error;
    }
  },

  updateAttendance: async (id: string, attendanceData: any) => {
    try {
      const response = await api.put(`/staff/attendance/${id}`, attendanceData);
      return response.data;
    } catch (error: any) {
      console.error('Update attendance error:', error);
      throw error;
    }
  },

  deleteAttendance: async (id: string) => {
    try {
      const response = await api.delete(`/staff/attendance/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete attendance error:', error);
      throw error;
    }
  },

  // Daily reports
  getReports: async (params?: any) => {
    try {
      const response = await api.get('/staff/reports', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get reports error:', error);
      throw error;
    }
  },

  createReport: async (reportData: any) => {
    try {
      const response = await api.post('/staff/reports', reportData);
      return response.data;
    } catch (error: any) {
      console.error('Create report error:', error);
      throw error;
    }
  },

  getReportById: async (id: string) => {
    try {
      const response = await api.get(`/staff/reports/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get report by ID error:', error);
      throw error;
    }
  },

  updateReport: async (id: string, reportData: any) => {
    try {
      const response = await api.put(`/staff/reports/${id}`, reportData);
      return response.data;
    } catch (error: any) {
      console.error('Update report error:', error);
      throw error;
    }
  },

  deleteReport: async (id: string) => {
    try {
      const response = await api.delete(`/staff/reports/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete report error:', error);
      throw error;
    }
  },

  // Leave requests
  getLeaveRequests: async (params?: any) => {
    try {
      const response = await api.get('/staff/leaves', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get leave requests error:', error);
      throw error;
    }
  },

  createLeaveRequest: async (leaveData: any) => {
    try {
      const response = await api.post('/staff/leaves', leaveData);
      return response.data;
    } catch (error: any) {
      console.error('Create leave request error:', error);
      throw error;
    }
  },

  getLeaveRequestById: async (id: string) => {
    try {
      const response = await api.get(`/staff/leaves/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get leave request by ID error:', error);
      throw error;
    }
  },

  updateLeaveStatus: async (id: string, statusData: any) => {
    try {
      const response = await api.patch(`/staff/leaves/${id}/status`, statusData);
      return response.data;
    } catch (error: any) {
      console.error('Update leave status error:', error);
      throw error;
    }
  },

  deleteLeaveRequest: async (id: string) => {
    try {
      const response = await api.delete(`/staff/leaves/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete leave request error:', error);
      throw error;
    }
  }
};


// Utility API calls
export const utilityAPI = {
  // Get all utility readings
  getReadings: async (params?: any) => {
    try {
      const response = await api.get('/utility/readings', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get utility readings error:', error);
      throw error;
    }
  },

  // Create utility reading
  createReading: async (readingData: any) => {
    try {
      const response = await api.post('/utility/readings', readingData);
      return response.data;
    } catch (error: any) {
      console.error('Create utility reading error:', error);
      throw error;
    }
  },

  // Update utility reading
  updateReading: async (id: string, readingData: any) => {
    try {
      const response = await api.put(`/utility/readings/${id}`, readingData);
      return response.data;
    } catch (error: any) {
      console.error('Update utility reading error:', error);
      throw error;
    }
  },

  // Delete utility reading
  deleteReading: async (id: string) => {
    try {
      const response = await api.delete(`/utility/readings/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete utility reading error:', error);
      throw error;
    }
  },

  // Mark reading as billed
  markAsBilled: async (id: string) => {
    try {
      const response = await api.patch(`/utility/readings/${id}/billed`);
      return response.data;
    } catch (error: any) {
      console.error('Mark as billed error:', error);
      throw error;
    }
  },

  // Bulk upload readings
  bulkUpload: async (readings: any[]) => {
    try {
      const response = await api.post('/utility/readings/bulk', { readings });
      return response.data;
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      throw error;
    }
  },

  // Get utility rates
  getRates: async () => {
    try {
      const response = await api.get('/utility/rates');
      return response.data;
    } catch (error: any) {
      console.error('Get utility rates error:', error);
      throw error;
    }
  },

  // Update utility rate
  updateRate: async (type: string, rateData: any) => {
    try {
      const response = await api.put(`/utility/rates/${type}`, rateData);
      return response.data;
    } catch (error: any) {
      console.error('Update utility rate error:', error);
      throw error;
    }
  },

  // Get utility alerts
  getAlerts: async (params?: any) => {
    try {
      const response = await api.get('/utility/alerts', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get utility alerts error:', error);
      throw error;
    }
  },

  // Resolve alert
  resolveAlert: async (id: string) => {
    try {
      const response = await api.patch(`/utility/alerts/${id}/resolve`);
      return response.data;
    } catch (error: any) {
      console.error('Resolve alert error:', error);
      throw error;
    }
  },

  // Get utility statistics
  getStats: async (params?: any) => {
    try {
      const response = await api.get('/utility/stats', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get utility stats error:', error);
      throw error;
    }
  },

  // Export readings
  exportReadings: async (params?: any) => {
    try {
      const response = await api.get('/utility/readings/export', { 
        params,
        responseType: 'blob' 
      });
      return response.data;
    } catch (error: any) {
      console.error('Export readings error:', error);
      throw error;
    }
  }
};


// Expense API calls
export const expenseAPI = {
  // ========== EXPENSES ==========
  getExpenses: async (params?: any) => {
    try {
      const response = await api.get('/expenses', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get expenses error:', error);
      throw error;
    }
  },

  getExpenseById: async (id: string) => {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get expense error:', error);
      throw error;
    }
  },

  createExpense: async (expenseData: FormData) => {
    try {
      const response = await api.post('/expenses', expenseData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Create expense error:', error);
      throw error;
    }
  },

  updateExpense: async (id: string, expenseData: FormData) => {
    try {
      const response = await api.put(`/expenses/${id}`, expenseData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Update expense error:', error);
      throw error;
    }
  },

  deleteExpense: async (id: string) => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete expense error:', error);
      throw error;
    }
  },

  updateExpenseStatus: async (id: string, statusData: any) => {
    try {
      const response = await api.patch(`/expenses/${id}/status`, statusData);
      return response.data;
    } catch (error: any) {
      console.error('Update expense status error:', error);
      throw error;
    }
  },

  getExpenseStats: async (params?: any) => {
    try {
      const response = await api.get('/expenses/stats', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get expense stats error:', error);
      throw error;
    }
  },

  exportExpenses: async (params?: any) => {
    try {
      const response = await api.get('/expenses/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Export expenses error:', error);
      throw error;
    }
  },

  // ========== BUDGETS ==========
  getBudgets: async (params?: any) => {
    try {
      const response = await api.get('/expenses/budgets', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get budgets error:', error);
      throw error;
    }
  },

  getBudgetById: async (id: string) => {
    try {
      const response = await api.get(`/expenses/budgets/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get budget error:', error);
      throw error;
    }
  },

  createBudget: async (budgetData: any) => {
    try {
      const response = await api.post('/expenses/budgets', budgetData);
      return response.data;
    } catch (error: any) {
      console.error('Create budget error:', error);
      throw error;
    }
  },

  updateBudget: async (id: string, budgetData: any) => {
    try {
      const response = await api.put(`/expenses/budgets/${id}`, budgetData);
      return response.data;
    } catch (error: any) {
      console.error('Update budget error:', error);
      throw error;
    }
  },

  deleteBudget: async (id: string) => {
    try {
      const response = await api.delete(`/expenses/budgets/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete budget error:', error);
      throw error;
    }
  },

  // ========== VENDORS ==========
  getVendors: async (params?: any) => {
    try {
      const response = await api.get('/expenses/vendors', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get vendors error:', error);
      throw error;
    }
  },

  getVendorById: async (id: string) => {
    try {
      const response = await api.get(`/expenses/vendors/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get vendor error:', error);
      throw error;
    }
  },

  createVendor: async (vendorData: any) => {
    try {
      const response = await api.post('/expenses/vendors', vendorData);
      return response.data;
    } catch (error: any) {
      console.error('Create vendor error:', error);
      throw error;
    }
  },

  updateVendor: async (id: string, vendorData: any) => {
    try {
      const response = await api.put(`/expenses/vendors/${id}`, vendorData);
      return response.data;
    } catch (error: any) {
      console.error('Update vendor error:', error);
      throw error;
    }
  },

  deleteVendor: async (id: string) => {
    try {
      const response = await api.delete(`/expenses/vendors/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete vendor error:', error);
      throw error;
    }
  },

  // ========== RECURRING ==========
  processRecurringExpenses: async () => {
    try {
      const response = await api.post('/expenses/recurring/process');
      return response.data;
    } catch (error: any) {
      console.error('Process recurring expenses error:', error);
      throw error;
    }
  }
};


// Add to your lib/api.ts file

// Affiliate API calls
export const affiliateAPI = {
  // ========== AFFILIATE MANAGEMENT (Admin) ==========
  
  // Create new affiliate
  createAffiliate: async (affiliateData: any) => {
    try {
      const response = await api.post('/affiliates', affiliateData);
      return response.data;
    } catch (error: any) {
      console.error('Create affiliate error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create affiliate');
    }
  },

  // Get all affiliates with filters
  getAffiliates: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    try {
      const response = await api.get('/affiliates', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get affiliates error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch affiliates');
    }
  },

  // Get affiliate by ID
  getAffiliateById: async (id: string) => {
    try {
      const response = await api.get(`/affiliates/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get affiliate error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch affiliate');
    }
  },

  // Update affiliate
  updateAffiliate: async (id: string, affiliateData: any) => {
    try {
      const response = await api.put(`/affiliates/${id}`, affiliateData);
      return response.data;
    } catch (error: any) {
      console.error('Update affiliate error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update affiliate');
    }
  },

  // Update affiliate status
  updateAffiliateStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/affiliates/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Update affiliate status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update affiliate status');
    }
  },

  // Delete affiliate
  deleteAffiliate: async (id: string) => {
    try {
      const response = await api.delete(`/affiliates/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete affiliate error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete affiliate');
    }
  },

  // Get affiliates summary stats
  getAffiliatesSummary: async () => {
    try {
      const response = await api.get('/affiliates/summary');
      return response.data;
    } catch (error: any) {
      console.error('Get affiliates summary error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch affiliates summary');
    }
  },

  // Get affiliate stats
  getAffiliateStats: async (id: string) => {
    try {
      const response = await api.get(`/affiliates/${id}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Get affiliate stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch affiliate stats');
    }
  },

  // ========== AFFILIATE CODE PUBLIC ROUTES ==========

  // Validate affiliate code (public - no auth required)
  validateAffiliateCode: async (code: string) => {
    try {
      const response = await api.get(`/affiliates/validate/${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Validate affiliate code error:', error);
      throw new Error(error.response?.data?.message || 'Invalid affiliate code');
    }
  },

  // ========== AFFILIATE BOOKING MANAGEMENT ==========

  // Apply affiliate code to booking (requires auth)
  applyAffiliateCode: async (bookingId: string, affiliateCode: string) => {
    try {
      const response = await api.post(`/affiliates/bookings/${bookingId}/apply`, { 
        affiliateCode 
      });
      return response.data;
    } catch (error: any) {
      console.error('Apply affiliate code error:', error);
      throw new Error(error.response?.data?.message || 'Failed to apply affiliate code');
    }
  },

  // Get affiliate bookings (admin)
  getAffiliateBookings: async (
    affiliateId: string, 
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    try {
      const response = await api.get(`/affiliates/${affiliateId}/bookings`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Get affiliate bookings error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch affiliate bookings');
    }
  },

  // ========== COMMISSION MANAGEMENT ==========

  // Update commission status (admin)
  updateCommissionStatus: async (commissionId: string, status: string, notes?: string) => {
    try {
      const response = await api.patch(`/affiliates/commissions/${commissionId}/status`, { 
        status, 
        notes 
      });
      return response.data;
    } catch (error: any) {
      console.error('Update commission status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update commission status');
    }
  }
};











export default api;








 











































 

 









// // client/lib/api.ts
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// export const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Handle token refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem('refreshToken');
//         if (!refreshToken) {
//           throw new Error('No refresh token');
//         }

//         const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
//           refreshToken,
//         });

//         const { accessToken } = response.data;
//         localStorage.setItem('accessToken', accessToken);

//         // Retry original request with new token
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         // Redirect to login if refresh fails
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('user');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// // Auth API calls
// export const authAPI = {
//   register: async (userData: FormData) => {
//     const response = await api.post('/auth/register', userData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   login: async (credentials: { email: string; password: string }) => {
//     const response = await api.post('/auth/login', credentials);
//     return response.data;
//   },

//   forgotPassword: async (email: string) => {
//     const response = await api.post('/auth/forgot-password', { email });
//     return response.data;
//   },

//   resetPassword: async (token: string, newPassword: string) => {
//     const response = await api.post('/auth/reset-password', { token, newPassword });
//     return response.data;
//   },

//   logout: async (refreshToken: string) => {
//     const response = await api.post('/auth/logout', { refreshToken });
//     return response.data;
//   },

//   refreshToken: async (refreshToken: string) => {
//     const response = await api.post('/auth/refresh-token', { refreshToken });
//     return response.data;
//   },
// };

// // Users API calls
// export const usersAPI = {
//   // Get all users (Admin only)
//   getUsers: async () => {
//     const response = await api.get('/users');
//     return response.data;
//   },

//   // Get user by ID (users can get their own, admin can get any)
//   getUserById: async (userId: string) => {
//     const response = await api.get(`/users/${userId}`);
//     return response.data;
//   },

//   // Get user by ID for admin (admin only)
//   getAdminUserById: async (userId: string) => {
//     const response = await api.get(`/users/admin/${userId}`);
//     return response.data;
//   },

//   // Update user profile (users can update their own)
//   updateProfile: async (userId: string, userData: any) => {
//     const response = await api.put(`/users/${userId}`, userData);
//     return response.data;
//   },

//   // Update user as admin (admin only)
//   updateUser: async (userId: string, userData: any) => {
//     const response = await api.put(`/users/admin/${userId}`, userData);
//     return response.data;
//   },

//   // Delete user (admin only)
//   deleteUser: async (userId: string) => {
//     const response = await api.delete(`/users/admin/${userId}`);
//     return response.data;
//   },

//   // Get user documents (users can get their own)
//   getUserDocuments: async (userId: string) => {
//     const response = await api.get(`/users/${userId}/documents`);
//     return response.data;
//   },

//   // Upload document
//   uploadDocument: async (userId: string, documentData: FormData) => {
//     const response = await api.post(`/users/${userId}/documents`, documentData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Verify user (admin only)
//   verifyUser: async (userId: string) => {
//     const response = await api.patch(`/users/admin/${userId}/verify`);
//     return response.data;
//   },

//   // Suspend user (admin only)
//   suspendUser: async (userId: string) => {
//     const response = await api.patch(`/users/admin/${userId}/suspend`);
//     return response.data;
//   },

//   // Activate user (admin only)
//   activateUser: async (userId: string) => {
//     const response = await api.patch(`/users/admin/${userId}/activate`);
//     return response.data;
//   },

//   // Verify document (admin only)
//   verifyDocument: async (documentId: string) => {
//     const response = await api.patch(`/users/admin/documents/${documentId}/verify`);
//     return response.data;
//   },

//   // Reject document (admin only)
//   rejectDocument: async (documentId: string, rejectionReason: string) => {
//     const response = await api.patch(`/users/admin/documents/${documentId}/reject`, { rejectionReason });
//     return response.data;
//   },

//   // Approve document (admin only) - using 'approved' status
//   approveDocument: async (documentId: string) => {
//     const response = await api.patch(`/users/admin/documents/${documentId}/approve`);
//     return response.data;
//   }
// };

// // Property API calls
// export const propertiesAPI = {
//   // Get all properties
//   getProperties: async (params?: any) => {
//     const response = await api.get('/properties', { params });
//     return response.data;
//   },

//   // Get featured properties
//   getFeaturedProperties: async () => {
//     const response = await api.get('/properties/featured');
//     return response.data;
//   },

//   // Get property by ID
//   getPropertyById: async (id: string) => {
//     const response = await api.get(`/properties/${id}`);
//     return response.data;
//   },

//   // Create property
//   createProperty: async (propertyData: FormData) => {
//     const response = await api.post('/properties', propertyData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Update property
//   updateProperty: async (id: string, propertyData: FormData) => {
//     const response = await api.put(`/properties/${id}`, propertyData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Delete property
//   deleteProperty: async (id: string) => {
//     const response = await api.delete(`/properties/${id}`);
//     return response.data;
//   },

//   // Get user's properties
//   getUserProperties: async () => {
//     const response = await api.get('/properties/user/my-properties');
//     return response.data;
//   },

//   // Admin: Get all properties
//   getAdminProperties: async (params?: any) => {
//     const response = await api.get('/properties/admin/all', { params });
//     return response.data;
//   },

//   // Admin: Update property status
//   updatePropertyStatus: async (id: string, status: string) => {
//     const response = await api.patch(`/properties/admin/${id}/status`, { status });
//     return response.data;
//   },

//   // Admin: Toggle featured status
//   toggleFeatured: async (id: string) => {
//     const response = await api.patch(`/properties/admin/${id}/feature`);
//     return response.data;
//   }
// };

// export default api;

















































// // client/lib/api.ts
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// export const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Handle token refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem('refreshToken');
//         if (!refreshToken) {
//           throw new Error('No refresh token');
//         }

//         const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
//           refreshToken,
//         });

//         const { accessToken } = response.data;
//         localStorage.setItem('accessToken', accessToken);

//         // Retry original request with new token
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         // Redirect to login if refresh fails
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('user');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// // Auth API calls
// export const authAPI = {
//   register: async (userData: FormData) => {
//     const response = await api.post('/auth/register', userData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   login: async (credentials: { email: string; password: string }) => {
//     const response = await api.post('/auth/login', credentials);
//     return response.data;
//   },

//   forgotPassword: async (email: string) => {
//     const response = await api.post('/auth/forgot-password', { email });
//     return response.data;
//   },

//   resetPassword: async (token: string, newPassword: string) => {
//     const response = await api.post('/auth/reset-password', { token, newPassword });
//     return response.data;
//   },

//   logout: async (refreshToken: string) => {
//     const response = await api.post('/auth/logout', { refreshToken });
//     return response.data;
//   },

//   refreshToken: async (refreshToken: string) => {
//     const response = await api.post('/auth/refresh-token', { refreshToken });
//     return response.data;
//   },
// };

// export default api;




