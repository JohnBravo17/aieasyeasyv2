// Base class for all image generation models
// Provides common interface and shared functionality
import pricingService from '../services/pricingService.js'

class BaseImageModel {
  constructor(config) {
    this.modelId = config.modelId
    this.displayName = config.displayName
    this.provider = config.provider
    this.description = config.description
    this.credits = config.credits
    this.features = config.features || []
    this.limitations = config.limitations || []
  }

  // Method that all image models must implement
  async generate(params) {
    throw new Error(`generate() method must be implemented by ${this.constructor.name}`)
  }

  // Method for getting model-specific dimensions
  getDimensions(aspectRatio, quality) {
    throw new Error(`getDimensions() method must be implemented by ${this.constructor.name}`)
  }

  // Method for getting provider-specific settings
  getProviderSettings(sequentialImages = 1) {
    // Default implementation - can be overridden
    return {}
  }

  // Method for processing reference images (if supported)
  async processReferenceImages(referenceImage, referenceImages = []) {
    // Default implementation - can be overridden
    return null
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
    return 0.1 // Default estimate
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
      supportsReferenceImage: this.supportsFeature('reference_image'),
      supportsMultipleImages: this.supportsFeature('multiple_reference_images'),
      supportsSequentialGeneration: this.supportsFeature('sequential_generation'),
      supportedQualities: this.getSupportedQualities(),
      supportedAspectRatios: this.getSupportedAspectRatios()
    }
  }

  // Method for getting supported quality levels
  getSupportedQualities() {
    return ['1K', '2K', '4K'] // Default - can be overridden
  }

  // Method for getting supported aspect ratios
  getSupportedAspectRatios() {
    return ['1:1', '16:9', '9:16', '4:3', '3:4'] // Default - can be overridden
  }

  // Utility method for converting File to base64 (supports all image formats)
  // Automatically converts PNG files to JPG for better API compatibility
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      // Validate file type first
      if (!file.type.startsWith('image/')) {
        reject(new Error(`Invalid file type: ${file.type}. Only image files are supported.`))
        return
      }

      console.log(`🔧 [Base64] Converting file:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2)
      })

      // Check if PNG conversion is needed for better API compatibility
      const isPNG = file.type === 'image/png'
      
      if (isPNG) {
        console.log(`🔄 [Base64] PNG detected - converting to JPG for better API compatibility`)
        this.convertPNGToJPG(file).then(resolve).catch(reject)
      } else {
        // Handle other formats normally
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          try {
            // Result format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
            const fullResult = reader.result
            const [header, base64Data] = fullResult.split(',')
            
            console.log(`✅ [Base64] Conversion successful:`, {
              mimeType: header,
              base64Length: base64Data.length,
              base64Preview: base64Data.substring(0, 50) + "..."
            })
            
            if (!base64Data || base64Data.length === 0) {
              reject(new Error('Base64 conversion resulted in empty data'))
              return
            }
            
            resolve(base64Data)
          } catch (error) {
            reject(new Error(`Base64 processing failed: ${error.message}`))
          }
        }
        reader.onerror = error => {
          console.error('❌ [Base64] FileReader error:', error)
          reject(new Error(`FileReader failed: ${error.message || 'Unknown error'}`))
        }
      }
    })
  }

  // Convert PNG to JPG using Canvas for better API compatibility
  async convertPNGToJPG(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      img.onload = () => {
        try {
          // Set canvas size to match image
          canvas.width = img.width
          canvas.height = img.height
          
          // Fill with white background (important for transparency)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // Draw the image on canvas
          ctx.drawImage(img, 0, 0)
          
          // Convert to JPG base64
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92) // 92% quality
          const base64Data = jpgDataUrl.split(',')[1]
          
          console.log(`✅ [PNG→JPG] Conversion successful:`, {
            originalSize: (file.size / 1024).toFixed(1) + 'KB',
            convertedLength: base64Data.length,
            dimensions: `${img.width}×${img.height}`,
            quality: '92%'
          })
          
          resolve(base64Data)
        } catch (error) {
          console.error('❌ [PNG→JPG] Canvas conversion failed:', error)
          reject(new Error(`PNG to JPG conversion failed: ${error.message}`))
        }
      }
      
      img.onerror = (error) => {
        console.error('❌ [PNG→JPG] Image load failed:', error)
        reject(new Error('Failed to load PNG image for conversion'))
      }
      
      // Load the PNG file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = (error) => {
        console.error('❌ [PNG→JPG] FileReader failed:', error)
        reject(new Error('Failed to read PNG file'))
      }
      reader.readAsDataURL(file)
    })
  }

  // Utility method for generating UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Method for logging generation results
  logGeneration(result, params) {
    console.log(`✅ [${this.displayName}] Generation completed:`, {
      modelId: this.modelId,
      cost: result.cost,
      taskUUID: result.taskUUID,
      settings: {
        quality: params.imageQuality,
        aspectRatio: params.aspectRatio,
        sequentialImages: params.sequentialImages
      }
    })

    // Send cost data to pricing service for dashboard tracking
    if (result.cost && result.cost.totalCost) {
      try {
        const actualCost = parseFloat(result.cost.totalCost)
        const customerCharge = pricingService.calculateCustomerCharge(actualCost, 'image')
        
        pricingService.logGeneration({
          model: this.modelId,
          type: 'image',
          settings: {
            imageQuality: params.imageQuality,
            aspectRatio: params.aspectRatio,
            sequentialImages: params.sequentialImages,
            outputFormat: params.outputFormat
          },
          actualCost: actualCost,
          customerCharge: customerCharge,
          taskUUID: result.taskUUID,
          prompt: params.prompt,
          hasReferenceImage: !!(params.referenceImage || (params.referenceImages && params.referenceImages.length > 0)),
          sequentialImages: params.sequentialImages || 1
        })
      } catch (error) {
        console.error('Error logging cost data:', error)
      }
    }
  }
}

export default BaseImageModel