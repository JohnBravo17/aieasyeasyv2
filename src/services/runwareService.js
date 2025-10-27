import { Runware } from '@runware/sdk-js'
import pricingService from './pricingService.js'

class RunwareService {
  constructor() {
    if (!import.meta.env.VITE_RUNWARE_API_KEY) {
      console.error('❌ VITE_RUNWARE_API_KEY is not set in environment variables')
      return
    }

    try {
      this.runware = new Runware({
        apiKey: import.meta.env.VITE_RUNWARE_API_KEY
      })
      
      // Ensure connection is established
      this.initializeConnection()
    } catch (error) {
      console.error('❌ Failed to initialize Runware client:', error)
    }
  }

  async initializeConnection() {
    try {
      if (this.runware && this.runware.requestImages) {
        // Connection ready
      }
    } catch (error) {
      console.error('❌ Failed to establish WebSocket connection:', error)
    }
  }

  async generateImage(prompt, model = 'civitai:4384', aspectRatio = '1:1', sequentialImages = 1, referenceImage = null, imageQuality = '2K', referenceImages = []) {
    try {
      if (!this.runware) {
        throw new Error('Runware client not initialized. Check your API key.')
      }

      // Get dimensions based on aspect ratio, quality, and model
      let dimensions
      if (model === 'bfl:3@1') {
        // FLUX.1 Kontext [pro] specific dimensions
        dimensions = this.getImageDimensions(aspectRatio, 'BFL_KONTEXT')
      } else if (model === 'bfl:2@1') {
        // FLUX.1.1 Pro specific dimensions
        dimensions = this.getImageDimensions(aspectRatio, 'BFL_PRO')
      } else if (model === 'google:4@1') {
        // Google Nanobanana specific dimensions
        dimensions = this.getImageDimensions(aspectRatio, 'NANOBANANA')
      } else {
        dimensions = this.getImageDimensions(aspectRatio, imageQuality)
      }

      // Upload reference images if provided
      let processedReferenceImages = []
      if (referenceImages && referenceImages.length > 0) {
        for (const refImg of referenceImages) {
          try {
            const uuid = await this.uploadImage(refImg.file)
            processedReferenceImages.push({ uuid })
          } catch (uploadError) {
            console.error('❌ Failed to upload reference image:', uploadError)
          }
        }
      }

      const generationParams = {
        positivePrompt: prompt,
        model: model,
        numberResults: sequentialImages,
        height: dimensions.height,
        width: dimensions.width,
        outputType: 'URL',
        outputFormat: 'JPG',
        includeCost: true,
        useCache: false,
        ...(processedReferenceImages.length > 0 && { referenceImages: processedReferenceImages }),
        ...this.getProviderSettings(model, sequentialImages)
      }

      // For Google Nanobanana, use direct HTTP request
      if (model === 'google:4@1') {
        return await this.generateNanobananaImage(generationParams)
      }

      const images = await this.runware.requestImages(generationParams)
      
      if (!images || images.length === 0) {
        throw new Error('No images generated')
      }

      // Log cost information for the first result and get cost data
      const costInfo = this.logImageGenerationCost(images[0], generationParams, model) // Pass model name

      // Add cost information to the first result for ModelRegistry
      if (images[0] && costInfo) {
        images[0].actualCost = costInfo.actualCost
        images[0].customerCharge = costInfo.customerCharge
        images[0].customerChargeThb = costInfo.customerChargeThb
        
        console.log('💰 [Cost Attached] Model:', model, 'Customer Charge:', costInfo.customerCharge, 'THB:', costInfo.customerChargeThb)
      }

      return images
    } catch (error) {
      console.error('Image generation failed:', error)
      throw error
    }
  }

