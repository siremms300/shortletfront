'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { vendorAPI } from '@/lib/api';

interface VendorProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: Array<{ url: string }>;
  vendor: {
    _id: string;
    businessName: string;
    description: string;
    rating: number;
  };
  isAvailable: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  preparationTime: number;
  tags: string[];
}

// interface VendorOrder {
//   _id: string;
//   orderNumber: string;
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone?: string;
//   };
//   vendor: {
//     _id: string;
//     businessName: string;
//     contactPerson: {
//       name: string;
//       email: string;
//       phone: string;
//     };
//   };
//   booking: {
//     _id: string;
//     property: string;
//     checkIn: string;
//     checkOut: string;
//   };
//   items: Array<{
//     product: VendorProduct;
//     quantity: number;
//     price: number;
//     specialInstructions?: string;
//   }>;
//   subtotal: number;
//   serviceFee: number;
//   deliveryFee: number;
//   totalAmount: number;
//   orderStatus: string;
//   paymentStatus: string;
//   deliveryAddress: {
//     property: string;
//     unit: string;
//     specialInstructions: string;
//   };
//   preferredDeliveryTime?: string;
//   estimatedDeliveryTime?: string;
//   actualDeliveryTime?: string;
//   createdAt: string;
// }

// Update the VendorOrder interface in contexts/VendorContext.tsx
interface VendorOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  vendor: {
    _id: string;
    businessName: string;
    contactPerson: {
      name: string;
      email: string;
      phone: string;
    };
  };
  booking: {
    _id: string;
    property: string;
    checkIn: string;
    checkOut: string;
  };
  items: Array<{
    product: VendorProduct;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryAddress: {
    property: string;
    unit: string;
    specialInstructions: string;
  };
  preferredDeliveryTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  customerNotes?: string; // Make optional
  vendorNotes?: string; // Make optional 
  createdAt: string;
  updatedAt?: string; // Add this line
}

interface CartItem {
  product: VendorProduct;
  quantity: number;
  specialInstructions?: string;
}

