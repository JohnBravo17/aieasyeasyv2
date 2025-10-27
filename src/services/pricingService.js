// Pricing and Cost Tracking Service
// Tracks actual costs from Runware API and calculates customer charges with markup

class PricingService {
  constructor() {
    // Default markup rates
    this.DEFAULT_MARKUP_PERCENTAGE = 100 // Default: 100% markup
    this.PROMO_MARKUP_PERCENTAGE = 50 // Promo: 50% markup
    
    // Exchange rate USD to THB (Thai Baht)
    this.USD_TO_THB_RATE = 36 // Will be updated dynamically in production
    
    // Per-model pricing configuration
    this.modelPricingConfig = {
      // Image models
      'Nanobanana': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      'FLUX.1 [dev]': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      'FLUX.1.1 Pro': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      'FLUX.1 Kontext [pro]': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      'Seedream 4.0': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      'Sample Model': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      // Video models
      'Seedance 1.0 Lite': { mode: 'auto', customPriceTHB: null, customMarkup: null },
      'Minimax': { mode: 'auto', customPriceTHB: null, customMarkup: null }
    }
    
    // Initialize with basic cost history - use defaults for now
    this.costHistory = []
    this.firestoreLoaded = true // Start with true to use smart pricing immediately
    
    // Start with some sample cost data so pricing works immediately
    this.initializeSampleCosts()
    
    // Base pricing estimates (will be updated with actual costs)
    this.estimatedPricing = {
      // Image Models
      'bfl:3@1': { // FLUX.1 Kontext [pro]
        name: 'FLUX.1 Kontext [pro]',
        type: 'image',
        estimatedCost: {
          '1K': 0.10,
          '2K': 0.15,
          '4K': 0.25
        }
      },
      'bfl:2@1': { // FLUX.1.1 Pro
        name: 'FLUX.1.1 Pro',
        type: 'image',
        estimatedCost: {
          '1K': 0.08,
          '2K': 0.12,
          '4K': 0.20
        }
      },
      'runware:101@1': { // FLUX.1 [dev]
        name: 'FLUX.1 [dev]',
        type: 'image',
        estimatedCost: {
          '1K': 0.06,
          '2K': 0.09,
          '4K': 0.15
        }
      },
      'google:4@1': { // Nanobanana
        name: 'Nanobanana',
        type: 'image',
        estimatedCost: {
          '1K': 0.05,
          '2K': 0.08,
          '4K': 0.12
        }
      },
      'bytedance:5@0': { // Seedream 4.0
        name: 'Seedream 4.0',
        type: 'image',
        estimatedCost: {
          '1K': 0.12,
          '2K': 0.18,
          '4K': 0.30
        }
      },
      
      // Video Models
      'bytedance:1@1': { // Seedance 1.0 Lite
        name: 'Seedance 1.0 Lite',
        type: 'video',
        estimatedCost: {
          '2s': 0.50,
          '4s': 1.00,
          '6s': 1.50
        }
      }
    }
  }

  // Initialize with sample cost data for immediate functionality
  initializeSampleCosts() {
    // Add some sample cost data so smart pricing works immediately
    this.costHistory = [
      { model: 'Nanobanana', type: 'image', actualCost: 0.05, timestamp: new Date().toISOString() },
      { model: 'FLUX.1 [dev]', type: 'image', actualCost: 0.08, timestamp: new Date().toISOString() },
      { model: 'FLUX.1.1 Pro', type: 'image', actualCost: 0.12, timestamp: new Date().toISOString() },
      { model: 'Seedream 4.0', type: 'image', actualCost: 0.10, timestamp: new Date().toISOString() }
    ]
    console.log('💰 [PricingService] Initialized with sample cost data')
  }

  // Individual Model Pricing Controls
  setModelPricingMode(modelName, mode) {
    if (this.modelPricingConfig[modelName]) {
      this.modelPricingConfig[modelName].mode = mode
      console.log(`💲 [PricingService] ${modelName} pricing mode set to: ${mode}`)
      this.dispatchPricingUpdate()
    }
  }

  setModelCustomPrice(modelName, priceTHB) {
    if (this.modelPricingConfig[modelName]) {
      this.modelPricingConfig[modelName].customPriceTHB = priceTHB
      this.modelPricingConfig[modelName].mode = 'custom'
      console.log(`💲 [PricingService] ${modelName} custom price set to: ฿${priceTHB}`)
      this.dispatchPricingUpdate()
    }
  }

  setModelCustomMarkup(modelName, markup) {
    if (this.modelPricingConfig[modelName]) {
      this.modelPricingConfig[modelName].customMarkup = markup
      this.modelPricingConfig[modelName].mode = 'markup'
      console.log(`� [PricingService] ${modelName} custom markup set to: ${markup}%`)
      this.dispatchPricingUpdate()
    }
  }

  setAllModelsToPromo() {
    Object.keys(this.modelPricingConfig).forEach(modelName => {
      this.modelPricingConfig[modelName].mode = 'auto'
      this.modelPricingConfig[modelName].customMarkup = this.PROMO_MARKUP_PERCENTAGE
    })
    console.log('🎉 [PricingService] All models set to promotional pricing!')
    this.dispatchPricingUpdate()
  }

  setAllModelsToNormal() {
    Object.keys(this.modelPricingConfig).forEach(modelName => {
      this.modelPricingConfig[modelName].mode = 'auto'
      this.modelPricingConfig[modelName].customMarkup = null
    })
    console.log('� [PricingService] All models set to normal pricing!')
    this.dispatchPricingUpdate()
  }

  getModelPricingConfig(modelName) {
    return this.modelPricingConfig[modelName] || { mode: 'auto', customPriceTHB: null, customMarkup: null }
  }

  dispatchPricingUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pricingModeChanged', { 
        detail: { modelPricingConfig: this.modelPricingConfig } 
      }))
    }
  }

  getModelMarkupDisplay(modelName) {
    const config = this.getModelPricingConfig(modelName)
    if (config.mode === 'custom') {
      return `฿${config.customPriceTHB} 🎯 CUSTOM`
    } else if (config.mode === 'markup') {
      return `${config.customMarkup}% 🎛️ CUSTOM`
    } else {
      return `${this.DEFAULT_MARKUP_PERCENTAGE}% 🤖 AUTO`
    }
  }

  // Placeholder for future Firestore integration
  // (Removed complex async loading to fix startup issues)

  // Log a generation with its actual cost (simplified for now)
  async logGeneration(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      model: data.model,
      modelName: data.model, // Use the model name directly
      type: data.type, // 'image' or 'video'
      actualCost: data.actualCost,
      customerCharge: data.customerCharge,
      profit: data.customerCharge - data.actualCost,
      profitMargin: data.actualCost > 0 ? ((data.customerCharge - data.actualCost) / data.actualCost * 100).toFixed(2) + '%' : '0%',
      taskUUID: data.taskUUID
    }

    // Add to local cache for smart pricing
    this.costHistory.push(logEntry)
    
    // Keep only last 100 entries to avoid memory issues
    if (this.costHistory.length > 100) {
      this.costHistory = this.costHistory.slice(-100)
    }
    
    // Dispatch event for dashboard to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('costDataUpdated', { 
        detail: logEntry 
      }))
    }
    
    console.log('💰 Cost logged locally:', logEntry)
    return logEntry
  }

  // Calculate customer charge based on actual cost with per-model configuration
  calculateCustomerCharge(actualCost, type = 'image', modelName = null) {
    if (modelName && this.modelPricingConfig[modelName]) {
      const config = this.modelPricingConfig[modelName]
      
      if (config.mode === 'custom' && config.customPriceTHB) {
        // Custom fixed price in THB
        return config.customPriceTHB / this.USD_TO_THB_RATE
      } else if (config.mode === 'markup' && config.customMarkup !== null) {
        // Custom markup percentage
        const markupMultiplier = 1 + (config.customMarkup / 100)
        return parseFloat((actualCost * markupMultiplier).toFixed(4))
      }
    }
    
    // Default auto pricing with standard markup
    const markupMultiplier = 1 + (this.DEFAULT_MARKUP_PERCENTAGE / 100)
    return parseFloat((actualCost * markupMultiplier).toFixed(4))
  }

  // Calculate user prices with markup and currency conversion
  calculateUserPrice(runwareCost) {
    const currentMarkup = this.getCurrentMarkup()
    const markup = runwareCost * (currentMarkup / 100)
    const totalUSD = runwareCost + markup
    const totalTHB = totalUSD * this.USD_TO_THB_RATE
    
    return {
      runwareCost: runwareCost,
      markup: markup,
      totalUSD: parseFloat(totalUSD.toFixed(4)),
      totalTHB: Math.ceil(totalTHB), // Round up to nearest baht
      markupPercentage: currentMarkup,
      exchangeRate: this.USD_TO_THB_RATE,
      isPromoMode: this.isPromoMode
    }
  }

  // Get current exchange rate (placeholder for future API integration)
  getCurrentExchangeRate() {
    return this.USD_TO_THB_RATE
  }

  // Update exchange rate (for admin or API updates)
  updateExchangeRate(newRate) {
    this.USD_TO_THB_RATE = newRate
    console.log(`💱 Exchange rate updated: $1 USD = ${newRate} THB`)
  }

  // Get estimated price for a model and settings (before generation)
  getEstimatedPrice(model, settings = {}) {
    const modelData = this.estimatedPricing[model]
    if (!modelData) {
      return { estimated: 0, customerCharge: 0, type: 'unknown' }
    }

    let estimatedCost = 0
    
    if (modelData.type === 'image') {
      const quality = settings.imageQuality || '2K'
      estimatedCost = modelData.estimatedCost[quality] || modelData.estimatedCost['2K']
      
      // Multiply by sequential images
      if (settings.sequentialImages && settings.sequentialImages > 1) {
        estimatedCost *= settings.sequentialImages
      }
    } else if (modelData.type === 'video') {
      const duration = settings.duration || '4s'
      estimatedCost = modelData.estimatedCost[duration] || modelData.estimatedCost['4s']
    }

    const customerCharge = this.calculateCustomerCharge(estimatedCost, modelData.type)

    return {
      estimated: estimatedCost,
      customerCharge: customerCharge,
      type: modelData.type,
      modelName: modelData.name
    }
  }

  // Get average actual costs for a model and settings
  getAverageActualCost(model, settings = {}) {
    const relevantEntries = this.costHistory.filter(entry => {
      if (entry.model !== model) return false
      
      // For images, match quality and sequential count
      if (entry.type === 'image') {
        return entry.settings.imageQuality === (settings.imageQuality || '2K') &&
               entry.sequentialImages === (settings.sequentialImages || 1)
      }
      
      // For videos, match duration
      if (entry.type === 'video') {
        return entry.settings.duration === (settings.duration || '4s')
      }
      
      return true
    })

    if (relevantEntries.length === 0) {
      return this.getEstimatedPrice(model, settings)
    }

    const avgCost = relevantEntries.reduce((sum, entry) => sum + entry.actualCost, 0) / relevantEntries.length
    const modelData = this.estimatedPricing[model]
    const customerCharge = this.calculateCustomerCharge(avgCost, modelData?.type)

    return {
      estimated: parseFloat(avgCost.toFixed(4)),
      customerCharge: customerCharge,
      type: modelData?.type || 'unknown',
      modelName: modelData?.name || model,
      sampleSize: relevantEntries.length
    }
  }

  // Get pricing table for display
  getPricingTable() {
    const table = []

    Object.entries(this.estimatedPricing).forEach(([modelId, modelData]) => {
      if (modelData.type === 'image') {
        ['1K', '2K', '4K'].forEach(quality => {
          const pricing = this.getAverageActualCost(modelId, { imageQuality: quality })
          table.push({
            model: modelData.name,
            type: 'Image',
            setting: `${quality} Quality`,
            estimatedCost: pricing.estimated,
            customerCharge: pricing.customerCharge,
            profit: (pricing.customerCharge - pricing.estimated).toFixed(4),
            margin: this.IMAGE_MARKUP,
            sampleSize: pricing.sampleSize || 0
          })
        })
      } else if (modelData.type === 'video') {
        ['2s', '4s', '6s'].forEach(duration => {
          const pricing = this.getAverageActualCost(modelId, { duration })
          table.push({
            model: modelData.name,
            type: 'Video',
            setting: `${duration} Duration`,
            estimatedCost: pricing.estimated,
            customerCharge: pricing.customerCharge,
            profit: (pricing.customerCharge - pricing.estimated).toFixed(4),
            margin: this.VIDEO_MARKUP,
            sampleSize: pricing.sampleSize || 0
          })
        })
      }
    })

    return table
  }

  // Get cost statistics
  getCostStats() {
    if (this.costHistory.length === 0) {
      return {
        totalGenerations: 0,
        totalCost: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageProfit: 0
      }
    }

    const totalCost = this.costHistory.reduce((sum, entry) => sum + entry.actualCost, 0)
    const totalRevenue = this.costHistory.reduce((sum, entry) => sum + entry.customerCharge, 0)
    const totalProfit = totalRevenue - totalCost

    return {
      totalGenerations: this.costHistory.length,
      totalCost: parseFloat(totalCost.toFixed(4)),
      totalRevenue: parseFloat(totalRevenue.toFixed(4)),
      totalProfit: parseFloat(totalProfit.toFixed(4)),
      averageProfit: parseFloat((totalProfit / this.costHistory.length).toFixed(4)),
      profitMargin: ((totalProfit / totalCost) * 100).toFixed(2) + '%'
    }
  }

  // Export cost history for analysis
  exportCostHistory() {
    return {
      exportDate: new Date().toISOString(),
      totalEntries: this.costHistory.length,
      data: this.costHistory
    }
  }

  // Clear cost history (for testing)
  clearCostHistory() {
    this.costHistory = []
  }

  // Get comprehensive pricing table for admin dashboard
  getPricingTable() {
    const models = ['Nanobanana', 'FLUX.1 [dev]', 'FLUX.1.1 Pro', 'FLUX.1 Kontext [pro]', 'Seedream 4.0'];
    
    return models.map(modelName => {
      const smartPricing = this.getSmartImageCost(modelName, 1);
      
      return {
        model: modelName,
        type: 'Image',
        defaultCost: smartPricing.defaultUsed.toFixed(4),
        avgLoggedCost: smartPricing.averageLogged > 0 ? smartPricing.averageLogged.toFixed(4) : 'No data',
        finalCost: smartPricing.estimatedActualCost.toFixed(4),
        markup: this.getModelMarkupDisplay(modelName),
        customerChargeUSD: smartPricing.estimated.toFixed(4),
        customerChargeTHB: `฿${smartPricing.thb}`,
        profitUSD: (smartPricing.estimated - smartPricing.estimatedActualCost).toFixed(4),
        profitMargin: smartPricing.estimatedActualCost > 0 ? 
          `${((smartPricing.estimated - smartPricing.estimatedActualCost) / smartPricing.estimatedActualCost * 100).toFixed(1)}%` : 
          '0%',
        logCount: smartPricing.logCount,
        exchangeRate: this.USD_TO_THB_RATE
      };
    });
  }

  // Get video pricing table
  getVideoPricingTable() {
    const videoModels = ['Seedance 1.0 Lite', 'Minimax'];
    
    return videoModels.map(modelName => {
      const smartPricing = this.getSmartVideoCost(modelName, 5); // 5 second default
      
      return {
        model: modelName,
        type: 'Video (5s)',
        defaultCost: smartPricing.defaultUsed.toFixed(4),
        avgLoggedCost: smartPricing.averageLogged > 0 ? smartPricing.averageLogged.toFixed(4) : 'No data',
        finalCost: smartPricing.estimatedActualCost.toFixed(4),
        markup: this.getModelMarkupDisplay(modelName),
        customerChargeUSD: smartPricing.estimated.toFixed(4),
        customerChargeTHB: `฿${smartPricing.thb}`,
        profitUSD: (smartPricing.estimated - smartPricing.estimatedActualCost).toFixed(4),
        profitMargin: smartPricing.estimatedActualCost > 0 ? 
          `${((smartPricing.estimated - smartPricing.estimatedActualCost) / smartPricing.estimatedActualCost * 100).toFixed(1)}%` : 
          '0%',
        logCount: smartPricing.logCount,
        exchangeRate: this.USD_TO_THB_RATE
      };
    });
  }

  // Get smart pricing: (Default + Average of Logs) / 2
  getSmartImageCost(modelName, sequentialImages = 1) {
    // Default base costs per model (in USD) - always available
    const defaultCosts = {
      'Nanobanana': 0.05,
      'FLUX.1 [dev]': 0.08,
      'FLUX.1.1 Pro': 0.12,
      'FLUX.1 Kontext [pro]': 0.15,
      'Seedream 4.0': 0.10,
      'Sample Model': 0.05
    }

    const defaultCost = (defaultCosts[modelName] || 0.08) * sequentialImages
    
    // Get logged costs for this model (if Firestore is loaded)
    const loggedCosts = this.firestoreLoaded ? 
      this.costHistory
        .filter(entry => entry.model === modelName && entry.type === 'image')
        .map(entry => entry.actualCost) : []
    
    let finalCost
    if (loggedCosts.length > 0) {
      // Calculate: (Default + Average of Logs) / 2
      const averageLogCost = loggedCosts.reduce((sum, cost) => sum + cost, 0) / loggedCosts.length
      finalCost = (defaultCost + averageLogCost) / 2
    } else {
      // No logs yet or Firestore not loaded, use default
      finalCost = defaultCost
    }

    const customerCharge = this.calculateCustomerCharge(finalCost, 'image', modelName)
    
    return {
      estimatedActualCost: finalCost,
      estimated: customerCharge,
      thb: Math.ceil(customerCharge * this.USD_TO_THB_RATE),
      logCount: loggedCosts.length,
      defaultUsed: defaultCost,
      averageLogged: loggedCosts.length > 0 ? loggedCosts.reduce((sum, cost) => sum + cost, 0) / loggedCosts.length : 0,
      firestoreLoaded: this.firestoreLoaded
    }
  }

  getSmartVideoCost(modelName, duration = 5) {
    // Default base costs per model (in USD per second)
    const defaultCosts = {
      'Seedance 1.0 Lite': 0.08,
      'Minimax': 0.12,
      'Unknown Model': 0.10
    }

    const costPerSecond = defaultCosts[modelName] || 0.10
    const durationSeconds = typeof duration === 'string' ? parseInt(duration) : duration
    const defaultCost = costPerSecond * durationSeconds
    
    // Get logged costs for this model (if Firestore is loaded)
    const loggedCosts = this.firestoreLoaded ?
      this.costHistory
        .filter(entry => entry.model === modelName && entry.type === 'video')
        .map(entry => entry.actualCost) : []
    
    let finalCost
    if (loggedCosts.length > 0) {
      // Calculate: (Default + Average of Logs) / 2
      const averageLogCost = loggedCosts.reduce((sum, cost) => sum + cost, 0) / loggedCosts.length
      finalCost = (defaultCost + averageLogCost) / 2
    } else {
      // No logs yet or Firestore not loaded, use default
      finalCost = defaultCost
    }

    const customerCharge = this.calculateCustomerCharge(finalCost, 'video', modelName)
    
    return {
      estimatedActualCost: finalCost,
      estimated: customerCharge,
      thb: Math.ceil(customerCharge * this.USD_TO_THB_RATE),
      logCount: loggedCosts.length,
      defaultUsed: defaultCost,
      averageLogged: loggedCosts.length > 0 ? loggedCosts.reduce((sum, cost) => sum + cost, 0) / loggedCosts.length : 0,
      firestoreLoaded: this.firestoreLoaded
    }
  }
}

// Export singleton instance
const pricingService = new PricingService()
export default pricingService