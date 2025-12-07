'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useRouter } from 'next/navigation';
import ReviewsSection from './ReviewsSection';

interface Amenity {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  price: number;
  images: Array<{
    url: string;
    isMain: boolean;
    order: number;
  }>;
  rating: number;
  totalBookings: number;
  description: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImagePath?: string;
    joined?: string;
    rating?: number;
    properties?: number;
  };
  amenities: Amenity[];
  specifications: {
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
  };
  type: string;
  status: string;
}

interface Review {
  id: number;
  user: {
    name: string;
    image: string;
  };
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

interface PropertyDetailsProps {
  property: Property;
}

// Sample reviews data
const sampleReviews: Review[] = [
  {
    id: 1,
    user: {
      name: "Michael Chen",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
    },
    rating: 5,
    comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
    date: "2024-01-15",
    helpful: 12
  },
  {
    id: 2,
    user: {
      name: "Sarah Williams",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
    },
    rating: 4,
    comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
    date: "2024-01-10",
    helpful: 8
  },
  {
    id: 3,
    user: {
      name: "David Johnson",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    rating: 5,
    comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
    date: "2024-01-05",
    helpful: 15
  }
];

// Default house rules
const defaultRules = [
  "No smoking",
  "No pets",
  "No parties or events",
  "Check-in after 2:00 PM",
  "Check-out before 11:00 AM"
];

// Payment Method Modal Component
const PaymentMethodModal = ({ 
  isOpen, 
  onClose, 
  onSelectMethod 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'paystack' | 'bank_transfer' | 'onsite') => void;
}) => {
  const [showBankDetails, setShowBankDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#383a3c]">Select Payment Method</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Pay Online (Paystack) */}
          <button
            onClick={() => onSelectMethod('paystack')}
            className="w-full border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg">💳</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#383a3c]">Pay Online</h4>
                <p className="text-gray-600 text-sm">Pay instantly with card or bank transfer via Paystack</p>
              </div>
            </div>
          </button>

          {/* Bank Transfer */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowBankDetails(!showBankDetails)}
              className="w-full p-4 hover:bg-gray-50 transition duration-200 text-left flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 text-lg">🏦</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#383a3c]">Transfer to Company Account</h4>
                  <p className="text-gray-600 text-sm">Make direct bank transfer</p>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transform transition-transform ${showBankDetails ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBankDetails && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2">Bank Account Details:</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600 text-sm">Account Name:</span>
                      <p className="font-medium">Hols Apartments Ltd</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Account Number:</span>
                      <p className="font-medium text-lg">0900408855</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Bank:</span>
                      <p className="font-medium">GT Bank</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    After transfer, upload proof of payment in your dashboard. Booking will be confirmed after verification.
                  </p>
                </div>
                <button
                  onClick={() => onSelectMethod('bank_transfer')}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
                >
                  Proceed with Bank Transfer
                </button>
              </div>
            )}
          </div>

          {/* Pay Onsite */}
          <button
            onClick={() => onSelectMethod('onsite')}
            className="w-full border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-yellow-600 text-lg">🏠</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#383a3c]">Pay Onsite</h4>
                <p className="text-gray-600 text-sm">Pay cash at the property during check-in</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  const { user } = useAuth();
  const { createBooking, initializePayment, checkAvailability } = useBooking();
  const router = useRouter();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [reviews, setReviews] = useState<Review[]>(sampleReviews);
  const [showReserveButton, setShowReserveButton] = useState(true);
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paystack' | 'bank_transfer' | 'onsite' | null>(null);
  
  // Ref for the booking card to scroll to
  const bookingCardRef = useRef<HTMLDivElement>(null);

  // Transform backend data to frontend format
  const propertyImages = property.images?.map(img => img.url) || [];
  const mainImage = property.images?.find(img => img.isMain)?.url || property.images?.[0]?.url || '/default-property.jpg';
  
  const hostInfo = {
    name: `${property.owner?.firstName || 'Host'} ${property.owner?.lastName || ''}`.trim(),
    image: property.owner?.profileImagePath || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    joined: "2022",
    rating: 4.9,
    properties: 12
  };

  const specs = {
    guests: property.specifications?.maxGuests || 1,
    bedrooms: property.specifications?.bedrooms || 0,
    beds: property.specifications?.bedrooms || 0,
    bathrooms: property.specifications?.bathrooms || 0
  };

  const totalNights = checkIn && checkOut ? 
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalPrice = totalNights * property.price;

  // Calculate rating breakdown
  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
    const review: Review = {
      ...newReview,
      id: reviews.length + 1,
      date: new Date().toISOString().split('T')[0],
      helpful: 0
    };
    setReviews([review, ...reviews]);
  };

