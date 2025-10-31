// Veo Fast video model module
// UI label: "Veo Fast"
// Supports input frame images via `frameImages` array and audio generation
// [ { inputImage: "<uuid>", frame: "first" } ]

import BaseVideoModel from '../BaseVideoModel.js'

class VeoFastModel extends BaseVideoModel {
  constructor(runwareClient) {
    super({
      modelId: 'google:3@1',
      displayName: 'Veo Fast',
      provider: 'google',
      description: 'Veo Fast — text-to-video and image-to-video model with optional audio generation',
      credits: '~1 credit'
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
    this.supportedAspectRatios = ['16:9', '9:16', '1:1']
    this.supportsFrameImages = true
    this.supportsAudio = true
    this.defaultDuration = 8
  }

  getUIConfig() {
    return {
      displayName: this.displayName,
      description: this.description,
      supportedAspectRatios: this.supportedAspectRatios,
      supportsFrameImages: this.supportsFrameImages,
      supportsAudio: this.supportsAudio,
      defaultDuration: this.defaultDuration
    }
  }

  getProviderSettings(generateAudio = true) {
    // Provider-specific parameters documented for Veo Fast
    return {
      google: {
        generateAudio: generateAudio
      }
    }
  }

  async generate({ prompt, aspectRatio = '16:9', duration = null, frameImages = [], generateAudio = true, onStatusUpdate = null }) {
    try {
      const usedDuration = duration || this.defaultDuration
      const dimensions = this.getVideoDimensions(aspectRatio)

      const request = {
        taskType: 'videoInference',
        taskUUID: this.generateUUID(),
        positivePrompt: prompt,
        model: this.modelId,
        duration: usedDuration,
        width: dimensions.width,
        height: dimensions.height,
        deliveryMethod: 'async',
        outputType: 'URL',
        outputFormat: 'MP4',
        includeCost: true,
        providerSettings: this.getProviderSettings(generateAudio)
      }

      // Attach frameImages if provided and valid
      if (Array.isArray(frameImages) && frameImages.length > 0) {
        request.frameImages = frameImages.map(item => ({
          inputImage: item.inputImage,
          frame: item.frame || 'first'
        }))
      }

      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        const audioStatus = generateAudio ? 'with audio' : 'without audio'
        onStatusUpdate(`Sending request to Veo Fast model ${audioStatus}...`)
      }

      let taskUUID = request.taskUUID
      // Use runware client if available
      if (this.runware && typeof this.runware.requestImages === 'function') {
        const res = await this.runware.requestImages(request)
        if (Array.isArray(res) && res[0]?.taskUUID) {
          taskUUID = res[0].taskUUID
        } else if (res?.taskUUID) {
          taskUUID = res.taskUUID
        }
      } else {
        // Fallback to direct HTTP
        const response = await fetch("https://api.runware.ai/v1", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([request])
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`HTTP ${response.status}: ${text}`)
        }

        const data = await response.json()
        if (Array.isArray(data) && data[0]?.taskUUID) {
          taskUUID = data[0].taskUUID
        } else if (data?.taskUUID) {
          taskUUID = data.taskUUID
        }
      }

      // Poll for video result  
      return await this.pollVideoStatus(taskUUID, { prompt, duration: usedDuration, aspectRatio, generateAudio }, onStatusUpdate)

    } catch (error) {
      console.error('[Veo Fast] Video generation error:', error)
      throw error
    }
  }

  async pollVideoStatus(taskUUID, params = {}, onStatusUpdate = null) {
    const maxAttempts = 30
    let attempts = 0
    
    console.log(`🔄 [Veo Fast] Starting video polling for taskUUID: ${taskUUID}`)
    
    while (attempts < maxAttempts) {
      attempts++
      console.log(`🔄 [Veo Fast] Polling attempt ${attempts}/${maxAttempts}`)
      
      if (onStatusUpdate) {
        const audioStatus = params.generateAudio ? 'with audio' : 'without audio'
        onStatusUpdate(`Generating video ${audioStatus}... (${attempts}/${maxAttempts})`)
      }
      try {
        const pollResponse = await fetch('https://api.runware.ai/v1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            taskType: 'getResponse',
            taskUUID: taskUUID
          }])
        })
        if (!pollResponse.ok) {
          console.warn(`⚠️ [Veo Fast] Poll attempt ${attempts} failed:`, pollResponse.status)
          await this.sleep(10000)
          continue
        }
        const pollData = await pollResponse.json()
        console.log(`📊 [Veo Fast] Poll ${attempts} result:`, pollData)
        
        if (pollData && pollData.data && Array.isArray(pollData.data)) {
          for (const item of pollData.data) {
            if (item.videoURL) {
              console.log('✅ [Veo Fast] Video ready! URL:', item.videoURL)
              if (onStatusUpdate) {
                const audioStatus = params.generateAudio ? 'with audio' : 'without audio'
                onStatusUpdate(`Video generated successfully ${audioStatus}!`)
              }
              
              // Log generation for pricing dashboard
              this.logGeneration(item, params)
              
              return item
            }
          }
        }
        if (Array.isArray(pollData)) {
          for (const item of pollData) {
            if (item.videoURL) {
              if (onStatusUpdate) {
                const audioStatus = params.generateAudio ? 'with audio' : 'without audio'
                onStatusUpdate(`Video generated successfully ${audioStatus}!`)
              }
              return item
            }
          }
        }
      } catch (e) {
        // ignore and retry
      }
      await this.sleep(10000)
    }
    throw new Error('Video generation timed out after 5 minutes')
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Utility helpers
  generateUUID() {
    return 'veo-fast-' + Math.random().toString(36).slice(2, 11)
  }

  getVideoDimensions(aspectRatio) {
    const dims = {
      '16:9': { width: 1280, height: 720 }, // as per Veo Fast specs
      '9:16': { width: 720, height: 1280 }, // portrait mode
      '1:1': { width: 1080, height: 1080 }  // square format
    }
    return dims[aspectRatio] || dims['16:9']
  }
}

export default VeoFastModel