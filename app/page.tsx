'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PropertyCard from "@/components/PropertyCard";
import { propertiesAPI } from '@/lib/api';

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
  type: string;
  specifications: {
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
  };
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('all');
  const router = useRouter();
  
  // Ref for scrolling to properties section
  const propertiesSectionRef = useRef<HTMLDivElement>(null);
  
  // Hero slider states
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hero images data
  const heroImages = [
    { id: 1, src: '/images/hero1.jpg', alt: 'Luxury apartment interior' },
    { id: 2, src: '/images/hero2.jpg', alt: 'Modern living room' },
    { id: 3, src: '/images/hero3.jpg', alt: 'Beautiful bedroom' },
    { id: 4, src: '/images/hero4.jpg', alt: 'Stylish kitchen' },
    { id: 5, src: '/images/hero5.jpg', alt: 'Cozy studio' }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const startAutoSlide = () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
      
      slideIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, 5000);
    };
    
    startAutoSlide();
    
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [heroImages.length]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '' && activeCategory === 'all') {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property => {
        const matchesSearch = searchQuery === '' || 
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.type.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = activeCategory === 'all' || property.type === activeCategory;
        
        return matchesSearch && matchesCategory;
      });
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties, activeCategory]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 [Home Page] Fetching properties...');
      let propertiesData;
      
      try {
        propertiesData = await propertiesAPI.getProperties({ 
          limit: 12, 
          status: 'active' 
        });
        console.log('✅ [Home Page] Properties data received:', {
          count: propertiesData.length,
          firstProperty: propertiesData[0]
        });
      } catch (apiError: any) {
        console.error('❌ [Home Page] API error:', apiError);
        propertiesData = [];
      }
      
      // Ensure propertiesData is always an array
      const validProperties = Array.isArray(propertiesData) ? propertiesData : [];
      
      console.log('📊 [Home Page] Valid properties count:', validProperties.length);
      
      if (validProperties.length > 0) {
        setProperties(validProperties);
        setFilteredProperties(validProperties);
        setFeaturedProperties(validProperties.slice(0, 6));
      } else {
        console.log('⚠️ [Home Page] No properties received, using sample data');
        const sampleProperties = getSampleProperties();
        setProperties(sampleProperties);
        setFilteredProperties(sampleProperties);
        setFeaturedProperties(sampleProperties.slice(0, 6));
      }
      
    } catch (error: any) {
      console.error('💥 [Home Page] Error in fetchProperties:', error);
      setError('Failed to load properties');
      const sampleProperties = getSampleProperties();
      setProperties(sampleProperties);
      setFilteredProperties(sampleProperties);
      setFeaturedProperties(sampleProperties.slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  // Sample data fallback
  const getSampleProperties = (): Property[] => [
    {
      _id: '1',
      title: "Luxury Apartment in City Center",
      location: "Lagos, Nigeria",
      price: 120,
      images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", isMain: true, order: 0 }],
      rating: 4.8,
      type: "apartment",
      specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
    },
    {
      _id: '2',
      title: "Beachfront Villa",
      location: "Victoria Island, Lagos",
      price: 200,
      images: [{ url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400", isMain: true, order: 0 }],
      rating: 4.9,
      type: "villa",
      specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
    },
    {
      _id: '3',
      title: "Cozy Studio Apartment",
      location: "Ikeja, Lagos",
      price: 75,
      images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", isMain: true, order: 0 }],
      rating: 4.5,
      type: "studio",
      specifications: { bedrooms: 1, bathrooms: 1, maxGuests: 2 }
    },
    {
      _id: '4',
      title: "Modern Penthouse Suite",
      location: "Lekki, Lagos",
      price: 300,
      images: [{ url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400", isMain: true, order: 0 }],
      rating: 4.9,
      type: "penthouse",
      specifications: { bedrooms: 4, bathrooms: 3, maxGuests: 8 }
    },
    {
      _id: '5',
      title: "Seaside Cottage",
      location: "Badagry, Lagos",
      price: 150,
      images: [{ url: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400", isMain: true, order: 0 }],
      rating: 4.7,
      type: "cottage",
      specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
    },
    {
      _id: '6',
      title: "Executive Business Apartment",
      location: "Ikoyi, Lagos",
      price: 180,
      images: [{ url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", isMain: true, order: 0 }],
      rating: 4.8,
      type: "apartment",
      specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    setTimeout(() => {
      if (window.innerWidth < 768 && propertiesSectionRef.current) {
        propertiesSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Hero slider navigation
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Reset auto-slide timer
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
  };

  const goToPrevSlide = () => {
    const newIndex = currentSlide === 0 ? heroImages.length - 1 : currentSlide - 1;
    goToSlide(newIndex);
  };

  const goToNextSlide = () => {
    const newIndex = (currentSlide + 1) % heroImages.length;
    goToSlide(newIndex);
  };

  const propertyTypes = [
    { id: 'all', name: 'All Properties', icon: '🏠' },
    { id: 'apartment', name: 'Apartments', icon: '🏢' },
    { id: 'villa', name: 'Villas', icon: '🏡' },
    { id: 'studio', name: 'Studios', icon: '🎨' },
    { id: 'penthouse', name: 'Penthouses', icon: '🏙️' },
    { id: 'cottage', name: 'Cottages', icon: '🌲' }
  ];

  const features = [
    {
      icon: '🔒',
      title: 'Secure Booking',
      description: 'Your safety and privacy are our top priorities'
    },
    {
      icon: '⭐',
      title: 'Verified Properties',
      description: 'All properties are carefully inspected and verified'
    },
    {
      icon: '💬',
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your needs'
    },
    {
      icon: '💰',
      title: 'Best Prices',
      description: 'Competitive pricing with no hidden fees'
    }
  ];

  const stats = [
    { number: '500+', label: 'Properties' },
    { number: '10K+', label: 'Happy Guests' },
    { number: '50+', label: 'Locations' },
    { number: '4.8', label: 'Average Rating' }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section with Slider */}
      <section className="relative overflow-hidden">
        <div className="relative h-[70vh] md:h-[85vh]">
          {/* Background Images with Fade Transition */}
          <div className="absolute inset-0">
            {heroImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                style={{
                  transition: 'opacity 1000ms ease-in-out',
                }}
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${image.src}')` }}
                >
                  {/* Dark Overlay for Better Text Visibility */}
                  <div className="absolute inset-0 bg-black/50 md:bg-black/40"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Content Container */}
          <div className="relative h-full flex items-center z-20">
            <div className="container mx-auto px-4 text-center relative z-10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white">
                Find Your Perfect
                <span className="text-[#f06123] block">Shortlet Stay</span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-6 text-white/90 max-w-2xl mx-auto">
                Discover amazing apartments, villas, and unique stays for your next adventure with Hols Apartments
              </p>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl mb-6">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Browse properties from Hols Apartments"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 md:px-6 py-3 md:py-4 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base md:text-lg"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-[#f06123] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-2 text-base md:text-lg"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Quick Stats - All White Text */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-white">{stat.number}</div>
                    <div className="text-xs md:text-sm text-white/90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-30 hidden md:block"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full transition-all duration-200 z-30 hidden md:block"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Dots Navigation */}
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-[#f06123] scale-125' 
                    : 'bg-white/70 hover:bg-white'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Mobile Navigation Arrows */}
          <div className="md:hidden absolute bottom-6 right-4 flex space-x-2 z-30">
            <button
              onClick={goToPrevSlide}
              className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-200"
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextSlide}
              className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-200"
              aria-label="Next slide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Why Choose Hols Apartments?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 md:p-6 rounded-2xl hover:shadow-lg transition duration-300">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{feature.icon}</div>
                <h3 className="text-lg md:text-xl font-semibold text-[#383a3c] mb-2">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Categories */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
            {propertyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleCategoryClick(type.id)}
                className={`flex items-center space-x-2 px-4 md:px-6 py-3 rounded-full font-semibold transition duration-200 text-sm md:text-base ${
                  activeCategory === type.id
                    ? 'bg-[#f06123] text-white'
                    : 'bg-white text-[#383a3c] hover:bg-gray-100'
                }`}
              >
                <span className="text-lg md:text-xl">{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section ref={propertiesSectionRef} className="container mx-auto px-4 py-12 md:py-16 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c]">Featured Properties</h2>
            <p className="text-gray-600 mt-2">Handpicked selections for your perfect stay</p>
          </div>
          <button
            onClick={() => router.push('/propertylist')}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center space-x-2"
          >
            <span>View All Properties</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchProperties}
              className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
            >
              Retry
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              {searchQuery || activeCategory !== 'all' 
                ? 'No properties found matching your criteria.' 
                : 'No properties available at the moment.'
              }
            </p>
            {(searchQuery || activeCategory !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {(searchQuery || activeCategory !== 'all') && (
              <p className="text-center text-gray-600 mb-6 md:mb-8">
                Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} 
                {searchQuery && ` for "${searchQuery}"`}
                {activeCategory !== 'all' && ` in ${propertyTypes.find(t => t.id === activeCategory)?.name}`}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProperties.slice(0, 6).map((property) => (
                <PropertyCard
                  key={property._id}
                  id={property._id}
                  title={property.title}
                  location={property.location}
                  price={property.price}
                  image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
                  rating={property.rating}
                  bedrooms={property.specifications?.bedrooms}
                  bathrooms={property.specifications?.bathrooms}
                  maxGuests={property.specifications?.maxGuests}
                  type={property.type}
                />
              ))}
            </div>
            
            {/* Show "View More" button if there are more properties */}
            {filteredProperties.length > 6 && (
              <div className="text-center mt-8 md:mt-12">
                <button
                  onClick={() => router.push('/propertylist')}
                  className="bg-white text-[#383a3c] border-2 border-[#383a3c] px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
                >
                  View More Properties ({filteredProperties.length - 6}+)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#383a3c] to-gray-800 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
            Ready to Find Your Perfect Stay?
          </h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of satisfied guests who have found their ideal shortlet accommodation with Hols Apartments
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button
              onClick={() => router.push('/propertylist')}
              className="bg-[#f06123] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-base md:text-lg"
            >
              Browse All Properties
            </button>
            <button className="bg-transparent border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-white hover:text-[#383a3c] transition duration-200 text-base md:text-lg">
              Become a Host
            </button>
          </div>
        </div>
      </section>

      {/* Bottom margin for footer spacing */}
      <div className="mb-8 md:mb-12"></div>
    </main>
  );
}
























































// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import PropertyCard from "@/components/PropertyCard";
// import { propertiesAPI } from '@/lib/api';

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
//   type: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//   };
// }

// export default function Home() {
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
//   const [error, setError] = useState<string>('');
//   const [activeCategory, setActiveCategory] = useState('all');
//   const router = useRouter();
  
//   // Ref for scrolling to properties section
//   const propertiesSectionRef = useRef<HTMLDivElement>(null);
  
//   // Hero slider states
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
//   // Hero images data
//   const heroImages = [
//     { id: 1, src: '/images/hero1.jpg', alt: 'Luxury apartment interior' },
//     { id: 2, src: '/images/hero2.jpg', alt: 'Modern living room' },
//     { id: 3, src: '/images/hero3.jpg', alt: 'Beautiful bedroom' },
//     { id: 4, src: '/images/hero4.jpg', alt: 'Stylish kitchen' },
//     { id: 5, src: '/images/hero5.jpg', alt: 'Cozy studio' }
//   ];

//   // Auto-slide functionality
//   useEffect(() => {
//     const startAutoSlide = () => {
//       if (slideIntervalRef.current) {
//         clearInterval(slideIntervalRef.current);
//       }
      
//       slideIntervalRef.current = setInterval(() => {
//         setCurrentSlide((prev) => (prev + 1) % heroImages.length);
//       }, 5000); // Change slide every 5 seconds
//     };
    
//     startAutoSlide();
    
//     return () => {
//       if (slideIntervalRef.current) {
//         clearInterval(slideIntervalRef.current);
//       }
//     };
//   }, [heroImages.length]);

//   useEffect(() => {
//     fetchProperties();
//   }, []);

//   useEffect(() => {
//     if (searchQuery.trim() === '' && activeCategory === 'all') {
//       setFilteredProperties(properties);
//     } else {
//       const filtered = properties.filter(property => {
//         const matchesSearch = searchQuery === '' || 
//           property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.type.toLowerCase().includes(searchQuery.toLowerCase());
        
//         const matchesCategory = activeCategory === 'all' || property.type === activeCategory;
        
//         return matchesSearch && matchesCategory;
//       });
//       setFilteredProperties(filtered);
//     }
//   }, [searchQuery, properties, activeCategory]);

//   const fetchProperties = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       console.log('🔍 [Home Page] Fetching properties...');
//       let propertiesData;
      
//       try {
//         propertiesData = await propertiesAPI.getProperties({ 
//           limit: 12, 
//           status: 'active' 
//         });
//         console.log('✅ [Home Page] Properties data received:', {
//           count: propertiesData.length,
//           firstProperty: propertiesData[0]
//         });
//       } catch (apiError: any) {
//         console.error('❌ [Home Page] API error:', apiError);
//         propertiesData = [];
//       }
      
//       // Ensure propertiesData is always an array
//       const validProperties = Array.isArray(propertiesData) ? propertiesData : [];
      
//       console.log('📊 [Home Page] Valid properties count:', validProperties.length);
      
//       if (validProperties.length > 0) {
//         setProperties(validProperties);
//         setFilteredProperties(validProperties);
//         setFeaturedProperties(validProperties.slice(0, 6));
//       } else {
//         console.log('⚠️ [Home Page] No properties received, using sample data');
//         const sampleProperties = getSampleProperties();
//         setProperties(sampleProperties);
//         setFilteredProperties(sampleProperties);
//         setFeaturedProperties(sampleProperties.slice(0, 6));
//       }
      
//     } catch (error: any) {
//       console.error('💥 [Home Page] Error in fetchProperties:', error);
//       setError('Failed to load properties');
//       const sampleProperties = getSampleProperties();
//       setProperties(sampleProperties);
//       setFilteredProperties(sampleProperties);
//       setFeaturedProperties(sampleProperties.slice(0, 6));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Sample data fallback
//   const getSampleProperties = (): Property[] => [
//     {
//       _id: '1',
//       title: "Luxury Apartment in City Center",
//       location: "Lagos, Nigeria",
//       price: 120,
//       images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '2',
//       title: "Beachfront Villa",
//       location: "Victoria Island, Lagos",
//       price: 200,
//       images: [{ url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "villa",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     },
//     {
//       _id: '3',
//       title: "Cozy Studio Apartment",
//       location: "Ikeja, Lagos",
//       price: 75,
//       images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", isMain: true, order: 0 }],
//       rating: 4.5,
//       type: "studio",
//       specifications: { bedrooms: 1, bathrooms: 1, maxGuests: 2 }
//     },
//     {
//       _id: '4',
//       title: "Modern Penthouse Suite",
//       location: "Lekki, Lagos",
//       price: 300,
//       images: [{ url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "penthouse",
//       specifications: { bedrooms: 4, bathrooms: 3, maxGuests: 8 }
//     },
//     {
//       _id: '5',
//       title: "Seaside Cottage",
//       location: "Badagry, Lagos",
//       price: 150,
//       images: [{ url: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400", isMain: true, order: 0 }],
//       rating: 4.7,
//       type: "cottage",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '6',
//       title: "Executive Business Apartment",
//       location: "Ikoyi, Lagos",
//       price: 180,
//       images: [{ url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     }
//   ];

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//   };

//   const handleCategoryClick = (categoryId: string) => {
//     setActiveCategory(categoryId);
    
//     setTimeout(() => {
//       if (window.innerWidth < 768 && propertiesSectionRef.current) {
//         propertiesSectionRef.current.scrollIntoView({ 
//           behavior: 'smooth',
//           block: 'start'
//         });
//       }
//     }, 100);
//   };

//   // Hero slider navigation
//   const goToSlide = (index: number) => {
//     setCurrentSlide(index);
//     // Reset auto-slide timer
//     if (slideIntervalRef.current) {
//       clearInterval(slideIntervalRef.current);
//     }
//     slideIntervalRef.current = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % heroImages.length);
//     }, 5000);
//   };

//   const goToPrevSlide = () => {
//     const newIndex = currentSlide === 0 ? heroImages.length - 1 : currentSlide - 1;
//     goToSlide(newIndex);
//   };

//   const goToNextSlide = () => {
//     const newIndex = (currentSlide + 1) % heroImages.length;
//     goToSlide(newIndex);
//   };

//   const propertyTypes = [
//     { id: 'all', name: 'All Properties', icon: '🏠' },
//     { id: 'apartment', name: 'Apartments', icon: '🏢' },
//     { id: 'villa', name: 'Villas', icon: '🏡' },
//     { id: 'studio', name: 'Studios', icon: '🎨' },
//     { id: 'penthouse', name: 'Penthouses', icon: '🏙️' },
//     { id: 'cottage', name: 'Cottages', icon: '🌲' }
//   ];

//   const features = [
//     {
//       icon: '🔒',
//       title: 'Secure Booking',
//       description: 'Your safety and privacy are our top priorities'
//     },
//     {
//       icon: '⭐',
//       title: 'Verified Properties',
//       description: 'All properties are carefully inspected and verified'
//     },
//     {
//       icon: '💬',
//       title: '24/7 Support',
//       description: 'Round-the-clock customer support for all your needs'
//     },
//     {
//       icon: '💰',
//       title: 'Best Prices',
//       description: 'Competitive pricing with no hidden fees'
//     }
//   ];

//   const stats = [
//     { number: '500+', label: 'Properties' },
//     { number: '10K+', label: 'Happy Guests' },
//     { number: '50+', label: 'Locations' },
//     { number: '4.8', label: 'Average Rating' }
//   ];

//   return (
//     <main className="min-h-screen">
//       {/* Hero Section with Slider */}
//       <section className="relative overflow-hidden">
//         {/* Background Images with Fade Transition */}
//         <div className="relative h-[70vh] md:h-[85vh]">
//           {heroImages.map((image, index) => (
//             <div
//               key={image.id}
//               className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
//                 index === currentSlide ? 'opacity-100' : 'opacity-0'
//               }`}
//             >
//               {/* Background Image */}
//               <div 
//                 className="absolute inset-0 bg-cover bg-center"
//                 style={{ backgroundImage: `url('${image.src}')` }}
//               >
//                 {/* Dark Overlay for Better Text Visibility */}
//                 <div className="absolute inset-0 bg-black/40 md:bg-black/30"></div>
//               </div>
              
//               {/* Content Container - Only visible on active slide */}
//               <div className={`relative h-full flex items-center transition-opacity duration-1000 ${
//                 index === currentSlide ? 'opacity-100' : 'opacity-0'
//               }`}>
//                 <div className="container mx-auto px-4 text-center relative z-10">
//                   <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white">
//                     Find Your Perfect
//                     <span className="text-[#f06123] block">Shortlet Stay</span>
//                   </h1>
//                   <p className="text-base md:text-lg lg:text-xl mb-6 text-white/90 max-w-2xl mx-auto">
//                     Discover amazing apartments, villas, and unique stays for your next adventure with Hols Apartments
//                   </p>
                  
//                   {/* Search Form */}
//                   <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl mb-6">
//                     <div className="flex flex-col md:flex-row gap-2">
//                       <div className="flex-1">
//                         <input 
//                           type="text" 
//                           placeholder="Browse properties from Hols Apartments"
//                           value={searchQuery}
//                           onChange={(e) => setSearchQuery(e.target.value)}
//                           className="w-full px-4 md:px-6 py-3 md:py-4 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base md:text-lg"
//                         />
//                       </div>
//                       <button 
//                         type="submit"
//                         className="bg-[#f06123] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-2 text-base md:text-lg"
//                       >
//                         <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                         </svg>
//                         <span>Search</span>
//                       </button>
//                     </div>
//                   </form>

//                   {/* Quick Stats */}
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto">
//                     {stats.map((stat, index) => (
//                       <div key={index} className="text-center">
//                         <div className="text-xl md:text-2xl font-bold text-[#f06123]">{stat.number}</div>
//                         <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
          
//           {/* Navigation Arrows */}
//           <button
//             onClick={goToPrevSlide}
//             className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200 z-20 hidden md:block"
//             aria-label="Previous slide"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//             </svg>
//           </button>
//           <button
//             onClick={goToNextSlide}
//             className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200 z-20 hidden md:block"
//             aria-label="Next slide"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
          
//           {/* Dots Navigation */}
//           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
//             {heroImages.map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => goToSlide(index)}
//                 className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
//                   index === currentSlide 
//                     ? 'bg-[#f06123] scale-125' 
//                     : 'bg-white/60 hover:bg-white/80'
//                 }`}
//                 aria-label={`Go to slide ${index + 1}`}
//               />
//             ))}
//           </div>
          
//           {/* Mobile Navigation Arrows */}
//           <div className="md:hidden absolute bottom-4 right-4 flex space-x-2 z-20">
//             <button
//               onClick={goToPrevSlide}
//               className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200"
//               aria-label="Previous slide"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//               </svg>
//             </button>
//             <button
//               onClick={goToNextSlide}
//               className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-200"
//               aria-label="Next slide"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-12 md:py-16 bg-white">
//         <div className="container mx-auto px-4">
//           <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Why Choose Hols Apartments?</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="text-center p-4 md:p-6 rounded-2xl hover:shadow-lg transition duration-300">
//                 <div className="text-3xl md:text-4xl mb-3 md:mb-4">{feature.icon}</div>
//                 <h3 className="text-lg md:text-xl font-semibold text-[#383a3c] mb-2">{feature.title}</h3>
//                 <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Property Categories */}
//       <section className="py-12 md:py-16 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Browse by Category</h2>
//           <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
//             {propertyTypes.map((type) => (
//               <button
//                 key={type.id}
//                 onClick={() => handleCategoryClick(type.id)}
//                 className={`flex items-center space-x-2 px-4 md:px-6 py-3 rounded-full font-semibold transition duration-200 text-sm md:text-base ${
//                   activeCategory === type.id
//                     ? 'bg-[#f06123] text-white'
//                     : 'bg-white text-[#383a3c] hover:bg-gray-100'
//                 }`}
//               >
//                 <span className="text-lg md:text-xl">{type.icon}</span>
//                 <span>{type.name}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Properties Section */}
//       <section ref={propertiesSectionRef} className="container mx-auto px-4 py-12 md:py-16 bg-white">
//         <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12">
//           <div className="mb-4 md:mb-0">
//             <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c]">Featured Properties</h2>
//             <p className="text-gray-600 mt-2">Handpicked selections for your perfect stay</p>
//           </div>
//           <button
//             onClick={() => router.push('/propertylist')}
//             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center space-x-2"
//           >
//             <span>View All Properties</span>
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
        
//         {error && (
//           <div className="text-center py-8">
//             <p className="text-red-600 mb-4">{error}</p>
//             <button 
//               onClick={fetchProperties}
//               className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//             >
//               Retry
//             </button>
//           </div>
//         )}
        
//         {loading ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//           </div>
//         ) : filteredProperties.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-600 text-lg mb-4">
//               {searchQuery || activeCategory !== 'all' 
//                 ? 'No properties found matching your criteria.' 
//                 : 'No properties available at the moment.'
//               }
//             </p>
//             {(searchQuery || activeCategory !== 'all') && (
//               <button 
//                 onClick={() => {
//                   setSearchQuery('');
//                   setActiveCategory('all');
//                 }}
//                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//               >
//                 Clear Filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             {(searchQuery || activeCategory !== 'all') && (
//               <p className="text-center text-gray-600 mb-6 md:mb-8">
//                 Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} 
//                 {searchQuery && ` for "${searchQuery}"`}
//                 {activeCategory !== 'all' && ` in ${propertyTypes.find(t => t.id === activeCategory)?.name}`}
//               </p>
//             )}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
//               {filteredProperties.slice(0, 6).map((property) => (
//                 <PropertyCard
//                   key={property._id}
//                   id={property._id}
//                   title={property.title}
//                   location={property.location}
//                   price={property.price}
//                   image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
//                   rating={property.rating}
//                   bedrooms={property.specifications?.bedrooms}
//                   bathrooms={property.specifications?.bathrooms}
//                   maxGuests={property.specifications?.maxGuests}
//                   type={property.type}
//                 />
//               ))}
//             </div>
            
//             {/* Show "View More" button if there are more properties */}
//             {filteredProperties.length > 6 && (
//               <div className="text-center mt-8 md:mt-12">
//                 <button
//                   onClick={() => router.push('/propertylist')}
//                   className="bg-white text-[#383a3c] border-2 border-[#383a3c] px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-white transition duration-200"
//                 >
//                   View More Properties ({filteredProperties.length - 6}+)
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* CTA Section */}
//       <section className="bg-gradient-to-r from-[#383a3c] to-gray-800 text-white py-16 md:py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
//             Ready to Find Your Perfect Stay?
//           </h2>
//           <p className="text-base md:text-lg mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
//             Join thousands of satisfied guests who have found their ideal shortlet accommodation with Hols Apartments
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
//             <button
//               onClick={() => router.push('/propertylist')}
//               className="bg-[#f06123] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-base md:text-lg"
//             >
//               Browse All Properties
//             </button>
//             <button className="bg-transparent border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-white hover:text-[#383a3c] transition duration-200 text-base md:text-lg">
//               Become a Host
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Bottom margin for footer spacing */}
//       <div className="mb-8 md:mb-12"></div>
//     </main>
//   );
// }






















































































// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ THE CODE BELOW WORKS IT WAS MODIFIED FOR HERO SLIDER @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import PropertyCard from "@/components/PropertyCard";
// import { propertiesAPI } from '@/lib/api';

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
//   type: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//   };
// }

// export default function Home() {
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
//   const [error, setError] = useState<string>('');
//   const [activeCategory, setActiveCategory] = useState('all');
//   const router = useRouter();
  
//   // Ref for scrolling to properties section
//   const propertiesSectionRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     fetchProperties();
//   }, []);

//   useEffect(() => {
//     if (searchQuery.trim() === '' && activeCategory === 'all') {
//       setFilteredProperties(properties);
//     } else {
//       const filtered = properties.filter(property => {
//         const matchesSearch = searchQuery === '' || 
//           property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.type.toLowerCase().includes(searchQuery.toLowerCase());
        
//         const matchesCategory = activeCategory === 'all' || property.type === activeCategory;
        
//         return matchesSearch && matchesCategory;
//       });
//       setFilteredProperties(filtered);
//     }
//   }, [searchQuery, properties, activeCategory]);

//   // const fetchProperties = async () => {
//   //   try {
//   //     setLoading(true);
//   //     setError('');
      
//   //     let response;
//   //     try {
//   //       response = await propertiesAPI.getProperties({ 
//   //         limit: 12, 
//   //         status: 'active' 
//   //       });
        
//   //       const propertiesArray = response.properties || response;
//   //       const validProperties = Array.isArray(propertiesArray) ? propertiesArray : [];
        
//   //       setProperties(validProperties);
//   //       setFilteredProperties(validProperties);
        
//   //       // Set featured properties (first 6)
//   //       setFeaturedProperties(validProperties.slice(0, 6));
        
//   //     } catch (error) {
//   //       console.error('Error fetching properties:', error);
//   //       setError('Failed to load properties. Please try again later.');
//   //       const sampleProperties = getSampleProperties();
//   //       setProperties(sampleProperties);
//   //       setFilteredProperties(sampleProperties);
//   //       setFeaturedProperties(sampleProperties.slice(0, 6));
//   //     }
      
//   //   } catch (error) {
//   //     console.error('Error in fetchProperties:', error);
//   //     setError('Failed to load properties');
//   //     const sampleProperties = getSampleProperties();
//   //     setProperties(sampleProperties);
//   //     setFilteredProperties(sampleProperties);
//   //     setFeaturedProperties(sampleProperties.slice(0, 6));
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };


//   // app/page.tsx - Update fetchProperties function
//   const fetchProperties = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       console.log('🔍 [Home Page] Fetching properties...');
//       let propertiesData;
      
//       try {
//         propertiesData = await propertiesAPI.getProperties({ 
//           limit: 12, 
//           status: 'active' 
//         });
//         console.log('✅ [Home Page] Properties data received:', {
//           count: propertiesData.length,
//           firstProperty: propertiesData[0]
//         });
//       } catch (apiError: any) {
//         console.error('❌ [Home Page] API error:', apiError);
//         propertiesData = [];
//       }
      
//       // Ensure propertiesData is always an array
//       const validProperties = Array.isArray(propertiesData) ? propertiesData : [];
      
//       console.log('📊 [Home Page] Valid properties count:', validProperties.length);
      
//       if (validProperties.length > 0) {
//         setProperties(validProperties);
//         setFilteredProperties(validProperties);
//         setFeaturedProperties(validProperties.slice(0, 6));
//       } else {
//         console.log('⚠️ [Home Page] No properties received, using sample data');
//         const sampleProperties = getSampleProperties();
//         setProperties(sampleProperties);
//         setFilteredProperties(sampleProperties);
//         setFeaturedProperties(sampleProperties.slice(0, 6));
//       }
      
//     } catch (error: any) {
//       console.error('💥 [Home Page] Error in fetchProperties:', error);
//       setError('Failed to load properties');
//       const sampleProperties = getSampleProperties();
//       setProperties(sampleProperties);
//       setFilteredProperties(sampleProperties);
//       setFeaturedProperties(sampleProperties.slice(0, 6));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Sample data fallback
//   const getSampleProperties = (): Property[] => [
//     {
//       _id: '1',
//       title: "Luxury Apartment in City Center",
//       location: "Lagos, Nigeria",
//       price: 120,
//       images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '2',
//       title: "Beachfront Villa",
//       location: "Victoria Island, Lagos",
//       price: 200,
//       images: [{ url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "villa",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     },
//     {
//       _id: '3',
//       title: "Cozy Studio Apartment",
//       location: "Ikeja, Lagos",
//       price: 75,
//       images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", isMain: true, order: 0 }],
//       rating: 4.5,
//       type: "studio",
//       specifications: { bedrooms: 1, bathrooms: 1, maxGuests: 2 }
//     },
//     {
//       _id: '4',
//       title: "Modern Penthouse Suite",
//       location: "Lekki, Lagos",
//       price: 300,
//       images: [{ url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "penthouse",
//       specifications: { bedrooms: 4, bathrooms: 3, maxGuests: 8 }
//     },
//     {
//       _id: '5',
//       title: "Seaside Cottage",
//       location: "Badagry, Lagos",
//       price: 150,
//       images: [{ url: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400", isMain: true, order: 0 }],
//       rating: 4.7,
//       type: "cottage",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '6',
//       title: "Executive Business Apartment",
//       location: "Ikoyi, Lagos",
//       price: 180,
//       images: [{ url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     }
//   ];

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//   };

//   const handleCategoryClick = (categoryId: string) => {
//     setActiveCategory(categoryId);
    
//     // Scroll to properties section on mobile after a short delay
//     setTimeout(() => {
//       if (window.innerWidth < 768 && propertiesSectionRef.current) {
//         propertiesSectionRef.current.scrollIntoView({ 
//           behavior: 'smooth',
//           block: 'start'
//         });
//       }
//     }, 100);
//   };

//   const propertyTypes = [
//     { id: 'all', name: 'All Properties', icon: '🏠' },
//     { id: 'apartment', name: 'Apartments', icon: '🏢' },
//     { id: 'villa', name: 'Villas', icon: '🏡' },
//     { id: 'studio', name: 'Studios', icon: '🎨' },
//     { id: 'penthouse', name: 'Penthouses', icon: '🏙️' },
//     { id: 'cottage', name: 'Cottages', icon: '🌲' }
//   ];

//   const features = [
//     {
//       icon: '🔒',
//       title: 'Secure Booking',
//       description: 'Your safety and privacy are our top priorities'
//     },
//     {
//       icon: '⭐',
//       title: 'Verified Properties',
//       description: 'All properties are carefully inspected and verified'
//     },
//     {
//       icon: '💬',
//       title: '24/7 Support',
//       description: 'Round-the-clock customer support for all your needs'
//     },
//     {
//       icon: '💰',
//       title: 'Best Prices',
//       description: 'Competitive pricing with no hidden fees'
//     }
//   ];

//   const stats = [
//     { number: '500+', label: 'Properties' },
//     { number: '10K+', label: 'Happy Guests' },
//     { number: '50+', label: 'Locations' },
//     { number: '4.8', label: 'Average Rating' }
//   ];

//   return (
//     <main className="min-h-screen"> {/* Removed pt-16 padding-top */}
//       {/* Hero Section - Reduced height */}
//       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-16 md:py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
//             Find Your Perfect
//             <span className="text-[#f06123] block">Shortlet Stay</span>
//           </h1>
//           <p className="text-base md:text-lg mb-6 opacity-90 max-w-2xl mx-auto">
//             Discover amazing apartments, villas, and unique stays for your next adventure
//           </p>
          
//           {/* Search Form */}
//           <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-[#fcfeff] rounded-2xl p-2 shadow-2xl mb-6">
//             <div className="flex flex-col md:flex-row gap-2">
//               <div className="flex-1">
//                 <input 
//                   type="text" 
//                   placeholder="Browse properties from Hols Apartments"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full px-4 md:px-6 py-3 md:py-4 text-[#383a3c] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base md:text-lg"
//                 />
//               </div>
//               <button 
//                 type="submit"
//                 className="bg-[#f06123] text-[#fcfeff] px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-2 text-base md:text-lg"
//               >
//                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//                 <span>Search</span>
//               </button>
//             </div>
//           </form>

//           {/* Quick Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto">
//             {stats.map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className="text-xl md:text-2xl font-bold text-[#f06123]">{stat.number}</div>
//                 <div className="text-xs md:text-sm opacity-80">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-12 md:py-16 bg-white">
//         <div className="container mx-auto px-4">
//           <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Why Choose Shortlet?</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="text-center p-4 md:p-6 rounded-2xl hover:shadow-lg transition duration-300">
//                 <div className="text-3xl md:text-4xl mb-3 md:mb-4">{feature.icon}</div>
//                 <h3 className="text-lg md:text-xl font-semibold text-[#383a3c] mb-2">{feature.title}</h3>
//                 <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Property Categories */}
//       <section className="py-12 md:py-16 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Browse by Category</h2>
//           <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
//             {propertyTypes.map((type) => (
//               <button
//                 key={type.id}
//                 onClick={() => handleCategoryClick(type.id)}
//                 className={`flex items-center space-x-2 px-4 md:px-6 py-3 rounded-full font-semibold transition duration-200 text-sm md:text-base ${
//                   activeCategory === type.id
//                     ? 'bg-[#f06123] text-[#fcfeff]'
//                     : 'bg-white text-[#383a3c] hover:bg-gray-100'
//                 }`}
//               >
//                 <span className="text-lg md:text-xl">{type.icon}</span>
//                 <span>{type.name}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Properties Section */}
//       <section ref={propertiesSectionRef} className="container mx-auto px-4 py-12 md:py-16 bg-white">
//         <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12">
//           <div className="mb-4 md:mb-0">
//             <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c]">Featured Properties</h2>
//             <p className="text-gray-600 mt-2">Handpicked selections for your perfect stay</p>
//           </div>
//           <button
//             onClick={() => router.push('/propertylist')}
//             className="bg-[#f06123] text-[#fcfeff] px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center space-x-2"
//           >
//             <span>View All Properties</span>
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
        
//         {error && (
//           <div className="text-center py-8">
//             <p className="text-red-600 mb-4">{error}</p>
//             <button 
//               onClick={fetchProperties}
//               className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//             >
//               Retry
//             </button>
//           </div>
//         )}
        
//         {loading ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//           </div>
//         ) : filteredProperties.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-600 text-lg mb-4">
//               {searchQuery || activeCategory !== 'all' 
//                 ? 'No properties found matching your criteria.' 
//                 : 'No properties available at the moment.'
//               }
//             </p>
//             {(searchQuery || activeCategory !== 'all') && (
//               <button 
//                 onClick={() => {
//                   setSearchQuery('');
//                   setActiveCategory('all');
//                 }}
//                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//               >
//                 Clear Filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             {(searchQuery || activeCategory !== 'all') && (
//               <p className="text-center text-gray-600 mb-6 md:mb-8">
//                 Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} 
//                 {searchQuery && ` for "${searchQuery}"`}
//                 {activeCategory !== 'all' && ` in ${propertyTypes.find(t => t.id === activeCategory)?.name}`}
//               </p>
//             )}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
//               {filteredProperties.slice(0, 6).map((property) => (
//                 <PropertyCard
//                   key={property._id}
//                   id={property._id}
//                   title={property.title}
//                   location={property.location}
//                   price={property.price}
//                   image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
//                   rating={property.rating}
//                   bedrooms={property.specifications?.bedrooms}
//                   bathrooms={property.specifications?.bathrooms}
//                   maxGuests={property.specifications?.maxGuests}
//                   type={property.type}
//                 />
//               ))}
//             </div>
            
//             {/* Show "View More" button if there are more properties */}
//             {filteredProperties.length > 6 && (
//               <div className="text-center mt-8 md:mt-12">
//                 <button
//                   onClick={() => router.push('/propertylist')}
//                   className="bg-white text-[#383a3c] border-2 border-[#383a3c] px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-[#fcfeff] transition duration-200"
//                 >
//                   View More Properties ({filteredProperties.length - 6}+)
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* CTA Section */}
//       <section className="bg-gradient-to-r from-[#383a3c] to-gray-800 text-[#fcfeff] py-16 md:py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
//             Ready to Find Your Perfect Stay?
//           </h2>
//           <p className="text-base md:text-lg mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto">
//             Join thousands of satisfied guests who have found their ideal shortlet accommodation with us
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
//             <button
//               onClick={() => router.push('/propertylist')}
//               className="bg-[#f06123] text-[#fcfeff] px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-base md:text-lg"
//             >
//               Browse All Properties
//             </button>
//             <button className="bg-transparent border-2 border-[#fcfeff] text-[#fcfeff] px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-[#fcfeff] hover:text-[#383a3c] transition duration-200 text-base md:text-lg">
//               Become a Host
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Bottom margin for footer spacing */}
//       <div className="mb-8 md:mb-12"></div>
//     </main>
//   );
// }








































// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import PropertyCard from "@/components/PropertyCard";
// import { propertiesAPI } from '@/lib/api';

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
//   type: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//   };
// }

// export default function Home() {
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
//   const [error, setError] = useState<string>('');
//   const [activeCategory, setActiveCategory] = useState('all');
//   const router = useRouter();
  
//   // Ref for scrolling to properties section
//   const propertiesSectionRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     fetchProperties();
//   }, []);

//   useEffect(() => {
//     if (searchQuery.trim() === '' && activeCategory === 'all') {
//       setFilteredProperties(properties);
//     } else {
//       const filtered = properties.filter(property => {
//         const matchesSearch = searchQuery === '' || 
//           property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.type.toLowerCase().includes(searchQuery.toLowerCase());
        
//         const matchesCategory = activeCategory === 'all' || property.type === activeCategory;
        
//         return matchesSearch && matchesCategory;
//       });
//       setFilteredProperties(filtered);
//     }
//   }, [searchQuery, properties, activeCategory]);

//   const fetchProperties = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       let response;
//       try {
//         response = await propertiesAPI.getProperties({ 
//           limit: 12, 
//           status: 'active' 
//         });
        
//         const propertiesArray = response.properties || response;
//         const validProperties = Array.isArray(propertiesArray) ? propertiesArray : [];
        
//         setProperties(validProperties);
//         setFilteredProperties(validProperties);
        
//         // Set featured properties (first 6)
//         setFeaturedProperties(validProperties.slice(0, 6));
        
//       } catch (error) {
//         console.error('Error fetching properties:', error);
//         setError('Failed to load properties. Please try again later.');
//         const sampleProperties = getSampleProperties();
//         setProperties(sampleProperties);
//         setFilteredProperties(sampleProperties);
//         setFeaturedProperties(sampleProperties.slice(0, 6));
//       }
      
//     } catch (error) {
//       console.error('Error in fetchProperties:', error);
//       setError('Failed to load properties');
//       const sampleProperties = getSampleProperties();
//       setProperties(sampleProperties);
//       setFilteredProperties(sampleProperties);
//       setFeaturedProperties(sampleProperties.slice(0, 6));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Sample data fallback
//   const getSampleProperties = (): Property[] => [
//     {
//       _id: '1',
//       title: "Luxury Apartment in City Center",
//       location: "Lagos, Nigeria",
//       price: 120,
//       images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '2',
//       title: "Beachfront Villa",
//       location: "Victoria Island, Lagos",
//       price: 200,
//       images: [{ url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "villa",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     },
//     {
//       _id: '3',
//       title: "Cozy Studio Apartment",
//       location: "Ikeja, Lagos",
//       price: 75,
//       images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", isMain: true, order: 0 }],
//       rating: 4.5,
//       type: "studio",
//       specifications: { bedrooms: 1, bathrooms: 1, maxGuests: 2 }
//     },
//     {
//       _id: '4',
//       title: "Modern Penthouse Suite",
//       location: "Lekki, Lagos",
//       price: 300,
//       images: [{ url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "penthouse",
//       specifications: { bedrooms: 4, bathrooms: 3, maxGuests: 8 }
//     },
//     {
//       _id: '5',
//       title: "Seaside Cottage",
//       location: "Badagry, Lagos",
//       price: 150,
//       images: [{ url: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400", isMain: true, order: 0 }],
//       rating: 4.7,
//       type: "cottage",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '6',
//       title: "Executive Business Apartment",
//       location: "Ikoyi, Lagos",
//       price: 180,
//       images: [{ url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     }
//   ];

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//   };

//   const handleCategoryClick = (categoryId: string) => {
//     setActiveCategory(categoryId);
    
//     // Scroll to properties section on mobile after a short delay
//     setTimeout(() => {
//       if (window.innerWidth < 768 && propertiesSectionRef.current) {
//         propertiesSectionRef.current.scrollIntoView({ 
//           behavior: 'smooth',
//           block: 'start'
//         });
//       }
//     }, 100);
//   };

//   const propertyTypes = [
//     { id: 'all', name: 'All Properties', icon: '🏠' },
//     { id: 'apartment', name: 'Apartments', icon: '🏢' },
//     { id: 'villa', name: 'Villas', icon: '🏡' },
//     { id: 'studio', name: 'Studios', icon: '🎨' },
//     { id: 'penthouse', name: 'Penthouses', icon: '🏙️' },
//     { id: 'cottage', name: 'Cottages', icon: '🌲' }
//   ];

//   const features = [
//     {
//       icon: '🔒',
//       title: 'Secure Booking',
//       description: 'Your safety and privacy are our top priorities'
//     },
//     {
//       icon: '⭐',
//       title: 'Verified Properties',
//       description: 'All properties are carefully inspected and verified'
//     },
//     {
//       icon: '💬',
//       title: '24/7 Support',
//       description: 'Round-the-clock customer support for all your needs'
//     },
//     {
//       icon: '💰',
//       title: 'Best Prices',
//       description: 'Competitive pricing with no hidden fees'
//     }
//   ];

//   const stats = [
//     { number: '500+', label: 'Properties' },
//     { number: '10K+', label: 'Happy Guests' },
//     { number: '50+', label: 'Locations' },
//     { number: '4.8', label: 'Average Rating' }
//   ];

//   return (
//     <main className="min-h-screen pt-16"> {/* Added padding-top for fixed navbar */}
//       {/* Hero Section - Reduced height */}
//       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-16 md:py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
//             Find Your Perfect
//             <span className="text-[#f06123] block">Shortlet Stay</span>
//           </h1>
//           <p className="text-base md:text-lg mb-6 opacity-90 max-w-2xl mx-auto">
//             Discover amazing apartments, villas, and unique stays for your next adventure in Lagos and beyond
//           </p>
          
//           {/* Search Form */}
//           <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-[#fcfeff] rounded-2xl p-2 shadow-2xl mb-6">
//             <div className="flex flex-col md:flex-row gap-2">
//               <div className="flex-1">
//                 <input 
//                   type="text" 
//                   placeholder="Where are you going?"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full px-4 md:px-6 py-3 md:py-4 text-[#383a3c] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f06123] text-base md:text-lg"
//                 />
//               </div>
//               <button 
//                 type="submit"
//                 className="bg-[#f06123] text-[#fcfeff] px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-2 text-base md:text-lg"
//               >
//                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//                 <span>Search</span>
//               </button>
//             </div>
//           </form>

//           {/* Quick Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto">
//             {stats.map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className="text-xl md:text-2xl font-bold text-[#f06123]">{stat.number}</div>
//                 <div className="text-xs md:text-sm opacity-80">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-12 md:py-16 bg-white">
//         <div className="container mx-auto px-4">
//           <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Why Choose Shortlet?</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="text-center p-4 md:p-6 rounded-2xl hover:shadow-lg transition duration-300">
//                 <div className="text-3xl md:text-4xl mb-3 md:mb-4">{feature.icon}</div>
//                 <h3 className="text-lg md:text-xl font-semibold text-[#383a3c] mb-2">{feature.title}</h3>
//                 <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Property Categories */}
//       <section className="py-12 md:py-16 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c] mb-8 md:mb-12 text-center">Browse by Category</h2>
//           <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
//             {propertyTypes.map((type) => (
//               <button
//                 key={type.id}
//                 onClick={() => handleCategoryClick(type.id)}
//                 className={`flex items-center space-x-2 px-4 md:px-6 py-3 rounded-full font-semibold transition duration-200 text-sm md:text-base ${
//                   activeCategory === type.id
//                     ? 'bg-[#f06123] text-[#fcfeff]'
//                     : 'bg-white text-[#383a3c] hover:bg-gray-100'
//                 }`}
//               >
//                 <span className="text-lg md:text-xl">{type.icon}</span>
//                 <span>{type.name}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Properties Section */}
//       <section ref={propertiesSectionRef} className="container mx-auto px-4 py-12 md:py-16 bg-white">
//         <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12">
//           <div className="mb-4 md:mb-0">
//             <h2 className="text-2xl md:text-3xl font-bold text-[#383a3c]">Featured Properties</h2>
//             <p className="text-gray-600 mt-2">Handpicked selections for your perfect stay</p>
//           </div>
//           <button
//             onClick={() => router.push('/propertylist')}
//             className="bg-[#f06123] text-[#fcfeff] px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center space-x-2"
//           >
//             <span>View All Properties</span>
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
        
//         {error && (
//           <div className="text-center py-8">
//             <p className="text-red-600 mb-4">{error}</p>
//             <button 
//               onClick={fetchProperties}
//               className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//             >
//               Retry
//             </button>
//           </div>
//         )}
        
//         {loading ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//           </div>
//         ) : filteredProperties.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-600 text-lg mb-4">
//               {searchQuery || activeCategory !== 'all' 
//                 ? 'No properties found matching your criteria.' 
//                 : 'No properties available at the moment.'
//               }
//             </p>
//             {(searchQuery || activeCategory !== 'all') && (
//               <button 
//                 onClick={() => {
//                   setSearchQuery('');
//                   setActiveCategory('all');
//                 }}
//                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//               >
//                 Clear Filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             {(searchQuery || activeCategory !== 'all') && (
//               <p className="text-center text-gray-600 mb-6 md:mb-8">
//                 Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} 
//                 {searchQuery && ` for "${searchQuery}"`}
//                 {activeCategory !== 'all' && ` in ${propertyTypes.find(t => t.id === activeCategory)?.name}`}
//               </p>
//             )}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
//               {filteredProperties.slice(0, 6).map((property) => (
//                 <PropertyCard
//                   key={property._id}
//                   id={property._id}
//                   title={property.title}
//                   location={property.location}
//                   price={property.price}
//                   image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
//                   rating={property.rating}
//                   bedrooms={property.specifications?.bedrooms}
//                   bathrooms={property.specifications?.bathrooms}
//                   maxGuests={property.specifications?.maxGuests}
//                   type={property.type}
//                 />
//               ))}
//             </div>
            
//             {/* Show "View More" button if there are more properties */}
//             {filteredProperties.length > 6 && (
//               <div className="text-center mt-8 md:mt-12">
//                 <button
//                   onClick={() => router.push('/propertylist')}
//                   className="bg-white text-[#383a3c] border-2 border-[#383a3c] px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-[#fcfeff] transition duration-200"
//                 >
//                   View More Properties ({filteredProperties.length - 6}+)
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* CTA Section */}
//       <section className="bg-gradient-to-r from-[#383a3c] to-gray-800 text-[#fcfeff] py-16 md:py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
//             Ready to Find Your Perfect Stay?
//           </h2>
//           <p className="text-base md:text-lg mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto">
//             Join thousands of satisfied guests who have found their ideal shortlet accommodation with us
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
//             <button
//               onClick={() => router.push('/propertylist')}
//               className="bg-[#f06123] text-[#fcfeff] px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-base md:text-lg"
//             >
//               Browse All Properties
//             </button>
//             <button className="bg-transparent border-2 border-[#fcfeff] text-[#fcfeff] px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-[#fcfeff] hover:text-[#383a3c] transition duration-200 text-base md:text-lg">
//               Become a Host
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Bottom margin for footer spacing */}
//       <div className="mb-8 md:mb-12"></div>
//     </main>
//   );
// }








































































// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import PropertyCard from "@/components/PropertyCard";
// import { propertiesAPI } from '@/lib/api';

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
//   type: string;
//   specifications: {
//     bedrooms: number;
//     bathrooms: number;
//     maxGuests: number;
//   };
// }

// export default function Home() {
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
//   const [error, setError] = useState<string>('');
//   const [activeCategory, setActiveCategory] = useState('all');
//   const router = useRouter();

//   useEffect(() => {
//     fetchProperties();
//   }, []);

//   useEffect(() => {
//     if (searchQuery.trim() === '' && activeCategory === 'all') {
//       setFilteredProperties(properties);
//     } else {
//       const filtered = properties.filter(property => {
//         const matchesSearch = searchQuery === '' || 
//           property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           property.type.toLowerCase().includes(searchQuery.toLowerCase());
        
//         const matchesCategory = activeCategory === 'all' || property.type === activeCategory;
        
//         return matchesSearch && matchesCategory;
//       });
//       setFilteredProperties(filtered);
//     }
//   }, [searchQuery, properties, activeCategory]);

//   const fetchProperties = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       let response;
//       try {
//         response = await propertiesAPI.getProperties({ 
//           limit: 12, 
//           status: 'active' 
//         });
        
//         const propertiesArray = response.properties || response;
//         const validProperties = Array.isArray(propertiesArray) ? propertiesArray : [];
        
//         setProperties(validProperties);
//         setFilteredProperties(validProperties);
        
//         // Set featured properties (first 6)
//         setFeaturedProperties(validProperties.slice(0, 6));
        
//       } catch (error) {
//         console.error('Error fetching properties:', error);
//         setError('Failed to load properties. Please try again later.');
//         const sampleProperties = getSampleProperties();
//         setProperties(sampleProperties);
//         setFilteredProperties(sampleProperties);
//         setFeaturedProperties(sampleProperties.slice(0, 6));
//       }
      
//     } catch (error) {
//       console.error('Error in fetchProperties:', error);
//       setError('Failed to load properties');
//       const sampleProperties = getSampleProperties();
//       setProperties(sampleProperties);
//       setFilteredProperties(sampleProperties);
//       setFeaturedProperties(sampleProperties.slice(0, 6));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Sample data fallback
//   const getSampleProperties = (): Property[] => [
//     {
//       _id: '1',
//       title: "Luxury Apartment in City Center",
//       location: "Lagos, Nigeria",
//       price: 120,
//       images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '2',
//       title: "Beachfront Villa",
//       location: "Victoria Island, Lagos",
//       price: 200,
//       images: [{ url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "villa",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     },
//     {
//       _id: '3',
//       title: "Cozy Studio Apartment",
//       location: "Ikeja, Lagos",
//       price: 75,
//       images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", isMain: true, order: 0 }],
//       rating: 4.5,
//       type: "studio",
//       specifications: { bedrooms: 1, bathrooms: 1, maxGuests: 2 }
//     },
//     {
//       _id: '4',
//       title: "Modern Penthouse Suite",
//       location: "Lekki, Lagos",
//       price: 300,
//       images: [{ url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400", isMain: true, order: 0 }],
//       rating: 4.9,
//       type: "penthouse",
//       specifications: { bedrooms: 4, bathrooms: 3, maxGuests: 8 }
//     },
//     {
//       _id: '5',
//       title: "Seaside Cottage",
//       location: "Badagry, Lagos",
//       price: 150,
//       images: [{ url: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400", isMain: true, order: 0 }],
//       rating: 4.7,
//       type: "cottage",
//       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
//     },
//     {
//       _id: '6',
//       title: "Executive Business Apartment",
//       location: "Ikoyi, Lagos",
//       price: 180,
//       images: [{ url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", isMain: true, order: 0 }],
//       rating: 4.8,
//       type: "apartment",
//       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
//     }
//   ];

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//   };

//   const propertyTypes = [
//     { id: 'all', name: 'All Properties', icon: '🏠' },
//     { id: 'apartment', name: 'Apartments', icon: '🏢' },
//     { id: 'villa', name: 'Villas', icon: '🏡' },
//     { id: 'studio', name: 'Studios', icon: '🎨' },
//     { id: 'penthouse', name: 'Penthouses', icon: '🏙️' },
//     { id: 'cottage', name: 'Cottages', icon: '🌲' }
//   ];

//   const features = [
//     {
//       icon: '🔒',
//       title: 'Secure Booking',
//       description: 'Your safety and privacy are our top priorities'
//     },
//     {
//       icon: '⭐',
//       title: 'Verified Properties',
//       description: 'All properties are carefully inspected and verified'
//     },
//     {
//       icon: '💬',
//       title: '24/7 Support',
//       description: 'Round-the-clock customer support for all your needs'
//     },
//     {
//       icon: '💰',
//       title: 'Best Prices',
//       description: 'Competitive pricing with no hidden fees'
//     }
//   ];

//   const stats = [
//     { number: '500+', label: 'Properties' },
//     { number: '10K+', label: 'Happy Guests' },
//     { number: '50+', label: 'Locations' },
//     { number: '4.8', label: 'Average Rating' }
//   ];

//   return (
//     <main className="min-h-screen">
//       {/* Hero Section */}
//       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-20 md:py-28">
//         <div className="container mx-auto px-4 text-center">
//           <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
//             Find Your Perfect
//             <span className="text-[#f06123] block">Shortlet Stay</span>
//           </h1>
//           <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
//             Discover amazing apartments, villas, and unique stays for your next adventure in Lagos and beyond
//           </p>
          
//           {/* Search Form */}
//           <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-[#fcfeff] rounded-2xl p-2 shadow-2xl mb-8">
//             <div className="flex flex-col md:flex-row gap-2">
//               <div className="flex-1">
//                 <input 
//                   type="text" 
//                   placeholder="Where are you going?"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full px-6 py-4 text-[#383a3c] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f06123] text-lg"
//                 />
//               </div>
//               <button 
//                 type="submit"
//                 className="bg-[#f06123] text-[#fcfeff] px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-2 text-lg"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//                 <span>Search</span>
//               </button>
//             </div>
//           </form>

//           {/* Quick Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
//             {stats.map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className="text-2xl md:text-3xl font-bold text-[#f06123]">{stat.number}</div>
//                 <div className="text-sm opacity-80">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-16 bg-white">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-[#383a3c] mb-12 text-center">Why Choose Shortlet?</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="text-center p-6 rounded-2xl hover:shadow-lg transition duration-300">
//                 <div className="text-4xl mb-4">{feature.icon}</div>
//                 <h3 className="text-xl font-semibold text-[#383a3c] mb-2">{feature.title}</h3>
//                 <p className="text-gray-600">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Property Categories */}
//       <section className="py-16 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-[#383a3c] mb-12 text-center">Browse by Category</h2>
//           <div className="flex flex-wrap justify-center gap-4 mb-12">
//             {propertyTypes.map((type) => (
//               <button
//                 key={type.id}
//                 onClick={() => setActiveCategory(type.id)}
//                 className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition duration-200 ${
//                   activeCategory === type.id
//                     ? 'bg-[#f06123] text-[#fcfeff]'
//                     : 'bg-white text-[#383a3c] hover:bg-gray-100'
//                 }`}
//               >
//                 <span className="text-xl">{type.icon}</span>
//                 <span>{type.name}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Properties Section */}
//       <section className="container mx-auto px-4 py-16 bg-white">
//         <div className="flex justify-between items-center mb-12">
//           <div>
//             <h2 className="text-3xl font-bold text-[#383a3c]">Featured Properties</h2>
//             <p className="text-gray-600 mt-2">Handpicked selections for your perfect stay</p>
//           </div>
//           <button
//             onClick={() => router.push('/propertylist')}
//             className="bg-[#f06123] text-[#fcfeff] px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center space-x-2"
//           >
//             <span>View All Properties</span>
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
        
//         {error && (
//           <div className="text-center py-8">
//             <p className="text-red-600 mb-4">{error}</p>
//             <button 
//               onClick={fetchProperties}
//               className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//             >
//               Retry
//             </button>
//           </div>
//         )}
        
//         {loading ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
//           </div>
//         ) : filteredProperties.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-600 text-lg mb-4">
//               {searchQuery || activeCategory !== 'all' 
//                 ? 'No properties found matching your criteria.' 
//                 : 'No properties available at the moment.'
//               }
//             </p>
//             {(searchQuery || activeCategory !== 'all') && (
//               <button 
//                 onClick={() => {
//                   setSearchQuery('');
//                   setActiveCategory('all');
//                 }}
//                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
//               >
//                 Clear Filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             {(searchQuery || activeCategory !== 'all') && (
//               <p className="text-center text-gray-600 mb-8">
//                 Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} 
//                 {searchQuery && ` for "${searchQuery}"`}
//                 {activeCategory !== 'all' && ` in ${propertyTypes.find(t => t.id === activeCategory)?.name}`}
//               </p>
//             )}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {filteredProperties.slice(0, 6).map((property) => (
//                 <PropertyCard
//                   key={property._id}
//                   id={property._id}
//                   title={property.title}
//                   location={property.location}
//                   price={property.price}
//                   image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
//                   rating={property.rating}
//                   bedrooms={property.specifications?.bedrooms}
//                   bathrooms={property.specifications?.bathrooms}
//                   maxGuests={property.specifications?.maxGuests}
//                   type={property.type}
//                 />
//               ))}
//             </div>
            
//             {/* Show "View More" button if there are more properties */}
//             {filteredProperties.length > 6 && (
//               <div className="text-center mt-12">
//                 <button
//                   onClick={() => router.push('/propertylist')}
//                   className="bg-white text-[#383a3c] border-2 border-[#383a3c] px-8 py-3 rounded-lg font-semibold hover:bg-[#383a3c] hover:text-[#fcfeff] transition duration-200"
//                 >
//                   View More Properties ({filteredProperties.length - 6}+)
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* CTA Section */}
//       <section className="bg-gradient-to-r from-[#383a3c] to-gray-800 text-[#fcfeff] py-20">
//         <div className="container mx-auto px-4 text-center">
//           <h2 className="text-3xl md:text-4xl font-bold mb-6">
//             Ready to Find Your Perfect Stay?
//           </h2>
//           <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
//             Join thousands of satisfied guests who have found their ideal shortlet accommodation with us
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               onClick={() => router.push('/propertylist')}
//               className="bg-[#f06123] text-[#fcfeff] px-8 py-4 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 text-lg"
//             >
//               Browse All Properties
//             </button>
//             <button className="bg-transparent border-2 border-[#fcfeff] text-[#fcfeff] px-8 py-4 rounded-lg font-semibold hover:bg-[#fcfeff] hover:text-[#383a3c] transition duration-200 text-lg">
//               Become a Host
//             </button>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }









































// // 'use client';

// // import { useState, useEffect } from 'react';
// // import PropertyCard from "@/components/PropertyCard";
// // import { propertiesAPI } from '@/lib/api';

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
// //   type: string;
// //   specifications: {
// //     bedrooms: number;
// //     bathrooms: number;
// //     maxGuests: number;
// //   };
// // }

// // export default function Home() {
// //   const [properties, setProperties] = useState<Property[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
// //   const [error, setError] = useState<string>('');

// //   useEffect(() => {
// //     fetchProperties();
// //   }, []);

// //   useEffect(() => {
// //     if (searchQuery.trim() === '') {
// //       setFilteredProperties(properties);
// //     } else {
// //       const filtered = properties.filter(property =>
// //         property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //         property.type.toLowerCase().includes(searchQuery.toLowerCase())
// //       );
// //       setFilteredProperties(filtered);
// //     }
// //   }, [searchQuery, properties]);

// //     // In your app/page.tsx
// //   const fetchProperties = async () => {
// //     try {
// //       setLoading(true);
// //       setError('');
      
// //       // Use propertiesAPI which now uses serverApi for public endpoints
// //       let response;
// //       try {
// //         response = await propertiesAPI.getProperties({ 
// //           limit: 6, 
// //           status: 'active' 
// //         });
// //         // Extract properties from response if it's an object with properties array
// //         const propertiesArray = response.properties || response;
// //         setProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
// //         setFilteredProperties(Array.isArray(propertiesArray) ? propertiesArray : []);
// //       } catch (error) {
// //         console.error('Error fetching properties:', error);
// //         setError('Failed to load properties. Please try again later.');
// //         // Fallback to sample data
// //         setProperties(getSampleProperties());
// //         setFilteredProperties(getSampleProperties());
// //       }
      
// //     } catch (error) {
// //       console.error('Error in fetchProperties:', error);
// //       setError('Failed to load properties');
// //       setProperties(getSampleProperties());
// //       setFilteredProperties(getSampleProperties());
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Sample data fallback
// //   const getSampleProperties = (): Property[] => [
// //     {
// //       _id: '1',
// //       title: "Luxury Apartment in City Center",
// //       location: "Lagos, Nigeria",
// //       price: 120,
// //       images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", isMain: true, order: 0 }],
// //       rating: 4.8,
// //       type: "apartment",
// //       specifications: { bedrooms: 2, bathrooms: 2, maxGuests: 4 }
// //     },
// //     {
// //       _id: '2',
// //       title: "Beachfront Villa",
// //       location: "Victoria Island, Lagos",
// //       price: 200,
// //       images: [{ url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400", isMain: true, order: 0 }],
// //       rating: 4.9,
// //       type: "villa",
// //       specifications: { bedrooms: 3, bathrooms: 2, maxGuests: 6 }
// //     },
// //     {
// //       _id: '3',
// //       title: "Cozy Studio Apartment",
// //       location: "Ikeja, Lagos",
// //       price: 75,
// //       images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", isMain: true, order: 0 }],
// //       rating: 4.5,
// //       type: "studio",
// //       specifications: { bedrooms: 1, bathrooms: 1, maxGuests: 2 }
// //     }
// //   ];

// //   const handleSearch = (e: React.FormEvent) => {
// //     e.preventDefault();
// //   };

// //   return (
// //     <main>
// //       {/* Hero Section */}
// //       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-20">
// //         <div className="container mx-auto px-4 text-center">
// //           <h1 className="text-4xl md:text-5xl font-bold mb-6">
// //             Find Your Perfect Shortlet
// //           </h1>
// //           <p className="text-lg md:text-xl mb-8 opacity-90">
// //             Discover amazing apartments and villas for your next trip
// //           </p>
// //           <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-[#fcfeff] rounded-lg p-2 shadow-lg">
// //             <div className="flex">
// //               <input 
// //                 type="text" 
// //                 placeholder="Where are you going?"
// //                 value={searchQuery}
// //                 onChange={(e) => setSearchQuery(e.target.value)}
// //                 className="flex-1 px-4 py-3 text-[#383a3c] rounded-l-lg focus:outline-none"
// //               />
// //               <button 
// //                 type="submit"
// //                 className="bg-[#f06123] text-[#fcfeff] px-4 md:px-6 py-3 rounded-r-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center"
// //               >
// //                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// //                 </svg>
// //                 <span className="sr-only">Search</span>
// //               </button>
// //             </div>
// //           </form>
// //         </div>
// //       </section>

// //       {/* Properties Section */}
// //       <section className="container mx-auto px-4 py-16 bg-gray-50">
// //         <h2 className="text-3xl font-bold text-[#383a3c] mb-8 text-center">Featured Properties</h2>
        
// //         {error && (
// //           <div className="text-center py-4">
// //             <p className="text-red-600 mb-2">{error}</p>
// //             <button 
// //               onClick={fetchProperties}
// //               className="bg-[#f06123] text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //             >
// //               Retry
// //             </button>
// //           </div>
// //         )}
        
// //         {loading ? (
// //           <div className="flex justify-center items-center py-12">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// //           </div>
// //         ) : filteredProperties.length === 0 ? (
// //           <div className="text-center py-12">
// //             <p className="text-gray-600 text-lg mb-4">
// //               {searchQuery ? 'No properties found matching your search.' : 'No properties available at the moment.'}
// //             </p>
// //             {searchQuery && (
// //               <button 
// //                 onClick={() => setSearchQuery('')}
// //                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// //               >
// //                 Clear Search
// //               </button>
// //             )}
// //           </div>
// //         ) : (
// //           <>
// //             {searchQuery && (
// //               <p className="text-center text-gray-600 mb-6">
// //                 Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} matching your search
// //               </p>
// //             )}
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //               {filteredProperties.map((property) => (
// //                 <PropertyCard
// //                   key={property._id}
// //                   id={property._id}
// //                   title={property.title}
// //                   location={property.location}
// //                   price={property.price}
// //                   image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
// //                   rating={property.rating}
// //                   bedrooms={property.specifications?.bedrooms}
// //                   bathrooms={property.specifications?.bathrooms}
// //                   maxGuests={property.specifications?.maxGuests}
// //                   type={property.type}
// //                 />
// //               ))}
// //             </div>
// //           </>
// //         )}
// //       </section>
// //     </main>
// //   );
// // }
























































// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import PropertyCard from "@/components/PropertyCard";
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
// // // //   type: string;
// // // //   specifications: {
// // // //     bedrooms: number;
// // // //     bathrooms: number;
// // // //     maxGuests: number;
// // // //   };
// // // // }

// // // // export default function Home() {
// // // //   const [properties, setProperties] = useState<Property[]>([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [searchQuery, setSearchQuery] = useState('');
// // // //   const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

// // // //   useEffect(() => {
// // // //     fetchFeaturedProperties();
// // // //   }, []);

// // // //   useEffect(() => {
// // // //     if (searchQuery.trim() === '') {
// // // //       setFilteredProperties(properties);
// // // //     } else {
// // // //       const filtered = properties.filter(property =>
// // // //         property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // //         property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // //         property.type.toLowerCase().includes(searchQuery.toLowerCase())
// // // //       );
// // // //       setFilteredProperties(filtered);
// // // //     }
// // // //   }, [searchQuery, properties]);

// // // //   const fetchFeaturedProperties = async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       const response = await propertiesAPI.getFeaturedProperties();
// // // //       setProperties(response);
// // // //       setFilteredProperties(response);
// // // //     } catch (error) {
// // // //       console.error('Error fetching featured properties:', error);
// // // //       // Fallback to empty array if API fails
// // // //       setProperties([]);
// // // //       setFilteredProperties([]);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   const handleSearch = (e: React.FormEvent) => {
// // // //     e.preventDefault();
// // // //     // Search is handled in the useEffect above
// // // //   };

// // // //   return (
// // // //     <main>
// // // //       {/* Hero Section */}
// // // //       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-20">
// // // //         <div className="container mx-auto px-4 text-center">
// // // //           <h1 className="text-4xl md:text-5xl font-bold mb-6">
// // // //             Find Your Perfect Shortlet
// // // //           </h1>
// // // //           <p className="text-lg md:text-xl mb-8 opacity-90">
// // // //             Discover amazing apartments and villas for your next trip
// // // //           </p>
// // // //           <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-[#fcfeff] rounded-lg p-2 shadow-lg">
// // // //             <div className="flex">
// // // //               <input 
// // // //                 type="text" 
// // // //                 placeholder="Where are you going?"
// // // //                 value={searchQuery}
// // // //                 onChange={(e) => setSearchQuery(e.target.value)}
// // // //                 className="flex-1 px-4 py-3 text-[#383a3c] rounded-l-lg focus:outline-none"
// // // //               />
// // // //               <button 
// // // //                 type="submit"
// // // //                 className="bg-[#f06123] text-[#fcfeff] px-4 md:px-6 py-3 rounded-r-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center"
// // // //               >
// // // //                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// // // //                 </svg>
// // // //                 <span className="sr-only">Search</span>
// // // //               </button>
// // // //             </div>
// // // //           </form>
// // // //         </div>
// // // //       </section>

// // // //       {/* Properties Section */}
// // // //       <section className="container mx-auto px-4 py-16 bg-gray-50">
// // // //         <h2 className="text-3xl font-bold text-[#383a3c] mb-8 text-center">Featured Properties</h2>
        
// // // //         {loading ? (
// // // //           <div className="flex justify-center items-center py-12">
// // // //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06123]"></div>
// // // //           </div>
// // // //         ) : filteredProperties.length === 0 ? (
// // // //           <div className="text-center py-12">
// // // //             <p className="text-gray-600 text-lg mb-4">
// // // //               {searchQuery ? 'No properties found matching your search.' : 'No featured properties available at the moment.'}
// // // //             </p>
// // // //             {searchQuery && (
// // // //               <button 
// // // //                 onClick={() => setSearchQuery('')}
// // // //                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
// // // //               >
// // // //                 Clear Search
// // // //               </button>
// // // //             )}
// // // //           </div>
// // // //         ) : (
// // // //           <>
// // // //             {searchQuery && (
// // // //               <p className="text-center text-gray-600 mb-6">
// // // //                 Showing {filteredProperties.length} property{filteredProperties.length !== 1 ? 's' : ''} matching your search
// // // //               </p>
// // // //             )}
// // // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // // //               {filteredProperties.map((property) => (
// // // //                 <PropertyCard
// // // //                   key={property._id}
// // // //                   id={property._id}
// // // //                   title={property.title}
// // // //                   location={property.location}
// // // //                   price={property.price}
// // // //                   image={property.images.find(img => img.isMain)?.url || property.images[0]?.url || '/default-property.jpg'}
// // // //                   rating={property.rating}
// // // //                   bedrooms={property.specifications?.bedrooms}
// // // //                   bathrooms={property.specifications?.bathrooms}
// // // //                   maxGuests={property.specifications?.maxGuests}
// // // //                   type={property.type}
// // // //                 />
// // // //               ))}
// // // //             </div>
// // // //           </>
// // // //         )}
// // // //       </section>
// // // //     </main>
// // // //   );
// // // // }




























































// // // // import PropertyCard from "@/components/PropertyCard";

// // // // const sampleProperties = [
// // // //   {
// // // //     id: 1,
// // // //     title: "Luxury Apartment in City Center",
// // // //     location: "Lagos, Nigeria",
// // // //     price: 120,
// // // //     image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
// // // //     rating: 4.8
// // // //   },
// // // //   {
// // // //     id: 2,
// // // //     title: "Beachfront Villa",
// // // //     location: "Victoria Island, Lagos",
// // // //     price: 200,
// // // //     image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400",
// // // //     rating: 4.9
// // // //   },
// // // //   {
// // // //     id: 3,
// // // //     title: "Cozy Studio Apartment",
// // // //     location: "Ikeja, Lagos",
// // // //     price: 75,
// // // //     image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
// // // //     rating: 4.5
// // // //   }
// // // // ];

// // // // export default function Home() {
// // // //   return (
// // // //     <main>
// // // //       {/* Hero Section */}
// // // //       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-20">
// // // //         <div className="container mx-auto px-4 text-center">
// // // //           <h1 className="text-4xl md:text-5xl font-bold mb-6">
// // // //             Find Your Perfect Shortlet
// // // //           </h1>
// // // //           <p className="text-lg md:text-xl mb-8 opacity-90">
// // // //             Discover amazing apartments and villas for your next trip
// // // //           </p>
// // // //           <div className="max-w-2xl mx-auto bg-[#fcfeff] rounded-lg p-2 shadow-lg">
// // // //             <div className="flex">
// // // //               <input 
// // // //                 type="text" 
// // // //                 placeholder="Where are you going?"
// // // //                 className="flex-1 px-4 py-3 text-[#383a3c] rounded-l-lg focus:outline-none"
// // // //               />
// // // //               <button className="bg-[#f06123] text-[#fcfeff] px-4 md:px-6 py-3 rounded-r-lg font-semibold hover:bg-orange-600 transition duration-200 flex items-center justify-center">
// // // //                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
// // // //                 </svg>
// // // //                 <span className="sr-only">Search</span>
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </section>

// // // //       {/* Properties Section */}
// // // //       <section className="container mx-auto px-4 py-16 bg-gray-50">
// // // //         <h2 className="text-3xl font-bold text-[#383a3c] mb-8 text-center">Featured Properties</h2>
// // // //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // // //           {sampleProperties.map((property) => (
// // // //             <PropertyCard
// // // //               key={property.id}
// // // //               id={property.id} 
// // // //               title={property.title}
// // // //               location={property.location}
// // // //               price={property.price}
// // // //               image={property.image}
// // // //               rating={property.rating}
// // // //             />
// // // //           ))}
// // // //         </div>
// // // //       </section>
// // // //     </main>
// // // //   );
// // // // }





























































// // // // import PropertyCard from "@/components/PropertyCard";

// // // // const sampleProperties = [
// // // //   {
// // // //     id: 1,
// // // //     title: "Luxury Apartment in City Center",
// // // //     location: "Lagos, Nigeria",
// // // //     price: 120,
// // // //     image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
// // // //     rating: 4.8
// // // //   },
// // // //   {
// // // //     id: 2,
// // // //     title: "Beachfront Villa",
// // // //     location: "Victoria Island, Lagos",
// // // //     price: 200,
// // // //     image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400",
// // // //     rating: 4.9
// // // //   },
// // // //   {
// // // //     id: 3,
// // // //     title: "Cozy Studio Apartment",
// // // //     location: "Ikeja, Lagos",
// // // //     price: 75,
// // // //     image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
// // // //     rating: 4.5
// // // //   }
// // // // ];

// // // // export default function Home() {
// // // //   return (
// // // //     <main>
// // // //       {/* Hero Section */}
// // // //       <section className="bg-gradient-to-br from-[#383a3c] to-gray-800 text-[#fcfeff] py-20">
// // // //         <div className="container mx-auto px-4 text-center">
// // // //           <h1 className="text-5xl font-bold mb-6">
// // // //             Find Your Perfect Shortlet
// // // //           </h1>
// // // //           <p className="text-xl mb-8 opacity-90">
// // // //             Discover amazing apartments and villas for your next trip
// // // //           </p>
// // // //           <div className="max-w-2xl mx-auto bg-[#fcfeff] rounded-lg p-2 shadow-lg">
// // // //             <div className="flex">
// // // //               <input 
// // // //                 type="text" 
// // // //                 placeholder="Where are you going?"
// // // //                 className="flex-1 px-4 py-3 text-[#383a3c] rounded-l-lg focus:outline-none"
// // // //               />
// // // //               <button className="bg-[#f06123] text-[#fcfeff] px-8 py-3 rounded-r-lg font-semibold hover:bg-orange-600 transition duration-200">
// // // //                 Search
// // // //               </button>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </section>

// // // //       {/* Properties Section */}
// // // //       <section className="container mx-auto px-4 py-16 bg-gray-50">
// // // //         <h2 className="text-3xl font-bold text-[#383a3c] mb-8 text-center">Featured Properties</h2>
// // // //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // // //           {sampleProperties.map((property) => (
// // // //             <PropertyCard
// // // //               key={property.id}
// // // //               id={property.id} 
// // // //               title={property.title}
// // // //               location={property.location}
// // // //               price={property.price}
// // // //               image={property.image}
// // // //               rating={property.rating}
// // // //             />
// // // //           ))}
// // // //         </div>
// // // //       </section>
// // // //     </main>
// // // //   );
// // // // }

