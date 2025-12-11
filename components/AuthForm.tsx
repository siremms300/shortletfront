// client/components/AuthForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  type: 'login' | 'signup';
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function AuthForm({ type }: AuthFormProps) {
  const { login, register, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const isLogin = type === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        // The login function in AuthContext now handles the redirect based on role
        // No need to redirect here anymore
      } else {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        await register(formData, profileImage || undefined);
        router.push('/login?message=Registration successful. Please login.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#383a3c] to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#fcfeff] rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#383a3c]">
            {isLogin ? 'Welcome' : 'Create Account'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Profile Image - Only for Signup */}
            {!isLogin && (
              <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image (Optional)
                </label>
                <input
                  id="profileImage"
                  name="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
                />
              </div>
            )}

            {/* Name Fields - Only for Signup */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required={!isLogin}
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required={!isLogin}
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {/* Confirm Password - Only for Signup */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            )}
          </div>

          {/* Forgot Password - Only for Login */}
          {isLogin && (
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-[#f06123] hover:text-orange-600 transition duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#f06123] text-[#fcfeff] py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:ring-offset-2"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {/* Switch Auth Type */}
          <div className="text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link
                href={isLogin ? '/signup' : '/login'}
                className="text-[#f06123] hover:text-orange-600 font-semibold transition duration-200"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}































































// // client/components/AuthForm.tsx
// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';

// interface AuthFormProps {
//   type: 'login' | 'signup';
// }

// interface FormData {
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
// }

// export default function AuthForm({ type }: AuthFormProps) {
//   const { login, register } = useAuth();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [profileImage, setProfileImage] = useState<File | null>(null);

//   const [formData, setFormData] = useState<FormData>({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });

//   const isLogin = type === 'login';

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       if (isLogin) {
//         await login(formData.email, formData.password);
//         router.push('/dashboard');
//       } else {
//         // Validation
//         if (formData.password !== formData.confirmPassword) {
//           throw new Error('Passwords do not match');
//         }
//         if (formData.password.length < 6) {
//           throw new Error('Password must be at least 6 characters');
//         }

//         await register(formData, profileImage || undefined);
//         router.push('/login?message=Registration successful. Please login.');
//       }
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setProfileImage(e.target.files[0]);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#383a3c] to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8 bg-[#fcfeff] rounded-2xl shadow-2xl p-8">
//         {/* Header */}
//         <div className="text-center">
//           <h2 className="text-3xl font-bold text-[#383a3c]">
//             {isLogin ? 'Welcome Back' : 'Create Account'}
//           </h2>
//           <p className="mt-2 text-gray-600">
//             {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
//           </p>
//         </div>

//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
//             {error}
//           </div>
//         )}

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="space-y-4">
//             {/* Profile Image - Only for Signup */}
//             {!isLogin && (
//               <div>
//                 <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
//                   Profile Image (Optional)
//                 </label>
//                 <input
//                   id="profileImage"
//                   name="profileImage"
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                 />
//               </div>
//             )}

//             {/* Name Fields - Only for Signup */}
//             {!isLogin && (
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
//                     First Name *
//                   </label>
//                   <input
//                     id="firstName"
//                     name="firstName"
//                     type="text"
//                     required={!isLogin}
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                     placeholder="John"
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
//                     Last Name *
//                   </label>
//                   <input
//                     id="lastName"
//                     name="lastName"
//                     type="text"
//                     required={!isLogin}
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                     placeholder="Doe"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Email */}
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                 Email Address *
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                 placeholder="you@example.com"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                 Password *
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 required
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                 placeholder="••••••••"
//                 minLength={6}
//               />
//             </div>

//             {/* Confirm Password - Only for Signup */}
//             {!isLogin && (
//               <div>
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                   Confirm Password *
//                 </label>
//                 <input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type="password"
//                   required={!isLogin}
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                   placeholder="••••••••"
//                   minLength={6}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Forgot Password - Only for Login */}
//           {isLogin && (
//             <div className="flex items-center justify-end">
//               <Link
//                 href="/forgot-password"
//                 className="text-sm text-[#f06123] hover:text-orange-600 transition duration-200"
//               >
//                 Forgot your password?
//               </Link>
//             </div>
//           )}

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-[#f06123] text-[#fcfeff] py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:ring-offset-2"
//           >
//             {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
//           </button>

//           {/* Switch Auth Type */}
//           <div className="text-center">
//             <p className="text-gray-600">
//               {isLogin ? "Don't have an account? " : "Already have an account? "}
//               <Link
//                 href={isLogin ? '/signup' : '/login'}
//                 className="text-[#f06123] hover:text-orange-600 font-semibold transition duration-200"
//               >
//                 {isLogin ? 'Sign up' : 'Sign in'}
//               </Link>
//             </p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }





























































































// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';

// interface AuthFormProps {
//   type: 'login' | 'signup';
// }

// export default function AuthForm({ type }: AuthFormProps) {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });

//   const isLogin = type === 'login';

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log('Form submitted:', formData);
//     // Handle authentication logic here
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#383a3c] to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8 bg-[#fcfeff] rounded-2xl shadow-2xl p-8">
//         {/* Header */}
//         <div className="text-center">
//           <h2 className="text-3xl font-bold text-[#383a3c]">
//             {isLogin ? 'Welcome Back' : 'Create Account'}
//           </h2>
//           <p className="mt-2 text-gray-600">
//             {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
//           </p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="space-y-4">
//             {/* Name Fields - Only for Signup */}
//             {!isLogin && (
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
//                     First Name
//                   </label>
//                   <input
//                     id="firstName"
//                     name="firstName"
//                     type="text"
//                     required={!isLogin}
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                     placeholder="John"
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
//                     Last Name
//                   </label>
//                   <input
//                     id="lastName"
//                     name="lastName"
//                     type="text"
//                     required={!isLogin}
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                     placeholder="Doe"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Email */}
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                 Email Address
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                 placeholder="you@example.com"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                 Password
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 required
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                 placeholder="••••••••"
//               />
//             </div>

//             {/* Confirm Password - Only for Signup */}
//             {!isLogin && (
//               <div>
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                   Confirm Password
//                 </label>
//                 <input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type="password"
//                   required={!isLogin}
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent transition duration-200"
//                   placeholder="••••••••"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Forgot Password - Only for Login */}
//           {isLogin && (
//             <div className="flex items-center justify-end">
//               <Link
//                 href="/forgot-password"
//                 className="text-sm text-[#f06123] hover:text-orange-600 transition duration-200"
//               >
//                 Forgot your password?
//               </Link>
//             </div>
//           )}

//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-full bg-[#f06123] text-[#fcfeff] py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:ring-offset-2"
//           >
//             {isLogin ? 'Sign In' : 'Create Account'}
//           </button>

//           {/* Divider */}
//           <div className="relative">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-300" />
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="px-2 bg-[#fcfeff] text-gray-500">Or continue with</span>
//             </div>
//           </div>

//           {/* Google Sign In */}
//           <button
//             type="button"
//             className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:ring-offset-2"
//           >
//             <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
//               <path
//                 fill="#4285F4"
//                 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//               />
//               <path
//                 fill="#34A853"
//                 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//               />
//               <path
//                 fill="#FBBC05"
//                 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//               />
//               <path
//                 fill="#EA4335"
//                 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//               />
//             </svg>
//             Continue with Google
//           </button>

//           {/* Switch Auth Type */}
//           <div className="text-center">
//             <p className="text-gray-600">
//               {isLogin ? "Don't have an account? " : "Already have an account? "}
//               <Link
//                 href={isLogin ? '/signup' : '/login'}
//                 className="text-[#f06123] hover:text-orange-600 font-semibold transition duration-200"
//               >
//                 {isLogin ? 'Sign up' : 'Sign in'}
//               </Link>
//             </p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

