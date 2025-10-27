import React, { useState, useEffect } from 'react';
import { Settings, Edit3, DollarSign, Percent, Target, Zap, RefreshCw } from 'lucide-react';
import pricingService from '../../services/pricingService.js';

const ModelPricingEditor = () => {
  const [modelConfigs, setModelConfigs] = useState({});
  const [editingModel, setEditingModel] = useState(null);
  const [tempValues, setTempValues] = useState({});

  const imageModels = ['Nanobanana', 'FLUX.1 [dev]', 'FLUX.1.1 Pro', 'FLUX.1 Kontext [pro]', 'Seedream 4.0'];
  const videoModels = ['Seedance 1.0 Lite', 'Minimax'];

  useEffect(() => {
    loadModelConfigs();

    const handlePricingChange = () => {
      loadModelConfigs();
    };

    window.addEventListener('pricingModeChanged', handlePricingChange);
    return () => window.removeEventListener('pricingModeChanged', handlePricingChange);
  }, []);

  const loadModelConfigs = () => {
    const configs = {};
    [...imageModels, ...videoModels].forEach(model => {
      configs[model] = pricingService.getModelPricingConfig(model);
    });
    setModelConfigs(configs);
  };

  const handleModeChange = (modelName, mode) => {
    pricingService.setModelPricingMode(modelName, mode);
    if (mode === 'auto') {
      setEditingModel(null);
    }
  };

  const handleCustomPriceSet = (modelName) => {
    const price = tempValues[`${modelName}_price`];
    if (price && price > 0) {
      pricingService.setModelCustomPrice(modelName, parseFloat(price));
      setEditingModel(null);
      setTempValues({ ...tempValues, [`${modelName}_price`]: '' });
    }
  };

  const handleCustomMarkupSet = (modelName) => {
    const markup = tempValues[`${modelName}_markup`];
    if (markup !== undefined && markup >= 0) {
      pricingService.setModelCustomMarkup(modelName, parseFloat(markup));
      setEditingModel(null);
      setTempValues({ ...tempValues, [`${modelName}_markup`]: '' });
    }
  };

  const getExamplePrice = (modelName, config) => {
    // Simulate pricing calculation
    const baseCosts = {
      'Nanobanana': 0.05, 'FLUX.1 [dev]': 0.08, 'FLUX.1.1 Pro': 0.12,
      'FLUX.1 Kontext [pro]': 0.15, 'Seedream 4.0': 0.10,
      'Seedance 1.0 Lite': 0.20, 'Minimax': 0.25
    };
    
    const baseCost = baseCosts[modelName] || 0.08;
    
    if (config.mode === 'custom' && config.customPriceTHB) {
      return config.customPriceTHB;
    } else if (config.mode === 'markup' && config.customMarkup !== null) {
      return Math.ceil(baseCost * (1 + config.customMarkup / 100) * 36);
    } else {
      return Math.ceil(baseCost * 2 * 36); // Default 100% markup
    }
  };

  const ModelPricingRow = ({ modelName, isVideo = false }) => {
    const config = modelConfigs[modelName] || { mode: 'auto', customPriceTHB: null, customMarkup: null };
    const isEditing = editingModel === modelName;
    const examplePrice = getExamplePrice(modelName, config);

    return (
      <tr className="border-b border-gray-700 hover:bg-gray-600">
        <td className="py-3 px-4 font-medium text-white">
          {modelName}
          {isVideo && <span className="ml-2 text-xs text-purple-400">VIDEO</span>}
        </td>
        
        <td className="py-3 px-4">
          <select
            value={config.mode}
            onChange={(e) => handleModeChange(modelName, e.target.value)}
            className="bg-gray-600 text-white rounded px-3 py-1 text-sm border border-gray-500"
          >
            <option value="auto">🤖 Auto</option>
            <option value="markup">🎛️ Custom Markup</option>
            <option value="custom">🎯 Custom Price</option>
          </select>
        </td>
        
        <td className="py-3 px-4">
          {config.mode === 'custom' && config.customPriceTHB ? (
            <div className="flex items-center space-x-2">
              <span className="text-green-400 font-mono">฿{config.customPriceTHB}</span>
              <button
                onClick={() => setEditingModel(modelName)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Edit3 size={14} />
              </button>
            </div>
          ) : config.mode === 'markup' && config.customMarkup !== null ? (
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400 font-mono">{config.customMarkup}%</span>
              <button
                onClick={() => setEditingModel(modelName)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Edit3 size={14} />
              </button>
            </div>
          ) : (
            <span className="text-gray-400">100% (Auto)</span>
          )}
        </td>
        
        <td className="py-3 px-4">
          <span className={`font-mono font-bold ${config.mode === 'auto' ? 'text-green-400' : 'text-yellow-400'}`}>
            ฿{examplePrice}
          </span>
        </td>
        
        <td className="py-3 px-4">
          {!isEditing ? (
            <button
              onClick={() => setEditingModel(modelName)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              {config.mode === 'custom' || editingModel === modelName ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="1"
                    placeholder="THB"
                    value={tempValues[`${modelName}_price`] || ''}
                    onChange={(e) => setTempValues({ ...tempValues, [`${modelName}_price`]: e.target.value })}
                    className="w-20 px-2 py-1 bg-gray-600 text-white rounded text-sm border border-gray-500"
                  />
                  <button
                    onClick={() => handleCustomPriceSet(modelName)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    placeholder="%"
                    value={tempValues[`${modelName}_markup`] || ''}
                    onChange={(e) => setTempValues({ ...tempValues, [`${modelName}_markup`]: e.target.value })}
                    className="w-16 px-2 py-1 bg-gray-600 text-white rounded text-sm border border-gray-500"
                  />
                  <button
                    onClick={() => handleCustomMarkupSet(modelName)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                  >
                    Set
                  </button>
                </div>
              )}
              <button
                onClick={() => setEditingModel(null)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-white">Individual Model Pricing</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => pricingService.setAllModelsToPromo()}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold"
          >
            <Zap size={16} />
            <span>All Promo (50%)</span>
          </button>
          <button
            onClick={() => pricingService.setAllModelsToNormal()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            <RefreshCw size={16} />
            <span>All Normal (100%)</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h4 className="text-white font-semibold mb-3">Quick Preset Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              imageModels.forEach(model => pricingService.setModelCustomMarkup(model, 25));
            }}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
          >
            Images: Super Promo (25%)
          </button>
          <button
            onClick={() => {
              imageModels.forEach(model => pricingService.setModelCustomMarkup(model, 50));
            }}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
          >
            Images: Promo (50%)
          </button>
          <button
            onClick={() => {
              videoModels.forEach(model => pricingService.setModelCustomMarkup(model, 75));
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Videos: Premium (75%)
          </button>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-600">
              <th className="text-left py-3 px-4">Model</th>
              <th className="text-left py-3 px-4">Pricing Mode</th>
              <th className="text-left py-3 px-4">Current Setting</th>
              <th className="text-left py-3 px-4">Customer Price</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {imageModels.map(model => (
              <ModelPricingRow key={model} modelName={model} />
            ))}
            {videoModels.map(model => (
              <ModelPricingRow key={model} modelName={model} isVideo={true} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h5 className="text-white font-semibold mb-2">Pricing Modes:</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-400">
          <div><span className="text-green-400">🤖 Auto:</span> Smart pricing with 100% markup</div>
          <div><span className="text-yellow-400">🎛️ Custom Markup:</span> Set your own markup percentage</div>
          <div><span className="text-blue-400">🎯 Custom Price:</span> Fixed price in Thai Baht</div>
        </div>
      </div>
    </div>
  );
};

export default ModelPricingEditor;