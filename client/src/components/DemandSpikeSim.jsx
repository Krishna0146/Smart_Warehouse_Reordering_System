import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const DemandSpikeSim = ({ products, showNotification }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [spikeMultiplier, setSpikeMultiplier] = useState(2);
  const [spikeDuration, setSpikeDuration] = useState(7);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Run demand spike simulation
  const runSimulation = async () => {
    if (!selectedProduct) {
      showNotification('Please select a product first', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/simulate-demand-spike`, {
        productId: selectedProduct,
        spikeMultiplier: parseFloat(spikeMultiplier),
        spikeDuration: parseInt(spikeDuration)
      });
      
      setSimulationResult(response.data);
      showNotification('Simulation completed successfully!', 'success');
    } catch (error) {
      showNotification('Failed to run simulation', 'error');
      console.error('Error running simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear simulation results
  const clearSimulation = () => {
    setSimulationResult(null);
    setSelectedProduct('');
    setSpikeMultiplier(2);
    setSpikeDuration(7);
  };

  // Get selected product details
  const selectedProductDetails = products.find(p => p.productId === selectedProduct);

  // Comparison component
  const ComparisonCard = ({ title, original, afterSpike, unit, isImprovement = false }) => {
    const difference = afterSpike - original;
    const percentChange = original !== 0 ? ((difference / original) * 100) : 0;
    const isPositive = difference > 0;
    
    return (
      <div className="bg-white rounded-lg p-4 shadow-md border">
        <h4 className="text-sm font-medium text-gray-600 mb-2">{title}</h4>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-lg font-bold text-gray-800">
              {afterSpike.toFixed(2)} {unit}
            </div>
            <div className="text-sm text-gray-500">
              From: {original.toFixed(2)} {unit}
            </div>
          </div>
          <div className={`text-right ${
            isImprovement 
              ? (isPositive ? 'text-green-600' : 'text-red-600')
              : (isPositive ? 'text-red-600' : 'text-green-600')
          }`}>
            <div className="text-sm font-medium">
              {isPositive ? '+' : ''}{difference.toFixed(2)}
            </div>
            <div className="text-xs">
              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📈 Demand Spike Simulation</h2>
        <p className="text-gray-600 mt-1">
          Simulate sudden demand increases and see how they impact your inventory and reorder recommendations
        </p>
      </div>

      {/* Simulation Setup */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Simulation Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product.productId} value={product.productId}>
                  {product.name} (ID: {product.productId})
                </option>
              ))}
            </select>
          </div>

          {/* Spike Multiplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demand Multiplier
            </label>
            <input
              type="number"
              min="1.1"
              max="10"
              step="0.1"
              value={spikeMultiplier}
              onChange={(e) => setSpikeMultiplier(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., 2.0 = 2x normal demand</p>
          </div>

          {/* Spike Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={spikeDuration}
              onChange={(e) => setSpikeDuration(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">How long the spike lasts</p>
          </div>
        </div>

        {/* Selected Product Info */}
        {selectedProductDetails && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📦 Selected Product Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Current Stock:</span>
                <div className="text-blue-900">{selectedProductDetails.currentStock} units</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Daily Sales:</span>
                <div className="text-blue-900">{selectedProductDetails.averageDailySales} units/day</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Lead Time:</span>
                <div className="text-blue-900">{selectedProductDetails.supplierLeadTime} days</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Unit Cost:</span>
                <div className="text-blue-900">₹{selectedProductDetails.costPerUnit}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={runSimulation}
            disabled={loading || !selectedProduct}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? '⏳ Running...' : '🚀 Run Simulation'}
          </button>
          <button
            onClick={clearSimulation}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            🗑️ Clear Results
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Spike Impact Overview */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">⚡ Spike Impact Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {simulationResult.spikeDetails.spikeMultiplier}x
                </div>
                <div className="text-sm text-gray-600">Demand Multiplier</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {simulationResult.spikeDetails.spikeDuration}
                </div>
                <div className="text-sm text-gray-600">Days Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {simulationResult.spikeDetails.totalConsumptionDuringSpike.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Total Units Consumed</div>
              </div>
            </div>
          </div>

          {/* Before vs After Comparison */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">📊 Before vs After Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ComparisonCard
                title="Current Stock"
                original={simulationResult.original.currentStock}
                afterSpike={simulationResult.afterSpike.stockAfterSpike}
                unit="units"
              />
              
              <ComparisonCard
                title="Daily Sales Rate"
                original={simulationResult.original.averageDailySales}
                afterSpike={simulationResult.afterSpike.newAverageDailySales}
                unit="units/day"
              />
              
              <ComparisonCard
                title="Days Remaining"
                original={simulationResult.original.daysRemaining}
                afterSpike={simulationResult.afterSpike.daysRemaining === Infinity ? 999 : simulationResult.afterSpike.daysRemaining}
                unit="days"
                isImprovement={true}
              />
              
              <ComparisonCard
                title="Reorder Cost"
                original={0}
                afterSpike={simulationResult.afterSpike.estimatedCost}
                unit="₹"
              />
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original State */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Original State</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-medium">{simulationResult.original.currentStock} units</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Daily Sales:</span>
                  <span className="font-medium">{simulationResult.original.averageDailySales} units/day</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-medium text-green-600">
                    {simulationResult.original.daysRemaining === Infinity ? '∞' : simulationResult.original.daysRemaining} days
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Reorder Status:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ OK
                  </span>
                </div>
              </div>
            </div>

            {/* After Spike State */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">⚡ After Spike Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Stock After Spike:</span>
                  <span className="font-medium text-red-600">{simulationResult.afterSpike.stockAfterSpike} units</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">New Daily Sales:</span>
                  <span className="font-medium">{simulationResult.afterSpike.newAverageDailySales.toFixed(2)} units/day</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className={`font-medium ${simulationResult.afterSpike.daysRemaining <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {simulationResult.afterSpike.daysRemaining === Infinity ? '∞' : simulationResult.afterSpike.daysRemaining} days
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Reorder Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    simulationResult.afterSpike.needsReorder 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {simulationResult.afterSpike.needsReorder ? '🚨 NEEDS REORDER' : '✅ OK'}
                  </span>
                </div>
                {simulationResult.afterSpike.needsReorder && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Reorder Quantity:</span>
                      <span className="font-medium text-blue-600">
                        {simulationResult.afterSpike.optimalReorderQuantity} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Estimated Cost:</span>
                      <span className="font-medium text-green-600">
                        ₹{simulationResult.afterSpike.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className={`rounded-xl shadow-lg p-6 ${
            simulationResult.afterSpike.needsReorder 
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' 
              : 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4 ${simulationResult.afterSpike.needsReorder ? 'text-red-800' : 'text-green-800'}">
              💡 Recommendations
            </h3>
            
            {simulationResult.afterSpike.needsReorder ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="text-red-600 mt-1">🚨</div>
                  <div>
                    <p className="font-medium text-red-800">Immediate Action Required</p>
                    <p className="text-red-700 text-sm">
                      The demand spike will trigger a reorder requirement. Consider placing an order for{' '}
                      <strong>{simulationResult.afterSpike.optimalReorderQuantity} units</strong> at an estimated cost of{' '}
                      <strong>₹{simulationResult.afterSpike.estimatedCost.toFixed(2)}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-orange-600 mt-1">⚡</div>
                  <div>
                    <p className="font-medium text-orange-800">Prepare for Increased Demand</p>
                    <p className="text-orange-700 text-sm">
                      Consider increasing safety stock levels or negotiating faster delivery times with suppliers
                      to handle future demand spikes more effectively.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <div className="text-green-600 mt-1">✅</div>
                <div>
                  <p className="font-medium text-green-800">Stock Levels Sufficient</p>
                  <p className="text-green-700 text-sm">
                    Current inventory can handle this demand spike without requiring immediate reordering.
                    Continue monitoring stock levels as the new average daily sales rate may impact future requirements.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl shadow-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">ℹ️ How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">Simulation Process:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Calculates total consumption during spike period</li>
              <li>Updates remaining stock after the spike</li>
              <li>Recalculates average daily sales with spike impact</li>
              <li>Determines new reorder requirements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Use Cases:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Holiday season planning</li>
              <li>Marketing campaign impact assessment</li>
              <li>Supply chain stress testing</li>
              <li>Emergency preparedness planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandSpikeSim;
            