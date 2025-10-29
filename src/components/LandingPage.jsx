import React from 'react'
import './LandingPage.css'

const LandingPage = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo">
              <div className="logo-icon">🎨</div>
              <span className="logo-text">AI Easy Easy</span>
            </div>
          </div>
          <div className="nav-center">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact Us</a>
          </div>
          <div className="nav-right">
            <button className="sign-in-btn" onClick={onSignIn}>
              Sign In
            </button>
            <button className="demo-btn" onClick={onGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Easy way to create<br />
              <span className="gradient-text">AI-powered content</span>
            </h1>
            <p className="hero-subtitle">
              Generate stunning images and videos with advanced AI technology.<br />
              Professional quality results in seconds, not hours.
            </p>
            <div className="hero-buttons">
              <button className="primary-btn" onClick={onGetStarted}>
                Start Free Trial
              </button>
              <button className="secondary-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                </svg>
                Watch Demo
              </button>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="feature-highlights">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Image Generation</h3>
              <p>Create stunning visuals with AI</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3>Video Creation</h3>
              <p>Generate professional videos</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Results in seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="testimonial">
          <div className="testimonial-badge">IMPROVEMENT</div>
          <p>"Just helpful for me, and I like it!"</p>
          <div className="testimonial-author">
            <div className="author-avatar"></div>
          </div>
        </div>
        <div className="testimonial">
          <div className="testimonial-badge">AWESOME</div>
          <p>"I think, its good app for managers."</p>
          <div className="testimonial-author">
            <div className="author-avatar"></div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="trusted-by">
        <div className="trusted-container">
          <div className="brand-logo">Sendbird</div>
          <div className="brand-logo">Monday</div>
          <div className="brand-logo">AfterPay</div>
          <div className="brand-logo">SEMrush</div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage