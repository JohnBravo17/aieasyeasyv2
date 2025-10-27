import { useState, useEffect } from 'react'
import { ImageIcon, Download, AlertCircle, Upload, X } from 'lucide-react'
import runwareService from '../services/runwareService'
import ModelRegistry from '../models/ModelRegistry'

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('FLUX.1 Kontext [pro]')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [imageQuality, setImageQuality] = useState('2K')
  const [outputFormat, setOutputFormat] = useState('JPG')
  const [sequentialImages, setSequentialImages] = useState(1)
  const [referenceImage, setReferenceImage] = useState(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState(null)
  const [referenceImages, setReferenceImages] = useState([]) // Multiple images for Nanobanana
  const [generatedImage, setGeneratedImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Initialize ModelRegistry
  const [modelRegistry, setModelRegistry] = useState(null)
  
  useEffect(() => {
    const registry = new ModelRegistry(runwareService.runware)
    setModelRegistry(registry)
  }, [])

  // Initialize referenceImagePreview as array for Nanobanana, null for others
  useEffect(() => {
    if (model === 'Nanobanana') {
      if (referenceImagePreview === null) {
        setReferenceImagePreview([])
      }
    } else {
      if (Array.isArray(referenceImagePreview)) {
        setReferenceImagePreview(null)
        setReferenceImages([])
      }
    }
  }, [model])

  // Get aspect ratios with dimensions based on selected model
  const getAspectRatios = (selectedModel) => {
    if (selectedModel === 'FLUX.1 Kontext [pro]') {
      return [
        { label: '1:1 (Square - 1024×1024)', value: '1:1' },
        { label: '16:9 (Landscape - 1392×752)', value: '16:9' },
        { label: '9:16 (Portrait - 752×1392)', value: '9:16' },
        { label: '4:3 (Traditional - 1184×880)', value: '4:3' },
        { label: '3:4 (Portrait - 880×1184)', value: '3:4' },
        { label: '21:9 (Ultrawide - 1568×672)', value: '21:9' },
        { label: '3:2 (Classic - 1248×832)', value: '3:2' },
        { label: '2:3 (Classic Portrait - 832×1248)', value: '2:3' },
      ]
    } else if (selectedModel === 'FLUX.1.1 Pro') {
      return [
        { label: '1:1 (Square - 1024×1024)', value: '1:1' },
        { label: '16:9 (Landscape - 1440×810)', value: '16:9' },
        { label: '9:16 (Portrait - 810×1440)', value: '9:16' },
        { label: '4:3 (Traditional - 1280×960)', value: '4:3' },
        { label: '3:4 (Portrait - 960×1280)', value: '3:4' },
        { label: '21:9 (Ultrawide - 1440×616)', value: '21:9' },
        { label: '3:2 (Classic - 1296×864)', value: '3:2' },
        { label: '2:3 (Classic Portrait - 864×1296)', value: '2:3' },
      ]
    } else if (selectedModel === 'Nanobanana') {
      return [
        { label: '1:1 (Square - 1024×1024)', value: '1:1' },
        { label: '16:9 (Landscape - 1344×768)', value: '16:9' },
        { label: '9:16 (Portrait - 768×1344)', value: '9:16' },
        { label: '4:3 (Traditional - 1184×864)', value: '4:3' },
        { label: '3:4 (Portrait - 864×1184)', value: '3:4' },
        { label: '21:9 (Ultrawide - 1536×672)', value: '21:9' },
        { label: '3:2 (Classic - 1248×832)', value: '3:2' },
        { label: '2:3 (Classic Portrait - 832×1248)', value: '2:3' },
        { label: '4:5 (Portrait - 896×1152)', value: '4:5' },
        { label: '5:4 (Landscape - 1152×896)', value: '5:4' },
      ]
    } else {
      // Default dimensions for other models
      return [
        { label: '1:1 (Square - 2048×2048)', value: '1:1' },
        { label: '16:9 (Landscape - 2560×1440)', value: '16:9' },
        { label: '9:16 (Portrait - 1440×2560)', value: '9:16' },
        { label: '4:3 (Traditional - 2304×1728)', value: '4:3' },
        { label: '3:4 (Portrait - 1728×2304)', value: '3:4' },
        { label: '21:9 (Ultrawide - 3024×1296)', value: '21:9' },
        { label: '3:2 (Classic - 2496×1664)', value: '3:2' },
        { label: '2:3 (Classic Portrait - 1664×2496)', value: '2:3' },
      ]
    }
  }

  const aspectRatios = getAspectRatios(model)

  const models = [
    { label: 'FLUX.1 Kontext [pro] - Iterative editing - ~3 credits', value: 'FLUX.1 Kontext [pro]' },
    { label: 'FLUX.1.1 Pro - Enhanced quality - ~2 credits', value: 'FLUX.1.1 Pro' },
    { label: 'FLUX.1 [dev] - High quality - ~2 credits', value: 'FLUX.1 [dev]' },
    { label: 'Nanobanana - Google model - ~1 credit', value: 'Nanobanana' },
    { label: 'Seedream 4.0 - Sequential images - ~3 credits', value: 'Seedream 4.0' },
  ]

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // For Nanobanana, support multiple images
    if (model === 'Nanobanana') {
      const validFiles = []
      const previews = []

      files.forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select valid image files (JPG, PNG, WEBP)')
          return
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError('Image file size must be less than 10MB')
          return
        }

        validFiles.push(file)
      })

      // Check total count including existing images
      const currentImages = Array.isArray(referenceImages) ? referenceImages : []
      const totalImages = currentImages.length + validFiles.length
      
      if (totalImages > 10) {
        setError(`Maximum 10 reference images supported. Currently have ${currentImages.length}, trying to add ${validFiles.length}`)
        return
      }

      // Create previews for all valid files
      let loadedCount = 0
      validFiles.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          previews[index] = e.target.result
          loadedCount++
          
          // When all files are loaded, append to existing arrays
          if (loadedCount === validFiles.length) {
            const newReferenceImages = [...currentImages, ...validFiles]
            const currentPreviews = Array.isArray(referenceImagePreview) ? referenceImagePreview : []
            const newPreviews = [...currentPreviews, ...previews]
            
            setReferenceImages(newReferenceImages)
            setReferenceImagePreview(newPreviews)
            
            // Clear file input so user can select same files again if needed
            const fileInput = document.getElementById('nanobanana-reference-input')
            if (fileInput) {
              fileInput.value = ''
            }
          }
        }
        reader.readAsDataURL(file)
      })

      setError(null)
    } else {
      // Single image for other models
      const file = files[0]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG, WEBP)')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size must be less than 10MB')
        return
      }
      
      setReferenceImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setReferenceImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear any previous errors
      setError(null)
    }
  }

  const removeReferenceImage = () => {
    if (model === 'Nanobanana') {
      setReferenceImages([])
      setReferenceImagePreview([])
      // Reset file input for Nanobanana
      const fileInput = document.getElementById('nanobanana-reference-input')
      if (fileInput) {
        fileInput.value = ''
      }
    } else {
      setReferenceImage(null)
      setReferenceImagePreview(null)
      // Reset file input for other models
      const fileInput = document.getElementById('reference-image-input')
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !modelRegistry) return
    
    console.log('🚀 Starting image generation process...')
    setIsGenerating(true)
    setError(null)
    
    try {
      console.log('🔄 Using modular system with model:', model)
      
      const params = {
        prompt,
        aspectRatio,
        imageQuality,
        outputFormat,
        sequentialImages,
        referenceImage,
        referenceImages
      }
      
      const result = await modelRegistry.generateImage(model, params)
      
      console.log('✅ Generation result:', result)
      
      if (result && result.imageURL) {
        setGeneratedImage(result.imageURL)
        console.log('🖼️ Image URL set:', result.imageURL)
      } else if (result && result.imageSrc) {
        setGeneratedImage(result.imageSrc)
        console.log('🖼️ Image src set:', result.imageSrc)
      } else {
        console.error('❌ No image URL found in result:', result)
        
        // For testing purposes, show a placeholder if API fails
        console.log('🔄 Using placeholder image for testing...')
        setGeneratedImage('https://via.placeholder.com/512x512/4a5568/ffffff?text=Test+Generated+Image')
        setError('API call completed but returned unexpected format. Using placeholder image for testing.')
      }
    } catch (err) {
      console.error('💥 Generation failed:', err)
      const errorMessage = err.message || 'Failed to generate image. Please try again.'
      
      // Show detailed error but also provide a test image
      setError(`${errorMessage} (Check browser console for details)`)
      
      // For debugging, show a test image
      console.log('🔄 Showing test image due to error...')
      setGeneratedImage('https://via.placeholder.com/512x512/dc2626/ffffff?text=Error+Test+Image')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Controls */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Generate Image</h2>
          <p className="text-gray-400">Create stunning images using AI</p>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              model === 'Seedream 4.0' 
                ? "Describe a sequence or transformation... (e.g., 'Transform this character through different seasons' or 'Show this object in various styles')"
                : "Describe the image you want to generate..."
            }
            className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {model === 'Seedream 4.0' && (
            <p className="text-xs text-gray-400 mt-1">
              💡 Tip: {referenceImage ? 'Describe how to transform or evolve the reference image' : 'Upload a reference image for better guided generation, or describe a progression/story sequence'}
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {models.map((modelOption) => (
              <option key={modelOption.value} value={modelOption.value}>
                {modelOption.label}
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {aspectRatios.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </div>

        {/* Image Quality (only for advanced models) */}
        {(model === 'Seedream 4.0' || model === 'FLUX.1.1 Pro' || model === 'FLUX.1 [dev]' || model === 'Nanobanana') && (
          <div>
            <label className="block text-sm font-medium mb-2">Image Quality</label>
            <select
              value={imageQuality}
              onChange={(e) => setImageQuality(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1K">1K Quality (1024×1024 base)</option>
              <option value="2K">2K Quality (2048×2048 base) - Recommended</option>
              <option value="4K">4K Quality (4096×4096 base) - Premium</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Higher quality requires more credits but produces sharper, more detailed images
            </p>
          </div>
        )}

        {/* Output Format */}
        <div>
          <label className="block text-sm font-medium mb-2">Output Format</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="JPG">JPG (Universal compatibility) - Recommended</option>
            <option value="WEBP">WEBP (Smaller file size, modern format)</option>
            <option value="PNG">PNG (Lossless quality)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Choose the image format for your generated image
          </p>
        </div>

        {/* Sequential Images (only for Seedream 4.0) */}
        {model === 'Seedream 4.0' && (
          <div>
            <label className="block text-sm font-medium mb-2">Sequential Images</label>
            <select
              value={sequentialImages}
              onChange={(e) => setSequentialImages(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 image</option>
              <option value={2}>2 sequential images</option>
              <option value={3}>3 sequential images</option>
              <option value={4}>4 sequential images (max)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Generate multiple related images that tell a story or show progression
            </p>
          </div>
        )}

        {/* Reference Image Upload (for Seedream 4.0 and FLUX.1 Kontext [pro]) */}
        {(model === 'Seedream 4.0' || model === 'FLUX.1 Kontext [pro]') && (
          <div>
            <label className="block text-sm font-medium mb-2">Reference Image (Optional)</label>
            {!referenceImagePreview ? (
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <input
                  type="file"
                  id="reference-image-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="reference-image-input" 
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">
                    Click to upload reference image
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP (max 10MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative bg-gray-800 rounded-lg border border-gray-700 p-2">
                <div className="flex items-center justify-center">
                  <img
                    src={referenceImagePreview}
                    alt="Reference"
                    className="max-w-full max-h-48 object-contain rounded"
                  />
                </div>
                <button
                  onClick={removeReferenceImage}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
                <div className="mt-2 text-xs text-gray-400 text-center">
                  Reference Image: {referenceImage?.name}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {model === 'Seedream 4.0' 
                ? 'Reference image helps guide the style and content of sequential images' 
                : 'Reference image guides the style and composition for iterative editing'
              }
            </p>
          </div>
        )}

        {/* Reference Image Upload (for Nanobanana - multiple images) */}
        {model === 'Nanobanana' && (
          <div>
            <label className="block text-sm font-medium mb-2">Reference Images (Optional - up to 10)</label>
            {(!Array.isArray(referenceImagePreview) || referenceImagePreview.length === 0) ? (
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <input
                  type="file"
                  id="nanobanana-reference-input"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="nanobanana-reference-input" 
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">
                    Click to upload reference images
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP (max 10MB each, up to 10 images)
                  </span>
                </label>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300">
                    {referenceImages.length} image{referenceImages.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={removeReferenceImage}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {Array.isArray(referenceImagePreview) && referenceImagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Reference ${index + 1}`}
                        className="w-full aspect-square object-cover rounded border border-gray-600"
                      />
                      <button
                        onClick={() => {
                          const newImages = referenceImages.filter((_, i) => i !== index)
                          const newPreviews = Array.isArray(referenceImagePreview) ? referenceImagePreview.filter((_, i) => i !== index) : []
                          setReferenceImages(newImages)
                          setReferenceImagePreview(newPreviews)
                        }}
                        className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {referenceImages.length < 10 && (
                    <label 
                      htmlFor="nanobanana-reference-input" 
                      className="aspect-square border-2 border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                    >
                      <Upload size={20} className="text-gray-500" />
                    </label>
                  )}
                </div>
                <input
                  type="file"
                  id="nanobanana-reference-input"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Multiple reference images will be combined to guide the generated output. Great for image editing and style mixing.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} />
              <span className="font-medium">Generation Error</span>
            </div>
            <div className="text-sm">{error}</div>
            <div className="text-xs mt-2 text-red-300">
              💡 Troubleshooting tips:
              <ul className="list-disc list-inside mt-1">
                <li>Check browser console (F12) for detailed logs</li>
                <li>Verify your API key is working</li>
                <li>Try a different model or simpler prompt</li>
              </ul>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
          🔧 Debug: API Key {import.meta.env.VITE_RUNWARE_API_KEY ? '✅' : '❌'} | 
          Environment: {import.meta.env.MODE}
          <br />
          <button 
            onClick={() => {
              console.log('🧪 Running API test...')
              console.log('API Key:', import.meta.env.VITE_RUNWARE_API_KEY)
              console.log('Runware service:', runwareService)
            }}
            className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Test API Connection
          </button>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <ImageIcon size={20} />
              Generate Image
            </>
          )}
        </button>

        {/* Cost Information */}
        <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
          Cost: ~{
            model === 'FLUX.1.1 Pro' ? '2' :
            model === 'FLUX.1 [dev]' ? '2' :
            model === 'FLUX.1 Kontext [pro]' ? '3' :
            model === 'Seedream 4.0' ? `${3 * sequentialImages}` :
            model === 'Nanobanana' ? '1' :
            '1'
          } credit{model === 'Seedream 4.0' && sequentialImages > 1 ? 's' : ''} per {
            model === 'Seedream 4.0' && sequentialImages > 1 ? 
            `${sequentialImages} sequential images` : 
            'image'
          }
          {model === 'Seedream 4.0' && (
            <div className="text-xs mt-1 text-blue-400">
              ✨ Sequential images show progression or story development
            </div>
          )}
          {model === 'FLUX.1 Kontext [pro]' && (
            <div className="text-xs mt-1 text-blue-400">
              🎨 Iterative editing with style preservation across modifications
            </div>
          )}
          {model === 'FLUX.1.1 Pro' && (
            <div className="text-xs mt-1 text-blue-400">
              ⚡ Enhanced quality with improved prompt adherence
            </div>
          )}
          {model === 'FLUX.1 [dev]' && (
            <div className="text-xs mt-1 text-blue-400">
              🚀 High quality generation with development-grade features
            </div>
          )}
          {model === 'Nanobanana' && (
            <div className="text-xs mt-1 text-blue-400">
              🍌 Google's efficient image generation model
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Generated Image */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Generated Image</h3>
        <div className="bg-gray-800 rounded-lg p-6 min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-700">
          {generatedImage ? (
            <div className="text-center">
              <img
                src={generatedImage}
                alt="Generated"
                className="max-w-full max-h-96 rounded-lg shadow-lg mb-4"
              />
              <button 
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                onClick={async () => {
                  try {
                    // Fetch the image as a blob to handle CORS issues
                    const response = await fetch(generatedImage)
                    const blob = await response.blob()
                    
                    // Create a URL for the blob
                    const blobUrl = URL.createObjectURL(blob)
                    
                    // Create download link
                    const link = document.createElement('a')
                    link.href = blobUrl
                    const extension = outputFormat.toLowerCase()
                    link.download = `ai-generated-image-${Date.now()}.${extension}`
                    document.body.appendChild(link)
                    link.click()
                    
                    // Clean up
                    document.body.removeChild(link)
                    URL.revokeObjectURL(blobUrl)
                  } catch (error) {
                    console.error('Download failed:', error)
                    // Fallback: try direct download
                    const link = document.createElement('a')
                    link.href = generatedImage
                    link.target = '_blank'
                    link.click()
                  }
                }}
              >
                <Download size={16} />
                Download
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
              <p>Your AI-generated image will appear here</p>
              {!isGenerating && <p className="text-sm mt-2">No image generated yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageGenerator