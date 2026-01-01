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
export const propertiesAPI = {
  // Get all properties (public - no auth required)
  getProperties: async (params?: any) => {
    try {
      console.log('🔍 [Frontend API] Fetching properties with params:', params);
      
      const response = await serverApi.get('/properties', { params });
      console.log('📥 [Frontend API] Properties response:', {
        hasProperties: !!response.data.properties,
        dataType: Array.isArray(response.data) ? 'array' : 'object',
        data: response.data
      });
      
      // Handle both response formats
      let properties = [];
      
      if (response.data.properties) {
        // Response format: { properties: [], totalPages, currentPage, total }
        properties = response.data.properties;
      } else if (Array.isArray(response.data)) {
        // Response format: [] (array directly)
        properties = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Check if it's a single property or other format
        properties = [response.data];
      }
      
      console.log('✅ [Frontend API] Extracted properties:', properties.length);
      
      // Ensure all properties have the new price structure
      const enhancedProperties = properties.map((property: any) => {
        // If property doesn't have calculatedPrices, create it
        if (!property.calculatedPrices && property.price) {
          const utilityPercentage = property.utilityPercentage || 20;
          const serviceChargePercentage = property.serviceChargePercentage || 10;
          const vatPercentage = property.vatPercentage || 7.5;
          const actualPrice = property.price;
          
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
            }
          };
        }
        return property;
      });
      
      return enhancedProperties;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch properties');
    }
  },

  // Get featured properties (public - no auth required)
  getFeaturedProperties: async () => {
    try {
      const response = await serverApi.get('/properties/featured');
      
      // Ensure featured properties have the new price structure
      const featuredProperties = Array.isArray(response.data) ? response.data : [];
      
      return featuredProperties.map((property: any) => {
        if (!property.calculatedPrices && property.price) {
          const utilityPercentage = property.utilityPercentage || 20;
          const serviceChargePercentage = property.serviceChargePercentage || 10;
          const vatPercentage = property.vatPercentage || 7.5;
          const actualPrice = property.price;
          
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
            }
          };
        }
        return property;
      });
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching featured properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch featured properties');
    }
  },

  // Get property by ID
  getPropertyById: async (id: string) => {
    try {
      console.log('🔍 [Frontend API] Fetching property with ID:', id);

      // Validate ID before making the request
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
      
      // Ensure the property has the new price structure
      const property = response.data;
      
      if (property && !property.calculatedPrices && property.price) {
        const utilityPercentage = property.utilityPercentage || 20;
        const serviceChargePercentage = property.serviceChargePercentage || 10;
        const vatPercentage = property.vatPercentage || 7.5;
        const actualPrice = property.price;
        
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
          }
        };
      }
      
      return property;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching property:', error);
      
      // Handle specific HTTP status codes
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

  // Create property (requires auth)
  createProperty: async (propertyData: FormData) => {
    try {
      const response = await api.post('/properties', propertyData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Ensure response has calculatedPrices
      if (response.data.property && !response.data.property.calculatedPrices) {
        const property = response.data.property;
        const utilityPercentage = property.utilityPercentage || 20;
        const serviceChargePercentage = property.serviceChargePercentage || 10;
        const vatPercentage = property.vatPercentage || 7.5;
        const actualPrice = property.price;
        
        const utility = (actualPrice * utilityPercentage) / 100;
        const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
        const accommodation = actualPrice - utility - serviceCharge;
        const vat = (accommodation * vatPercentage) / 100;
        const total = actualPrice + vat;
        
        response.data.property.calculatedPrices = {
          actualPrice,
          utility: Math.round(utility * 100) / 100,
          serviceCharge: Math.round(serviceCharge * 100) / 100,
          accommodation: Math.round(accommodation * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          total: Math.round(total * 100) / 100
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error creating property:', error);
      throw new Error(error.response?.data?.message || 'Failed to create property');
    }
  },

  // Update property (requires auth)
  updateProperty: async (id: string, propertyData: FormData) => {
    try {
      const response = await api.put(`/properties/${id}`, propertyData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Ensure response has calculatedPrices
      if (response.data.property && !response.data.property.calculatedPrices) {
        const property = response.data.property;
        const utilityPercentage = property.utilityPercentage || 20;
        const serviceChargePercentage = property.serviceChargePercentage || 10;
        const vatPercentage = property.vatPercentage || 7.5;
        const actualPrice = property.price;
        
        const utility = (actualPrice * utilityPercentage) / 100;
        const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
        const accommodation = actualPrice - utility - serviceCharge;
        const vat = (accommodation * vatPercentage) / 100;
        const total = actualPrice + vat;
        
        response.data.property.calculatedPrices = {
          actualPrice,
          utility: Math.round(utility * 100) / 100,
          serviceCharge: Math.round(serviceCharge * 100) / 100,
          accommodation: Math.round(accommodation * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          total: Math.round(total * 100) / 100
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error updating property:', error);
      throw new Error(error.response?.data?.message || 'Failed to update property');
    }
  },

  // Delete property (requires auth)
  deleteProperty: async (id: string) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error deleting property:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete property');
    }
  },

  // Get user's properties (requires auth)
  getUserProperties: async () => {
    try {
      const response = await api.get('/properties/user/my-properties');
      
      // Ensure properties have the new price structure
      const userProperties = Array.isArray(response.data) ? response.data : [];
      
      return userProperties.map((property: any) => {
        if (!property.calculatedPrices && property.price) {
          const utilityPercentage = property.utilityPercentage || 20;
          const serviceChargePercentage = property.serviceChargePercentage || 10;
          const vatPercentage = property.vatPercentage || 7.5;
          const actualPrice = property.price;
          
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
            }
          };
        }
        return property;
      });
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching user properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user properties');
    }
  },

  // Admin: Get all properties (requires admin auth)
  getAdminProperties: async (params?: any) => {
    try {
      const response = await api.get('/properties/admin/all', { params });
      
      // Ensure admin properties have the new price structure
      let properties = [];
      
      if (response.data.properties) {
        properties = response.data.properties;
      } else if (Array.isArray(response.data)) {
        properties = response.data;
      }
      
      const enhancedProperties = properties.map((property: any) => {
        if (!property.calculatedPrices && property.price) {
          const utilityPercentage = property.utilityPercentage || 20;
          const serviceChargePercentage = property.serviceChargePercentage || 10;
          const vatPercentage = property.vatPercentage || 7.5;
          const actualPrice = property.price;
          
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
            }
          };
        }
        return property;
      });
      
      return {
        ...response.data,
        properties: enhancedProperties
      };
    } catch (error: any) {
      console.error('💥 [Frontend API] Error fetching admin properties:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin properties');
    }
  },

  // Admin: Update property status (requires admin auth)
  updatePropertyStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/properties/admin/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error updating property status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update property status');
    }
  },

  // Admin: Toggle featured status (requires admin auth)
  toggleFeatured: async (id: string) => {
    try {
      const response = await api.patch(`/properties/admin/${id}/feature`);
      return response.data;
    } catch (error: any) {
      console.error('💥 [Frontend API] Error toggling featured status:', error);
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

  export const inventoryAPI = {
    // Inventory items
    getItems: async (params?: any) => {
      const response = await api.get('/inventory/items', { params });
      return response.data;
    },

    getItemById: async (id: string) => {
      const response = await api.get(`/inventory/items/${id}`);
      return response.data;
    },

    createItem: async (itemData: any) => {
      const response = await api.post('/inventory/items', itemData);
      return response.data;
    },

    updateItem: async (id: string, itemData: any) => {
      const response = await api.put(`/inventory/items/${id}`, itemData);
      return response.data;
    },

    deleteItem: async (id: string) => {
      const response = await api.delete(`/inventory/items/${id}`);
      return response.data;
    },

    // Stock management
    updateStock: async (id: string, stockData: any) => {
      const response = await api.patch(`/inventory/items/${id}/stock`, stockData);
      return response.data;
    },

    getStockMovements: async (id: string) => {
      const response = await api.get(`/inventory/items/${id}/movements`);
      return response.data;
    },

    // Statistics
    getStats: async () => {
      const response = await api.get('/inventory/stats');
      return response.data;
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
export const staffAPI = {
  // Staff management
  getStaff: async (params?: any) => {
    const response = await api.get('/staff/staff', { params });
    return response.data;
  },

  getStaffStats: async () => {
    const response = await api.get('/staff/staff/stats');
    return response.data;
  },

  createStaff: async (staffData: any) => {
    const response = await api.post('/staff/staff', staffData);
    return response.data;
  },

  updateStaff: async (id: string, staffData: any) => {
    const response = await api.put(`/staff/staff/${id}`, staffData);
    return response.data;
  },

  deleteStaff: async (id: string) => {
    const response = await api.delete(`/staff/staff/${id}`);
    return response.data;
  },

  // Attendance
  getAttendance: async (params?: any) => {
    const response = await api.get('/staff/attendance', { params });
    return response.data;
  },

  checkIn: async (checkInData: any) => {
    const response = await api.post('/staff/attendance/checkin', checkInData);
    return response.data;
  },

  checkOut: async (checkOutData: any) => {
    const response = await api.post('/staff/attendance/checkout', checkOutData);
    return response.data;
  },

  // Daily reports
  getReports: async (params?: any) => {
    const response = await api.get('/staff/reports', { params });
    return response.data;
  },

  createReport: async (reportData: any) => {
    const response = await api.post('/staff/reports', reportData);
    return response.data;
  },

  // Leave requests
  getLeaveRequests: async (params?: any) => {
    const response = await api.get('/staff/leaves', { params });
    return response.data;
  },

  createLeaveRequest: async (leaveData: any) => {
    const response = await api.post('/staff/leaves', leaveData);
    return response.data;
  },

  updateLeaveStatus: async (id: string, statusData: any) => {
    const response = await api.patch(`/staff/leaves/${id}/status`, statusData);
    return response.data;
  }
}
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




