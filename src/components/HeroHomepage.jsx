import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './HeroHomepage.css'

const HeroHomepage = ({ onNavigateToImageGen, onNavigateToVideoGen, onNavigateToGallery, onNavigateToSettings, onLogout }) => {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  const handleNavigateToImageGen = () => {
    onNavigateToImageGen()
  }

  const handleNavigateToVideoGen = () => {
    onNavigateToVideoGen()
  }

  return (
    <div className="hero-homepage">
      {/* Top Navigation */}
      <nav className="hero-nav">
        <div className="nav-left">
          <button className="menu-toggle" onClick={toggleMenu}>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </button>
          <h1 className="hero-title">หน้าหลัก</h1>
        </div>
        <div className="nav-right">
          <button className="notification-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Slide-out Menu */}
        <div className={`slide-menu ${showMenu ? 'active' : ''}`}>
          <div className="menu-overlay" onClick={toggleMenu}></div>
          <div className="menu-content">
            <div className="menu-header">
              <div className="user-info">
                <div className="user-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="user-details">
                  <h3>{user?.displayName || user?.email || 'ผู้ใช้งาน'}</h3>
                  <p>{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="menu-items">
              <button className="menu-item" onClick={() => { onNavigateToSettings(); setShowMenu(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.75a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>การตั้งค่า & ราคา</span>
              </button>
              <button className="menu-item" onClick={() => { onNavigateToGallery(); setShowMenu(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>แกลเลอรี่ของฉัน</span>
              </button>
              <div className="menu-divider"></div>
              <button className="menu-item logout" onClick={onLogout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-main-title">สวัสดี, ผู้ใช้งาน</h1>
          <p className="hero-subtitle">ยินดีต้อนรับสู่แพลตฟอร์มสร้างคอนเทนต์ด้วย AI</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="services-section">
        <h2 className="services-title">บริการหลัก</h2>
        <div className="services-grid">
          {/* Image Creator */}
          <div className="service-card primary" onClick={handleNavigateToImageGen}>
            <div className="service-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>สร้างภาพ</h3>
            <p>สร้างภาพสวยงามด้วย AI</p>
          </div>

          {/* Video Creator */}
          <div className="service-card secondary" onClick={handleNavigateToVideoGen}>
            <div className="service-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="23,7 16,12 23,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>สร้างวิดีโอ</h3>
            <p>สร้างวิดีโอคุณภาพสูง</p>
          </div>

          {/* Album/Gallery */}
          <div className="service-card tertiary" onClick={onNavigateToGallery}>
            <div className="service-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>แกลเลอรี่</h3>
            <p>ดูผลงานที่สร้างแล้ว</p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <h2 className="stats-title">สถิติการใช้งาน</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>เครดิตคงเหลือ</h3>
              <p className="stat-number">100</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>ภาพที่สร้างแล้ว</h3>
              <p className="stat-number">25</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HeroHomepage