import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleLogout = () => {
    setMenuOpen(false)
    onLogout()
    navigate('/')
  }

  const handleNavSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
  }

  return (
    <nav className="navbar" id="main-navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-title">Physics<span className="navbar-title-accent">Wallah</span></span>
      </Link>

      {/* Inline search bar — always visible */}
      <form className="navbar-search-form" onSubmit={handleNavSearch} id="navbar-search-form">
        <div className="navbar-search-wrap">
          <svg className="navbar-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search topics, chapters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="navbar-search-input"
          />
          {searchQuery && (
            <button type="button" className="navbar-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear">×</button>
          )}
        </div>
      </form>

      <div className="navbar-actions">
        {user ? (
          <div className="navbar-user">
            <button
              className="navbar-avatar"
              onClick={() => setMenuOpen(!menuOpen)}
              id="user-menu-btn"
              aria-label="User menu"
            >
              {user.displayName[0]}
            </button>
            {menuOpen && (
              <>
                <div className="navbar-menu-overlay" onClick={() => setMenuOpen(false)} />
                <div className="navbar-menu" id="user-dropdown">
                  <div className="navbar-menu-header">
                    <span className="navbar-menu-name">{user.displayName}</span>
                    <span className="navbar-menu-role">Class 11 | Student</span>
                  </div>
                  <div className="navbar-menu-divider" />
                  <button className="navbar-menu-item" onClick={() => { setMenuOpen(false); navigate('/dashboard') }}>
                    Dashboard
                  </button>
                  <button className="navbar-menu-item" onClick={() => { setMenuOpen(false); navigate('/') }}>
                    Home
                  </button>
                  {onLogout && (
                    <>
                      <div className="navbar-menu-divider" />
                      <button className="navbar-menu-item navbar-menu-logout" onClick={handleLogout} id="logout-btn">
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <Link to="/login" className="navbar-login-btn" id="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
