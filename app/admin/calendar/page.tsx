// app/admin/calendar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { bookingsAPI, propertiesAPI } from '@/lib/api';

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    type: string;
    price: number;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  type: string;
  price: number;
  status: string;
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, propertiesResponse] = await Promise.all([
        bookingsAPI.getAdminBookings(),
        propertiesAPI.getAdminProperties()
      ]);
      setBookings(bookingsResponse.bookings || []);
      setProperties(propertiesResponse.properties || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const propertyMatch = selectedProperty === 'all' || booking.property._id === selectedProperty;
    const statusMatch = selectedStatus === 'all' || booking.bookingStatus === selectedStatus;
    return propertyMatch && statusMatch;
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return date >= checkIn && date <= checkOut;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPropertyColor = (propertyId: string) => {
    const colors = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-purple-100 border-purple-300',
      'bg-orange-100 border-orange-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300',
    ];
    const index = properties.findIndex(p => p._id === propertyId) % colors.length;
    return colors[index] || 'bg-gray-100 border-gray-300';
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`prev-${i}`} className="p-2 border border-gray-200 bg-gray-50"></div>);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayBookings = getBookingsForDate(date);
      
      days.push(
        <div key={day} className="p-2 border border-gray-200 min-h-24 bg-white hover:bg-gray-50">
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${
              date.toDateString() === new Date().toDateString() 
                ? 'bg-[#f06123] text-white rounded-full w-6 h-6 flex items-center justify-center'
                : 'text-gray-900'
            }`}>
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                {dayBookings.length}
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {dayBookings.slice(0, 3).map(booking => (
              <div
                key={booking._id}
                className={`text-xs p-1 rounded border-l-4 ${getPropertyColor(booking.property._id)} ${getStatusColor(booking.bookingStatus)}`}
                title={`${booking.property.title} - ${booking.user.firstName} ${booking.user.lastName}`}
              >
                <div className="font-medium truncate">{booking.property.title}</div>
                <div className="text-gray-600 truncate">
                  {booking.user.firstName} {booking.bookingStatus}
                </div>
              </div>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayBookings.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const getUpcomingCheckIns = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return filteredBookings
      .filter(booking => {
        const checkIn = new Date(booking.checkIn);
        return checkIn >= today && checkIn <= nextWeek && booking.bookingStatus === 'confirmed';
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
      .slice(0, 5);
  };

  const getUpcomingCheckOuts = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return filteredBookings
      .filter(booking => {
        const checkOut = new Date(booking.checkOut);
        return checkOut >= today && checkOut <= nextWeek && booking.bookingStatus === 'confirmed';
      })
      .sort((a, b) => new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Calendar</h1>
          <p className="text-gray-600 mt-2">View property availability and bookings</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading calendar data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#383a3c]">Booking Calendar</h1>
          <p className="text-gray-600 mt-2">Manage property availability and view all bookings</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            >
              <option value="all">All Properties</option>
              {properties.map(property => (
                <option key={property._id} value={property._id}>
                  {property.title} - {property.location}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-[#383a3c]">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
              {day}
            </div>
          ))}
          {/* Calendar days */}
          {renderMonthView()}
        </div>
      </div>

      {/* Quick Stats and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Bookings</span>
              <span className="font-semibold">{bookings.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmed</span>
              <span className="font-semibold text-green-600">
                {bookings.filter(b => b.bookingStatus === 'confirmed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                {bookings.filter(b => b.bookingStatus === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Properties</span>
              <span className="font-semibold">
                {properties.filter(p => p.status === 'active').length}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Check-ins */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Upcoming Check-ins</h3>
          <div className="space-y-3">
            {getUpcomingCheckIns().map(booking => (
              <div key={booking._id} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{booking.property.title}</div>
                  <div className="text-xs text-gray-600">{booking.user.firstName} {booking.user.lastName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {new Date(booking.checkIn).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">{booking.guests} guests</div>
                </div>
              </div>
            ))}
            {getUpcomingCheckIns().length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">No upcoming check-ins</p>
            )}
          </div>
        </div>

        {/* Upcoming Check-outs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Upcoming Check-outs</h3>
          <div className="space-y-3">
            {getUpcomingCheckOuts().map(booking => (
              <div key={booking._id} className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{booking.property.title}</div>
                  <div className="text-xs text-gray-600">{booking.user.firstName} {booking.user.lastName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">{booking.guests} guests</div>
                </div>
              </div>
            ))}
            {getUpcomingCheckOuts().length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">No upcoming check-outs</p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
}