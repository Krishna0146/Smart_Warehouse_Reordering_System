import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductList = ({ products, loading, onRefresh, showNotification }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Handle product deletion
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_BASE_URL}/products/${productId}`);
        showNotification('Product deleted successfully!', 'success');
        onRefresh();
      } catch (error) {
        showNotification('Failed to delete product', 'error');
        console.error('Error deleting product:', error);
      }
    }
  };

  // Start editing a product
  const startEditing = (product) => {
    setEditingProduct(product._id);
    setEditForm({ ...product });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProduct(null);
    setEditForm({});
  };

  // Save edited product
  const saveProduct = async () => {
    try {
      await axios.put(`${API_BASE_URL}/products/${editingProduct}`, editForm);
      showNotification('Product updated successfully!', 'success');
      setEditingProduct(null);
      setEditForm({});
      onRefresh();
    } catch (error) {
      showNotification('Failed to update product', 'error');
      console.error('Error updating product:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: field.includes('Stock') || field.includes('Sales') || field.includes('LeadTime') || 
               field.includes('Quantity') || field.includes('costPerUnit') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Criticality badge component
  const CriticalityBadge = ({ level }) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📦 Product Inventory</h2>
          <p className="text-gray-600 mt-1">Manage your warehouse products and stock levels</p>
        </div>
        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Load sample data or add your first product to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-lg truncate">{product.name}</h3>
                    <p className="text-blue-100 text-sm">ID: {product.productId}</p>
                  </div>
                  <CriticalityBadge level={product.criticality} />
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6">
                {editingProduct === product._id ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                        <input
                          type="number"
                          value={editForm.currentStock || ''}
                          onChange={(e) => handleInputChange('currentStock', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Sales</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.averageDailySales || ''}
                          onChange={(e) => handleInputChange('averageDailySales', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
                        <input
                          type="number"
                          value={editForm.supplierLeadTime || ''}
                          onChange={(e) => handleInputChange('supplierLeadTime', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Reorder Qty</label>
                        <input
                          type="number"
                          value={editForm.minimumReorderQuantity || ''}
                          onChange={(e) => handleInputChange('minimumReorderQuantity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Unit (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.costPerUnit || ''}
                          onChange={(e) => handleInputChange('costPerUnit', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Criticality</label>
                        <select
                          value={editForm.criticality || ''}
                          onChange={(e) => handleInputChange('criticality', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Edit Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={saveProduct}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                      >
                        ✅ Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="space-y-4">
                    {/* Stock Level Indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Current Stock</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-800">{product.currentStock}</span>
                        <span className="text-sm text-gray-500">units</span>
                      </div>
                    </div>

                    {/* Stock Level Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          product.currentStock > 50 ? 'bg-green-500' : 
                          product.currentStock > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (product.currentStock / 100) * 100)}%` }}
                      ></div>
                    </div>

                    {/* Product Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daily Sales:</span>
                          <span className="font-medium">{product.averageDailySales}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lead Time:</span>
                          <span className="font-medium">{product.supplierLeadTime} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min Reorder:</span>
                          <span className="font-medium">{product.minimumReorderQuantity}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit Cost:</span>
                          <span className="font-medium">₹{product.costPerUnit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stock Value:</span>
                          <span className="font-medium text-green-600">
                            ₹{(product.currentStock * product.costPerUnit).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Updated:</span>
                          <span className="font-medium text-xs">
                            {new Date(product.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t">
                      <button
                        onClick={() => startEditing(product)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;