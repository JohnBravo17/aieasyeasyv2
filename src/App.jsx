import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import LandingPage from './components/LandingPage'
import AuthenticatedApp from './components/AuthenticatedApp'
import './App.css'

function AppContent() {
  const [currentView, setCurrentView] = useState('landing') // landing, login, app
  const { user } = useAuth()

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('app') // Go directly to app if already authenticated
    } else {
      setCurrentView('login') // Show login form if not authenticated
    }
  }

  const handleLoginSuccess = () => {
    setCurrentView('app') // Navigate to authenticated app after successful login
  }

  const handleLogout = () => {
    setCurrentView('landing') // Return to landing page after logout
  }

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
