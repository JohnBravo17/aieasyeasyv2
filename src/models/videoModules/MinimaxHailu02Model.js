// Minimax (Hailu 02) video model module
// UI label: "Minimax" (do NOT use the Hailu 02 name in the UI)
// Supports input frame images via `frameImages` array:
// [ { inputImage: "<uuid>", frame: "first" } ]

import BaseVideoModel from '../BaseVideoModel.js'

class MinimaxHailu02Model extends BaseVideoModel {
  constructor(runwareClient) {
    super({
      modelId: 'minimax:3@1',
      displayName: 'Minimax',
      provider: 'minimax',
      description: 'Minimax (Hailu 02) — text-to-video model supporting frameImages input (first frame)',
      credits: '~1 credit'
    })
    this.runware = runwareClient
    this.apiKey = import.meta.env.VITE_RUNWARE_API_KEY
    this.supportedAspectRatios = ['16:9', '1:1']
    this.supportsFrameImages = true
    this.defaultDuration = 6
  }

  getUIConfig() {
    return {
      displayName: this.displayName,
      description: this.description,
      supportedAspectRatios: this.supportedAspectRatios,
      supportsFrameImages: this.supportsFrameImages,
      defaultDuration: this.defaultDuration
    }
  }

  getProviderSettings() {
    // Provider-specific parameters documented for Hailu 02
    return {
      minimax: {
        promptOptimizer: true
      }
    }
  }

  async generate({ prompt, aspectRatio = '16:9', duration = null, frameImages = [], onStatusUpdate = null }) {
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
        providerSettings: this.getProviderSettings()
      }

      // Attach frameImages if provided and valid
      if (Array.isArray(frameImages) && frameImages.length > 0) {
        request.frameImages = frameImages.map(item => ({
          inputImage: item.inputImage,
          frame: item.frame || 'first'
        }))
      }

      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        onStatusUpdate('Sending request to Minimax model...')
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
      return await this.pollVideoStatus(taskUUID, { prompt, duration: usedDuration, aspectRatio }, onStatusUpdate)

    } catch (error) {
      console.error('[Minimax] Video generation error:', error)
      throw error
    }
  }

  async pollVideoStatus(taskUUID, params = {}, onStatusUpdate = null) {
    const maxAttempts = 30
    let attempts = 0
    
    console.log(`🔄 [Minimax Hailu 02] Starting video polling for taskUUID: ${taskUUID}`)
    
    while (attempts < maxAttempts) {
      attempts++
      console.log(`🔄 [Minimax Hailu 02] Polling attempt ${attempts}/${maxAttempts}`)
      
      if (onStatusUpdate) {
        onStatusUpdate(`Generating video... (${attempts}/${maxAttempts})`)
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
          console.warn(`⚠️ [Minimax Hailu 02] Poll attempt ${attempts} failed:`, pollResponse.status)
          await this.sleep(10000)
          continue
        }
        const pollData = await pollResponse.json()
        console.log(`📊 [Minimax Hailu 02] Poll ${attempts} result:`, pollData)
        
        if (pollData && pollData.data && Array.isArray(pollData.data)) {
          for (const item of pollData.data) {
            if (item.videoURL) {
              console.log('✅ [Minimax Hailu 02] Video ready! URL:', item.videoURL)
              if (onStatusUpdate) {
                onStatusUpdate('Video generated successfully!')
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
                onStatusUpdate('Video generated successfully!')
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
    return 'minimax-' + Math.random().toString(36).slice(2, 11)
  }

  getVideoDimensions(aspectRatio) {
    const dims = {
      '16:9': { width: 1366, height: 768 }, // as in Hailu 02 docs
      '1:1': { width: 768, height: 768 }
    }
    return dims[aspectRatio] || dims['16:9']
  }
}

export default MinimaxHailu02Model
