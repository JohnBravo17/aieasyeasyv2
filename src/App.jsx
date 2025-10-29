import { useState, useEffect } from 'react'
import { Image, Video, ArrowLeft, DollarSign, LogOut, User, Shield, Images } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ImageGenerator from './components/ImageGenerator'
import VideoGenerator from './components/VideoGenerator'
import PricingDashboard from './components/PricingDashboard'
import AdminDashboard from './components/admin/AdminDashboard'
import UserGallery from './components/UserGallery'
import HeroHomepage from './components/HeroHomepage'
import LandingPage from './components/LandingPage'
import Login from './components/auth/Login'
import './App.css'

function MainApp() {
  const [showLanding, setShowLanding] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [activeView, setActiveView] = useState('home') // Start with home view
  const [activeTab, setActiveTab] = useState('image')
  const [isAdmin, setIsAdmin] = useState(false)
  const { user, logout, isAdmin: checkAdmin } = useAuth()

  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await checkAdmin()
        setIsAdmin(adminStatus)
      }
    }
    checkAdminStatus()
  }, [user, checkAdmin])

  const handleLogout = async () => {
    try {
      await logout()
      setShowLanding(true)
      setActiveView('home')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // If user is not logged in, show landing or login
  if (!user) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />
    }
    return (
      <LandingPage 
        onGetStarted={() => setShowLogin(true)}
        onSignIn={() => setShowLogin(true)}
      />
    )
  }

  // User is logged in, hide landing page
  if (showLanding) {
    setShowLanding(false)
  }

  // Show Hero Homepage by default, other views when navigated
  if (activeView === 'home') {
    return (
      <HeroHomepage 
        onNavigateToImageGen={() => {
          setActiveTab('image')
          setActiveView('generator')
        }}
        onNavigateToVideoGen={() => {
          setActiveTab('video') 
          setActiveView('generator')
        }}
        onNavigateToGallery={() => setActiveView('gallery')}
        onNavigateToSettings={() => {
          setActiveTab('pricing')
          setActiveView('settings')
        }}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft size={20} />
              Back to Home
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img 
              src="/logo/logoaieasyclearbackground.png" 
              alt="AI Easy Easy" 
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-2xl font-bold">AI Easy Easy</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <User size={16} />
              <span>{user?.displayName || user?.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Tab Navigation - Show based on current view */}
        {activeView === 'generator' && (
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Image size={20} />
              Image Generation
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Video size={20} />
              Video Generation
            </button>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'pricing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <DollarSign size={20} />
              Pricing Dashboard
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Shield size={20} />
                Admin Panel
              </button>
            )}
          </div>
        )}

        {/* View Content */}
        {activeView === 'generator' && activeTab === 'image' && <ImageGenerator />}
        {activeView === 'generator' && activeTab === 'video' && <VideoGenerator />}
        {activeView === 'gallery' && <UserGallery onNavigateHome={() => setActiveView('home')} />}
        {activeView === 'settings' && activeTab === 'pricing' && <PricingDashboard />}
        {activeView === 'settings' && activeTab === 'admin' && isAdmin && <AdminDashboard />}
      </main>
    </div>
  )
}

// Wrapper App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
