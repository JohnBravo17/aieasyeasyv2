import BaseImageModel from '../BaseImageModel.js'

class Seedream40Model extends BaseImageModel {
  constructor(runwareClient) {
    super({
      modelId: 'bytedance:5@0',
      displayName: 'Seedream 4.0',
      provider: 'ByteDance',
      description: 'Advanced image generation with sequential storytelling capabilities',
      credits: '~2 credits',
      features: [
        'sequential_generation',
        'reference_image',
        'storytelling',
        'high_quality'
      ],
      limitations: [
        'Higher cost per generation',
        'Longer processing time for sequential images'
      ]
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
  }

  getDimensions(aspectRatio, quality = '2K') {
    // Seedream 4.0 dimensions - must be multiples of 8, minimum 256px
    const baseDimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },  
      '9:16': { width: 768, height: 1344 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 }
    }
    
    const dimensions = baseDimensions[aspectRatio] || baseDimensions['1:1']
    
    // Ensure dimensions are multiples of 8
    return {
      width: Math.round(dimensions.width / 8) * 8,
      height: Math.round(dimensions.height / 8) * 8
    }
  }

  getProviderSettings(sequentialImages = 1) {
    return {
      bytedance: {
        maxSequentialImages: Math.min(sequentialImages || 1, 3)
      }
    }
  }

  async processReferenceImages(referenceImage, referenceImages = []) {
    if (!referenceImage) return null

    try {
      console.log('🖼️ [Seedream 4.0] Processing reference image for sequential generation')
      
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
          "Authorization": `Bearer ${this.apiKey}`,
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
        console.log('✅ [Seedream 4.0] Reference image uploaded:', uploadData.imageUUID)
        return [uploadData.imageUUID.toString()]
      }
      
      return null
    } catch (error) {
      console.error('❌ [Seedream 4.0] Reference image upload failed:', error)
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
      providerSettings: this.getProviderSettings(params.sequentialImages)
    }

    // Add reference image if provided
    const referenceImageUUIDs = await this.processReferenceImages(params.referenceImage, params.referenceImages)
    if (referenceImageUUIDs) {
      request.referenceImages = referenceImageUUIDs
    }

    console.log('🚀 [Seedream 4.0] Generating sequential images with request:', request)

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
      console.error('❌ [Seedream 4.0] HTTP Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('📥 [Seedream 4.0] Response:', result)

    // Handle errors in response
    if (result.errors?.length) {
      const error = result.errors[0]
      console.error('❌ [Seedream 4.0] API error:', error.error)
      throw new Error(`Seedream 4.0 error: ${error.error}`)
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
    const baseCosts = { '1K': 0.12, '2K': 0.18, '4K': 0.30 }
    const cost = baseCosts[params.imageQuality] || baseCosts['2K']
    return cost * (params.sequentialImages || 1)
  }

  // Override to show sequential generation support
  getUIConfig() {
    const config = super.getUIConfig()
    config.supportsSequentialGeneration = true
    config.maxSequentialImages = 4
    config.sequentialDescription = 'Generate multiple related images that tell a story or show progression'
    return config
  }

  // Helper method to convert File to base64
  // Automatically converts PNG to JPG for better API compatibility
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 [Seedream 4.0] Converting file:`, {
        name: file.name,
        type: file.type,
        size: file.size
      })

      // Check if PNG conversion is needed for better API compatibility
      const isPNG = file.type === 'image/png'
      
      if (isPNG) {
        console.log(`🔄 [Seedream 4.0] PNG detected - converting to JPG for better API compatibility`)
        this.convertPNGToJPG(file).then(resolve).catch(reject)
      } else {
        // Handle JPG and other formats with existing logic
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]
          console.log(`✅ [Seedream 4.0] Base64 conversion successful (${file.type})`)
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      }
    })
  }

  // Convert PNG to JPG using Canvas for better API compatibility
  convertPNGToJPG(file) {
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
          
          console.log(`✅ [Seedream 4.0] PNG→JPG conversion successful:`, {
            originalSize: (file.size / 1024).toFixed(1) + 'KB',
            convertedLength: base64Data.length,
            dimensions: `${img.width}×${img.height}`,
            quality: '92%'
          })
          
          resolve(base64Data)
        } catch (error) {
          console.error('❌ [Seedream 4.0] PNG→JPG conversion failed:', error)
          reject(new Error(`PNG to JPG conversion failed: ${error.message}`))
        }
      }
      
      img.onerror = (error) => {
        console.error('❌ [Seedream 4.0] Image load failed:', error)
        reject(new Error('Failed to load PNG image for conversion'))
      }
      
      // Load the PNG file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = (error) => {
        console.error('❌ [Seedream 4.0] FileReader failed:', error)
        reject(new Error('Failed to read PNG file'))
      }
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

export default Seedream40Model