import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VideoSearch from './pages/VideoSearch'
import './App.css'

function App() {
  const SESSION_TTL = 8 * 60 * 60 * 1000 // 8 hours

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('studyhub_user')
    const savedAt = localStorage.getItem('studyhub_user_ts')
    if (saved && savedAt && (Date.now() - Number(savedAt)) < SESSION_TTL) {
      return JSON.parse(saved)
    }
    // Expired or missing — clear it
    localStorage.removeItem('studyhub_user')
    localStorage.removeItem('studyhub_user_ts')
    return null
  })

  useEffect(() => {
    // Verify session on mount
    const apiUrl = import.meta.env.VITE_API_URL || ''
    fetch(`${apiUrl}/api/status`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user)
          localStorage.setItem('studyhub_user', JSON.stringify(data.user))
          localStorage.setItem('studyhub_user_ts', String(Date.now()))
        } else {
          setUser(null)
          localStorage.removeItem('studyhub_user')
          localStorage.removeItem('studyhub_user_ts')
        }
      })
      .catch(() => {})

    // Keep-alive pinger: pings the server every 10 minutes while tab is open
    const interval = setInterval(() => {
      fetch(`${apiUrl}/api/status`, { credentials: 'include' })
        .catch(() => {});
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('studyhub_user', JSON.stringify(userData))
    localStorage.setItem('studyhub_user_ts', String(Date.now()))
  }

  const handleLogout = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    await fetch(`${apiUrl}/api/reset`, { method: 'POST', credentials: 'include' })
    setUser(null)
    localStorage.removeItem('studyhub_user')
    localStorage.removeItem('studyhub_user_ts')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />
        <Route path="/search" element={<VideoSearch user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
