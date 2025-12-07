// contexts/BookingContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { bookingsAPI } from '@/lib/api';
import { useAuth } from './AuthContext';

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    images: Array<{ url: string }>;
    price: number;
    specifications: {
      maxGuests: number;
    };
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  serviceFee: number;
  paymentStatus: string;
  bookingStatus: string;
  paymentReference: string;
  createdAt: string;
  accessPass?: {
    code?: string;
    providedBy?: string;
    sentAt?: string;
    expiresAt?: string;
    status: string;
    instructions?: string;
  };
}

interface BookingContextType {
  bookings: Booking[];
  loading: boolean;
  createBooking: (bookingData: any) => Promise<any>;
  initializePayment: (bookingId: string, email: string) => Promise<any>;
  verifyPayment: (reference: string) => Promise<any>;
  getUserBookings: () => Promise<void>;
  cancelBooking: (id: string, reason: string) => Promise<void>;
  checkAvailability: (propertyId: string, checkIn: string, checkOut: string) => Promise<boolean>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Automatically load bookings when user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, loading bookings...');
      getUserBookings();
    } else {
      console.log('No user, clearing bookings');
      setBookings([]);
    }
  }, [user]);

  const getUserBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching user bookings from API...');
      const response = await bookingsAPI.getUserBookings();
      console.log('Bookings API response:', response);
      setBookings(response.bookings || []);
      console.log(`Loaded ${response.bookings?.length || 0} bookings`);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]); // Clear bookings on error
    } finally {
      setLoading(false);
    }
  };

  // const createBooking = async (bookingData: any) => {
  //   try {
  //     setLoading(true);
  //     const response = await bookingsAPI.createBooking(bookingData);
  //     // Refresh bookings after creating a new one
  //     await getUserBookings();
  //     return response;
  //   } catch (error: any) {
  //     console.error('Create booking error:', error);
  //     throw new Error(error.response?.data?.message || 'Failed to create booking');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // contexts/BookingContext.tsx - Update createBooking function
// const createBooking = async (bookingData: any) => {
//   try {
//     setLoading(true);
//     console.log('🔍 [Booking Context] Creating booking with data:', bookingData);
    
//     const response = await bookingsAPI.createBooking(bookingData);
//     console.log('✅ [Booking Context] Booking created successfully:', response);
    
//     // Refresh bookings after creating a new one
//     await getUserBookings();
    
//     return response;
//   } catch (error: any) {
//     console.error('💥 [Booking Context] Create booking error:', error);
//     console.error('💥 [Booking Context] Error response:', error.response?.data);
    
//     // Check if it's a specific error that would cause navigation issues
//     if (error.response?.status === 401) {
//       console.error('💥 [Booking Context] Authentication error');
//     }
//     if (error.response?.status === 400) {
//       console.error('💥 [Booking Context] Bad request:', error.response.data);
//     }
    
//     throw new Error(error.response?.data?.message || 'Failed to create booking');
//   } finally {
//     setLoading(false);
//   }
// };
 
//   const initializePayment = async (bookingId: string, email: string) => {
//     try {
//       const response = await bookingsAPI.initializePayment(bookingId, email);
//       return response;
//     } catch (error: any) {
//       console.error('Initialize payment error:', error);
//       throw new Error(error.response?.data?.message || 'Failed to initialize payment');
//     }
//   };

// contexts/BookingContext.tsx - Update createBooking function
// const createBooking = async (bookingData: any) => {
//   try {
//     setLoading(true);
//     console.log('📤 [BookingContext] Creating booking:', bookingData);
    
//     const response = await bookingsAPI.createBooking(bookingData);
//     console.log('📥 [BookingContext] Booking response:', response);
    
//     // Refresh bookings after creating a new one
//     await getUserBookings();
    
//     return response;
//   } catch (error: any) {
//     console.error('❌ [BookingContext] Create booking error:', error);
//     throw new Error(error.response?.data?.message || 'Failed to create booking');
//   } finally {
//     setLoading(false);
//   }
// };

