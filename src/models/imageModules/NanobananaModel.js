import BaseImageModel from '../BaseImageModel.js'

class NanobananaModel extends BaseImageModel {
  constructor(runwareClient) {
    super({
      modelId: 'google:4@1',
      displayName: 'Nanobanana',
      provider: 'Google',
      description: 'Google\'s efficient image generation model with multiple reference image support',
      credits: '~1 credit',
      features: [
        'multiple_reference_images',
        'image_editing',
        'style_mixing',
        'efficient'
      ],
      limitations: [
        'Requires direct HTTP API calls',
        'Google-specific dimensions'
      ]
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
  }

  getDimensions(aspectRatio, quality = '2K') {
    // Google Nanobanana specific dimensions
    const dimensions = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '4:3': { width: 1184, height: 864 },
      '3:4': { width: 864, height: 1184 },
      '21:9': { width: 1536, height: 672 },
      '3:2': { width: 1344, height: 896 },
      '2:3': { width: 896, height: 1344 }
    }
    return dimensions[aspectRatio] || dimensions['1:1']
  }

  getProviderSettings() {
    return {
      google: {
        editMode: true
      }
    }
  }

  async processReferenceImages(referenceImage, referenceImages = []) {
    const allImages = []
    
    // Add single reference image if provided
    if (referenceImage) {
      allImages.push(referenceImage)
    }
    
    // Add multiple reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      allImages.push(...referenceImages)
    }

    if (allImages.length === 0) return null

    try {
      console.log(`🖼️ [Nanobanana] Processing ${allImages.length} reference image(s)`)
      console.log(`🔑 [Nanobanana] API Key status:`, this.apiKey ? 'Present' : 'Missing')
      
      const uploadPromises = allImages.map(async (image, index) => {
        console.log(`📤 [Nanobanana] Converting image ${index + 1} to base64...`)
        const imageBase64 = await this.fileToBase64(image)
        
        console.log(`📤 [Nanobanana] Uploading reference image ${index + 1}...`)
        
        const uploadRequest = {
          taskType: "imageUpload",
          taskUUID: this.generateUUID(),
          image: imageBase64
        }

        console.log(`🔍 [Nanobanana] Upload request for image ${index + 1}:`, {
          taskType: uploadRequest.taskType,
          taskUUID: uploadRequest.taskUUID,
          imageLength: imageBase64.length,
          imagePreview: imageBase64.substring(0, 50) + "..."
        })

        const response = await fetch("https://api.runware.ai/v1", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([uploadRequest])
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ [Nanobanana] Image ${index + 1} upload failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
          return null
        }

        const result = await response.json()
        const uploadData = result.data?.[0]
        
        if (uploadData?.imageUUID) {
          console.log(`✅ [Nanobanana] Image ${index + 1} uploaded:`, uploadData.imageUUID)
          return uploadData.imageUUID.toString()
        } else {
          console.warn(`⚠️ [Nanobanana] Image ${index + 1} upload failed`)
          return null
        }
      })
      
      const uploadedUUIDs = await Promise.all(uploadPromises)
      const validUUIDs = uploadedUUIDs.filter(uuid => uuid !== null)
      
      if (validUUIDs.length > 0) {
        console.log('✅ [Nanobanana] Reference image UUIDs:', validUUIDs)
        return validUUIDs
      }
      
      return null
    } catch (error) {
      console.error('❌ [Nanobanana] Reference image processing failed:', error)
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
      includeCost: true
    }

    // Add reference images if provided
    const referenceImageUUIDs = await this.processReferenceImages(params.referenceImage, params.referenceImages)
    if (referenceImageUUIDs) {
      request.referenceImages = referenceImageUUIDs
    }

    console.log('🚀 [Nanobanana] Generating with direct HTTP request:', request)

    // Use direct HTTP for Google models
    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([request])
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Nanobanana] HTTP Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('📥 [Nanobanana] Response:', result)

    // Handle errors in response
    if (result.errors?.length) {
      const error = result.errors[0]
      console.error('❌ [Nanobanana] API error:', error.error)
      throw new Error(`Nanobanana error: ${error.error}`)
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
    const baseCosts = { '1K': 0.05, '2K': 0.08, '4K': 0.12 }
    const cost = baseCosts[params.imageQuality] || baseCosts['2K']
    return cost * (params.sequentialImages || 1)
  }

  // Override to show multiple reference image support
  getUIConfig() {
    const config = super.getUIConfig()
    config.supportsMultipleImages = true
    config.maxReferenceImages = 10
    return config
  }

  // Helper method to convert File to base64
  // Automatically converts PNG to JPG for better API compatibility
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 [Nanobanana] Converting file:`, {
        name: file.name,
        type: file.type,
        size: file.size
      })

      // Check if PNG conversion is needed for better API compatibility
      const isPNG = file.type === 'image/png'
      
      if (isPNG) {
        console.log(`🔄 [Nanobanana] PNG detected - converting to JPG for better API compatibility`)
        this.convertPNGToJPG(file).then(resolve).catch(reject)
      } else {
        // Handle JPG and other formats with existing logic
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]
          console.log(`✅ [Nanobanana] Base64 conversion successful (${file.type})`)
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
          
          console.log(`✅ [Nanobanana] PNG→JPG conversion successful:`, {
            originalSize: (file.size / 1024).toFixed(1) + 'KB',
            convertedLength: base64Data.length,
            dimensions: `${img.width}×${img.height}`,
            quality: '92%'
          })
          
          resolve(base64Data)
        } catch (error) {
          console.error('❌ [Nanobanana] PNG→JPG conversion failed:', error)
          reject(new Error(`PNG to JPG conversion failed: ${error.message}`))
        }
      }
      
      img.onerror = (error) => {
        console.error('❌ [Nanobanana] Image load failed:', error)
        reject(new Error('Failed to load PNG image for conversion'))
      }
      
      // Load the PNG file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = (error) => {
        console.error('❌ [Nanobanana] FileReader failed:', error)
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

export default NanobananaModel