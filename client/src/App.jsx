import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Import components
import ProductList from './components/ProductList';
import ReorderAnalysis from './components/ReorderAnalysis';
import DemandSpikeSim from './components/DemandSpikeSim';
import AddProductForm from './components/AddProductForm';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [reorderData, setReorderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      showNotification('Failed to fetch products', 'error');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reorder analysis
  const fetchReorderAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/reorder-analysis`);
      setReorderData(response.data);
    } catch (error) {
      showNotification('Failed to fetch reorder analysis', 'error');
      console.error('Error fetching reorder analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Seed database with sample data
  const seedDatabase = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/seed-data`);
      showNotification('Sample data loaded successfully!', 'success');
      fetchProducts();
      fetchReorderAnalysis();
    } catch (error) {
      showNotification('Failed to seed database', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProducts();
    fetchReorderAnalysis();
  }, []);

  // Tab navigation component
  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-md transform scale-105'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );

  // Notification component
  const Notification = ({ message, type, onClose }) => (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-3 text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  );

  // Stats cards for dashboard
  const StatsCard = ({ title, value, subtitle, color, icon }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="text-4xl opacity-20">
          {icon}
        </div>
      </div>
    </div>
  );

  // Calculate dashboard stats
  const stats = {
    totalProducts: products.length,
    lowStock: reorderData.filter(p => p.needsReorder).length,
    totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.costPerUnit), 0),
    criticalItems: products.filter(p => p.criticality === 'high').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏭 Smart Warehouse System
              </h1>
              <p className="text-gray-600 mt-1">Intelligent Inventory Management & Reordering</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={seedDatabase}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : '🌱 Load Sample Data'}
              </button>
              <button
                onClick={() => {
                  fetchProducts();
                  fetchReorderAnalysis();
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : '🔄 Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <TabButton
              id="dashboard"
              label="Dashboard"
              icon="📊"
              isActive={activeTab === 'dashboard'}
              onClick={setActiveTab}
            />
            <TabButton
              id="products"
              label="Products"
              icon="📦"
              isActive={activeTab === 'products'}
              onClick={setActiveTab}
            />
            <TabButton
              id="reorder"
              label="Reorder Analysis"
              icon="🔄"
              isActive={activeTab === 'reorder'}
              onClick={setActiveTab}
            />
            <TabButton
              id="simulation"
              label="Demand Simulation"
              icon="📈"
              isActive={activeTab === 'simulation'}
              onClick={setActiveTab}
            />
            <TabButton
              id="add-product"
              label="Add Product"
              icon="➕"
              isActive={activeTab === 'add-product'}
              onClick={setActiveTab}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Products"
                value={stats.totalProducts}
                subtitle="Items in inventory"
                color="border-blue-500"
                icon="📦"
              />
              <StatsCard
                title="Low Stock Alerts"
                value={stats.lowStock}
                subtitle="Need reordering"
                color="border-red-500"
                icon="⚠️"
              />
              <StatsCard
                title="Inventory Value"
                value={`₹${stats.totalValue.toLocaleString('en-US', {maximumFractionDigits: 0})}`}
                subtitle="Total stock value"
                color="border-green-500"
                icon="💰"
              />
              <StatsCard
                title="Critical Items"
                value={stats.criticalItems}
                subtitle="High priority products"
                color="border-orange-500"
                icon="🔥"
              />
            </div>

            {/* Quick Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Quick Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">🚨 Urgent Reorders</h3>
                  <div className="space-y-2">
                    {reorderData.filter(p => p.needsReorder).slice(0, 3).map(product => (
                      <div key={product._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-gray-800">{product.name}</span>
                        <span className="text-sm text-red-600 font-semibold">
                          {product.daysRemaining} days left
                        </span>
                      </div>
                    ))}
                    {reorderData.filter(p => p.needsReorder).length === 0 && (
                      <p className="text-gray-500 italic">No urgent reorders needed! 🎉</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">🔥 High Priority Items</h3>
                  <div className="space-y-2">
                    {products.filter(p => p.criticality === 'high').slice(0, 3).map(product => (
                      <div key={product._id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium text-gray-800">{product.name}</span>
                        <span className="text-sm text-orange-600 font-semibold">
                          {product.currentStock} units
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <ProductList 
            products={products} 
            loading={loading}
            onRefresh={fetchProducts}
            showNotification={showNotification}
          />
        )}

        {/* Reorder Analysis Tab */}
        {activeTab === 'reorder' && (
          <ReorderAnalysis 
            reorderData={reorderData} 
            loading={loading}
            onRefresh={fetchReorderAnalysis}
          />
        )}

        {/* Demand Simulation Tab */}
        {activeTab === 'simulation' && (
          <DemandSpikeSim 
            products={products}
            showNotification={showNotification}
          />
        )}

        {/* Add Product Tab */}
        {activeTab === 'add-product' && (
          <AddProductForm 
            onProductAdded={() => {
              fetchProducts();
              fetchReorderAnalysis();
              showNotification('Product added successfully!');
            }}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;