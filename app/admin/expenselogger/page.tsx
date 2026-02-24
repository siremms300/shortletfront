'use client';

import { useState, useEffect } from 'react';
import { expenseAPI, propertiesAPI } from '@/lib/api';

interface Expense {
  _id: string;
  expenseNumber: string;
  date: string;
  category: 'maintenance' | 'supplies' | 'utilities' | 'staff' | 'marketing' | 'insurance' | 'tax' | 'repairs' | 'cleaning' | 'security' | 'administrative' | 'other';
  description: string;
  amount: number;
  property: {
    _id: string;
    title: string;
    location: string;
  };
  unit?: string;
  paidTo: string;
  paymentMethod: 'cash' | 'bank transfer' | 'card' | 'digital' | 'check';
  receipt?: string;
  receiptFileId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  paidAt?: string;
  recurring: boolean;
  recurrence?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRecurrenceDate?: string;
  tags: string[];
  notes?: string;
  budgetCategory?: string;
  taxDeductible: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Budget {
  _id: string;
  budgetNumber: string;
  category: string;
  allocated: number;
  spent: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  fiscalYear: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Vendor {
  _id: string;
  vendorNumber: string;
  name: string;
  category: string;
  contactPerson?: {
    name: string;
    phone: string;
    email: string;
  };
  phone: string;
  email: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  paymentTerms: 'immediate' | 'net15' | 'net30' | 'net60';
  preferred: boolean;
  rating: number;
  notes?: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
}

interface ExpenseStats {
  monthlyTotal: number;
  monthlyCount: number;
  pendingTotal: number;
  pendingCount: number;
  approvedThisMonth: number;
  approvedCount: number;
  taxDeductibleTotal: number;
}

export default function ExpenseLogger() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showBudgetDetailModal, setShowBudgetDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [view, setView] = useState<'expenses' | 'budgets' | 'reports' | 'vendors'>('expenses');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    propertyId: 'all',
    dateRange: 'month',
    search: ''
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'maintenance' as Expense['category'],
    description: '',
    amount: 0,
    propertyId: '',
    unit: '',
    paidTo: '',
    paymentMethod: 'bank transfer' as Expense['paymentMethod'],
    recurring: false,
    recurrence: 'monthly' as Expense['recurrence'],
    tags: [] as string[],
    notes: '',
    budgetCategory: '',
    taxDeductible: true
  });

  const [newBudget, setNewBudget] = useState({
    category: '',
    allocated: 0,
    period: 'monthly' as Budget['period'],
    fiscalYear: new Date().getFullYear(),
    notes: ''
  });

  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'maintenance' as Vendor['category'],
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nigeria'
    },
    taxId: '',
    paymentTerms: 'net30' as Vendor['paymentTerms'],
    preferred: false,
    rating: 3,
    notes: ''
  });

  const [editVendor, setEditVendor] = useState({
    name: '',
    category: 'maintenance' as Vendor['category'],
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nigeria'
    },
    taxId: '',
    paymentTerms: 'net30' as Vendor['paymentTerms'],
    preferred: false,
    rating: 3,
    notes: ''
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [filters, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching expense data...');

      // Fetch properties - ensure we're getting them correctly
      const propertiesResponse = await propertiesAPI.getProperties({ limit: 100 });
      console.log('Properties response:', propertiesResponse);
      
      // Handle different response formats
      if (propertiesResponse && propertiesResponse.properties) {
        setProperties(propertiesResponse.properties);
        console.log(`Loaded ${propertiesResponse.properties.length} properties`);
      } else if (Array.isArray(propertiesResponse)) {
        setProperties(propertiesResponse);
        console.log(`Loaded ${propertiesResponse.length} properties (array format)`);
      } else {
        console.warn('Unexpected properties format:', propertiesResponse);
        setProperties([]);
      }

      // Build query params for expenses
      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.propertyId !== 'all' && filters.propertyId !== 'general') params.propertyId = filters.propertyId;
      if (filters.search) params.search = filters.search;

      // Fetch all data in parallel
      const [expensesResponse, budgetsResponse, vendorsResponse] = await Promise.all([
        expenseAPI.getExpenses(params).catch(err => {
          console.log('Expenses endpoint not available yet:', err.message);
          return { expenses: [], stats: null };
        }),
        expenseAPI.getBudgets().catch(err => {
          console.log('Budgets endpoint not available yet:', err.message);
          return { budgets: [] };
        }),
        expenseAPI.getVendors().catch(err => {
          console.log('Vendors endpoint not available yet:', err.message);
          return { vendors: [] };
        })
      ]);

      setExpenses(expensesResponse.expenses || []);
      setStats(expensesResponse.stats || null);
      setBudgets(budgetsResponse.budgets || []);
      setVendors(vendorsResponse.vendors || []);

    } catch (error: any) {
      console.error('Failed to fetch expense data:', error);
      setError(error.response?.data?.message || 'Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      maintenance: '🔧',
      supplies: '📦',
      utilities: '💡',
      staff: '👥',
      marketing: '📢',
      insurance: '🛡️',
      tax: '💰',
      repairs: '🛠️',
      cleaning: '🧹',
      security: '🔒',
      administrative: '📋',
      other: '📁'
    };
    return icons[category] || '📁';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.allocated) * 100;
    if (percentage >= 90) return 'over-budget';
    if (percentage >= 75) return 'near-limit';
    return 'within-budget';
  };

  const getBudgetColor = (status: string) => {
    switch (status) {
      case 'over-budget': return 'bg-red-100 text-red-800';
      case 'near-limit': return 'bg-yellow-100 text-yellow-800';
      case 'within-budget': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add expense function
  const addExpense = async () => {
    try {
      // Validate required fields
      if (!newExpense.propertyId || !newExpense.category || !newExpense.description || !newExpense.amount || !newExpense.paidTo || !newExpense.paymentMethod) {
        alert('Please fill in all required fields');
        return;
      }

      const formData = new FormData();
      
      // Append all fields to FormData
      formData.append('propertyId', newExpense.propertyId === 'general' ? '' : newExpense.propertyId);
      formData.append('category', newExpense.category);
      formData.append('description', newExpense.description);
      formData.append('amount', newExpense.amount.toString());
      formData.append('paidTo', newExpense.paidTo);
      formData.append('paymentMethod', newExpense.paymentMethod);
      formData.append('date', newExpense.date);
      
      // Add a flag for general expenses if needed
      if (newExpense.propertyId === 'general') {
        formData.append('isGeneralExpense', 'true');
      }
      
      if (newExpense.unit) formData.append('unit', newExpense.unit);
      if (newExpense.notes) formData.append('notes', newExpense.notes);
      if (newExpense.budgetCategory) formData.append('budgetCategory', newExpense.budgetCategory);
      
      formData.append('recurring', newExpense.recurring.toString());
      if (newExpense.recurring && newExpense.recurrence) {
        formData.append('recurrence', newExpense.recurrence);
      }
      
      formData.append('taxDeductible', newExpense.taxDeductible.toString());
      
      // Append tags
      newExpense.tags.forEach(tag => {
        formData.append('tags[]', tag);
      });

      // Append receipt if exists
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const response = await expenseAPI.createExpense(formData);
      
      if (response && response.expense) {
        setExpenses([response.expense, ...expenses]);
        setShowAddExpense(false);
        resetNewExpense();
        await fetchData(); // Refresh data
        alert('Expense logged successfully!');
      }

    } catch (error: any) {
      console.error('Add expense error:', error);
      alert(error.response?.data?.message || 'Failed to log expense');
    }
  };

  // Update expense status
  const updateExpenseStatus = async (id: string, status: Expense['status']) => {
    try {
      const response = await expenseAPI.updateExpenseStatus(id, { status });
      
      if (response && response.expense) {
        setExpenses(expenses.map(e => e._id === id ? response.expense : e));
        await fetchData(); // Refresh data to update stats
        alert(`Expense ${status} successfully!`);
      }

    } catch (error: any) {
      console.error('Update expense status error:', error);
      alert(error.response?.data?.message || 'Failed to update expense status');
    }
  };

  // Delete expense
  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await expenseAPI.deleteExpense(id);
      setExpenses(expenses.filter(e => e._id !== id));
      await fetchData(); // Refresh data to update stats
      alert('Expense deleted successfully!');
    } catch (error: any) {
      console.error('Delete expense error:', error);
      alert(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  // Add budget function
  // const addBudget = async () => {
  //   try {
  //     if (!newBudget.category || !newBudget.allocated || !newBudget.period || !newBudget.fiscalYear) {
  //       alert('Please fill in all required fields');
  //       return;
  //     }

  //     const budgetData = {
  //       category: newBudget.category,
  //       allocated: newBudget.allocated,
  //       period: newBudget.period,
  //       fiscalYear: newBudget.fiscalYear,
  //       notes: newBudget.notes || undefined
  //     };

  //     const response = await expenseAPI.createBudget(budgetData);
      
  //     if (response && response.budget) {
  //       setBudgets([...budgets, response.budget]);
  //       setShowBudgetModal(false);
  //       setNewBudget({
  //         category: '',
  //         allocated: 0,
  //         period: 'monthly',
  //         fiscalYear: new Date().getFullYear(),
  //         notes: ''
  //       });
  //       alert('Budget created successfully!');
  //     }

  //   } catch (error: any) {
  //     console.error('Add budget error:', error);
  //     alert(error.response?.data?.message || 'Failed to create budget');
  //   }
  // };


// Add budget function
const addBudget = async () => {
  try {
    if (!newBudget.category || !newBudget.allocated || !newBudget.period || !newBudget.fiscalYear) {
      alert('Please fill in all required fields');
      return;
    }

    const budgetData = {
      category: newBudget.category.trim(),
      allocated: Number(newBudget.allocated),
      period: newBudget.period,
      fiscalYear: Number(newBudget.fiscalYear),
      notes: newBudget.notes?.trim() || undefined
    };

    console.log('Sending budget data:', budgetData);

    const response = await expenseAPI.createBudget(budgetData);
    
    if (response && response.budget) {
      setBudgets([...budgets, response.budget]);
      setShowBudgetModal(false);
      setNewBudget({
        category: '',
        allocated: 0,
        period: 'monthly',
        fiscalYear: new Date().getFullYear(),
        notes: ''
      });
      alert('Budget created successfully!');
    }

  } catch (error: any) {
    console.error('Add budget error:', error);
    
    // Show more detailed error message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to create budget';
    
    // Show validation errors if any
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors.map((e: any) => 
        `${e.field}: ${e.message}`
      ).join('\n');
      alert(`Validation failed:\n${validationErrors}`);
    } else {
      alert(errorMessage);
    }
  }
};





  // Add vendor function
  const addVendor = async () => {
    try {
      if (!newVendor.name || !newVendor.category || !newVendor.phone || !newVendor.email) {
        alert('Please fill in all required fields');
        return;
      }

      const vendorData = {
        ...newVendor,
        email: newVendor.email.toLowerCase()
      };

      const response = await expenseAPI.createVendor(vendorData);
      
      if (response && response.vendor) {
        setVendors([...vendors, response.vendor]);
        setShowAddVendorModal(false);
        setNewVendor({
          name: '',
          category: 'maintenance',
          contactPerson: { name: '', phone: '', email: '' },
          phone: '',
          email: '',
          address: { street: '', city: '', state: '', zipCode: '', country: 'Nigeria' },
          taxId: '',
          paymentTerms: 'net30',
          preferred: false,
          rating: 3,
          notes: ''
        });
        alert('Vendor added successfully!');
      }

    } catch (error: any) {
      console.error('Add vendor error:', error);
      alert(error.response?.data?.message || 'Failed to add vendor');
    }
  };

  // Update vendor function
  const updateVendor = async () => {
    if (!selectedVendor) return;

    try {
      const response = await expenseAPI.updateVendor(selectedVendor._id, editVendor);
      
      if (response && response.vendor) {
        setVendors(vendors.map(v => v._id === selectedVendor._id ? response.vendor : v));
        setShowEditVendorModal(false);
        setSelectedVendor(null);
        alert('Vendor updated successfully!');
      }

    } catch (error: any) {
      console.error('Update vendor error:', error);
      alert(error.response?.data?.message || 'Failed to update vendor');
    }
  };

  // Delete vendor function
  const deleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await expenseAPI.deleteVendor(id);
      setVendors(vendors.filter(v => v._id !== id));
      alert('Vendor deleted successfully!');
    } catch (error: any) {
      console.error('Delete vendor error:', error);
      alert(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  // Export expenses function
  const exportExpenses = async () => {
    try {
      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.propertyId !== 'all' && filters.propertyId !== 'general') params.propertyId = filters.propertyId;

      const blob = await expenseAPI.exportExpenses(params);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Export error:', error);
      alert(error.response?.data?.message || 'Failed to export expenses');
    }
  };

  // Reset new expense form
  const resetNewExpense = () => {
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: 'maintenance',
      description: '',
      amount: 0,
      propertyId: '',
      unit: '',
      paidTo: '',
      paymentMethod: 'bank transfer',
      recurring: false,
      recurrence: 'monthly',
      tags: [],
      notes: '',
      budgetCategory: '',
      taxDeductible: true
    });
    setReceiptFile(null);
  };

  // Handle receipt upload
  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  // Toggle tag function
  const toggleTag = (tag: string) => {
    setNewExpense(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Available tags
  const availableTags = ['urgent', 'monthly', 'quarterly', 'annual', 'tax-deductible', 'repair', 'maintenance', 'supplies', 'utilities', 'cleaning', 'security'];

  // Filter expenses
  const filteredExpenses = expenses;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#383a3c]">Expense Management</h2>
            <p className="text-gray-600">Loading expense data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading expense data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#383a3c]">Expense Management</h2>
          <p className="text-gray-600">Track, approve, and analyze operational expenses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowVendorsModal(true)}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer"
          >
            🏢 Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 cursor-pointer"
          >
            💰 Budgets
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
          >
            + Log Expense
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

      {/* View Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          {(['expenses', 'budgets', 'vendors', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition duration-200 cursor-pointer ${
                view === tab
                  ? 'bg-[#f06123] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#383a3c] hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
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

      {/* Expense Overview */}
      {view === 'expenses' && (
        <>
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyTotal)}</div>
                <div className="text-gray-600">This Month</div>
                <div className="text-sm text-gray-500 mt-1">{stats.monthlyCount} expenses</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingTotal)}</div>
                <div className="text-gray-600">Pending Approval</div>
                <div className="text-sm text-gray-500 mt-1">{stats.pendingCount} items</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.approvedThisMonth)}</div>
                <div className="text-gray-600">Approved This Month</div>
                <div className="text-sm text-gray-500 mt-1">{stats.approvedCount} items</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.taxDeductibleTotal)}</div>
                <div className="text-gray-600">Tax Deductible</div>
                <div className="text-sm text-gray-500 mt-1">{expenses.filter(e => e.taxDeductible).length} expenses</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search expenses by description, vendor, or ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="maintenance">Maintenance</option>
                <option value="supplies">Supplies</option>
                <option value="utilities">Utilities</option>
                <option value="staff">Staff</option>
                <option value="marketing">Marketing</option>
                <option value="insurance">Insurance</option>
                <option value="tax">Tax</option>
                <option value="repairs">Repairs</option>
                <option value="cleaning">Cleaning</option>
                <option value="security">Security</option>
                <option value="administrative">Administrative</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123} cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
              <select
                value={filters.propertyId}
                onChange={(e) => setFilters({...filters, propertyId: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
              >
                <option value="all">🏢 All Properties</option>
                <option value="general">📋 General Expenses</option>
                {properties && properties.length > 0 ? (
                  properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No properties found</option>
                )}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={exportExpenses}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Export to CSV
              </button>
              <button
                onClick={() => setFilters({category: 'all', status: 'pending', propertyId: 'all', dateRange: 'month', search: ''})}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 cursor-pointer"
              >
                Show Pending Only
              </button>
              <button
                onClick={() => setFilters({category: 'all', status: 'all', propertyId: 'all', dateRange: 'month', search: ''})}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#383a3c]">
                {expenses.length} Expenses
                {(filters.category !== 'all' || filters.status !== 'all' || filters.propertyId !== 'all') && ' (Filtered)'}
              </h3>
              <div className="text-sm text-gray-500">
                Showing {expenses.length} expenses
              </div>
            </div>

            <div className="overflow-x-auto">
              {expenses.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-[#383a3c]">{expense.expenseNumber}</div>
                            <div className="text-gray-900">{expense.description}</div>
                            <div className="text-gray-500 text-sm">Paid to: {expense.paidTo}</div>
                            <div className="text-gray-400 text-xs">{formatDate(expense.date)}</div>
                            {expense.tags && expense.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {expense.tags.map(tag => (
                                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                            <span className="text-sm text-gray-900 capitalize">{expense.category}</span>
                          </div>
                          {expense.recurring && (
                            <div className="text-xs text-blue-600 mt-1">Recurring ({expense.recurrence})</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-semibold text-red-600">{formatCurrency(expense.amount)}</div>
                          {expense.taxDeductible && (
                            <div className="text-xs text-green-600">Tax deductible</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{expense.property?.title || 'General'}</div>
                          {expense.unit && (
                            <div className="text-xs text-gray-500">{expense.unit}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="capitalize">{expense.paymentMethod}</div>
                          <div className="text-gray-500 text-xs">To: {expense.paidTo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)} capitalize`}>
                            {expense.status}
                          </span>
                          {expense.approvedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Approved: {formatDate(expense.approvedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            {expense.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateExpenseStatus(expense._id, 'approved')}
                                  className="text-green-600 hover:text-green-700 cursor-pointer text-left"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateExpenseStatus(expense._id, 'rejected')}
                                  className="text-red-600 hover:text-red-700 cursor-pointer text-left"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {expense.status === 'approved' && (
                              <button
                                onClick={() => updateExpenseStatus(expense._id, 'paid')}
                                className="text-blue-600 hover:text-blue-700 cursor-pointer text-left"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button 
                              onClick={() => deleteExpense(expense._id)}
                              className="text-red-600 hover:text-red-700 cursor-pointer text-left"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by logging your first expense.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600"
                    >
                      + Log Expense
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Budgets View */}
      {view === 'budgets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#383a3c]">Budget Overview</h3>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
              >
                + Add Budget
              </button>
            </div>

            {budgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map((budget) => {
                  const status = getBudgetStatus(budget);
                  const percentage = (budget.spent / budget.allocated) * 100;
                  
                  return (
                    <div 
                      key={budget._id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => {
                        setSelectedBudget(budget);
                        setShowBudgetDetailModal(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">{budget.category.replace('_', ' ')}</div>
                          <div className="text-sm text-gray-500">{budget.period} • FY{budget.fiscalYear}</div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBudgetColor(status)}`}>
                          {status.replace('-', ' ')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Allocated:</span>
                          <span className="font-semibold">{formatCurrency(budget.allocated)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Spent:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(budget.spent)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(budget.allocated - budget.spent)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              percentage >= 90 ? 'bg-red-500' :
                              percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {percentage.toFixed(1)}% used
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first budget.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600"
                  >
                    + Add Budget
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendors View */}
      {view === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#383a3c]">Vendor Management</h3>
              <button
                onClick={() => setShowAddVendorModal(true)}
                className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
              >
                + Add Vendor
              </button>
            </div>

            {vendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                  <div key={vendor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{vendor.category}</div>
                      </div>
                      {vendor.preferred && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Preferred
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20">Contact:</span>
                        <span className="text-gray-900">{vendor.contactPerson?.name || vendor.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20">Phone:</span>
                        <span className="text-gray-900">{vendor.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20">Email:</span>
                        <span className="text-gray-900 truncate">{vendor.email}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20">Rating:</span>
                        <span className="text-yellow-500">{'⭐'.repeat(Math.floor(vendor.rating))}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-20">Terms:</span>
                        <span className="text-gray-900 uppercase">{vendor.paymentTerms}</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setEditVendor({
                            name: vendor.name,
                            category: vendor.category,
                            contactPerson: vendor.contactPerson || { name: '', phone: '', email: '' },
                            phone: vendor.phone,
                            email: vendor.email,
                            address: vendor.address || { street: '', city: '', state: '', zipCode: '', country: 'Nigeria' },
                            taxId: vendor.taxId || '',
                            paymentTerms: vendor.paymentTerms,
                            preferred: vendor.preferred,
                            rating: vendor.rating,
                            notes: vendor.notes || ''
                          });
                          setShowEditVendorModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVendor(vendor._id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first vendor.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddVendorModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600"
                  >
                    + Add Vendor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports View */}
      {view === 'reports' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#383a3c] mb-6">Expense Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="font-semibold text-gray-900 mb-2">Monthly Expense Report</h4>
              <p className="text-gray-600 mb-4">Generate detailed monthly expense breakdown</p>
              <button 
                onClick={exportExpenses}
                className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
              >
                Generate Report
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🧾</div>
              <h4 className="font-semibold text-gray-900 mb-2">Tax Deduction Report</h4>
              <p className="text-gray-600 mb-4">Export tax-deductible expenses for accounting</p>
              <button 
                onClick={exportExpenses}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 cursor-pointer"
              >
                Export for Taxes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Log New Expense</h3>
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  resetNewExpense();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date *</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  required
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="supplies">Supplies</option>
                  <option value="utilities">Utilities</option>
                  <option value="staff">Staff</option>
                  <option value="marketing">Marketing</option>
                  <option value="insurance">Insurance</option>
                  <option value="tax">Tax</option>
                  <option value="repairs">Repairs</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="security">Security</option>
                  <option value="administrative">Administrative</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                <select
                  value={newExpense.propertyId}
                  onChange={(e) => setNewExpense({...newExpense, propertyId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  required
                >
                  <option value="">Select Property</option>
                  <option value="general">🏢 General Expense (All Properties)</option>
                  {properties && properties.length > 0 ? (
                    properties.map(property => (
                      <option key={property._id} value={property._id}>
                        {property.title} {property.location ? `- ${property.location}` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading properties...</option>
                  )}
                </select>
                {properties.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No properties found. Loading or add properties first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional)</label>
                <input
                  type="text"
                  value={newExpense.unit}
                  onChange={(e) => setNewExpense({...newExpense, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Unit number if applicable"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="digital">Digital Payment</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid To *</label>
                <input
                  type="text"
                  value={newExpense.paidTo}
                  onChange={(e) => setNewExpense({...newExpense, paidTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Vendor or recipient name"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Detailed description of the expense..."
                  required
                />
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                      newExpense.tags.includes(tag)
                        ? 'bg-[#f06123] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newExpense.recurring}
                  onChange={(e) => setNewExpense({...newExpense, recurring: e.target.checked})}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                />
                <label className="ml-2 text-sm text-gray-700">Recurring Expense</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newExpense.taxDeductible}
                  onChange={(e) => setNewExpense({...newExpense, taxDeductible: e.target.checked})}
                  className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                />
                <label className="ml-2 text-sm text-gray-700">Tax Deductible</label>
              </div>
            </div>

            {newExpense.recurring && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                <select
                  value={newExpense.recurrence}
                  onChange={(e) => setNewExpense({...newExpense, recurrence: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            {/* Budget Category */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Category (Optional)</label>
              <select
                value={newExpense.budgetCategory}
                onChange={(e) => setNewExpense({...newExpense, budgetCategory: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
              >
                <option value="">Select Budget Category</option>
                {budgets.map(budget => (
                  <option key={budget._id} value={budget.category}>
                    {budget.category.replace('_', ' ')} (FY{budget.fiscalYear})
                  </option>
                ))}
              </select>
            </div>

            {/* Receipt Upload */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (Optional)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
              />
              {receiptFile && (
                <div className="text-sm text-green-600 mt-1">✓ {receiptFile.name} selected</div>
              )}
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newExpense.notes}
                onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                placeholder="Additional notes or comments..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  resetNewExpense();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addExpense}
                disabled={!newExpense.description || !newExpense.amount || !newExpense.propertyId || !newExpense.paidTo}
                className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Log Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Budget</h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Category *</label>
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="e.g., property_maintenance"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount (₦) *</label>
                <input
                  type="number"
                  min="0"
                  value={newBudget.allocated}
                  onChange={(e) => setNewBudget({...newBudget, allocated: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year *</label>
                <input
                  type="number"
                  value={newBudget.fiscalYear}
                  onChange={(e) => setNewBudget({...newBudget, fiscalYear: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newBudget.notes}
                  onChange={(e) => setNewBudget({...newBudget, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={addBudget}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Add Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Detail Modal */}
      {showBudgetDetailModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Budget Details - {selectedBudget.category.replace('_', ' ')}</h3>
              <button
                onClick={() => setShowBudgetDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Allocated</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(selectedBudget.allocated)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Spent</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedBudget.spent)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Remaining</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedBudget.allocated - selectedBudget.spent)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Usage</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {((selectedBudget.spent / selectedBudget.allocated) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold mb-2">Budget Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium capitalize">{selectedBudget.period} • FY{selectedBudget.fiscalYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Range:</span>
                    <span className="font-medium">
                      {formatDate(selectedBudget.startDate)} - {formatDate(selectedBudget.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      selectedBudget.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedBudget.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {selectedBudget.notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <p className="mt-1 text-gray-800">{selectedBudget.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add New Vendor</h3>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Enter business name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({...newVendor, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                    required
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="supplies">Supplies</option>
                    <option value="utilities">Utilities</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="security">Security</option>
                    <option value="marketing">Marketing</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={newVendor.contactPerson.name}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        contactPerson: {...newVendor.contactPerson, name: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="text"
                      value={newVendor.phone}
                      onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newVendor.email}
                      onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Email address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
                    <input
                      type="text"
                      value={newVendor.contactPerson.phone}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        contactPerson: {...newVendor.contactPerson, phone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Contact person phone"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-3">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={newVendor.address.street}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        address: {...newVendor.address, street: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newVendor.address.city}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        address: {...newVendor.address, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newVendor.address.state}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        address: {...newVendor.address, state: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newVendor.address.zipCode}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        address: {...newVendor.address, zipCode: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Zip/Postal code"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newVendor.address.country}
                      onChange={(e) => setNewVendor({
                        ...newVendor, 
                        address: {...newVendor.address, country: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-3">Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      value={newVendor.taxId}
                      onChange={(e) => setNewVendor({...newVendor, taxId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Tax/VAT ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={newVendor.paymentTerms}
                      onChange={(e) => setNewVendor({...newVendor, paymentTerms: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="net15">Net 15</option>
                      <option value="net30">Net 30</option>
                      <option value="net60">Net 60</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <select
                      value={newVendor.rating}
                      onChange={(e) => setNewVendor({...newVendor, rating: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                    >
                      <option value="5">5 ⭐ - Excellent</option>
                      <option value="4">4 ⭐ - Very Good</option>
                      <option value="3">3 ⭐ - Good</option>
                      <option value="2">2 ⭐ - Fair</option>
                      <option value="1">1 ⭐ - Poor</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newVendor.preferred}
                      onChange={(e) => setNewVendor({...newVendor, preferred: e.target.checked})}
                      className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                    />
                    <label className="ml-2 text-sm text-gray-700">Preferred Vendor</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({...newVendor, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Additional notes about this vendor..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddVendorModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={addVendor}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Add Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditVendorModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Vendor - {selectedVendor.name}</h3>
              <button
                onClick={() => {
                  setShowEditVendorModal(false);
                  setSelectedVendor(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editVendor.name}
                    onChange={(e) => setEditVendor({...editVendor, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editVendor.category}
                    onChange={(e) => setEditVendor({...editVendor, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="supplies">Supplies</option>
                    <option value="utilities">Utilities</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="security">Security</option>
                    <option value="marketing">Marketing</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={editVendor.contactPerson.name}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        contactPerson: {...editVendor.contactPerson, name: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editVendor.phone}
                      onChange={(e) => setEditVendor({...editVendor, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editVendor.email}
                      onChange={(e) => setEditVendor({...editVendor, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
                    <input
                      type="text"
                      value={editVendor.contactPerson.phone}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        contactPerson: {...editVendor.contactPerson, phone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-3">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={editVendor.address.street}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        address: {...editVendor.address, street: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editVendor.address.city}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        address: {...editVendor.address, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editVendor.address.state}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        address: {...editVendor.address, state: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editVendor.address.zipCode}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        address: {...editVendor.address, zipCode: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Zip/Postal code"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editVendor.address.country}
                      onChange={(e) => setEditVendor({
                        ...editVendor, 
                        address: {...editVendor.address, country: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-3">Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      value={editVendor.taxId}
                      onChange={(e) => setEditVendor({...editVendor, taxId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={editVendor.paymentTerms}
                      onChange={(e) => setEditVendor({...editVendor, paymentTerms: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="net15">Net 15</option>
                      <option value="net30">Net 30</option>
                      <option value="net60">Net 60</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <select
                      value={editVendor.rating}
                      onChange={(e) => setEditVendor({...editVendor, rating: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                    >
                      <option value="5">5 ⭐ - Excellent</option>
                      <option value="4">4 ⭐ - Very Good</option>
                      <option value="3">3 ⭐ - Good</option>
                      <option value="2">2 ⭐ - Fair</option>
                      <option value="1">1 ⭐ - Poor</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editVendor.preferred}
                      onChange={(e) => setEditVendor({...editVendor, preferred: e.target.checked})}
                      className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
                    />
                    <label className="ml-2 text-sm text-gray-700">Preferred Vendor</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editVendor.notes}
                  onChange={(e) => setEditVendor({...editVendor, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditVendorModal(false);
                    setSelectedVendor(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={updateVendor}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Update Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



































































// 'use client';

// import { useState, useEffect } from 'react';
// import { expenseAPI, propertiesAPI } from '@/lib/api';

// interface Expense {
//   _id: string;
//   expenseNumber: string;
//   date: string;
//   category: 'maintenance' | 'supplies' | 'utilities' | 'staff' | 'marketing' | 'insurance' | 'tax' | 'repairs' | 'cleaning' | 'security' | 'administrative' | 'other';
//   description: string;
//   amount: number;
//   property: {
//     _id: string;
//     title: string;
//     location: string;
//   };
//   unit?: string;
//   paidTo: string;
//   paymentMethod: 'cash' | 'bank transfer' | 'card' | 'digital' | 'check';
//   receipt?: string;
//   receiptFileId?: string;
//   status: 'pending' | 'approved' | 'rejected' | 'paid';
//   approvedBy?: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//   };
//   approvedAt?: string;
//   paidAt?: string;
//   recurring: boolean;
//   recurrence?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
//   nextRecurrenceDate?: string;
//   tags: string[];
//   notes?: string;
//   budgetCategory?: string;
//   taxDeductible: boolean;
//   createdBy: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

// interface Budget {
//   _id: string;
//   budgetNumber: string;
//   category: string;
//   allocated: number;
//   spent: number;
//   period: 'monthly' | 'quarterly' | 'yearly';
//   fiscalYear: number;
//   startDate: string;
//   endDate: string;
//   isActive: boolean;
//   notes?: string;
//   createdBy: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//   };
// }

// interface Vendor {
//   _id: string;
//   vendorNumber: string;
//   name: string;
//   category: string;
//   contactPerson?: {
//     name: string;
//     phone: string;
//     email: string;
//   };
//   phone: string;
//   email: string;
//   address?: {
//     street: string;
//     city: string;
//     state: string;
//     zipCode: string;
//     country: string;
//   };
//   taxId?: string;
//   paymentTerms: 'immediate' | 'net15' | 'net30' | 'net60';
//   preferred: boolean;
//   rating: number;
//   notes?: string;
//   isActive: boolean;
//   createdBy: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

// interface Property {
//   _id: string;
//   title: string;
//   location: string;
// }

// interface ExpenseStats {
//   monthlyTotal: number;
//   monthlyCount: number;
//   pendingTotal: number;
//   pendingCount: number;
//   approvedThisMonth: number;
//   approvedCount: number;
//   taxDeductibleTotal: number;
// }

// export default function ExpenseLogger() {
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [budgets, setBudgets] = useState<Budget[]>([]);
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [stats, setStats] = useState<ExpenseStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const [showAddExpense, setShowAddExpense] = useState(false);
//   const [showBudgetModal, setShowBudgetModal] = useState(false);
//   const [showVendorsModal, setShowVendorsModal] = useState(false);
//   const [showAddVendorModal, setShowAddVendorModal] = useState(false);
//   const [showEditVendorModal, setShowEditVendorModal] = useState(false);
//   const [showBudgetDetailModal, setShowBudgetDetailModal] = useState(false);
//   const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
//   const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
//   const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
//   const [view, setView] = useState<'expenses' | 'budgets' | 'reports' | 'vendors'>('expenses');
//   const [filters, setFilters] = useState({
//     category: 'all',
//     status: 'all',
//     propertyId: 'all',
//     dateRange: 'month',
//     search: ''
//   });
//   const [dateRange, setDateRange] = useState({
//     startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
//     endDate: new Date().toISOString().split('T')[0]
//   });

//   const [newExpense, setNewExpense] = useState({
//     date: new Date().toISOString().split('T')[0],
//     category: 'maintenance' as Expense['category'],
//     description: '',
//     amount: 0,
//     propertyId: '',
//     unit: '',
//     paidTo: '',
//     paymentMethod: 'bank transfer' as Expense['paymentMethod'],
//     recurring: false,
//     recurrence: 'monthly' as Expense['recurrence'],
//     tags: [] as string[],
//     notes: '',
//     budgetCategory: '',
//     taxDeductible: true
//   });

//   const [newBudget, setNewBudget] = useState({
//     category: '',
//     allocated: 0,
//     period: 'monthly' as Budget['period'],
//     fiscalYear: new Date().getFullYear(),
//     notes: ''
//   });

//   const [newVendor, setNewVendor] = useState({
//     name: '',
//     category: 'maintenance' as Vendor['category'],
//     contactPerson: {
//       name: '',
//       phone: '',
//       email: ''
//     },
//     phone: '',
//     email: '',
//     address: {
//       street: '',
//       city: '',
//       state: '',
//       zipCode: '',
//       country: 'Nigeria'
//     },
//     taxId: '',
//     paymentTerms: 'net30' as Vendor['paymentTerms'],
//     preferred: false,
//     rating: 3,
//     notes: ''
//   });

//   const [editVendor, setEditVendor] = useState({
//     name: '',
//     category: 'maintenance' as Vendor['category'],
//     contactPerson: {
//       name: '',
//       phone: '',
//       email: ''
//     },
//     phone: '',
//     email: '',
//     address: {
//       street: '',
//       city: '',
//       state: '',
//       zipCode: '',
//       country: 'Nigeria'
//     },
//     taxId: '',
//     paymentTerms: 'net30' as Vendor['paymentTerms'],
//     preferred: false,
//     rating: 3,
//     notes: ''
//   });

//   const [receiptFile, setReceiptFile] = useState<File | null>(null);

//   // Fetch data on component mount
//   useEffect(() => {
//     fetchData();
//   }, [filters, dateRange]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       console.log('Fetching expense data...');

//       // Fetch properties
//       const propertiesResponse = await propertiesAPI.getProperties({ limit: 100 });
//       setProperties(propertiesResponse.properties || []);

//       // Build query params for expenses
//       const params: any = {
//         startDate: dateRange.startDate,
//         endDate: dateRange.endDate
//       };
      
//       if (filters.category !== 'all') params.category = filters.category;
//       if (filters.status !== 'all') params.status = filters.status;
//       if (filters.propertyId !== 'all') params.propertyId = filters.propertyId;
//       if (filters.search) params.search = filters.search;

//       // Fetch all data in parallel
//       const [expensesResponse, budgetsResponse, vendorsResponse] = await Promise.all([
//         expenseAPI.getExpenses(params).catch(err => {
//           console.log('Expenses endpoint not available yet:', err.message);
//           return { expenses: [], stats: null };
//         }),
//         expenseAPI.getBudgets().catch(err => {
//           console.log('Budgets endpoint not available yet:', err.message);
//           return { budgets: [] };
//         }),
//         expenseAPI.getVendors().catch(err => {
//           console.log('Vendors endpoint not available yet:', err.message);
//           return { vendors: [] };
//         })
//       ]);

//       setExpenses(expensesResponse.expenses || []);
//       setStats(expensesResponse.stats || null);
//       setBudgets(budgetsResponse.budgets || []);
//       setVendors(vendorsResponse.vendors || []);

//     } catch (error: any) {
//       console.error('Failed to fetch expense data:', error);
//       setError(error.response?.data?.message || 'Failed to load expense data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Helper functions
//   const formatCurrency = (amount: number) => {
//     return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getCategoryIcon = (category: string) => {
//     const icons: Record<string, string> = {
//       maintenance: '🔧',
//       supplies: '📦',
//       utilities: '💡',
//       staff: '👥',
//       marketing: '📢',
//       insurance: '🛡️',
//       tax: '💰',
//       repairs: '🛠️',
//       cleaning: '🧹',
//       security: '🔒',
//       administrative: '📋',
//       other: '📁'
//     };
//     return icons[category] || '📁';
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
//       case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
//       case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
//       case 'paid': return 'bg-blue-100 text-blue-800 border border-blue-200';
//       default: return 'bg-gray-100 text-gray-800 border border-gray-200';
//     }
//   };

//   const getBudgetStatus = (budget: Budget) => {
//     const percentage = (budget.spent / budget.allocated) * 100;
//     if (percentage >= 90) return 'over-budget';
//     if (percentage >= 75) return 'near-limit';
//     return 'within-budget';
//   };

//   const getBudgetColor = (status: string) => {
//     switch (status) {
//       case 'over-budget': return 'bg-red-100 text-red-800';
//       case 'near-limit': return 'bg-yellow-100 text-yellow-800';
//       case 'within-budget': return 'bg-green-100 text-green-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   // Add expense function
//   const addExpense = async () => {
//     try {
//       // Validate required fields
//       if (!newExpense.propertyId || !newExpense.category || !newExpense.description || !newExpense.amount || !newExpense.paidTo || !newExpense.paymentMethod) {
//         alert('Please fill in all required fields');
//         return;
//       }

//       const formData = new FormData();
      
//       // Append all fields to FormData
//       formData.append('propertyId', newExpense.propertyId);
//       formData.append('category', newExpense.category);
//       formData.append('description', newExpense.description);
//       formData.append('amount', newExpense.amount.toString());
//       formData.append('paidTo', newExpense.paidTo);
//       formData.append('paymentMethod', newExpense.paymentMethod);
//       formData.append('date', newExpense.date);
      
//       if (newExpense.unit) formData.append('unit', newExpense.unit);
//       if (newExpense.notes) formData.append('notes', newExpense.notes);
//       if (newExpense.budgetCategory) formData.append('budgetCategory', newExpense.budgetCategory);
      
//       formData.append('recurring', newExpense.recurring.toString());
//       if (newExpense.recurring && newExpense.recurrence) {
//         formData.append('recurrence', newExpense.recurrence);
//       }
      
//       formData.append('taxDeductible', newExpense.taxDeductible.toString());
      
//       // Append tags
//       newExpense.tags.forEach(tag => {
//         formData.append('tags[]', tag);
//       });

//       // Append receipt if exists
//       if (receiptFile) {
//         formData.append('receipt', receiptFile);
//       }

//       const response = await expenseAPI.createExpense(formData);
      
//       if (response && response.expense) {
//         setExpenses([response.expense, ...expenses]);
//         setShowAddExpense(false);
//         resetNewExpense();
//         await fetchData(); // Refresh data
//         alert('Expense logged successfully!');
//       }

//     } catch (error: any) {
//       console.error('Add expense error:', error);
//       alert(error.response?.data?.message || 'Failed to log expense');
//     }
//   };

//   // Update expense status
//   const updateExpenseStatus = async (id: string, status: Expense['status']) => {
//     try {
//       const response = await expenseAPI.updateExpenseStatus(id, { status });
      
//       if (response && response.expense) {
//         setExpenses(expenses.map(e => e._id === id ? response.expense : e));
//         await fetchData(); // Refresh data to update stats
//         alert(`Expense ${status} successfully!`);
//       }

//     } catch (error: any) {
//       console.error('Update expense status error:', error);
//       alert(error.response?.data?.message || 'Failed to update expense status');
//     }
//   };

//   // Delete expense
//   const deleteExpense = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
//       return;
//     }

//     try {
//       await expenseAPI.deleteExpense(id);
//       setExpenses(expenses.filter(e => e._id !== id));
//       await fetchData(); // Refresh data to update stats
//       alert('Expense deleted successfully!');
//     } catch (error: any) {
//       console.error('Delete expense error:', error);
//       alert(error.response?.data?.message || 'Failed to delete expense');
//     }
//   };

//   // Add budget function
//   const addBudget = async () => {
//     try {
//       if (!newBudget.category || !newBudget.allocated || !newBudget.period || !newBudget.fiscalYear) {
//         alert('Please fill in all required fields');
//         return;
//       }

//       const budgetData = {
//         category: newBudget.category,
//         allocated: newBudget.allocated,
//         period: newBudget.period,
//         fiscalYear: newBudget.fiscalYear,
//         notes: newBudget.notes || undefined
//       };

//       const response = await expenseAPI.createBudget(budgetData);
      
//       if (response && response.budget) {
//         setBudgets([...budgets, response.budget]);
//         setShowBudgetModal(false);
//         setNewBudget({
//           category: '',
//           allocated: 0,
//           period: 'monthly',
//           fiscalYear: new Date().getFullYear(),
//           notes: ''
//         });
//         alert('Budget created successfully!');
//       }

//     } catch (error: any) {
//       console.error('Add budget error:', error);
//       alert(error.response?.data?.message || 'Failed to create budget');
//     }
//   };

//   // Add vendor function
//   const addVendor = async () => {
//     try {
//       if (!newVendor.name || !newVendor.category || !newVendor.phone || !newVendor.email) {
//         alert('Please fill in all required fields');
//         return;
//       }

//       const vendorData = {
//         ...newVendor,
//         email: newVendor.email.toLowerCase()
//       };

//       const response = await expenseAPI.createVendor(vendorData);
      
//       if (response && response.vendor) {
//         setVendors([...vendors, response.vendor]);
//         setShowAddVendorModal(false);
//         setNewVendor({
//           name: '',
//           category: 'maintenance',
//           contactPerson: { name: '', phone: '', email: '' },
//           phone: '',
//           email: '',
//           address: { street: '', city: '', state: '', zipCode: '', country: 'Nigeria' },
//           taxId: '',
//           paymentTerms: 'net30',
//           preferred: false,
//           rating: 3,
//           notes: ''
//         });
//         alert('Vendor added successfully!');
//       }

//     } catch (error: any) {
//       console.error('Add vendor error:', error);
//       alert(error.response?.data?.message || 'Failed to add vendor');
//     }
//   };

//   // Update vendor function
//   const updateVendor = async () => {
//     if (!selectedVendor) return;

//     try {
//       const response = await expenseAPI.updateVendor(selectedVendor._id, editVendor);
      
//       if (response && response.vendor) {
//         setVendors(vendors.map(v => v._id === selectedVendor._id ? response.vendor : v));
//         setShowEditVendorModal(false);
//         setSelectedVendor(null);
//         alert('Vendor updated successfully!');
//       }

//     } catch (error: any) {
//       console.error('Update vendor error:', error);
//       alert(error.response?.data?.message || 'Failed to update vendor');
//     }
//   };

//   // Delete vendor function
//   const deleteVendor = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this vendor?')) {
//       return;
//     }

//     try {
//       await expenseAPI.deleteVendor(id);
//       setVendors(vendors.filter(v => v._id !== id));
//       alert('Vendor deleted successfully!');
//     } catch (error: any) {
//       console.error('Delete vendor error:', error);
//       alert(error.response?.data?.message || 'Failed to delete vendor');
//     }
//   };

//   // Export expenses function
//   const exportExpenses = async () => {
//     try {
//       const params: any = {
//         startDate: dateRange.startDate,
//         endDate: dateRange.endDate
//       };
      
//       if (filters.category !== 'all') params.category = filters.category;
//       if (filters.status !== 'all') params.status = filters.status;
//       if (filters.propertyId !== 'all') params.propertyId = filters.propertyId;

//       const blob = await expenseAPI.exportExpenses(params);

//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);

//     } catch (error: any) {
//       console.error('Export error:', error);
//       alert(error.response?.data?.message || 'Failed to export expenses');
//     }
//   };

//   // Reset new expense form
//   const resetNewExpense = () => {
//     setNewExpense({
//       date: new Date().toISOString().split('T')[0],
//       category: 'maintenance',
//       description: '',
//       amount: 0,
//       propertyId: '',
//       unit: '',
//       paidTo: '',
//       paymentMethod: 'bank transfer',
//       recurring: false,
//       recurrence: 'monthly',
//       tags: [],
//       notes: '',
//       budgetCategory: '',
//       taxDeductible: true
//     });
//     setReceiptFile(null);
//   };

//   // Handle receipt upload
//   const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setReceiptFile(file);
//     }
//   };

//   // Toggle tag function
//   const toggleTag = (tag: string) => {
//     setNewExpense(prev => ({
//       ...prev,
//       tags: prev.tags.includes(tag)
//         ? prev.tags.filter(t => t !== tag)
//         : [...prev.tags, tag]
//     }));
//   };

//   // Available tags
//   const availableTags = ['urgent', 'monthly', 'quarterly', 'annual', 'tax-deductible', 'repair', 'maintenance', 'supplies', 'utilities', 'cleaning', 'security'];

//   // Filter expenses
//   const filteredExpenses = expenses;

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-2xl font-bold text-[#383a3c]">Expense Management</h2>
//             <p className="text-gray-600">Loading expense data...</p>
//           </div>
//         </div>
//         <div className="flex items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
//           <span className="ml-3 text-gray-600">Loading expense data...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Expense Management</h2>
//           <p className="text-gray-600">Track, approve, and analyze operational expenses</p>
//         </div>
//         <div className="flex space-x-3">
//           <button
//             onClick={() => setShowVendorsModal(true)}
//             className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer"
//           >
//             🏢 Vendors ({vendors.length})
//           </button>
//           <button
//             onClick={() => setShowBudgetModal(true)}
//             className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 cursor-pointer"
//           >
//             💰 Budgets
//           </button>
//           <button
//             onClick={() => setShowAddExpense(true)}
//             className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
//           >
//             + Log Expense
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <span className="text-red-700">{error}</span>
//             </div>
//             <button
//               onClick={() => setError('')}
//               className="text-red-700 hover:text-red-800 font-medium cursor-pointer"
//             >
//               Dismiss
//             </button>
//           </div>
//         </div>
//       )}

//       {/* View Tabs */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
//         <div className="flex space-x-1">
//           {(['expenses', 'budgets', 'vendors', 'reports'] as const).map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setView(tab)}
//               className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition duration-200 cursor-pointer ${
//                 view === tab
//                   ? 'bg-[#f06123] text-white shadow-sm'
//                   : 'text-gray-600 hover:text-[#383a3c] hover:bg-gray-100'
//               }`}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Date Range Filter */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1 grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">Start Date</label>
//               <input
//                 type="date"
//                 value={dateRange.startDate}
//                 onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">End Date</label>
//               <input
//                 type="date"
//                 value={dateRange.endDate}
//                 onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//               />
//             </div>
//           </div>
//           <button
//             onClick={fetchData}
//             className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 flex items-center cursor-pointer"
//           >
//             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Expense Overview */}
//       {view === 'expenses' && (
//         <>
//           {/* Stats Overview */}
//           {stats && (
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//                 <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyTotal)}</div>
//                 <div className="text-gray-600">This Month</div>
//                 <div className="text-sm text-gray-500 mt-1">{stats.monthlyCount} expenses</div>
//               </div>
//               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//                 <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingTotal)}</div>
//                 <div className="text-gray-600">Pending Approval</div>
//                 <div className="text-sm text-gray-500 mt-1">{stats.pendingCount} items</div>
//               </div>
//               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//                 <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.approvedThisMonth)}</div>
//                 <div className="text-gray-600">Approved This Month</div>
//                 <div className="text-sm text-gray-500 mt-1">{stats.approvedCount} items</div>
//               </div>
//               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//                 <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.taxDeductibleTotal)}</div>
//                 <div className="text-gray-600">Tax Deductible</div>
//                 <div className="text-sm text-gray-500 mt-1">{expenses.filter(e => e.taxDeductible).length} expenses</div>
//               </div>
//             </div>
//           )}

//           {/* Filters */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="flex-1">
//                 <input
//                   type="text"
//                   placeholder="Search expenses by description, vendor, or ID..."
//                   value={filters.search}
//                   onChange={(e) => setFilters({...filters, search: e.target.value})}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <select
//                 value={filters.category}
//                 onChange={(e) => setFilters({...filters, category: e.target.value})}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//               >
//                 <option value="all">All Categories</option>
//                 <option value="maintenance">Maintenance</option>
//                 <option value="supplies">Supplies</option>
//                 <option value="utilities">Utilities</option>
//                 <option value="staff">Staff</option>
//                 <option value="marketing">Marketing</option>
//                 <option value="insurance">Insurance</option>
//                 <option value="tax">Tax</option>
//                 <option value="repairs">Repairs</option>
//                 <option value="cleaning">Cleaning</option>
//                 <option value="security">Security</option>
//                 <option value="administrative">Administrative</option>
//                 <option value="other">Other</option>
//               </select>
//               <select
//                 value={filters.status}
//                 onChange={(e) => setFilters({...filters, status: e.target.value})}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//               >
//                 <option value="all">All Status</option>
//                 <option value="pending">Pending</option>
//                 <option value="approved">Approved</option>
//                 <option value="rejected">Rejected</option>
//                 <option value="paid">Paid</option>
//               </select>
//               <select
//                 value={filters.propertyId}
//                 onChange={(e) => setFilters({...filters, propertyId: e.target.value})}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//               >
//                 <option value="all">All Properties</option>
//                 {properties.map(property => (
//                   <option key={property._id} value={property._id}>
//                     {property.title}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex flex-wrap gap-3 mt-4">
//               <button
//                 onClick={exportExpenses}
//                 className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
//               >
//                 Export to CSV
//               </button>
//               <button
//                 onClick={() => setFilters({category: 'all', status: 'pending', propertyId: 'all', dateRange: 'month', search: ''})}
//                 className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 cursor-pointer"
//               >
//                 Show Pending Only
//               </button>
//               <button
//                 onClick={() => setFilters({category: 'all', status: 'all', propertyId: 'all', dateRange: 'month', search: ''})}
//                 className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 cursor-pointer"
//               >
//                 Clear Filters
//               </button>
//             </div>
//           </div>

//           {/* Expenses Table */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//             <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//               <h3 className="text-lg font-semibold text-[#383a3c]">
//                 {expenses.length} Expenses
//                 {(filters.category !== 'all' || filters.status !== 'all' || filters.propertyId !== 'all') && ' (Filtered)'}
//               </h3>
//               <div className="text-sm text-gray-500">
//                 Showing {expenses.length} expenses
//               </div>
//             </div>

//             <div className="overflow-x-auto">
//               {expenses.length > 0 ? (
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Details</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {expenses.map((expense) => (
//                       <tr key={expense._id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4">
//                           <div>
//                             <div className="font-medium text-[#383a3c]">{expense.expenseNumber}</div>
//                             <div className="text-gray-900">{expense.description}</div>
//                             <div className="text-gray-500 text-sm">Paid to: {expense.paidTo}</div>
//                             <div className="text-gray-400 text-xs">{formatDate(expense.date)}</div>
//                             {expense.tags && expense.tags.length > 0 && (
//                               <div className="flex flex-wrap gap-1 mt-1">
//                                 {expense.tags.map(tag => (
//                                   <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
//                                     {tag}
//                                   </span>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center space-x-2">
//                             <span className="text-lg">{getCategoryIcon(expense.category)}</span>
//                             <span className="text-sm text-gray-900 capitalize">{expense.category}</span>
//                           </div>
//                           {expense.recurring && (
//                             <div className="text-xs text-blue-600 mt-1">Recurring ({expense.recurrence})</div>
//                           )}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-lg font-semibold text-red-600">{formatCurrency(expense.amount)}</div>
//                           {expense.taxDeductible && (
//                             <div className="text-xs text-green-600">Tax deductible</div>
//                           )}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm text-gray-900">{expense.property?.title || 'Unknown'}</div>
//                           {expense.unit && (
//                             <div className="text-xs text-gray-500">{expense.unit}</div>
//                           )}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           <div className="capitalize">{expense.paymentMethod}</div>
//                           <div className="text-gray-500 text-xs">To: {expense.paidTo}</div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)} capitalize`}>
//                             {expense.status}
//                           </span>
//                           {expense.approvedAt && (
//                             <div className="text-xs text-gray-500 mt-1">
//                               Approved: {formatDate(expense.approvedAt)}
//                             </div>
//                           )}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                           <div className="flex flex-col space-y-2">
//                             {expense.status === 'pending' && (
//                               <>
//                                 <button
//                                   onClick={() => updateExpenseStatus(expense._id, 'approved')}
//                                   className="text-green-600 hover:text-green-700 cursor-pointer text-left"
//                                 >
//                                   Approve
//                                 </button>
//                                 <button
//                                   onClick={() => updateExpenseStatus(expense._id, 'rejected')}
//                                   className="text-red-600 hover:text-red-700 cursor-pointer text-left"
//                                 >
//                                   Reject
//                                 </button>
//                               </>
//                             )}
//                             {expense.status === 'approved' && (
//                               <button
//                                 onClick={() => updateExpenseStatus(expense._id, 'paid')}
//                                 className="text-blue-600 hover:text-blue-700 cursor-pointer text-left"
//                               >
//                                 Mark Paid
//                               </button>
//                             )}
//                             <button 
//                               onClick={() => deleteExpense(expense._id)}
//                               className="text-red-600 hover:text-red-700 cursor-pointer text-left"
//                             >
//                               Delete
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <div className="text-center py-12">
//                   <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
//                   <p className="mt-1 text-sm text-gray-500">
//                     Get started by logging your first expense.
//                   </p>
//                   <div className="mt-6">
//                     <button
//                       onClick={() => setShowAddExpense(true)}
//                       className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600"
//                     >
//                       + Log Expense
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}

//       {/* Budgets View */}
//       {view === 'budgets' && (
//         <div className="space-y-6">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-lg font-semibold text-[#383a3c]">Budget Overview</h3>
//               <button
//                 onClick={() => setShowBudgetModal(true)}
//                 className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//               >
//                 + Add Budget
//               </button>
//             </div>

//             {budgets.length > 0 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {budgets.map((budget) => {
//                   const status = getBudgetStatus(budget);
//                   const percentage = (budget.spent / budget.allocated) * 100;
                  
//                   return (
//                     <div 
//                       key={budget._id} 
//                       className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
//                       onClick={() => {
//                         setSelectedBudget(budget);
//                         setShowBudgetDetailModal(true);
//                       }}
//                     >
//                       <div className="flex justify-between items-start mb-3">
//                         <div>
//                           <div className="font-semibold text-gray-900 capitalize">{budget.category.replace('_', ' ')}</div>
//                           <div className="text-sm text-gray-500">{budget.period} • FY{budget.fiscalYear}</div>
//                         </div>
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBudgetColor(status)}`}>
//                           {status.replace('-', ' ')}
//                         </span>
//                       </div>

//                       <div className="space-y-2">
//                         <div className="flex justify-between text-sm">
//                           <span className="text-gray-600">Allocated:</span>
//                           <span className="font-semibold">{formatCurrency(budget.allocated)}</span>
//                         </div>
//                         <div className="flex justify-between text-sm">
//                           <span className="text-gray-600">Spent:</span>
//                           <span className="font-semibold text-red-600">{formatCurrency(budget.spent)}</span>
//                         </div>
//                         <div className="flex justify-between text-sm">
//                           <span className="text-gray-600">Remaining:</span>
//                           <span className="font-semibold text-green-600">
//                             {formatCurrency(budget.allocated - budget.spent)}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="mt-3">
//                         <div className="w-full bg-gray-200 rounded-full h-2">
//                           <div 
//                             className={`h-2 rounded-full ${
//                               percentage >= 90 ? 'bg-red-500' :
//                               percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
//                             }`}
//                             style={{ width: `${Math.min(100, percentage)}%` }}
//                           ></div>
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1 text-right">
//                           {percentage.toFixed(1)}% used
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets found</h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Get started by creating your first budget.
//                 </p>
//                 <div className="mt-6">
//                   <button
//                     onClick={() => setShowBudgetModal(true)}
//                     className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600"
//                   >
//                     + Add Budget
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Vendors View */}
//       {view === 'vendors' && (
//         <div className="space-y-6">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-lg font-semibold text-[#383a3c]">Vendor Management</h3>
//               <button
//                 onClick={() => setShowAddVendorModal(true)}
//                 className="bg-[#f06123] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//               >
//                 + Add Vendor
//               </button>
//             </div>

//             {vendors.length > 0 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {vendors.map((vendor) => (
//                   <div key={vendor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <div className="font-semibold text-gray-900">{vendor.name}</div>
//                         <div className="text-sm text-gray-500 capitalize">{vendor.category}</div>
//                       </div>
//                       {vendor.preferred && (
//                         <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
//                           Preferred
//                         </span>
//                       )}
//                     </div>
                    
//                     <div className="space-y-2 text-sm">
//                       <div className="flex items-center">
//                         <span className="text-gray-500 w-20">Contact:</span>
//                         <span className="text-gray-900">{vendor.contactPerson?.name || vendor.name}</span>
//                       </div>
//                       <div className="flex items-center">
//                         <span className="text-gray-500 w-20">Phone:</span>
//                         <span className="text-gray-900">{vendor.phone}</span>
//                       </div>
//                       <div className="flex items-center">
//                         <span className="text-gray-500 w-20">Email:</span>
//                         <span className="text-gray-900 truncate">{vendor.email}</span>
//                       </div>
//                       <div className="flex items-center">
//                         <span className="text-gray-500 w-20">Rating:</span>
//                         <span className="text-yellow-500">{'⭐'.repeat(Math.floor(vendor.rating))}</span>
//                       </div>
//                       <div className="flex items-center">
//                         <span className="text-gray-500 w-20">Terms:</span>
//                         <span className="text-gray-900 uppercase">{vendor.paymentTerms}</span>
//                       </div>
//                     </div>

//                     <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
//                       <button
//                         onClick={() => {
//                           setSelectedVendor(vendor);
//                           setEditVendor({
//                             name: vendor.name,
//                             category: vendor.category,
//                             contactPerson: vendor.contactPerson || { name: '', phone: '', email: '' },
//                             phone: vendor.phone,
//                             email: vendor.email,
//                             address: vendor.address || { street: '', city: '', state: '', zipCode: '', country: 'Nigeria' },
//                             taxId: vendor.taxId || '',
//                             paymentTerms: vendor.paymentTerms,
//                             preferred: vendor.preferred,
//                             rating: vendor.rating,
//                             notes: vendor.notes || ''
//                           });
//                           setShowEditVendorModal(true);
//                         }}
//                         className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => deleteVendor(vendor._id)}
//                         className="text-red-600 hover:text-red-700 text-sm font-medium"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                 </svg>
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Get started by adding your first vendor.
//                 </p>
//                 <div className="mt-6">
//                   <button
//                     onClick={() => setShowAddVendorModal(true)}
//                     className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600"
//                   >
//                     + Add Vendor
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Reports View */}
//       {view === 'reports' && (
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-[#383a3c] mb-6">Expense Reports</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="border border-gray-200 rounded-lg p-6 text-center">
//               <div className="text-4xl mb-4">📊</div>
//               <h4 className="font-semibold text-gray-900 mb-2">Monthly Expense Report</h4>
//               <p className="text-gray-600 mb-4">Generate detailed monthly expense breakdown</p>
//               <button 
//                 onClick={exportExpenses}
//                 className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//               >
//                 Generate Report
//               </button>
//             </div>
//             <div className="border border-gray-200 rounded-lg p-6 text-center">
//               <div className="text-4xl mb-4">🧾</div>
//               <h4 className="font-semibold text-gray-900 mb-2">Tax Deduction Report</h4>
//               <p className="text-gray-600 mb-4">Export tax-deductible expenses for accounting</p>
//               <button 
//                 onClick={exportExpenses}
//                 className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 cursor-pointer"
//               >
//                 Export for Taxes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Expense Modal */}
//       {showAddExpense && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold">Log New Expense</h3>
//               <button
//                 onClick={() => {
//                   setShowAddExpense(false);
//                   resetNewExpense();
//                 }}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date *</label>
//                 <input
//                   type="date"
//                   value={newExpense.date}
//                   onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
//                 <select
//                   value={newExpense.category}
//                   onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                   required
//                 >
//                   <option value="maintenance">Maintenance</option>
//                   <option value="supplies">Supplies</option>
//                   <option value="utilities">Utilities</option>
//                   <option value="staff">Staff</option>
//                   <option value="marketing">Marketing</option>
//                   <option value="insurance">Insurance</option>
//                   <option value="tax">Tax</option>
//                   <option value="repairs">Repairs</option>
//                   <option value="cleaning">Cleaning</option>
//                   <option value="security">Security</option>
//                   <option value="administrative">Administrative</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
//                 <select
//                   value={newExpense.propertyId}
//                   onChange={(e) => setNewExpense({...newExpense, propertyId: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                   required
//                 >
//                   <option value="">Select Property</option>
//                   {properties.map(property => (
//                     <option key={property._id} value={property._id}>
//                       {property.title}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional)</label>
//                 <input
//                   type="text"
//                   value={newExpense.unit}
//                   onChange={(e) => setNewExpense({...newExpense, unit: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Unit number if applicable"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦) *</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   value={newExpense.amount}
//                   onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
//                 <select
//                   value={newExpense.paymentMethod}
//                   onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                   required
//                 >
//                   <option value="cash">Cash</option>
//                   <option value="bank transfer">Bank Transfer</option>
//                   <option value="card">Card</option>
//                   <option value="digital">Digital Payment</option>
//                   <option value="check">Check</option>
//                 </select>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Paid To *</label>
//                 <input
//                   type="text"
//                   value={newExpense.paidTo}
//                   onChange={(e) => setNewExpense({...newExpense, paidTo: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Vendor or recipient name"
//                   required
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
//                 <textarea
//                   value={newExpense.description}
//                   onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Detailed description of the expense..."
//                   required
//                 />
//               </div>
//             </div>

//             {/* Tags */}
//             <div className="mt-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
//               <div className="flex flex-wrap gap-2">
//                 {availableTags.map(tag => (
//                   <button
//                     key={tag}
//                     type="button"
//                     onClick={() => toggleTag(tag)}
//                     className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
//                       newExpense.tags.includes(tag)
//                         ? 'bg-[#f06123] text-white'
//                         : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                     }`}
//                   >
//                     {tag}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Additional Options */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={newExpense.recurring}
//                   onChange={(e) => setNewExpense({...newExpense, recurring: e.target.checked})}
//                   className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
//                 />
//                 <label className="ml-2 text-sm text-gray-700">Recurring Expense</label>
//               </div>
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={newExpense.taxDeductible}
//                   onChange={(e) => setNewExpense({...newExpense, taxDeductible: e.target.checked})}
//                   className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
//                 />
//                 <label className="ml-2 text-sm text-gray-700">Tax Deductible</label>
//               </div>
//             </div>

//             {newExpense.recurring && (
//               <div className="mt-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
//                 <select
//                   value={newExpense.recurrence}
//                   onChange={(e) => setNewExpense({...newExpense, recurrence: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                 >
//                   <option value="weekly">Weekly</option>
//                   <option value="monthly">Monthly</option>
//                   <option value="quarterly">Quarterly</option>
//                   <option value="yearly">Yearly</option>
//                 </select>
//               </div>
//             )}

//             {/* Budget Category */}
//             <div className="mt-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">Budget Category (Optional)</label>
//               <select
//                 value={newExpense.budgetCategory}
//                 onChange={(e) => setNewExpense({...newExpense, budgetCategory: e.target.value})}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//               >
//                 <option value="">Select Budget Category</option>
//                 {budgets.map(budget => (
//                   <option key={budget._id} value={budget.category}>
//                     {budget.category.replace('_', ' ')} (FY{budget.fiscalYear})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Receipt Upload */}
//             <div className="mt-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (Optional)</label>
//               <input
//                 type="file"
//                 accept="image/*,.pdf"
//                 onChange={handleReceiptUpload}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//               />
//               {receiptFile && (
//                 <div className="text-sm text-green-600 mt-1">✓ {receiptFile.name} selected</div>
//               )}
//             </div>

//             {/* Notes */}
//             <div className="mt-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//               <textarea
//                 value={newExpense.notes}
//                 onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 placeholder="Additional notes or comments..."
//               />
//             </div>

//             <div className="flex space-x-3 pt-4">
//               <button
//                 onClick={() => {
//                   setShowAddExpense(false);
//                   resetNewExpense();
//                 }}
//                 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={addExpense}
//                 disabled={!newExpense.description || !newExpense.amount || !newExpense.propertyId || !newExpense.paidTo}
//                 className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
//               >
//                 Log Expense
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Budget Modal */}
//       {showBudgetModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-xl font-bold">Add New Budget</h3>
//               <button
//                 onClick={() => setShowBudgetModal(false)}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Budget Category *</label>
//                 <input
//                   type="text"
//                   value={newBudget.category}
//                   onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="e.g., property_maintenance"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount (₦) *</label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={newBudget.allocated}
//                   onChange={(e) => setNewBudget({...newBudget, allocated: parseFloat(e.target.value) || 0})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
//                 <select
//                   value={newBudget.period}
//                   onChange={(e) => setNewBudget({...newBudget, period: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                   required
//                 >
//                   <option value="monthly">Monthly</option>
//                   <option value="quarterly">Quarterly</option>
//                   <option value="yearly">Yearly</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year *</label>
//                 <input
//                   type="number"
//                   value={newBudget.fiscalYear}
//                   onChange={(e) => setNewBudget({...newBudget, fiscalYear: parseInt(e.target.value) || new Date().getFullYear()})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//                 <textarea
//                   value={newBudget.notes}
//                   onChange={(e) => setNewBudget({...newBudget, notes: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Additional notes..."
//                 />
//               </div>
//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowBudgetModal(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={addBudget}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Add Budget
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Budget Detail Modal */}
//       {showBudgetDetailModal && selectedBudget && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold">Budget Details - {selectedBudget.category.replace('_', ' ')}</h3>
//               <button
//                 onClick={() => setShowBudgetDetailModal(false)}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Allocated</div>
//                   <div className="text-2xl font-bold text-gray-900">{formatCurrency(selectedBudget.allocated)}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Spent</div>
//                   <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedBudget.spent)}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Remaining</div>
//                   <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedBudget.allocated - selectedBudget.spent)}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Usage</div>
//                   <div className="text-2xl font-bold text-blue-600">
//                     {((selectedBudget.spent / selectedBudget.allocated) * 100).toFixed(1)}%
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-semibold mb-2">Budget Information</h4>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Period:</span>
//                     <span className="font-medium capitalize">{selectedBudget.period} • FY{selectedBudget.fiscalYear}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Date Range:</span>
//                     <span className="font-medium">
//                       {formatDate(selectedBudget.startDate)} - {formatDate(selectedBudget.endDate)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Status:</span>
//                     <span className={`font-medium ${
//                       selectedBudget.isActive ? 'text-green-600' : 'text-red-600'
//                     }`}>
//                       {selectedBudget.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>
//                   {selectedBudget.notes && (
//                     <div>
//                       <span className="text-gray-600">Notes:</span>
//                       <p className="mt-1 text-gray-800">{selectedBudget.notes}</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Vendor Modal */}
//       {showAddVendorModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold">Add New Vendor</h3>
//               <button
//                 onClick={() => setShowAddVendorModal(false)}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
//                   <input
//                     type="text"
//                     value={newVendor.name}
//                     onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="Enter business name"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
//                   <select
//                     value={newVendor.category}
//                     onChange={(e) => setNewVendor({...newVendor, category: e.target.value as any})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                     required
//                   >
//                     <option value="maintenance">Maintenance</option>
//                     <option value="supplies">Supplies</option>
//                     <option value="utilities">Utilities</option>
//                     <option value="cleaning">Cleaning</option>
//                     <option value="security">Security</option>
//                     <option value="marketing">Marketing</option>
//                     <option value="insurance">Insurance</option>
//                     <option value="other">Other</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-medium mb-3">Contact Information</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
//                     <input
//                       type="text"
//                       value={newVendor.contactPerson.name}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         contactPerson: {...newVendor.contactPerson, name: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Contact person name"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
//                     <input
//                       type="text"
//                       value={newVendor.phone}
//                       onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Phone number"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
//                     <input
//                       type="email"
//                       value={newVendor.email}
//                       onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Email address"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
//                     <input
//                       type="text"
//                       value={newVendor.contactPerson.phone}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         contactPerson: {...newVendor.contactPerson, phone: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Contact person phone"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-medium mb-3">Address</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="md:col-span-2">
//                     <input
//                       type="text"
//                       value={newVendor.address.street}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         address: {...newVendor.address, street: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Street address"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={newVendor.address.city}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         address: {...newVendor.address, city: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="City"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={newVendor.address.state}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         address: {...newVendor.address, state: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="State"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={newVendor.address.zipCode}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         address: {...newVendor.address, zipCode: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Zip/Postal code"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={newVendor.address.country}
//                       onChange={(e) => setNewVendor({
//                         ...newVendor, 
//                         address: {...newVendor.address, country: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Country"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-medium mb-3">Business Details</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
//                     <input
//                       type="text"
//                       value={newVendor.taxId}
//                       onChange={(e) => setNewVendor({...newVendor, taxId: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Tax/VAT ID"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
//                     <select
//                       value={newVendor.paymentTerms}
//                       onChange={(e) => setNewVendor({...newVendor, paymentTerms: e.target.value as any})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                     >
//                       <option value="immediate">Immediate</option>
//                       <option value="net15">Net 15</option>
//                       <option value="net30">Net 30</option>
//                       <option value="net60">Net 60</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
//                     <select
//                       value={newVendor.rating}
//                       onChange={(e) => setNewVendor({...newVendor, rating: parseInt(e.target.value)})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                     >
//                       <option value="5">5 ⭐ - Excellent</option>
//                       <option value="4">4 ⭐ - Very Good</option>
//                       <option value="3">3 ⭐ - Good</option>
//                       <option value="2">2 ⭐ - Fair</option>
//                       <option value="1">1 ⭐ - Poor</option>
//                     </select>
//                   </div>
//                   <div className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={newVendor.preferred}
//                       onChange={(e) => setNewVendor({...newVendor, preferred: e.target.checked})}
//                       className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
//                     />
//                     <label className="ml-2 text-sm text-gray-700">Preferred Vendor</label>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//                 <textarea
//                   value={newVendor.notes}
//                   onChange={(e) => setNewVendor({...newVendor, notes: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Additional notes about this vendor..."
//                 />
//               </div>

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowAddVendorModal(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={addVendor}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Add Vendor
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Vendor Modal */}
//       {showEditVendorModal && selectedVendor && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold">Edit Vendor - {selectedVendor.name}</h3>
//               <button
//                 onClick={() => {
//                   setShowEditVendorModal(false);
//                   setSelectedVendor(null);
//                 }}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
//                   <input
//                     type="text"
//                     value={editVendor.name}
//                     onChange={(e) => setEditVendor({...editVendor, name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                   <select
//                     value={editVendor.category}
//                     onChange={(e) => setEditVendor({...editVendor, category: e.target.value as any})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                   >
//                     <option value="maintenance">Maintenance</option>
//                     <option value="supplies">Supplies</option>
//                     <option value="utilities">Utilities</option>
//                     <option value="cleaning">Cleaning</option>
//                     <option value="security">Security</option>
//                     <option value="marketing">Marketing</option>
//                     <option value="insurance">Insurance</option>
//                     <option value="other">Other</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-medium mb-3">Contact Information</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
//                     <input
//                       type="text"
//                       value={editVendor.contactPerson.name}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         contactPerson: {...editVendor.contactPerson, name: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                     <input
//                       type="text"
//                       value={editVendor.phone}
//                       onChange={(e) => setEditVendor({...editVendor, phone: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                     <input
//                       type="email"
//                       value={editVendor.email}
//                       onChange={(e) => setEditVendor({...editVendor, email: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
//                     <input
//                       type="text"
//                       value={editVendor.contactPerson.phone}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         contactPerson: {...editVendor.contactPerson, phone: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-medium mb-3">Address</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="md:col-span-2">
//                     <input
//                       type="text"
//                       value={editVendor.address.street}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         address: {...editVendor.address, street: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Street address"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={editVendor.address.city}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         address: {...editVendor.address, city: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="City"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={editVendor.address.state}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         address: {...editVendor.address, state: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="State"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={editVendor.address.zipCode}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         address: {...editVendor.address, zipCode: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Zip/Postal code"
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={editVendor.address.country}
//                       onChange={(e) => setEditVendor({
//                         ...editVendor, 
//                         address: {...editVendor.address, country: e.target.value}
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Country"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-medium mb-3">Business Details</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
//                     <input
//                       type="text"
//                       value={editVendor.taxId}
//                       onChange={(e) => setEditVendor({...editVendor, taxId: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
//                     <select
//                       value={editVendor.paymentTerms}
//                       onChange={(e) => setEditVendor({...editVendor, paymentTerms: e.target.value as any})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                     >
//                       <option value="immediate">Immediate</option>
//                       <option value="net15">Net 15</option>
//                       <option value="net30">Net 30</option>
//                       <option value="net60">Net 60</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
//                     <select
//                       value={editVendor.rating}
//                       onChange={(e) => setEditVendor({...editVendor, rating: parseInt(e.target.value)})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                     >
//                       <option value="5">5 ⭐ - Excellent</option>
//                       <option value="4">4 ⭐ - Very Good</option>
//                       <option value="3">3 ⭐ - Good</option>
//                       <option value="2">2 ⭐ - Fair</option>
//                       <option value="1">1 ⭐ - Poor</option>
//                     </select>
//                   </div>
//                   <div className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={editVendor.preferred}
//                       onChange={(e) => setEditVendor({...editVendor, preferred: e.target.checked})}
//                       className="rounded border-gray-300 text-[#f06123] focus:ring-[#f06123] cursor-pointer"
//                     />
//                     <label className="ml-2 text-sm text-gray-700">Preferred Vendor</label>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//                 <textarea
//                   value={editVendor.notes}
//                   onChange={(e) => setEditVendor({...editVendor, notes: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => {
//                     setShowEditVendorModal(false);
//                     setSelectedVendor(null);
//                   }}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={updateVendor}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Update Vendor
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





