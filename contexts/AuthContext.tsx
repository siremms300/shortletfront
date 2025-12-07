// client/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImagePath?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, profileImage?: File) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // If user is admin and on login page, redirect to admin dashboard
        if (userData.role === 'admin' && window.location.pathname === '/login') {
          router.push('/admin');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      
      const { accessToken, refreshToken, user: userData } = response;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);

      // Redirect based on role after login
      if (userData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any, profileImage?: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      formData.append('firstName', userData.firstName);
      formData.append('lastName', userData.lastName);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await authAPI.register(formData);
      
      // After registration, redirect to login
      router.push('/login');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authAPI.logout(refreshToken).catch(console.error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const forgotPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword(email);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authAPI.resetPassword(token, newPassword);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};











































































// // client/contexts/AuthContext.tsx
// 'use client';

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { authAPI } from '@/lib/api';

// interface User {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   role: string;
//   profileImagePath?: string;
//   isVerified: boolean;
// }

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   register: (userData: any, profileImage?: File) => Promise<void>;
//   logout: () => void;
//   forgotPassword: (email: string) => Promise<void>;
//   resetPassword: (token: string, newPassword: string) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       const storedUser = localStorage.getItem('user');
//       const accessToken = localStorage.getItem('accessToken');

//       if (storedUser && accessToken) {
//         setUser(JSON.parse(storedUser));
//       }
//     } catch (error) {
//       console.error('Error checking auth status:', error);
//       localStorage.removeItem('user');
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const login = async (email: string, password: string) => {
//     try {
//       setIsLoading(true);
//       const response = await authAPI.login({ email, password });
      
//       const { accessToken, refreshToken, user: userData } = response;
      
//       localStorage.setItem('accessToken', accessToken);
//       localStorage.setItem('refreshToken', refreshToken);
//       localStorage.setItem('user', JSON.stringify(userData));
      
//       setUser(userData);
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Login failed');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const register = async (userData: any, profileImage?: File) => {
//     try {
//       setIsLoading(true);
//       const formData = new FormData();
      
//       formData.append('firstName', userData.firstName);
//       formData.append('lastName', userData.lastName);
//       formData.append('email', userData.email);
//       formData.append('password', userData.password);
      
//       if (profileImage) {
//         formData.append('profileImage', profileImage);
//       }

//       const response = await authAPI.register(formData);
//       return response;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Registration failed');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     const refreshToken = localStorage.getItem('refreshToken');
//     if (refreshToken) {
//       authAPI.logout(refreshToken).catch(console.error);
//     }
    
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     localStorage.removeItem('user');
//     setUser(null);
//   };

//   const forgotPassword = async (email: string) => {
//     try {
//       await authAPI.forgotPassword(email);
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Password reset request failed');
//     }
//   };

//   const resetPassword = async (token: string, newPassword: string) => {
//     try {
//       await authAPI.resetPassword(token, newPassword);
//     } catch (error: any) {
//       throw new Error(error.response?.data?.message || 'Password reset failed');
//     }
//   };

//   const value: AuthContextType = {
//     user,
//     isLoading,
//     login,
//     register,
//     logout,
//     forgotPassword,
//     resetPassword,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

