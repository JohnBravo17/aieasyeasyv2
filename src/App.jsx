import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './modules/auth/Login'
import LandingPage from './components/ui/landing/LandingPage'
import AuthenticatedApp from './components/AuthenticatedApp'
import './App.css'

function AppContent() {
  const [currentView, setCurrentView] = useState('landing') // landing, login, app
  const { user, loading } = useAuth()

  // Auto-navigate based on authentication state
  const handleGetStarted = () => {
    if (user) {
      setCurrentView('app') // Go directly to app if already authenticated
    } else {
      setCurrentView('login') // Show login form if not authenticated
    }
  }

  const handleLoginSuccess = () => {
    console.log('Login success callback triggered')
    setCurrentView('app') // Navigate to authenticated app after successful login
  }

  const handleLogout = () => {
    setCurrentView('landing') // Return to landing page after logout
  }

  // Auto-navigate to app when user becomes authenticated
  React.useEffect(() => {
    if (user && currentView === 'login') {
      console.log('User authenticated, navigating to app')
      setCurrentView('app')
    }
  }, [user, currentView])

  // Show landing page by default (no authentication required)
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={handleGetStarted}
        onLogin={() => setCurrentView('login')}
      />
    )
  }

  // Show login form when requested
  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // Show authenticated app (with AuthProvider protection)
  if (currentView === 'app' && user) {
    return <AuthenticatedApp onLogout={handleLogout} />
  }

  // Fallback to landing if no valid state
  return (
    <LandingPage 
      onGetStarted={handleGetStarted}
      onLogin={() => setCurrentView('login')}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
