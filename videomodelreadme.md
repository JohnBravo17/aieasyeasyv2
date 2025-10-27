# Video Models Setup Documentation

## Overview
Documentation for video generation models setup using Runware API with modular architecture.

## Model Configurations

### 1. Seedance1LiteModel (`bytedance:1@1`)
**Provider:** ByteDance  
**Status:** ✅ Working properly

#### Key Features:
- Async video generation with polling
- Frame image support
- Uses `taskType: "getResponse"` for polling
- Array format requests: `[request]`

#### Polling Pattern:
```javascript
// Initial request
body: JSON.stringify([request])

// Polling
body: JSON.stringify([{
  taskType: "getResponse", 
  taskUUID: taskUUID
}])
```

### 2. MinimaxHailu02Model (`minimax:3@1`)
**Provider:** Minimax  
**Status:** ✅ Fixed to match Seedance pattern

#### Fixes Applied:
1. **Array Format**: Changed from single object to `[request]` array
2. **Polling TaskType**: Changed from `"taskStatusRequest"` to `"getResponse"`
3. **Added Logging**: Enhanced debug output and cost tracking
4. **API Key**: Added proper `this.apiKey` usage

#### Before vs After:
```javascript
// BEFORE (broken)
body: JSON.stringify(request)           // Single object
taskType: "taskStatusRequest"           // Wrong task type

// AFTER (fixed)  
body: JSON.stringify([request])         // Array format
taskType: "getResponse"                 // Correct task type
```

## Common Video Request Structure

### Standard Request Format:
```javascript
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
  providerSettings: this.getProviderSettings()
}

// ALWAYS send as array
body: JSON.stringify([request])
```

### Polling Pattern:
```javascript
const pollResponse = await fetch("https://api.runware.ai/v1", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${this.apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify([{
    taskType: "getResponse",  // NOT "taskStatusRequest"
    taskUUID: taskUUID
  }])
})
```

## Video Generation Flow

### 1. Initial Request
- Send video generation request as array `[request]`
- Extract `taskUUID` from response
- Handle both SDK and direct HTTP responses

### 2. Polling for Completion  
- Use `taskType: "getResponse"` (not `taskStatusRequest`)
- Poll every 10 seconds for up to 30 attempts (5 minutes)
- Look for `item.videoURL` in `pollData.data` array

### 3. Success Handling
- Return video data when `videoURL` is found
- Call `this.logGeneration(item, params)` for cost tracking
- Update status with completion message

## Provider-Specific Settings

### ByteDance (Seedance):
```javascript
providerSettings: {
  bytedance: {
    cameraFixed: false
  }
}
```

### Minimax:
```javascript
providerSettings: {
  minimax: {
    promptOptimizer: true
  }
}
```

## Debugging & Logging

### Console Output Pattern:
```javascript
console.log(`🔄 [Model Name] Polling attempt ${attempts}/${maxAttempts}`)
console.log(`📊 [Model Name] Poll ${attempts} result:`, pollData)
console.log('✅ [Model Name] Video ready! URL:', item.videoURL)
```

### Cost Tracking:
All models automatically log to PricingDashboard via:
```javascript
this.logGeneration(item, params)
```

## Troubleshooting

### Common Issues:
1. **No video returned** → Check array format `[request]` 
2. **Polling fails** → Use `"getResponse"` not `"taskStatusRequest"`
3. **Cost not tracked** → Ensure `includeCost: true` and `logGeneration()` call
4. **API errors** → Check `this.apiKey` availability

### Critical Requirements:
- ✅ **Array format**: Always `JSON.stringify([request])`
- ✅ **Correct polling**: Use `taskType: "getResponse"`
- ✅ **Cost tracking**: Include `includeCost: true`
- ✅ **Error logging**: Enhanced debug output
- ✅ **Status updates**: Call `onStatusUpdate()` callbacks

## Model Comparison

| Feature | Seedance1Lite | MinimaxHailu02 |
|---------|---------------|----------------|
| Model ID | `bytedance:1@1` | `minimax:3@1` |
| Status | ✅ Working | ✅ Fixed |
| Frame Images | ✅ Supported | ✅ Supported |
| Polling Method | `getResponse` | `getResponse` |
| Array Format | ✅ Yes | ✅ Fixed |
| Cost Tracking | ✅ Yes | ✅ Added |

Both models now follow the same reliable pattern for video generation and polling.