// components/PropertyCard.tsx - Updated version
import Link from 'next/link';

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  type?: string;
  reviews?: number;
}

export default function PropertyCard({ 
  id,
  title, 
  location, 
  price, 
  image, 
  rating,
  bedrooms,
  bathrooms,
  maxGuests,
  type,
  reviews = 0
}: PropertyCardProps) {
  // Add validation for all props
  const isValid = id && id !== 'undefined' && title && price && image;
  
  if (!isValid) {
    console.error('PropertyCard: Invalid props:', { id, title, price, image });
    return (
      <div className="bg-[#fcfeff] rounded-lg shadow-md overflow-hidden border border-gray-200 p-4">
        <p className="text-red-500 text-sm">Invalid property data</p>
      </div>
    );
  }

  // Ensure image is a valid URL
  const imageUrl = image.startsWith('http') || image.startsWith('/') 
    ? image 
    : `/uploads/properties/${image}`;

  return (
    <Link href={`/properties/${id}`} className="block h-full">
      <div className="bg-[#fcfeff] rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-200 cursor-pointer transform hover:-translate-y-1 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 md:h-56 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-property.jpg';
            }}
          />
          <div className="absolute top-4 left-4 bg-[#f06123] text-white px-2 py-1 rounded text-xs font-semibold">
            {type || 'Property'}
          </div>
          <div className="absolute top-4 right-4 bg-white text-[#383a3c] px-2 py-1 rounded-lg text-sm font-semibold shadow-sm">
            ${price}<span className="text-xs font-normal">/night</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-[#383a3c] mb-2 line-clamp-1">
            {title}
          </h3>
          
          <div className="flex items-center text-gray-600 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{location}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-[#f06123]' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-gray-600 text-sm">
              {rating.toFixed(1)} ({reviews} review{reviews !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {bedrooms !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold text-[#383a3c]">{bedrooms}</div>
                <div className="text-xs text-gray-500">Bedrooms</div>
              </div>
            )}
            {bathrooms !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold text-[#383a3c]">{bathrooms}</div>
                <div className="text-xs text-gray-500">Bathrooms</div>
              </div>
            )}
            {maxGuests !== undefined && (
              <div className="text-center">
                <div className="text-lg font-semibold text-[#383a3c]">{maxGuests}</div>
                <div className="text-xs text-gray-500">Max Guests</div>
              </div>
            )}
          </div>

          {/* View Details Button */}
          <button className="w-full mt-4 bg-[#f06123] text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-sm">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}



































































// import Link from 'next/link';

// interface PropertyCardProps {
//   id: string;
//   title: string;
//   location: string;
//   price: number;
//   image: string;
//   rating: number;
//   bedrooms?: number;
//   bathrooms?: number;
//   maxGuests?: number;
//   type?: string;
//   reviews?: number;
// }

// export default function PropertyCard({ 
//   id,
//   title, 
//   location, 
//   price, 
//   image, 
//   rating,
//   bedrooms,
//   bathrooms,
//   maxGuests,
//   type,
//   reviews = 0
// }: PropertyCardProps) {
//   // Add validation for ID
//   if (!id || id === 'undefined') {
//     console.error('PropertyCard: Invalid ID:', id);
//     return (
//       <div className="bg-[#fcfeff] rounded-lg shadow-md overflow-hidden border border-gray-200 p-4">
//         <p className="text-red-500">Invalid property data</p>
//       </div>
//     );
//   }

//   return (
//     <Link href={`/properties/${id}`}>
//       {/* Rest of your component remains the same */}
//       <div className="bg-[#fcfeff] rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-200 cursor-pointer transform hover:-translate-y-1">
//         {/* ... rest of your JSX ... */}
//       </div>
//     </Link>
//   );
// }








































// // import Link from 'next/link';

// // interface PropertyCardProps {
// //   id: string;
// //   title: string;
// //   location: string;
// //   price: number;
// //   image: string;
// //   rating: number;
// //   bedrooms?: number;
// //   bathrooms?: number;
// //   maxGuests?: number;
// //   type?: string;
// //   reviews?: number;
// // }

// // export default function PropertyCard({ 
// //   id,
// //   title, 
// //   location, 
// //   price, 
// //   image, 
// //   rating,
// //   bedrooms,
// //   bathrooms,
// //   maxGuests,
// //   type,
// //   reviews = 0
// // }: PropertyCardProps) {
// //   return (
// //     <Link href={`/properties/${id}`}>
// //       <div className="bg-[#fcfeff] rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-200 cursor-pointer transform hover:-translate-y-1">
// //         <div className="relative">
// //           <img 
// //             src={image} 
// //             alt={title}
// //             className="w-full h-48 object-cover"
// //           />
// //           <div className="absolute top-3 right-3 bg-[#f06123] text-white px-2 py-1 rounded-lg text-sm font-semibold">
// //             ${price}/night
// //           </div>
// //           {type && (
// //             <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs font-medium capitalize">
// //               {type}
// //             </div>
// //           )}
// //         </div>
        
// //         <div className="p-4">
// //           <h3 className="font-semibold text-lg mb-2 text-[#383a3c] line-clamp-1">{title}</h3>
// //           <p className="text-gray-600 text-sm mb-3 flex items-center">
// //             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// //             </svg>
// //             {location}
// //           </p>
          
// //           {/* Property Details */}
// //           {(bedrooms !== undefined || bathrooms !== undefined || maxGuests !== undefined) && (
// //             <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
// //               {bedrooms !== undefined && (
// //                 <span className="flex items-center">
// //                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
// //                   </svg>
// //                   {bedrooms} bed{bedrooms !== 1 ? 's' : ''}
// //                 </span>
// //               )}
// //               {bathrooms !== undefined && (
// //                 <span className="flex items-center">
// //                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                   </svg>
// //                   {bathrooms} bath{bathrooms !== 1 ? 's' : ''}
// //                 </span>
// //               )}
// //               {maxGuests !== undefined && (
// //                 <span className="flex items-center">
// //                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
// //                   </svg>
// //                   {maxGuests} guest{maxGuests !== 1 ? 's' : ''}
// //                 </span>
// //               )}
// //             </div>
// //           )}
          
// //           <div className="flex justify-between items-center">
// //             <div className="flex items-center">
// //               <span className="text-yellow-500">★</span>
// //               <span className="ml-1 font-semibold text-[#383a3c]">{rating}</span>
// //               {reviews > 0 && (
// //                 <span className="ml-1 text-gray-600 text-sm">({reviews})</span>
// //               )}
// //             </div>
// //             <button className="bg-[#f06123] text-[#fcfeff] px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200 font-semibold text-sm">
// //               View Details
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </Link>
// //   );
// // }






























































// // // import Link from 'next/link';

// // // interface PropertyCardProps {
// // //   id: number;
// // //   title: string;
// // //   location: string;
// // //   price: number;
// // //   image: string;
// // //   rating: number;
// // //   reviews?: number;
// // // }

// // // export default function PropertyCard({ 
// // //   id,
// // //   title, 
// // //   location, 
// // //   price, 
// // //   image, 
// // //   rating,
// // //   reviews = 0
// // // }: PropertyCardProps) {
// // //   return (
// // //     <Link href={`/properties/${id}`}>
// // //       <div className="bg-[#fcfeff] rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-200 cursor-pointer transform hover:-translate-y-1">
// // //         <div className="relative">
// // //           <img 
// // //             src={image} 
// // //             alt={title}
// // //             className="w-full h-48 object-cover"
// // //           />
// // //           <div className="absolute top-3 right-3 bg-[#f06123] text-white px-2 py-1 rounded-lg text-sm font-semibold">
// // //             ${price}/night
// // //           </div>
// // //         </div>
// // //         <div className="p-4">
// // //           <h3 className="font-semibold text-lg mb-2 text-[#383a3c] line-clamp-1">{title}</h3>
// // //           <p className="text-gray-600 text-sm mb-2 flex items-center">
// // //             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// // //             </svg>
// // //             {location}
// // //           </p>
// // //           <div className="flex justify-between items-center mb-3">
// // //             <div className="flex items-center">
// // //               <span className="text-yellow-500">★</span>
// // //               <span className="ml-1 font-semibold text-[#383a3c]">{rating}</span>
// // //               {reviews > 0 && (
// // //                 <span className="ml-1 text-gray-600 text-sm">({reviews})</span>
// // //               )}
// // //             </div>
// // //           </div>
// // //           <button className="w-full bg-[#f06123] text-[#fcfeff] py-2 rounded-lg hover:bg-orange-600 transition duration-200 font-semibold">
// // //             View Details
// // //           </button>
// // //         </div>
// // //       </div>
// // //     </Link>
// // //   );
// // // }
