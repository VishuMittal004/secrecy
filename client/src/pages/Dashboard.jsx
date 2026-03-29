import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CourseCard from '../components/CourseCard'
import DiscussionPanel from '../components/DiscussionPanel'
import './Dashboard.css'

// Subject-specific video pools with real YouTube titles
const PHYSICS_VIDEOS = [
  { videoId: 'VVxDTH7Ywrk', title: 'Physics Marathon 2026 — Part 1', desc: 'Complete Physics Part 1 — One Shot by Rakshak Sir' },
  { videoId: 'euRS4IJ-V-0', title: 'Physics Marathon 2026 — Part 2', desc: 'Complete Physics Part 2 — One Shot by Rakshak Sir' },
  { videoId: 'V9vUxNVaqOw', title: 'Complete Physics — JEE 2026', desc: 'All Concepts & PYQs covered in one shot for JEE 2026' },
  { videoId: 'MCFrSja9aBI', title: 'Physics Final Exam Marathon', desc: 'All Chapters covered — Final Exam Marathon' },
  { videoId: '46CaYBwEp_k', title: 'Vectors — One Shot', desc: 'All Concepts, Tricks & PYQs on Vectors — Ummeed NEET' },
]

const CHEMISTRY_VIDEOS = [
  { videoId: 'axQXgnFREe8', title: 'Organic Chemistry — One Shot', desc: 'Complete Organic Chemistry — All Concepts & PYQs — JEE' },
  { videoId: '6WT8bzC8MmQ', title: 'Organic Chemistry — Marathon', desc: 'All Chapters of Organic Chemistry — One Shot' },
  { videoId: 'BB43j3fu1E4', title: 'Basic Concepts of Chemistry', desc: 'Chapter 1 — NCERT + Equations + PYQs' },
  { videoId: 'DuPGMwYrkaQ', title: 'Physical Chemistry — Marathon', desc: 'Complete Physical Chemistry — All Chapters — One Shot' },
  { videoId: 'pE_OfctVwnw', title: 'Chemistry Marathon 2026', desc: 'Complete Chemistry Revision by Aakash Sir' },
]

