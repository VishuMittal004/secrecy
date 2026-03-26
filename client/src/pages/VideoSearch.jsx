import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './VideoSearch.css'

function VideoSearch({ user, onLogout }) {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [pwOnly, setPwOnly] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [playingVideo, setPlayingVideo] = useState(null)

  // When navigated here from the navbar search, auto-run the search
  useEffect(() => {
    const q = searchParams.get('q')
    const pw = searchParams.get('pw') === '1'
    if (q) {
      setQuery(q)
      setPwOnly(pw)
      runSearch(q, pw)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const runSearch = async (q, pw) => {
    if (!q || !q.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    setResults([])
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(
        `${apiUrl}/api/search?q=${encodeURIComponent(q.trim())}&pw=${pw ? '1' : '0'}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Search failed'); return }
      setResults(data.videos || [])
    } catch {
      setError('Network error — check your connection')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    runSearch(query, pwOnly)
  }

  return (
    <div className="search-page">
      <Navbar user={user} onLogout={onLogout} />
      <main className="search-content">
        {/* Search Hero */}
        <section className="search-hero">
          <h1 className="search-hero-title">Find <span className="search-hero-accent">Lectures</span></h1>
          <p className="search-hero-desc">Search any topic, chapter or subject — watch it right here.</p>
          <form className="search-form" onSubmit={handleSearch} id="video-search-form">
            <div className="search-input-wrap">
              <svg className="search-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="e.g. Thermodynamics, Vectors, Organic Chemistry..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                id="video-search-input"
                autoFocus
              />
              {query && (
                <button type="button" className="search-clear-btn" onClick={() => { setQuery(''); setResults([]); setSearched(false); setError('') }} aria-label="Clear">×</button>
              )}
            </div>
            <div className="search-form-controls">
              <label className="search-pw-toggle" id="search-pw-label">
                <input type="checkbox" checked={pwOnly} onChange={(e) => setPwOnly(e.target.checked)} id="search-pw-filter" />
                <span className="search-pw-indicator" />
                <span className="search-pw-text">Physics Wallah only</span>
              </label>
              <button type="submit" className="search-submit-btn" disabled={loading} id="video-search-submit">
                {loading ? <span className="search-spinner" /> : 'Search'}
              </button>
            </div>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div className="search-error" id="search-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="search-results-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="search-card search-card-skeleton" key={i}>
                <div className="search-card-thumb-skel" />
                <div className="search-card-body-skel">
                  <div className="skel-line skel-title" />
                  <div className="skel-line skel-desc" />
                  <div className="skel-line skel-channel" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <div className="search-results-header">
              <span className="search-results-count">{results.length} results {pwOnly && <span className="search-pw-badge">Physics Wallah</span>}</span>
            </div>
            <div className="search-results-grid" id="search-results">
              {results.map((video) => (
                <div className="search-card" key={video.videoId} onClick={() => setPlayingVideo(video)} id={`result-${video.videoId}`}>
                  <div className="search-card-thumbnail">
                    <img src={video.thumbnail} alt={video.title} className="search-card-thumb-img" />
                    <div className="search-card-play-overlay">
                      <div className="search-card-play-btn">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="search-card-body">
                    <h3 className="search-card-title" dangerouslySetInnerHTML={{ __html: video.title }} />
                    <p className="search-card-desc">{video.description}</p>
                    <div className="search-card-meta">
                      <span className="search-card-channel">{video.channelTitle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="search-empty" id="search-empty">
            <div className="search-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p>No results for "<strong>{query}</strong>"</p>
            <span>{pwOnly ? 'Try turning off the Physics Wallah filter' : 'Try a different search term'}</span>
          </div>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <div className="search-initial">
            <div className="search-initial-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <p className="search-initial-text">Search for any chapter or topic</p>
            <span className="search-initial-hint">Enable the Physics Wallah filter to see only PW lectures</span>
          </div>
        )}

        {/* Video Player Modal */}
        {playingVideo && (
          <div className="search-video-overlay" onClick={() => setPlayingVideo(null)}>
            <div className="search-video-modal" onClick={(e) => e.stopPropagation()}>
              <button className="search-video-close" onClick={() => setPlayingVideo(null)}>×</button>
              <div className="search-video-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${playingVideo.videoId}?autoplay=1&rel=0`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="search-video-iframe"
                />
              </div>
              <div className="search-video-info">
                <h3 dangerouslySetInnerHTML={{ __html: playingVideo.title }} />
                <span>{playingVideo.channelTitle}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default VideoSearch
