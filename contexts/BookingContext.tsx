// contexts/BookingContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { bookingsAPI } from '@/lib/api';
import { useAuth } from './AuthContext';

// Price Breakdown Interface
interface PriceBreakdown {
  actualPrice: number;
  utilityPercentage: number;
  utility: number;
  serviceChargePercentage: number;
  serviceCharge: number;
  accommodation: number;
  vatPercentage: number;
  vat: number;
  subtotal: number;
  totalAmount: number;
}

// Property Calculated Prices Interface
interface PropertyCalculatedPrices {
  actualPrice: number;
  utility: number;
  serviceCharge: number;
  accommodation: number;
  vat: number;
  total: number;
}

// Property Interface with new fields
interface BookingProperty {
  _id: string;
  title: string;
  location: string;
  images: Array<{ url: string }>;
  price: number;
  utilityPercentage: number;
  serviceChargePercentage: number;
  vatPercentage: number;
  calculatedPrices: PropertyCalculatedPrices;
  specifications: {
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
  };
}

// Updated Booking Interface with Price Breakdown
interface Booking {
  _id: string;
  property: BookingProperty;
  checkIn: string;
  checkOut: string;
  guests: number;
  priceBreakdown: PriceBreakdown; // New: Full price breakdown
  totalAmount: number; // Kept for backward compatibility
  serviceFee?: number; // Optional now
  paymentStatus: string;
  bookingStatus: string;
  paymentMethod: 'paystack' | 'bank_transfer' | 'onsite';
  paymentReference: string;
  paystackReference?: string;
  createdAt: string;
  accessPass?: {
    code?: string;
    providedBy?: string;
    sentAt?: string;
    expiresAt?: string;
    status: string;
    instructions?: string;
  };
  bankTransferDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    transferReference?: string;
    transferDate?: string;
    proofOfPayment?: string;
    verifiedBy?: string;
    verifiedAt?: string;
    status: string;
    rejectionReason?: string;
  };
  onsitePaymentDetails?: {
    expectedAmount?: number;
    collectedBy?: string;
    collectedAt?: string;
    receiptNumber?: string;
    status: string;
  };
  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  totalNights?: number; // Virtual field
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
  calculatePriceBreakdown: (
    actualPrice: number,
    nights: number,
    utilityPercentage?: number,
    serviceChargePercentage?: number,
    vatPercentage?: number
  ) => PriceBreakdown;
  getDisplayPrice: (booking: Booking) => {
    accommodation: number;
    utility: number;
    serviceCharge: number;
    vat: number;
    total: number;
    breakdown: PriceBreakdown | null;
  };
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

  // Helper function to calculate price breakdown
  const calculatePriceBreakdown = (
    actualPrice: number,
    nights: number,
    utilityPercentage: number = 20,
    serviceChargePercentage: number = 10,
    vatPercentage: number = 7.5
  ): PriceBreakdown => {
    const totalActual = actualPrice * nights;
    const utility = (totalActual * utilityPercentage) / 100;
    const serviceCharge = (totalActual * serviceChargePercentage) / 100;
    const accommodation = totalActual - utility - serviceCharge;
    const vat = (accommodation * vatPercentage) / 100;
    const total = totalActual + vat;
    
    return {
      actualPrice: Math.round(totalActual * 100) / 100,
      utilityPercentage,
      utility: Math.round(utility * 100) / 100,
      serviceChargePercentage,
      serviceCharge: Math.round(serviceCharge * 100) / 100,
      accommodation: Math.round(accommodation * 100) / 100,
      vatPercentage,
      vat: Math.round(vat * 100) / 100,
      subtotal: Math.round(totalActual * 100) / 100,
      totalAmount: Math.round(total * 100) / 100
    };
  };

  // Helper to get display price from booking
  const getDisplayPrice = (booking: Booking) => {
    if (booking.priceBreakdown) {
      return {
        accommodation: booking.priceBreakdown.accommodation,
        utility: booking.priceBreakdown.utility,
        serviceCharge: booking.priceBreakdown.serviceCharge,
        vat: booking.priceBreakdown.vat,
        total: booking.priceBreakdown.totalAmount,
        breakdown: booking.priceBreakdown
      };
    }
    
    // Fallback for old bookings
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    const propertyUtilityPercentage = booking.property?.utilityPercentage || 20;
    const propertyServiceChargePercentage = booking.property?.serviceChargePercentage || 10;
    const propertyVatPercentage = booking.property?.vatPercentage || 7.5;
    const propertyPrice = booking.property?.price || 0;
    
    const fallbackBreakdown = calculatePriceBreakdown(
      propertyPrice,
      nights,
      propertyUtilityPercentage,
      propertyServiceChargePercentage,
      propertyVatPercentage
    );
    
    return {
      accommodation: fallbackBreakdown.accommodation,
      utility: fallbackBreakdown.utility,
      serviceCharge: fallbackBreakdown.serviceCharge,
      vat: fallbackBreakdown.vat,
      total: fallbackBreakdown.totalAmount,
      breakdown: fallbackBreakdown
    };
  };

  // Convert old booking format to new format
  const convertToNewBookingFormat = (oldBooking: any): Booking => {
    // Calculate total nights
    const checkIn = new Date(oldBooking.checkIn);
    const checkOut = new Date(oldBooking.checkOut);
    const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get property data
    const property = oldBooking.property || {};
    const propertyPrice = property.price || 0;
    const utilityPercentage = property.utilityPercentage || 20;
    const serviceChargePercentage = property.serviceChargePercentage || 10;
    const vatPercentage = property.vatPercentage || 7.5;
    
    // Calculate price breakdown
    let priceBreakdown: PriceBreakdown;
    
    if (oldBooking.priceBreakdown) {
      // Already has new format
      priceBreakdown = oldBooking.priceBreakdown;
    } else {
      // Calculate from old format
      priceBreakdown = calculatePriceBreakdown(
        propertyPrice,
        totalNights,
        utilityPercentage,
        serviceChargePercentage,
        vatPercentage
      );
    }
    
    return {
      _id: oldBooking._id,
      property: {
        _id: property._id || '',
        title: property.title || '',
        location: property.location || '',
        images: property.images || [],
        price: propertyPrice,
        utilityPercentage,
        serviceChargePercentage,
        vatPercentage,
        calculatedPrices: property.calculatedPrices || {
          actualPrice: propertyPrice,
          utility: (propertyPrice * utilityPercentage) / 100,
          serviceCharge: (propertyPrice * serviceChargePercentage) / 100,
          accommodation: propertyPrice - ((propertyPrice * utilityPercentage) / 100) - ((propertyPrice * serviceChargePercentage) / 100),
          vat: ((propertyPrice - ((propertyPrice * utilityPercentage) / 100) - ((propertyPrice * serviceChargePercentage) / 100)) * vatPercentage) / 100,
          total: propertyPrice + ((propertyPrice - ((propertyPrice * utilityPercentage) / 100) - ((propertyPrice * serviceChargePercentage) / 100)) * vatPercentage) / 100
        },
        specifications: property.specifications || {
          maxGuests: 1,
          bedrooms: 0,
          bathrooms: 0,
          squareFeet: 0
        }
      },
      checkIn: oldBooking.checkIn,
      checkOut: oldBooking.checkOut,
      guests: oldBooking.guests || 1,
      priceBreakdown,
      totalAmount: oldBooking.totalAmount || priceBreakdown.totalAmount,
      serviceFee: oldBooking.serviceFee,
      paymentStatus: oldBooking.paymentStatus || 'pending',
      bookingStatus: oldBooking.bookingStatus || 'pending',
      paymentMethod: oldBooking.paymentMethod || 'paystack',
      paymentReference: oldBooking.paymentReference || '',
      paystackReference: oldBooking.paystackReference,
      createdAt: oldBooking.createdAt || new Date().toISOString(),
      accessPass: oldBooking.accessPass,
      bankTransferDetails: oldBooking.bankTransferDetails,
      onsitePaymentDetails: oldBooking.onsitePaymentDetails,
      specialRequests: oldBooking.specialRequests,
      cancellationReason: oldBooking.cancellationReason,
      cancelledAt: oldBooking.cancelledAt,
      totalNights
    };
  };

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
      
      if (response.success && response.bookings) {
        // Convert all bookings to new format
        const updatedBookings = response.bookings.map((booking: any) => 
          convertToNewBookingFormat(booking)
        );
        
        setBookings(updatedBookings);
        console.log(`Loaded ${updatedBookings.length} bookings with new price format`);
      } else {
        setBookings([]);
        console.log('No bookings found or invalid response');
      }
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: any) => {
    try {
      setLoading(true);
      console.log('📤 [BookingContext] Creating booking:', bookingData);
      
      const response = await bookingsAPI.createBooking(bookingData);
      console.log('📥 [BookingContext] Raw booking response:', response);
      
      if (!response) {
        console.error('❌ [BookingContext] No response at all');
        throw new Error('No response from server');
      }
      
      // Check for error message in response
      if (response.message && response.message.includes('Failed')) {
        console.error('❌ [BookingContext] Error message in response:', response.message);
        throw new Error(response.message);
      }
      
      console.log('✅ [BookingContext] Booking created successfully');
      
      // Convert response to new format
      if (response.booking) {
        const newBooking = convertToNewBookingFormat(response.booking);
        setBookings(prev => [newBooking, ...prev]);
      }
      
      // Refresh bookings list
      await getUserBookings();
      
      return response;
    } catch (error: any) {
      console.error('❌ [BookingContext] Create booking error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = async (bookingId: string, email: string) => {
    try {
      console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
      const response = await bookingsAPI.initializePayment(bookingId, email);
      console.log('📥 [BookingContext] Payment response:', response);
      
      if (!response) {
        console.error('❌ [BookingContext] No payment response');
        throw new Error('No response from payment service');
      }
      
      if (response.authorization_url) {
        console.log('✅ [BookingContext] Payment initialized successfully');
        return response;
      }
      
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
      
      // Update local booking status
      setBookings(prev => prev.map(booking => 
        booking._id === id 
          ? { 
              ...booking, 
              bookingStatus: 'cancelled',
              cancellationReason: reason,
              cancelledAt: new Date().toISOString()
            } 
          : booking
      ));
      
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
    calculatePriceBreakdown,
    getDisplayPrice
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};




























































// // contexts/BookingContext.tsx
// 'use client';

// import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// import { bookingsAPI } from '@/lib/api';
// import { useAuth } from './AuthContext';

// // interface Booking {
// //   _id: string;
// //   property: {
// //     _id: string;
// //     title: string;
// //     location: string;
// //     images: Array<{ url: string }>;
// //     price: number;
// //     specifications: {
// //       maxGuests: number;
// //     };
// //   };
// //   checkIn: string;
// //   checkOut: string;
// //   guests: number;
// //   totalAmount: number;
// //   serviceFee: number;
// //   paymentStatus: string;
// //   bookingStatus: string;
// //   paymentMethod: 'paystack' | 'bank_transfer' | 'onsite'; // Added this line
// //   paymentReference: string;
// //   createdAt: string;
// //   accessPass?: {
// //     code?: string;
// //     providedBy?: string;
// //     sentAt?: string;
// //     expiresAt?: string;
// //     status: string;
// //     instructions?: string;
// //   };
// // } 

// // contexts/BookingContext.tsx - Update the Booking interface
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
//   paymentMethod: 'paystack' | 'bank_transfer' | 'onsite'; // Add this
//   paymentReference: string;
//   createdAt: string;
//   accessPass?: {
//     code?: string;
//     providedBy?: string;
//     sentAt?: string;
//     expiresAt?: string;
//     status: string;
//     instructions?: string;
//   };
//   bankTransferDetails?: { // Add this
//     accountName?: string;
//     accountNumber?: string;
//     bankName?: string;
//     transferReference?: string;
//     proofOfPayment?: string;
//     status: string;
//   };
//   onsitePaymentDetails?: { // Add this
//     expectedAmount?: number;
//     status: string;
//   };
//   specialRequests?: string;
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
//   const { user } = useAuth();

//   // Automatically load bookings when user changes
//   useEffect(() => {
//     if (user) {
//       console.log('User authenticated, loading bookings...');
//       getUserBookings();
//     } else {
//       console.log('No user, clearing bookings');
//       setBookings([]);
//     }
//   }, [user]);

//   const getUserBookings = async () => {
//     try {
//       setLoading(true);
//       console.log('Fetching user bookings from API...');
//       const response = await bookingsAPI.getUserBookings();
//       console.log('Bookings API response:', response);
//       setBookings(response.bookings || []);
//       console.log(`Loaded ${response.bookings?.length || 0} bookings`);
//     } catch (error: any) {
//       console.error('Failed to fetch bookings:', error);
//       setBookings([]); // Clear bookings on error
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const createBooking = async (bookingData: any) => {
//   //   try {
//   //     setLoading(true);
//   //     const response = await bookingsAPI.createBooking(bookingData);
//   //     // Refresh bookings after creating a new one
//   //     await getUserBookings();
//   //     return response;
//   //   } catch (error: any) {
//   //     console.error('Create booking error:', error);
//   //     throw new Error(error.response?.data?.message || 'Failed to create booking');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // contexts/BookingContext.tsx - Update createBooking function
// // const createBooking = async (bookingData: any) => {
// //   try {
// //     setLoading(true);
// //     console.log('🔍 [Booking Context] Creating booking with data:', bookingData);
    
// //     const response = await bookingsAPI.createBooking(bookingData);
// //     console.log('✅ [Booking Context] Booking created successfully:', response);
    
// //     // Refresh bookings after creating a new one
// //     await getUserBookings();
    
// //     return response;
// //   } catch (error: any) {
// //     console.error('💥 [Booking Context] Create booking error:', error);
// //     console.error('💥 [Booking Context] Error response:', error.response?.data);
    
// //     // Check if it's a specific error that would cause navigation issues
// //     if (error.response?.status === 401) {
// //       console.error('💥 [Booking Context] Authentication error');
// //     }
// //     if (error.response?.status === 400) {
// //       console.error('💥 [Booking Context] Bad request:', error.response.data);
// //     }
    
// //     throw new Error(error.response?.data?.message || 'Failed to create booking');
// //   } finally {
// //     setLoading(false);
// //   }
// // };
 
// //   const initializePayment = async (bookingId: string, email: string) => {
// //     try {
// //       const response = await bookingsAPI.initializePayment(bookingId, email);
// //       return response;
// //     } catch (error: any) {
// //       console.error('Initialize payment error:', error);
// //       throw new Error(error.response?.data?.message || 'Failed to initialize payment');
// //     }
// //   };

// // contexts/BookingContext.tsx - Update createBooking function
// // const createBooking = async (bookingData: any) => {
// //   try {
// //     setLoading(true);
// //     console.log('📤 [BookingContext] Creating booking:', bookingData);
    
// //     const response = await bookingsAPI.createBooking(bookingData);
// //     console.log('📥 [BookingContext] Booking response:', response);
    
// //     // Refresh bookings after creating a new one
// //     await getUserBookings();
    
// //     return response;
// //   } catch (error: any) {
// //     console.error('❌ [BookingContext] Create booking error:', error);
// //     throw new Error(error.response?.data?.message || 'Failed to create booking');
// //   } finally {
// //     setLoading(false);
// //   }
// // };

// // // Update initializePayment function
// // const initializePayment = async (bookingId: string, email: string) => {
// //   try {
// //     console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
// //     const response = await bookingsAPI.initializePayment(bookingId, email);
// //     console.log('📥 [BookingContext] Payment response:', response);
// //     return response;
// //   } catch (error: any) {
// //     console.error('❌ [BookingContext] Payment error:', error);
// //     throw new Error(error.response?.data?.message || 'Failed to initialize payment');
// //   }
// // };

//   // contexts/BookingContext.tsx - Update createBooking function
//   // const createBooking = async (bookingData: any) => {
//   //   try {
//   //     setLoading(true);
//   //     console.log('📤 [BookingContext] Creating booking:', bookingData);
      
//   //     const response = await bookingsAPI.createBooking(bookingData);
//   //     console.log('📥 [BookingContext] Booking response:', response);
      
//   //     // ✅ FIX: Check if response indicates success
//   //     if (!response.success) {
//   //       // This is an actual error from the backend
//   //       throw new Error(response.message || 'Failed to create booking');
//   //     }
      
//   //     // ✅ FIX: Refresh bookings after creating a new one
//   //     await getUserBookings();
      
//   //     // ✅ FIX: Return the full response including booking data
//   //     return response;
//   //   } catch (error: any) {
//   //     console.error('❌ [BookingContext] Create booking error:', error);
      
//   //     // Check if it's an actual error or just a success message
//   //     if (error.message.includes('Booking created successfully')) {
//   //       // This is actually a success, not an error
//   //       console.log('✅ [BookingContext] Booking created successfully');
//   //       return { success: true, message: error.message };
//   //     }
      
//   //     throw new Error(error.response?.data?.message || 'Failed to create booking');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // contexts/BookingContext.tsx - Update createBooking function
//   const createBooking = async (bookingData: any) => {
//     try {
//       setLoading(true);
//       console.log('📤 [BookingContext] Creating booking:', bookingData);
      
//       const response = await bookingsAPI.createBooking(bookingData);
//       console.log('📥 [BookingContext] Raw booking response:', response);
      
//       // Check what we actually got back
//       if (!response) {
//         console.error('❌ [BookingContext] No response at all');
//         throw new Error('No response from server');
//       }
      
//       // Check for error message in response
//       if (response.message && response.message.includes('Failed')) {
//         console.error('❌ [BookingContext] Error message in response:', response.message);
//         throw new Error(response.message);
//       }
      
//       // If we get here, it should be successful
//       console.log('✅ [BookingContext] Booking appears successful');
      
//       // Refresh bookings after creating a new one
//       await getUserBookings();
      
//       return response;
//     } catch (error: any) {
//       console.error('❌ [BookingContext] Create booking error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
      
//       // Re-throw with the actual error message
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // contexts/BookingContext.tsx - Update initializePayment function
//   // const initializePayment = async (bookingId: string, email: string) => {
//   //   try {
//   //     console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
//   //     const response = await bookingsAPI.initializePayment(bookingId, email);
//   //     console.log('📥 [BookingContext] Payment response:', response);
      
//   //     // ✅ FIX: Check if response indicates success
//   //     if (!response.success) {
//   //       throw new Error(response.message || 'Failed to initialize payment');
//   //     }
      
//   //     // ✅ FIX: Extract the payment data
//   //     const paymentData = {
//   //       authorization_url: response.authorization_url,
//   //       reference: response.reference,
//   //       access_code: response.access_code
//   //     };
      
//   //     return paymentData;
//   //   } catch (error: any) {
//   //     console.error('❌ [BookingContext] Payment error:', error);
//   //     throw new Error(error.response?.data?.message || 'Failed to initialize payment');
//   //   }
//   // };

//   // contexts/BookingContext.tsx - Update initializePayment function
//   const initializePayment = async (bookingId: string, email: string) => {
//     try {
//       console.log('📤 [BookingContext] Initializing payment:', { bookingId, email });
//       const response = await bookingsAPI.initializePayment(bookingId, email);
//       console.log('📥 [BookingContext] Payment response:', response);
      
//       // ✅ FIX: Check if response indicates success
//       // The response should be: { authorization_url, reference, access_code }
//       if (!response) {
//         console.error('❌ [BookingContext] No payment response');
//         throw new Error('No response from payment service');
//       }
      
//       // ✅ FIX: If we have authorization_url, it's successful
//       if (response.authorization_url) {
//         console.log('✅ [BookingContext] Payment initialized successfully');
//         return response;
//       }
      
//       // If we get here, something went wrong
//       console.error('❌ [BookingContext] Missing authorization_url:', response);
//       throw new Error('Payment service did not return payment URL');
      
//     } catch (error: any) {
//       console.error('❌ [BookingContext] Payment error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
//       throw error;
//     }
//   };

//   const verifyPayment = async (reference: string) => {
//     try {
//       const response = await bookingsAPI.verifyPayment(reference);
//       // Refresh bookings after payment verification
//       await getUserBookings();
//       return response;
//     } catch (error: any) {
//       console.error('Verify payment error:', error);
//       throw new Error(error.response?.data?.message || 'Failed to verify payment');
//     }
//   };

//   const cancelBooking = async (id: string, reason: string) => {
//     try {
//       await bookingsAPI.cancelBooking(id, reason);
//       // Refresh bookings after cancellation
//       await getUserBookings();
//     } catch (error: any) {
//       console.error('Cancel booking error:', error);
//       throw new Error(error.response?.data?.message || 'Failed to cancel booking');
//     }
//   };

//   const checkAvailability = async (propertyId: string, checkIn: string, checkOut: string) => {
//     try {
//       const response = await bookingsAPI.checkAvailability(propertyId, checkIn, checkOut);
//       return response.available;
//     } catch (error: any) {
//       console.error('Check availability error:', error);
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

