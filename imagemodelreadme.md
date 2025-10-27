# Image Models Setup Documentation

## Overview
This document provides detailed instructions for setting up the modular image generation system using Runware API. The system uses a modular architecture with BaseImageModel, ModelRegistry, and individual model files.

## Architecture Summary

### Core Components
1. **BaseImageModel.js** - Abstract base class for all image models
2. **ModelRegistry.js** - Central hub managing all image models
3. **Individual Model Files** - Specific implementations for each AI model
4. **ImageGenerator.jsx** - UI component using the modular system

### File Structure
```
src/
├── models/
│   ├── BaseImageModel.js
│   ├── ModelRegistry.js
│   └── imageModules/
│       ├── FluxKontextProModel.js
│       ├── Flux11ProModel.js
│       ├── Flux1DevModel.js
│       ├── NanobananaModel.js
│       └── Seedream40Model.js
└── components/
    └── ImageGenerator.jsx
```

## Model Configurations

### 1. Seedream40Model (`bytedance:5@0`)
**Provider:** ByteDance  
**Features:** Sequential image generation, reference images, storytelling

#### Key Settings:
```javascript
modelId: 'bytedance:5@0'
outputFormat: params.outputFormat || "WEBP"
includeCost: true
providerSettings: {
  bytedance: {
    maxSequentialImages: Math.min(sequentialImages || 1, 3)
  }
}
```

#### Supported Dimensions (multiples of 8, min 256px):
```javascript
'1:1': { width: 1024, height: 1024 }
'16:9': { width: 1344, height: 768 }
'9:16': { width: 768, height: 1344 }
'4:3': { width: 1024, height: 768 }
'3:4': { width: 768, height: 1024 }
```

#### Reference Images:
- Single reference image support
- Returns array format: `["imageUUID"]`
- Direct HTTP upload with `taskType: "imageUpload"`

### 2. FluxKontextProModel (`bfl:3@1`)
**Provider:** Black Forest Labs  
**Features:** Fast iterative editing, style preservation

#### Key Settings:
```javascript
modelId: 'bfl:3@1'
outputFormat: params.outputFormat || "WEBP"
providerSettings: {
  bfl: {
    promptUpsampling: false,
    safetyTolerance: 2
  }
}
```

#### Supported Dimensions (from BFL documentation):
```javascript
'1:1': { width: 1024, height: 1024 }
'16:9': { width: 1392, height: 752 }
'9:16': { width: 752, height: 1392 }
'4:3': { width: 1184, height: 880 }
'3:4': { width: 880, height: 1184 }
'21:9': { width: 1568, height: 672 }
'3:2': { width: 1248, height: 832 }
'2:3': { width: 832, height: 1248 }
```

#### Reference Images:
- Supports up to 2 reference images
- Direct HTTP upload system

### 3. Flux11ProModel (`bfl:2@1`)
**Provider:** Black Forest Labs  
**Features:** Enhanced quality, improved prompt adherence

#### Key Settings:
```javascript
modelId: 'bfl:2@1'
outputFormat: params.outputFormat || "WEBP"
providerSettings: {
  bfl: {
    promptUpsampling: false,
    safetyTolerance: 2
  }
}
```

#### Supported Dimensions (256-1440px, multiples of 64):
```javascript
'1:1': { width: 1024, height: 1024 }
'16:9': { width: 1344, height: 768 }
'9:16': { width: 768, height: 1344 }
'4:3': { width: 1280, height: 960 }
'3:4': { width: 960, height: 1280 }
'21:9': { width: 1344, height: 576 }
'3:2': { width: 1280, height: 832 }
'2:3': { width: 832, height: 1280 }
```

### 4. Flux1DevModel (`runware:101@1`)
**Provider:** Runware  
**Features:** Development-grade features

#### Key Settings:
```javascript
modelId: 'runware:101@1'
outputFormat: params.outputFormat || "WEBP"
// No providerSettings (not a BFL model)
```

#### Supported Dimensions (multiples of 64):
```javascript
'1:1': { width: 1024, height: 1024 }
'16:9': { width: 1280, height: 768 }
'9:16': { width: 768, height: 1280 }
'4:3': { width: 1024, height: 768 }
'3:4': { width: 768, height: 1024 }
'21:9': { width: 1344, height: 576 }
'3:2': { width: 1152, height: 768 }
'2:3': { width: 768, height: 1152 }
```

### 5. NanobananaModel (`google:4@1`)
**Provider:** Google  
**Features:** Multiple reference images (up to 14), sequential processing

#### Key Settings:
```javascript
modelId: 'google:4@1'
outputFormat: params.outputFormat || "WEBP"
// No specific providerSettings required
```

#### Supported Dimensions:
```javascript
'1:1': { width: 1024, height: 1024 }
'16:9': { width: 1344, height: 768 }
'9:16': { width: 768, height: 1344 }
'4:3': { width: 1184, height: 864 }
'3:4': { width: 864, height: 1184 }
'21:9': { width: 1536, height: 672 }
'3:2': { width: 1344, height: 896 }
'2:3': { width: 896, height: 1344 }
```

#### Multiple Reference Images:
- Supports up to 14 reference images
- Combines single + multiple image arrays
- Returns: `["uuid1", "uuid2", "uuid3", ...]`
- Processing: Uploads each image individually via direct HTTP

## API Request Format

### Standard Request Structure
All models use this base format with array wrapper:
```javascript
const request = {
  taskType: "imageInference",
  taskUUID: this.generateUUID(),
  positivePrompt: params.prompt,
  model: this.modelId,
  width: dimensions.width,
  height: dimensions.height,
  outputFormat: params.outputFormat || "WEBP",
  includeCost: true  // Required for cost tracking
}

// Send as array
body: JSON.stringify([request])
```

### Provider-Specific Settings

#### BFL Models (FluxKontext, Flux11Pro):
```javascript
providerSettings: {
  bfl: {
    promptUpsampling: false,
    safetyTolerance: 2
  }
}
```

#### ByteDance Models (Seedream):
```javascript
providerSettings: {
  bytedance: {
    maxSequentialImages: Math.min(sequentialImages || 1, 3)
  }
}
```

#### Google/Runware Models:
No special provider settings required.

### Reference Images Format
```javascript
// Single image
"referenceImages": ["imageUUID1"]

// Multiple images  
"referenceImages": ["imageUUID1", "imageUUID2", "imageUUID3"]
```

## Image Upload Process

### Direct HTTP Upload (Used by all models):
```javascript
const uploadRequest = {
  taskType: "imageUpload",
  taskUUID: this.generateUUID(),
  image: base64String
}

const response = await fetch("https://api.runware.ai/v1", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify([uploadRequest])
})
```

## Output Formats
Supported formats: **JPG** (recommended), **WEBP**, **PNG**
- Default: WEBP (smaller file size)
- Configurable via UI dropdown
- Used in filename extension for downloads

## Cost Tracking

### Cost Information Requirement
All requests **MUST** include `includeCost: true` to receive cost information:
```javascript
const request = {
  // ... other parameters
  includeCost: true
}
```

### Cost Response Format
API returns cost information in the response:
```javascript
{
  "data": [{
    "imageURL": "https://...",
    "taskUUID": "...",
    "cost": {
      "totalCost": 0.12,
      "currency": "USD",
      "breakdown": { /* cost details */ }
    }
  }]
}
```

### Cost Logging
All models use `BaseImageModel.logGeneration()` method:
```javascript
this.logGeneration(imageData, params)
// Logs: modelId, cost, taskUUID, and generation settings
// Automatically sends cost data to PricingService for dashboard
```

### Integration with Pricing Dashboard
Cost data is automatically tracked in the Pricing Dashboard:
1. **BaseImageModel.logGeneration()** → **PricingService.logGeneration()**
2. **PricingService** saves to localStorage and dispatches 'costDataUpdated' event  
3. **PricingDashboard** listens for events and auto-refreshes
4. **Real-time cost tracking** with profit margins and statistics

Cost data includes:
- Model used and display name
- Actual API cost vs customer charge  
- Profit margins and markup calculations
- Generation settings (quality, aspect ratio, etc.)
- Reference image usage and sequential counts

## Download Implementation
Cross-origin download handling:
```javascript
// Fetch as blob to handle CORS
const response = await fetch(imageUrl)
const blob = await response.blob()
const blobUrl = URL.createObjectURL(blob)

// Create download link
const link = document.createElement('a')
link.href = blobUrl
link.download = `ai-generated-image-${Date.now()}.${extension}`
link.click()

// Cleanup
URL.revokeObjectURL(blobUrl)
```

## Critical Implementation Notes

### 1. Array Format Required
**ALWAYS** send requests as arrays: `JSON.stringify([request])`

### 2. Provider Settings Mandatory
- BFL models **REQUIRE** `providerSettings.bfl` object
- Use correct parameter names: `promptUpsampling`, `safetyTolerance`

### 3. Dimension Requirements
- All dimensions must be multiples of 64
- BFL models have specific supported dimension sets
- ByteDance models need multiples of 8, minimum 256px

### 4. Reference Image Processing
- All models use direct HTTP upload (no SDK)
- Return UUID strings in array format
- NanobananaModel supports multiple images

### 5. Error Handling
- Check `response.ok` before parsing JSON
- Handle `result.errors` array in responses
- Provide meaningful error messages

## Integration with UI

### ImageGenerator Component
```javascript
// Initialize ModelRegistry
const registry = new ModelRegistry(runwareService.runware)

// Generate image
const result = await modelRegistry.generateImage(model, {
  prompt,
  aspectRatio,
  imageQuality,
  outputFormat,
  sequentialImages,
  referenceImage,
  referenceImages
})
```

### State Management
```javascript
const [outputFormat, setOutputFormat] = useState('WEBP')
const [referenceImages, setReferenceImages] = useState([])
const [referenceImage, setReferenceImage] = useState(null)
```

## Troubleshooting

### Common Issues:
1. **"Invalid payload format"** → Check array wrapper: `[request]`
2. **"Invalid provider settings"** → Add required BFL settings
3. **"Invalid width parameter"** → Ensure multiples of 64
4. **"Reference image upload failed"** → Check direct HTTP implementation
5. **Download opens image instead** → Use blob download method

### Debug Logging:
All models include comprehensive console logging:
- `🚀` Generation start
- `📤` Image uploads  
- `✅` Success messages
- `❌` Error details

## Backup & Recovery
This document serves as the master reference. If the system crashes:

1. Ensure all model files follow the documented structure
2. Verify API request formats match examples
3. Check provider settings are correctly implemented  
4. Confirm dimension calculations are accurate
5. Test reference image upload flows

## Environment Variables
Required: `VITE_RUNWARE_API_KEY`

## Dependencies
- Runware SDK: `@runware/sdk-js` (for initialization only)
- Direct HTTP requests for all API calls
- Native File API for image processing
- Fetch API for blob downloads