interface VendorContextType {
  cart: CartItem[];
  vendorOrders: VendorOrder[];
  loading: boolean;
  addToCart: (product: VendorProduct, quantity: number, specialInstructions?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number, specialInstructions?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  createVendorOrder: (orderData: any) => Promise<any>;
  initializeVendorPayment: (orderId: string, email: string) => Promise<any>;
  verifyVendorPayment: (reference: string) => Promise<any>;
  getUserVendorOrders: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

interface VendorProviderProps {
  children: ReactNode;
}

export const VendorProvider: React.FC<VendorProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // Cart management functions
  const addToCart = (product: VendorProduct, quantity: number, specialInstructions?: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      
      if (existingItem) {
        // Update existing item
        return prevCart.map(item =>
          item.product._id === product._id
            ? { 
                ...item, 
                quantity: Math.min(quantity, product.maxOrderQuantity),
                specialInstructions: specialInstructions || item.specialInstructions 
              }
            : item
        );
      } else {
        // Add new item
        return [...prevCart, { product, quantity, specialInstructions }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const updateCartItem = (productId: string, quantity: number, specialInstructions?: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId
          ? { ...item, quantity, specialInstructions }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Order management functions
//   const createVendorOrder = async (orderData: any) => {
//     try {
//       setLoading(true);
//       const response = await vendorAPI.createOrder(orderData);
//       return response;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to create order');
//     } finally {
//       setLoading(false);
//     }
//   };

  // In your VendorContext.tsx - Fix createVendorOrder function
    const createVendorOrder = async (orderData: any) => {
    try {
        setLoading(true);
        console.log('Creating vendor order with data:', orderData);
        
        const response = await vendorAPI.createOrder(orderData);
        
        // Check if response indicates success
        if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
        }
        
        console.log('Order created successfully:', response.order);
        return response;
    } catch (error: any) {
        console.error('Create vendor order error details:', error);
        
        // Provide more specific error messages
        if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.join(', ');
        throw new Error(`Order validation failed: ${errorMessages}`);
        }
        
        throw new Error(error.response?.data?.message || error.message || 'Failed to create order');
    } finally {
        setLoading(false);
    }
    };

  const initializeVendorPayment = async (orderId: string, email: string) => {
    try {
      const response = await vendorAPI.initializeVendorPayment(orderId, email);
      return response.paymentData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

//   const verifyVendorPayment = async (reference: string) => {
//     try {
//       const response = await vendorAPI.verifyVendorPayment(reference);
//       return response;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Payment verification failed');
//     }
//   };
 



// In your VendorContext.tsx - Updated verifyVendorPayment function
    // const verifyVendorPayment = async (reference: string) => {
    // try {
    //     console.log('Verifying vendor payment with reference:', reference);
    //     const response = await vendorAPI.verifyVendorPayment(reference);
        
    //     if (!response.success) {
    //     throw new Error(response.message || 'Payment verification failed');
    //     }
        
    //     return response;
    // } catch (error: any) {
    //     console.error('Vendor payment verification error:', error);
        
    //     // Handle 404 specifically
    //     if (error.response?.status === 404) {
    //     throw new Error('Vendor payment verification endpoint not found. Please contact support.');
    //     }
        
    //     // Handle other errors
    //     if (error.response?.data?.message) {
    //     throw new Error(error.response.data.message);
    //     }
        
    //     throw new Error(error.message || 'Payment verification failed');
    // }
    // };

    // In your VendorContext.tsx - Updated verifyVendorPayment function
    // const verifyVendorPayment = async (reference: string) => {
    // try {
    //     console.log('Verifying vendor payment with reference:', reference);
    //     const response = await vendorAPI.verifyVendorPayment(reference);
        
    //     if (!response.success) {
    //     throw new Error(response.message || 'Payment verification failed');
    //     }
        
    //     return response;
    // } catch (error: any) {
    //     console.error('Vendor payment verification error:', error);
        
    //     // Handle 404 specifically
    //     if (error.response?.status === 404) {
    //     throw new Error('Vendor payment verification endpoint not found. Please contact support.');
    //     }
        
    //     // Handle other errors
    //     if (error.response?.data?.message) {
    //     throw new Error(error.response.data.message);
    //     }
        
    //     throw new Error(error.message || 'Payment verification failed');
    // }
    // };

    // In your VendorContext.tsx - FIXED verifyVendorPayment function
    const verifyVendorPayment = async (reference: string) => {
    try {
        console.log('Verifying vendor payment with reference:', reference);
        const response = await vendorAPI.verifyVendorPayment(reference);
        
        console.log('Vendor payment verification response:', response);
        
        // Check if response indicates success - FIXED LOGIC
        if (response.success) {
        // Success case - return the response, don't throw error
        return response;
        } else {
        // Failure case - throw error
        throw new Error(response.message || 'Payment verification failed');
        }
        
    } catch (error: any) {
        console.error('Vendor payment verification error:', error);
        
        // Handle 404 specifically
        if (error.response?.status === 404) {
        throw new Error('Vendor payment verification endpoint not found. Please contact support.');
        }
        
        // Handle other errors
        if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
        }
        
        throw new Error(error.message || 'Payment verification failed');
    }
    };

//   const getUserVendorOrders = async () => {
//     try {
//       setLoading(true);
//       const response = await vendorAPI.getUserVendorOrders();
//       setVendorOrders(response.orders || []);
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Failed to fetch orders');
//     } finally {
//       setLoading(false);
//     }
//   };

  // In your VendorContext.tsx - Update getUserVendorOrders function
    const getUserVendorOrders = async () => {
    try {
        setLoading(true);
        const response = await vendorAPI.getUserVendorOrders();
        console.log('Vendor orders response:', response); // Debug log
        console.log('First order items:', response.orders?.[0]?.items); // Debug log
        setVendorOrders(response.orders || []);
    } catch (error: any) {
        console.error('Failed to fetch vendor orders:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
        setLoading(false);
    }
    };

    // Add this to your VendorContext for debugging
    const debugOrderData = () => {
    console.log('=== VENDOR ORDERS DEBUG ===');
    vendorOrders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, order.orderNumber);
        console.log('Items:', order.items);
        order.items.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}:`, {
            product: item.product,
            productType: typeof item.product,
            hasName: !!item.product?.name,
            name: item.product?.name
        });
        });
    });
    console.log('=== END DEBUG ===');
    };
 

  const value: VendorContextType = {
    cart,
    vendorOrders,
    loading,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal,
    getCartItemCount,
    createVendorOrder,
    initializeVendorPayment,
    verifyVendorPayment,
    getUserVendorOrders,
    // debugOrderData
  };

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
};

