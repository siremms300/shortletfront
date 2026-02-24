'use client';

import { useState, useEffect } from 'react';
import { utilityAPI, propertiesAPI } from '@/lib/api';

interface UtilityReading {
  _id: string;
  readingNumber: string;
  property: {
    _id: string;
    title: string;
    location: string;
  };
  unit: string;
  type: 'electricity' | 'water' | 'gas' | 'internet' | 'waste' | 'sewage';
  previousReading: number;
  currentReading: number;
  readingDate: string;
  consumption: number;
  cost: number;
  rate: number;
  billed: boolean;
  billedAt?: string;
  notes?: string;
  meterNumber?: string;
  estimated?: boolean;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UtilityRate {
  _id: string;
  type: 'electricity' | 'water' | 'gas' | 'internet' | 'waste' | 'sewage';
  rate: number;
  unit: string;
  tier1Limit?: number;
  tier1Rate?: number;
  tier2Limit?: number;
  tier2Rate?: number;
  tier3Rate?: number;
  lastUpdated: string;
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface UtilityAlert {
  _id: string;
  alertNumber: string;
  type: 'high_usage' | 'unusual_consumption' | 'meter_issue' | 'billing_due' | 'rate_change';
  severity: 'low' | 'medium' | 'high';
  message: string;
  property?: {
    _id: string;
    title: string;
  };
  unit?: string;
  utilityType: string;
  value?: number;
  threshold?: number;
  date: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface UtilityStats {
  totalReadings: number;
  monthlyConsumption: number;
  monthlyCost: number;
  unbilledAmount: number;
  averageConsumption: number;
  utilityBreakdown: Array<{
    type: string;
    consumption: number;
    cost: number;
    count: number;
  }>;
  propertyStats: Array<{
    property: string;
    consumption: number;
    cost: number;
  }>;
}

interface Property {
  _id: string;
  title: string;
  location: string;
}

// Unit mapping for display
const UNIT_MAP: Record<string, string> = {
  electricity: 'kWh',
  water: 'm³',
  gas: 'm³',
  internet: 'GB',
  waste: 'month',
  sewage: 'month'
};

export default function UtilityTracker() {
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [rates, setRates] = useState<UtilityRate[]>([]);
  const [alerts, setAlerts] = useState<UtilityAlert[]>([]);
  const [stats, setStats] = useState<UtilityStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddReading, setShowAddReading] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedReading, setSelectedReading] = useState<UtilityReading | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<UtilityAlert | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBilled, setFilterBilled] = useState<string>('all');
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [newReading, setNewReading] = useState({
    propertyId: '',
    unit: '',
    type: 'electricity' as UtilityReading['type'],
    previousReading: 0,
    currentReading: 0,
    readingDate: new Date().toISOString().split('T')[0],
    meterNumber: '',
    estimated: false,
    notes: ''
  });

  const [editReading, setEditReading] = useState({
    propertyId: '',
    unit: '',
    type: 'electricity' as UtilityReading['type'],
    previousReading: 0,
    currentReading: 0,
    readingDate: '',
    meterNumber: '',
    estimated: false,
    notes: '',
    billed: false
  });