  async generateNanobananaImage(generationParams) {
    try {
      // Filter parameters for Google Nanobanana API - only include supported ones
      const nanobananaParams = {
        taskType: "imageInference",
        taskUUID: this.generateUUID(),
        positivePrompt: generationParams.positivePrompt,
        model: generationParams.model,
        height: generationParams.height,
        width: generationParams.width,
        outputType: generationParams.outputType || 'URL',
        outputFormat: generationParams.outputFormat || 'JPG'
      }

      // Add reference images if they exist
      if (generationParams.referenceImages && generationParams.referenceImages.length > 0) {
        nanobananaParams.referenceImages = generationParams.referenceImages
      }

      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_RUNWARE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nanobananaParams)
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const result = await response.json()

      // Handle errors in response
      if (result.errors?.length) {
        const error = result.errors[0]
        console.error('❌ [Nano Banana] API error:', error.error)
        throw new Error(`Nano Banana error: ${error.error}`)
      }

      // Extract image data
      const imageData = result.data?.[0]
      if (!imageData?.imageURL) {
        throw new Error('No image URL found in response: ' + JSON.stringify(result))
      }

      // Log cost information and get cost data  
      const costInfo = this.logImageGenerationCost(imageData, generationParams, 'Nanobanana') // Pass model name

      // Add cost information to result for ModelRegistry
      if (costInfo) {
        imageData.actualCost = costInfo.actualCost
        imageData.customerCharge = costInfo.customerCharge
        imageData.customerChargeThb = costInfo.customerChargeThb
        
        console.log('💰 [Nanobanana Cost Attached] Customer Charge:', costInfo.customerCharge, 'THB:', costInfo.customerChargeThb)
      }

      return [imageData]

    } catch (error) {
      console.error('❌ [Nano Banana] Direct HTTP request failed:', error)
      throw error
    }
  }

  // Convert File to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  async uploadImage(imageFile) {
    try {
      if (!imageFile) {
        throw new Error('No image file provided')
      }

      // Convert to base64
      const base64String = await this.fileToBase64(imageFile)
      
      try {
        // Try SDK upload first
        const uuid = await this.runware.requestImageUpload({
          image: base64String,
          outputType: 'UUID'
        })
        
        if (uuid) {
          return uuid
        }
      } catch (sdkError) {
        // SDK failed, try HTTP request
        const response = await fetch("https://api.runware.ai/v1", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_RUNWARE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{
            taskType: "imageUpload",
            taskUUID: this.generateUUID(),
            image: base64String,
            outputType: "UUID"
          }])
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`HTTP ${response.status}: ${text}`)
        }

        const result = await response.json()
        
        if (result.errors?.length) {
          throw new Error(result.errors[0].error || 'Upload failed')
        }

        const uuid = result.data?.[0]?.imageUUID
        if (!uuid) {
          throw new Error('No UUID returned from upload')
        }

        return uuid
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      throw error
    }
  }

  async generateVideo(prompt, model = 'runware:100', aspectRatio = '16:9', duration = 5, onStatusUpdate = null) {
    try {
      if (!this.runware) {
        throw new Error('Runware client not initialized. Check your API key.')
      }

      // Get video dimensions
      const dimensions = this.getVideoDimensions(aspectRatio, model)

      // Create video generation request
      const request = {
        taskType: 'videoInference',
        taskUUID: this.generateUUID(),
        modelId: this.getModelId(model, 'video'),
        prompt: prompt,
        duration: duration,
        width: dimensions.width,
        height: dimensions.height,
        outputType: 'URL',
        outputFormat: 'MP4',
        includeCost: true
      }

      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        onStatusUpdate('Starting video generation...')
      }

      // Step 1: Send initial request
      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_RUNWARE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([request]),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = await response.json()

      // Handle errors in initial response
      if (data.errors && data.errors.length) {
        throw new Error(data.errors[0].error || 'Unknown provider error')
      }

      // Get task UUID for polling
      const taskUUID = data.data?.[0]?.taskUUID || request.taskUUID

      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        onStatusUpdate('Video generation started, polling for completion...')
      }

      // Step 2: Poll for completion
      const maxAttempts = 30 // 5 minutes max
      let attempts = 0

      while (attempts < maxAttempts) {
        attempts++

        if (onStatusUpdate && typeof onStatusUpdate === 'function') {
          onStatusUpdate(`Generating video... (${attempts}/${maxAttempts})`)
        }

        try {
          const pollResponse = await fetch("https://api.runware.ai/v1", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${import.meta.env.VITE_RUNWARE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([{
              taskType: "getResponse",
              taskUUID: taskUUID
            }]),
          })

          if (!pollResponse.ok) {
            await this.sleep(10000) // Wait 10 seconds before retry
            continue
          }

          const pollData = await pollResponse.json()

          // Check for the correct response structure: { "data": [{ "taskUUID": "uuid-here" }] }
          if (pollData && pollData.data && Array.isArray(pollData.data)) {
            for (const item of pollData.data) {
              if (item.videoURL) {
                if (onStatusUpdate && typeof onStatusUpdate === 'function') {
                  onStatusUpdate('Video generated successfully!')
                }
                
                // Log video generation cost and get cost data
                const costInfo = this.logVideoGenerationCost(item, {
                  model,
                  prompt,
                  duration,
                  aspectRatio,
                  dimensions
                })

                // Add cost information to result for ModelRegistry
                if (costInfo) {
                  item.actualCost = costInfo.actualCost
                  item.customerCharge = costInfo.customerCharge
                  item.customerChargeThb = costInfo.customerChargeThb
                }

                return item
              }
            }
          }

          await this.sleep(10000) // Wait 10 seconds before next poll

        } catch (pollError) {
          await this.sleep(10000) // Wait before retry
        }
      }

      throw new Error(`Video generation timed out after ${maxAttempts} attempts`)

    } catch (error) {
      console.error('Video generation failed:', error)
      throw error
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  getModelId(uiModelName, type = 'image') {
    const modelMappings = {
      // Video models
      'Seedance 1.0 Lite': 'bytedance:1@1',
      'Minimax': 'minimax:01',
      
      // Image models
      'FLUX.1 Kontext [pro]': 'bfl:3@1',
      'FLUX.1.1 Pro': 'bfl:2@1',
      'FLUX.1 Dev': 'bfl:1@1',
      'Nano Banana': 'google:4@1',
      'Seedream 4.0 (SDXL)': 'civitai:4384'
    }
    
    return modelMappings[uiModelName] || uiModelName
  }

  getProviderSettings(model, sequentialImages = 1) {
    const settings = {}
    
    if (model === 'bfl:3@1') {
      // FLUX.1 Kontext [pro] settings
      settings.BFL = {
        guidanceScale: 3.5,
        safetyTolerance: 2,
        seed: Math.floor(Math.random() * 4294967295),
        steps: 25
      }
    } else if (model === 'bfl:2@1') {
      // FLUX.1.1 Pro settings
      settings.BFL = {
        guidanceScale: 3.5,
        safetyTolerance: 2,
        seed: Math.floor(Math.random() * 4294967295),
        steps: 25
      }
    }
    
    return settings
  }

  getImageDimensions(aspectRatio, quality = '2K') {
    if (quality === 'BFL_KONTEXT') {
      // FLUX.1 Kontext [pro] supported dimensions
      const dimensions = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1344, height: 768 },
        '9:16': { width: 768, height: 1344 },
        '4:3': { width: 1152, height: 896 },
        '3:4': { width: 896, height: 1152 },
        '3:2': { width: 1216, height: 832 },
        '2:3': { width: 832, height: 1216 }
      }
      return dimensions[aspectRatio] || dimensions['1:1']
    }
    
    if (quality === 'BFL_PRO') {
      // FLUX.1.1 Pro supported dimensions
      const dimensions = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1344, height: 768 },
        '9:16': { width: 768, height: 1344 },
        '4:3': { width: 1152, height: 896 },
        '3:4': { width: 896, height: 1152 },
        '3:2': { width: 1216, height: 832 },
        '2:3': { width: 832, height: 1216 }
      }
      return dimensions[aspectRatio] || dimensions['1:1']
    }
    
    if (quality === 'NANOBANANA') {
      // Google Nanobanana supported dimensions
      const dimensions = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1792, height: 1024 },
        '9:16': { width: 1024, height: 1792 },
        '4:3': { width: 1536, height: 1152 },
        '3:4': { width: 1152, height: 1536 },
        '3:2': { width: 1216, height: 832 },
        '2:3': { width: 832, height: 1216 }
      }
      return dimensions[aspectRatio] || dimensions['1:1']
    }

    // Default dimensions for other models
    const baseDimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '4:3': { width: 1152, height: 896 },
      '3:4': { width: 896, height: 1152 },
      '3:2': { width: 1216, height: 832 },
      '2:3': { width: 832, height: 1216 }
    }

    const multipliers = {
      'HD': 0.75,
      '2K': 1.0,
      '4K': 1.5
    }

    const baseSize = baseDimensions[aspectRatio] || baseDimensions['1:1']
    const multiplier = multipliers[quality] || 1.0

    return {
      width: Math.round(baseSize.width * multiplier),
      height: Math.round(baseSize.height * multiplier)
    }
  }

  getVideoDimensions(aspectRatio, model = 'runware:100') {
    // Default video dimensions
    const dimensions = {
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 720, height: 1280 },
      '1:1': { width: 720, height: 720 },
      '4:3': { width: 960, height: 720 },
      '3:4': { width: 720, height: 960 }
    }

    return dimensions[aspectRatio] || dimensions['16:9']
  }

  logImageGenerationCost(result, params, uiModelName = null) {
    try {
      const modelName = uiModelName || params.model || 'Unknown Model'
      
      // Check if we have actual cost from API
      // Always get smart pricing (Default + Logs average)
      const smartPricing = pricingService.getSmartImageCost(modelName, params.numberResults || 1)
      
      if (result?.cost?.totalCost) {
        // API returned actual cost - add to system cost logs for future calculations
        const actualCost = parseFloat(result.cost.totalCost)
        
        // Log real API cost to Firestore system database (async, don't await)
        pricingService.logGeneration({
          model: modelName,
          type: 'image',
          actualCost: actualCost,
          customerCharge: smartPricing.estimated,
          taskUUID: result.taskUUID,
          timestamp: new Date().toISOString()
        }).catch(error => {
          console.warn('Failed to log cost to system database:', error)
        })
        
        // Log real cost data for future smart pricing
        if (process.env.NODE_ENV === 'development') {
          console.log(`💰 [Real API Cost] Model: ${modelName}, API: $${actualCost}, Smart: $${smartPricing.estimated}, Baht: ฿${smartPricing.thb} (Logs: ${smartPricing.logCount})`)
        }

        return {
          actualCost,
          customerCharge: smartPricing.estimated, // Use smart pricing for consistency
          customerChargeThb: smartPricing.thb
        }
      } else {
        // No cost data from API - use smart pricing (default + logs)
        if (process.env.NODE_ENV === 'development') {
          console.log(`💰 [Smart Pricing] Model: ${modelName}, Default: $${smartPricing.defaultUsed}, Avg Logs: $${smartPricing.averageLogged}, Final: $${smartPricing.estimated}, Baht: ฿${smartPricing.thb} (${smartPricing.logCount} logs)`)
        }

        return {
          actualCost: smartPricing.estimatedActualCost,
          customerCharge: smartPricing.estimated,
          customerChargeThb: smartPricing.thb
        }
      }

    } catch (error) {
      console.warn('Cost logging failed:', error)
      // Even on error, use smart pricing - never return 0
      const smartPricing = pricingService.getSmartImageCost('Unknown Model', 1)
      return {
        actualCost: smartPricing.estimatedActualCost,
        customerCharge: smartPricing.estimated,
        customerChargeThb: smartPricing.thb
      }
    }
  }

  logVideoGenerationCost(result, params) {
    try {
      const modelName = params.model || 'Unknown Model'
      
      // Always get smart pricing (Default + Logs average)
      const smartPricing = pricingService.getSmartVideoCost(modelName, params.duration || 5)
      
      if (result?.cost?.totalCost) {
        // API returned actual cost - add to logs for future calculations
        const actualCost = parseFloat(result.cost.totalCost)
        
        // Log real cost data for future smart pricing
        if (process.env.NODE_ENV === 'development') {
          console.log(`💰 [Real Video API Cost] Model: ${modelName}, API: $${actualCost}, Smart: $${smartPricing.estimated}, Baht: ฿${smartPricing.thb} (Logs: ${smartPricing.logCount})`)
        }

        return {
          actualCost,
          customerCharge: smartPricing.estimated, // Use smart pricing for consistency
          customerChargeThb: smartPricing.thb
        }
      } else {
        // No cost data from API - use smart pricing (default + logs)
        if (process.env.NODE_ENV === 'development') {
          console.log(`💰 [Smart Video Pricing] Model: ${modelName}, Default: $${smartPricing.defaultUsed}, Avg Logs: $${smartPricing.averageLogged}, Final: $${smartPricing.estimated}, Baht: ฿${smartPricing.thb} (${smartPricing.logCount} logs)`)
        }

        return {
          actualCost: smartPricing.estimatedActualCost,
          customerCharge: smartPricing.estimated,
          customerChargeThb: smartPricing.thb
        }
      }

    } catch (error) {
      console.warn('Video cost logging failed:', error)
      // Even on error, use smart pricing - never return 0
      const smartPricing = pricingService.getSmartVideoCost('Unknown Model', 5)
      return {
        actualCost: smartPricing.estimatedActualCost,
        customerCharge: smartPricing.estimated,
        customerChargeThb: smartPricing.thb
      }
    }
  }
}

export default new RunwareService()