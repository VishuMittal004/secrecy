import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    setMenuOpen(false)
    onLogout()
    navigate('/')
  }

  return (
    <nav className="navbar" id="main-navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-title">Physics<span className="navbar-title-accent">Wallah</span></span>
      </Link>
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
