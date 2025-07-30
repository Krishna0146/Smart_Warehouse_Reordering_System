import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const AddProductForm = ({ onProductAdded, showNotification }) => {
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    currentStock: '',
    averageDailySales: '',
    supplierLeadTime: '',
    minimumReorderQuantity: '',
    costPerUnit: '',
    criticality: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.productId.trim()) {
      newErrors.productId = 'Product ID is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.currentStock || formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock must be a positive number';
    }
    if (!formData.averageDailySales || formData.averageDailySales < 0) {
      newErrors.averageDailySales = 'Average daily sales must be a positive number';
    }
    if (!formData.supplierLeadTime || formData.supplierLeadTime < 1) {
      newErrors.supplierLeadTime = 'Supplier lead time must be at least 1 day';
    }
    if (!formData.minimumReorderQuantity || formData.minimumReorderQuantity < 1) {
      newErrors.minimumReorderQuantity = 'Minimum reorder quantity must be at least 1';
    }
    if (!formData.costPerUnit || formData.costPerUnit <= 0) {
      newErrors.costPerUnit = 'Cost per unit must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);
      const productData = {
        ...formData,
        currentStock: parseInt(formData.currentStock),
        averageDailySales: parseFloat(formData.averageDailySales),
        supplierLeadTime: parseInt(formData.supplierLeadTime),
        minimumReorderQuantity: parseInt(formData.minimumReorderQuantity),
        costPerUnit: parseFloat(formData.costPerUnit)
      };

      await axios.post(`${API_BASE_URL}/products`, productData);
      
      // Reset form
      setFormData({
        productId: '',
        name: '',
        currentStock: '',
        averageDailySales: '',
        supplierLeadTime: '',
        minimumReorderQuantity: '',
        costPerUnit: '',
        criticality: 'medium'
      });
      
      onProductAdded();
    } catch (error) {
      if (error.response?.data?.message?.includes('duplicate key')) {
        showNotification('Product ID already exists. Please use a unique ID.', 'error');
      } else {
        showNotification('Failed to add product', 'error');
      }
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: '',
      name: '',
      currentStock: '',
      averageDailySales: '',
      supplierLeadTime: '',
      minimumReorderQuantity: '',
      costPerUnit: '',
      criticality: 'medium'
    });
    setErrors({});
  };

  // Generate sample product ID
  const generateSampleId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const sampleId = `PROD-${timestamp}`;
    handleInputChange('productId', sampleId);
  };

  // Input component with error handling
  const FormInput = ({ label, field, type = 'text', placeholder, min, step, required = true }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          errors[field] ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">➕ Add New Product</h2>
        <p className="text-gray-600 mt-1">Add a new product to your warehouse inventory system</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Identity Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="Product ID"
                  field="productId"
                  placeholder="e.g., PROD-001"
                />
                <button
                  type="button"
                  onClick={generateSampleId}
                  className="text-blue-600 hover:text-blue-800 text-xs mt-1 underline"
                >
                  Generate Sample ID
                </button>
              </div>
              <FormInput
                label="Product Name"
                field="name"
                placeholder="e.g., Wireless Bluetooth Headphones"
              />
            </div>
          </div>

          {/* Inventory Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Inventory Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Current Stock"
                field="currentStock"
                type="number"
                placeholder="e.g., 100"
                min="0"
              />
              <FormInput
                label="Average Daily Sales"
                field="averageDailySales"
                type="number"
                placeholder="e.g., 5.2"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Supply Chain Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🚚 Supply Chain Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Supplier Lead Time (days)"
                field="supplierLeadTime"
                type="number"
                placeholder="e.g., 7"
                min="1"
              />
              <FormInput
                label="Minimum Reorder Quantity"
                field="minimumReorderQuantity"
                type="number"
                placeholder="e.g., 50"
                min="1"
              />
            </div>
          </div>

          {/* Financial & Priority Section */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Financial & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Cost Per Unit (₹)"
                field="costPerUnit"
                type="number"
                placeholder="e.g., 29.99"
                min="0.01"
                step="0.01"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criticality Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.criticality}
                  onChange={(e) => handleInputChange('criticality', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">🟢 Low - Non-essential items</option>
                  <option value="medium">🟡 Medium - Standard priority</option>
                  <option value="high">🔴 High - Critical/Essential items</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {(formData.currentStock && formData.averageDailySales) && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📊 Quick Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Days of Stock:</span>
                  <div className="text-blue-900">
                    {formData.averageDailySales > 0 
                      ? Math.floor(formData.currentStock / formData.averageDailySales)
                      : '∞'
                    } days
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Stock Value:</span>
                  <div className="text-blue-900">
                    ₹{((formData.currentStock || 0) * (formData.costPerUnit || 0)).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Safety Buffer:</span>
                  <div className="text-blue-900">
                    {(formData.supplierLeadTime || 0) + 5} days
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Min Order Value:</span>
                  <div className="text-blue-900">
                    ₹{((formData.minimumReorderQuantity || 0) * (formData.costPerUnit || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? '⏳ Adding Product...' : '✅ Add Product'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
            >
              🗑️ Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="bg-yellow-50 rounded-xl shadow-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">💡 Tips for Adding Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
          <div>
            <h4 className="font-medium mb-2">Product ID Guidelines:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use a consistent format (e.g., PROD-001, SKU-ABC123)</li>
              <li>Make it unique and meaningful</li>
              <li>Include category codes if needed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Accurate Data Entry:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use precise daily sales averages from historical data</li>
              <li>Verify lead times with your suppliers</li>
              <li>Set realistic minimum order quantities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductForm;