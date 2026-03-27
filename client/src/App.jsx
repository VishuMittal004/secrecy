import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VideoSearch from './pages/VideoSearch'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('studyhub_user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    // Verify session on mount
    const apiUrl = import.meta.env.VITE_API_URL || ''
    fetch(`${apiUrl}/api/status`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user)
          sessionStorage.setItem('studyhub_user', JSON.stringify(data.user))
        } else {
          setUser(null)
          sessionStorage.removeItem('studyhub_user')
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
    sessionStorage.setItem('studyhub_user', JSON.stringify(userData))
  }

  const handleLogout = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    await fetch(`${apiUrl}/api/reset`, { method: 'POST', credentials: 'include' })
    setUser(null)
    sessionStorage.removeItem('studyhub_user')
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