  const handleHelpfulClick = (reviewId: number) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, helpful: review.helpful + 1 }
        : review
    ));
  };

  // Function to scroll to booking card
  const scrollToBookingCard = () => {
    bookingCardRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Effect to hide/show reserve button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (bookingCardRef.current) {
        const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
        const buttonHeight = 80;
        
        const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
        setShowReserveButton(!isBookingCardVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check availability when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      handleCheckAvailability();
    }
  }, [checkIn, checkOut]);

  const handleCheckAvailability = async () => {
    try {
      setAvailabilityError('');
      const isAvailable = await checkAvailability(property._id, checkIn, checkOut);
      if (!isAvailable) {
        setAvailabilityError('Property not available for selected dates');
      }
    } catch (error: any) {
      setAvailabilityError(error.message);
    }
  };

  const handleReserve = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (availabilityError) {
      alert(availabilityError);
      return;
    }

    // Show payment method modal
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: 'paystack' | 'bank_transfer' | 'onsite') => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(false);
    
    try {
      setLoading(true);
      setBookingError('');
      
      // Create booking with selected payment method
      const bookingData = {
        propertyId: property._id,
        checkIn,
        checkOut,
        guests,
        specialRequests: '',
        paymentMethod: method
      };

      console.log('Creating booking with payment method:', method);

      const bookingResponse = await createBooking(bookingData);
      console.log('Booking response:', bookingResponse);
      
      // Extract booking ID
      let bookingId;
      if (bookingResponse.booking?._id) {
        bookingId = bookingResponse.booking._id;
      } else if (bookingResponse._id) {
        bookingId = bookingResponse._id;
      }

      if (!bookingId) {
        throw new Error('Booking created but no booking ID received');
      }

      console.log('Booking ID:', bookingId);

      // Handle different payment methods
      if (method === 'paystack') {
        // Initialize Paystack payment
        const paymentData = await initializePayment(bookingId, user.email);
        
        if (!paymentData?.authorization_url) {
          throw new Error('Payment gateway is currently unavailable. Please try again.');
        }

        console.log('Redirecting to Paystack...');
        setTimeout(() => {
          window.open(paymentData.authorization_url, '_self');
        }, 100);

      } else if (method === 'bank_transfer') {
        // Show success message with bank details
        const bankDetails = bookingResponse.bankDetails || {
          accountName: 'Hols Apartments Ltd',
          accountNumber: '0900408855',
          bankName: 'GT Bank',
          transferReference: bookingResponse.booking?.bankTransferDetails?.transferReference || ''
        };
        
        alert(`Booking created successfully!\n\nPlease transfer ₦${bookingResponse.booking?.totalAmount?.toLocaleString()} to:\nAccount Name: ${bankDetails.accountName}\nAccount Number: ${bankDetails.accountNumber}\nBank: ${bankDetails.bankName}\nReference: ${bankDetails.transferReference}\n\nAfter transfer, upload proof of payment in your dashboard.`);
        
        // Redirect to upload proof page
        router.push(`/dashboard/bookings/${bookingId}/upload-proof`);
        
      } else if (method === 'onsite') {
        // Show success message and redirect to bookings
        alert('Booking created successfully! Please proceed to the property for check-in and payment.');
        router.push('/dashboard/bookings');
      }

    } catch (error: any) {
      console.error('Error during reservation:', error.message);
      
      let userMessage = error.message || 'Failed to process booking. Please try again.';
      setBookingError(userMessage);
      alert(userMessage);
    } finally {
      setLoading(false);
      setSelectedPaymentMethod(null);
    }
  };

  // Format date for input min attribute
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum check-in is tomorrow
    return today.toISOString().split('T')[0];
  };

  const getMinCheckoutDate = () => {
    if (!checkIn) return getMinDate();
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1); // Check-out must be at least 1 day after check-in
    return checkInDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center">
            <span className="text-[#f06123]">★</span>
            <span className="ml-1 font-semibold">{property.rating || 'New'}</span>
            <span className="ml-1 text-gray-600">({property.totalBookings || 0} bookings)</span>
          </div>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <span className="text-gray-600 capitalize">{property.type}</span>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <span className="text-gray-600">{property.location}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2">
          {/* Main Image Gallery */}
          <div className="mb-8">
            {/* Main Large Image */}
            <div className="mb-4">
              <img
                src={mainImage}
                alt={property.title}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
            </div>
            
            {/* Thumbnail Images - Horizontal Scroll */}
            {propertyImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {propertyImages.map((image, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 cursor-pointer border-2 ${
                      selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
                    } rounded-lg overflow-hidden`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image}
                      alt={`${property.title} ${index + 1}`}
                      className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Reserve Now Button - FIXED */}
            {showReserveButton && (
              <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
                <button
                  onClick={(e) => handleReserve(e)}  
                  disabled={loading || !!availabilityError || !!bookingError}
                  className={`w-full ${
                    loading || availabilityError || bookingError
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#f06123] hover:bg-orange-600'
                  } text-[#fcfeff] py-4 rounded-xl font-semibold transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <span>Reserve Now</span>
                      <span className="text-xl">•</span>
                      <span>${property.price}/night</span>
                      <svg 
                        className="w-5 h-5 ml-1 animate-bounce" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="space-y-8">
            {/* Host Info */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
                    Hosted by {hostInfo.name}
                  </h2>
                  <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
                    <span>{specs.guests} guests</span>
                    <span>•</span>
                    <span>{specs.bedrooms} bedrooms</span>
                    <span>•</span>
                    <span>{specs.beds} beds</span>
                    <span>•</span>
                    <span>{specs.bathrooms} bathrooms</span>
                    {property.specifications?.squareFeet && (
                      <>
                        <span>•</span>
                        <span>{property.specifications.squareFeet} sq ft</span>
                      </>
                    )}
                  </div>
                </div>
                <img
                  src={hostInfo.image}
                  alt={hostInfo.name}
                  className="w-12 h-12 rounded-full"
                />
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
              <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
            </div>

            {/* Amenities - Updated to handle amenity objects */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.amenities.map((amenity) => (
                    <div key={amenity._id} className="flex items-center">
                      <span className="text-[#f06123] mr-3 text-xl">
                        {amenity.icon || '✓'}
                      </span>
                      <div>
                        <span className="text-gray-700 text-lg">{amenity.name}</span>
                        {amenity.description && (
                          <p className="text-sm text-gray-500 mt-1">{amenity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
                {defaultRules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Reviews Section */}
            <ReviewsSection
              reviews={reviews}
              ratingBreakdown={ratingBreakdown}
              averageRating={property.rating || 0}
              totalReviews={reviews.length}
              onAddReview={handleAddReview}
              onHelpfulClick={handleHelpfulClick}
            />
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-1" ref={bookingCardRef}>
          <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
            <div className="mb-6">
              <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
              <span className="text-gray-600 text-lg"> / night</span>
            </div>

            {/* Booking Form */}
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                {/* Date Picker */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={getMinDate()}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={getMinCheckoutDate()}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
                  >
                    {Array.from({ length: specs.guests }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </div>

                {/* Availability Error */}
                {availabilityError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm text-center">{availabilityError}</p>
                  </div>
                )}

                {/* Booking Error */}
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm text-center">{bookingError}</p>
                  </div>
                )}

                {/* Reserve Button - Main */}
                <button 
                  type="button" 
                  onClick={(e) => handleReserve(e)}
                  disabled={loading || !!availabilityError || !!bookingError}
                  className={`w-full ${
                    loading || availabilityError || bookingError
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#f06123] hover:bg-orange-600'
                  } text-[#fcfeff] py-4 rounded-lg font-semibold transition duration-200 text-lg shadow-md`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : availabilityError || bookingError ? (
                    'Not Available'
                  ) : (
                    'Reserve Now'
                  )}
                </button>

                {/* Price Breakdown */}
                {totalNights > 0 && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>${property.price} x {totalNights} nights</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Service fee</span>
                      <span>${(totalPrice * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                      <span>Total</span>
                      <span>${(totalPrice * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <p className="text-center text-gray-600 text-sm mt-4">
                  You won't be charged yet
                </p>
              </div>
            </form>

            {/* Extra Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Free cancellation</span>
                <span className="font-semibold">Before 24 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Check-in time</span>
                <span className="font-semibold">After 2:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
      />

      {/* Add custom animations to globals.css or use inline styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
}










































































































































// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { useBooking } from '@/contexts/BookingContext';
// import { useRouter } from 'next/navigation';
// import ReviewsSection from './ReviewsSection';

// interface Amenity {
//   _id: string;
//   name: string;
//   description?: string;
//   icon?: string;
//   category: string;
// }

// interface Property {
//   _id: string;
//   title: string;
//   location: string;
//   price: number;
//   images: Array<{
//     url: string;
//     isMain: boolean;
//     order: number;
//   }>;
//   rating: number;
//   totalBookings: number;
//   description: string;
//   owner: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     profileImagePath?: string;
//     joined?: string;
//     rating?: number;
//     properties?: number;
//   };
//   amenities: Amenity[];
//   specifications: {
//     maxGuests: number;
//     bedrooms: number;
//     bathrooms: number;
//     squareFeet: number;
//   };
//   type: string;
//   status: string;
// }

// interface Review {
//   id: number;
//   user: {
//     name: string;
//     image: string;
//   };
//   rating: number;
//   comment: string;
//   date: string;
//   helpful: number;
// }

// interface PropertyDetailsProps {
//   property: Property;
// }

// // Sample reviews data
// const sampleReviews: Review[] = [
//   {
//     id: 1,
//     user: {
//       name: "Michael Chen",
//       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
//     },
//     rating: 5,
//     comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
//     date: "2024-01-15",
//     helpful: 12
//   },
//   {
//     id: 2,
//     user: {
//       name: "Sarah Williams",
//       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
//     },
//     rating: 4,
//     comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
//     date: "2024-01-10",
//     helpful: 8
//   },
//   {
//     id: 3,
//     user: {
//       name: "David Johnson",
//       image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
//     },
//     rating: 5,
//     comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
//     date: "2024-01-05",
//     helpful: 15
//   }
// ];

// // Default house rules
// const defaultRules = [
//   "No smoking",
//   "No pets",
//   "No parties or events",
//   "Check-in after 2:00 PM",
//   "Check-out before 11:00 AM"
// ];

// export default function PropertyDetails({ property }: PropertyDetailsProps) {
//   const { user } = useAuth();
//   const { createBooking, initializePayment, checkAvailability } = useBooking();
//   const router = useRouter();
  
//   const [selectedImage, setSelectedImage] = useState(0);
//   const [checkIn, setCheckIn] = useState('');
//   const [checkOut, setCheckOut] = useState('');
//   const [guests, setGuests] = useState(1);
//   const [reviews, setReviews] = useState<Review[]>(sampleReviews);
//   const [showReserveButton, setShowReserveButton] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [availabilityError, setAvailabilityError] = useState('');
//   const [bookingError, setBookingError] = useState('');
  
//   // Ref for the booking card to scroll to
//   const bookingCardRef = useRef<HTMLDivElement>(null);

//   // Transform backend data to frontend format
//   const propertyImages = property.images?.map(img => img.url) || [];
//   const mainImage = property.images?.find(img => img.isMain)?.url || property.images?.[0]?.url || '/default-property.jpg';
  
//   const hostInfo = {
//     name: `${property.owner?.firstName || 'Host'} ${property.owner?.lastName || ''}`.trim(),
//     image: property.owner?.profileImagePath || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
//     joined: "2022",
//     rating: 4.9,
//     properties: 12
//   };

//   const specs = {
//     guests: property.specifications?.maxGuests || 1,
//     bedrooms: property.specifications?.bedrooms || 0,
//     beds: property.specifications?.bedrooms || 0,
//     bathrooms: property.specifications?.bathrooms || 0
//   };

//   const totalNights = checkIn && checkOut ? 
//     Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
//   const totalPrice = totalNights * property.price;

//   // Calculate rating breakdown
//   const ratingBreakdown = {
//     5: reviews.filter(r => r.rating === 5).length,
//     4: reviews.filter(r => r.rating === 4).length,
//     3: reviews.filter(r => r.rating === 3).length,
//     2: reviews.filter(r => r.rating === 2).length,
//     1: reviews.filter(r => r.rating === 1).length
//   };

//   const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
//     const review: Review = {
//       ...newReview,
//       id: reviews.length + 1,
//       date: new Date().toISOString().split('T')[0],
//       helpful: 0
//     };
//     setReviews([review, ...reviews]);
//   };

//   const handleHelpfulClick = (reviewId: number) => {
//     setReviews(reviews.map(review => 
//       review.id === reviewId 
//         ? { ...review, helpful: review.helpful + 1 }
//         : review
//     ));
//   };

//   // Function to scroll to booking card
//   const scrollToBookingCard = () => {
//     bookingCardRef.current?.scrollIntoView({ 
//       behavior: 'smooth',
//       block: 'start'
//     });
//   };

//   // Effect to hide/show reserve button based on scroll position
//   useEffect(() => {
//     const handleScroll = () => {
//       if (bookingCardRef.current) {
//         const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
//         const buttonHeight = 80;
        
//         const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
//         setShowReserveButton(!isBookingCardVisible);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     handleScroll();

//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   // Check availability when dates change
//   useEffect(() => {
//     if (checkIn && checkOut) {
//       handleCheckAvailability();
//     }
//   }, [checkIn, checkOut]);

//   const handleCheckAvailability = async () => {
//     try {
//       setAvailabilityError('');
//       const isAvailable = await checkAvailability(property._id, checkIn, checkOut);
//       if (!isAvailable) {
//         setAvailabilityError('Property not available for selected dates');
//       }
//     } catch (error: any) {
//       setAvailabilityError(error.message);
//     }
//   };

//   // const handleReserve = async (e?: React.MouseEvent) => {
//   //   // Prevent default behavior if event is provided
//   //   if (e) {
//   //     e.preventDefault();
//   //     e.stopPropagation();
//   //   }

//   //   if (!user) {
//   //     router.push('/login');
//   //     return;
//   //   }

//   //   if (!checkIn || !checkOut) {
//   //     alert('Please select check-in and check-out dates');
//   //     return;
//   //   }

//   //   if (availabilityError) {
//   //     alert(availabilityError);
//   //     return;
//   //   }

//   //   try {
//   //     setLoading(true);
//   //     setBookingError('');
      
//   //     // Create booking
//   //     const bookingData = {
//   //       propertyId: property._id,
//   //       checkIn,
//   //       checkOut,
//   //       guests,
//   //       specialRequests: ''
//   //     };

//   //     console.log('🎯 [PropertyDetails] Step 1: Creating booking with data:', bookingData);

//   //     const bookingResponse = await createBooking(bookingData);
      
//   //     if (!bookingResponse.success) {
//   //       throw new Error(bookingResponse.message || 'Failed to create booking');
//   //     }
      
//   //     const booking = bookingResponse.booking;

//   //     console.log('✅ [PropertyDetails] Step 2: Booking created:', {
//   //       bookingId: booking._id,
//   //       propertyId: property._id
//   //     });

//   //     // Initialize payment
//   //     console.log('🎯 [PropertyDetails] Step 3: Initializing payment for booking:', booking._id);
      
//   //     const paymentData = await initializePayment(booking._id, user.email);
      
//   //     console.log('🔍 [PropertyDetails] Payment response:', paymentData);
      
//   //     // Check if we have the authorization_url
//   //     if (!paymentData || !paymentData.authorization_url) {
//   //       console.error('💥 [PropertyDetails] Missing authorization_url in response:', paymentData);
//   //       throw new Error('Payment gateway is currently unavailable. Please try again.');
//   //     }

//   //     console.log('✅ [PropertyDetails] Step 4: Payment initialized:', {
//   //       authorization_url: paymentData.authorization_url,
//   //       reference: paymentData.reference
//   //     });

//   //     // Redirect to Paystack
//   //     setTimeout(() => {
//   //       console.log('🔗 [PropertyDetails] Step 5: Redirecting to Paystack...');
//   //       window.location.href = paymentData.authorization_url;
//   //     }, 100);
      
//   //   } catch (error: any) {
//   //     console.error('💥 [PropertyDetails] Error during reservation:', {
//   //       message: error.message,
//   //       stack: error.stack
//   //     });
//   //     setBookingError(error.message || 'Failed to process booking. Please try again.');
//   //     alert(error.message || 'Failed to process booking. Please try again.');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // components/PropertyDetails.tsx - Update handleReserve function
//   // const handleReserve = async (e?: React.MouseEvent) => {
//   //   // Prevent default behavior if event is provided
//   //   if (e) {
//   //     e.preventDefault();
//   //     e.stopPropagation();
//   //   }

//   //   if (!user) {
//   //     router.push('/login');
//   //     return;
//   //   }

//   //   if (!checkIn || !checkOut) {
//   //     alert('Please select check-in and check-out dates');
//   //     return;
//   //   }

//   //   if (availabilityError) {
//   //     alert(availabilityError);
//   //     return;
//   //   }

//   //   try {
//   //     setLoading(true);
//   //     setBookingError('');
      
//   //     // Create booking
//   //     const bookingData = {
//   //       propertyId: property._id,
//   //       checkIn,
//   //       checkOut,
//   //       guests,
//   //       specialRequests: ''
//   //     };

//   //     console.log('🎯 [PropertyDetails] Step 1: Creating booking with data:', bookingData);

//   //     const bookingResponse = await createBooking(bookingData);
      
//   //     console.log('🔍 [PropertyDetails] Booking response:', bookingResponse);
      
//   //     // ✅ FIX: Check if booking was created successfully
//   //     if (!bookingResponse || !bookingResponse.booking) {
//   //       console.error('💥 [PropertyDetails] No booking data in response:', bookingResponse);
//   //       throw new Error('Failed to create booking. Please try again.');
//   //     }
      
//   //     const booking = bookingResponse.booking;

//   //     console.log('✅ [PropertyDetails] Step 2: Booking created:', {
//   //       bookingId: booking._id,
//   //       propertyId: property._id
//   //     });

//   //     // Initialize payment
//   //     console.log('🎯 [PropertyDetails] Step 3: Initializing payment for booking:', booking._id);
      
//   //     const paymentData = await initializePayment(booking._id, user.email);
      
//   //     console.log('🔍 [PropertyDetails] Payment response:', paymentData);
      
//   //     // Check if we have the authorization_url
//   //     if (!paymentData || !paymentData.authorization_url) {
//   //       console.error('💥 [PropertyDetails] Missing authorization_url in response:', paymentData);
//   //       throw new Error('Payment gateway is currently unavailable. Please try again.');
//   //     }

//   //     console.log('✅ [PropertyDetails] Step 4: Payment initialized:', {
//   //       authorization_url: paymentData.authorization_url,
//   //       reference: paymentData.reference
//   //     });

//   //     // Redirect to Paystack
//   //     console.log('🔗 [PropertyDetails] Step 5: Redirecting to Paystack...');
//   //     window.location.href = paymentData.authorization_url;
      
//   //   } catch (error: any) {
//   //     console.error('💥 [PropertyDetails] Error during reservation:', {
//   //       message: error.message,
//   //       stack: error.stack
//   //     });
      
//   //     // ✅ FIX: Don't show alert for success messages
//   //     if (!error.message.includes('Booking created successfully')) {
//   //       setBookingError(error.message);
//   //       alert(error.message || 'Failed to process booking. Please try again.');
//   //     }
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // const handleReserve = async (e?: React.MouseEvent) => {
//   //   // Prevent default behavior if event is provided
//   //   if (e) {
//   //     e.preventDefault();
//   //     e.stopPropagation();
//   //   }

//   //   console.log('🔴 [PropertyDetails] handleReserve called');
//   //   console.log('🔴 [PropertyDetails] User:', user?.email);
//   //   console.log('🔴 [PropertyDetails] Property ID:', property._id);
//   //   console.log('🔴 [PropertyDetails] Dates:', { checkIn, checkOut, guests });

//   //   if (!user) {
//   //     console.log('🔴 [PropertyDetails] No user, redirecting to login');
//   //     router.push('/login');
//   //     return;
//   //   }

//   //   if (!checkIn || !checkOut) {
//   //     console.log('🔴 [PropertyDetails] Missing dates');
//   //     alert('Please select check-in and check-out dates');
//   //     return;
//   //   }

//   //   if (availabilityError) {
//   //     console.log('🔴 [PropertyDetails] Availability error:', availabilityError);
//   //     alert(availabilityError);
//   //     return;
//   //   }

//   //   try {
//   //     setLoading(true);
//   //     setBookingError('');
      
//   //     // Create booking
//   //     const bookingData = {
//   //       propertyId: property._id,
//   //       checkIn,
//   //       checkOut,
//   //       guests,
//   //       specialRequests: ''
//   //     };

//   //     console.log('🎯 [PropertyDetails] Step 1: Creating booking with data:', JSON.stringify(bookingData, null, 2));

//   //     let bookingResponse;
//   //     try {
//   //       bookingResponse = await createBooking(bookingData);
//   //       console.log('✅ [PropertyDetails] Booking response received:', JSON.stringify(bookingResponse, null, 2));
//   //     } catch (bookingError: any) {
//   //       console.error('❌ [PropertyDetails] Booking creation threw error:', {
//   //         message: bookingError.message,
//   //         response: bookingError.response?.data
//   //       });
//   //       throw bookingError;
//   //     }
      
//   //     // Check if booking was created successfully
//   //     if (!bookingResponse) {
//   //       console.error('💥 [PropertyDetails] No booking response at all');
//   //       throw new Error('No response from booking service');
//   //     }
      
//   //     // Check different response formats
//   //     let booking;
//   //     if (bookingResponse.booking) {
//   //       booking = bookingResponse.booking;
//   //     } else if (bookingResponse.data?.booking) {
//   //       booking = bookingResponse.data.booking;
//   //     } else if (bookingResponse._id) {
//   //       booking = bookingResponse; // direct booking object
//   //     } else {
//   //       console.error('💥 [PropertyDetails] Could not find booking in response:', bookingResponse);
//   //       throw new Error('Booking created but no booking data received');
//   //     }

//   //     console.log('✅ [PropertyDetails] Step 2: Booking extracted:', {
//   //       bookingId: booking._id,
//   //       propertyId: booking.property?._id || booking.property
//   //     });

//   //     // Initialize payment
//   //     console.log('🎯 [PropertyDetails] Step 3: Initializing payment for booking:', booking._id);
      
//   //     let paymentData;
//   //     try {
//   //       paymentData = await initializePayment(booking._id, user.email);
//   //       console.log('✅ [PropertyDetails] Payment response:', paymentData);
//   //     } catch (paymentError: any) {
//   //       console.error('❌ [PropertyDetails] Payment initialization error:', {
//   //         message: paymentError.message,
//   //         response: paymentError.response?.data
//   //       });
//   //       throw paymentError;
//   //     }
      
//   //     // Check if we have the authorization_url
//   //     if (!paymentData || !paymentData.authorization_url) {
//   //       console.error('💥 [PropertyDetails] Missing authorization_url in response:', paymentData);
//   //       throw new Error('Payment gateway is currently unavailable. Please try again.');
//   //     }

//   //     console.log('✅ [PropertyDetails] Step 4: Payment initialized:', {
//   //       authorization_url: paymentData.authorization_url,
//   //       reference: paymentData.reference
//   //     });

//   //     // Redirect to Paystack
//   //     console.log('🔗 [PropertyDetails] Step 5: Redirecting to Paystack...');
//   //     window.location.href = paymentData.authorization_url;
      
//   //   } catch (error: any) {
//   //     console.error('💥 [PropertyDetails] Final error during reservation:', {
//   //       message: error.message,
//   //       stack: error.stack,
//   //       name: error.name,
//   //       response: error.response?.data
//   //     });
      
//   //     // Show user-friendly error message
//   //     const userMessage = error.message || 'Failed to process booking. Please try again.';
//   //     setBookingError(userMessage);
//   //     alert(userMessage);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };


//   // components/PropertyDetails.tsx - Simplified handleReserve function
//   const handleReserve = async (e?: React.MouseEvent) => {
//     // Prevent default behavior if event is provided
//     if (e) {
//       e.preventDefault();
//       e.stopPropagation();
//     }

//     console.log('🔴 [PropertyDetails] handleReserve called');

//     if (!user) {
//       router.push('/login');
//       return;
//     }

//     if (!checkIn || !checkOut) {
//       alert('Please select check-in and check-out dates');
//       return;
//     }

//     if (availabilityError) {
//       alert(availabilityError);
//       return;
//     }

//     try {
//       setLoading(true);
//       setBookingError('');
      
//       // Create booking
//       const bookingData = {
//         propertyId: property._id,
//         checkIn,
//         checkOut,
//         guests,
//         specialRequests: ''
//       };

//       console.log('🎯 [PropertyDetails] Creating booking...');

//       const bookingResponse = await createBooking(bookingData);
//       console.log('✅ [PropertyDetails] Booking response:', bookingResponse);
      
//       // Extract booking ID from response
//       let bookingId;
//       if (bookingResponse.booking?._id) {
//         bookingId = bookingResponse.booking._id;
//       } else if (bookingResponse._id) {
//         bookingId = bookingResponse._id;
//       } else if (bookingResponse.data?.booking?._id) {
//         bookingId = bookingResponse.data.booking._id;
//       }
      
//       if (!bookingId) {
//         console.error('💥 [PropertyDetails] No booking ID found:', bookingResponse);
//         throw new Error('Booking created but no booking ID received');
//       }

//       console.log('✅ [PropertyDetails] Booking ID:', bookingId);

//       // Initialize payment
//       console.log('🎯 [PropertyDetails] Initializing payment...');
      
//       const paymentData = await initializePayment(bookingId, user.email);
//       console.log('✅ [PropertyDetails] Payment data:', paymentData);
      
//       // Check if we have the authorization_url
//       if (!paymentData?.authorization_url) {
//         console.error('💥 [PropertyDetails] Missing authorization_url:', paymentData);
//         throw new Error('Payment gateway is currently unavailable. Please try again.');
//       }

//       console.log('✅ [PropertyDetails] Redirecting to Paystack...');
      
//       // ✅ FIX: Use window.open instead of window.location.href
//       // This prevents any JavaScript errors from blocking the redirect
//       setTimeout(() => {
//         window.open(paymentData.authorization_url, '_self');
//       }, 100);
      
//     } catch (error: any) {
//       console.error('💥 [PropertyDetails] Error during reservation:', error.message);
      
//       // Show user-friendly error message
//       let userMessage = error.message || 'Failed to process booking. Please try again.';
      
//       // Handle specific error cases
//       if (error.message.includes('authorization_url')) {
//         userMessage = 'Payment service temporarily unavailable. Please try again.';
//       }
      
//       setBookingError(userMessage);
//       alert(userMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Format date for input min attribute
//   const getMinDate = () => {
//     const today = new Date();
//     today.setDate(today.getDate() + 1); // Minimum check-in is tomorrow
//     return today.toISOString().split('T')[0];
//   };

//   const getMinCheckoutDate = () => {
//     if (!checkIn) return getMinDate();
//     const checkInDate = new Date(checkIn);
//     checkInDate.setDate(checkInDate.getDate() + 1); // Check-out must be at least 1 day after check-in
//     return checkInDate.toISOString().split('T')[0];
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
//         <div className="flex items-center space-x-4 flex-wrap">
//           <div className="flex items-center">
//             <span className="text-[#f06123]">★</span>
//             <span className="ml-1 font-semibold">{property.rating || 'New'}</span>
//             <span className="ml-1 text-gray-600">({property.totalBookings || 0} bookings)</span>
//           </div>
//           <span className="text-gray-600 hidden sm:inline">•</span>
//           <span className="text-gray-600 capitalize">{property.type}</span>
//           <span className="text-gray-600 hidden sm:inline">•</span>
//           <span className="text-gray-600">{property.location}</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left Column - Images & Details */}
//         <div className="lg:col-span-2">
//           {/* Main Image Gallery */}
//           <div className="mb-8">
//             {/* Main Large Image */}
//             <div className="mb-4">
//               <img
//                 src={mainImage}
//                 alt={property.title}
//                 className="w-full h-96 object-cover rounded-2xl shadow-lg"
//               />
//             </div>
            
//             {/* Thumbnail Images - Horizontal Scroll */}
//             {propertyImages.length > 1 && (
//               <div className="flex space-x-2 overflow-x-auto pb-2">
//                 {propertyImages.map((image, index) => (
//                   <div
//                     key={index}
//                     className={`flex-shrink-0 cursor-pointer border-2 ${
//                       selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
//                     } rounded-lg overflow-hidden`}
//                     onClick={() => setSelectedImage(index)}
//                   >
//                     <img
//                       src={image}
//                       alt={`${property.title} ${index + 1}`}
//                       className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
//                     />
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Mobile Reserve Now Button - FIXED */}
//             {showReserveButton && (
//               <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
//                 <button
//                   onClick={(e) => handleReserve(e)}  
//                   disabled={loading || !!availabilityError || !!bookingError}
//                   className={`w-full ${
//                     loading || availabilityError || bookingError
//                       ? 'bg-gray-400 cursor-not-allowed' 
//                       : 'bg-[#f06123] hover:bg-orange-600'
//                   } text-[#fcfeff] py-4 rounded-xl font-semibold transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle`}
//                 >
//                   {loading ? (
//                     <span className="flex items-center">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                       Processing...
//                     </span>
//                   ) : (
//                     <>
//                       <span>Reserve Now</span>
//                       <span className="text-xl">•</span>
//                       <span>${property.price}/night</span>
//                       <svg 
//                         className="w-5 h-5 ml-1 animate-bounce" 
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
//                       </svg>
//                     </>
//                   )}
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Property Details */}
//           <div className="space-y-8">
//             {/* Host Info */}
//             <div className="border-b border-gray-200 pb-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
//                     Hosted by {hostInfo.name}
//                   </h2>
//                   <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
//                     <span>{specs.guests} guests</span>
//                     <span>•</span>
//                     <span>{specs.bedrooms} bedrooms</span>
//                     <span>•</span>
//                     <span>{specs.beds} beds</span>
//                     <span>•</span>
//                     <span>{specs.bathrooms} bathrooms</span>
//                     {property.specifications?.squareFeet && (
//                       <>
//                         <span>•</span>
//                         <span>{property.specifications.squareFeet} sq ft</span>
//                       </>
//                     )}
//                   </div>
//                 </div>
//                 <img
//                   src={hostInfo.image}
//                   alt={hostInfo.name}
//                   className="w-12 h-12 rounded-full"
//                 />
//               </div>
//             </div>

//             {/* Description */}
//             <div className="border-b border-gray-200 pb-6">
//               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
//               <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
//             </div>

//             {/* Amenities - Updated to handle amenity objects */}
//             {property.amenities && property.amenities.length > 0 && (
//               <div className="border-b border-gray-200 pb-6">
//                 <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   {property.amenities.map((amenity) => (
//                     <div key={amenity._id} className="flex items-center">
//                       <span className="text-[#f06123] mr-3 text-xl">
//                         {amenity.icon || '✓'}
//                       </span>
//                       <div>
//                         <span className="text-gray-700 text-lg">{amenity.name}</span>
//                         {amenity.description && (
//                           <p className="text-sm text-gray-500 mt-1">{amenity.description}</p>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* House Rules */}
//             <div className="border-b border-gray-200 pb-6">
//               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
//               <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
//                 {defaultRules.map((rule, index) => (
//                   <li key={index}>{rule}</li>
//                 ))}
//               </ul>
//             </div>

//             {/* Reviews Section */}
//             <ReviewsSection
//               reviews={reviews}
//               ratingBreakdown={ratingBreakdown}
//               averageRating={property.rating || 0}
//               totalReviews={reviews.length}
//               onAddReview={handleAddReview}
//               onHelpfulClick={handleHelpfulClick}
//             />
//           </div>
//         </div>

//         {/* Right Column - Booking Card */}
//         <div className="lg:col-span-1" ref={bookingCardRef}>
//           <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
//             <div className="mb-6">
//               <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
//               <span className="text-gray-600 text-lg"> / night</span>
//             </div>

//             {/* Booking Form */}
//             <form onSubmit={(e) => e.preventDefault()}>
//               <div className="space-y-4">
//                 {/* Date Picker */}
//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
//                     <input
//                       type="date"
//                       value={checkIn}
//                       onChange={(e) => setCheckIn(e.target.value)}
//                       min={getMinDate()}
//                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
//                     <input
//                       type="date"
//                       value={checkOut}
//                       onChange={(e) => setCheckOut(e.target.value)}
//                       min={getMinCheckoutDate()}
//                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Guests */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
//                   <select
//                     value={guests}
//                     onChange={(e) => setGuests(Number(e.target.value))}
//                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
//                   >
//                     {Array.from({ length: specs.guests }, (_, i) => i + 1).map(num => (
//                       <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Availability Error */}
//                 {availabilityError && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                     <p className="text-red-600 text-sm text-center">{availabilityError}</p>
//                   </div>
//                 )}

//                 {/* Booking Error */}
//                 {bookingError && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                     <p className="text-red-600 text-sm text-center">{bookingError}</p>
//                   </div>
//                 )}

//                 {/* Reserve Button - Main */}
//                 <button 
//                   type="button" 
//                   onClick={(e) => handleReserve(e)}
//                   disabled={loading || !!availabilityError || !!bookingError}
//                   className={`w-full ${
//                     loading || availabilityError || bookingError
//                       ? 'bg-gray-400 cursor-not-allowed' 
//                       : 'bg-[#f06123] hover:bg-orange-600'
//                   } text-[#fcfeff] py-4 rounded-lg font-semibold transition duration-200 text-lg shadow-md`}
//                 >
//                   {loading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                       Processing...
//                     </div>
//                   ) : availabilityError || bookingError ? (
//                     'Not Available'
//                   ) : (
//                     'Reserve Now'
//                   )}
//                 </button>

//                 {/* Price Breakdown */}
//                 {totalNights > 0 && (
//                   <div className="border-t border-gray-200 pt-4 space-y-3">
//                     <div className="flex justify-between text-gray-700">
//                       <span>${property.price} x {totalNights} nights</span>
//                       <span>${totalPrice.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between text-gray-700">
//                       <span>Service fee</span>
//                       <span>${(totalPrice * 0.1).toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
//                       <span>Total</span>
//                       <span>${(totalPrice * 1.1).toFixed(2)}</span>
//                     </div>
//                   </div>
//                 )}

//                 <p className="text-center text-gray-600 text-sm mt-4">
//                   You won't be charged yet
//                 </p>
//               </div>
//             </form>

//             {/* Extra Info */}
//             <div className="mt-6 pt-6 border-t border-gray-200">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-gray-600">Free cancellation</span>
//                 <span className="font-semibold">Before 24 hours</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-gray-600">Check-in time</span>
//                 <span className="font-semibold">After 2:00 PM</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Add custom animations to globals.css or use inline styles */}
//       <style jsx>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes bounce-subtle {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-5px); }
//         }
//         .animate-fade-in {
//           animation: fade-in 0.3s ease-out;
//         }
//         .animate-bounce-subtle {
//           animation: bounce-subtle 2s infinite;
//         }
//         .animate-bounce {
//           animation: bounce 2s infinite;
//         }
//       `}</style>
//     </div>
//   );
// }






















































// // 'use client';

// // import { useState, useRef, useEffect } from 'react';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { useBooking } from '@/contexts/BookingContext';
// // import { useRouter } from 'next/navigation';
// // import ReviewsSection from './ReviewsSection';

// // interface Amenity {
// //   _id: string;
// //   name: string;
// //   description?: string;
// //   icon?: string;
// //   category: string;
// // }

// // interface Property {
// //   _id: string;
// //   title: string;
// //   location: string;
// //   price: number;
// //   images: Array<{
// //     url: string;
// //     isMain: boolean;
// //     order: number;
// //   }>;
// //   rating: number;
// //   totalBookings: number;
// //   description: string;
// //   owner: {
// //     _id: string;
// //     firstName: string;
// //     lastName: string;
// //     profileImagePath?: string;
// //     joined?: string;
// //     rating?: number;
// //     properties?: number;
// //   };
// //   amenities: Amenity[];
// //   specifications: {
// //     maxGuests: number;
// //     bedrooms: number;
// //     bathrooms: number;
// //     squareFeet: number;
// //   };
// //   type: string;
// //   status: string;
// // }

// // interface Review {
// //   id: number;
// //   user: {
// //     name: string;
// //     image: string;
// //   };
// //   rating: number;
// //   comment: string;
// //   date: string;
// //   helpful: number;
// // }

// // interface PropertyDetailsProps {
// //   property: Property;
// // }

// // // Sample reviews data
// // const sampleReviews: Review[] = [
// //   {
// //     id: 1,
// //     user: {
// //       name: "Michael Chen",
// //       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// //     },
// //     rating: 5,
// //     comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
// //     date: "2024-01-15",
// //     helpful: 12
// //   },
// //   {
// //     id: 2,
// //     user: {
// //       name: "Sarah Williams",
// //       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
// //     },
// //     rating: 4,
// //     comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
// //     date: "2024-01-10",
// //     helpful: 8
// //   },
// //   {
// //     id: 3,
// //     user: {
// //       name: "David Johnson",
// //       image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
// //     },
// //     rating: 5,
// //     comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
// //     date: "2024-01-05",
// //     helpful: 15
// //   }
// // ];

// // // Default house rules
// // const defaultRules = [
// //   "No smoking",
// //   "No pets",
// //   "No parties or events",
// //   "Check-in after 2:00 PM",
// //   "Check-out before 11:00 AM"
// // ];

// // export default function PropertyDetails({ property }: PropertyDetailsProps) {
// //   const { user } = useAuth();
// //   const { createBooking, initializePayment, checkAvailability } = useBooking();
// //   const router = useRouter();
  
// //   const [selectedImage, setSelectedImage] = useState(0);
// //   const [checkIn, setCheckIn] = useState('');
// //   const [checkOut, setCheckOut] = useState('');
// //   const [guests, setGuests] = useState(1);
// //   const [reviews, setReviews] = useState<Review[]>(sampleReviews);
// //   const [showReserveButton, setShowReserveButton] = useState(true);
// //   const [loading, setLoading] = useState(false);
// //   const [availabilityError, setAvailabilityError] = useState('');
  
// //   // Ref for the booking card to scroll to
// //   const bookingCardRef = useRef<HTMLDivElement>(null);

// //   // Transform backend data to frontend format
// //   const propertyImages = property.images?.map(img => img.url) || [];
// //   const mainImage = property.images?.find(img => img.isMain)?.url || property.images?.[0]?.url || '/default-property.jpg';
  
// //   const hostInfo = {
// //     name: `${property.owner?.firstName || 'Host'} ${property.owner?.lastName || ''}`.trim(),
// //     image: property.owner?.profileImagePath || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
// //     joined: "2022",
// //     rating: 4.9,
// //     properties: 12
// //   };

// //   const specs = {
// //     guests: property.specifications?.maxGuests || 1,
// //     bedrooms: property.specifications?.bedrooms || 0,
// //     beds: property.specifications?.bedrooms || 0,
// //     bathrooms: property.specifications?.bathrooms || 0
// //   };

// //   const totalNights = checkIn && checkOut ? 
// //     Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
// //   const totalPrice = totalNights * property.price;

// //   // Calculate rating breakdown
// //   const ratingBreakdown = {
// //     5: reviews.filter(r => r.rating === 5).length,
// //     4: reviews.filter(r => r.rating === 4).length,
// //     3: reviews.filter(r => r.rating === 3).length,
// //     2: reviews.filter(r => r.rating === 2).length,
// //     1: reviews.filter(r => r.rating === 1).length
// //   };

// //   const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
// //     const review: Review = {
// //       ...newReview,
// //       id: reviews.length + 1,
// //       date: new Date().toISOString().split('T')[0],
// //       helpful: 0
// //     };
// //     setReviews([review, ...reviews]);
// //   };

// //   const handleHelpfulClick = (reviewId: number) => {
// //     setReviews(reviews.map(review => 
// //       review.id === reviewId 
// //         ? { ...review, helpful: review.helpful + 1 }
// //         : review
// //     ));
// //   };

// //   // Function to scroll to booking card
// //   const scrollToBookingCard = () => {
// //     bookingCardRef.current?.scrollIntoView({ 
// //       behavior: 'smooth',
// //       block: 'start'
// //     });
// //   };

// //   // Effect to hide/show reserve button based on scroll position
// //   useEffect(() => {
// //     const handleScroll = () => {
// //       if (bookingCardRef.current) {
// //         const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
// //         const buttonHeight = 80;
        
// //         const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
// //         setShowReserveButton(!isBookingCardVisible);
// //       }
// //     };

// //     window.addEventListener('scroll', handleScroll);
// //     handleScroll();

// //     return () => {
// //       window.removeEventListener('scroll', handleScroll);
// //     };
// //   }, []);

// //   // Check availability when dates change
// //   useEffect(() => {
// //     if (checkIn && checkOut) {
// //       handleCheckAvailability();
// //     }
// //   }, [checkIn, checkOut]);

// //   const handleCheckAvailability = async () => {
// //     try {
// //       setAvailabilityError('');
// //       const isAvailable = await checkAvailability(property._id, checkIn, checkOut);
// //       if (!isAvailable) {
// //         setAvailabilityError('Property not available for selected dates');
// //       }
// //     } catch (error: any) {
// //       setAvailabilityError(error.message);
// //     }
// //   };

// //   const handleReserve = async (e?: React.MouseEvent) => {
// //     // Prevent default behavior if event is provided
// //     if (e) {
// //       e.preventDefault();
// //       e.stopPropagation();
// //     }

// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }

// //     if (!checkIn || !checkOut) {
// //       alert('Please select check-in and check-out dates');
// //       return;
// //     }

// //     if (availabilityError) {
// //       alert(availabilityError);
// //       return;
// //     }

// //     try {
// //       setLoading(true);
      
// //       // Create booking
// //       const bookingData = {
// //         propertyId: property._id,
// //         checkIn,
// //         checkOut,
// //         guests,
// //         specialRequests: ''
// //       };

// //       console.log('🎯 [PropertyDetails] Step 1: Creating booking with data:', bookingData);

// //       const bookingResponse = await createBooking(bookingData);
// //       const booking = bookingResponse.booking;

// //       console.log('✅ [PropertyDetails] Step 2: Booking created:', {
// //         bookingId: booking._id,
// //         propertyId: property._id
// //       });

// //       // Initialize payment
// //       console.log('🎯 [PropertyDetails] Step 3: Initializing payment for booking:', booking._id);
      
// //       const paymentData = await initializePayment(booking._id, user.email);
      
// //       console.log('✅ [PropertyDetails] Step 4: Payment initialized:', {
// //         authorization_url: paymentData.authorization_url,
// //         reference: paymentData.reference
// //       });

// //       // Validate the Paystack URL
// //       if (!paymentData.authorization_url) {
// //         throw new Error('No payment URL received from Paystack');
// //       }

// //       // IMPORTANT: Stop any event propagation before redirecting
// //       setTimeout(() => {
// //         console.log('🔗 [PropertyDetails] Step 5: Redirecting to Paystack...');
// //         window.location.href = paymentData.authorization_url;
// //       }, 100);
      
// //     } catch (error: any) {
// //       console.error('💥 [PropertyDetails] Error during reservation:', error);
// //       alert(error.message || 'Failed to process booking. Please try again.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 py-8">
// //       {/* Header */}
// //       <div className="mb-6">
// //         <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
// //         <div className="flex items-center space-x-4 flex-wrap">
// //           <div className="flex items-center">
// //             <span className="text-[#f06123]">★</span>
// //             <span className="ml-1 font-semibold">{property.rating || 'New'}</span>
// //             <span className="ml-1 text-gray-600">({property.totalBookings || 0} bookings)</span>
// //           </div>
// //           <span className="text-gray-600 hidden sm:inline">•</span>
// //           <span className="text-gray-600 capitalize">{property.type}</span>
// //           <span className="text-gray-600 hidden sm:inline">•</span>
// //           <span className="text-gray-600">{property.location}</span>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //         {/* Left Column - Images & Details */}
// //         <div className="lg:col-span-2">
// //           {/* Main Image Gallery */}
// //           <div className="mb-8">
// //             {/* Main Large Image */}
// //             <div className="mb-4">
// //               <img
// //                 src={mainImage}
// //                 alt={property.title}
// //                 className="w-full h-96 object-cover rounded-2xl shadow-lg"
// //               />
// //             </div>
            
// //             {/* Thumbnail Images - Horizontal Scroll */}
// //             {propertyImages.length > 1 && (
// //               <div className="flex space-x-2 overflow-x-auto pb-2">
// //                 {propertyImages.map((image, index) => (
// //                   <div
// //                     key={index}
// //                     className={`flex-shrink-0 cursor-pointer border-2 ${
// //                       selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
// //                     } rounded-lg overflow-hidden`}
// //                     onClick={() => setSelectedImage(index)}
// //                   >
// //                     <img
// //                       src={image}
// //                       alt={`${property.title} ${index + 1}`}
// //                       className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
// //                     />
// //                   </div>
// //                 ))}
// //               </div>
// //             )}

// //             {/* Mobile Reserve Now Button - FIXED */}
// //             {showReserveButton && (
// //               <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
// //                 <button
// //                   onClick={(e) => handleReserve(e)}  
// //                   disabled={loading || !!availabilityError}
// //                   className={`w-full ${
// //                     loading || availabilityError 
// //                       ? 'bg-gray-400 cursor-not-allowed' 
// //                       : 'bg-[#f06123] hover:bg-orange-600'
// //                   } text-[#fcfeff] py-4 rounded-xl font-semibold transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle`}
// //                 >
// //                   <span>Reserve Now</span>
// //                   <span className="text-xl">•</span>
// //                   <span>${property.price}/night</span>
// //                   <svg 
// //                     className="w-5 h-5 ml-1 animate-bounce" 
// //                     fill="none" 
// //                     stroke="currentColor" 
// //                     viewBox="0 0 24 24"
// //                   >
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
// //                   </svg>
// //                 </button>
// //               </div>
// //             )}
// //           </div>

// //           {/* Property Details */}
// //           <div className="space-y-8">
// //             {/* Host Info */}
// //             <div className="border-b border-gray-200 pb-6">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
// //                     Hosted by {hostInfo.name}
// //                   </h2>
// //                   <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
// //                     <span>{specs.guests} guests</span>
// //                     <span>•</span>
// //                     <span>{specs.bedrooms} bedrooms</span>
// //                     <span>•</span>
// //                     <span>{specs.beds} beds</span>
// //                     <span>•</span>
// //                     <span>{specs.bathrooms} bathrooms</span>
// //                     {property.specifications?.squareFeet && (
// //                       <>
// //                         <span>•</span>
// //                         <span>{property.specifications.squareFeet} sq ft</span>
// //                       </>
// //                     )}
// //                   </div>
// //                 </div>
// //                 <img
// //                   src={hostInfo.image}
// //                   alt={hostInfo.name}
// //                   className="w-12 h-12 rounded-full"
// //                 />
// //               </div>
// //             </div>

// //             {/* Description */}
// //             <div className="border-b border-gray-200 pb-6">
// //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
// //               <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
// //             </div>

// //             {/* Amenities - Updated to handle amenity objects */}
// //             {property.amenities && property.amenities.length > 0 && (
// //               <div className="border-b border-gray-200 pb-6">
// //                 <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
// //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                   {property.amenities.map((amenity) => (
// //                     <div key={amenity._id} className="flex items-center">
// //                       <span className="text-[#f06123] mr-3 text-xl">
// //                         {amenity.icon || '✓'}
// //                       </span>
// //                       <div>
// //                         <span className="text-gray-700 text-lg">{amenity.name}</span>
// //                         {amenity.description && (
// //                           <p className="text-sm text-gray-500 mt-1">{amenity.description}</p>
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             )}

// //             {/* House Rules */}
// //             <div className="border-b border-gray-200 pb-6">
// //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
// //               <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
// //                 {defaultRules.map((rule, index) => (
// //                   <li key={index}>{rule}</li>
// //                 ))}
// //               </ul>
// //             </div>

// //             {/* Reviews Section */}
// //             <ReviewsSection
// //               reviews={reviews}
// //               ratingBreakdown={ratingBreakdown}
// //               averageRating={property.rating || 0}
// //               totalReviews={reviews.length}
// //               onAddReview={handleAddReview}
// //               onHelpfulClick={handleHelpfulClick}
// //             />
// //           </div>
// //         </div>

// //         {/* Right Column - Booking Card */}
// //         <div className="lg:col-span-1" ref={bookingCardRef}>
// //           <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
// //             <div className="mb-6">
// //               <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
// //               <span className="text-gray-600 text-lg"> / night</span>
// //             </div>

// //             {/* Booking Form */}
// //             <form onSubmit={(e) => e.preventDefault()}> {/* Prevent form submission */}
// //               <div className="space-y-4">
// //                 {/* Date Picker */}
// //                 <div className="grid grid-cols-2 gap-3">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
// //                     <input
// //                       type="date"
// //                       value={checkIn}
// //                       onChange={(e) => setCheckIn(e.target.value)}
// //                       min={new Date().toISOString().split('T')[0]}
// //                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
// //                     <input
// //                       type="date"
// //                       value={checkOut}
// //                       onChange={(e) => setCheckOut(e.target.value)}
// //                       min={checkIn || new Date().toISOString().split('T')[0]}
// //                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// //                     />
// //                   </div>
// //                 </div>

// //                 {/* Guests */}
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
// //                   <select
// //                     value={guests}
// //                     onChange={(e) => setGuests(Number(e.target.value))}
// //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// //                   >
// //                     {Array.from({ length: specs.guests }, (_, i) => i + 1).map(num => (
// //                       <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
// //                     ))}
// //                   </select>
// //                 </div>

// //                 {/* Availability Error */}
// //                 {availabilityError && (
// //                   <div className="bg-red-50 border border-red-200 rounded-lg p-3">
// //                     <p className="text-red-600 text-sm text-center">{availabilityError}</p>
// //                   </div>
// //                 )}

// //                 {/* Reserve Button - Main */}
// //                 <button 
// //                   type="button" 
// //                   onClick={(e) => handleReserve(e)}
// //                   disabled={loading || !!availabilityError}
// //                   className={`w-full ${
// //                     loading || availabilityError 
// //                       ? 'bg-gray-400 cursor-not-allowed' 
// //                       : 'bg-[#f06123] hover:bg-orange-600'
// //                   } text-[#fcfeff] py-4 rounded-lg font-semibold transition duration-200 text-lg shadow-md`}
// //                 >
// //                   {loading ? (
// //                     <div className="flex items-center justify-center">
// //                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
// //                       Processing...
// //                     </div>
// //                   ) : availabilityError ? (
// //                     'Not Available'
// //                   ) : (
// //                     'Reserve Now'
// //                   )}
// //                 </button>

// //                 {/* Price Breakdown */}
// //                 {totalNights > 0 && (
// //                   <div className="border-t border-gray-200 pt-4 space-y-3">
// //                     <div className="flex justify-between text-gray-700">
// //                       <span>${property.price} x {totalNights} nights</span>
// //                       <span>${totalPrice}</span>
// //                     </div>
// //                     <div className="flex justify-between text-gray-700">
// //                       <span>Service fee</span>
// //                       <span>${(totalPrice * 0.1).toFixed(2)}</span>
// //                     </div>
// //                     <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
// //                       <span>Total</span>
// //                       <span>${(totalPrice * 1.1).toFixed(2)}</span>
// //                     </div>
// //                   </div>
// //                 )}

// //                 <p className="text-center text-gray-600 text-sm mt-4">
// //                   You won't be charged yet
// //                 </p>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Add custom animations to globals.css or use inline styles */}
// //       <style jsx>{`
// //         @keyframes fade-in {
// //           from { opacity: 0; transform: translateY(20px); }
// //           to { opacity: 1; transform: translateY(0); }
// //         }
// //         @keyframes bounce-subtle {
// //           0%, 100% { transform: translateY(0); }
// //           50% { transform: translateY(-5px); }
// //         }
// //         .animate-fade-in {
// //           animation: fade-in 0.3s ease-out;
// //         }
// //         .animate-bounce-subtle {
// //           animation: bounce-subtle 2s infinite;
// //         }
// //         .animate-bounce {
// //           animation: bounce 2s infinite;
// //         }
// //       `}</style>
// //     </div>
// //   );
// // }





















































// // // 'use client';

// // // import { useState, useRef, useEffect } from 'react';
// // // import { useAuth } from '@/contexts/AuthContext';
// // // import { useBooking } from '@/contexts/BookingContext';
// // // import { useRouter } from 'next/navigation';
// // // import ReviewsSection from './ReviewsSection';

// // // interface Amenity {
// // //   _id: string;
// // //   name: string;
// // //   description?: string;
// // //   icon?: string;
// // //   category: string;
// // // }

// // // interface Property {
// // //   _id: string;
// // //   title: string;
// // //   location: string;
// // //   price: number;
// // //   images: Array<{
// // //     url: string;
// // //     isMain: boolean;
// // //     order: number;
// // //   }>;
// // //   rating: number;
// // //   totalBookings: number;
// // //   description: string;
// // //   owner: {
// // //     _id: string;
// // //     firstName: string;
// // //     lastName: string;
// // //     profileImagePath?: string;
// // //     joined?: string;
// // //     rating?: number;
// // //     properties?: number;
// // //   };
// // //   amenities: Amenity[];
// // //   specifications: {
// // //     maxGuests: number;
// // //     bedrooms: number;
// // //     bathrooms: number;
// // //     squareFeet: number;
// // //   };
// // //   type: string;
// // //   status: string;
// // // }

// // // interface Review {
// // //   id: number;
// // //   user: {
// // //     name: string;
// // //     image: string;
// // //   };
// // //   rating: number;
// // //   comment: string;
// // //   date: string;
// // //   helpful: number;
// // // }

// // // interface PropertyDetailsProps {
// // //   property: Property;
// // // }

// // // // Sample reviews data
// // // const sampleReviews: Review[] = [
// // //   {
// // //     id: 1,
// // //     user: {
// // //       name: "Michael Chen",
// // //       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // //     },
// // //     rating: 5,
// // //     comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
// // //     date: "2024-01-15",
// // //     helpful: 12
// // //   },
// // //   {
// // //     id: 2,
// // //     user: {
// // //       name: "Sarah Williams",
// // //       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
// // //     },
// // //     rating: 4,
// // //     comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
// // //     date: "2024-01-10",
// // //     helpful: 8
// // //   },
// // //   {
// // //     id: 3,
// // //     user: {
// // //       name: "David Johnson",
// // //       image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
// // //     },
// // //     rating: 5,
// // //     comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
// // //     date: "2024-01-05",
// // //     helpful: 15
// // //   }
// // // ];

// // // // Default house rules
// // // const defaultRules = [
// // //   "No smoking",
// // //   "No pets",
// // //   "No parties or events",
// // //   "Check-in after 2:00 PM",
// // //   "Check-out before 11:00 AM"
// // // ];

// // // export default function PropertyDetails({ property }: PropertyDetailsProps) {
// // //   const { user } = useAuth();
// // //   const { createBooking, initializePayment, checkAvailability } = useBooking();
// // //   const router = useRouter();
  
// // //   const [selectedImage, setSelectedImage] = useState(0);
// // //   const [checkIn, setCheckIn] = useState('');
// // //   const [checkOut, setCheckOut] = useState('');
// // //   const [guests, setGuests] = useState(1);
// // //   const [reviews, setReviews] = useState<Review[]>(sampleReviews);
// // //   const [showReserveButton, setShowReserveButton] = useState(true);
// // //   const [loading, setLoading] = useState(false);
// // //   const [availabilityError, setAvailabilityError] = useState('');
  
// // //   // Ref for the booking card to scroll to
// // //   const bookingCardRef = useRef<HTMLDivElement>(null);

// // //   // Transform backend data to frontend format
// // //   const propertyImages = property.images?.map(img => img.url) || [];
// // //   const mainImage = property.images?.find(img => img.isMain)?.url || property.images?.[0]?.url || '/default-property.jpg';
  
// // //   const hostInfo = {
// // //     name: `${property.owner?.firstName || 'Host'} ${property.owner?.lastName || ''}`.trim(),
// // //     image: property.owner?.profileImagePath || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
// // //     joined: "2022",
// // //     rating: 4.9,
// // //     properties: 12
// // //   };

// // //   const specs = {
// // //     guests: property.specifications?.maxGuests || 1,
// // //     bedrooms: property.specifications?.bedrooms || 0,
// // //     beds: property.specifications?.bedrooms || 0,
// // //     bathrooms: property.specifications?.bathrooms || 0
// // //   };

// // //   const totalNights = checkIn && checkOut ? 
// // //     Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
// // //   const totalPrice = totalNights * property.price;

// // //   // Calculate rating breakdown
// // //   const ratingBreakdown = {
// // //     5: reviews.filter(r => r.rating === 5).length,
// // //     4: reviews.filter(r => r.rating === 4).length,
// // //     3: reviews.filter(r => r.rating === 3).length,
// // //     2: reviews.filter(r => r.rating === 2).length,
// // //     1: reviews.filter(r => r.rating === 1).length
// // //   };

// // //   const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
// // //     const review: Review = {
// // //       ...newReview,
// // //       id: reviews.length + 1,
// // //       date: new Date().toISOString().split('T')[0],
// // //       helpful: 0
// // //     };
// // //     setReviews([review, ...reviews]);
// // //   };

// // //   const handleHelpfulClick = (reviewId: number) => {
// // //     setReviews(reviews.map(review => 
// // //       review.id === reviewId 
// // //         ? { ...review, helpful: review.helpful + 1 }
// // //         : review
// // //     ));
// // //   };

// // //   // Function to scroll to booking card
// // //   const scrollToBookingCard = () => {
// // //     bookingCardRef.current?.scrollIntoView({ 
// // //       behavior: 'smooth',
// // //       block: 'start'
// // //     });
// // //   };

// // //   // Effect to hide/show reserve button based on scroll position
// // //   useEffect(() => {
// // //     const handleScroll = () => {
// // //       if (bookingCardRef.current) {
// // //         const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
// // //         const buttonHeight = 80;
        
// // //         const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
// // //         setShowReserveButton(!isBookingCardVisible);
// // //       }
// // //     };

// // //     window.addEventListener('scroll', handleScroll);
// // //     handleScroll();

// // //     return () => {
// // //       window.removeEventListener('scroll', handleScroll);
// // //     };
// // //   }, []);

// // //   // Check availability when dates change
// // //   useEffect(() => {
// // //     if (checkIn && checkOut) {
// // //       handleCheckAvailability();
// // //     }
// // //   }, [checkIn, checkOut]);

// // //   // const handleCheckAvailability = async () => {
// // //   //   try {
// // //   //     setAvailabilityError('');
// // //   //     const isAvailable = await checkAvailability(property._id, checkIn, checkOut);
// // //   //     if (!isAvailable) {
// // //   //       setAvailabilityError('Property not available for selected dates');
// // //   //     }
// // //   //   } catch (error: any) {
// // //   //     setAvailabilityError(error.message);
// // //   //   }
// // //   // };

// // //   // In your PropertyDetails component, update the availability check
  
  
// // //   const handleCheckAvailability = async () => {
// // //     try {
// // //       setAvailabilityError('');
// // //       const isAvailable = await checkAvailability(property._id, checkIn, checkOut);
// // //       if (!isAvailable) {
// // //         setAvailabilityError('Property not available for selected dates');
// // //       }
// // //     } catch (error: any) {
// // //       setAvailabilityError(error.message);
// // //     }
// // //   };

// // //   // const handleReserve = async () => {
// // //   //   if (!user) {
// // //   //     router.push('/login');
// // //   //     return;
// // //   //   }

// // //   //   if (!checkIn || !checkOut) {
// // //   //     alert('Please select check-in and check-out dates');
// // //   //     return;
// // //   //   }

// // //   //   if (availabilityError) {
// // //   //     alert(availabilityError);
// // //   //     return;
// // //   //   }

// // //   //   try {
// // //   //     setLoading(true);
      
// // //   //     // Create booking
// // //   //     const bookingData = {
// // //   //       propertyId: property._id,
// // //   //       checkIn,
// // //   //       checkOut,
// // //   //       guests,
// // //   //       specialRequests: ''
// // //   //     };

// // //   //     const bookingResponse = await createBooking(bookingData);
// // //   //     const booking = bookingResponse.booking;

// // //   //     // Initialize payment
// // //   //     const paymentData = await initializePayment(booking._id, user.email);
      
// // //   //     // Redirect to Paystack payment page
// // //   //     window.location.href = paymentData.authorization_url;
      
// // //   //   } catch (error: any) {
// // //   //     console.error('Booking error:', error);
// // //   //     alert(error.message || 'Failed to process booking. Please try again.');
// // //   //   } finally {
// // //   //     setLoading(false);
// // //   //   }
// // //   // };

// // //   // In PropertyDetails component - ensure booking creation works
// // //   const handleReserve = async () => {
// // //     if (!user) {
// // //       router.push('/login');
// // //       return;
// // //     }

// // //     if (!checkIn || !checkOut) {
// // //       alert('Please select check-in and check-out dates');
// // //       return;
// // //     }

// // //     if (availabilityError) {
// // //       alert(availabilityError);
// // //       return;
// // //     }

// // //     try {
// // //       setLoading(true);
      
// // //       // Create booking
// // //       const bookingData = {
// // //         propertyId: property._id,
// // //         checkIn,
// // //         checkOut,
// // //         guests,
// // //         specialRequests: ''
// // //       };

// // //       console.log('Creating booking with data:', bookingData); // Debug log

// // //       const bookingResponse = await createBooking(bookingData);
// // //       const booking = bookingResponse.booking;

// // //       console.log('Booking created:', booking._id); // Debug log

// // //       // Initialize payment
// // //       const paymentData = await initializePayment(booking._id, user.email);
      
// // //       console.log('Payment initialized, redirecting to:', paymentData.authorization_url); // Debug log
      
// // //       // Redirect to Paystack payment page
// // //       window.location.href = paymentData.authorization_url;
      
// // //     } catch (error: any) {
// // //       console.error('Booking error:', error);
// // //       alert(error.message || 'Failed to process booking. Please try again.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   return (
// // //     <div className="max-w-7xl mx-auto px-4 py-8">
// // //       {/* Header */}
// // //       <div className="mb-6">
// // //         <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
// // //         <div className="flex items-center space-x-4 flex-wrap">
// // //           <div className="flex items-center">
// // //             <span className="text-[#f06123]">★</span>
// // //             <span className="ml-1 font-semibold">{property.rating || 'New'}</span>
// // //             <span className="ml-1 text-gray-600">({property.totalBookings || 0} bookings)</span>
// // //           </div>
// // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // //           <span className="text-gray-600 capitalize">{property.type}</span>
// // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // //           <span className="text-gray-600">{property.location}</span>
// // //         </div>
// // //       </div>

// // //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // //         {/* Left Column - Images & Details */}
// // //         <div className="lg:col-span-2">
// // //           {/* Main Image Gallery */}
// // //           <div className="mb-8">
// // //             {/* Main Large Image */}
// // //             <div className="mb-4">
// // //               <img
// // //                 src={mainImage}
// // //                 alt={property.title}
// // //                 className="w-full h-96 object-cover rounded-2xl shadow-lg"
// // //               />
// // //             </div>
            
// // //             {/* Thumbnail Images - Horizontal Scroll */}
// // //             {propertyImages.length > 1 && (
// // //               <div className="flex space-x-2 overflow-x-auto pb-2">
// // //                 {propertyImages.map((image, index) => (
// // //                   <div
// // //                     key={index}
// // //                     className={`flex-shrink-0 cursor-pointer border-2 ${
// // //                       selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
// // //                     } rounded-lg overflow-hidden`}
// // //                     onClick={() => setSelectedImage(index)}
// // //                   >
// // //                     <img
// // //                       src={image}
// // //                       alt={`${property.title} ${index + 1}`}
// // //                       className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
// // //                     />
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}

// // //             {/* Mobile Reserve Now Button */}
// // //             {showReserveButton && (
// // //               <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
// // //                 <button
// // //                   onClick={scrollToBookingCard}
// // //                   className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
// // //                 >
// // //                   <span>Reserve Now</span>
// // //                   <span className="text-xl">•</span>
// // //                   <span>${property.price}/night</span>
// // //                   <svg 
// // //                     className="w-5 h-5 ml-1 animate-bounce" 
// // //                     fill="none" 
// // //                     stroke="currentColor" 
// // //                     viewBox="0 0 24 24"
// // //                   >
// // //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
// // //                   </svg>
// // //                 </button>
// // //               </div>
// // //             )}
// // //           </div>

// // //           {/* Property Details */}
// // //           <div className="space-y-8">
// // //             {/* Host Info */}
// // //             <div className="border-b border-gray-200 pb-6">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
// // //                     Hosted by {hostInfo.name}
// // //                   </h2>
// // //                   <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
// // //                     <span>{specs.guests} guests</span>
// // //                     <span>•</span>
// // //                     <span>{specs.bedrooms} bedrooms</span>
// // //                     <span>•</span>
// // //                     <span>{specs.beds} beds</span>
// // //                     <span>•</span>
// // //                     <span>{specs.bathrooms} bathrooms</span>
// // //                     {property.specifications?.squareFeet && (
// // //                       <>
// // //                         <span>•</span>
// // //                         <span>{property.specifications.squareFeet} sq ft</span>
// // //                       </>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //                 <img
// // //                   src={hostInfo.image}
// // //                   alt={hostInfo.name}
// // //                   className="w-12 h-12 rounded-full"
// // //                 />
// // //               </div>
// // //             </div>

// // //             {/* Description */}
// // //             <div className="border-b border-gray-200 pb-6">
// // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
// // //               <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
// // //             </div>

// // //             {/* Amenities - Updated to handle amenity objects */}
// // //             {property.amenities && property.amenities.length > 0 && (
// // //               <div className="border-b border-gray-200 pb-6">
// // //                 <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
// // //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// // //                   {property.amenities.map((amenity) => (
// // //                     <div key={amenity._id} className="flex items-center">
// // //                       <span className="text-[#f06123] mr-3 text-xl">
// // //                         {amenity.icon || '✓'}
// // //                       </span>
// // //                       <div>
// // //                         <span className="text-gray-700 text-lg">{amenity.name}</span>
// // //                         {amenity.description && (
// // //                           <p className="text-sm text-gray-500 mt-1">{amenity.description}</p>
// // //                         )}
// // //                       </div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               </div>
// // //             )}

// // //             {/* House Rules */}
// // //             <div className="border-b border-gray-200 pb-6">
// // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
// // //               <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
// // //                 {defaultRules.map((rule, index) => (
// // //                   <li key={index}>{rule}</li>
// // //                 ))}
// // //               </ul>
// // //             </div>

// // //             {/* Reviews Section */}
// // //             <ReviewsSection
// // //               reviews={reviews}
// // //               ratingBreakdown={ratingBreakdown}
// // //               averageRating={property.rating || 0}
// // //               totalReviews={reviews.length}
// // //               onAddReview={handleAddReview}
// // //               onHelpfulClick={handleHelpfulClick}
// // //             />
// // //           </div>
// // //         </div>

// // //         {/* Right Column - Booking Card */}
// // //         <div className="lg:col-span-1" ref={bookingCardRef}>
// // //           <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
// // //             <div className="mb-6">
// // //               <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
// // //               <span className="text-gray-600 text-lg"> / night</span>
// // //             </div>

// // //             {/* Booking Form */}
// // //             <div className="space-y-4">
// // //               {/* Date Picker */}
// // //               <div className="grid grid-cols-2 gap-3">
// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
// // //                   <input
// // //                     type="date"
// // //                     value={checkIn}
// // //                     onChange={(e) => setCheckIn(e.target.value)}
// // //                     min={new Date().toISOString().split('T')[0]}
// // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // //                   />
// // //                 </div>
// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
// // //                   <input
// // //                     type="date"
// // //                     value={checkOut}
// // //                     onChange={(e) => setCheckOut(e.target.value)}
// // //                     min={checkIn || new Date().toISOString().split('T')[0]}
// // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // //                   />
// // //                 </div>
// // //               </div>

// // //               {/* Guests */}
// // //               <div>
// // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
// // //                 <select
// // //                   value={guests}
// // //                   onChange={(e) => setGuests(Number(e.target.value))}
// // //                   className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // //                 >
// // //                   {Array.from({ length: specs.guests }, (_, i) => i + 1).map(num => (
// // //                     <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
// // //                   ))}
// // //                 </select>
// // //               </div>

// // //               {/* Availability Error */}
// // //               {availabilityError && (
// // //                 <div className="bg-red-50 border border-red-200 rounded-lg p-3">
// // //                   <p className="text-red-600 text-sm text-center">{availabilityError}</p>
// // //                 </div>
// // //               )}

// // //               {/* Reserve Button */}
// // //               <button 
// // //                 onClick={handleReserve}
// // //                 disabled={loading || !!availabilityError}
// // //                 className={`w-full ${
// // //                   loading || availabilityError 
// // //                     ? 'bg-gray-400 cursor-not-allowed' 
// // //                     : 'bg-[#f06123] hover:bg-orange-600'
// // //                 } text-[#fcfeff] py-4 rounded-lg font-semibold transition duration-200 text-lg shadow-md`}
// // //               >
// // //                 {loading ? (
// // //                   <div className="flex items-center justify-center">
// // //                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
// // //                     Processing...
// // //                   </div>
// // //                 ) : availabilityError ? (
// // //                   'Not Available'
// // //                 ) : (
// // //                   'Reserve Now'
// // //                 )}
// // //               </button>

// // //               {/* Price Breakdown */}
// // //               {totalNights > 0 && (
// // //                 <div className="border-t border-gray-200 pt-4 space-y-3">
// // //                   <div className="flex justify-between text-gray-700">
// // //                     <span>${property.price} x {totalNights} nights</span>
// // //                     <span>${totalPrice}</span>
// // //                   </div>
// // //                   <div className="flex justify-between text-gray-700">
// // //                     <span>Service fee</span>
// // //                     <span>${(totalPrice * 0.1).toFixed(2)}</span>
// // //                   </div>
// // //                   <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
// // //                     <span>Total</span>
// // //                     <span>${(totalPrice * 1.1).toFixed(2)}</span>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               <p className="text-center text-gray-600 text-sm mt-4">
// // //                 You won't be charged yet
// // //               </p>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Add custom animations to globals.css or use inline styles */}
// // //       <style jsx>{`
// // //         @keyframes fade-in {
// // //           from { opacity: 0; transform: translateY(20px); }
// // //           to { opacity: 1; transform: translateY(0); }
// // //         }
// // //         @keyframes bounce-subtle {
// // //           0%, 100% { transform: translateY(0); }
// // //           50% { transform: translateY(-5px); }
// // //         }
// // //         .animate-fade-in {
// // //           animation: fade-in 0.3s ease-out;
// // //         }
// // //         .animate-bounce-subtle {
// // //           animation: bounce-subtle 2s infinite;
// // //         }
// // //         .animate-bounce {
// // //           animation: bounce 2s infinite;
// // //         }
// // //       `}</style>
// // //     </div>
// // //   );
// // // }




























































// // // 'use client';

// // // import { useState, useRef, useEffect } from 'react';
// // // import ReviewsSection from './ReviewsSection';
// // // import { propertiesAPI } from '@/lib/api';

// // // // Update the Amenity interface
// // // interface Amenity {
// // //   _id: string;
// // //   name: string;
// // //   description?: string;
// // //   icon?: string;
// // //   category: string;
// // // }

// // // interface Property {
// // //   _id: string;
// // //   title: string;
// // //   location: string;
// // //   price: number;
// // //   images: Array<{
// // //     url: string;
// // //     isMain: boolean;
// // //     order: number;
// // //   }>;
// // //   rating: number;
// // //   totalBookings: number;
// // //   description: string;
// // //   owner: {
// // //     _id: string;
// // //     firstName: string;
// // //     lastName: string;
// // //     profileImagePath?: string;
// // //     joined?: string;
// // //     rating?: number;
// // //     properties?: number;
// // //   };
// // //   // Change from string[] to Amenity[]
// // //   amenities: Amenity[];
// // //   specifications: {
// // //     maxGuests: number;
// // //     bedrooms: number;
// // //     bathrooms: number;
// // //     squareFeet: number;
// // //   };
// // //   type: string;
// // //   status: string;
// // // }

// // // interface Review {
// // //   id: number;
// // //   user: {
// // //     name: string;
// // //     image: string;
// // //   };
// // //   rating: number;
// // //   comment: string;
// // //   date: string;
// // //   helpful: number;
// // // }

// // // interface PropertyDetailsProps {
// // //   property: Property;
// // // }

// // // // Sample reviews data
// // // const sampleReviews: Review[] = [
// // //   {
// // //     id: 1,
// // //     user: {
// // //       name: "Michael Chen",
// // //       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // //     },
// // //     rating: 5,
// // //     comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
// // //     date: "2024-01-15",
// // //     helpful: 12
// // //   },
// // //   {
// // //     id: 2,
// // //     user: {
// // //       name: "Sarah Williams",
// // //       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
// // //     },
// // //     rating: 4,
// // //     comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
// // //     date: "2024-01-10",
// // //     helpful: 8
// // //   },
// // //   {
// // //     id: 3,
// // //     user: {
// // //       name: "David Johnson",
// // //       image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
// // //     },
// // //     rating: 5,
// // //     comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
// // //     date: "2024-01-05",
// // //     helpful: 15
// // //   }
// // // ];

// // // // Default house rules
// // // const defaultRules = [
// // //   "No smoking",
// // //   "No pets",
// // //   "No parties or events",
// // //   "Check-in after 2:00 PM",
// // //   "Check-out before 11:00 AM"
// // // ];

// // // export default function PropertyDetails({ property }: PropertyDetailsProps) {
// // //   const [selectedImage, setSelectedImage] = useState(0);
// // //   const [checkIn, setCheckIn] = useState('');
// // //   const [checkOut, setCheckOut] = useState('');
// // //   const [guests, setGuests] = useState(1);
// // //   const [reviews, setReviews] = useState<Review[]>(sampleReviews);
// // //   const [showReserveButton, setShowReserveButton] = useState(true);
  
// // //   // Ref for the booking card to scroll to
// // //   const bookingCardRef = useRef<HTMLDivElement>(null);

// // //   // Transform backend data to frontend format
// // //   const propertyImages = property.images?.map(img => img.url) || [];
// // //   const mainImage = property.images?.find(img => img.isMain)?.url || property.images?.[0]?.url || '/default-property.jpg';
  
// // //   const hostInfo = {
// // //     name: `${property.owner?.firstName || 'Host'} ${property.owner?.lastName || ''}`.trim(),
// // //     image: property.owner?.profileImagePath || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
// // //     joined: "2022",
// // //     rating: 4.9,
// // //     properties: 12
// // //   };

// // //   const specs = {
// // //     guests: property.specifications?.maxGuests || 1,
// // //     bedrooms: property.specifications?.bedrooms || 0,
// // //     beds: property.specifications?.bedrooms || 0,
// // //     bathrooms: property.specifications?.bathrooms || 0
// // //   };

// // //   const totalNights = checkIn && checkOut ? 
// // //     Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
// // //   const totalPrice = totalNights * property.price;

// // //   // Calculate rating breakdown
// // //   const ratingBreakdown = {
// // //     5: reviews.filter(r => r.rating === 5).length,
// // //     4: reviews.filter(r => r.rating === 4).length,
// // //     3: reviews.filter(r => r.rating === 3).length,
// // //     2: reviews.filter(r => r.rating === 2).length,
// // //     1: reviews.filter(r => r.rating === 1).length
// // //   };

// // //   const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
// // //     const review: Review = {
// // //       ...newReview,
// // //       id: reviews.length + 1,
// // //       date: new Date().toISOString().split('T')[0],
// // //       helpful: 0
// // //     };
// // //     setReviews([review, ...reviews]);
// // //   };

// // //   const handleHelpfulClick = (reviewId: number) => {
// // //     setReviews(reviews.map(review => 
// // //       review.id === reviewId 
// // //         ? { ...review, helpful: review.helpful + 1 }
// // //         : review
// // //     ));
// // //   };

// // //   // Function to scroll to booking card
// // //   const scrollToBookingCard = () => {
// // //     bookingCardRef.current?.scrollIntoView({ 
// // //       behavior: 'smooth',
// // //       block: 'start'
// // //     });
// // //   };

// // //   // Effect to hide/show reserve button based on scroll position
// // //   useEffect(() => {
// // //     const handleScroll = () => {
// // //       if (bookingCardRef.current) {
// // //         const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
// // //         const buttonHeight = 80;
        
// // //         const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
// // //         setShowReserveButton(!isBookingCardVisible);
// // //       }
// // //     };

// // //     window.addEventListener('scroll', handleScroll);
// // //     handleScroll();

// // //     return () => {
// // //       window.removeEventListener('scroll', handleScroll);
// // //     };
// // //   }, []);

// // //   // Handle reservation
// // //   const handleReserve = async () => {
// // //     if (!checkIn || !checkOut) {
// // //       alert('Please select check-in and check-out dates');
// // //       return;
// // //     }

// // //     try {
// // //       alert(`Reservation request sent for ${property.title} from ${checkIn} to ${checkOut} for ${guests} guests. Total: $${(totalPrice * 1.1).toFixed(2)}`);
      
// // //       setCheckIn('');
// // //       setCheckOut('');
// // //       setGuests(1);
// // //     } catch (error) {
// // //       console.error('Error making reservation:', error);
// // //       alert('Failed to make reservation. Please try again.');
// // //     }
// // //   };

// // //   return (
// // //     <div className="max-w-7xl mx-auto px-4 py-8">
// // //       {/* Header */}
// // //       <div className="mb-6">
// // //         <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
// // //         <div className="flex items-center space-x-4 flex-wrap">
// // //           <div className="flex items-center">
// // //             <span className="text-[#f06123]">★</span>
// // //             <span className="ml-1 font-semibold">{property.rating || 'New'}</span>
// // //             <span className="ml-1 text-gray-600">({property.totalBookings || 0} bookings)</span>
// // //           </div>
// // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // //           <span className="text-gray-600 capitalize">{property.type}</span>
// // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // //           <span className="text-gray-600">{property.location}</span>
// // //         </div>
// // //       </div>

// // //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // //         {/* Left Column - Images & Details */}
// // //         <div className="lg:col-span-2">
// // //           {/* Main Image Gallery */}
// // //           <div className="mb-8">
// // //             {/* Main Large Image */}
// // //             <div className="mb-4">
// // //               <img
// // //                 src={mainImage}
// // //                 alt={property.title}
// // //                 className="w-full h-96 object-cover rounded-2xl shadow-lg"
// // //               />
// // //             </div>
            
// // //             {/* Thumbnail Images - Horizontal Scroll */}
// // //             {propertyImages.length > 1 && (
// // //               <div className="flex space-x-2 overflow-x-auto pb-2">
// // //                 {propertyImages.map((image, index) => (
// // //                   <div
// // //                     key={index}
// // //                     className={`flex-shrink-0 cursor-pointer border-2 ${
// // //                       selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
// // //                     } rounded-lg overflow-hidden`}
// // //                     onClick={() => setSelectedImage(index)}
// // //                   >
// // //                     <img
// // //                       src={image}
// // //                       alt={`${property.title} ${index + 1}`}
// // //                       className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
// // //                     />
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}

// // //             {/* Mobile Reserve Now Button */}
// // //             {showReserveButton && (
// // //               <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
// // //                 <button
// // //                   onClick={scrollToBookingCard}
// // //                   className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
// // //                 >
// // //                   <span>Reserve Now</span>
// // //                   <span className="text-xl">•</span>
// // //                   <span>${property.price}/night</span>
// // //                   <svg 
// // //                     className="w-5 h-5 ml-1 animate-bounce" 
// // //                     fill="none" 
// // //                     stroke="currentColor" 
// // //                     viewBox="0 0 24 24"
// // //                   >
// // //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
// // //                   </svg>
// // //                 </button>
// // //               </div>
// // //             )}
// // //           </div>

// // //           {/* Property Details */}
// // //           <div className="space-y-8">
// // //             {/* Host Info */}
// // //             <div className="border-b border-gray-200 pb-6">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
// // //                     Hosted by {hostInfo.name}
// // //                   </h2>
// // //                   <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
// // //                     <span>{specs.guests} guests</span>
// // //                     <span>•</span>
// // //                     <span>{specs.bedrooms} bedrooms</span>
// // //                     <span>•</span>
// // //                     <span>{specs.beds} beds</span>
// // //                     <span>•</span>
// // //                     <span>{specs.bathrooms} bathrooms</span>
// // //                     {property.specifications?.squareFeet && (
// // //                       <>
// // //                         <span>•</span>
// // //                         <span>{property.specifications.squareFeet} sq ft</span>
// // //                       </>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //                 <img
// // //                   src={hostInfo.image}
// // //                   alt={hostInfo.name}
// // //                   className="w-12 h-12 rounded-full"
// // //                 />
// // //               </div>
// // //             </div>

// // //             {/* Description */}
// // //             <div className="border-b border-gray-200 pb-6">
// // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
// // //               <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
// // //             </div>

// // //             {/* Amenities - Updated to handle amenity objects */}
// // //             {property.amenities && property.amenities.length > 0 && (
// // //               <div className="border-b border-gray-200 pb-6">
// // //                 <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
// // //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// // //                   {property.amenities.map((amenity) => (
// // //                     <div key={amenity._id} className="flex items-center">
// // //                       <span className="text-[#f06123] mr-3 text-xl">
// // //                         {amenity.icon || '✓'}
// // //                       </span>
// // //                       <div>
// // //                         <span className="text-gray-700 text-lg">{amenity.name}</span>
// // //                         {amenity.description && (
// // //                           <p className="text-sm text-gray-500 mt-1">{amenity.description}</p>
// // //                         )}
// // //                       </div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               </div>
// // //             )}

// // //             {/* House Rules */}
// // //             <div className="border-b border-gray-200 pb-6">
// // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
// // //               <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
// // //                 {defaultRules.map((rule, index) => (
// // //                   <li key={index}>{rule}</li>
// // //                 ))}
// // //               </ul>
// // //             </div>

// // //             {/* Reviews Section */}
// // //             <ReviewsSection
// // //               reviews={reviews}
// // //               ratingBreakdown={ratingBreakdown}
// // //               averageRating={property.rating || 0}
// // //               totalReviews={reviews.length}
// // //               onAddReview={handleAddReview}
// // //               onHelpfulClick={handleHelpfulClick}
// // //             />
// // //           </div>
// // //         </div>

// // //         {/* Right Column - Booking Card */}
// // //         <div className="lg:col-span-1" ref={bookingCardRef}>
// // //           <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
// // //             <div className="mb-6">
// // //               <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
// // //               <span className="text-gray-600 text-lg"> / night</span>
// // //             </div>

// // //             {/* Booking Form */}
// // //             <div className="space-y-4">
// // //               {/* Date Picker */}
// // //               <div className="grid grid-cols-2 gap-3">
// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
// // //                   <input
// // //                     type="date"
// // //                     value={checkIn}
// // //                     onChange={(e) => setCheckIn(e.target.value)}
// // //                     min={new Date().toISOString().split('T')[0]}
// // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // //                   />
// // //                 </div>
// // //                 <div>
// // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
// // //                   <input
// // //                     type="date"
// // //                     value={checkOut}
// // //                     onChange={(e) => setCheckOut(e.target.value)}
// // //                     min={checkIn || new Date().toISOString().split('T')[0]}
// // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // //                   />
// // //                 </div>
// // //               </div>

// // //               {/* Guests */}
// // //               <div>
// // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
// // //                 <select
// // //                   value={guests}
// // //                   onChange={(e) => setGuests(Number(e.target.value))}
// // //                   className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // //                 >
// // //                   {Array.from({ length: specs.guests }, (_, i) => i + 1).map(num => (
// // //                     <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
// // //                   ))}
// // //                 </select>
// // //               </div>

// // //               {/* Reserve Button */}
// // //               <button 
// // //                 onClick={handleReserve}
// // //                 className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-md"
// // //               >
// // //                 Reserve
// // //               </button>

// // //               {/* Price Breakdown */}
// // //               {totalNights > 0 && (
// // //                 <div className="border-t border-gray-200 pt-4 space-y-3">
// // //                   <div className="flex justify-between text-gray-700">
// // //                     <span>${property.price} x {totalNights} nights</span>
// // //                     <span>${totalPrice}</span>
// // //                   </div>
// // //                   <div className="flex justify-between text-gray-700">
// // //                     <span>Service fee</span>
// // //                     <span>${(totalPrice * 0.1).toFixed(2)}</span>
// // //                   </div>
// // //                   <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
// // //                     <span>Total</span>
// // //                     <span>${(totalPrice * 1.1).toFixed(2)}</span>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               <p className="text-center text-gray-600 text-sm mt-4">
// // //                 You won't be charged yet
// // //               </p>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Add custom animations to globals.css or use inline styles */}
// // //       <style jsx>{`
// // //         @keyframes fade-in {
// // //           from { opacity: 0; transform: translateY(20px); }
// // //           to { opacity: 1; transform: translateY(0); }
// // //         }
// // //         @keyframes bounce-subtle {
// // //           0%, 100% { transform: translateY(0); }
// // //           50% { transform: translateY(-5px); }
// // //         }
// // //         .animate-fade-in {
// // //           animation: fade-in 0.3s ease-out;
// // //         }
// // //         .animate-bounce-subtle {
// // //           animation: bounce-subtle 2s infinite;
// // //         }
// // //         .animate-bounce {
// // //           animation: bounce 2s infinite;
// // //         }
// // //       `}</style>
// // //     </div>
// // //   );
// // // }











































// // // // 'use client';

// // // // import { useState, useRef, useEffect } from 'react';
// // // // import ReviewsSection from './ReviewsSection';
// // // // import { propertiesAPI } from '@/lib/api';

// // // // interface Property {
// // // //   _id: string;
// // // //   title: string;
// // // //   location: string;
// // // //   price: number;
// // // //   images: Array<{
// // // //     url: string;
// // // //     isMain: boolean;
// // // //     order: number;
// // // //   }>;
// // // //   rating: number;
// // // //   totalBookings: number;
// // // //   description: string;
// // // //   owner: {
// // // //     _id: string;
// // // //     firstName: string;
// // // //     lastName: string;
// // // //     profileImagePath?: string;
// // // //     joined?: string;
// // // //     rating?: number;
// // // //     properties?: number;
// // // //   };
// // // //   amenities: string[];
// // // //   specifications: {
// // // //     maxGuests: number;
// // // //     bedrooms: number;
// // // //     bathrooms: number;
// // // //     squareFeet: number;
// // // //   };
// // // //   type: string;
// // // //   status: string;
// // // // }

// // // // interface Review {
// // // //   id: number;
// // // //   user: {
// // // //     name: string;
// // // //     image: string;
// // // //   };
// // // //   rating: number;
// // // //   comment: string;
// // // //   date: string;
// // // //   helpful: number;
// // // // }

// // // // interface PropertyDetailsProps {
// // // //   property: Property;
// // // // }

// // // // // Sample reviews data (you can replace this with real reviews from your backend)
// // // // const sampleReviews: Review[] = [
// // // //   {
// // // //     id: 1,
// // // //     user: {
// // // //       name: "Michael Chen",
// // // //       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //     },
// // // //     rating: 5,
// // // //     comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
// // // //     date: "2024-01-15",
// // // //     helpful: 12
// // // //   },
// // // //   {
// // // //     id: 2,
// // // //     user: {
// // // //       name: "Sarah Williams",
// // // //       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
// // // //     },
// // // //     rating: 4,
// // // //     comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
// // // //     date: "2024-01-10",
// // // //     helpful: 8
// // // //   },
// // // //   {
// // // //     id: 3,
// // // //     user: {
// // // //       name: "David Johnson",
// // // //       image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
// // // //     },
// // // //     rating: 5,
// // // //     comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
// // // //     date: "2024-01-05",
// // // //     helpful: 15
// // // //   }
// // // // ];

// // // // // Default house rules (you can make these dynamic based on property data)
// // // // const defaultRules = [
// // // //   "No smoking",
// // // //   "No pets",
// // // //   "No parties or events",
// // // //   "Check-in after 2:00 PM",
// // // //   "Check-out before 11:00 AM"
// // // // ];

// // // // export default function PropertyDetails({ property }: PropertyDetailsProps) {
// // // //   const [selectedImage, setSelectedImage] = useState(0);
// // // //   const [checkIn, setCheckIn] = useState('');
// // // //   const [checkOut, setCheckOut] = useState('');
// // // //   const [guests, setGuests] = useState(1);
// // // //   const [reviews, setReviews] = useState<Review[]>(sampleReviews);
// // // //   const [showReserveButton, setShowReserveButton] = useState(true);
  
// // // //   // Ref for the booking card to scroll to
// // // //   const bookingCardRef = useRef<HTMLDivElement>(null);

// // // //   // Transform backend data to frontend format
// // // //   const propertyImages = property.images?.map(img => img.url) || [];
// // // //   const mainImage = property.images?.find(img => img.isMain)?.url || property.images?.[0]?.url || '/default-property.jpg';
  
// // // //   const hostInfo = {
// // // //     name: `${property.owner?.firstName || 'Host'} ${property.owner?.lastName || ''}`.trim(),
// // // //     image: property.owner?.profileImagePath || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
// // // //     joined: "2022", // You might want to add this to your user model
// // // //     rating: 4.9, // You might want to add this to your user model
// // // //     properties: 12 // You might want to calculate this
// // // //   };

// // // //   const specs = {
// // // //     guests: property.specifications?.maxGuests || 1,
// // // //     bedrooms: property.specifications?.bedrooms || 0,
// // // //     beds: property.specifications?.bedrooms || 0, // Using bedrooms as beds count
// // // //     bathrooms: property.specifications?.bathrooms || 0
// // // //   };

// // // //   const totalNights = checkIn && checkOut ? 
// // // //     Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
// // // //   const totalPrice = totalNights * property.price;

// // // //   // Calculate rating breakdown
// // // //   const ratingBreakdown = {
// // // //     5: reviews.filter(r => r.rating === 5).length,
// // // //     4: reviews.filter(r => r.rating === 4).length,
// // // //     3: reviews.filter(r => r.rating === 3).length,
// // // //     2: reviews.filter(r => r.rating === 2).length,
// // // //     1: reviews.filter(r => r.rating === 1).length
// // // //   };

// // // //   const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
// // // //     const review: Review = {
// // // //       ...newReview,
// // // //       id: reviews.length + 1,
// // // //       date: new Date().toISOString().split('T')[0],
// // // //       helpful: 0
// // // //     };
// // // //     setReviews([review, ...reviews]);
// // // //   };

// // // //   const handleHelpfulClick = (reviewId: number) => {
// // // //     setReviews(reviews.map(review => 
// // // //       review.id === reviewId 
// // // //         ? { ...review, helpful: review.helpful + 1 }
// // // //         : review
// // // //     ));
// // // //   };

// // // //   // Function to scroll to booking card
// // // //   const scrollToBookingCard = () => {
// // // //     bookingCardRef.current?.scrollIntoView({ 
// // // //       behavior: 'smooth',
// // // //       block: 'start'
// // // //     });
// // // //   };

// // // //   // Effect to hide/show reserve button based on scroll position
// // // //   useEffect(() => {
// // // //     const handleScroll = () => {
// // // //       if (bookingCardRef.current) {
// // // //         const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
// // // //         const buttonHeight = 80; // Approximate height of the floating button
        
// // // //         // Show button if booking card is not in view (with some threshold)
// // // //         // Hide button when booking card enters the viewport from the bottom
// // // //         const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
        
// // // //         setShowReserveButton(!isBookingCardVisible);
// // // //       }
// // // //     };

// // // //     // Add scroll event listener
// // // //     window.addEventListener('scroll', handleScroll);
    
// // // //     // Check initial position
// // // //     handleScroll();

// // // //     // Cleanup
// // // //     return () => {
// // // //       window.removeEventListener('scroll', handleScroll);
// // // //     };
// // // //   }, []);

// // // //   // Handle reservation
// // // //   const handleReserve = async () => {
// // // //     if (!checkIn || !checkOut) {
// // // //       alert('Please select check-in and check-out dates');
// // // //       return;
// // // //     }

// // // //     try {
// // // //       // Here you would integrate with your booking API
// // // //       // For now, just show a success message
// // // //       alert(`Reservation request sent for ${property.title} from ${checkIn} to ${checkOut} for ${guests} guests. Total: $${(totalPrice * 1.1).toFixed(2)}`);
      
// // // //       // Reset form
// // // //       setCheckIn('');
// // // //       setCheckOut('');
// // // //       setGuests(1);
// // // //     } catch (error) {
// // // //       console.error('Error making reservation:', error);
// // // //       alert('Failed to make reservation. Please try again.');
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className="max-w-7xl mx-auto px-4 py-8">
// // // //       {/* Header */}
// // // //       <div className="mb-6">
// // // //         <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
// // // //         <div className="flex items-center space-x-4 flex-wrap">
// // // //           <div className="flex items-center">
// // // //             <span className="text-[#f06123]">★</span>
// // // //             <span className="ml-1 font-semibold">{property.rating || 'New'}</span>
// // // //             <span className="ml-1 text-gray-600">({property.totalBookings || 0} bookings)</span>
// // // //           </div>
// // // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // // //           <span className="text-gray-600 capitalize">{property.type}</span>
// // // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // // //           <span className="text-gray-600">{property.location}</span>
// // // //         </div>
// // // //       </div>

// // // //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // // //         {/* Left Column - Images & Details */}
// // // //         <div className="lg:col-span-2">
// // // //           {/* Main Image Gallery */}
// // // //           <div className="mb-8">
// // // //             {/* Main Large Image */}
// // // //             <div className="mb-4">
// // // //               <img
// // // //                 src={mainImage}
// // // //                 alt={property.title}
// // // //                 className="w-full h-96 object-cover rounded-2xl shadow-lg"
// // // //               />
// // // //             </div>
            
// // // //             {/* Thumbnail Images - Horizontal Scroll */}
// // // //             {propertyImages.length > 1 && (
// // // //               <div className="flex space-x-2 overflow-x-auto pb-2">
// // // //                 {propertyImages.map((image, index) => (
// // // //                   <div
// // // //                     key={index}
// // // //                     className={`flex-shrink-0 cursor-pointer border-2 ${
// // // //                       selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
// // // //                     } rounded-lg overflow-hidden`}
// // // //                     onClick={() => setSelectedImage(index)}
// // // //                   >
// // // //                     <img
// // // //                       src={image}
// // // //                       alt={`${property.title} ${index + 1}`}
// // // //                       className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
// // // //                     />
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}

// // // //             {/* Mobile Reserve Now Button - Only visible on mobile and when booking card is not in view */}
// // // //             {showReserveButton && (
// // // //               <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
// // // //                 <button
// // // //                   onClick={scrollToBookingCard}
// // // //                   className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
// // // //                 >
// // // //                   <span>Reserve Now</span>
// // // //                   <span className="text-xl">•</span>
// // // //                   <span>${property.price}/night</span>
// // // //                   <svg 
// // // //                     className="w-5 h-5 ml-1 animate-bounce" 
// // // //                     fill="none" 
// // // //                     stroke="currentColor" 
// // // //                     viewBox="0 0 24 24"
// // // //                   >
// // // //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
// // // //                   </svg>
// // // //                 </button>
// // // //               </div>
// // // //             )}
// // // //           </div>

// // // //           {/* Property Details */}
// // // //           <div className="space-y-8">
// // // //             {/* Host Info */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <div className="flex items-center justify-between">
// // // //                 <div>
// // // //                   <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
// // // //                     Hosted by {hostInfo.name}
// // // //                   </h2>
// // // //                   <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
// // // //                     <span>{specs.guests} guests</span>
// // // //                     <span>•</span>
// // // //                     <span>{specs.bedrooms} bedrooms</span>
// // // //                     <span>•</span>
// // // //                     <span>{specs.beds} beds</span>
// // // //                     <span>•</span>
// // // //                     <span>{specs.bathrooms} bathrooms</span>
// // // //                     {property.specifications?.squareFeet && (
// // // //                       <>
// // // //                         <span>•</span>
// // // //                         <span>{property.specifications.squareFeet} sq ft</span>
// // // //                       </>
// // // //                     )}
// // // //                   </div>
// // // //                 </div>
// // // //                 <img
// // // //                   src={hostInfo.image}
// // // //                   alt={hostInfo.name}
// // // //                   className="w-12 h-12 rounded-full"
// // // //                 />
// // // //               </div>
// // // //             </div>

// // // //             {/* Description */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
// // // //               <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
// // // //             </div>

// // // //             {/* Amenities */}
// // // //             {property.amenities && property.amenities.length > 0 && (
// // // //               <div className="border-b border-gray-200 pb-6">
// // // //                 <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
// // // //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// // // //                   {property.amenities.map((amenity, index) => (
// // // //                     <div key={index} className="flex items-center">
// // // //                       <span className="text-[#f06123] mr-3 text-xl">✓</span>
// // // //                       <span className="text-gray-700 text-lg">{amenity}</span>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //               </div>
// // // //             )}

// // // //             {/* House Rules */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
// // // //               <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
// // // //                 {defaultRules.map((rule, index) => (
// // // //                   <li key={index}>{rule}</li>
// // // //                 ))}
// // // //               </ul>
// // // //             </div>

// // // //             {/* Reviews Section */}
// // // //             <ReviewsSection
// // // //               reviews={reviews}
// // // //               ratingBreakdown={ratingBreakdown}
// // // //               averageRating={property.rating || 0}
// // // //               totalReviews={reviews.length}
// // // //               onAddReview={handleAddReview}
// // // //               onHelpfulClick={handleHelpfulClick}
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         {/* Right Column - Booking Card */}
// // // //         <div className="lg:col-span-1" ref={bookingCardRef}>
// // // //           <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
// // // //             <div className="mb-6">
// // // //               <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
// // // //               <span className="text-gray-600 text-lg"> / night</span>
// // // //             </div>

// // // //             {/* Booking Form */}
// // // //             <div className="space-y-4">
// // // //               {/* Date Picker */}
// // // //               <div className="grid grid-cols-2 gap-3">
// // // //                 <div>
// // // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
// // // //                   <input
// // // //                     type="date"
// // // //                     value={checkIn}
// // // //                     onChange={(e) => setCheckIn(e.target.value)}
// // // //                     min={new Date().toISOString().split('T')[0]}
// // // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //                   />
// // // //                 </div>
// // // //                 <div>
// // // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
// // // //                   <input
// // // //                     type="date"
// // // //                     value={checkOut}
// // // //                     onChange={(e) => setCheckOut(e.target.value)}
// // // //                     min={checkIn || new Date().toISOString().split('T')[0]}
// // // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //                   />
// // // //                 </div>
// // // //               </div>

// // // //               {/* Guests */}
// // // //               <div>
// // // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
// // // //                 <select
// // // //                   value={guests}
// // // //                   onChange={(e) => setGuests(Number(e.target.value))}
// // // //                   className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //                 >
// // // //                   {Array.from({ length: specs.guests }, (_, i) => i + 1).map(num => (
// // // //                     <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
// // // //                   ))}
// // // //                 </select>
// // // //               </div>

// // // //               {/* Reserve Button */}
// // // //               <button 
// // // //                 onClick={handleReserve}
// // // //                 className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-md"
// // // //               >
// // // //                 Reserve
// // // //               </button>

// // // //               {/* Price Breakdown */}
// // // //               {totalNights > 0 && (
// // // //                 <div className="border-t border-gray-200 pt-4 space-y-3">
// // // //                   <div className="flex justify-between text-gray-700">
// // // //                     <span>${property.price} x {totalNights} nights</span>
// // // //                     <span>${totalPrice}</span>
// // // //                   </div>
// // // //                   <div className="flex justify-between text-gray-700">
// // // //                     <span>Service fee</span>
// // // //                     <span>${(totalPrice * 0.1).toFixed(2)}</span>
// // // //                   </div>
// // // //                   <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
// // // //                     <span>Total</span>
// // // //                     <span>${(totalPrice * 1.1).toFixed(2)}</span>
// // // //                   </div>
// // // //                 </div>
// // // //               )}

// // // //               <p className="text-center text-gray-600 text-sm mt-4">
// // // //                 You won't be charged yet
// // // //               </p>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Add custom animations to globals.css or use inline styles */}
// // // //       <style jsx>{`
// // // //         @keyframes fade-in {
// // // //           from { opacity: 0; transform: translateY(20px); }
// // // //           to { opacity: 1; transform: translateY(0); }
// // // //         }
// // // //         @keyframes bounce-subtle {
// // // //           0%, 100% { transform: translateY(0); }
// // // //           50% { transform: translateY(-5px); }
// // // //         }
// // // //         .animate-fade-in {
// // // //           animation: fade-in 0.3s ease-out;
// // // //         }
// // // //         .animate-bounce-subtle {
// // // //           animation: bounce-subtle 2s infinite;
// // // //         }
// // // //         .animate-bounce {
// // // //           animation: bounce 2s infinite;
// // // //         }
// // // //       `}</style>
// // // //     </div>
// // // //   );
// // // // }





































































// // // // 'use client';

// // // // import { useState, useRef, useEffect } from 'react';
// // // // import ReviewsSection from './ReviewsSection';

// // // // interface Property {
// // // //   id: number;
// // // //   title: string;
// // // //   location: string;
// // // //   price: number;
// // // //   images: string[];
// // // //   rating: number;
// // // //   reviews: number;
// // // //   description: string;
// // // //   host: {
// // // //     name: string;
// // // //     joined: string;
// // // //     rating: number;
// // // //     properties: number;
// // // //     image: string;
// // // //   };
// // // //   amenities: string[];
// // // //   specs: {
// // // //     guests: number;
// // // //     bedrooms: number;
// // // //     beds: number;
// // // //     bathrooms: number;
// // // //   };
// // // //   rules: string[];
// // // // }

// // // // interface Review {
// // // //   id: number;
// // // //   user: {
// // // //     name: string;
// // // //     image: string;
// // // //   };
// // // //   rating: number;
// // // //   comment: string;
// // // //   date: string;
// // // //   helpful: number;
// // // // }

// // // // interface PropertyDetailsProps {
// // // //   property: Property;
// // // // }

// // // // // Sample reviews data
// // // // const sampleReviews: Review[] = [
// // // //   {
// // // //     id: 1,
// // // //     user: {
// // // //       name: "Michael Chen",
// // // //       image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
// // // //     },
// // // //     rating: 5,
// // // //     comment: "Amazing apartment! The location was perfect and the host was very responsive. The apartment was clean and had everything we needed for our stay. Would definitely book again!",
// // // //     date: "2024-01-15",
// // // //     helpful: 12
// // // //   },
// // // //   {
// // // //     id: 2,
// // // //     user: {
// // // //       name: "Sarah Williams",
// // // //       image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150"
// // // //     },
// // // //     rating: 4,
// // // //     comment: "Great value for money. The apartment was spacious and well-maintained. The pool and gym facilities were excellent. Only minor issue was the Wi-Fi was a bit slow in the evenings.",
// // // //     date: "2024-01-10",
// // // //     helpful: 8
// // // //   },
// // // //   {
// // // //     id: 3,
// // // //     user: {
// // // //       name: "David Johnson",
// // // //       image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
// // // //     },
// // // //     rating: 5,
// // // //     comment: "Perfect stay! The apartment exceeded our expectations. The view was stunning and everything was exactly as described. Host was very helpful with local recommendations.",
// // // //     date: "2024-01-05",
// // // //     helpful: 15
// // // //   }
// // // // ];

// // // // export default function PropertyDetails({ property }: PropertyDetailsProps) {
// // // //   const [selectedImage, setSelectedImage] = useState(0);
// // // //   const [checkIn, setCheckIn] = useState('');
// // // //   const [checkOut, setCheckOut] = useState('');
// // // //   const [guests, setGuests] = useState(1);
// // // //   const [reviews, setReviews] = useState<Review[]>(sampleReviews);
// // // //   const [showReserveButton, setShowReserveButton] = useState(true);
  
// // // //   // Ref for the booking card to scroll to
// // // //   const bookingCardRef = useRef<HTMLDivElement>(null);

// // // //   const totalNights = checkIn && checkOut ? 
// // // //     Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
// // // //   const totalPrice = totalNights * property.price;

// // // //   // Calculate rating breakdown
// // // //   const ratingBreakdown = {
// // // //     5: reviews.filter(r => r.rating === 5).length,
// // // //     4: reviews.filter(r => r.rating === 4).length,
// // // //     3: reviews.filter(r => r.rating === 3).length,
// // // //     2: reviews.filter(r => r.rating === 2).length,
// // // //     1: reviews.filter(r => r.rating === 1).length
// // // //   };

// // // //   const handleAddReview = (newReview: Omit<Review, 'id' | 'helpful' | 'date'>) => {
// // // //     const review: Review = {
// // // //       ...newReview,
// // // //       id: reviews.length + 1,
// // // //       date: new Date().toISOString().split('T')[0],
// // // //       helpful: 0
// // // //     };
// // // //     setReviews([review, ...reviews]);
// // // //   };

// // // //   const handleHelpfulClick = (reviewId: number) => {
// // // //     setReviews(reviews.map(review => 
// // // //       review.id === reviewId 
// // // //         ? { ...review, helpful: review.helpful + 1 }
// // // //         : review
// // // //     ));
// // // //   };

// // // //   // Function to scroll to booking card
// // // //   const scrollToBookingCard = () => {
// // // //     bookingCardRef.current?.scrollIntoView({ 
// // // //       behavior: 'smooth',
// // // //       block: 'start'
// // // //     });
// // // //   };

// // // //   // Effect to hide/show reserve button based on scroll position
// // // //   useEffect(() => {
// // // //     const handleScroll = () => {
// // // //       if (bookingCardRef.current) {
// // // //         const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
// // // //         const buttonHeight = 80; // Approximate height of the floating button
        
// // // //         // Show button if booking card is not in view (with some threshold)
// // // //         // Hide button when booking card enters the viewport from the bottom
// // // //         const isBookingCardVisible = bookingCardRect.top < window.innerHeight - buttonHeight;
        
// // // //         setShowReserveButton(!isBookingCardVisible);
// // // //       }
// // // //     };

// // // //     // Add scroll event listener
// // // //     window.addEventListener('scroll', handleScroll);
    
// // // //     // Check initial position
// // // //     handleScroll();

// // // //     // Cleanup
// // // //     return () => {
// // // //       window.removeEventListener('scroll', handleScroll);
// // // //     };
// // // //   }, []);

// // // //   return (
// // // //     <div className="max-w-7xl mx-auto px-4 py-8">
// // // //       {/* Header */}
// // // //       <div className="mb-6">
// // // //         <h1 className="text-3xl font-bold text-[#383a3c] mb-2">{property.title}</h1>
// // // //         <div className="flex items-center space-x-4 flex-wrap">
// // // //           <div className="flex items-center">
// // // //             <span className="text-[#f06123]">★</span>
// // // //             <span className="ml-1 font-semibold">{property.rating}</span>
// // // //             <span className="ml-1 text-gray-600">({property.reviews} reviews)</span>
// // // //           </div>
// // // //           <span className="text-gray-600 hidden sm:inline">•</span>
// // // //           <span className="text-gray-600">{property.location}</span>
// // // //         </div>
// // // //       </div>

// // // //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// // // //         {/* Left Column - Images & Details */}
// // // //         <div className="lg:col-span-2">
// // // //           {/* Main Image Gallery */}
// // // //           <div className="mb-8">
// // // //             {/* Main Large Image */}
// // // //             <div className="mb-4">
// // // //               <img
// // // //                 src={property.images[selectedImage]}
// // // //                 alt={property.title}
// // // //                 className="w-full h-96 object-cover rounded-2xl shadow-lg"
// // // //               />
// // // //             </div>
            
// // // //             {/* Thumbnail Images - Horizontal Scroll */}
// // // //             <div className="flex space-x-2 overflow-x-auto pb-2">
// // // //               {property.images.map((image, index) => (
// // // //                 <div
// // // //                   key={index}
// // // //                   className={`flex-shrink-0 cursor-pointer border-2 ${
// // // //                     selectedImage === index ? 'border-[#f06123]' : 'border-transparent'
// // // //                   } rounded-lg overflow-hidden`}
// // // //                   onClick={() => setSelectedImage(index)}
// // // //                 >
// // // //                   <img
// // // //                     src={image}
// // // //                     alt={`${property.title} ${index + 1}`}
// // // //                     className="w-20 h-16 object-cover hover:opacity-90 transition-opacity"
// // // //                   />
// // // //                 </div>
// // // //               ))}
// // // //             </div>

// // // //             {/* Mobile Reserve Now Button - Only visible on mobile and when booking card is not in view */}
// // // //             {showReserveButton && (
// // // //               <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-fade-in">
// // // //                 <button
// // // //                   onClick={scrollToBookingCard}
// // // //                   className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-lg flex items-center justify-center space-x-2 animate-bounce-subtle"
// // // //                 >
// // // //                   <span>Reserve Now</span>
// // // //                   <span className="text-xl">•</span>
// // // //                   <span>${property.price}/night</span>
// // // //                   <svg 
// // // //                     className="w-5 h-5 ml-1 animate-bounce" 
// // // //                     fill="none" 
// // // //                     stroke="currentColor" 
// // // //                     viewBox="0 0 24 24"
// // // //                   >
// // // //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
// // // //                   </svg>
// // // //                 </button>
// // // //               </div>
// // // //             )}
// // // //           </div>

// // // //           {/* Property Details */}
// // // //           <div className="space-y-8">
// // // //             {/* Host Info */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <div className="flex items-center justify-between">
// // // //                 <div>
// // // //                   <h2 className="text-xl font-semibold text-[#383a3c] mb-2">
// // // //                     Hosted by {property.host.name}
// // // //                   </h2>
// // // //                   <div className="flex items-center space-x-4 text-gray-600 flex-wrap gap-2">
// // // //                     <span>{property.specs.guests} guests</span>
// // // //                     <span>•</span>
// // // //                     <span>{property.specs.bedrooms} bedrooms</span>
// // // //                     <span>•</span>
// // // //                     <span>{property.specs.beds} beds</span>
// // // //                     <span>•</span>
// // // //                     <span>{property.specs.bathrooms} bathrooms</span>
// // // //                   </div>
// // // //                 </div>
// // // //                 <img
// // // //                   src={property.host.image}
// // // //                   alt={property.host.name}
// // // //                   className="w-12 h-12 rounded-full"
// // // //                 />
// // // //               </div>
// // // //             </div>

// // // //             {/* Description */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">About this place</h3>
// // // //               <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
// // // //             </div>

// // // //             {/* Amenities */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">What this place offers</h3>
// // // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// // // //                 {property.amenities.map((amenity, index) => (
// // // //                   <div key={index} className="flex items-center">
// // // //                     <span className="text-[#f06123] mr-3 text-xl">✓</span>
// // // //                     <span className="text-gray-700 text-lg">{amenity}</span>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             </div>

// // // //             {/* House Rules */}
// // // //             <div className="border-b border-gray-200 pb-6">
// // // //               <h3 className="text-xl font-semibold text-[#383a3c] mb-4">House Rules</h3>
// // // //               <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
// // // //                 {property.rules.map((rule, index) => (
// // // //                   <li key={index}>{rule}</li>
// // // //                 ))}
// // // //               </ul>
// // // //             </div>

// // // //             {/* Reviews Section */}
// // // //             <ReviewsSection
// // // //               reviews={reviews}
// // // //               ratingBreakdown={ratingBreakdown}
// // // //               averageRating={property.rating}
// // // //               totalReviews={property.reviews}
// // // //               onAddReview={handleAddReview}
// // // //               onHelpfulClick={handleHelpfulClick}
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         {/* Right Column - Booking Card */}
// // // //         <div className="lg:col-span-1" ref={bookingCardRef}>
// // // //           <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-xl bg-white">
// // // //             <div className="mb-6">
// // // //               <span className="text-3xl font-bold text-[#383a3c]">${property.price}</span>
// // // //               <span className="text-gray-600 text-lg"> / night</span>
// // // //             </div>

// // // //             {/* Booking Form */}
// // // //             <div className="space-y-4">
// // // //               {/* Date Picker */}
// // // //               <div className="grid grid-cols-2 gap-3">
// // // //                 <div>
// // // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
// // // //                   <input
// // // //                     type="date"
// // // //                     value={checkIn}
// // // //                     onChange={(e) => setCheckIn(e.target.value)}
// // // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //                   />
// // // //                 </div>
// // // //                 <div>
// // // //                   <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
// // // //                   <input
// // // //                     type="date"
// // // //                     value={checkOut}
// // // //                     onChange={(e) => setCheckOut(e.target.value)}
// // // //                     className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //                   />
// // // //                 </div>
// // // //               </div>

// // // //               {/* Guests */}
// // // //               <div>
// // // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
// // // //                 <select
// // // //                   value={guests}
// // // //                   onChange={(e) => setGuests(Number(e.target.value))}
// // // //                   className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
// // // //                 >
// // // //                   {[1, 2, 3, 4, 5, 6].map(num => (
// // // //                     <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
// // // //                   ))}
// // // //                 </select>
// // // //               </div>

// // // //               {/* Reserve Button */}
// // // //               <button className="w-full bg-[#f06123] text-[#fcfeff] py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-lg shadow-md">
// // // //                 Reserve
// // // //               </button>

// // // //               {/* Price Breakdown */}
// // // //               {totalNights > 0 && (
// // // //                 <div className="border-t border-gray-200 pt-4 space-y-3">
// // // //                   <div className="flex justify-between text-gray-700">
// // // //                     <span>${property.price} x {totalNights} nights</span>
// // // //                     <span>${totalPrice}</span>
// // // //                   </div>
// // // //                   <div className="flex justify-between text-gray-700">
// // // //                     <span>Service fee</span>
// // // //                     <span>${(totalPrice * 0.1).toFixed(2)}</span>
// // // //                   </div>
// // // //                   <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
// // // //                     <span>Total</span>
// // // //                     <span>${(totalPrice * 1.1).toFixed(2)}</span>
// // // //                   </div>
// // // //                 </div>
// // // //               )}

// // // //               <p className="text-center text-gray-600 text-sm mt-4">
// // // //                 You won't be charged yet
// // // //               </p>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Add custom animations to globals.css or use inline styles */}
// // // //       <style jsx>{`
// // // //         @keyframes fade-in {
// // // //           from { opacity: 0; transform: translateY(20px); }
// // // //           to { opacity: 1; transform: translateY(0); }
// // // //         }
// // // //         @keyframes bounce-subtle {
// // // //           0%, 100% { transform: translateY(0); }
// // // //           50% { transform: translateY(-5px); }
// // // //         }
// // // //         .animate-fade-in {
// // // //           animation: fade-in 0.3s ease-out;
// // // //         }
// // // //         .animate-bounce-subtle {
// // // //           animation: bounce-subtle 2s infinite;
// // // //         }
// // // //         .animate-bounce {
// // // //           animation: bounce 2s infinite;
// // // //         }
// // // //       `}</style>
// // // //     </div>
// // // //   );
// // // // }


