import BaseImageModel from '../BaseImageModel.js'

class Flux11ProModel extends BaseImageModel {
  constructor(runwareClient) {
    super({
      modelId: 'bfl:2@1',
      displayName: 'FLUX.1.1 Pro',
      provider: 'BFL',
      description: 'Latest FLUX model with improved quality and faster generation',
      credits: '~1 credit',
      features: [
        'high_quality',
        'fast_generation',
        'professional_grade',
        'sequential_generation'
      ],
      limitations: [
        'No reference image support',
        'Premium pricing'
      ]
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
  }

  getDimensions(aspectRatio, quality = '2K') {
    // BFL FLUX.1.1 Pro dimensions (256-1440 pixels, multiples of 64)
    const dimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },   // 16:9 ratio, multiples of 64
      '9:16': { width: 768, height: 1344 },   // 9:16 ratio, multiples of 64  
      '4:3': { width: 1280, height: 960 },    // 4:3 ratio, multiples of 64
      '3:4': { width: 960, height: 1280 },    // 3:4 ratio, multiples of 64
      '21:9': { width: 1344, height: 576 },   // 21:9 ratio, multiples of 64
      '3:2': { width: 1280, height: 832 },    // 3:2 ratio, multiples of 64
      '2:3': { width: 832, height: 1280 }     // 2:3 ratio, multiples of 64
    }
    return dimensions[aspectRatio] || dimensions['1:1']
  }

  getProviderSettings(sequentialImages = 1) {
    return {
      bfl: {
        raw: false,
        safety_tolerance: 2
      }
    }
  }

  async generate(params) {
    this.validateParams(params)

    const dimensions = this.getDimensions(params.aspectRatio, params.imageQuality)
    
    const request = {
      taskType: "imageInference",
      taskUUID: this.generateUUID(),
      positivePrompt: params.prompt,
      model: this.modelId,
      width: dimensions.width,
      height: dimensions.height,
      outputFormat: params.outputFormat || "JPG",
      includeCost: true,
      providerSettings: {
        bfl: {
          promptUpsampling: false,
          safetyTolerance: 2
        }
      }
    }

    console.log('🚀 [FLUX 1.1 Pro] Generating with request:', request)

    // Use direct HTTP request
    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_RUNWARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([request])
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [FLUX 1.1 Pro] HTTP Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('📥 [FLUX 1.1 Pro] Response:', result)

    // Handle errors in response
    if (result.errors?.length) {
      const error = result.errors[0]
      console.error('❌ [FLUX 1.1 Pro] API error:', error.error)
      throw new Error(`FLUX 1.1 Pro error: ${error.error}`)
    }

    // Extract image data
    const imageData = result.data?.[0]
    if (!imageData?.imageURL) {
      throw new Error('No image URL found in response: ' + JSON.stringify(result))
    }

    this.logGeneration(imageData, params)
    return imageData
  }

  getSupportedQualities() {
    return ['1K', '2K', '4K']
  }

  getSupportedAspectRatios() {
    return ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '3:2', '2:3']
  }

  getEstimatedCost(params) {
    const baseCosts = { '1K': 0.08, '2K': 0.12, '4K': 0.20 }
    const cost = baseCosts[params.imageQuality] || baseCosts['2K']
    return cost * (params.sequentialImages || 1)
  }

  // Helper method to generate UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

export default Flux11ProModel