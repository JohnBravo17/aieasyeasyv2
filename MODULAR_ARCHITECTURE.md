# Modular AI Model Architecture Documentation

## Overview
The application has been successfully refactored to use a comprehensive modular architecture that allows easy addition of new AI models without affecting existing code. Each model is now isolated in its own module with standardized interfaces.

## Architecture Structure

```
src/models/
├── BaseImageModel.js          # Base class for all image models
├── BaseVideoModel.js          # Base class for all video models
├── ModelRegistry.js           # Central registry for all models
├── imageModules/              # Individual image model modules
│   ├── FluxKontextProModel.js
│   ├── Flux11ProModel.js
│   ├── Flux1DevModel.js
│   ├── NanobananaModel.js
│   ├── Seedream40Model.js
│   └── SampleImageModel.js    # Example new model
└── videoModules/              # Individual video model modules
    └── Seedance1LiteModel.js
```

## Key Components

### 1. Base Classes
- **BaseImageModel.js**: Provides common interface and functionality for all image generation models
- **BaseVideoModel.js**: Provides common interface and functionality for all video generation models

### 2. Model Registry
- **ModelRegistry.js**: Central hub that automatically loads and manages all models
- Provides unified interface for model access
- Handles model initialization and configuration

### 3. Individual Model Modules
Each model is implemented as a separate class that extends the appropriate base class:
- Contains model-specific logic and configuration
- Implements standardized methods (generate, getDimensions, getProviderSettings, etc.)
- Can be developed and tested independently

## How to Add New Models

### Adding a New Image Model

1. **Create the model file** in `src/models/imageModules/`:
```javascript
// NewImageModel.js
import BaseImageModel from '../BaseImageModel.js'

class NewImageModel extends BaseImageModel {
  constructor(runwareClient) {
    super()
    this.runware = runwareClient
    this.modelId = 'provider:model@version'
    this.displayName = 'New Model Name'
    // ... model-specific configuration
  }

  async generate(params) {
    // Model-specific generation logic
  }

  getDimensions(aspectRatio, quality) {
    // Model-specific dimension handling
  }

  getProviderSettings(sequentialImages) {
    // Model-specific provider settings
  }
}

export default NewImageModel
```

2. **Register the model** in `ModelRegistry.js`:
```javascript
// Add import
import NewImageModel from './imageModules/NewImageModel.js'

// Add registration in initializeModels()
this.registerImageModel('New Model', new NewImageModel(this.runware))
```

3. **Done!** The model is now available throughout the application.

### Adding a New Video Model

Follow the same pattern but extend `BaseVideoModel` and register with `registerVideoModel()`.

## Benefits of This Architecture

1. **Modularity**: Each model is completely isolated and independent
2. **Scalability**: Easy to add unlimited new models
3. **Maintainability**: Changes to one model don't affect others
4. **Consistency**: All models follow the same interface patterns
5. **Testability**: Each model can be tested independently
6. **Flexibility**: Model-specific logic is contained within each module

## Current Models

### Image Models
- **FLUX.1 Kontext [pro]** (`bfl:3@1`) - Supports reference images
- **FLUX.1.1 Pro** (`bfl:2@1`) - High-quality image generation
- **FLUX.1 [dev]** (`runware:101@1`) - Development version
- **Nanobanana** (`google:4@1`) - Supports multiple reference images
- **Seedream 4.0** (`bytedance:5@0`) - Supports reference images
- **Sample Model** (`sample:1@0`) - Demo model showing architecture

### Video Models
- **Seedance 1.0 Lite** (`bytedance:1@0`) - Video generation

## Integration with Existing Services

The modular architecture integrates seamlessly with existing services:
- **runwareService.js**: Uses the original service for API calls
- **pricingService.js**: Cost tracking and markup calculations
- **UI Components**: Continue to work with the same interfaces

## Example Usage

```javascript
// In your component
import ModelRegistry from '../models/ModelRegistry.js'
import runwareService from '../services/runwareService.js'

// Initialize registry
const modelRegistry = new ModelRegistry(runwareService.runware)

// Generate image with any model
const result = await modelRegistry.generateImage('A cat', 'FLUX.1 Kontext [pro]', {
  aspectRatio: '1:1',
  imageQuality: '2K'
})
```

## Future Expansion

This architecture is designed to handle future growth:
- Easy addition of new model providers
- Support for different model types (audio, 3D, etc.)
- Plugin-style architecture for advanced features
- Configuration-driven model definitions

The modular design ensures that as new AI models become available, they can be integrated quickly without disrupting existing functionality.