  const [bulkReadings, setBulkReadings] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [selectedPeriod, dateRange]);

  // const fetchData = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');
      
  //     console.log('Fetching utility data...');
      
  //     // Fetch all necessary data in parallel
  //     const [
  //       readingsResponse, 
  //       ratesResponse, 
  //       alertsResponse, 
  //       statsResponse, 
  //       propertiesResponse
  //     ] = await Promise.all([
  //       utilityAPI.getReadings({ 
  //         period: selectedPeriod,
  //         startDate: dateRange.startDate,
  //         endDate: dateRange.endDate
  //       }).catch(err => {
  //         console.log('Readings endpoint not available yet:', err.message);
  //         return { readings: [] };
  //       }),
        
  //       utilityAPI.getRates().catch(err => {
  //         console.log('Rates endpoint not available yet:', err.message);
  //         return { rates: [] };
  //       }),
        
  //       utilityAPI.getAlerts().catch(err => {
  //         console.log('Alerts endpoint not available yet:', err.message);
  //         return { alerts: [] };
  //       }),
        
  //       utilityAPI.getStats({ 
  //         period: selectedPeriod,
  //         startDate: dateRange.startDate,
  //         endDate: dateRange.endDate
  //       }).catch(err => {
  //         console.log('Stats endpoint not available yet:', err.message);
  //         return { stats: null };
  //       }),
        
  //       propertiesAPI.getProperties({ limit: 100 }).catch(err => {
  //         console.log('Properties endpoint error:', err.message);
  //         return { properties: [] };
  //       })
  //     ]);
      
  //     setReadings(readingsResponse.readings || []);
      
  //     // If rates are empty, set default rates
  //     if (!ratesResponse.rates || ratesResponse.rates.length === 0) {
  //       setRates([
  //         { 
  //           _id: '1', 
  //           type: 'electricity', 
  //           rate: 65.50, 
  //           unit: 'kWh',
  //           tier1Limit: 500,
  //           tier1Rate: 55.50,
  //           tier2Limit: 1000,
  //           tier2Rate: 65.50,
  //           tier3Rate: 75.50,
  //           lastUpdated: new Date().toISOString()
  //         },
  //         { _id: '2', type: 'water', rate: 450.75, unit: 'm³', lastUpdated: new Date().toISOString() },
  //         { _id: '3', type: 'gas', rate: 350.25, unit: 'm³', lastUpdated: new Date().toISOString() },
  //         { _id: '4', type: 'internet', rate: 15000, unit: 'GB', lastUpdated: new Date().toISOString() },
  //         { _id: '5', type: 'waste', rate: 5000, unit: 'monthly', lastUpdated: new Date().toISOString() },
  //         { _id: '6', type: 'sewage', rate: 3500, unit: 'monthly', lastUpdated: new Date().toISOString() }
  //       ]);
  //     } else {
  //       setRates(ratesResponse.rates);
  //     }
      
  //     setAlerts(alertsResponse.alerts || []);
  //     setStats(statsResponse.stats || null);
  //     setProperties(propertiesResponse.properties || []);
      
  //   } catch (error: any) {
  //     console.error('Failed to fetch utility data:', error);
  //     setError(error.response?.data?.message || 'Failed to load utility data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching utility data...');
      
      // First, explicitly fetch properties and log them
      console.log('Fetching properties...');
      const propertiesResponse = await propertiesAPI.getProperties({ limit: 100 });
      console.log('Properties response:', propertiesResponse);
      
      if (propertiesResponse && propertiesResponse.properties) {
        console.log(`Found ${propertiesResponse.properties.length} properties`);
        setProperties(propertiesResponse.properties);
      } else if (Array.isArray(propertiesResponse)) {
        console.log(`Found ${propertiesResponse.length} properties (array format)`);
        setProperties(propertiesResponse);
      } else {
        console.warn('Unexpected properties response format:', propertiesResponse);
        setProperties([]);
      }
      
      // Then fetch other data
      const [readingsResponse, ratesResponse, alertsResponse, statsResponse] = await Promise.all([
        utilityAPI.getReadings({ 
          period: selectedPeriod,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }).catch(err => {
          console.log('Readings endpoint not available yet:', err.message);
          return { readings: [] };
        }),
        
        utilityAPI.getRates().catch(err => {
          console.log('Rates endpoint not available yet:', err.message);
          return { rates: [] };
        }),
        
        utilityAPI.getAlerts().catch(err => {
          console.log('Alerts endpoint not available yet:', err.message);
          return { alerts: [] };
        }),
        
        utilityAPI.getStats({ 
          period: selectedPeriod,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }).catch(err => {
          console.log('Stats endpoint not available yet:', err.message);
          return { stats: null };
        })
      ]);
      
      setReadings(readingsResponse.readings || []);
      
      // Set rates (with fallback)
      if (!ratesResponse.rates || ratesResponse.rates.length === 0) {
        setRates([
          { 
            _id: '1', 
            type: 'electricity', 
            rate: 65.50, 
            unit: 'kWh',
            tier1Limit: 500,
            tier1Rate: 55.50,
            tier2Limit: 1000,
            tier2Rate: 65.50,
            tier3Rate: 75.50,
            lastUpdated: new Date().toISOString()
          },
          { _id: '2', type: 'water', rate: 450.75, unit: 'm³', lastUpdated: new Date().toISOString() },
          { _id: '3', type: 'gas', rate: 350.25, unit: 'm³', lastUpdated: new Date().toISOString() },
          { _id: '4', type: 'internet', rate: 15000, unit: 'GB', lastUpdated: new Date().toISOString() },
          { _id: '5', type: 'waste', rate: 5000, unit: 'monthly', lastUpdated: new Date().toISOString() },
          { _id: '6', type: 'sewage', rate: 3500, unit: 'monthly', lastUpdated: new Date().toISOString() }
        ]);
      } else {
        setRates(ratesResponse.rates);
      }
      
      setAlerts(alertsResponse.alerts || []);
      setStats(statsResponse.stats || null);
      
    } catch (error: any) {
      console.error('Failed to fetch utility data:', error);
      setError(error.response?.data?.message || 'Failed to load utility data');
    } finally {
      setLoading(false);
    }
  };





  // Helper functions
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity': return '⚡';
      case 'water': return '💧';
      case 'gas': return '🔥';
      case 'internet': return '🌐';
      case 'waste': return '🗑️';
      case 'sewage': return '🚽';
      default: return '📊';
    }
  };

  const getUtilityColor = (type: string) => {
    switch (type) {
      case 'electricity': return 'text-blue-600';
      case 'water': return 'text-cyan-600';
      case 'gas': return 'text-orange-600';
      case 'internet': return 'text-purple-600';
      case 'waste': return 'text-gray-600';
      case 'sewage': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getUnitForType = (type: string): string => {
    const rate = rates.find(r => r.type === type);
    return rate?.unit || UNIT_MAP[type] || 'unit';
  };

  // Add reading function
  const addReading = async () => {
    try {
      // Validate inputs
      if (!newReading.propertyId || !newReading.unit || !newReading.type) {
        alert('Property, unit, and utility type are required');
        return;
      }

      if (newReading.currentReading <= newReading.previousReading) {
        alert('Current reading must be greater than previous reading');
        return;
      }

      const readingData = {
        propertyId: newReading.propertyId,
        unit: newReading.unit,
        type: newReading.type,
        previousReading: Number(newReading.previousReading),
        currentReading: Number(newReading.currentReading),
        readingDate: newReading.readingDate,
        meterNumber: newReading.meterNumber || undefined,
        estimated: newReading.estimated,
        notes: newReading.notes || undefined
      };

      console.log('Adding reading:', readingData);

      const response = await utilityAPI.createReading(readingData);
      
      if (response && response.reading) {
        setReadings([response.reading, ...readings]);
        setShowAddReading(false);
        setNewReading({
          propertyId: '',
          unit: '',
          type: 'electricity',
          previousReading: 0,
          currentReading: 0,
          readingDate: new Date().toISOString().split('T')[0],
          meterNumber: '',
          estimated: false,
          notes: ''
        });
        
        // Refresh data
        await fetchData();
        alert('Reading added successfully!');
      }
      
    } catch (error: any) {
      console.error('Add reading error:', error);
      alert(error.response?.data?.message || 'Failed to add reading');
    }
  };

  // Update reading function
  const updateReading = async () => {
    if (!selectedReading) return;

    try {
      const readingData = {
        propertyId: editReading.propertyId,
        unit: editReading.unit,
        type: editReading.type,
        previousReading: Number(editReading.previousReading),
        currentReading: Number(editReading.currentReading),
        readingDate: editReading.readingDate,
        meterNumber: editReading.meterNumber || undefined,
        estimated: editReading.estimated,
        notes: editReading.notes || undefined,
        billed: editReading.billed
      };

      const response = await utilityAPI.updateReading(selectedReading._id, readingData);
      
      if (response && response.reading) {
        setReadings(readings.map(r => r._id === selectedReading._id ? response.reading : r));
        setShowEditModal(false);
        setSelectedReading(null);
        await fetchData();
        alert('Reading updated successfully!');
      }
      
    } catch (error: any) {
      console.error('Update reading error:', error);
      alert(error.response?.data?.message || 'Failed to update reading');
    }
  };

  // Delete reading function
  const deleteReading = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reading? This action cannot be undone.')) {
      return;
    }

    try {
      await utilityAPI.deleteReading(id);
      setReadings(readings.filter(r => r._id !== id));
      await fetchData();
      alert('Reading deleted successfully!');
    } catch (error: any) {
      console.error('Delete reading error:', error);
      alert(error.response?.data?.message || 'Failed to delete reading');
    }
  };

  // Mark as billed function
  const markAsBilled = async (id: string) => {
    try {
      const response = await utilityAPI.markAsBilled(id);
      
      if (response && response.reading) {
        setReadings(readings.map(r => r._id === id ? response.reading : r));
        alert('Reading marked as billed!');
      }
      
    } catch (error: any) {
      console.error('Mark as billed error:', error);
      alert(error.response?.data?.message || 'Failed to mark as billed');
    }
  };

  // Mark all as billed function
  const markAllBilled = async () => {
    const unbilledReadings = readings.filter(r => !r.billed);
    
    if (unbilledReadings.length === 0) {
      alert('No unbilled readings to mark');
      return;
    }

    if (!confirm(`Mark ${unbilledReadings.length} readings as billed?`)) {
      return;
    }

    try {
      // Process one by one
      for (const reading of unbilledReadings) {
        await utilityAPI.markAsBilled(reading._id);
      }
      
      await fetchData();
      alert('All readings marked as billed!');
      
    } catch (error: any) {
      console.error('Mark all billed error:', error);
      alert(error.response?.data?.message || 'Failed to mark all as billed');
    }
  };

  // Resolve alert function
  const resolveAlert = async (id: string) => {
    try {
      const response = await utilityAPI.resolveAlert(id);
      
      if (response && response.alert) {
        setAlerts(alerts.map(a => a._id === id ? response.alert : a));
        alert('Alert resolved!');
      }
      
    } catch (error: any) {
      console.error('Resolve alert error:', error);
      alert(error.response?.data?.message || 'Failed to resolve alert');
    }
  };

  // Update rate function
  const updateRate = async (type: string, newRate: number) => {
    if (!confirm(`Update rate for ${type} to ${formatCurrency(newRate)}?`)) {
      return;
    }

    try {
      const response = await utilityAPI.updateRate(type, { rate: newRate });
      
      if (response && response.rate) {
        setRates(rates.map(r => r.type === type ? response.rate : r));
        alert('Rate updated successfully!');
      }
      
    } catch (error: any) {
      console.error('Update rate error:', error);
      alert(error.response?.data?.message || 'Failed to update rate');
    }
  };

  // Bulk upload function
  const processBulkUpload = async () => {
    const lines = bulkReadings.split('\n').filter(line => line.trim());
    const readingsToProcess = [];

    for (const line of lines) {
      const [propertyTitle, unit, type, previous, current, date] = line.split(',').map(s => s.trim());
      
      if (propertyTitle && unit && type && previous && current && date) {
        // Find property by title (case-insensitive partial match)
        const property = properties.find(p => 
          p.title.toLowerCase().includes(propertyTitle.toLowerCase())
        );

        if (property) {
          readingsToProcess.push({
            propertyId: property._id,
            unit,
            type: type as UtilityReading['type'],
            previousReading: parseFloat(previous),
            currentReading: parseFloat(current),
            readingDate: date,
            estimated: false
          });
        } else {
          console.warn(`Property not found: ${propertyTitle}`);
        }
      }
    }

    if (readingsToProcess.length === 0) {
      alert('No valid readings found in the uploaded data');
      return;
    }

    try {
      const response = await utilityAPI.bulkUpload(readingsToProcess);
      
      if (response && response.readings) {
        setReadings([...response.readings, ...readings]);
        setShowBulkUpload(false);
        setBulkReadings('');
        await fetchData();
        alert(`Successfully uploaded ${response.readings.length} readings!`);
      }
      
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload readings');
    }
  };

  // Export readings function
  const exportReadings = async () => {
    try {
      const blob = await utilityAPI.exportReadings({
        filterType: filterType !== 'all' ? filterType : undefined,
        filterBilled: filterBilled !== 'all' ? filterBilled : undefined,
        filterProperty: filterProperty !== 'all' ? filterProperty : undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utility-readings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Export error:', error);
      alert(error.response?.data?.message || 'Failed to export readings');
    }
  };

  // Filter readings
  const filteredReadings = readings
    .filter(reading => 
      (filterType === 'all' || reading.type === filterType) &&
      (filterBilled === 'all' || 
        (filterBilled === 'billed' && reading.billed) ||
        (filterBilled === 'unbilled' && !reading.billed)) &&
      (filterProperty === 'all' || reading.property._id === filterProperty) &&
      (reading.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       reading.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (reading.meterNumber && reading.meterNumber.toLowerCase().includes(searchTerm.toLowerCase())))
    );

  const activeAlerts = alerts.filter(alert => !alert.resolved);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#383a3c]">Utility Tracking</h2>
            <p className="text-gray-600">Loading utility data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading utility data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#383a3c]">Utility Tracking</h2>
          <p className="text-gray-600">Monitor and analyze utility consumption across properties</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 cursor-pointer"
          >
            📁 Bulk Upload
          </button>
          <button
            onClick={() => setShowRatesModal(true)}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer"
          >
            💰 Rates
          </button>
          <button
            onClick={() => setShowAddReading(true)}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
          >
            + Add Reading
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-800 font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#383a3c]">Utility Alerts</h3>
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {activeAlerts.length} active
            </span>
          </div>
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert._id} className={`flex items-center justify-between p-4 border rounded-lg ${getAlertColor(alert.severity)}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm opacity-75">
                      {alert.property?.title || 'All Properties'} • {alert.unit || 'All Units'} • {new Date(alert.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => resolveAlert(alert._id)}
                  className="text-sm bg-white bg-opacity-50 hover:bg-opacity-75 px-3 py-1 rounded cursor-pointer"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utility Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.monthlyConsumption)}</div>
            <div className="text-gray-600">Monthly Consumption</div>
            <div className="text-sm text-gray-500 mt-1">All utilities</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyCost)}</div>
            <div className="text-gray-600">Monthly Cost</div>
            <div className="text-sm text-gray-500 mt-1">Current period</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.unbilledAmount)}</div>
            <div className="text-gray-600">Unbilled Amount</div>
            <div className="text-sm text-gray-500 mt-1">{readings.filter(r => !r.billed).length} readings</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.averageConsumption)}</div>
            <div className="text-gray-600">Avg Consumption</div>
            <div className="text-sm text-gray-500 mt-1">Per reading</div>
          </div>
        </div>
      )}

      {/* Utility Type Breakdown */}
      {stats && stats.utilityBreakdown && stats.utilityBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Utility Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.utilityBreakdown.map((utility) => (
              <div key={utility.type} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">{getUtilityIcon(utility.type)}</div>
                <div className="font-semibold text-gray-900 capitalize">{utility.type}</div>
                <div className={`text-xl font-bold ${getUtilityColor(utility.type)}`}>
                  {formatNumber(utility.consumption)} {getUnitForType(utility.type)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(utility.cost)} • {utility.count} readings
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Range and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by property, unit, or meter number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            />
          </div>
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property._id} value={property._id}>
                {property.title}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Utilities</option>
            <option value="electricity">Electricity</option>
            <option value="water">Water</option>
            <option value="gas">Gas</option>
            <option value="internet">Internet</option>
            <option value="waste">Waste</option>
            <option value="sewage">Sewage</option>
          </select>
          <select
            value={filterBilled}
            onChange={(e) => setFilterBilled(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="unbilled">Unbilled</option>
            <option value="billed">Billed</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
              />
            </div>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={markAllBilled}
            disabled={readings.filter(r => !r.billed).length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Mark All Billed
          </button>
          <button
            onClick={exportReadings}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
          >
            Export Data
          </button>
          <button
            onClick={() => setFilterBilled('unbilled')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 cursor-pointer"
          >
            Show Unbilled Only
          </button>
          <button
            onClick={fetchData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 flex items-center cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Readings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#383a3c]">
            {filteredReadings.length} Readings
            {(filterType !== 'all' || filterBilled !== 'all' || filterProperty !== 'all') && ' (Filtered)'}
          </h3>
          <div className="text-sm text-gray-500">
            Showing {filteredReadings.length} of {readings.length} total readings
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredReadings.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property & Meter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utility Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Readings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReadings.map((reading) => {
                  const unit = getUnitForType(reading.type);
                  return (
                    <tr key={reading._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-[#383a3c]">{reading.property.title}</div>
                          <div className="text-gray-500 text-sm">{reading.unit}</div>
                          {reading.meterNumber && (
                            <div className="text-gray-400 text-xs">Meter: {reading.meterNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getUtilityIcon(reading.type)}</span>
                          <span className="text-sm text-gray-900 capitalize">{reading.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{reading.previousReading} → {reading.currentReading}</div>
                        <div className="text-gray-500 text-xs">Difference: {reading.consumption} {unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatNumber(reading.consumption)} {unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">{formatCurrency(reading.cost)}</div>
                        <div className="text-gray-500 text-xs">Rate: {formatCurrency(reading.rate)}/{unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(reading.readingDate).toLocaleDateString()}
                        {reading.estimated && (
                          <div className="text-orange-600 text-xs">Estimated</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reading.billed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reading.billed ? 'Billed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          {!reading.billed && (
                            <button
                              onClick={() => markAsBilled(reading._id)}
                              className="text-green-600 hover:text-green-700 cursor-pointer text-left"
                            >
                              Mark Billed
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedReading(reading);
                              setEditReading({
                                propertyId: reading.property._id,
                                unit: reading.unit,
                                type: reading.type,
                                previousReading: reading.previousReading,
                                currentReading: reading.currentReading,
                                readingDate: reading.readingDate.split('T')[0],
                                meterNumber: reading.meterNumber || '',
                                estimated: reading.estimated || false,
                                notes: reading.notes || '',
                                billed: reading.billed
                              });
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 cursor-pointer text-left"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteReading(reading._id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer text-left"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No utility readings</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' || filterBilled !== 'all' || filterProperty !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by adding your first utility reading.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddReading(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f06123]"
                >
                  + Add Reading
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Reading Modal */}
      {showAddReading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Utility Reading</h3>
              <button
                onClick={() => setShowAddReading(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                <select
                  value={newReading.propertyId}
                  onChange={(e) => setNewReading({...newReading, propertyId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <input
                  type="text"
                  value={newReading.unit}
                  onChange={(e) => setNewReading({...newReading, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="e.g., Unit 101, Room A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utility Type *</label>
                <select
                  value={newReading.type}
                  onChange={(e) => setNewReading({...newReading, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  required
                >
                  <option value="electricity">⚡ Electricity ({UNIT_MAP.electricity})</option>
                  <option value="water">💧 Water ({UNIT_MAP.water})</option>
                  <option value="gas">🔥 Gas ({UNIT_MAP.gas})</option>
                  <option value="internet">🌐 Internet ({UNIT_MAP.internet})</option>
                  <option value="waste">🗑️ Waste ({UNIT_MAP.waste})</option>
                  <option value="sewage">🚽 Sewage ({UNIT_MAP.sewage})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                <input
                  type="text"
                  value={newReading.meterNumber}
                  onChange={(e) => setNewReading({...newReading, meterNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Optional meter number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newReading.previousReading}
                  onChange={(e) => setNewReading({...newReading, previousReading: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newReading.currentReading}
                  onChange={(e) => setNewReading({...newReading, currentReading: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reading Date *</label>
                <input
                  type="date"
                  value={newReading.readingDate}
                  onChange={(e) => setNewReading({...newReading, readingDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newReading.estimated}
                  onChange={(e) => setNewReading({...newReading, estimated: e.target.checked})}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                />
                <label className="ml-2 text-sm text-gray-700">Estimated Reading</label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newReading.notes}
                onChange={(e) => setNewReading({...newReading, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Cost Preview */}
            {newReading.currentReading > newReading.previousReading && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Cost Preview</div>
                <div className="text-blue-600">
                  Consumption: {formatNumber(newReading.currentReading - newReading.previousReading)} {getUnitForType(newReading.type)}
                </div>
                <div className="text-blue-600 font-semibold">
                  Estimated Cost: {formatCurrency(
                    (newReading.currentReading - newReading.previousReading) * 
                    (rates.find(r => r.type === newReading.type)?.rate || 0)
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowAddReading(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addReading}
                disabled={!newReading.propertyId || !newReading.unit || newReading.currentReading <= newReading.previousReading}
                className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reading Modal */}
      {showEditModal && selectedReading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Reading</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <select
                  value={editReading.propertyId}
                  onChange={(e) => setEditReading({...editReading, propertyId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={editReading.unit}
                  onChange={(e) => setEditReading({...editReading, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utility Type</label>
                <select
                  value={editReading.type}
                  onChange={(e) => setEditReading({...editReading, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="electricity">⚡ Electricity</option>
                  <option value="water">💧 Water</option>
                  <option value="gas">🔥 Gas</option>
                  <option value="internet">🌐 Internet</option>
                  <option value="waste">🗑️ Waste</option>
                  <option value="sewage">🚽 Sewage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                <input
                  type="text"
                  value={editReading.meterNumber}
                  onChange={(e) => setEditReading({...editReading, meterNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading</label>
                <input
                  type="number"
                  step="0.01"
                  value={editReading.previousReading}
                  onChange={(e) => setEditReading({...editReading, previousReading: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading</label>
                <input
                  type="number"
                  step="0.01"
                  value={editReading.currentReading}
                  onChange={(e) => setEditReading({...editReading, currentReading: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reading Date</label>
                <input
                  type="date"
                  value={editReading.readingDate}
                  onChange={(e) => setEditReading({...editReading, readingDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editReading.estimated}
                  onChange={(e) => setEditReading({...editReading, estimated: e.target.checked})}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                />
                <label className="ml-2 text-sm text-gray-700">Estimated Reading</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editReading.billed}
                  onChange={(e) => setEditReading({...editReading, billed: e.target.checked})}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                />
                <label className="ml-2 text-sm text-gray-700">Billed</label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={editReading.notes}
                onChange={(e) => setEditReading({...editReading, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={updateReading}
                className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
              >
                Update Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rates Modal */}
      {showRatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Utility Rates</h3>
              <button
                onClick={() => setShowRatesModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {rates.map((rate) => (
                <div key={rate._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getUtilityIcon(rate.type)}</span>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{rate.type}</div>
                        <div className="text-sm text-gray-500">Unit: {rate.unit}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(rate.rate)}</div>
                      <div className="text-sm text-gray-500">per {rate.unit}</div>
                    </div>
                  </div>

                  {rate.tier1Limit && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Tiered Pricing</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">Tier 1</div>
                          <div>Up to {rate.tier1Limit} {rate.unit}</div>
                          <div className="text-green-600">{formatCurrency(rate.tier1Rate!)}/{rate.unit}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Tier 2</div>
                          <div>{rate.tier1Limit + 1} - {rate.tier2Limit} {rate.unit}</div>
                          <div className="text-yellow-600">{formatCurrency(rate.tier2Rate!)}/{rate.unit}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Tier 3</div>
                          <div>Over {rate.tier2Limit} {rate.unit}</div>
                          <div className="text-red-600">{formatCurrency(rate.tier3Rate!)}/{rate.unit}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date(rate.lastUpdated).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => {
                        const newRate = prompt(`Enter new rate for ${rate.type} (per ${rate.unit}):`, rate.rate.toString());
                        if (newRate && !isNaN(parseFloat(newRate))) {
                          updateRate(rate.type, parseFloat(newRate));
                        }
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer"
                    >
                      Update Rate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Bulk Upload Utility Readings</h3>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste CSV data (Property Title, Unit, Type, Previous Reading, Current Reading, Date)
                </label>
                <textarea
                  value={bulkReadings}
                  onChange={(e) => setBulkReadings(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] font-mono text-sm"
                  placeholder={`Luxury Apartment,Unit 301,electricity,12450,12895,2024-01-20
Beachfront Villa,Villa 102,water,2450,2495,2024-01-20
City View Apartment,Unit 205,gas,1500,1520,2024-01-20`}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-800">
                  <strong>Format:</strong> Each line should contain: Property Title, Unit, Type, Previous Reading, Current Reading, Date (YYYY-MM-DD)
                </div>
                <div className="text-sm text-yellow-800 mt-2">
                  <strong>Available Properties:</strong> {properties.map(p => p.title).join(', ')}
                </div>
                <div className="text-sm text-yellow-800 mt-2">
                  <strong>Valid Types:</strong> electricity, water, gas, internet, waste, sewage
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={processBulkUpload}
                  disabled={!bulkReadings.trim()}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Process Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}