// // Update initializePayment function
// const initializePayment = async (bookingId: string, email: string) => {
//   try {
//     console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
//     const response = await bookingsAPI.initializePayment(bookingId, email);
//     console.log('📥 [BookingContext] Payment response:', response);
//     return response;
//   } catch (error: any) {
//     console.error('❌ [BookingContext] Payment error:', error);
//     throw new Error(error.response?.data?.message || 'Failed to initialize payment');
//   }
// };

  // contexts/BookingContext.tsx - Update createBooking function
  // const createBooking = async (bookingData: any) => {
  //   try {
  //     setLoading(true);
  //     console.log('📤 [BookingContext] Creating booking:', bookingData);
      
  //     const response = await bookingsAPI.createBooking(bookingData);
  //     console.log('📥 [BookingContext] Booking response:', response);
      
  //     // ✅ FIX: Check if response indicates success
  //     if (!response.success) {
  //       // This is an actual error from the backend
  //       throw new Error(response.message || 'Failed to create booking');
  //     }
      
  //     // ✅ FIX: Refresh bookings after creating a new one
  //     await getUserBookings();
      
  //     // ✅ FIX: Return the full response including booking data
  //     return response;
  //   } catch (error: any) {
  //     console.error('❌ [BookingContext] Create booking error:', error);
      
  //     // Check if it's an actual error or just a success message
  //     if (error.message.includes('Booking created successfully')) {
  //       // This is actually a success, not an error
  //       console.log('✅ [BookingContext] Booking created successfully');
  //       return { success: true, message: error.message };
  //     }
      
  //     throw new Error(error.response?.data?.message || 'Failed to create booking');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // contexts/BookingContext.tsx - Update createBooking function
  const createBooking = async (bookingData: any) => {
    try {
      setLoading(true);
      console.log('📤 [BookingContext] Creating booking:', bookingData);
      
      const response = await bookingsAPI.createBooking(bookingData);
      console.log('📥 [BookingContext] Raw booking response:', response);
      
      // Check what we actually got back
      if (!response) {
        console.error('❌ [BookingContext] No response at all');
        throw new Error('No response from server');
      }
      
      // Check for error message in response
      if (response.message && response.message.includes('Failed')) {
        console.error('❌ [BookingContext] Error message in response:', response.message);
        throw new Error(response.message);
      }
      
      // If we get here, it should be successful
      console.log('✅ [BookingContext] Booking appears successful');
      
      // Refresh bookings after creating a new one
      await getUserBookings();
      
      return response;
    } catch (error: any) {
      console.error('❌ [BookingContext] Create booking error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Re-throw with the actual error message
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // contexts/BookingContext.tsx - Update initializePayment function
  // const initializePayment = async (bookingId: string, email: string) => {
  //   try {
  //     console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
  //     const response = await bookingsAPI.initializePayment(bookingId, email);
  //     console.log('📥 [BookingContext] Payment response:', response);
      
  //     // ✅ FIX: Check if response indicates success
  //     if (!response.success) {
  //       throw new Error(response.message || 'Failed to initialize payment');
  //     }
      
  //     // ✅ FIX: Extract the payment data
  //     const paymentData = {
  //       authorization_url: response.authorization_url,
  //       reference: response.reference,
  //       access_code: response.access_code
  //     };
      
  //     return paymentData;
  //   } catch (error: any) {
  //     console.error('❌ [BookingContext] Payment error:', error);
  //     throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  //   }
  // };

  // contexts/BookingContext.tsx - Update initializePayment function
  const initializePayment = async (bookingId: string, email: string) => {
    try {
      console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
      const response = await bookingsAPI.initializePayment(bookingId, email);
      console.log('📥 [BookingContext] Payment response:', response);
      
      // ✅ FIX: Check if response indicates success
      // The response should be: { authorization_url, reference, access_code }
      if (!response) {
        console.error('❌ [BookingContext] No payment response');
        throw new Error('No response from payment service');
      }
      
      // ✅ FIX: If we have authorization_url, it's successful
      if (response.authorization_url) {
        console.log('✅ [BookingContext] Payment initialized successfully');
        return response;
      }
      
      // If we get here, something went wrong
      console.error('❌ [BookingContext] Missing authorization_url:', response);
      throw new Error('Payment service did not return payment URL');
      
    } catch (error: any) {
      console.error('❌ [BookingContext] Payment error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await bookingsAPI.verifyPayment(reference);
      // Refresh bookings after payment verification
      await getUserBookings();
      return response;
    } catch (error: any) {
      console.error('Verify payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const cancelBooking = async (id: string, reason: string) => {
    try {
      await bookingsAPI.cancelBooking(id, reason);
      // Refresh bookings after cancellation
      await getUserBookings();
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const checkAvailability = async (propertyId: string, checkIn: string, checkOut: string) => {
    try {
      const response = await bookingsAPI.checkAvailability(propertyId, checkIn, checkOut);
      return response.available;
    } catch (error: any) {
      console.error('Check availability error:', error);
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  };

  const value: BookingContextType = {
    bookings,
    loading,
    createBooking,
    initializePayment,
    verifyPayment,
    getUserBookings,
    cancelBooking,
    checkAvailability,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};










































// 'use client';

// import React, { createContext, useContext, useState, ReactNode } from 'react';
// import { bookingsAPI } from '@/lib/api';

// interface Booking {
//   _id: string;
//   property: {
//     _id: string;
//     title: string;
//     location: string;
//     images: Array<{ url: string }>;
//     price: number;
//     specifications: {
//       maxGuests: number;
//     };
//   };
//   checkIn: string;
//   checkOut: string;
//   guests: number;
//   totalAmount: number;
//   serviceFee: number;
//   paymentStatus: string;
//   bookingStatus: string;
//   paymentReference: string;
//   createdAt: string;
// }

// interface BookingContextType {
//   bookings: Booking[];
//   loading: boolean;
//   createBooking: (bookingData: any) => Promise<any>;
//   initializePayment: (bookingId: string, email: string) => Promise<any>;
//   verifyPayment: (reference: string) => Promise<any>;
//   getUserBookings: () => Promise<void>;
//   cancelBooking: (id: string, reason: string) => Promise<void>;
//   checkAvailability: (propertyId: string, checkIn: string, checkOut: string) => Promise<boolean>;
// }

// const BookingContext = createContext<BookingContextType | undefined>(undefined);

// export const useBooking = () => {
//   const context = useContext(BookingContext);
//   if (context === undefined) {
//     throw new Error('useBooking must be used within a BookingProvider');
//   }
//   return context;
// };

// interface BookingProviderProps {
//   children: ReactNode;
// }

// export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(false);

//   const createBooking = async (bookingData: any) => {
//     try {
//       setLoading(true);
//       const response = await bookingsAPI.createBooking(bookingData);
//       return response;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to create booking');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const initializePayment = async (bookingId: string, email: string) => {
//     try {
//       const response = await bookingsAPI.initializePayment(bookingId, email);
//       return response.paymentData;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to initialize payment');
//     }
//   };

//   const verifyPayment = async (reference: string) => {
//     try {
//       const response = await bookingsAPI.verifyPayment(reference);
//       return response;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Payment verification failed');
//     }
//   };

//   const getUserBookings = async () => {
//     try {
//       setLoading(true);
//       const response = await bookingsAPI.getUserBookings();
//       setBookings(response.bookings || []);
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cancelBooking = async (id: string, reason: string) => {
//     try {
//       await bookingsAPI.cancelBooking(id, reason);
//       await getUserBookings(); // Refresh bookings list
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to cancel booking');
//     }
//   };

//   const checkAvailability = async (propertyId: string, checkIn: string, checkOut: string) => {
//     try {
//       const response = await bookingsAPI.checkAvailability(propertyId, checkIn, checkOut);
//       return response.available;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to check availability');
//     }
//   };

//   const value: BookingContextType = {
//     bookings,
//     loading,
//     createBooking,
//     initializePayment,
//     verifyPayment,
//     getUserBookings,
//     cancelBooking,
//     checkAvailability,
//   };

//   return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
// };

