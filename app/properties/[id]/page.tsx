// app/properties/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { propertiesAPI } from '@/lib/api';
import PropertyDetails from '@/components/PropertyDetails';
// import LoadingSpinner from '@/components/LoadingSpinner';

export default function PropertyPage() {
  const params = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Safely extract ID from params
  const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    console.log('🔍 [Property Page] Received property ID:', propertyId);
    console.log('🔍 [Property Page] Params object:', params);

    if (!propertyId || propertyId === 'undefined') {
      console.error('❌ [Property Page] Invalid property ID:', propertyId);
      setError('Invalid property ID');
      setLoading(false);
      return;
    }

    fetchProperty();
  }, [propertyId]);

  // const fetchProperty = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');
      
  //     console.log('📡 [Property Page] Fetching property with ID:', propertyId);
      
  //     const data = await propertiesAPI.getPropertyById(propertyId);
  //     console.log('✅ [Property Page] Property fetched:', data);
      
  //     setProperty(data);
  //   } catch (error: any) {
  //     console.error('💥 [Property Page] Error fetching property:', error);
  //     console.error('💥 [Property Page] Error message:', error.message);
  //     setError(error.message || 'Failed to load property');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Ensure propertyId is not undefined
      if (!propertyId) {
        throw new Error('Invalid property ID');
      }
      
      console.log('📡 [Property Page] Fetching property with ID:', propertyId);
      
      const data = await propertiesAPI.getPropertyById(propertyId);
      console.log('✅ [Property Page] Property fetched:', data);
      
      setProperty(data);
    } catch (error: any) {
      console.error('💥 [Property Page] Error fetching property:', error);
      console.error('💥 [Property Page] Error message:', error.message);
      setError(error.message || 'Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // return <LoadingSpinner message="Loading property..." />;
    return <p>Loading...</p>;
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#383a3c] mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The property you are looking for does not exist or has been removed.'}
          </p>
          <div className="space-y-3">
            <a
              href="/properties"
              className="w-full bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 block"
            >
              Browse Properties
            </a>
            <button
              onClick={fetchProperty}
              className="w-full border border-[#383a3c] text-[#383a3c] py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PropertyDetails property={property} />;
}























































// // app/properties/[id]/page.tsx - Debug version
// import { propertiesAPI } from '@/lib/api';
// import PropertyDetails from "@/components/PropertyDetails";
// import { notFound } from 'next/navigation';

// interface PageProps {
//   params: Promise<{
//     id: string;
//   }>;
// }

// export default async function PropertyPage({ params }: PageProps) {
//   console.log('🔍 [Property Page] Starting...');
//   console.log('🔍 [Property Page] Params object:', params);
  
//   try {
//     // Let's see what happens when we await params
//     console.log('🔍 [Property Page] About to await params...');
//     const resolvedParams = await params;
//     console.log('🔍 [Property Page] Resolved params:', resolvedParams);
    
//     const propertyId = resolvedParams.id;
//     console.log('🔍 [Property Page] Property ID from params:', propertyId);
//     console.log('🔍 [Property Page] Property ID type:', typeof propertyId);

//     if (!propertyId) {
//       console.error('❌ [Property Page] Property ID is falsy:', propertyId);
//       notFound();
//     }

//     if (propertyId === 'undefined') {
//       console.error('❌ [Property Page] Property ID is string "undefined"');
//       notFound();
//     }

//     const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(propertyId);
//     console.log('🔍 [Property Page] Is valid ObjectId:', isValidObjectId);
    
//     if (!isValidObjectId) {
//       console.error('❌ [Property Page] Invalid ObjectId format:', propertyId);
//       notFound();
//     }

//     console.log('✅ [Property Page] All validations passed, fetching property...');
    
//     const propertyData = await propertiesAPI.getPropertyById(propertyId);
//     console.log('🔍 [Property Page] API response received:', !!propertyData);
    
//     if (!propertyData) {
//       console.error('❌ [Property Page] No property data returned from API');
//       notFound();
//     }

//     if (propertyData.status !== 'active') {
//       console.error('❌ [Property Page] Property is not active:', propertyData.status);
//       notFound();
//     }

//     console.log('✅ [Property Page] Rendering PropertyDetails component');
//     return <PropertyDetails property={propertyData} />;

//   } catch (error: any) {
//     console.error('💥 [Property Page] Caught error:', error);
//     console.error('💥 [Property Page] Error name:', error.name);
//     console.error('💥 [Property Page] Error message:', error.message);
//     console.error('💥 [Property Page] Error stack:', error.stack);
//     notFound();
//   }
// }









































// // app/properties/[id]/page.tsx
// import { propertiesAPI } from '@/lib/api';
// import PropertyDetails from "@/components/PropertyDetails";
// import { notFound } from 'next/navigation';

// interface PageProps {
//   params: Promise<{
//     id: string;
//   }>;
// }

// export default async function PropertyPage({ params }: PageProps) {
//   try {
//     // CORRECT WAY: Await the params first, then access the id
//     const resolvedParams = await params;
//     const propertyId = resolvedParams.id;
    
//     console.log('🔍 [Property Page] Received property ID:', propertyId);
//     console.log('🔍 [Property Page] Params type:', typeof resolvedParams);
//     console.log('🔍 [Property Page] Full params:', resolvedParams);

//     // Validate the property ID
//     if (!propertyId || propertyId === 'undefined') {
//       console.error('❌ [Property Page] Invalid property ID:', propertyId);
//       notFound();
//     }

//     // Validate if it's a valid MongoDB ObjectId format (24 character hex string)
//     const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(propertyId);
//     if (!isValidObjectId) {
//       console.error('❌ [Property Page] Invalid ObjectId format:', propertyId);
//       notFound();
//     }

//     console.log('✅ [Property Page] ID validation passed, fetching property...');
    
//     const propertyData = await propertiesAPI.getPropertyById(propertyId);
    
//     // Check if property exists and is active
//     if (!propertyData || propertyData.status !== 'active') {
//       console.log('❌ [Property Page] Property not available or inactive:', propertyId);
//       notFound();
//     }

//     console.log('✅ [Property Page] Property loaded successfully:', propertyData.title);
    
//     return <PropertyDetails property={propertyData} />;

//   } catch (error: any) {
//     console.error('💥 [Property Page] Error fetching property:', error);
//     console.error('💥 [Property Page] Error message:', error.message);
    
//     // Handle specific error cases
//     if (error.message.includes('Property not found') || 
//         error.message.includes('Invalid property') ||
//         error.message.includes('Property ID is required')) {
//       console.error('❌ [Property Page] Property not found or invalid');
//       notFound();
//     }
    
//     // Show a more helpful error page for server errors
//     if (error.message.includes('Server error')) {
//       return (
//         <div className="max-w-7xl mx-auto px-4 py-8">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Temporary Server Issue</h1>
//             <p className="text-gray-600 mb-6">
//               We're experiencing temporary issues loading this property. Please try again in a moment.
//             </p>
//             <div className="space-y-3">
//               <button 
//                 onClick={() => window.location.reload()}
//                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//               >
//                 Try Again
//               </button>
//               <a 
//                 href="/"
//                 className="block border border-[#383a3c] text-[#383a3c] px-6 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
//               >
//                 Back to Home
//               </a>
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     notFound();
//   }
// }




































// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@




// // app/properties/[id]/page.tsx
// import { propertiesAPI } from '@/lib/api';
// import PropertyDetails from "@/components/PropertyDetails";
// import { notFound } from 'next/navigation';

// interface PageProps {
//   params: {
//     id: string;
//   };
// }

// export default async function PropertyPage({ params }: PageProps) {
//   try {
//     // Safely extract the property ID
//     const propertyId = (await params).id;
    
//     console.log('🔍 [Property Page] Received property ID:', propertyId);

//     // Validate the property ID
//     if (!propertyId || propertyId === 'undefined') {
//       console.error('❌ [Property Page] Invalid property ID:', propertyId);
//       notFound();
//     }

//     // Validate if it's a valid MongoDB ObjectId format (24 character hex string)
//     const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(propertyId);
//     if (!isValidObjectId) {
//       console.error('❌ [Property Page] Invalid ObjectId format:', propertyId);
//       notFound();
//     }

//     console.log('✅ [Property Page] ID validation passed, fetching property...');
    
//     const propertyData = await propertiesAPI.getPropertyById(propertyId);
    
//     // Check if property exists and is active
//     if (!propertyData || propertyData.status !== 'active') {
//       console.log('❌ [Property Page] Property not available or inactive:', propertyId);
//       notFound();
//     }

//     console.log('✅ [Property Page] Property loaded successfully:', propertyData.title);
    
//     return <PropertyDetails property={propertyData} />;

//   } catch (error: any) {
//     console.error('💥 [Property Page] Error fetching property:', error);
//     console.error('💥 [Property Page] Error message:', error.message);
    
//     // Handle specific error cases
//     if (error.message.includes('Property not found') || 
//         error.message.includes('Invalid property') ||
//         error.message.includes('Property ID is required')) {
//       console.error('❌ [Property Page] Property not found or invalid');
//       notFound();
//     }
    
//     // Show a more helpful error page for server errors
//     if (error.message.includes('Server error')) {
//       return (
//         <div className="max-w-7xl mx-auto px-4 py-8">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Temporary Server Issue</h1>
//             <p className="text-gray-600 mb-6">
//               We're experiencing temporary issues loading this property. Please try again in a moment.
//             </p>
//             <div className="space-y-3">
//               <button 
//                 onClick={() => window.location.reload()}
//                 className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//               >
//                 Try Again
//               </button>
//               <a 
//                 href="/"
//                 className="block border border-[#383a3c] text-[#383a3c] px-6 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
//               >
//                 Back to Home
//               </a>
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     notFound();
//   }
// }





























// // // // app/properties/[id]/page.tsx
// // // import { propertiesAPI } from '@/lib/api';
// // // import PropertyDetails from "@/components/PropertyDetails";
// // // import { notFound } from 'next/navigation';

// // // interface PageProps {
// // //   params: {
// // //     id: string;
// // //   };
// // // }

// // // export default async function PropertyPage({ params }: PageProps) {
// // //   try {
// // //     // Safely extract the property ID
// // //     const propertyId = (await params).id;
    
// // //     // Validate the property ID
// // //     if (!propertyId || propertyId === 'undefined') {
// // //       console.error('Invalid property ID:', propertyId);
// // //       notFound();
// // //     }

// // //     // Validate if it's a valid MongoDB ObjectId format (24 character hex string)
// // //     const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(propertyId);
// // //     if (!isValidObjectId) {
// // //       console.error('Invalid ObjectId format:', propertyId);
// // //       notFound();
// // //     }

// // //     console.log('Fetching property with ID:', propertyId);
    
// // //     const propertyData = await propertiesAPI.getPropertyById(propertyId);
    
// // //     // Check if property exists and is active
// // //     if (!propertyData || propertyData.status !== 'active') {
// // //       console.log('Property not available or inactive:', propertyId);
// // //       notFound();
// // //     }
    
// // //     return <PropertyDetails property={propertyData} />;
// // //   } catch (error: any) {
// // //     console.error('Error fetching property:', error);
    
// // //     // Handle specific error cases
// // //     if (error.response?.status === 400) {
// // //       console.error('Invalid property ID format');
// // //       notFound();
// // //     }
    
// // //     if (error.response?.status === 404) {
// // //       console.error('Property not found');
// // //       notFound();
// // //     }
    
// // //     notFound();
// // //   }
// // // }

































// // // // import { propertiesAPI } from '@/lib/api';
// // // // import PropertyDetails from "@/components/PropertyDetails";

// // // // interface PageProps {
// // // //   params: {
// // // //     id: string;
// // // //   };
// // // // }

// // // // export default async function PropertyPage({ params }: PageProps) {
// // // //   try {
// // // //     const propertyId = (await params).id;
// // // //     const propertyData = await propertiesAPI.getPropertyById(propertyId);
    
// // // //     // Check if property exists and is active
// // // //     if (!propertyData || propertyData.status !== 'active') {
// // // //       return (
// // // //         <div className="max-w-7xl mx-auto px-4 py-8">
// // // //           <div className="text-center">
// // // //             <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Property Not Available</h1>
// // // //             <p className="text-gray-600 mb-6">This property is not available or has been removed.</p>
// // // //             <a 
// // // //               href="/"
// // // //               className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // // //             >
// // // //               Back to Home
// // // //             </a>
// // // //           </div>
// // // //         </div>
// // // //       );
// // // //     }
    
// // // //     return <PropertyDetails property={propertyData} />;
// // // //   } catch (error) {
// // // //     console.error('Error fetching property:', error);
    
// // // //     return (
// // // //       <div className="max-w-7xl mx-auto px-4 py-8">
// // // //         <div className="text-center">
// // // //           <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Property Not Found</h1>
// // // //           <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or is no longer available.</p>
// // // //           <a 
// // // //             href="/"
// // // //             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // // //           >
// // // //             Back to Home
// // // //           </a>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }
// // // // }










































// // // // import { propertiesAPI } from '@/lib/api';
// // // // import PropertyDetails from "@/components/PropertyDetails";

// // // // interface PageProps {
// // // //   params: {
// // // //     id: string;
// // // //   };
// // // // }

// // // // export default async function PropertyPage({ params }: PageProps) {
// // // //   try {
// // // //     const propertyId = (await params).id;
// // // //     const propertyData = await propertiesAPI.getPropertyById(propertyId);
    
// // // //     // Check if property exists and is active
// // // //     if (!propertyData || propertyData.status !== 'active') {
// // // //       return (
// // // //         <div className="max-w-7xl mx-auto px-4 py-8">
// // // //           <div className="text-center">
// // // //             <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Property Not Available</h1>
// // // //             <p className="text-gray-600 mb-6">This property is not available or has been removed.</p>
// // // //             <a 
// // // //               href="/"
// // // //               className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // // //             >
// // // //               Back to Home
// // // //             </a>
// // // //           </div>
// // // //         </div>
// // // //       );
// // // //     }
    
// // // //     return <PropertyDetails property={propertyData} />;
// // // //   } catch (error) {
// // // //     console.error('Error fetching property:', error);
    
// // // //     return (
// // // //       <div className="max-w-7xl mx-auto px-4 py-8">
// // // //         <div className="text-center">
// // // //           <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Property Not Found</h1>
// // // //           <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or is no longer available.</p>
// // // //           <a 
// // // //             href="/"
// // // //             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // // //           >
// // // //             Back to Home
// // // //           </a>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }
// // // // }
























































// // // // import { propertiesAPI } from '@/lib/api';
// // // // import PropertyDetails from "@/components/PropertyDetails";

// // // // interface PageProps {
// // // //   params: {
// // // //     id: string;
// // // //   };
// // // // }

// // // // export default async function PropertyPage({ params }: PageProps) {
// // // //   try {
// // // //     const propertyId = (await params).id;
// // // //     const propertyData = await propertiesAPI.getPropertyById(propertyId);
    
// // // //     return <PropertyDetails property={propertyData} />;
// // // //   } catch (error) {
// // // //     console.error('Error fetching property:', error);
    
// // // //     // Return error page or redirect
// // // //     return (
// // // //       <div className="max-w-7xl mx-auto px-4 py-8">
// // // //         <div className="text-center">
// // // //           <h1 className="text-2xl font-bold text-[#383a3c] mb-4">Property Not Found</h1>
// // // //           <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or is no longer available.</p>
// // // //           <a 
// // // //             href="/"
// // // //             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
// // // //           >
// // // //             Back to Home
// // // //           </a>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }
// // // // }


























































// // // // import PropertyDetails from "@/components/PropertyDetails";


// // // // // This would typically fetch from your API
// // // // const sampleProperty = {
// // // //   id: 1,
// // // //   title: "Luxury Apartment in City Center",
// // // //   location: "Lagos, Nigeria",
// // // //   price: 120,
// // // //   images: [
// // // //     "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
// // // //     "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
// // // //     "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
// // // //     "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
// // // //   ],
// // // //   rating: 4.8,
// // // //   reviews: 128,
// // // //   description: "This luxurious apartment in the heart of the city offers stunning views, modern amenities, and easy access to all major attractions. Perfect for both short stays and extended visits.",
// // // //   host: {
// // // //     name: "Sarah Johnson",
// // // //     joined: "2022",
// // // //     rating: 4.9,
// // // //     properties: 12,
// // // //     image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
// // // //   },
// // // //   amenities: [
// // // //     "WiFi",
// // // //     "Air Conditioning",
// // // //     "Kitchen",
// // // //     "Swimming Pool",
// // // //     "Gym", 
// // // //     "Free Parking",
// // // //     "Security",
// // // //     "Elevator"
// // // //   ],
// // // //   specs: {
// // // //     guests: 4,
// // // //     bedrooms: 2,
// // // //     beds: 2,
// // // //     bathrooms: 2
// // // //   },
// // // //   rules: [
// // // //     "No smoking",
// // // //     "No pets",
// // // //     "No parties or events",
// // // //     "Check-in after 2:00 PM",
// // // //     "Check-out before 11:00 AM"
// // // //   ]
// // // // };

// // // // interface PageProps {
// // // //   params: {
// // // //     id: string;
// // // //   };
// // // // }

// // // // export default function PropertyPage({ params }: PageProps) {
// // // //   return <PropertyDetails property={sampleProperty} />;
// // // // }

