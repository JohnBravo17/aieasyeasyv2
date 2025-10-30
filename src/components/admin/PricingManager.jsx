import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Plus, Trash2, DollarSign, Settings, Monitor } from 'lucide-react';
import './PricingManager.css';

const PricingManager = () => {
  const [pricingData, setPricingData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);

  // Initialize pricing data with all models and their settings
  useEffect(() => {
    initializePricingData();
  }, []);

  const initializePricingData = () => {
    const initialData = [
      // FLUX Models - Image Generation
      {
        id: 'flux-kontext-pro-1k',
        modelName: 'FLUX.1 Kontext [pro]',
        modelId: 'bfl:3@1',
        type: 'image',
        resolution: '1024x1024',
        ratio: '1:1',
        settings: { steps: 50, guidance: 7.5 },
        usdCost: 0.10,
        customerPrice: 4.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-kontext-pro-2k',
        modelName: 'FLUX.1 Kontext [pro]',
        modelId: 'bfl:3@1',
        type: 'image',
        resolution: '2048x2048',
        ratio: '1:1',
        settings: { steps: 50, guidance: 7.5 },
        usdCost: 0.15,
        customerPrice: 6.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-kontext-pro-4k',
        modelName: 'FLUX.1 Kontext [pro]',
        modelId: 'bfl:3@1',
        type: 'image',
        resolution: '4096x4096',
        ratio: '1:1',
        settings: { steps: 50, guidance: 7.5 },
        usdCost: 0.25,
        customerPrice: 10.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-kontext-pro-portrait',
        modelName: 'FLUX.1 Kontext [pro]',
        modelId: 'bfl:3@1',
        type: 'image',
        resolution: '1024x1536',
        ratio: '2:3',
        settings: { steps: 50, guidance: 7.5 },
        usdCost: 0.12,
        customerPrice: 4.50,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-kontext-pro-landscape',
        modelName: 'FLUX.1 Kontext [pro]',
        modelId: 'bfl:3@1',
        type: 'image',
        resolution: '1536x1024',
        ratio: '3:2',
        settings: { steps: 50, guidance: 7.5 },
        usdCost: 0.12,
        customerPrice: 4.50,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },

      // FLUX 1.1 Pro
      {
        id: 'flux-11-pro-1k',
        modelName: 'FLUX.1.1 Pro',
        modelId: 'bfl:2@1',
        type: 'image',
        resolution: '1024x1024',
        ratio: '1:1',
        settings: { steps: 40, guidance: 7.0 },
        usdCost: 0.08,
        customerPrice: 3.50,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-11-pro-2k',
        modelName: 'FLUX.1.1 Pro',
        modelId: 'bfl:2@1',
        type: 'image',
        resolution: '2048x2048',
        ratio: '1:1',
        settings: { steps: 40, guidance: 7.0 },
        usdCost: 0.12,
        customerPrice: 5.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-11-pro-portrait',
        modelName: 'FLUX.1.1 Pro',
        modelId: 'bfl:2@1',
        type: 'image',
        resolution: '1024x1536',
        ratio: '2:3',
        settings: { steps: 40, guidance: 7.0 },
        usdCost: 0.10,
        customerPrice: 4.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },

      // FLUX 1 Dev
      {
        id: 'flux-1-dev-1k',
        modelName: 'FLUX.1 [dev]',
        modelId: 'bfl:1@1',
        type: 'image',
        resolution: '1024x1024',
        ratio: '1:1',
        settings: { steps: 30, guidance: 6.0 },
        usdCost: 0.05,
        customerPrice: 2.50,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'flux-1-dev-2k',
        modelName: 'FLUX.1 [dev]',
        modelId: 'bfl:1@1',
        type: 'image',
        resolution: '2048x2048',
        ratio: '1:1',
        settings: { steps: 30, guidance: 6.0 },
        usdCost: 0.08,
        customerPrice: 3.50,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },

      // Nanobanana Model
      {
        id: 'nanobanana-1k',
        modelName: 'Nanobanana',
        modelId: 'nanobanana@1',
        type: 'image',
        resolution: '1024x1024',
        ratio: '1:1',
        settings: { steps: 25, guidance: 5.0, referenceImages: true },
        usdCost: 0.03,
        customerPrice: 2.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'nanobanana-portrait',
        modelName: 'Nanobanana',
        modelId: 'nanobanana@1',
        type: 'image',
        resolution: '1024x1536',
        ratio: '2:3',
        settings: { steps: 25, guidance: 5.0, referenceImages: true },
        usdCost: 0.04,
        customerPrice: 2.25,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },

      // Seedream 4.0
      {
        id: 'seedream-40-1k',
        modelName: 'Seedream 4.0',
        modelId: 'seedream@4',
        type: 'image',
        resolution: '1024x1024',
        ratio: '1:1',
        settings: { steps: 35, guidance: 6.5, referenceImages: true },
        usdCost: 0.06,
        customerPrice: 3.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'seedream-40-2k',
        modelName: 'Seedream 4.0',
        modelId: 'seedream@4',
        type: 'image',
        resolution: '2048x2048',
        ratio: '1:1',
        settings: { steps: 35, guidance: 6.5, referenceImages: true },
        usdCost: 0.09,
        customerPrice: 4.25,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },

      // Video Models
      {
        id: 'seedance-lite-720p',
        modelName: 'Seedance 1.0 Lite',
        modelId: 'seedance@1-lite',
        type: 'video',
        resolution: '720p',
        ratio: '16:9',
        settings: { duration: '3s', fps: 24 },
        usdCost: 0.50,
        customerPrice: 20.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'seedance-lite-1080p',
        modelName: 'Seedance 1.0 Lite',
        modelId: 'seedance@1-lite',
        type: 'video',
        resolution: '1080p',
        ratio: '16:9',
        settings: { duration: '3s', fps: 24 },
        usdCost: 0.75,
        customerPrice: 30.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'minimax-720p',
        modelName: 'Minimax Hailu',
        modelId: 'minimax@hailu',
        type: 'video',
        resolution: '720p',
        ratio: '16:9',
        settings: { duration: '6s', fps: 25 },
        usdCost: 1.00,
        customerPrice: 40.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'minimax-1080p',
        modelName: 'Minimax Hailu',
        modelId: 'minimax@hailu',
        type: 'video',
        resolution: '1080p',
        ratio: '16:9',
        settings: { duration: '6s', fps: 25 },
        usdCost: 1.50,
        customerPrice: 60.00,
        currency: 'THB',
        lastUpdated: new Date().toISOString()
      }
    ];

    setPricingData(initialData);
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleSave = (id) => {
    setPricingData(prev => prev.map(item => 
      item.id === id 
        ? { ...item, lastUpdated: new Date().toISOString() }
        : item
    ));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handlePriceChange = (id, newPrice) => {
    setPricingData(prev => prev.map(item => 
      item.id === id 
        ? { ...item, customerPrice: parseFloat(newPrice) || 0 }
        : item
    ));
  };

  const handleCostChange = (id, newCost) => {
    setPricingData(prev => prev.map(item => 
      item.id === id 
        ? { ...item, usdCost: parseFloat(newCost) || 0 }
        : item
    ));
  };

  const calculateMarkup = (cost, price) => {
    if (cost === 0) return 0;
    return ((price / 36 - cost) / cost * 100).toFixed(1); // Assuming 36 THB = 1 USD
  };

  const filteredData = pricingData.filter(item => {
    const matchesSearch = item.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.resolution.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const exportPricing = () => {
    const dataStr = JSON.stringify(pricingData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pricing-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="pricing-manager">
      <div className="pricing-header">
        <div className="header-left">
          <h2 className="pricing-title">
            <DollarSign className="title-icon" />
            Model Pricing Manager
          </h2>
          <p className="pricing-subtitle">
            Manage USD costs and customer pricing for all AI models and configurations
          </p>
        </div>
        <div className="header-actions">
          <button onClick={exportPricing} className="export-btn">
            Export Configuration
          </button>
        </div>
      </div>

      <div className="pricing-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search models or resolutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="image">Image Models</option>
            <option value="video">Video Models</option>
          </select>
        </div>

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Configurations:</span>
            <span className="stat-value">{filteredData.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Image Models:</span>
            <span className="stat-value">{filteredData.filter(i => i.type === 'image').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Video Models:</span>
            <span className="stat-value">{filteredData.filter(i => i.type === 'video').length}</span>
          </div>
        </div>
      </div>

      <div className="pricing-table-container">
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Type</th>
              <th>Resolution</th>
              <th>Ratio</th>
              <th>Settings</th>
              <th>USD Cost</th>
              <th>Customer Price (THB)</th>
              <th>Markup %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id} className={item.type === 'video' ? 'video-row' : 'image-row'}>
                <td className="model-cell">
                  <div className="model-info">
                    <span className="model-name">{item.modelName}</span>
                    <span className="model-id">{item.modelId}</span>
                  </div>
                </td>
                <td>
                  <span className={`type-badge ${item.type}`}>
                    {item.type === 'image' ? 'IMG' : 'VID'}
                  </span>
                </td>
                <td className="resolution-cell">
                  <Monitor size={16} />
                  {item.resolution}
                </td>
                <td>{item.ratio}</td>
                <td className="settings-cell">
                  <Settings size={14} />
                  <div className="settings-details">
                    {Object.entries(item.settings).map(([key, value]) => (
                      <span key={key} className="setting-item">
                        {key}: {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="cost-cell">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.usdCost}
                      onChange={(e) => handleCostChange(item.id, e.target.value)}
                      className="price-input"
                    />
                  ) : (
                    <span className="cost-value">${item.usdCost.toFixed(3)}</span>
                  )}
                </td>
                <td className="price-cell">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={item.customerPrice}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      className="price-input"
                    />
                  ) : (
                    <span className="price-value">฿{item.customerPrice.toFixed(2)}</span>
                  )}
                </td>
                <td className="markup-cell">
                  <span className={`markup-value ${calculateMarkup(item.usdCost, item.customerPrice) > 100 ? 'high-markup' : 'normal-markup'}`}>
                    {calculateMarkup(item.usdCost, item.customerPrice)}%
                  </span>
                </td>
                <td className="actions-cell">
                  {editingId === item.id ? (
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleSave(item.id)}
                        className="save-btn"
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                      <button 
                        onClick={handleCancel}
                        className="cancel-btn"
                        title="Cancel editing"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEdit(item.id)}
                      className="edit-btn"
                      title="Edit pricing"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pricing-footer">
        <p className="footer-note">
          * Markup percentage calculated based on 1 USD = 36 THB exchange rate
        </p>
        <p className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PricingManager;