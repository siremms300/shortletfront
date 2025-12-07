// components/admin/operational/UtilityTracker.tsx
'use client';

import { useState, useEffect } from 'react';

interface UtilityReading {
  id: string;
  apartment: string;
  unit: string;
  type: 'electricity' | 'water' | 'gas' | 'internet' | 'waste' | 'sewage';
  previousReading: number;
  currentReading: number;
  readingDate: Date;
  consumption: number;
  cost: number;
  rate: number;
  billed: boolean;
  notes?: string;
  meterNumber?: string;
  estimated?: boolean;
}

interface UtilityRate {
  type: 'electricity' | 'water' | 'gas' | 'internet' | 'waste' | 'sewage';
  rate: number;
  unit: string;
  tier1Limit?: number;
  tier1Rate?: number;
  tier2Limit?: number;
  tier2Rate?: number;
  tier3Rate?: number;
  lastUpdated: Date;
}

interface UtilityAlert {
  id: string;
  type: 'high_usage' | 'unusual_consumption' | 'meter_issue' | 'billing_due';
  severity: 'low' | 'medium' | 'high';
  message: string;
  property: string;
  unit: string;
  utilityType: string;
  value?: number;
  threshold?: number;
  date: Date;
  resolved: boolean;
}

export default function UtilityTracker() {
  const [readings, setReadings] = useState<UtilityReading[]>([
    {
      id: 'UTL-001',
      apartment: 'Luxury Apartment',
      unit: 'Unit 301',
      type: 'electricity',
      previousReading: 12450,
      currentReading: 12895,
      readingDate: new Date('2024-01-20'),
      consumption: 445,
      cost: 89.00,
      rate: 0.20,
      billed: true,
      meterNumber: 'ELEC-301-A',
      estimated: false
    },
    {
      id: 'UTL-002',
      apartment: 'Luxury Apartment',
      unit: 'Unit 301',
      type: 'water',
      previousReading: 2450,
      currentReading: 2495,
      readingDate: new Date('2024-01-20'),
      consumption: 45,
      cost: 67.50,
      rate: 1.50,
      billed: true,
      meterNumber: 'WTR-301-A'
    },
    {
      id: 'UTL-003',
      apartment: 'Beachfront Villa',
      unit: 'Villa 102',
      type: 'electricity',
      previousReading: 8950,
      currentReading: 9450,
      readingDate: new Date('2024-01-20'),
      consumption: 500,
      cost: 100.00,
      rate: 0.20,
      billed: false,
      meterNumber: 'ELEC-102-B',
      estimated: false
    }
  ]);

  const [rates, setRates] = useState<UtilityRate[]>([
    {
      type: 'electricity',
      rate: 0.20,
      unit: 'kWh',
      tier1Limit: 500,
      tier1Rate: 0.18,
      tier2Limit: 1000,
      tier2Rate: 0.22,
      tier3Rate: 0.25,
      lastUpdated: new Date('2024-01-01')
    },
    {
      type: 'water',
      rate: 1.50,
      unit: 'm³',
      lastUpdated: new Date('2024-01-01')
    },
    {
      type: 'gas',
      rate: 0.85,
      unit: 'm³',
      lastUpdated: new Date('2024-01-01')
    },
    {
      type: 'internet',
      rate: 79.99,
      unit: 'monthly',
      lastUpdated: new Date('2024-01-01')
    },
    {
      type: 'waste',
      rate: 45.00,
      unit: 'monthly',
      lastUpdated: new Date('2024-01-01')
    },
    {
      type: 'sewage',
      rate: 35.00,
      unit: 'monthly',
      lastUpdated: new Date('2024-01-01')
    }
  ]);

  const [alerts, setAlerts] = useState<UtilityAlert[]>([
    {
      id: 'ALT-001',
      type: 'high_usage',
      severity: 'high',
      message: 'Electricity consumption 40% above average for Unit 301',
      property: 'Luxury Apartment',
      unit: 'Unit 301',
      utilityType: 'electricity',
      value: 445,
      threshold: 320,
      date: new Date('2024-01-20'),
      resolved: false
    },
    {
      id: 'ALT-002',
      type: 'billing_due',
      severity: 'medium',
      message: 'Utility bills due for 3 properties',
      property: 'Multiple',
      unit: 'Multiple',
      utilityType: 'all',
      date: new Date('2024-01-20'),
      resolved: false
    }
  ]);

  const [showAddReading, setShowAddReading] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBilled, setFilterBilled] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newReading, setNewReading] = useState({
    apartment: '',
    unit: '',
    type: 'electricity' as UtilityReading['type'],
    previousReading: 0,
    currentReading: 0,
    readingDate: new Date(),
    meterNumber: '',
    estimated: false,
    notes: ''
  });

  const [bulkReadings, setBulkReadings] = useState('');

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyConsumption = readings
    .filter(r => 
      r.readingDate.getMonth() === currentMonth && 
      r.readingDate.getFullYear() === currentYear
    )
    .reduce((acc, reading) => acc + reading.consumption, 0);

  const monthlyCost = readings
    .filter(r => 
      r.readingDate.getMonth() === currentMonth && 
      r.readingDate.getFullYear() === currentYear
    )
    .reduce((acc, reading) => acc + reading.cost, 0);

  const unbilledAmount = readings
    .filter(r => !r.billed)
    .reduce((acc, reading) => acc + reading.cost, 0);

  const averageConsumption = readings.length > 0 ? 
    readings.reduce((acc, reading) => acc + reading.consumption, 0) / readings.length : 0;

  // Utility type statistics
  const utilityStats = {
    electricity: {
      consumption: readings.filter(r => r.type === 'electricity').reduce((acc, r) => acc + r.consumption, 0),
      cost: readings.filter(r => r.type === 'electricity').reduce((acc, r) => acc + r.cost, 0),
      count: readings.filter(r => r.type === 'electricity').length
    },
    water: {
      consumption: readings.filter(r => r.type === 'water').reduce((acc, r) => acc + r.consumption, 0),
      cost: readings.filter(r => r.type === 'water').reduce((acc, r) => acc + r.cost, 0),
      count: readings.filter(r => r.type === 'water').length
    },
    gas: {
      consumption: readings.filter(r => r.type === 'gas').reduce((acc, r) => acc + r.consumption, 0),
      cost: readings.filter(r => r.type === 'gas').reduce((acc, r) => acc + r.cost, 0),
      count: readings.filter(r => r.type === 'gas').length
    },
    internet: {
      consumption: readings.filter(r => r.type === 'internet').reduce((acc, r) => acc + r.consumption, 0),
      cost: readings.filter(r => r.type === 'internet').reduce((acc, r) => acc + r.cost, 0),
      count: readings.filter(r => r.type === 'internet').length
    }
  };

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
      case 'sewage': return 'text-brown-600';
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

  const calculateCost = (type: string, consumption: number) => {
    const rate = rates.find(r => r.type === type);
    if (!rate) return 0;

    // Tiered pricing calculation
    if (rate.tier1Limit && rate.tier1Rate && rate.tier2Limit && rate.tier2Rate && rate.tier3Rate) {
      let cost = 0;
      if (consumption <= rate.tier1Limit) {
        cost = consumption * rate.tier1Rate;
      } else if (consumption <= rate.tier2Limit) {
        cost = (rate.tier1Limit * rate.tier1Rate) + 
               ((consumption - rate.tier1Limit) * rate.tier2Rate);
      } else {
        cost = (rate.tier1Limit * rate.tier1Rate) + 
               ((rate.tier2Limit - rate.tier1Limit) * rate.tier2Rate) + 
               ((consumption - rate.tier2Limit) * rate.tier3Rate);
      }
      return cost;
    }

    return consumption * rate.rate;
  };

  const addReading = () => {
    const consumption = newReading.currentReading - newReading.previousReading;
    const cost = calculateCost(newReading.type, consumption);

    const reading: UtilityReading = {
      id: `UTL-${String(readings.length + 1).padStart(3, '0')}`,
      apartment: newReading.apartment,
      unit: newReading.unit,
      type: newReading.type,
      previousReading: newReading.previousReading,
      currentReading: newReading.currentReading,
      readingDate: newReading.readingDate,
      consumption,
      cost,
      rate: rates.find(r => r.type === newReading.type)?.rate || 0,
      billed: false,
      meterNumber: newReading.meterNumber || undefined,
      estimated: newReading.estimated,
      notes: newReading.notes || undefined
    };

    setReadings([reading, ...readings]);
    setShowAddReading(false);
    setNewReading({
      apartment: '',
      unit: '',
      type: 'electricity',
      previousReading: 0,
      currentReading: 0,
      readingDate: new Date(),
      meterNumber: '',
      estimated: false,
      notes: ''
    });

    // Check for alerts
    checkForAlerts(reading);
  };

  const checkForAlerts = (reading: UtilityReading) => {
    // Check for high usage
    const averageForType = readings
      .filter(r => r.type === reading.type && r.apartment === reading.apartment)
      .reduce((acc, r) => acc + r.consumption, 0) / 
      Math.max(readings.filter(r => r.type === reading.type && r.apartment === reading.apartment).length, 1);

    if (reading.consumption > averageForType * 1.4) {
      const alert: UtilityAlert = {
        id: `ALT-${Date.now()}`,
        type: 'high_usage',
        severity: 'high',
        message: `${reading.type} consumption ${Math.round((reading.consumption / averageForType - 1) * 100)}% above average for ${reading.apartment}`,
        property: reading.apartment,
        unit: reading.unit,
        utilityType: reading.type,
        value: reading.consumption,
        threshold: averageForType,
        date: new Date(),
        resolved: false
      };
      setAlerts([alert, ...alerts]);
    }
  };

  const markAsBilled = (id: string) => {
    setReadings(readings.map(reading => 
      reading.id === id ? { ...reading, billed: true } : reading
    ));
  };

  const markAllBilled = () => {
    setReadings(readings.map(reading => ({ ...reading, billed: true })));
  };

  const resolveAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, resolved: true } : alert
    ));
  };

  const updateRate = (type: string, newRate: number) => {
    setRates(rates.map(rate => 
      rate.type === type ? { ...rate, rate: newRate, lastUpdated: new Date() } : rate
    ));
  };

  const processBulkUpload = () => {
    const lines = bulkReadings.split('\n').filter(line => line.trim());
    const newReadings: UtilityReading[] = [];

    lines.forEach((line, index) => {
      const [apartment, unit, type, previous, current, date] = line.split(',');
      if (apartment && unit && type && previous && current && date) {
        const consumption = parseFloat(current) - parseFloat(previous);
        const cost = calculateCost(type as UtilityReading['type'], consumption);

        const reading: UtilityReading = {
          id: `BULK-${Date.now()}-${index}`,
          apartment: apartment.trim(),
          unit: unit.trim(),
          type: type.trim() as UtilityReading['type'],
          previousReading: parseFloat(previous),
          currentReading: parseFloat(current),
          readingDate: new Date(date.trim()),
          consumption,
          cost,
          rate: rates.find(r => r.type === type.trim())?.rate || 0,
          billed: false,
          estimated: false
        };
        newReadings.push(reading);
      }
    });

    setReadings([...newReadings, ...readings]);
    setShowBulkUpload(false);
    setBulkReadings('');
  };

  const exportReadings = () => {
    const csv = readings.map(reading => 
      `${reading.apartment},${reading.unit},${reading.type},${reading.previousReading},${reading.currentReading},${reading.consumption},${reading.cost},${reading.readingDate.toISOString()}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utility-readings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredReadings = readings
    .filter(reading => 
      (filterType === 'all' || reading.type === filterType) &&
      (filterBilled === 'all' || 
        (filterBilled === 'billed' && reading.billed) ||
        (filterBilled === 'unbilled' && !reading.billed)) &&
      (reading.apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
       reading.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
       reading.meterNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const activeAlerts = alerts.filter(alert => !alert.resolved);

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
            {activeAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`flex items-center justify-between p-4 border rounded-lg ${getAlertColor(alert.severity)}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm opacity-75">
                      {alert.property} • {alert.unit} • {new Date(alert.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{monthlyConsumption.toLocaleString()}</div>
          <div className="text-gray-600">Monthly Consumption</div>
          <div className="text-sm text-gray-500 mt-1">All utilities</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">${monthlyCost.toFixed(2)}</div>
          <div className="text-gray-600">Monthly Cost</div>
          <div className="text-sm text-gray-500 mt-1">Current period</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">${unbilledAmount.toFixed(2)}</div>
          <div className="text-gray-600">Unbilled Amount</div>
          <div className="text-sm text-gray-500 mt-1">{readings.filter(r => !r.billed).length} readings</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{averageConsumption.toFixed(0)}</div>
          <div className="text-gray-600">Avg Consumption</div>
          <div className="text-sm text-gray-500 mt-1">Per reading</div>
        </div>
      </div>

      {/* Utility Type Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Utility Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['electricity', 'water', 'gas', 'internet'] as const).map((type) => (
            <div key={type} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-2">{getUtilityIcon(type)}</div>
              <div className="font-semibold text-gray-900 capitalize">{type}</div>
              <div className={`text-xl font-bold ${getUtilityColor(type)}`}>
                {utilityStats[type].consumption.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                ${utilityStats[type].cost.toFixed(2)} • {utilityStats[type].count} readings
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
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
        </div>
      </div>

      {/* Readings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
              {filteredReadings.map((reading) => (
                <tr key={reading.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-[#383a3c]">{reading.apartment}</div>
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
                    <div className="text-gray-500 text-xs">Difference: {reading.consumption}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {reading.consumption.toLocaleString()} {rates.find(r => r.type === reading.type)?.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">${reading.cost.toFixed(2)}</div>
                    <div className="text-gray-500 text-xs">Rate: ${reading.rate}/{rates.find(r => r.type === reading.type)?.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reading.readingDate.toLocaleDateString()}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!reading.billed && (
                      <button
                        onClick={() => markAsBilled(reading.id)}
                        className="text-green-600 hover:text-green-700 cursor-pointer"
                      >
                        Mark Billed
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700 cursor-pointer">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <input
                  type="text"
                  value={newReading.apartment}
                  onChange={(e) => setNewReading({...newReading, apartment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter property name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={newReading.unit}
                  onChange={(e) => setNewReading({...newReading, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter unit number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utility Type</label>
                <select
                  value={newReading.type}
                  onChange={(e) => setNewReading({...newReading, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="electricity">Electricity</option>
                  <option value="water">Water</option>
                  <option value="gas">Gas</option>
                  <option value="internet">Internet</option>
                  <option value="waste">Waste</option>
                  <option value="sewage">Sewage</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading</label>
                <input
                  type="number"
                  step="0.01"
                  value={newReading.previousReading}
                  onChange={(e) => setNewReading({...newReading, previousReading: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading</label>
                <input
                  type="number"
                  step="0.01"
                  value={newReading.currentReading}
                  onChange={(e) => setNewReading({...newReading, currentReading: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reading Date</label>
                <input
                  type="date"
                  value={newReading.readingDate.toISOString().split('T')[0]}
                  onChange={(e) => setNewReading({...newReading, readingDate: new Date(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
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
                  Consumption: {(newReading.currentReading - newReading.previousReading).toLocaleString()} {rates.find(r => r.type === newReading.type)?.unit}
                </div>
                <div className="text-blue-600 font-semibold">
                  Estimated Cost: ${calculateCost(newReading.type, newReading.currentReading - newReading.previousReading).toFixed(2)}
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
                disabled={!newReading.apartment || !newReading.unit || newReading.currentReading <= newReading.previousReading}
                className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add Reading
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
                <div key={rate.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getUtilityIcon(rate.type)}</span>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{rate.type}</div>
                        <div className="text-sm text-gray-500">Unit: {rate.unit}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${rate.rate}</div>
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
                          <div className="text-green-600">${rate.tier1Rate}/{rate.unit}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Tier 2</div>
                          <div>{rate.tier1Limit + 1} - {rate.tier2Limit} {rate.unit}</div>
                          <div className="text-yellow-600">${rate.tier2Rate}/{rate.unit}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Tier 3</div>
                          <div>Over {rate.tier2Limit} {rate.unit}</div>
                          <div className="text-red-600">${rate.tier3Rate}/{rate.unit}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-500">
                      Last updated: {rate.lastUpdated.toLocaleDateString()}
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
                  Paste CSV data (Property, Unit, Type, Previous Reading, Current Reading, Date)
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
                  <strong>Format:</strong> Each line should contain: Property, Unit, Type, Previous Reading, Current Reading, Date (YYYY-MM-DD)
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

















































// // components/admin/operational/UtilityTracker.tsx
// 'use client';

// import { useState } from 'react';

// interface UtilityReading {
//   id: string;
//   apartment: string;
//   unit: string;
//   type: 'electricity' | 'water' | 'gas' | 'internet';
//   previousReading: number;
//   currentReading: number;
//   readingDate: Date;
//   consumption: number;
//   cost: number;
//   rate: number;
// }

// export default function UtilityTracker() {
//   const [readings, setReadings] = useState<UtilityReading[]>([]);
//   const [billingPeriod, setBillingPeriod] = useState({
//     start: new Date('2024-01-01'),
//     end: new Date('2024-01-31')
//   });

//   // Utility tracking with consumption calculations and cost analysis
//   // Includes charts for utility usage trends

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Utility Tracking</h2>
//           <p className="text-gray-600">Monitor and analyze utility consumption</p>
//         </div>
//         <button className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200">
//           + Add Reading
//         </button>
//       </div>

//       {/* Utility consumption overview */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-blue-600">1,245 kWh</div>
//           <div className="text-gray-600">Electricity</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-cyan-600">45 m³</div>
//           <div className="text-gray-600">Water</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-orange-600">12 m³</div>
//           <div className="text-gray-600">Gas</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-purple-600">$1,234</div>
//           <div className="text-gray-600">Total Cost</div>
//         </div>
//       </div>

//       {/* Utility reading form and table */}
//       {/* Implementation for adding readings and viewing history */}
//     </div>
//   );
// }


