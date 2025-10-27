import BaseVideoModel from '../BaseVideoModel.js'

class Seedance1LiteModel extends BaseVideoModel {
  constructor(runwareClient) {
    super({
      modelId: 'bytedance:1@1',
      displayName: 'Seedance 1.0 Lite',
      provider: 'ByteDance',
      description: 'Fast video generation for quick content creation',
      credits: '~5 credits',
      features: [
        'async_generation',
        'fast_processing',
        'multiple_durations',
        'hd_quality',
        'frame_images'
      ],
      limitations: [
        'No reference video support',
        'Limited to 6 seconds maximum'
      ]
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
    this.supportsFrameImages = true
  }

  getUIConfig() {
    return {
      displayName: this.displayName,
      description: this.description,
      supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'],
      supportsFrameImages: this.supportsFrameImages,
      defaultDuration: 5
    }
  }

  getDimensions(aspectRatio) {
    // Use supported Seedance resolutions based on API documentation
    const dimensions = {
      '16:9': { width: 864, height: 480 },
      '9:16': { width: 480, height: 864 },
      '1:1': { width: 640, height: 640 },
      '4:3': { width: 736, height: 544 },
      '3:4': { width: 544, height: 736 },
      '21:9': { width: 960, height: 416 },
      '9:21': { width: 416, height: 960 }
    }
    return dimensions[aspectRatio] || dimensions['16:9']
  }

  getProviderSettings(duration) {
    return {
      bytedance: {
        cameraFixed: false
      }
    }
  }

  async generate(params, onStatusUpdate = null) {
    this.validateParams(params)

    const dimensions = this.getDimensions(params.aspectRatio)
    const request = {
      taskType: "videoInference",
      taskUUID: this.generateUUID(),
      positivePrompt: params.prompt,
      model: this.modelId,
      duration: params.duration,
      width: dimensions.width,
      height: dimensions.height,
      deliveryMethod: "async",
      outputType: "URL",
      outputFormat: "MP4",
      includeCost: true,
      providerSettings: this.getProviderSettings(params.duration)
    }

    // Add frameImages if provided
    if (params.frameImages && Array.isArray(params.frameImages) && params.frameImages.length > 0) {
      request.frameImages = params.frameImages.map(item => ({
        inputImage: item.inputImage,
        frame: item.frame || 'first'
      }))
      console.log('🖼️ [Seedance 1.0 Lite] Added frame images:', request.frameImages)
    }

    console.log('🚀 [Seedance 1.0 Lite] Starting video generation:', request)

    if (onStatusUpdate) {
      onStatusUpdate('Sending request to Runware API...')
    }

    let taskUUID = request.taskUUID
    try {
      // Use direct HTTP (skip SDK due to reliability issues)
      console.log('🔧 [Seedance 1.0 Lite] Using direct HTTP API for better reliability')
      if (onStatusUpdate) {
        onStatusUpdate('Using direct API connection...')
      }
      
      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([request]),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (Array.isArray(data) && data[0]?.taskUUID) {
        taskUUID = data[0].taskUUID
      } else if (data?.taskUUID) {
        taskUUID = data.taskUUID
      }

      if (onStatusUpdate) {
        onStatusUpdate('Request sent, waiting for video generation...')
      }

      // Always use our own HTTP polling to check for video result
      return await this.pollVideoStatus(taskUUID, onStatusUpdate)

    } catch (error) {
      console.error('❌ [Seedance 1.0 Lite] Generation failed:', error)
      throw error
    }
  }

  async pollWithSDK(taskUUID, onStatusUpdate = null) {
    const maxAttempts = 30
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++
      if (onStatusUpdate) {
        onStatusUpdate(`Checking video status... (${attempts}/${maxAttempts})`)
      }

      try {
        const status = await this.runware.getTaskStatus(taskUUID)
        if (status && status.videoURL) {
          if (onStatusUpdate) {
            onStatusUpdate('Video generated successfully!')
          }
          return status
        }
        await this.sleep(10000)
      } catch (error) {
        console.error(`SDK polling error:`, error)
        await this.sleep(10000)
      }
    }

    throw new Error('Video generation timed out')
  }

  async pollVideoStatus(taskUUID, onStatusUpdate = null) {
    const maxAttempts = 30 // 5 minutes max
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++
      console.log(`🔄 [Seedance 1.0 Lite] Polling attempt ${attempts}/${maxAttempts}`)

      if (onStatusUpdate) {
        onStatusUpdate(`Generating video... (${attempts}/${maxAttempts})`)
      }

      try {
        // Always use direct HTTP polling with getResponse
        const pollResponse = await fetch("https://api.runware.ai/v1", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{
            taskType: "getResponse",
            taskUUID: taskUUID
          }]),
        })

        if (!pollResponse.ok) {
          console.warn(`⚠️ [Seedance 1.0 Lite] Poll attempt ${attempts} failed:`, pollResponse.status)
          await this.sleep(10000) // Wait 10 seconds
          continue
        }

        const pollData = await pollResponse.json()
        console.log(`📊 [Seedance 1.0 Lite] Poll ${attempts} result:`, pollData)

        // Check for video completion
        if (pollData && pollData.data && Array.isArray(pollData.data)) {
          for (const item of pollData.data) {
            if (item.videoURL) {
              console.log('✅ [Seedance 1.0 Lite] Video ready! URL:', item.videoURL)
              if (onStatusUpdate) {
                onStatusUpdate('Video generated successfully!')
              }
              return item
            }
          }
        }

        // Also check if pollData is directly an array
        if (Array.isArray(pollData)) {
          for (const item of pollData) {
            if (item.videoURL) {
              console.log('✅ [Seedance 1.0 Lite] Video ready! URL:', item.videoURL)
              if (onStatusUpdate) {
                onStatusUpdate('Video generated successfully!')
              }
              return item
            }
          }
        }

      } catch (pollError) {
        console.error(`❌ [Seedance 1.0 Lite] Poll attempt ${attempts} error:`, pollError)
      }

      // Wait before next poll
      await this.sleep(10000) // 10 seconds
    }

    throw new Error('Video generation timed out after 5 minutes')
  }

  getSupportedDurations() {
    return [2, 4, 6]
  }

  getSupportedAspectRatios() {
    return ['16:9', '9:16', '1:1']
  }

  getMaxDuration() {
    return 6
  }

  getEstimatedCost(params) {
    const baseCosts = { 2: 0.50, 4: 1.00, 6: 1.50 }
    return baseCosts[params.duration] || baseCosts[4]
  }

  // Helper method for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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

export default Seedance1LiteModel