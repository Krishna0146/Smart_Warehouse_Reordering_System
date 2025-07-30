import React, { useState } from 'react';

const ReorderAnalysis = ({ reorderData, loading, onRefresh }) => {
  const [sortBy, setSortBy] = useState('daysRemaining');
  const [filterBy, setFilterBy] = useState('all');

  // Sort and filter data
  const processedData = reorderData
    .filter(item => {
      if (filterBy === 'needsReorder') return item.needsReorder;
      if (filterBy === 'critical') return item.criticality === 'high';
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'daysRemaining':
          return a.daysRemaining - b.daysRemaining;
        case 'estimatedCost':
          return b.estimatedCost - a.estimatedCost;
        case 'criticality':
          const criticalityOrder = { high: 3, medium: 2, low: 1 };
          return criticalityOrder[b.criticality] - criticalityOrder[a.criticality];
        default:
          return 0;
      }
    });

  // Calculate summary statistics
  const summary = {
    totalProducts: reorderData.length,
    needsReorder: reorderData.filter(item => item.needsReorder).length,
    totalReorderCost: reorderData
      .filter(item => item.needsReorder)
      .reduce((sum, item) => sum + item.estimatedCost, 0),
    criticalReorders: reorderData
      .filter(item => item.needsReorder && item.criticality === 'high').length
  };

  // Urgency level component
  const UrgencyBadge = ({ daysRemaining, needsReorder }) => {
    if (!needsReorder) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ OK</span>;
    }
    
    if (daysRemaining <= 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">🚨 OUT OF STOCK</span>;
    } else if (daysRemaining <= 3) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 URGENT</span>;
    } else if (daysRemaining <= 7) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">🟡 HIGH</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">🟠 MEDIUM</span>;
    }
  };

  // Criticality badge
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
          <h2 className="text-2xl font-bold text-gray-900">🔄 Reorder Analysis</h2>
          <p className="text-gray-600 mt-1">Intelligent stock level monitoring and reorder recommendations</p>
        </div>
        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          🔄 Refresh Analysis
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{summary.totalProducts}</p>
            </div>
            <div className="text-4xl opacity-20">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Needs Reorder</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{summary.needsReorder}</p>
            </div>
            <div className="text-4xl opacity-20">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Reorder Cost</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ₹{summary.totalReorderCost.toLocaleString('en-US', {maximumFractionDigits: 0})}
              </p>
            </div>
            <div className="text-4xl opacity-20">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Critical Reorders</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{summary.criticalReorders}</p>
            </div>
            <div className="text-4xl opacity-20">🔥</div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daysRemaining">Days Remaining</option>
              <option value="estimatedCost">Estimated Cost</option>
              <option value="criticality">Criticality Level</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Products</option>
              <option value="needsReorder">Needs Reorder</option>
              <option value="critical">Critical Items</option>
            </select>
          </div>

          <div className="ml-auto">
            <div className="text-sm text-gray-600">
              Showing {processedData.length} of {reorderData.length} products
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">📋 Detailed Analysis</h3>
        </div>
        
        {processedData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Load some products to see the reorder analysis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criticality
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.map((item) => (
                  <tr key={item._id} className={`hover:bg-gray-50 ${item.needsReorder ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.productId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.currentStock} units</div>
                      <div className="text-sm text-gray-500">{item.averageDailySales}/day avg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        {item.daysRemaining === Infinity ? '∞' : item.daysRemaining}
                      </div>
                      <div className="text-sm text-gray-500">
                        Safety: {item.safetyThreshold} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UrgencyBadge 
                        daysRemaining={item.daysRemaining} 
                        needsReorder={item.needsReorder} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.needsReorder ? `${item.optimalReorderQuantity} units` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Min: {item.minimumReorderQuantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.needsReorder ? `₹${item.estimatedCost.toFixed(2)}` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        @₹{item.costPerUnit}/unit
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CriticalityBadge level={item.criticality} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reorder Report Summary */}
      {summary.needsReorder > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4">🚨 Reorder Report Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.needsReorder}</div>
              <div className="text-sm text-gray-600">Products Need Reordering</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{summary.totalReorderCost.toLocaleString('en-US', {maximumFractionDigits: 0})}
              </div>
              <div className="text-sm text-gray-600">Total Investment Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.criticalReorders}</div>
              <div className="text-sm text-gray-600">Critical Priority Items</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderAnalysis;