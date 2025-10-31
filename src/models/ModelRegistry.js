// Model Registry - Central hub for managing all AI models
// Automatically loads and configures all available models
// Now integrates with UserService for multi-user support

import FluxKontextProModel from './imageModules/FluxKontextProModel.js'
import Flux11ProModel from './imageModules/Flux11ProModel.js'
import Flux1DevModel from './imageModules/Flux1DevModel.js'
import NanobananaModel from './imageModules/NanobananaModel.js'
import Seedream40Model from './imageModules/Seedream40Model.js'
import SampleImageModel from './imageModules/SampleImageModel.js'

import Seedance1LiteModel from './videoModules/Seedance1LiteModel.js'
import MinimaxHailu02Model from './videoModules/MinimaxHailu02Model.js'
import VeoFastModel from './videoModules/VeoFastModel.js'

// Import services for multi-user support
import userService from '../services/userService.js'
import pricingService from '../services/pricingService.js'

class ModelRegistry {
  // Sanitize object to remove File objects that Firebase can't serialize
  sanitizeForFirestore(obj) {
    if (!obj || typeof obj !== 'object') return obj
    
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip File objects and any reference image properties
      if (value instanceof File) {
        console.log(`🧹 [Sanitize] Removed File object from key: ${key}`)
        continue // Skip File objects entirely
      } else if (key.toLowerCase().includes('reference') && key.toLowerCase().includes('image')) {
        console.log(`🧹 [Sanitize] Removed reference image property: ${key}`)
        continue // Skip any reference image properties
      } else if (Array.isArray(value)) {
        // Filter out File objects from arrays
        const cleanArray = value.filter(item => {
          if (item instanceof File) {
            console.log(`🧹 [Sanitize] Removed File object from array: ${key}`)
            return false
          }
          return true
        })
        if (cleanArray.length > 0) {
          sanitized[key] = cleanArray.map(item => this.sanitizeForFirestore(item))
        }
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        // Recursively sanitize nested objects
        const cleanObj = this.sanitizeForFirestore(value)
        if (Object.keys(cleanObj).length > 0) {
          sanitized[key] = cleanObj
        }
      } else {
        // Keep primitive values (strings, numbers, booleans, etc.)
        sanitized[key] = value
      }
    }
    return sanitized
  }

  constructor(runwareClient) {
    this.runware = runwareClient
    this.imageModels = new Map()
    this.videoModels = new Map()
    this.modelConfigs = new Map()
    
    this.initializeModels()
  }

  initializeModels() {
    console.log('🔧 Initializing model registry...')
    
    // Initialize Image Models
    this.registerImageModel('FLUX.1 Kontext [pro]', new FluxKontextProModel(this.runware))
    this.registerImageModel('FLUX.1.1 Pro', new Flux11ProModel(this.runware))
    this.registerImageModel('FLUX.1 [dev]', new Flux1DevModel(this.runware))
    this.registerImageModel('Nanobanana', new NanobananaModel(this.runware))
    this.registerImageModel('Seedream 4.0', new Seedream40Model(this.runware))
    this.registerImageModel('Sample Model', new SampleImageModel(this.runware))
    
  // Initialize Video Models
  this.registerVideoModel('Seedance 1.0 Lite', new Seedance1LiteModel(this.runware))
  // Minimax (Hailu 02) — registered under the UI name 'Minimax'
  this.registerVideoModel('Minimax', new MinimaxHailu02Model(this.runware))
  // Veo Fast — Google's text-to-video and image-to-video model with audio support
  this.registerVideoModel('Veo Fast', new VeoFastModel(this.runware))
    
    console.log(`✅ Model registry initialized with ${this.imageModels.size} image models and ${this.videoModels.size} video models`)
  }

  registerImageModel(uiName, modelInstance) {
    this.imageModels.set(uiName, modelInstance)
    this.modelConfigs.set(uiName, {
      type: 'image',
      modelId: modelInstance.modelId,
      displayName: modelInstance.displayName,
      provider: modelInstance.provider,
      config: modelInstance.getUIConfig()
    })
    console.log(`📝 Registered image model: ${uiName} (${modelInstance.modelId})`)
  }

  registerVideoModel(uiName, modelInstance) {
    this.videoModels.set(uiName, modelInstance)
    this.modelConfigs.set(uiName, {
      type: 'video',
      modelId: modelInstance.modelId,
      displayName: modelInstance.displayName,
      provider: modelInstance.provider,
      config: modelInstance.getUIConfig()
    })
    console.log(`📝 Registered video model: ${uiName} (${modelInstance.modelId})`)
  }

  // Get model instance by UI name
  getImageModel(uiName) {
    const model = this.imageModels.get(uiName)
    if (!model) {
      throw new Error(`Image model '${uiName}' not found in registry`)
    }
    return model
  }

  getVideoModel(uiName) {
    const model = this.videoModels.get(uiName)
    if (!model) {
      throw new Error(`Video model '${uiName}' not found in registry`)
    }
    return model
  }

  // Get model configuration for UI
  getModelConfig(uiName) {
    return this.modelConfigs.get(uiName)
  }

  // Get all available models for UI dropdowns
  getAvailableImageModels() {
    return Array.from(this.imageModels.keys()).map(uiName => {
      const config = this.modelConfigs.get(uiName)
      return {
        label: `${config.displayName} - ${config.provider} - ${config.config.credits}`,
        value: uiName,
        modelId: config.modelId,
        provider: config.provider,
        features: config.config
      }
    })
  }

  getAvailableVideoModels() {
    return Array.from(this.videoModels.keys()).map(uiName => {
      const config = this.modelConfigs.get(uiName)
      return {
        label: `${config.displayName} - ${config.provider} - ${config.config.credits}`,
        value: uiName,
        modelId: config.modelId,
        provider: config.provider,
        features: config.config
      }
    })
  }

  // Get model ID for API calls (backward compatibility)
  getModelId(uiName, type = 'image') {
    const config = this.modelConfigs.get(uiName)
    if (!config) {
      console.warn(`⚠️ Model '${uiName}' not found in registry, using fallback`)
      // Fallback to old mapping for backward compatibility
      return this.legacyModelMapping(uiName, type)
    }
    return config.modelId
  }

  // Legacy model mapping for backward compatibility
  legacyModelMapping(uiModelName, type) {
    const imageModels = {
      'FLUX.1 Kontext [pro]': 'bfl:3@1',
      'FLUX.1.1 Pro': 'bfl:2@1', 
      'FLUX.1 [dev]': 'runware:101@1',
      'Nanobanana': 'google:4@1',
      'Seedream 4.0': 'bytedance:5@0'
    }
    
    const videoModels = {
      'Seedance 1.0 Lite': 'bytedance:1@1'
    }
    
    return type === 'video' ? videoModels[uiModelName] : imageModels[uiModelName]
  }

  // Generate image using appropriate model (with UserService integration)
  async generateImage(uiModelName, params) {
    const model = this.getImageModel(uiModelName)
    console.log(`🎨 [Registry] Generating image with ${uiModelName}`)
    
    try {
      // Generate the image
      const result = await model.generate(params)
      
      // If successful and user is logged in, log to UserService
      console.log('🔍 [ModelRegistry] Checking UserService integration:', {
        hasResult: !!result,
        hasCurrentUser: !!userService.currentUser,
        userServiceStatus: userService.currentUser ? 'authenticated' : 'not authenticated'
      })
      
      if (result && userService.currentUser) {
        // Sanitize settings to remove ALL File objects for Firebase
        const sanitizedSettings = this.sanitizeForFirestore(params)

        // Debug: Check what cost data we received
        console.log('💰 [Debug] Result cost data:', {
          actualCost: result.actualCost,
          customerCharge: result.customerCharge,
          customerChargeThb: result.customerChargeThb,
          resultType: typeof result,
          isArray: Array.isArray(result)
        })

        // Force smart pricing if no cost data in result
        let finalActualCost = result.actualCost || 0
        let finalCustomerCharge = result.customerCharge || 0

        if (!finalCustomerCharge || finalCustomerCharge === 0) {
          console.log('🔧 [Fix] No customer charge found, calculating smart pricing...')
          const smartPricing = await import('../services/pricingService.js')
          const pricing = smartPricing.default.getSmartImageCost(uiModelName, 1)
          finalActualCost = pricing.estimatedActualCost
          finalCustomerCharge = pricing.estimated
          console.log('🔧 [Fixed] Smart pricing applied:', pricing)
        }

        const generationData = {
          type: 'image',
          model: uiModelName,
          modelId: this.getModelId(uiModelName, 'image'),
          prompt: params.prompt,
          settings: sanitizedSettings,
          actualCost: finalActualCost,
          customerCharge: finalCustomerCharge,
          outputURL: result.imageURL || result.url,
          taskUUID: result.taskUUID,
          timestamp: new Date().toISOString()
        }
        
        console.log('💾 [ModelRegistry] Logging generation data:', generationData)
        await userService.logGeneration(generationData)
        console.log('✅ [ModelRegistry] Image generation logged to user profile')
      } else {
        console.warn('⚠️ [ModelRegistry] Generation not logged:', {
          hasResult: !!result,
          hasUser: !!userService.currentUser,
          reason: !result ? 'No result' : 'No authenticated user'
        })
      }
      
      return result
    } catch (error) {
      console.error('❌ Image generation failed:', error)
      
      // Enhanced error detection and user-friendly messages
      const userFriendlyError = this.detectAndFormatError(error, uiModelName)
      throw new Error(userFriendlyError)
    }
  }

  // Generate video using appropriate model (with UserService integration)
  async generateVideo(uiModelName, params, onStatusUpdate) {
    const model = this.getVideoModel(uiModelName)
    console.log(`🎬 [Registry] Generating video with ${uiModelName}`)
    
    try {
      // Generate the video
      const result = await model.generate(params, onStatusUpdate)
      
      // If successful and user is logged in, log to UserService
      if (result && userService.currentUser) {
        // Sanitize settings to remove ALL File objects for Firebase
        const sanitizedSettings = this.sanitizeForFirestore(params)

        const generationData = {
          type: 'video',
          model: uiModelName,
          modelId: this.getModelId(uiModelName, 'video'),
          prompt: params.prompt,
          settings: sanitizedSettings,
          actualCost: result.actualCost || 0,
          customerCharge: result.customerCharge || 0,
          outputURL: result.videoURL || result.url,
          taskUUID: result.taskUUID,
          timestamp: new Date().toISOString(),
          duration: params.duration || '4s'
        }
        
        await userService.logGeneration(generationData)
        console.log('💾 Video generation logged to user profile')
      }
      
      return result
    } catch (error) {
      console.error('❌ Video generation failed:', error)
      
      // Enhanced error detection and user-friendly messages
      const userFriendlyError = this.detectAndFormatError(error, uiModelName)
      throw new Error(userFriendlyError)
    }
  }

  // Get estimated cost for a model and parameters
  getEstimatedCost(uiModelName, params, type = 'image') {
    try {
      if (type === 'image') {
        const model = this.getImageModel(uiModelName)
        return model.getEstimatedCost(params)
      } else {
        const model = this.getVideoModel(uiModelName)
        return model.getEstimatedCost(params)
      }
    } catch (error) {
      console.warn(`⚠️ Could not get estimated cost for ${uiModelName}:`, error.message)
      return type === 'video' ? 1.0 : 0.1 // Fallback estimates
    }
  }

  // Get supported aspect ratios for a model
  getSupportedAspectRatios(uiModelName, type = 'image') {
    try {
      if (type === 'image') {
        const model = this.getImageModel(uiModelName)
        return model.getSupportedAspectRatios()
      } else {
        const model = this.getVideoModel(uiModelName)
        return model.getSupportedAspectRatios()
      }
    } catch (error) {
      console.warn(`⚠️ Could not get aspect ratios for ${uiModelName}:`, error.message)
      return ['1:1', '16:9', '9:16', '4:3', '3:4'] // Fallback
    }
  }

  // Add a new model dynamically (for future expansion)
  addImageModel(uiName, modelClass, config) {
    const modelInstance = new modelClass(this.runware, config)
    this.registerImageModel(uiName, modelInstance)
    console.log(`🆕 Dynamically added image model: ${uiName}`)
  }

  // Add video model dynamically
  addVideoModel(uiName, modelClass, config) {
    const modelInstance = new modelClass(this.runware, config)
    this.registerVideoModel(uiName, modelInstance)
    console.log(`🆕 Dynamically added video model: ${uiName}`)
  }

  // Get all models for admin dashboard
  getAllModelsStats() {
    return {
      imageModels: Array.from(this.imageModels.keys()).map(name => ({
        name,
        type: 'image',
        config: this.modelConfigs.get(name)
      })),
      videoModels: Array.from(this.videoModels.keys()).map(name => ({
        name,
        type: 'video', 
        config: this.modelConfigs.get(name)
      })),
      totalModels: this.imageModels.size + this.videoModels.size
    }
  }

  addVideoModel(uiName, modelClass, config) {
    const modelInstance = new modelClass(this.runware, config)
    this.registerVideoModel(uiName, modelInstance)
    console.log(`🆕 Dynamically added video model: ${uiName}`)
  }

  // Remove a model (for testing/maintenance)
  removeModel(uiName) {
    const removed = this.imageModels.delete(uiName) || this.videoModels.delete(uiName)
    this.modelConfigs.delete(uiName)
    if (removed) {
      console.log(`🗑️ Removed model: ${uiName}`)
    }
    return removed
  }

  // Get registry statistics
  getStats() {
    return {
      totalModels: this.imageModels.size + this.videoModels.size,
      imageModels: this.imageModels.size,
      videoModels: this.videoModels.size,
      providers: [...new Set(Array.from(this.modelConfigs.values()).map(c => c.provider))],
      modelsWithReferenceImages: Array.from(this.imageModels.values()).filter(m => m.supportsFeature('reference_image')).length,
      modelsWithSequentialGeneration: Array.from(this.imageModels.values()).filter(m => m.supportsFeature('sequential_generation')).length
    }
  }

  // Intelligent error detection and user-friendly message formatting
  detectAndFormatError(error, modelName) {
    const errorMessage = error.message || error.toString()
    const errorLower = errorMessage.toLowerCase()
    
    console.log('🔍 [Error Detection] Analyzing error:', {
      model: modelName,
      error: errorMessage,
      type: error.name || 'Unknown'
    })

    // Server/API Issues (HTTP 500, 502, 503, 504)
    if (errorLower.includes('500') || errorLower.includes('internal server error')) {
      console.log('🔴 [Error Detection] Server error detected')
      return `⚠️ The AI servers are currently experiencing issues. Please try again in a few minutes. If the problem persists, the service provider may be performing maintenance.`
    }

    if (errorLower.includes('502') || errorLower.includes('bad gateway')) {
      console.log('🔴 [Error Detection] Gateway error detected')
      return `⚠️ Connection to AI servers failed. The service may be temporarily unavailable. Please try again shortly.`
    }

    if (errorLower.includes('503') || errorLower.includes('service unavailable')) {
      console.log('🔴 [Error Detection] Service unavailable detected')
      return `⚠️ AI service is temporarily unavailable. Please wait a few minutes and try again.`
    }

    if (errorLower.includes('504') || errorLower.includes('gateway timeout')) {
      console.log('🔴 [Error Detection] Timeout error detected')
      return `⚠️ Request timed out. The AI servers may be overloaded. Please try again in a moment.`
    }

    // Network/Connection Issues
    if (errorLower.includes('websocket') || errorLower.includes('connection') || 
        errorLower.includes('network') || errorLower.includes('fetch')) {
      console.log('🔴 [Error Detection] Connection error detected')
      return `🌐 Connection problem detected. Please check your internet connection and try again. The AI service may also be temporarily down.`
    }

    // Authentication Issues
    if (errorLower.includes('unauthorized') || errorLower.includes('401') || 
        errorLower.includes('forbidden') || errorLower.includes('403')) {
      console.log('🔴 [Error Detection] Auth error detected')
      return `🔑 Authentication issue. Please refresh the page and log in again.`
    }

    // Rate Limiting
    if (errorLower.includes('rate limit') || errorLower.includes('429') || 
        errorLower.includes('too many requests')) {
      console.log('🔴 [Error Detection] Rate limit detected')
      return `⏱️ Too many requests. Please wait a moment before trying again.`
    }

    // API Quota/Credits Issues
    if (errorLower.includes('quota') || errorLower.includes('credit') || 
        errorLower.includes('insufficient') || errorLower.includes('balance')) {
      console.log('🔴 [Error Detection] Quota/credit error detected')
      return `💳 Insufficient credits or quota exceeded. Please check your account balance.`
    }

    // Image Upload Issues
    if (errorLower.includes('upload') || errorLower.includes('image') && errorLower.includes('400')) {
      console.log('🔴 [Error Detection] Upload error detected')
      return `📸 Image upload failed. Please try a different image or check the file format (JPG/PNG supported).`
    }

    // Model-Specific Issues
    if (errorLower.includes('model') && errorLower.includes('unavailable')) {
      console.log('🔴 [Error Detection] Model unavailable detected')
      return `🤖 The ${modelName} model is currently unavailable. Please try a different model or wait a few minutes.`
    }

    // Generic API Errors with "unknown error" message
    if (errorLower.includes('unknown error while reading results') || 
        errorLower.includes('contact support at support@runware.ai')) {
      console.log('🔴 [Error Detection] Generic API error detected')
      return `⚠️ The AI service is experiencing technical difficulties. Please try again in a few minutes. If the issue continues, the service provider may be performing maintenance.`
    }

    // Timeout Issues
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      console.log('🔴 [Error Detection] Timeout detected')
      return `⏰ Request timed out. This usually happens when the AI servers are busy. Please try again in a moment.`
    }

    // Default: Return a user-friendly version of the original error
    console.log('🔴 [Error Detection] Unknown error type, using generic message')
    return `❌ Generation failed: ${errorMessage}. Please try again or contact support if the issue persists.`
  }
}

export default ModelRegistry