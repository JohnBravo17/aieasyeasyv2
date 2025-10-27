import BaseImageModel from '../BaseImageModel.js'

class FluxKontextProModel extends BaseImageModel {
  constructor(runwareClient) {
    super({
      modelId: 'bfl:3@1',
      displayName: 'FLUX.1 Kontext [pro]',
      provider: 'BFL',
      description: 'High-quality image generation with reference image support for iterative editing',
      credits: '~1 credit',
      features: [
        'reference_image',
        'high_quality',
        'iterative_editing',
        'professional_grade'
      ],
      limitations: [
        'Single reference image only',
        'Higher cost than base models'
      ]
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
  }

  getDimensions(aspectRatio, quality = '2K') {
    // BFL Kontext Pro specific supported dimensions from documentation
    const dimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1392, height: 752 },
      '9:16': { width: 752, height: 1392 },
      '4:3': { width: 1184, height: 880 },
      '3:4': { width: 880, height: 1184 },
      '21:9': { width: 1568, height: 672 },
      '3:2': { width: 1248, height: 832 },
      '2:3': { width: 832, height: 1248 }
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

  async processReferenceImages(referenceImage, referenceImages = []) {
    if (!referenceImage) return null

    try {
      console.log('🖼️ [FLUX Kontext Pro] Processing reference image')
      
      const imageBase64 = await this.fileToBase64(referenceImage)
      
      // Use direct HTTP for image upload
      const uploadRequest = {
        taskType: "imageUpload",
        taskUUID: this.generateUUID(),
        image: imageBase64
      }

      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_RUNWARE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([uploadRequest])
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      const uploadData = result.data?.[0]
      
      if (uploadData?.imageUUID) {
        console.log('✅ [FLUX Kontext Pro] Reference image uploaded:', uploadData.imageUUID)
        return [uploadData.imageUUID.toString()]
      }
      
      return null
    } catch (error) {
      console.error('❌ [FLUX Kontext Pro] Reference image upload failed:', error)
      return null
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

    // Add reference image if provided
    const referenceImageUUIDs = await this.processReferenceImages(params.referenceImage, params.referenceImages)
    if (referenceImageUUIDs) {
      request.referenceImages = referenceImageUUIDs
    }

    console.log('🚀 [FLUX Kontext Pro] Generating with request:', request)

    // Use direct HTTP request like Nanobanana
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
      console.error('❌ [FLUX Kontext Pro] HTTP Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('📥 [FLUX Kontext Pro] Response:', result)

    // Handle errors in response
    if (result.errors?.length) {
      const error = result.errors[0]
      console.error('❌ [FLUX Kontext Pro] API error:', error.error)
      throw new Error(`FLUX Kontext Pro error: ${error.error}`)
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
    const baseCosts = { '1K': 0.10, '2K': 0.15, '4K': 0.25 }
    const cost = baseCosts[params.imageQuality] || baseCosts['2K']
    return cost * (params.sequentialImages || 1)
  }

  // Helper method to convert File to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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

export default FluxKontextProModel