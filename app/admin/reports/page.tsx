// app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { bookingsAPI, propertiesAPI, usersAPI } from '@/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ReportData {
  revenue: {
    monthly: Array<{ month: string; revenue: number; bookings: number }>;
    total: number;
    growth: number;
  };
  bookings: {
    byStatus: Array<{ status: string; count: number }>;
    monthlyTrend: Array<{ month: string; count: number }>;
    topProperties: Array<{ property: string; bookings: number; revenue: number }>;
  };
  users: {
    growth: Array<{ month: string; count: number }>;
    total: number;
    verified: number;
  };
  properties: {
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    featured: number;
  };
}

interface Report {
  name: string;
  description: string;
  icon: string;
  type: 'revenue' | 'bookings' | 'users' | 'properties';
}

export default function ReportsPage() {
  const [reports] = useState<Report[]>([
    { name: 'Revenue Report', description: 'Monthly revenue and earnings', icon: '💰', type: 'revenue' },
    { name: 'Booking Analytics', description: 'Booking trends and patterns', icon: '📊', type: 'bookings' },
    { name: 'User Growth', description: 'New user registrations', icon: '👥', type: 'users' },
    { name: 'Property Performance', description: 'Top performing properties', icon: '🏠', type: 'properties' }
  ]);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | '1year'>('30days');

  useEffect(() => {
    if (selectedReport) {
      fetchReportData();
    }
  }, [selectedReport, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [bookingsResponse, propertiesResponse, usersResponse] = await Promise.all([
        bookingsAPI.getAdminBookings(),
        propertiesAPI.getAdminProperties(),
        usersAPI.getUsers()
      ]);

      const bookings = bookingsResponse.bookings || [];
      const properties = propertiesResponse.properties || [];
      const users = usersResponse || [];

      // Transform data into report format
      const data = transformDataToReport(bookings, properties, users, dateRange);
      setReportData(data);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformDataToReport = (bookings: any[], properties: any[], users: any[], range: string): ReportData => {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter bookings by date range
    const filteredBookings = bookings.filter(booking => 
      new Date(booking.createdAt) >= startDate
    );

    // Revenue data
    const monthlyRevenue = calculateMonthlyRevenue(filteredBookings);
    const totalRevenue = filteredBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Booking data
    const bookingsByStatus = calculateBookingsByStatus(filteredBookings);
    const monthlyBookings = calculateMonthlyBookings(filteredBookings);
    const topProperties = calculateTopProperties(filteredBookings, properties);

    // User data
    const userGrowth = calculateUserGrowth(users, range);
    const totalUsers = users.length;
    const verifiedUsers = users.filter((user: any) => user.isVerified).length;

    // Property data
    const propertiesByType = calculatePropertiesByType(properties);
    const propertiesByStatus = calculatePropertiesByStatus(properties);
    const featuredProperties = properties.filter((p: any) => p.isFeatured).length;

    return {
      revenue: {
        monthly: monthlyRevenue,
        total: totalRevenue,
        growth: calculateGrowthRate(monthlyRevenue)
      },
      bookings: {
        byStatus: bookingsByStatus,
        monthlyTrend: monthlyBookings,
        topProperties: topProperties.slice(0, 10)
      },
      users: {
        growth: userGrowth,
        total: totalUsers,
        verified: verifiedUsers
      },
      properties: {
        byType: propertiesByType,
        byStatus: propertiesByStatus,
        featured: featuredProperties
      }
    };
  };

  // Helper functions for data transformation
  const calculateMonthlyRevenue = (bookings: any[]) => {
    const monthlyData: { [key: string]: { revenue: number; bookings: number } } = {};
    
    bookings.forEach(booking => {
      if (booking.paymentStatus === 'paid') {
        const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, bookings: 0 };
        }
        monthlyData[month].revenue += booking.totalAmount;
        monthlyData[month].bookings += 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));
  };

  const calculateBookingsByStatus = (bookings: any[]) => {
    const statusCount: { [key: string]: number } = {};
    bookings.forEach(booking => {
      statusCount[booking.bookingStatus] = (statusCount[booking.bookingStatus] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({ status, count }));
  };

  const calculateMonthlyBookings = (bookings: any[]) => {
    const monthlyCount: { [key: string]: number } = {};
    bookings.forEach(booking => {
      const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });
    return Object.entries(monthlyCount).map(([month, count]) => ({ month, count }));
  };

  const calculateTopProperties = (bookings: any[], properties: any[]) => {
    const propertyStats: { [key: string]: { bookings: number; revenue: number; title: string } } = {};
    
    bookings.forEach(booking => {
      if (booking.paymentStatus === 'paid') {
        const propId = booking.property._id;
        if (!propertyStats[propId]) {
          const property = properties.find((p: any) => p._id === propId);
          propertyStats[propId] = { 
            bookings: 0, 
            revenue: 0, 
            title: property?.title || 'Unknown Property' 
          };
        }
        propertyStats[propId].bookings += 1;
        propertyStats[propId].revenue += booking.totalAmount;
      }
    });

    return Object.entries(propertyStats)
      // .map(([_, stats]) => stats)
      .map(([_, stats]) => ({
        property: stats.title,
        bookings: stats.bookings,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const calculateUserGrowth = (users: any[], range: string) => {
    const monthlyGrowth: { [key: string]: number } = {};
    users.forEach((user: any) => {
      const month = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
    });
    return Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count }));
  };

  const calculatePropertiesByType = (properties: any[]) => {
    const typeCount: { [key: string]: number } = {};
    properties.forEach((property: any) => {
      typeCount[property.type] = (typeCount[property.type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([type, count]) => ({ type, count }));
  };

  const calculatePropertiesByStatus = (properties: any[]) => {
    const statusCount: { [key: string]: number } = {};
    properties.forEach((property: any) => {
      statusCount[property.status] = (statusCount[property.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({ status, count }));
  };

  const calculateGrowthRate = (monthlyData: any[]) => {
    if (monthlyData.length < 2) return 0;
    const current = monthlyData[monthlyData.length - 1]?.revenue || 0;
    const previous = monthlyData[monthlyData.length - 2]?.revenue || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const downloadReport = () => {
    if (!reportData) return;

    const reportContent = generateReportContent();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportContent = () => {
    if (!reportData) return '';

    let content = `${selectedReport} - Generated on ${new Date().toLocaleDateString()}\n\n`;
    content += `Date Range: ${dateRange}\n`;
    content += '='.repeat(50) + '\n\n';

    switch (selectedReport) {
      case 'Revenue Report':
        content += `Total Revenue: ₦${reportData.revenue.total.toLocaleString()}\n`;
        content += `Revenue Growth: ${reportData.revenue.growth.toFixed(1)}%\n\n`;
        content += 'Monthly Revenue:\n';
        reportData.revenue.monthly.forEach(item => {
          content += `  ${item.month}: ₦${item.revenue.toLocaleString()} (${item.bookings} bookings)\n`;
        });
        break;

      case 'Booking Analytics':
        content += 'Bookings by Status:\n';
        reportData.bookings.byStatus.forEach(item => {
          content += `  ${item.status}: ${item.count}\n`;
        });
        content += '\nTop Performing Properties:\n';
        reportData.bookings.topProperties.forEach((item, index) => {
          content += `  ${index + 1}. ${item.property}: ${item.bookings} bookings (₦${item.revenue.toLocaleString()})\n`;
        });
        break;

      case 'User Growth':
        content += `Total Users: ${reportData.users.total}\n`;
        content += `Verified Users: ${reportData.users.verified}\n`;
        content += `Verification Rate: ${((reportData.users.verified / reportData.users.total) * 100).toFixed(1)}%\n\n`;
        content += 'User Growth Trend:\n';
        reportData.users.growth.forEach(item => {
          content += `  ${item.month}: +${item.count} users\n`;
        });
        break;

      case 'Property Performance':
        content += `Total Properties: ${reportData.properties.byType.reduce((sum, item) => sum + item.count, 0)}\n`;
        content += `Featured Properties: ${reportData.properties.featured}\n\n`;
        content += 'Properties by Type:\n';
        reportData.properties.byType.forEach(item => {
          content += `  ${item.type}: ${item.count}\n`;
        });
        content += '\nProperties by Status:\n';
        reportData.properties.byStatus.forEach(item => {
          content += `  ${item.status}: ${item.count}\n`;
        });
        break;
    }

    return content;
  };

  const COLORS = ['#f06123', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'Revenue Report':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Total Revenue</h3>
                <p className="text-2xl font-bold text-[#f06123]">₦{reportData.revenue.total.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Growth Rate</h3>
                <p className={`text-2xl font-bold ${reportData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.revenue.growth.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Period</h3>
                <p className="text-2xl font-bold text-gray-600">{dateRange}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Monthly Revenue & Bookings</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.revenue.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `₦${Number(value).toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#f06123" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#0088FE" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'Booking Analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Bookings by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.bookings.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.bookings.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Monthly Booking Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.bookings.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#f06123" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Top Performing Properties</h3>
              <div className="space-y-3">
                {reportData.bookings.topProperties.map((property, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-semibold">{property.property}</span>
                      <span className="text-gray-600 ml-2">({property.bookings} bookings)</span>
                    </div>
                    <span className="font-bold text-[#f06123]">₦{property.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'User Growth':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Total Users</h3>
                <p className="text-2xl font-bold text-[#f06123]">{reportData.users.total}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Verified Users</h3>
                <p className="text-2xl font-bold text-green-600">{reportData.users.verified}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Verification Rate</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {((reportData.users.verified / reportData.users.total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">User Growth Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.users.growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f06123" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'Property Performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Total Properties</h3>
                <p className="text-2xl font-bold text-[#f06123]">
                  {reportData.properties.byType.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Featured</h3>
                <p className="text-2xl font-bold text-yellow-600">{reportData.properties.featured}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700">Active</h3>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.properties.byStatus.find(p => p.status === 'active')?.count || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Properties by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.properties.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.properties.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Properties by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.properties.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f06123" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive financial and business intelligence reports</p>
      </div>

      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{report.icon}</div>
                <div>
                  <h3 className="font-semibold text-[#383a3c]">{report.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(report.name)}
                className="w-full mt-4 bg-[#f06123] text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
              >
                Generate Report
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#383a3c]">{selectedReport}</h2>
                <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
                <button
                  onClick={downloadReport}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
                >
                  Back to Reports
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
              <span className="ml-3 text-gray-600">Generating report...</span>
            </div>
          ) : (
            renderReportContent()
          )}
        </div>
      )}
    </div>
  );
}
















































































// export default function ReportsPage() {
//   const reports = [
//     { name: 'Revenue Report', description: 'Monthly revenue and earnings', icon: '💰' },
//     { name: 'Booking Analytics', description: 'Booking trends and patterns', icon: '📊' },
//     { name: 'User Growth', description: 'New user registrations', icon: '👥' },
//     { name: 'Property Performance', description: 'Top performing properties', icon: '🏠' }
//   ];

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Reports</h1>
//         <p className="text-gray-600 mt-2">Financial and analytics reports</p>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {reports.map((report, index) => (
//           <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
//             <div className="flex items-center space-x-4">
//               <div className="text-3xl">{report.icon}</div>
//               <div>
//                 <h3 className="font-semibold text-[#383a3c]">{report.name}</h3>
//                 <p className="text-gray-600 text-sm mt-1">{report.description}</p>
//               </div>
//             </div>
//             <button className="w-full mt-4 bg-[#f06123] text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200">
//               Generate Report
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


