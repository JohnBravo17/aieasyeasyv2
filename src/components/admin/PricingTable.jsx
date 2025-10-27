import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator, RefreshCw } from 'lucide-react';
import pricingService from '../../services/pricingService.js';

const PricingTable = () => {
  console.log('PricingTable component rendering...');
  const [imagePricing, setImagePricing] = useState([]);
  const [videoPricing, setVideoPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPricingData = () => {
    try {
      console.log('Loading pricing data...');
      const imageTable = pricingService.getPricingTable();
      const videoTable = pricingService.getVideoPricingTable();
      
      console.log('Image table:', imageTable);
      console.log('Video table:', videoTable);
      
      setImagePricing(imageTable);
      setVideoPricing(videoTable);
      setLoading(false);
    } catch (error) {
      console.error('Error loading pricing data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();

    // Listen for cost data updates and pricing mode changes
    const handleCostUpdate = () => {
      loadPricingData();
    };

    const handlePricingModeChange = () => {
      loadPricingData();
    };

    window.addEventListener('costDataUpdated', handleCostUpdate);
    window.addEventListener('pricingModeChanged', handlePricingModeChange);
    return () => {
      window.removeEventListener('costDataUpdated', handleCostUpdate);
      window.removeEventListener('pricingModeChanged', handlePricingModeChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-red-800 rounded-lg p-6 mb-6 border-2 border-red-500">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="text-red-400" size={20} />
          <h3 className="text-lg font-semibold text-white">🔴 PRICING ANALYSIS LOADING</h3>
        </div>
        <div className="text-red-300 text-xl">Loading pricing data...</div>
      </div>
    );
  }

  const PricingTableView = ({ data, title, icon: Icon }) => (
    <div className="bg-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className="text-blue-400" size={18} />
          <h4 className="text-md font-semibold text-white">{title}</h4>
        </div>
        <button 
          onClick={loadPricingData}
          className="flex items-center space-x-1 px-2 py-1 bg-gray-600 rounded text-xs text-gray-300 hover:bg-gray-500"
        >
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-600">
              <th className="text-left py-2 px-2">Model</th>
              <th className="text-right py-2 px-2">Default Cost</th>
              <th className="text-right py-2 px-2">Avg Logged</th>
              <th className="text-right py-2 px-2">Final Cost</th>
              <th className="text-center py-2 px-2">Markup</th>
              <th className="text-right py-2 px-2">User Price (USD)</th>
              <th className="text-right py-2 px-2">User Price (THB)</th>
              <th className="text-right py-2 px-2">Profit (USD)</th>
              <th className="text-center py-2 px-2">Margin</th>
              <th className="text-center py-2 px-2">Logs</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="text-gray-300 border-b border-gray-700 hover:bg-gray-600">
                <td className="py-2 px-2 font-medium text-white">{row.model}</td>
                <td className="py-2 px-2 text-right font-mono">${row.defaultCost}</td>
                <td className="py-2 px-2 text-right font-mono text-yellow-400">
                  {row.avgLoggedCost !== 'No data' ? `$${row.avgLoggedCost}` : row.avgLoggedCost}
                </td>
                <td className="py-2 px-2 text-right font-mono text-blue-400">${row.finalCost}</td>
                <td className="py-2 px-2 text-center text-green-400">{row.markup}</td>
                <td className="py-2 px-2 text-right font-mono font-bold text-green-300">${row.customerChargeUSD}</td>
                <td className="py-2 px-2 text-right font-bold text-green-400">{row.customerChargeTHB}</td>
                <td className="py-2 px-2 text-right font-mono text-green-300">${row.profitUSD}</td>
                <td className="py-2 px-2 text-center text-green-400">{row.profitMargin}</td>
                <td className="py-2 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    row.logCount > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-400'
                  }`}>
                    {row.logCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const exchangeRate = imagePricing[0]?.exchangeRate || 36;

  return (
    <div className="bg-green-800 rounded-lg p-6 mb-6 border-2 border-green-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calculator className="text-green-400" size={24} />
          <h3 className="text-xl font-bold text-white">🟢 PRICING ANALYSIS LOADED</h3>
        </div>
        <div className="text-sm text-green-300">
          Exchange Rate: $1 USD = ฿{exchangeRate} THB
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="text-green-400" size={16} />
            <span className="text-gray-400 text-sm">Total Models</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {imagePricing.length + videoPricing.length}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="text-blue-400" size={16} />
            <span className="text-gray-400 text-sm">Pricing Modes</span>
          </div>
          <div className="text-lg font-bold text-white">
            Auto + Custom
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calculator className="text-yellow-400" size={16} />
            <span className="text-gray-400 text-sm">Avg. Price Range</span>
          </div>
          <div className="text-lg font-bold text-white">
            ฿{Math.min(...imagePricing.map(p => p.customerChargeTHB.replace('฿', '')))}-
            ฿{Math.max(...imagePricing.map(p => p.customerChargeTHB.replace('฿', '')))}
          </div>
        </div>
      </div>

      {/* Image Models Table */}
      <PricingTableView 
        data={imagePricing} 
        title="Image Generation Models" 
        icon={DollarSign} 
      />

      {/* Video Models Table */}
      {videoPricing.length > 0 && (
        <PricingTableView 
          data={videoPricing} 
          title="Video Generation Models" 
          icon={TrendingUp} 
        />
      )}

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h5 className="text-white font-semibold mb-2">Legend:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
          <div><span className="text-white">Default Cost:</span> Base price for the model</div>
          <div><span className="text-yellow-400">Avg Logged:</span> Average of real API costs recorded</div>
          <div><span className="text-blue-400">Final Cost:</span> (Default + Avg Logged) ÷ 2</div>
          <div><span className="text-green-400">Markup:</span> 🤖 AUTO = Smart pricing | 🎛️ CUSTOM = Custom % | 🎯 CUSTOM = Fixed ฿</div>
        </div>
      </div>
    </div>
  );
};

export default PricingTable;