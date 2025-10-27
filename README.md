# AI Easy Easy v2 🤖

Multi-user AI generation platform with Firebase authentication, smart pricing, and comprehensive user management.

## ✨ Features

- **🔐 Multi-user Authentication**: Firebase Auth with email/password and Google OAuth
- **🎨 Image Generation**: Multiple AI models (FLUX, Nanobanana, Seedream) with reference image support  
- **🎬 Video Generation**: Seedance and Minimax models with frame image support
- **💰 Smart Pricing**: Dynamic pricing with Thai Baht conversion and per-model configuration
- **📊 Admin Dashboard**: User analytics, financial reports, and system monitoring
- **🖼️ Private Gallery**: Personal generation history with search and filtering
- **📱 Responsive Design**: Modern UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **AI APIs**: Runware API integration
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your API keys
4. Run development server: `npm run dev`

## 🌐 Environment Variables

```env
VITE_RUNWARE_API_KEY=your_runware_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... see .env.example for full list
```

## 📝 License

MIT License - Built with ❤️ for the AI community
