// Base class for all video generation models
// Provides common interface and shared functionality
import pricingService from '../services/pricingService.js'

class BaseVideoModel {
  constructor(config) {
    this.modelId = config.modelId
    this.displayName = config.displayName
    this.provider = config.provider
    this.description = config.description
    this.credits = config.credits
    this.features = config.features || []
    this.limitations = config.limitations || []
  }

  // Method that all video models must implement
  async generate(params, onStatusUpdate = null) {
    throw new Error(`generate() method must be implemented by ${this.constructor.name}`)
  }

  // Method for getting model-specific dimensions
  getDimensions(aspectRatio) {
    throw new Error(`getDimensions() method must be implemented by ${this.constructor.name}`)
  }

  // Method for getting provider-specific settings
  getProviderSettings(duration) {
    // Default implementation - can be overridden
    return {}
  }

  // Method for validating parameters before generation
  validateParams(params) {
    if (!params.prompt || !params.prompt.trim()) {
      throw new Error('Prompt is required')
    }
    return true
  }

  // Method for calculating estimated cost
  getEstimatedCost(params) {
    // Default implementation - can be overridden by specific models
    return 1.0 // Default estimate
  }

  // Method for checking if model supports a feature
  supportsFeature(feature) {
    return this.features.includes(feature)
  }

  // Method for getting UI configuration
  getUIConfig() {
    return {
      displayName: this.displayName,
      description: this.description,
      credits: this.credits,
      supportsReferenceVideo: this.supportsFeature('reference_video'),
      supportedDurations: this.getSupportedDurations(),
      supportedAspectRatios: this.getSupportedAspectRatios(),
      maxDuration: this.getMaxDuration(),
      isAsync: this.supportsFeature('async_generation')
    }
  }

  // Method for getting supported durations
  getSupportedDurations() {
    return [2, 4, 6] // Default - can be overridden
  }

  // Method for getting supported aspect ratios
  getSupportedAspectRatios() {
    return ['16:9', '9:16', '1:1'] // Default - can be overridden
  }

  // Method for getting maximum duration
  getMaxDuration() {
    return 6 // Default - can be overridden
  }

  // Method for logging generation results
  logGeneration(result, params) {
    console.log(`✅ [${this.displayName}] Video generation completed:`, {
      modelId: this.modelId,
      cost: result.cost,
      taskUUID: result.taskUUID,
      settings: {
        duration: params.duration,
        aspectRatio: params.aspectRatio
      }
    })

    // Send cost data to pricing service for dashboard tracking
    if (result.cost && result.cost.totalCost) {
      try {
        const actualCost = parseFloat(result.cost.totalCost)
        const customerCharge = pricingService.calculateCustomerCharge(actualCost, 'video')
        
        pricingService.logGeneration({
          model: this.modelId,
          type: 'video',
          settings: {
            duration: params.duration,
            aspectRatio: params.aspectRatio
          },
          actualCost: actualCost,
          customerCharge: customerCharge,
          taskUUID: result.taskUUID,
          prompt: params.prompt,
          hasReferenceImage: false, // Videos don't typically use reference images
          sequentialImages: 1
        })
      } catch (error) {
        console.error('Error logging video cost data:', error)
      }
    }
  }

  // Method for polling video generation status (for async models)
  async pollVideoStatus(taskUUID, onStatusUpdate = null) {
    // Default implementation for async video generation
    throw new Error(`pollVideoStatus() method must be implemented by ${this.constructor.name} for async generation`)
  }
}

export default BaseVideoModel