import BaseImageModel from '../BaseImageModel.js'

class Flux1DevModel extends BaseImageModel {
  constructor(runwareClient) {
    super({
      modelId: 'runware:101@1',
      displayName: 'FLUX.1 [dev]',
      provider: 'Runware',
      description: 'High quality generation with development-grade features',
      credits: '~1 credit',
      features: [
        'high_quality',
        'development_features',
        'fast_generation'
      ],
      limitations: [
        'No reference image support',
        'Standard dimensions only'
      ]
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
  }

  getDimensions(aspectRatio, quality = '2K') {
    // Standard dimensions for FLUX 1 Dev (multiples of 64)
    const dimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1280, height: 768 },    // multiples of 64
      '9:16': { width: 768, height: 1280 },    // multiples of 64
      '4:3': { width: 1024, height: 768 },     // multiples of 64
      '3:4': { width: 768, height: 1024 },     // multiples of 64
      '21:9': { width: 1344, height: 576 },    // multiples of 64
      '3:2': { width: 1152, height: 768 },     // multiples of 64
      '2:3': { width: 768, height: 1152 }      // multiples of 64
    }
    return dimensions[aspectRatio] || dimensions['1:1']
  }

  getProviderSettings() {
    return {} // No special provider settings needed
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
      includeCost: true
    }

    console.log('🚀 [FLUX 1 Dev] Generating with request:', request)

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
      console.error('❌ [FLUX 1 Dev] HTTP Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('📥 [FLUX 1 Dev] Response:', result)

    // Handle errors in response
    if (result.errors?.length) {
      const error = result.errors[0]
      console.error('❌ [FLUX 1 Dev] API error:', error.error)
      throw new Error(`FLUX 1 Dev error: ${error.error}`)
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
    return ['1:1', '16:9', '9:16', '4:3', '3:4']
  }

  getEstimatedCost(params) {
    const baseCosts = { '1K': 0.06, '2K': 0.09, '4K': 0.15 }
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

export default Flux1DevModel