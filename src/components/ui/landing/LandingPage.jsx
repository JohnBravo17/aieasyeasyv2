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
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">🖼️</div>
            <h3 className="feature-title">Image Generation</h3>
            <p className="feature-description">Create stunning visuals with AI</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3 className="feature-title">Video Creation</h3>
            <p className="feature-description">Generate professional videos</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-description">Results in seconds</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonial">
            <div className="testimonial-badge improvement">IMPROVEMENT</div>
            <p className="testimonial-text">"Just helpful for me, and I like it!"</p>
            <div className="testimonial-author">
              <div className="author-avatar"></div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-badge awesome">AWESOME</div>
            <p className="testimonial-text">"I think, its good app for managers."</p>
            <div className="testimonial-author">
              <div className="author-avatar"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="companies-section">
        <div className="companies-container">
          <div className="company-logo">Sendbird</div>
          <div className="company-logo">Monday</div>
          <div className="company-logo">AfterPay</div>
          <div className="company-logo">SEMrush</div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage