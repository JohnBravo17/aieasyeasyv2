// Example: Sample Image Model - Shows how easy it is to add new models
// This demonstrates the modular architecture in action

import BaseImageModel from '../BaseImageModel.js'

class SampleImageModel extends BaseImageModel {
  constructor(runwareClient) {
    super({
      modelId: 'sample:1@0',
      displayName: 'Sample Image Model',
      provider: 'sample',
      description: 'A sample model to demonstrate the modular architecture',
      credits: 0.001
    })
    this.runware = runwareClient
    this.maxDimensions = { width: 1024, height: 1024 }
    this.supportedAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4']
    this.supportsReferenceImages = false
    this.pricing = { baseCost: 0.001 }
  }

  async generate(params) {
    console.log('🎨 [Sample Model] Generating image with params:', params)
    
    // This is just a demo - would normally call the actual model
    return {
      imageURL: 'https://via.placeholder.com/512x512/FF6B6B/FFFFFF?text=Sample+Model',
      cost: this.pricing.baseCost,
      taskUUID: this.generateUUID(),
      model: this.modelId
    }
  }

  getDimensions(aspectRatio, quality) {
    const dimensions = {
      '1:1': { width: 512, height: 512 },
      '16:9': { width: 912, height: 512 },
      '9:16': { width: 512, height: 912 },
      '4:3': { width: 684, height: 512 },
      '3:4': { width: 512, height: 684 }
    }
    return dimensions[aspectRatio] || dimensions['1:1']
  }

  getProviderSettings(sequentialImages) {
    return {
      sample: {
        mode: 'demo',
        quality: 'standard'
      }
    }
  }

  generateUUID() {
    return 'sample-' + Math.random().toString(36).substr(2, 9)
  }
}

export default SampleImageModel