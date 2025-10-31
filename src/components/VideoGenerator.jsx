import { useState, useEffect } from 'react'
import { Video, Download, Play, AlertCircle, Upload, X } from 'lucide-react'
import runwareService from '../services/runwareService'
import ModelRegistry from '../models/ModelRegistry'
import creditService from '../services/creditService'
import { useAuth } from '../contexts/AuthContext'

const VideoGenerator = () => {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('Seedance 1.0 Lite')
  const [duration, setDuration] = useState('5')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [generationStatus, setGenerationStatus] = useState('')
  const [frameImage, setFrameImage] = useState(null)
  const [frameImagePreview, setFrameImagePreview] = useState(null)
  const [creditBalance, setCreditBalance] = useState(0)
  const [generateAudio, setGenerateAudio] = useState(true)

  // Initialize ModelRegistry
  const [modelRegistry, setModelRegistry] = useState(null)
  
  useEffect(() => {
    const registry = new ModelRegistry(runwareService.runware)
    setModelRegistry(registry)
  }, [])

  // Load credit balance
  useEffect(() => {
    const loadCreditBalance = async () => {
      if (user) {
        try {
          const balance = await creditService.getCreditBalance()
          setCreditBalance(balance)
        } catch (error) {
          console.error('Failed to load credit balance:', error)
        }
      }
    }
    loadCreditBalance()
  }, [user])

  // Dynamic aspect ratios based on selected model
  const getAspectRatios = () => {
    if (model === 'Seedance 1.0 Lite') {
      return [
        { label: '16:9 (Landscape - 864×480)', value: '16:9' },
        { label: '9:16 (Portrait - 480×864)', value: '9:16' },
        { label: '1:1 (Square - 640×640)', value: '1:1' },
        { label: '4:3 (Traditional - 736×544)', value: '4:3' },
        { label: '3:4 (Portrait Traditional - 544×736)', value: '3:4' },
        { label: '21:9 (Ultrawide - 960×416)', value: '21:9' },
        { label: '9:21 (Vertical Ultrawide - 416×960)', value: '9:21' },
      ]
    } else if (model === 'Minimax') {
      return [
        { label: '16:9 (HD - 1366×768)', value: '16:9' },
        { label: '16:9 (Full HD - 1920×1080)', value: '16:9-fhd' },
        { label: '1:1 (Square - 512×512)', value: '1:1' },
      ]
    } else if (model === 'Veo Fast') {
      return [
        { label: '16:9 (HD - 1280×720)', value: '16:9' },
        { label: '9:16 (Portrait - 720×1280)', value: '9:16' },
        { label: '1:1 (Square - 1080×1080)', value: '1:1' },
      ]
    } else {
      // Default dimensions for other models
      return [
        { label: '16:9 (Landscape - 1280×720)', value: '16:9' },
        { label: '9:16 (Portrait - 720×1280)', value: '9:16' },
        { label: '1:1 (Square - 720×720)', value: '1:1' },
        { label: '4:3 (Traditional - 960×720)', value: '4:3' },
      ]
    }
  }

  const aspectRatios = getAspectRatios()

  const models = [
    { label: 'Seedance 1.0 Lite - Supports frame images', value: 'Seedance 1.0 Lite' },
    { label: 'Minimax - Supports frame images', value: 'Minimax' },
    { label: 'Veo Fast - Supports frame images & audio', value: 'Veo Fast' },
  ]

  // Check if current model supports frame images
  const supportsFrameImages = model === 'Minimax' || model === 'Seedance 1.0 Lite' || model === 'Veo Fast'
  
  // Check if current model supports audio generation
  const supportsAudio = model === 'Veo Fast'

  // Dynamic durations based on selected model
  const getDurations = () => {
    if (model === 'Minimax') {
      return [
        { label: '6 seconds', value: '6' },
        { label: '10 seconds', value: '10' },
      ]
    } else if (model === 'Seedance 1.0 Lite') {
      return [
        { label: '3 seconds', value: '3' },
        { label: '5 seconds (recommended)', value: '5' },
        { label: '10 seconds', value: '10' },
        { label: '15 seconds', value: '15' },
      ]
    } else if (model === 'Veo Fast') {
      return [
        { label: '8 seconds (recommended)', value: '8' },
      ]
    } else {
      // Default durations for other models
      return [
        { label: '3 seconds', value: '3' },
        { label: '5 seconds (recommended)', value: '5' },
        { label: '10 seconds', value: '10' },
        { label: '15 seconds', value: '15' },
      ]
    }
  }

  const durations = getDurations()

  // Handle model changes and validate duration
  useEffect(() => {
    const validDurations = getDurations().map(d => d.value)
    if (!validDurations.includes(duration)) {
      // Set to first valid duration for the model
      setDuration(validDurations[0])
    }
  }, [model])

  // Handle frame image upload
  const handleFrameImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setFrameImage(file)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setFrameImagePreview(previewUrl)
    }
  }

  // Remove frame image
  const removeFrameImage = () => {
    setFrameImage(null)
    if (frameImagePreview) {
      URL.revokeObjectURL(frameImagePreview)
      setFrameImagePreview(null)
    }
  }

  // Update generate function to handle frame images
  const handleGenerate = async () => {
    if (!prompt.trim() || !modelRegistry) return
    
    // Calculate credit cost for video generation (videos cost more than images)
    const creditCost = model === 'Seedance 1.0 Lite' ? 5 : model === 'Veo Fast' ? 45 : 10 // Lite = 5 credits, Veo Fast = 45 credits, Pro = 10 credits
    
    // Check if user has enough credits
    const currentBalance = await creditService.getCreditBalance()
    if (currentBalance < creditCost) {
      setError(`Insufficient credits. You need ${creditCost} credits but only have ${currentBalance}. Please purchase more credits.`)
      return
    }
    
    setIsGenerating(true)
    setError(null)
    setGenerationStatus('Initializing video generation...')
    
    try {
      // Handle frame image upload for both models
      let frameImageUUID = null
      if (supportsFrameImages && frameImage) {
        setGenerationStatus('Uploading frame image...')
        try {
          frameImageUUID = await runwareService.uploadImage(frameImage)
        } catch (uploadError) {
          setError(`Failed to upload frame image: ${uploadError.message || 'Unknown error'}. Continuing without it.`)
        }
      }
      
      setGenerationStatus('Sending request to AI model...')
      
      // Use the modular system
      const params = {
        prompt,
        aspectRatio,
        duration: parseInt(duration)
      }
      
      // Add frame images if available
      if (frameImageUUID) {
        params.frameImages = [{ inputImage: frameImageUUID, frame: 'first' }]
      }
      
      // Add audio generation parameter for Veo Fast
      if (supportsAudio) {
        params.generateAudio = generateAudio
      }
      
      const result = await modelRegistry.generateVideo(
        model,
        params,
        (status) => setGenerationStatus(status)
      )
      
      if (result && (result.videoURL || result.videoSrc || result.mediaURL)) {
        const videoUrl = result.videoURL || result.videoSrc || result.mediaURL
        setGeneratedVideo(videoUrl)
        setGenerationStatus('Video generated successfully!')
        
        // Deduct credits for successful video generation
        await creditService.deductCredits(creditCost, `Video generation: ${model}`)
        const newBalance = await creditService.getCreditBalance()
        setCreditBalance(newBalance)
        
      } else {
        throw new Error('No video URL found in response: ' + JSON.stringify(result))
      }
    } catch (err) {
      console.error('Video generation failed:', err)
      setError(err.message || 'Failed to generate video. Please try again.')
      setGenerationStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          AI Video Generator
        </h1>
        <p className="text-gray-400 text-lg">
          Create stunning videos using advanced AI models with frame image support
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Video Configuration</h3>
            
            {/* Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {models.map((modelOption) => (
                  <option key={modelOption.value} value={modelOption.value}>
                    {modelOption.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {durations.map((dur) => (
                  <option key={dur.value} value={dur.value}>
                    {dur.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Frame Image Upload (for supported models) */}
            {supportsFrameImages && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Frame Image (Optional)
                  <span className="text-gray-400 text-xs ml-2">
                    Upload an image to influence the video generation
                  </span>
                </label>
                
                {!frameImage ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="text-sm text-gray-400 mb-2">
                      Click to upload or drag and drop
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFrameImageUpload}
                      className="hidden"
                      id="frameImageUpload"
                    />
                    <label
                      htmlFor="frameImageUpload"
                      className="inline-flex items-center px-3 py-1 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={frameImagePreview}
                      alt="Frame preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeFrameImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                    <div className="text-xs text-gray-400 mt-1">
                      {frameImage.name} ({(frameImage.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audio Generation Toggle (for supported models) */}
            {supportsAudio && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Audio Generation
                  <span className="text-gray-400 text-xs ml-2">
                    Choose whether to generate video with or without audio
                  </span>
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="audioOption"
                      value="true"
                      checked={generateAudio === true}
                      onChange={() => setGenerateAudio(true)}
                      className="form-radio h-4 w-4 text-purple-600 focus:ring-purple-500 bg-gray-700 border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-300">With Audio</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="audioOption"
                      value="false"
                      checked={generateAudio === false}
                      onChange={() => setGenerateAudio(false)}
                      className="form-radio h-4 w-4 text-purple-600 focus:ring-purple-500 bg-gray-700 border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-300">Without Audio</span>
                  </label>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-300">{error}</div>
              </div>
            )}

            {/* Generation Status */}
            {generationStatus && (
              <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                <div className="text-sm text-blue-300">{generationStatus}</div>
              </div>
            )}
          </div>

          {/* Credit Balance */}
          <div className="mb-4 text-sm bg-blue-900/30 border border-blue-500/30 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-blue-300">Your Credit Balance:</span>
              <span className="text-white font-semibold">{creditBalance} credits</span>
            </div>
          </div>

          {/* Cost Information */}
          <div className="mb-6 text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
            Cost: {model === 'Seedance 1.0 Lite' ? '5' : model === 'Veo Fast' ? '45' : '10'} credits per video
            <div className="text-xs mt-1 text-purple-400">
              {model === 'Seedance 1.0 Lite' ? 
                '💜 Lite model - Faster generation with good quality' : 
                model === 'Veo Fast' ? 
                '🔊 Veo Fast - Google\'s advanced model with audio support' :
                '🚀 Pro model - Premium quality with advanced features'
              }
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Video...
              </>
            ) : (
              <>
                <Video size={20} />
                Generate Video
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Generated Video */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Generated Video</h3>
          <div className="bg-gray-800 rounded-lg p-6 min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-700">
            {generatedVideo ? (
              <div className="text-center w-full">
                <video
                  controls
                  className="max-w-full max-h-96 rounded-lg shadow-lg mb-4 mx-auto"
                >
                  <source src={generatedVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="space-y-2">
                  <button 
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                    onClick={async () => {
                      try {
                        // Fetch the video as a blob to handle CORS issues
                        const response = await fetch(generatedVideo)
                        const blob = await response.blob()
                        
                        // Create a URL for the blob
                        const blobUrl = URL.createObjectURL(blob)
                        
                        // Create download link
                        const link = document.createElement('a')
                        link.href = blobUrl
                        link.download = `ai-generated-video-${Date.now()}.mp4`
                        document.body.appendChild(link)
                        link.click()
                        
                        // Clean up
                        document.body.removeChild(link)
                        URL.revokeObjectURL(blobUrl)
                      } catch (error) {
                        console.error('Download failed:', error)
                        // Fallback: try direct download
                        const link = document.createElement('a')
                        link.href = generatedVideo
                        link.target = '_blank'
                        link.click()
                      }
                    }}
                  >
                    <Download size={16} />
                    Download Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Video size={64} className="mx-auto mb-4 opacity-50" />
                <p>Your AI-generated video will appear here</p>
                {!isGenerating && <p className="text-sm mt-2">No video generated yet</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoGenerator