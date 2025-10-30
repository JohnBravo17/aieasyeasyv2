import React, { useState } from 'react'
import LandingPage from './components/LandingPage'
import AuthenticatedApp from './components/AuthenticatedApp'
import Login from './components/auth/Login'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  const [currentView, setCurrentView] = useState('landing') // landing, login, app
  
  const showLogin = () => {
    setCurrentView('login')
  }
  
  const showApp = () => {
    setCurrentView('app')
  }
  
  const backToLanding = () => {
    setCurrentView('landing')
  }

  // Landing Page - No authentication required
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={showLogin}
        onSignIn={showLogin}
      />
    )
  }

  // Login Page - No authentication required yet
  if (currentView === 'login') {
    return (
      <Login 
        onBack={backToLanding}
        onLoginSuccess={showApp}
      />
    )
  }

  // Authenticated App - Requires authentication
  return (
    <AuthProvider>
      <AuthenticatedApp onLogout={backToLanding} />
    </AuthProvider>
  )
}

export default App