const MATHS_VIDEOS = [
  { videoId: '4LxrzD-MRBk', title: 'Statistics — One Shot', desc: 'Full Chapter — Chapter 13 — Class 11 Maths' },
  { videoId: 'kcSMOgFRp6w', title: 'Trigonometric Functions — One Shot', desc: 'Full Chapter — Chapter 3 — Class 11 Maths' },
  { videoId: 'CHWhaAlo_ms', title: 'Limits & Derivatives — One Shot', desc: 'Full Chapter — Chapter 12 — Class 11 Maths' },
  { videoId: '6I-EMg_z3XY', title: 'Basic Maths — JEE One Shot', desc: 'All Concepts & PYQs — Basic to Advanced' },
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function Dashboard({ user, onLogout }) {
  const [activeVideo, setActiveVideo] = useState(null)
  const [activeTitle, setActiveTitle] = useState('')
  const [streamActive, setStreamActive] = useState(false)
  const [chatUnlocked, setChatUnlocked] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const navigate = useNavigate()
  const remoteVideoRef = useRef(null)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef(null)

  const isMini = user.id === 'u1'
  const isAvni = user.id === 'u2'

  // Easter egg: tap "Continue Learning" 5 times within 3s to reveal chat (Mini only)
  const handleEasterEgg = () => {
    if (!isMini || chatUnlocked) return
    tapCountRef.current += 1
    if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0
      }, 3000)
    }
    if (tapCountRef.current >= 5) {
      clearTimeout(tapTimerRef.current)
      tapCountRef.current = 0
      setChatUnlocked(true)
      setHasUnread(false)
    }
  }

  // Krati (u1): poll for new messages — show dot if last message is from someone else
  useEffect(() => {
    if (!isMini) return

    const apiUrl = import.meta.env.VITE_API_URL || ''

    const checkForMessages = () => {
      fetch(`${apiUrl}/api/data`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.entries && data.entries.length > 0) {
            const lastEntry = data.entries[data.entries.length - 1]
            // Show dot if the last message is NOT from Krati
            setHasUnread(lastEntry.authorId !== user.id)
          } else {
            setHasUnread(false)
          }
        })
        .catch(() => { })
    }

    // Check immediately on mount
    checkForMessages()

    // Then poll every 5 seconds
    const interval = setInterval(checkForMessages, 5000)

    return () => clearInterval(interval)
  }, [isMini, user.id])

  const courses = useMemo(() => {
    const p = pickRandom(PHYSICS_VIDEOS)
    const c = pickRandom(CHEMISTRY_VIDEOS)
    const m = pickRandom(MATHS_VIDEOS)
    return [
      { icon: '', title: p.title, description: p.desc, progress: 72, tag: 'Popular', videoId: p.videoId },
      { icon: '', title: c.title, description: c.desc, progress: 45, tag: 'Trending', videoId: c.videoId },
      { icon: '', title: m.title, description: m.desc, progress: 33, tag: 'New', videoId: m.videoId },
    ]
  }, [])

  const handlePlay = (videoId, title) => {
    setActiveVideo(videoId)
    setActiveTitle(title || 'Lecture')
  }

  // Avni: request notification permission on mount
  useEffect(() => {
    if (isAvni && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [isAvni])

  // Called by DiscussionPanel when a remote stream arrives
  const handleStreamChange = (stream) => {
    if (stream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
      setStreamActive(true)
    } else {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      setStreamActive(false)
    }
  }

  const handlePanic = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      await fetch(`${apiUrl}/api/purge`, { method: 'POST', credentials: 'include' })
    } catch { }
    localStorage.removeItem('studyhub_user')
    localStorage.removeItem('studyhub_user_ts')
    onLogout()
    navigate('/')
  }

  // ===== AVNI's DASHBOARD (no courses, big camera + chat) =====
  if (isAvni) {
    return (
      <div className="dashboard-page">
        <Navbar user={user} onLogout={onLogout} onPurge={handlePanic} />
        <main className="dashboard-content dashboard-content-avni">
          {/* Big camera feed area */}
          <section className="avni-camera-section">
            <div className="avni-camera-container">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                className="avni-camera-video"
              />
              {streamActive && <div className="avni-live-badge">LIVE</div>}
              {!streamActive && (
                <div className="avni-camera-placeholder">
                  <div className="avni-camera-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <p>Waiting for camera feed...</p>
                  <span>Feed will appear when Mini comes online</span>
                </div>
              )}
            </div>
          </section>

          {/* Discussion Section */}
          <section className="dashboard-discussion-section" id="dashboard-discussion">
            <DiscussionPanel
              user={user}
              onPanic={handlePanic}
              onStreamChange={handleStreamChange}
              onLogout={onLogout}
            />
          </section>
        </main>
      </div>
    )
  }

  // ===== EVERYONE ELSE'S DASHBOARD (courses + chat) =====
  return (
    <div className="dashboard-page">
      <Navbar user={user} onLogout={onLogout} onPurge={isAvni ? handlePanic : null} />
      <main className="dashboard-content">
        <section className="dashboard-welcome">
          <h1 className="dashboard-greeting">
            Welcome back, <span className="dashboard-name">{user.displayName}</span>
          </h1>
          <p className="dashboard-sub">Continue where you left off</p>
        </section>

        <section className="dashboard-courses" id="dashboard-courses">
          <h2
            className="dashboard-section-title"
            onClick={handleEasterEgg}
            style={isMini ? { userSelect: 'none', WebkitUserSelect: 'none', position: 'relative', display: 'inline-block' } : { position: 'relative', display: 'inline-block' }}
          >
            Continue Learning
            {isMini && hasUnread && <span className="unread-dot" />}
          </h2>
          <div className="dashboard-courses-scroll">
            {courses.map((course, i) => (
              <CourseCard
                key={i}
                {...course}
                onPlay={(vid) => handlePlay(vid, course.title)}
              />
            ))}
          </div>
        </section>

        {/* PiP YouTube video */}
        {activeVideo && (
          <div className="dashboard-pip-video">
            <div className="dashboard-pip-header">
              <span className="dashboard-pip-label">Now Playing: {activeTitle}</span>
              <button className="dashboard-pip-close" onClick={() => setActiveVideo(null)}>x</button>
            </div>
            <div className="dashboard-pip-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="Lecture Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="dashboard-pip-iframe"
              />
            </div>
          </div>
        )}

        {/* Discussion Section — hidden behind easter egg for Mini */}
        {(!isMini || chatUnlocked) && (
          <section className={`dashboard-discussion-section ${isMini && chatUnlocked ? 'chat-reveal' : ''}`} id="dashboard-discussion">
            <DiscussionPanel
              user={user}
              onPanic={null}
              onLogout={onLogout}
            />
          </section>
        )}
      </main>
    </div>
  )
}

export default Dashboard
