// components/admin/operational/ExpenseLogger.tsx
'use client';

import { useState, useEffect } from 'react';

interface Expense {
  id: string;
  date: Date;
  category: 'maintenance' | 'supplies' | 'utilities' | 'staff' | 'marketing' | 'insurance' | 'tax' | 'repairs' | 'cleaning' | 'security' | 'administrative' | 'other';
  description: string;
  amount: number;
  property: string;
  unit?: string;
  paidTo: string;
  paymentMethod: 'cash' | 'bank transfer' | 'card' | 'digital' | 'check';
  receipt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: Date;
  paidAt?: Date;
  recurring: boolean;
  recurrence?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  tags: string[];
  notes?: string;
  budgetCategory?: string;
  taxDeductible: boolean;
}

interface Budget {
  category: string;
  allocated: number;
  spent: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  fiscalYear: number;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  preferred: boolean;
}

export default function ExpenseLogger() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 'EXP-001',
      date: new Date('2024-01-15'),
      category: 'maintenance',
      description: 'AC unit repair for Luxury Apartment',
      amount: 450.00,
      property: 'Luxury Apartment',
      unit: 'Unit 301',
      paidTo: 'CoolAir HVAC',
      paymentMethod: 'bank transfer',
      status: 'approved',
      approvedBy: 'Admin',
      approvedAt: new Date('2024-01-16'),
      paidAt: new Date('2024-01-17'),
      recurring: false,
      tags: ['urgent', 'hvac'],
      taxDeductible: true,
      budgetCategory: 'property_maintenance'
    },
    {
      id: 'EXP-002',
      date: new Date('2024-01-18'),
      category: 'supplies',
      description: 'Cleaning supplies and toiletries restock',
      amount: 320.50,
      property: 'All Properties',
      paidTo: 'Clean Supplies Co.',
      paymentMethod: 'card',
      status: 'pending',
      recurring: true,
      recurrence: 'monthly',
      tags: ['monthly', 'consumables'],
      taxDeductible: true,
      budgetCategory: 'operating_supplies'
    },
    {
      id: 'EXP-003',
      date: new Date('2024-01-20'),
      category: 'utilities',
      description: 'January electricity bill - Beachfront Villa',
      amount: 280.75,
      property: 'Beachfront Villa',
      unit: 'Villa 102',
      paidTo: 'Power Utility Co.',
      paymentMethod: 'digital',
      status: 'paid',
      approvedBy: 'Admin',
      approvedAt: new Date('2024-01-21'),
      paidAt: new Date('2024-01-22'),
      recurring: true,
      recurrence: 'monthly',
      tags: ['utilities', 'recurring'],
      taxDeductible: true,
      budgetCategory: 'utilities'
    }
  ]);

  const [budgets, setBudgets] = useState<Budget[]>([
    {
      category: 'property_maintenance',
      allocated: 5000,
      spent: 2450,
      period: 'monthly',
      fiscalYear: 2024
    },
    {
      category: 'operating_supplies',
      allocated: 1500,
      spent: 890,
      period: 'monthly',
      fiscalYear: 2024
    },
    {
      category: 'utilities',
      allocated: 3000,
      spent: 2150,
      period: 'monthly',
      fiscalYear: 2024
    },
    {
      category: 'staff',
      allocated: 12000,
      spent: 11500,
      period: 'monthly',
      fiscalYear: 2024
    },
    {
      category: 'marketing',
      allocated: 2000,
      spent: 1250,
      period: 'monthly',
      fiscalYear: 2024
    }
  ]);

  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: 'VEND-001',
      name: 'CoolAir HVAC',
      category: 'maintenance',
      contact: '+1-555-0101',
      email: 'service@coolair.com',
      preferred: true
    },
    {
      id: 'VEND-002',
      name: 'Clean Supplies Co.',
      category: 'supplies',
      contact: '+1-555-0102',
      email: 'orders@cleansupplies.com',
      preferred: true
    },
    {
      id: 'VEND-003',
      name: 'Power Utility Co.',
      category: 'utilities',
      contact: '+1-555-0103',
      email: 'billing@powerutil.com',
      preferred: false
    }
  ]);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [view, setView] = useState<'expenses' | 'budgets' | 'reports'>('expenses');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    property: 'all',
    dateRange: 'month',
    search: ''
  });

  const [newExpense, setNewExpense] = useState({
    date: new Date(),
    category: 'maintenance' as Expense['category'],
    description: '',
    amount: 0,
    property: '',
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
    fiscalYear: new Date().getFullYear()
  });

  const [newVendor, setNewVendor] = useState({
    name: '',
    category: '',
    contact: '',
    email: '',
    preferred: false
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = expenses
    .filter(e => e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const pendingApproval = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const approvedThisMonth = expenses
    .filter(e => e.status === 'approved' && e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const taxDeductibleAmount = expenses
    .filter(e => e.taxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const categoryExpenses = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

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

  const addExpense = () => {
    const expense: Expense = {
      id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
      date: newExpense.date,
      category: newExpense.category,
      description: newExpense.description,
      amount: newExpense.amount,
      property: newExpense.property,
      unit: newExpense.unit || undefined,
      paidTo: newExpense.paidTo,
      paymentMethod: newExpense.paymentMethod,
      status: 'pending',
      recurring: newExpense.recurring,
      recurrence: newExpense.recurring ? newExpense.recurrence : undefined,
      tags: newExpense.tags,
      notes: newExpense.notes || undefined,
      budgetCategory: newExpense.budgetCategory || undefined,
      taxDeductible: newExpense.taxDeductible
    };

    setExpenses([expense, ...expenses]);
    setShowAddExpense(false);
    resetNewExpense();

    // Update budget spent amount
    if (newExpense.budgetCategory) {
      setBudgets(budgets.map(budget => 
        budget.category === newExpense.budgetCategory 
          ? { ...budget, spent: budget.spent + newExpense.amount }
          : budget
      ));
    }
  };

  const resetNewExpense = () => {
    setNewExpense({
      date: new Date(),
      category: 'maintenance',
      description: '',
      amount: 0,
      property: '',
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

  const updateExpenseStatus = (id: string, status: Expense['status']) => {
    setExpenses(expenses.map(expense => 
      expense.id === id 
        ? { 
            ...expense, 
            status,
            ...(status === 'approved' && !expense.approvedAt ? { 
              approvedBy: 'Admin', 
              approvedAt: new Date() 
            } : {}),
            ...(status === 'paid' && !expense.paidAt ? { 
              paidAt: new Date() 
            } : {})
          }
        : expense
    ));
  };

  const deleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense && confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
      
      // Update budget if needed
      if (expense.budgetCategory) {
        setBudgets(budgets.map(budget => 
          budget.category === expense.budgetCategory 
            ? { ...budget, spent: budget.spent - expense.amount }
            : budget
        ));
      }
    }
  };

  const addBudget = () => {
    const budget: Budget = {
      category: newBudget.category,
      allocated: newBudget.allocated,
      spent: 0,
      period: newBudget.period,
      fiscalYear: newBudget.fiscalYear
    };
    
    setBudgets([...budgets, budget]);
    setShowBudgetModal(false);
    setNewBudget({
      category: '',
      allocated: 0,
      period: 'monthly',
      fiscalYear: new Date().getFullYear()
    });
  };

  const addVendor = () => {
    const vendor: Vendor = {
      id: `VEND-${String(vendors.length + 1).padStart(3, '0')}`,
      name: newVendor.name,
      category: newVendor.category,
      contact: newVendor.contact,
      email: newVendor.email,
      preferred: newVendor.preferred
    };
    
    setVendors([...vendors, vendor]);
    setNewVendor({
      name: '',
      category: '',
      contact: '',
      email: '',
      preferred: false
    });
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      // In a real app, you would upload to cloud storage and get URL
      console.log('Receipt uploaded:', file.name);
    }
  };

  const exportExpenses = () => {
    const csv = expenses.map(expense => 
      `${expense.id},${expense.date.toISOString()},${expense.category},${expense.description},${expense.amount},${expense.property},${expense.paidTo},${expense.status}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredExpenses = expenses.filter(expense => {
    return (
      (filters.category === 'all' || expense.category === filters.category) &&
      (filters.status === 'all' || expense.status === filters.status) &&
      (filters.property === 'all' || expense.property === filters.property) &&
      (expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
       expense.paidTo.toLowerCase().includes(filters.search.toLowerCase()) ||
       expense.id.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  const availableTags = ['urgent', 'monthly', 'quarterly', 'annual', 'tax-deductible', 'repair', 'maintenance', 'supplies'];

  const toggleTag = (tag: string) => {
    setNewExpense(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

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
            🏢 Vendors
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

      {/* View Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          {(['expenses', 'budgets', 'reports'] as const).map((tab) => (
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

      {/* Expense Overview */}
      {view === 'expenses' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-red-600">${monthlyExpenses.toFixed(2)}</div>
              <div className="text-gray-600">This Month</div>
              <div className="text-sm text-gray-500 mt-1">{expenses.filter(e => e.date.getMonth() === currentMonth).length} expenses</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">${pendingApproval.toFixed(2)}</div>
              <div className="text-gray-600">Pending Approval</div>
              <div className="text-sm text-gray-500 mt-1">{expenses.filter(e => e.status === 'pending').length} items</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">${approvedThisMonth.toFixed(2)}</div>
              <div className="text-gray-600">Approved This Month</div>
              <div className="text-sm text-gray-500 mt-1">{expenses.filter(e => e.status === 'approved' && e.date.getMonth() === currentMonth).length} items</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">${taxDeductibleAmount.toFixed(2)}</div>
              <div className="text-gray-600">Tax Deductible</div>
              <div className="text-sm text-gray-500 mt-1">{expenses.filter(e => e.taxDeductible).length} expenses</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#383a3c] mb-4">Expenses by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(categoryExpenses).map(([category, amount]) => (
                <div key={category} className="text-center p-3 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                  <div className="font-medium text-gray-900 capitalize text-sm">{category}</div>
                  <div className="text-lg font-bold text-red-600">${amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
              <select
                value={filters.property}
                onChange={(e) => setFilters({...filters, property: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
              >
                <option value="all">All Properties</option>
                <option value="Luxury Apartment">Luxury Apartment</option>
                <option value="Beachfront Villa">Beachfront Villa</option>
                <option value="City View Apartment">City View Apartment</option>
                <option value="All Properties">All Properties</option>
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
                onClick={() => setFilters({category: 'all', status: 'pending', property: 'all', dateRange: 'month', search: ''})}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 cursor-pointer"
              >
                Show Pending Only
              </button>
              <button
                onClick={() => setFilters({category: 'all', status: 'all', property: 'all', dateRange: 'month', search: ''})}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
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
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-[#383a3c]">{expense.id}</div>
                          <div className="text-gray-900">{expense.description}</div>
                          <div className="text-gray-500 text-sm">Paid to: {expense.paidTo}</div>
                          <div className="text-gray-400 text-xs">{expense.date.toLocaleDateString()}</div>
                          {expense.tags.length > 0 && (
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
                        <div className="text-lg font-semibold text-red-600">${expense.amount.toFixed(2)}</div>
                        {expense.taxDeductible && (
                          <div className="text-xs text-green-600">Tax deductible</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{expense.property}</div>
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
                            Approved: {expense.approvedAt.toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          {expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateExpenseStatus(expense.id, 'approved')}
                                className="text-green-600 hover:text-green-700 cursor-pointer text-left"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateExpenseStatus(expense.id, 'rejected')}
                                className="text-red-600 hover:text-red-700 cursor-pointer text-left"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {expense.status === 'approved' && (
                            <button
                              onClick={() => updateExpenseStatus(expense.id, 'paid')}
                              className="text-blue-600 hover:text-blue-700 cursor-pointer text-left"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-700 cursor-pointer text-left">
                            View Details
                          </button>
                          <button 
                            onClick={() => deleteExpense(expense.id)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map((budget) => {
                const status = getBudgetStatus(budget);
                const percentage = (budget.spent / budget.allocated) * 100;
                
                return (
                  <div key={budget.category} className="border border-gray-200 rounded-lg p-4">
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
                        <span className="font-semibold">${budget.allocated.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Spent:</span>
                        <span className="font-semibold text-red-600">${budget.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-semibold text-green-600">
                          ${(budget.allocated - budget.spent).toLocaleString()}
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
              <button className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 cursor-pointer">
                Generate Report
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🧾</div>
              <h4 className="font-semibold text-gray-900 mb-2">Tax Deduction Report</h4>
              <p className="text-gray-600 mb-4">Export tax-deductible expenses for accounting</p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 cursor-pointer">
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
                onClick={() => setShowAddExpense(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={newExpense.date.toISOString().split('T')[0]}
                  onChange={(e) => setNewExpense({...newExpense, date: new Date(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <select
                  value={newExpense.property}
                  onChange={(e) => setNewExpense({...newExpense, property: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="">Select Property</option>
                  <option value="Luxury Apartment">Luxury Apartment</option>
                  <option value="Beachfront Villa">Beachfront Villa</option>
                  <option value="City View Apartment">City View Apartment</option>
                  <option value="All Properties">All Properties</option>
                </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="cash">Cash</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="digital">Digital Payment</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid To</label>
                <input
                  type="text"
                  value={newExpense.paidTo}
                  onChange={(e) => setNewExpense({...newExpense, paidTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Vendor or recipient name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Detailed description of the expense..."
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
                onClick={() => setShowAddExpense(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addExpense}
                disabled={!newExpense.description || !newExpense.amount || !newExpense.property || !newExpense.paidTo}
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
            <h3 className="text-xl font-bold mb-4">Add New Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Category</label>
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="e.g., property_maintenance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount ($)</label>
                <input
                  type="number"
                  value={newBudget.allocated}
                  onChange={(e) => setNewBudget({...newBudget, allocated: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
                <input
                  type="number"
                  value={newBudget.fiscalYear}
                  onChange={(e) => setNewBudget({...newBudget, fiscalYear: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
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

      {/* Vendors Modal */}
      {showVendorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Vendor Management</h3>
              <button
                onClick={() => setShowVendorsModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18-6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
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
                  <div className="mt-2 text-sm">
                    <div className="text-gray-600">Contact: {vendor.contact}</div>
                    <div className="text-gray-600">Email: {vendor.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

































// // components/admin/operational/ExpenseLogger.tsx
// 'use client';

// import { useState } from 'react';

// interface Expense {
//   id: string;
//   date: Date;
//   category: 'maintenance' | 'supplies' | 'utilities' | 'staff' | 'marketing' | 'insurance' | 'other';
//   description: string;
//   amount: number;
//   property: string;
//   paidTo: string;
//   paymentMethod: 'cash' | 'bank transfer' | 'card' | 'digital';
//   receipt?: string;
//   status: 'pending' | 'approved' | 'rejected';
// }

// export default function ExpenseLogger() {
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [filters, setFilters] = useState({
//     category: '',
//     status: '',
//     dateRange: ''
//   });

//   const categories = {
//     maintenance: '🔧 Maintenance',
//     supplies: '📦 Supplies',
//     utilities: '💡 Utilities',
//     staff: '👥 Staff',
//     marketing: '📢 Marketing',
//     insurance: '🛡️ Insurance',
//     other: '📋 Other'
//   };

//   const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

//   // Expense management with receipt upload and approval workflow
//   // Budget vs actual comparison charts

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Expense Logging</h2>
//           <p className="text-gray-600">Track and manage operational expenses</p>
//         </div>
//         <button className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200">
//           + Log Expense
//         </button>
//       </div>

//       {/* Expense overview */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
//           <div className="text-gray-600">Total Expenses</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-orange-600">
//             ${expenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
//           </div>
//           <div className="text-gray-600">Maintenance</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-blue-600">
//             {expenses.filter(e => e.status === 'pending').length}
//           </div>
//           <div className="text-gray-600">Pending Approval</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-green-600">
//             ${expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
//           </div>
//           <div className="text-gray-600">Approved</div>
//         </div>
//       </div>

//       {/* Expense logging form and table */}
//       {/* Implementation for adding expenses with receipt upload and approval workflow */}
//     </div>
//   );
// }


