'use client';

import { useState } from 'react';
import Link from 'next/link';

interface WishlistProperty {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  addedDate: string;
}

export default function WishlistGrid() {
  const [wishlist, setWishlist] = useState<WishlistProperty[]>([
    {
      id: 1,
      title: "Luxury Apartment in City Center",
      location: "Victoria Island, Lagos",
      price: 120,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      rating: 4.8,
      reviews: 128,
      addedDate: "2024-01-10"
    },
    {
      id: 2,
      title: "Beachfront Villa",
      location: "Lekki, Lagos",
      price: 200,
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400",
      rating: 4.9,
      reviews: 89,
      addedDate: "2024-01-08"
    },
    {
      id: 3,
      title: "Modern Penthouse",
      location: "Ikoyi, Lagos",
      price: 180,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
      rating: 4.7,
      reviews: 92,
      addedDate: "2024-01-05"
    },
    {
      id: 4,
      title: "Garden Cottage",
      location: "Surulere, Lagos",
      price: 65,
      image: "https://images.unsplash.com/photo-1575517111832-11a84da50959?w=400",
      rating: 4.6,
      reviews: 45,
      addedDate: "2024-01-02"
    },
    {
      id: 5,
      title: "Executive Serviced Apartment",
      location: "Yaba, Lagos",
      price: 95,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
      rating: 4.4,
      reviews: 78,
      addedDate: "2023-12-28"
    },
    {
      id: 6,
      title: "Luxury Studio with Pool",
      location: "Ikeja, Lagos",
      price: 85,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
      rating: 4.5,
      reviews: 67,
      addedDate: "2023-12-25"
    }
  ]);

  const removeFromWishlist = (propertyId: number) => {
    setWishlist(prev => prev.filter(property => property.id !== propertyId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl">
      {/* Wishlist Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#383a3c]">
              {wishlist.length} Saved Properties
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {wishlist.length > 0 
                ? "Your dream properties waiting to be booked"
                : "Start saving properties you love"
              }
            </p>
          </div>
          
          {wishlist.length > 0 && (
            <Link
              href="/propertylist"
              className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
            >
              Find More Properties
            </Link>
          )}
        </div>
      </div>

      {/* Wishlist Grid */}
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-200"
            >
              <div className="relative">
                <Link href={`/properties/${property.id}`}>
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-48 object-cover cursor-pointer"
                  />
                </Link>
                
                {/* Remove from wishlist button */}
                <button
                  onClick={() => removeFromWishlist(property.id)}
                  className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition duration-200"
                  title="Remove from wishlist"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Price */}
                <div className="absolute top-3 left-3 bg-[#f06123] text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  ${property.price}/night
                </div>
              </div>

              <div className="p-4">
                <Link
                  href={`/properties/${property.id}`}
                  className="font-semibold text-[#383a3c] hover:text-[#f06123] transition duration-200 line-clamp-1"
                >
                  {property.title}
                </Link>
                
                <p className="text-gray-600 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {property.location}
                </p>

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-semibold text-[#383a3c]">{property.rating}</span>
                    <span className="ml-1 text-gray-600 text-sm">({property.reviews})</span>
                  </div>
                  
                  <span className="text-gray-500 text-xs">
                    Added {formatDate(property.addedDate)}
                  </span>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Link
                    href={`/properties/${property.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-center hover:bg-gray-200 transition duration-200 text-sm"
                  >
                    View Details
                  </Link>
                  <button className="flex-1 bg-[#f06123] text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-sm">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Wishlist State */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-2xl font-semibold text-gray-600 mb-4">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start exploring beautiful properties and save your favorites for later. 
            Your wishlist is the perfect place to keep track of properties you love.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/properties"
              className="bg-[#f06123] text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 inline-block"
            >
              Browse Properties
            </Link>
            <Link
              href="/"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {/* Wishlist Tips */}
      {wishlist.length > 0 && (
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200 mt-8">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            Wishlist Tips
          </h3>
          <ul className="text-purple-800 text-sm space-y-1 list-disc list-inside">
            <li>Properties in high demand get booked quickly - don't wait too long!</li>
            <li>Use price alerts to get notified when prices drop</li>
            <li>Compare similar properties to find the best value</li>
            <li>Read reviews from previous guests before booking</li>
          </ul>
        </div>
      )}
    </div>
  );
}