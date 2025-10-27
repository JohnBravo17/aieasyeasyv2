import React, { useState, useEffect } from 'react';
import { Settings, Percent, TrendingDown, TrendingUp, Zap, DollarSign } from 'lucide-react';
import pricingService from '../../services/pricingService.js';

const PricingControls = () => {
  const [isPromoMode, setIsPromoMode] = useState(false);
  const [currentMarkup, setCurrentMarkup] = useState(100);
  const [customMarkup, setCustomMarkup] = useState(50);

  useEffect(() => {
    // Check initial state
    setIsPromoMode(pricingService.isPromoMode);
    setCurrentMarkup(pricingService.getCurrentMarkup());

    // Listen for pricing mode changes
    const handlePricingModeChange = (event) => {
      setIsPromoMode(event.detail.isPromo);
      setCurrentMarkup(event.detail.markup);
    };

    window.addEventListener('pricingModeChanged', handlePricingModeChange);
    return () => window.removeEventListener('pricingModeChanged', handlePricingModeChange);
  }, []);

  const togglePromoMode = () => {
    if (isPromoMode) {
      pricingService.disablePromoMode();
    } else {
      pricingService.enablePromoMode();
    }
  };

  const updateCustomMarkup = () => {
    pricingService.setCustomMarkup(customMarkup);
  };

  const getEstimatedDiscount = () => {
    const normalPrice = 100; // Example: ฿1.00
    const promoPrice = 150; // Example: ฿1.50 with 50% markup vs ฿2.00 with 100% markup
    const discount = ((200 - 150) / 200 * 100).toFixed(0);
    return discount;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="text-blue-400" size={24} />
        <h3 className="text-xl font-bold text-white">Pricing Controls</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isPromoMode 
            ? 'bg-orange-900 text-orange-300 border border-orange-600' 
            : 'bg-green-900 text-green-300 border border-green-600'
        }`}>
          {isPromoMode ? '🎉 PROMOTIONAL' : '💰 NORMAL'}
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="text-blue-400" size={16} />
            <span className="text-gray-400 text-sm">Current Markup</span>
          </div>
          <div className="text-2xl font-bold text-white">{currentMarkup}%</div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="text-green-400" size={16} />
            <span className="text-gray-400 text-sm">Example Price</span>
          </div>
          <div className="text-lg font-bold text-white">
            ฿{Math.ceil(0.05 * (1 + currentMarkup/100) * 36)}
          </div>
          <div className="text-xs text-gray-400">
            (for ฿0.05 API cost)
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="text-yellow-400" size={16} />
            <span className="text-gray-400 text-sm">Customer Savings</span>
          </div>
          <div className="text-lg font-bold text-white">
            {isPromoMode ? '25%' : '0%'}
          </div>
          <div className="text-xs text-gray-400">
            vs normal pricing
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={togglePromoMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isPromoMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isPromoMode ? (
              <>
                <TrendingUp size={16} />
                Disable Promo (Back to 100%)
              </>
            ) : (
              <>
                <Zap size={16} />
                Enable 50% Promo Mode
              </>
            )}
          </button>

          <button 
            onClick={() => pricingService.setCustomMarkup(25)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            <TrendingDown size={16} />
            Super Promo (25%)
          </button>

          <button 
            onClick={() => pricingService.setCustomMarkup(75)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Percent size={16} />
            Mid Promo (75%)
          </button>
        </div>

        {/* Custom Markup Input */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Custom Markup</h4>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="200"
                value={customMarkup}
                onChange={(e) => setCustomMarkup(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="Enter markup percentage"
              />
            </div>
            <button
              onClick={updateCustomMarkup}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
            >
              Apply {customMarkup}%
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Example: 50% markup = API cost × 1.5 | 25% markup = API cost × 1.25
          </div>
        </div>

        {/* Impact Preview */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Price Impact Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Nanobanana (API: $0.05)</span>
              <div className="flex justify-between mt-1">
                <span className="text-white">Normal (100%):</span>
                <span className="font-mono text-green-400">฿{Math.ceil(0.05 * 2 * 36)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Current ({currentMarkup}%):</span>
                <span className="font-mono text-yellow-400">฿{Math.ceil(0.05 * (1 + currentMarkup/100) * 36)}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-400">FLUX.1 Pro (API: $0.12)</span>
              <div className="flex justify-between mt-1">
                <span className="text-white">Normal (100%):</span>
                <span className="font-mono text-green-400">฿{Math.ceil(0.12 * 2 * 36)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Current ({currentMarkup}%):</span>
                <span className="font-mono text-yellow-400">฿{Math.ceil(0.12 * (1 + currentMarkup/100) * 36)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingControls;