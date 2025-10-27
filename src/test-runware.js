import { Runware } from '@runware/sdk-js'

// Test script to verify Runware API connection
async function testRunwareAPI() {
  console.log('🧪 Testing Runware API connection...')
  
  const apiKey = 'SDxwWtyxUhiXuMcBcZCLJXj4f6I6Tllv'
  console.log('🔑 Using API key:', apiKey ? 'Present' : 'Missing')
  
  try {
    const runware = new Runware({
      apiKey: apiKey
    })
    
    console.log('✅ Runware client created')
    
    // Try a simple image generation
    const result = await runware.requestImages({
      positivePrompt: 'a simple red apple',
      model: 'civitai:4384',
      numberResults: 1,
      width: 512,
      height: 512
    })
    
    console.log('📥 API Response:', result)
    console.log('✅ Test successful!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('❌ Error details:', error.message)
  }
}

// Run the test
testRunwareAPI()

export default testRunwareAPI