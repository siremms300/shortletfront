// components/admin/operational/InventoryManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { inventoryAPI } from '@/lib/api';

interface StockMovement {
  _id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  performedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface InventoryItem {
  _id: string;
  itemNumber: string;
  name: string;
  category: 'linen' | 'toiletries' | 'kitchen' | 'cleaning' | 'amenities' | 'furniture' | 'electronics';
  description: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  unit: string;
  location: string;
  supplier: string;
  cost: number;
  barcode: string;
  notes: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';
  lastRestocked: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  stockMovements: StockMovement[];
  createdAt: string;
  updatedAt: string;
}

interface InventoryStats {
  totalItems: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  reorderItems: InventoryItem[];
  categoryStats: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
}

export default function InventoryManager() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'linen' as InventoryItem['category'],
    description: '',
    currentStock: 0,
    minStock: 0,
    reorderLevel: 0,
    unit: '',
    location: '',
    supplier: '',
    cost: 0,
    barcode: '',
    notes: ''
  });

  const [stockUpdate, setStockUpdate] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [itemsResponse, statsResponse] = await Promise.all([
        inventoryAPI.getItems(),
        inventoryAPI.getStats()
      ]);
      
      setInventory(itemsResponse.items || []);
      setStats(statsResponse.stats);
    } catch (error: any) {
      console.error('Failed to fetch inventory data:', error);
      setError(error.response?.data?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.unit || !newItem.location) {
        setError('Name, unit, and location are required');
        return;
      }

      const response = await inventoryAPI.createItem(newItem);
      
      setInventory(prev => [response.item, ...prev]);
      setShowAddSidebar(false);
      setNewItem({
        name: '',
        category: 'linen',
        description: '',
        currentStock: 0,
        minStock: 0,
        reorderLevel: 0,
        unit: '',
        location: '',
        supplier: '',
        cost: 0,
        barcode: '',
        notes: ''
      });
      
      await fetchData(); // Refresh stats
      alert('Item added successfully!');
    } catch (error: any) {
      console.error('Failed to add item:', error);
      setError(error.response?.data?.message || 'Failed to add item');
    }
  };

  const updateStock = async (item: InventoryItem, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string) => {
    try {
      if (!quantity || !reason) {
        setError('Quantity and reason are required');
        return;
      }

      if (type === 'out' && quantity > item.currentStock) {
        setError('Insufficient stock for this transaction');
        return;
      }

      await inventoryAPI.updateStock(item._id, { type, quantity, reason });
      await fetchData(); // Refresh data
      setShowStockModal(false);
      setStockUpdate({ type: 'in', quantity: 0, reason: '' });
      alert('Stock updated successfully!');
    } catch (error: any) {
      console.error('Failed to update stock:', error);
      setError(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;

    try {
      await inventoryAPI.deleteItem(id);
      await fetchData(); // Refresh data
      alert('Item deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      alert(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const loadStockMovements = async (item: InventoryItem) => {
    try {
      const response = await inventoryAPI.getStockMovements(item._id);
      setStockMovements(response.movements || []);
      setSelectedItem(item);
      setShowMovements(true);
    } catch (error: any) {
      console.error('Failed to load stock movements:', error);
      setError(error.response?.data?.message || 'Failed to load stock history');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800 border border-green-200';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'out-of-stock': return 'bg-red-100 text-red-800 border border-red-200';
      case 'on-order': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStockValue = (item: InventoryItem) => {
    return item.currentStock * item.cost;
  };

  // Filter inventory
  const filteredInventory = inventory
    .filter(item => 
      (filterCategory === 'all' || item.category === filterCategory) &&
      (filterStatus === 'all' || item.status === filterStatus) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.itemNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#383a3c]">Inventory Management</h2>
            <p className="text-gray-600">Loading inventory data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading inventory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#383a3c]">Inventory Management</h2>
          <p className="text-gray-600">Track and manage property inventory levels</p>
        </div>
        <button
          onClick={() => setShowAddSidebar(true)}
          className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
        >
          + Add Item
        </button>
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
              className="text-red-700 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Inventory Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
              <div className="text-gray-600">Total Items</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.inStockItems}</div>
              <div className="text-gray-600">In Stock</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              <div className="text-gray-600">Low Stock</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">${stats.totalValue.toFixed(2)}</div>
              <div className="text-gray-600">Total Value</div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          {stats.reorderItems.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-orange-600 text-lg">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-orange-800">Reorder Alert</h4>
                    <p className="text-orange-700 text-sm">
                      {stats.reorderItems.length} item{stats.reorderItems.length > 1 ? 's' : ''} need{stats.reorderItems.length === 1 ? 's' : ''} restocking
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setFilterStatus('low-stock')}
                  className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-200 cursor-pointer"
                >
                  View Items
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="linen">Linen</option>
            <option value="toiletries">Toiletries</option>
            <option value="kitchen">Kitchen</option>
            <option value="cleaning">Cleaning</option>
            <option value="amenities">Amenities</option>
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <button
            onClick={fetchData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#383a3c]">
            {filteredInventory.length} Items
            {(filterCategory !== 'all' || filterStatus !== 'all') && ' (Filtered)'}
          </h3>
          <div className="text-sm text-gray-500">
            Showing {filteredInventory.length} of {inventory.length} total items
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredInventory.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-[#383a3c]">{item.name}</div>
                        <div className="text-gray-500 text-sm">ID: {item.itemNumber}</div>
                        <div className="text-gray-600 text-sm capitalize">{item.category}</div>
                        <div className="text-gray-400 text-sm">{item.location}</div>
                        <div className="text-gray-400 text-sm">Supplier: {item.supplier}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                item.status === 'out-of-stock' ? 'bg-red-500' :
                                item.status === 'low-stock' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, (item.currentStock / (item.minStock * 2 || 1)) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {item.minStock} | Reorder: {item.reorderLevel}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost: ${item.cost}/{item.unit}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)} capitalize`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${getStockValue(item).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowStockModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 cursor-pointer text-left text-sm"
                        >
                          Update Stock
                        </button>
                        <button
                          onClick={() => loadStockMovements(item)}
                          className="text-purple-600 hover:text-purple-700 cursor-pointer text-left text-sm"
                        >
                          View History
                        </button>
                        <button 
                          onClick={() => deleteItem(item._id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer text-left text-sm"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new inventory item.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddSidebar(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#f06123] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f06123]"
                >
                  + Add Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Sidebar */}
      {showAddSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Inventory Item</h3>
                <button
                  onClick={() => setShowAddSidebar(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                  >
                    <option value="linen">Linen</option>
                    <option value="toiletries">Toiletries</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="cleaning">Cleaning Supplies</option>
                    <option value="amenities">Amenities</option>
                    <option value="furniture">Furniture</option>
                    <option value="electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Item description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <input
                      type="number"
                      value={newItem.currentStock}
                      onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                    <input
                      type="number"
                      value={newItem.minStock}
                      onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      value={newItem.reorderLevel}
                      onChange={(e) => setNewItem({...newItem, reorderLevel: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="e.g., pieces, rolls, liters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Storage location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({...newItem, cost: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    value={newItem.barcode}
                    onChange={(e) => setNewItem({...newItem, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Scan or enter barcode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddSidebar(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Stock - {selectedItem.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={stockUpdate.type}
                  onChange={(e) => setStockUpdate({...stockUpdate, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity {stockUpdate.type === 'adjustment' ? '(New Total)' : ''}
                </label>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({...stockUpdate, quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Current stock: {selectedItem.currentStock} {selectedItem.unit}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input
                  type="text"
                  value={stockUpdate.reason}
                  onChange={(e) => setStockUpdate({...stockUpdate, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="e.g., Restock, Consumption, Correction"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStock(selectedItem, stockUpdate.type, stockUpdate.quantity, stockUpdate.reason)}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movements Modal */}
      {showMovements && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Stock History - {selectedItem.name}</h3>
              <button
                onClick={() => setShowMovements(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {stockMovements.length > 0 ? (
                <div className="space-y-3">
                  {stockMovements.map((movement) => (
                    <div key={movement._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          movement.type === 'in' ? 'bg-green-100 text-green-600' :
                          movement.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {movement.type === 'in' ? '⬆️' : movement.type === 'out' ? '⬇️' : '🔄'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{movement.reason}</div>
                          <div className="text-sm text-gray-500">
                            {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '='} 
                            {movement.quantity} {selectedItem.unit}
                          </div>
                          <div className="text-xs text-gray-400">
                            Previous: {movement.previousStock} → New: {movement.newStock}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {movement.performedBy?.firstName} {movement.performedBy?.lastName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No stock movements</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No stock transactions recorded for this item yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}















































































// // components/admin/operational/InventoryManager.tsx
// 'use client';

// import { useState } from 'react';

// interface InventoryItem {
//   id: string;
//   name: string;
//   category: 'linen' | 'toiletries' | 'kitchen' | 'cleaning' | 'amenities' | 'furniture' | 'electronics';
//   currentStock: number;
//   minStock: number;
//   unit: string;
//   location: string;
//   lastRestocked: Date;
//   supplier: string;
//   cost: number;
//   status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';
//   reorderLevel: number;
//   barcode?: string;
//   notes?: string;
//   lastUpdated: Date;
// }

// interface StockMovement {
//   id: string;
//   itemId: string;
//   type: 'in' | 'out' | 'adjustment';
//   quantity: number;
//   reason: string;
//   date: Date;
//   performedBy: string;
// }

// export default function InventoryManager() {
//   const [inventory, setInventory] = useState<InventoryItem[]>([
//     {
//       id: 'INV-001',
//       name: 'Bath Towels',
//       category: 'linen',
//       currentStock: 45,
//       minStock: 30,
//       reorderLevel: 35,
//       unit: 'pieces',
//       location: 'Main Storage - Shelf A',
//       lastRestocked: new Date('2024-01-15'),
//       supplier: 'Linen Pro',
//       cost: 12.99,
//       status: 'in-stock',
//       lastUpdated: new Date('2024-01-20')
//     },
//     {
//       id: 'INV-002',
//       name: 'Toilet Paper',
//       category: 'toiletries',
//       currentStock: 8,
//       minStock: 20,
//       reorderLevel: 25,
//       unit: 'rolls',
//       location: 'Utility Room',
//       lastRestocked: new Date('2024-01-18'),
//       supplier: 'Clean Supplies Co.',
//       cost: 0.85,
//       status: 'low-stock',
//       lastUpdated: new Date('2024-01-20')
//     },
//     {
//       id: 'INV-003',
//       name: 'Coffee Pods',
//       category: 'amenities',
//       currentStock: 0,
//       minStock: 50,
//       reorderLevel: 60,
//       unit: 'pods',
//       location: 'Kitchen Supply',
//       lastRestocked: new Date('2024-01-10'),
//       supplier: 'Beverage Supply',
//       cost: 0.45,
//       status: 'out-of-stock',
//       lastUpdated: new Date('2024-01-19')
//     }
//   ]);

//   const [stockMovements, setStockMovements] = useState<StockMovement[]>([
//     {
//       id: 'MOV-001',
//       itemId: 'INV-001',
//       type: 'in',
//       quantity: 20,
//       reason: 'Restock from supplier',
//       date: new Date('2024-01-15'),
//       performedBy: 'Admin'
//     }
//   ]);

//   const [showAddSidebar, setShowAddSidebar] = useState(false);
//   const [showEditSidebar, setShowEditSidebar] = useState(false);
//   const [showStockModal, setShowStockModal] = useState(false);
//   const [showMovements, setShowMovements] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
//   const [filterCategory, setFilterCategory] = useState<string>('all');
//   const [filterStatus, setFilterStatus] = useState<string>('all');
//   const [searchTerm, setSearchTerm] = useState('');

//   const [newItem, setNewItem] = useState({
//     name: '',
//     category: 'linen' as InventoryItem['category'],
//     currentStock: 0,
//     minStock: 0,
//     reorderLevel: 0,
//     unit: '',
//     location: '',
//     supplier: '',
//     cost: 0,
//     barcode: '',
//     notes: ''
//   });

//   const [stockUpdate, setStockUpdate] = useState({
//     type: 'in' as 'in' | 'out' | 'adjustment',
//     quantity: 0,
//     reason: ''
//   });

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'in-stock': return 'bg-green-100 text-green-800 border border-green-200';
//       case 'low-stock': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
//       case 'out-of-stock': return 'bg-red-100 text-red-800 border border-red-200';
//       case 'on-order': return 'bg-blue-100 text-blue-800 border border-blue-200';
//       default: return 'bg-gray-100 text-gray-800 border border-gray-200';
//     }
//   };

//   const getStockStatus = (current: number, min: number): InventoryItem['status'] => {
//     if (current === 0) return 'out-of-stock';
//     if (current <= min) return 'low-stock';
//     return 'in-stock';
//   };

//   const handleAddItem = () => {
//     const item: InventoryItem = {
//       id: `INV-${String(inventory.length + 1).padStart(3, '0')}`,
//       ...newItem,
//       lastRestocked: new Date(),
//       lastUpdated: new Date(),
//       status: getStockStatus(newItem.currentStock, newItem.minStock)
//     };
    
//     setInventory([...inventory, item]);
//     setShowAddSidebar(false);
//     setNewItem({
//       name: '',
//       category: 'linen',
//       currentStock: 0,
//       minStock: 0,
//       reorderLevel: 0,
//       unit: '',
//       location: '',
//       supplier: '',
//       cost: 0,
//       barcode: '',
//       notes: ''
//     });
//   };

//   const updateStock = (item: InventoryItem, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string) => {
//     const newStock = type === 'in' ? item.currentStock + quantity : 
//                    type === 'out' ? item.currentStock - quantity : quantity;

//     setInventory(inventory.map(invItem => {
//       if (invItem.id === item.id) {
//         return {
//           ...invItem,
//           currentStock: newStock,
//           status: getStockStatus(newStock, invItem.minStock),
//           lastUpdated: new Date(),
//           ...(type === 'in' ? { lastRestocked: new Date() } : {})
//         };
//       }
//       return invItem;
//     }));

//     // Record stock movement
//     const movement: StockMovement = {
//       id: `MOV-${String(stockMovements.length + 1).padStart(3, '0')}`,
//       itemId: item.id,
//       type,
//       quantity,
//       reason,
//       date: new Date(),
//       performedBy: 'Admin'
//     };
//     setStockMovements([movement, ...stockMovements]);
//     setShowStockModal(false);
//     setStockUpdate({ type: 'in', quantity: 0, reason: '' });
//   };

//   const deleteItem = (id: string) => {
//     if (confirm('Are you sure you want to delete this inventory item?')) {
//       setInventory(inventory.filter(item => item.id !== id));
//     }
//   };

//   const getStockValue = (item: InventoryItem) => {
//     return item.currentStock * item.cost;
//   };

//   const getTotalInventoryValue = () => {
//     return inventory.reduce((total, item) => total + getStockValue(item), 0);
//   };

//   const getItemsNeedingReorder = () => {
//     return inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');
//   };

//   // Filter inventory
//   const filteredInventory = inventory
//     .filter(item => 
//       (filterCategory === 'all' || item.category === filterCategory) &&
//       (filterStatus === 'all' || item.status === filterStatus) &&
//       (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//        item.id.toLowerCase().includes(searchTerm.toLowerCase()))
//     );

//   const lowStockItems = inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');
//   const totalValue = getTotalInventoryValue();

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Inventory Management</h2>
//           <p className="text-gray-600">Track and manage property inventory levels</p>
//         </div>
//         <button
//           onClick={() => setShowAddSidebar(true)}
//           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
//         >
//           + Add Item
//         </button>
//       </div>

//       {/* Enhanced Inventory Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
//           <div className="text-gray-600">Total Items</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-green-600">
//             {inventory.filter(item => item.status === 'in-stock').length}
//           </div>
//           <div className="text-gray-600">In Stock</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-yellow-600">
//             {inventory.filter(item => item.status === 'low-stock').length}
//           </div>
//           <div className="text-gray-600">Low Stock</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-purple-600">${totalValue.toFixed(2)}</div>
//           <div className="text-gray-600">Total Value</div>
//         </div>
//       </div>

//       {/* Quick Actions & Alerts */}
//       {lowStockItems.length > 0 && (
//         <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="text-orange-600 text-lg">⚠️</div>
//               <div>
//                 <h4 className="font-semibold text-orange-800">Reorder Alert</h4>
//                 <p className="text-orange-700 text-sm">
//                   {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need{lowStockItems.length === 1 ? 's' : ''} restocking
//                 </p>
//               </div>
//             </div>
//             <button 
//               onClick={() => setFilterStatus('low-stock')}
//               className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-200 cursor-pointer"
//             >
//               View Items
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Filters and Search */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search items by name or ID..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//             />
//           </div>
//           <select
//             value={filterCategory}
//             onChange={(e) => setFilterCategory(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//           >
//             <option value="all">All Categories</option>
//             <option value="linen">Linen</option>
//             <option value="toiletries">Toiletries</option>
//             <option value="kitchen">Kitchen</option>
//             <option value="cleaning">Cleaning</option>
//             <option value="amenities">Amenities</option>
//             <option value="furniture">Furniture</option>
//             <option value="electronics">Electronics</option>
//           </select>
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//           >
//             <option value="all">All Status</option>
//             <option value="in-stock">In Stock</option>
//             <option value="low-stock">Low Stock</option>
//             <option value="out-of-stock">Out of Stock</option>
//           </select>
//         </div>
//       </div>

//       {/* Inventory Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredInventory.map((item) => (
//                 <tr key={item.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="font-medium text-[#383a3c]">{item.name}</div>
//                       <div className="text-gray-500 text-sm">ID: {item.id}</div>
//                       <div className="text-gray-600 text-sm capitalize">{item.category}</div>
//                       <div className="text-gray-400 text-sm">{item.location}</div>
//                       <div className="text-gray-400 text-sm">Supplier: {item.supplier}</div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="space-y-2">
//                       <div className="flex items-center space-x-2">
//                         <div className="w-20 bg-gray-200 rounded-full h-2">
//                           <div 
//                             className={`h-2 rounded-full ${
//                               item.status === 'out-of-stock' ? 'bg-red-500' :
//                               item.status === 'low-stock' ? 'bg-yellow-500' : 'bg-green-500'
//                             }`}
//                             style={{ 
//                               width: `${Math.min(100, (item.currentStock / (item.minStock * 2 || 1)) * 100)}%` 
//                             }}
//                           ></div>
//                         </div>
//                         <span className="text-sm font-medium text-gray-900">
//                           {item.currentStock} {item.unit}
//                         </span>
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         Min: {item.minStock} | Reorder: {item.reorderLevel}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         Cost: ${item.cost}/{item.unit}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)} capitalize`}>
//                       {item.status.replace('-', ' ')}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     ${getStockValue(item).toFixed(2)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {item.lastUpdated.toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex flex-col space-y-2">
//                       <button
//                         onClick={() => {
//                           setSelectedItem(item);
//                           setShowStockModal(true);
//                         }}
//                         className="text-blue-600 hover:text-blue-700 cursor-pointer text-left text-sm"
//                       >
//                         Update Stock
//                       </button>
//                       <button
//                         onClick={() => {
//                           setSelectedItem(item);
//                           setShowMovements(true);
//                         }}
//                         className="text-purple-600 hover:text-purple-700 cursor-pointer text-left text-sm"
//                       >
//                         View History
//                       </button>
//                       <button 
//                         onClick={() => deleteItem(item.id)}
//                         className="text-red-600 hover:text-red-700 cursor-pointer text-left text-sm"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Add Item Sidebar */}
//       {showAddSidebar && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
//           <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
//             <div className="p-6 h-full overflow-y-auto">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-xl font-bold">Add Inventory Item</h3>
//                 <button
//                   onClick={() => setShowAddSidebar(false)}
//                   className="text-gray-400 hover:text-gray-600 cursor-pointer"
//                 >
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
//                   <input
//                     type="text"
//                     value={newItem.name}
//                     onChange={(e) => setNewItem({...newItem, name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="Enter item name"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
//                   <select
//                     value={newItem.category}
//                     onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                   >
//                     <option value="linen">Linen</option>
//                     <option value="toiletries">Toiletries</option>
//                     <option value="kitchen">Kitchen</option>
//                     <option value="cleaning">Cleaning Supplies</option>
//                     <option value="amenities">Amenities</option>
//                     <option value="furniture">Furniture</option>
//                     <option value="electronics">Electronics</option>
//                   </select>
//                 </div>
//                 <div className="grid grid-cols-3 gap-3">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
//                     <input
//                       type="number"
//                       value={newItem.currentStock}
//                       onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
//                     <input
//                       type="number"
//                       value={newItem.minStock}
//                       onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
//                     <input
//                       type="number"
//                       value={newItem.reorderLevel}
//                       onChange={(e) => setNewItem({...newItem, reorderLevel: parseInt(e.target.value) || 0})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
//                   <input
//                     type="text"
//                     value={newItem.unit}
//                     onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="e.g., pieces, rolls, liters"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
//                   <input
//                     type="text"
//                     value={newItem.location}
//                     onChange={(e) => setNewItem({...newItem, location: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="Storage location"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
//                   <input
//                     type="text"
//                     value={newItem.supplier}
//                     onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="Supplier name"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit ($)</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={newItem.cost}
//                     onChange={(e) => setNewItem({...newItem, cost: parseFloat(e.target.value) || 0})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Optional)</label>
//                   <input
//                     type="text"
//                     value={newItem.barcode}
//                     onChange={(e) => setNewItem({...newItem, barcode: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="Scan or enter barcode"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//                   <textarea
//                     value={newItem.notes}
//                     onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
//                     rows={3}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                     placeholder="Additional notes..."
//                   />
//                 </div>
//                 <div className="flex space-x-3 pt-4 border-t border-gray-200">
//                   <button
//                     onClick={() => setShowAddSidebar(false)}
//                     className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleAddItem}
//                     className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                   >
//                     Add Item
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Update Stock Modal */}
//       {showStockModal && selectedItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Update Stock - {selectedItem.name}</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
//                 <select
//                   value={stockUpdate.type}
//                   onChange={(e) => setStockUpdate({...stockUpdate, type: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                 >
//                   <option value="in">Stock In</option>
//                   <option value="out">Stock Out</option>
//                   <option value="adjustment">Adjustment</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Quantity {stockUpdate.type === 'adjustment' ? '(New Total)' : ''}
//                 </label>
//                 <input
//                   type="number"
//                   value={stockUpdate.quantity}
//                   onChange={(e) => setStockUpdate({...stockUpdate, quantity: parseInt(e.target.value) || 0})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
//                 <input
//                   type="text"
//                   value={stockUpdate.reason}
//                   onChange={(e) => setStockUpdate({...stockUpdate, reason: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="e.g., Restock, Consumption, Correction"
//                 />
//               </div>
//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowStockModal(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => updateStock(selectedItem, stockUpdate.type, stockUpdate.quantity, stockUpdate.reason)}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Update
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Stock Movements Modal */}
//       {showMovements && selectedItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-4xl">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold">Stock History - {selectedItem.name}</h3>
//               <button
//                 onClick={() => setShowMovements(false)}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
            
//             <div className="space-y-3 max-h-96 overflow-y-auto">
//               {stockMovements
//                 .filter(movement => movement.itemId === selectedItem.id)
//                 .map((movement) => (
//                   <div key={movement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
//                     <div className="flex items-center space-x-4">
//                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                         movement.type === 'in' ? 'bg-green-100 text-green-600' :
//                         movement.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
//                       }`}>
//                         {movement.type === 'in' ? '⬆️' : movement.type === 'out' ? '⬇️' : '🔄'}
//                       </div>
//                       <div>
//                         <div className="font-medium text-gray-900">{movement.reason}</div>
//                         <div className="text-sm text-gray-500">
//                           {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '='} 
//                           {movement.quantity} {selectedItem.unit}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-sm text-gray-900">{movement.date.toLocaleDateString()}</div>
//                       <div className="text-xs text-gray-500">by {movement.performedBy}</div>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }








































































// // components/admin/operational/InventoryManager.tsx
// 'use client';

// import { useState } from 'react';

// interface InventoryItem {
//   id: string;
//   name: string;
//   category: 'linen' | 'toiletries' | 'kitchen' | 'cleaning' | 'amenities' | 'furniture' | 'electronics';
//   currentStock: number;
//   minStock: number;
//   unit: string;
//   location: string;
//   lastRestocked: Date;
//   supplier: string;
//   cost: number;
//   status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';
// }

// export default function InventoryManager() {
//   const [inventory, setInventory] = useState<InventoryItem[]>([
//     {
//       id: 'INV-001',
//       name: 'Bath Towels',
//       category: 'linen',
//       currentStock: 45,
//       minStock: 30,
//       unit: 'pieces',
//       location: 'Main Storage - Shelf A',
//       lastRestocked: new Date('2024-01-15'),
//       supplier: 'Linen Pro',
//       cost: 12.99,
//       status: 'in-stock'
//     },
//     {
//       id: 'INV-002',
//       name: 'Toilet Paper',
//       category: 'toiletries',
//       currentStock: 8,
//       minStock: 20,
//       unit: 'rolls',
//       location: 'Utility Room',
//       lastRestocked: new Date('2024-01-18'),
//       supplier: 'Clean Supplies Co.',
//       cost: 0.85,
//       status: 'low-stock'
//     }
//   ]);

//   const [showAddItem, setShowAddItem] = useState(false);
//   const [newItem, setNewItem] = useState({
//     name: '',
//     category: 'linen' as InventoryItem['category'],
//     currentStock: 0,
//     minStock: 0,
//     unit: '',
//     location: '',
//     supplier: '',
//     cost: 0
//   });

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'in-stock': return 'bg-green-100 text-green-800';
//       case 'low-stock': return 'bg-yellow-100 text-yellow-800';
//       case 'out-of-stock': return 'bg-red-100 text-red-800';
//       case 'on-order': return 'bg-blue-100 text-blue-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStockStatus = (current: number, min: number): InventoryItem['status'] => {
//     if (current === 0) return 'out-of-stock';
//     if (current <= min) return 'low-stock';
//     if (current <= min * 1.5) return 'on-order';
//     return 'in-stock';
//   };

//   const handleAddItem = () => {
//     const item: InventoryItem = {
//       id: `INV-${String(inventory.length + 1).padStart(3, '0')}`,
//       ...newItem,
//       lastRestocked: new Date(),
//       status: getStockStatus(newItem.currentStock, newItem.minStock)
//     };
    
//     setInventory([...inventory, item]);
//     setShowAddItem(false);
//     setNewItem({
//       name: '',
//       category: 'linen',
//       currentStock: 0,
//       minStock: 0,
//       unit: '',
//       location: '',
//       supplier: '',
//       cost: 0
//     });
//   };

//   const updateStock = (id: string, newStock: number) => {
//     setInventory(inventory.map(item => {
//       if (item.id === id) {
//         return {
//           ...item,
//           currentStock: newStock,
//           status: getStockStatus(newStock, item.minStock),
//           ...(newStock > item.currentStock ? { lastRestocked: new Date() } : {})
//         };
//       }
//       return item;
//     }));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Inventory Management</h2>
//           <p className="text-gray-600">Track and manage property inventory levels</p>
//         </div>
//         <button
//           onClick={() => setShowAddItem(true)}
//           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
//         >
//           + Add Item
//         </button>
//       </div>

//       {/* Inventory Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
//           <div className="text-gray-600">Total Items</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-green-600">
//             {inventory.filter(item => item.status === 'in-stock').length}
//           </div>
//           <div className="text-gray-600">In Stock</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-yellow-600">
//             {inventory.filter(item => item.status === 'low-stock').length}
//           </div>
//           <div className="text-gray-600">Low Stock</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-red-600">
//             {inventory.filter(item => item.status === 'out-of-stock').length}
//           </div>
//           <div className="text-gray-600">Out of Stock</div>
//         </div>
//       </div>

//       {/* Add Item Modal */}
//       {showAddItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Add Inventory Item</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
//                 <input
//                   type="text"
//                   value={newItem.name}
//                   onChange={(e) => setNewItem({...newItem, name: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Enter item name"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                 <select
//                   value={newItem.category}
//                   onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 >
//                   <option value="linen">Linen</option>
//                   <option value="toiletries">Toiletries</option>
//                   <option value="kitchen">Kitchen</option>
//                   <option value="cleaning">Cleaning Supplies</option>
//                   <option value="amenities">Amenities</option>
//                   <option value="furniture">Furniture</option>
//                   <option value="electronics">Electronics</option>
//                 </select>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
//                   <input
//                     type="number"
//                     value={newItem.currentStock}
//                     onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value)})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
//                   <input
//                     type="number"
//                     value={newItem.minStock}
//                     onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value)})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
//                 <input
//                   type="text"
//                   value={newItem.unit}
//                   onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="e.g., pieces, rolls, liters"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
//                 <input
//                   type="text"
//                   value={newItem.location}
//                   onChange={(e) => setNewItem({...newItem, location: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Storage location"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
//                 <input
//                   type="text"
//                   value={newItem.supplier}
//                   onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Supplier name"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit ($)</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   value={newItem.cost}
//                   onChange={(e) => setNewItem({...newItem, cost: parseFloat(e.target.value)})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowAddItem(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAddItem}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600"
//                 >
//                   Add Item
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Inventory Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Restocked</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {inventory.map((item) => (
//                 <tr key={item.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div>
//                       <div className="font-medium text-[#383a3c]">{item.name}</div>
//                       <div className="text-gray-500 text-sm">ID: {item.id}</div>
//                       <div className="text-gray-600 text-sm">${item.cost}/{item.unit}</div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
//                       {item.category}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center space-x-2">
//                       <div className="w-16 bg-gray-200 rounded-full h-2">
//                         <div 
//                           className={`h-2 rounded-full ${
//                             item.status === 'out-of-stock' ? 'bg-red-500' :
//                             item.status === 'low-stock' ? 'bg-yellow-500' : 'bg-green-500'
//                           }`}
//                           style={{ 
//                             width: `${Math.min(100, (item.currentStock / (item.minStock * 2 || 1)) * 100)}%` 
//                           }}
//                         ></div>
//                       </div>
//                       <span className="text-sm text-gray-900">
//                         {item.currentStock} / {item.minStock} {item.unit}
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)} capitalize`}>
//                       {item.status.replace('-', ' ')}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {item.location}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {item.lastRestocked.toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                     <button
//                       onClick={() => updateStock(item.id, item.currentStock + 1)}
//                       className="text-green-600 hover:text-green-700"
//                     >
//                       +1
//                     </button>
//                     <button
//                       onClick={() => updateStock(item.id, item.currentStock - 1)}
//                       className="text-red-600 hover:text-red-700"
//                     >
//                       -1
//                     </button>
//                     <button className="text-blue-600 hover:text-blue-700">Edit</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

