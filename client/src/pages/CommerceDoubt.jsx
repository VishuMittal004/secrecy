import React, { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar'
import './CommerceDoubt.css'

const MOCK_DOUBTS = [
  {
    id: 'd1',
    author: 'Rahul Sharma',
    authorId: 'u3',
    content: 'Can someone explain the difference between Capital and Revenue Expenditure with examples?',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'd2',
    author: 'Priya Verma',
    authorId: 'u4',
    content: "I'm confused about the Golden Rules of Accounting. When do we debit and when do we credit?",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'd3',
    author: 'Krati',
    authorId: 'u1',
    content: 'Revenue expenditure is for day-to-day operations like salary, while capital expenditure is for assets like machinery!',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    replyTo: {
      author: 'Rahul Sharma',
      content: 'Can someone explain the difference between Capital and Revenue Expenditure with examples?'
    }
  },
  {
    id: 'd4',
    author: 'Aman Gupta',
    authorId: 'u5',
    content: 'What are the 14 principles of management by Henri Fayol? Are they all still relevant today?',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'd5',
    author: 'Krati',
    authorId: 'u1',
    content: 'Yes Aman, most are still used in modern organizations, especially Division of Work and Unity of Command.',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
    replyTo: {
      author: 'Aman Gupta',
      content: 'What are the 14 principles of management by Henri Fayol? Are they all still relevant today?'
    }
  },
  {
    id: 'd6',
    author: 'Siddharth Malhotra',
    authorId: 'u6',
    content: 'Can someone help me with the treatment of "Interest on Drawings" in the Profit and Loss Appropriation Account?',
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(), // 48 mins ago
  },
  {
    id: 'd7',
    author: 'Ishita Kapoor',
    authorId: 'u7',
    content: 'Is it necessary to maintain a Petty Cash Book if the main Cash Book is already detailed?',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), // 30 mins ago
  },
  {
    id: 'd8',
    author: 'Varun Dhawan',
    authorId: 'u8',
    content: 'Guys, what is the exact difference between "Trade Discount" and "Cash Discount"? In which book do we record them?',
    timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString(), // 18 mins ago
  },
  {
    id: 'd9',
    author: 'Ananya Panday',
    authorId: 'u9',
    content: 'How does the "Going Concern" concept affect the valuation of assets in the balance sheet?',
    timestamp: new Date(Date.now() - 3600000 * 0.1).toISOString(), // 6 mins ago
  }
]

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const getAvatarColor = (name) => {
  const colors = [
    'linear-gradient(135deg, #1a73e8, #4a9af5)',
    'linear-gradient(135deg, #00c853, #69f0ae)',
    'linear-gradient(135deg, #ff6d00, #ffa040)',
    'linear-gradient(135deg, #e91e63, #f48fb1)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function CommerceDoubt({ user, onLogout }) {
  const [input, setInput] = useState('')
  const [doubts, setDoubts] = useState(MOCK_DOUBTS)
  const listEndRef = useRef(null)

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [doubts])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const newDoubt = {
      id: `d${doubts.length + 1}`,
      author: user.displayName,
      authorId: user.id,
      content: input,
      timestamp: new Date().toISOString()
    }

    setDoubts([...doubts, newDoubt])
    setInput('')
  }

  return (
    <div className="commerce-doubt-page">
      <Navbar user={user} onLogout={onLogout} />
      
      <main className="commerce-doubt-container">
        <header className="commerce-doubt-header">
          <div className="header-info">
            <h1>Commerce Doubt Room</h1>
            <p>Class 11 | Accounts & Business Studies</p>
          </div>
        </header>

        <div className="commerce-doubt-panel">
          <div className="discussion-list">
            {doubts.map((entry) => {
              const isOwn = entry.authorId === user.id
              return (
                <div key={entry.id} className={`discussion-entry ${isOwn ? 'discussion-entry-own' : ''}`}>
                  {!isOwn && (
                    <div className="discussion-entry-avatar" style={{ background: getAvatarColor(entry.author) }}>
                      {entry.author[0]}
                    </div>
                  )}

                  <div className="discussion-bubble-wrap">
                    <div className={`discussion-bubble ${isOwn ? 'discussion-bubble-own' : 'discussion-bubble-other'}`}>
                      {!isOwn && <span className="discussion-bubble-author">{entry.author}</span>}

                      {entry.replyTo && (
                        <div className="discussion-reply-quote">
                          <span className="discussion-reply-quote-author">{entry.replyTo.author}</span>
                          <span className="discussion-reply-quote-text">
                            {entry.replyTo.content.slice(0, 80)}{entry.replyTo.content.length > 80 ? '…' : ''}
                          </span>
                        </div>
                      )}

                      <p className="discussion-bubble-text">{entry.content}</p>
                      <span className="discussion-bubble-time">{formatTime(entry.timestamp)}</span>
                    </div>
                  </div>

                  {isOwn && (
                    <div className="discussion-entry-avatar" style={{ background: getAvatarColor(entry.author) }}>
                      {entry.author[0]}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={listEndRef} />
          </div>

          <div className="discussion-footer-area">
            <form className="discussion-input-bar" onSubmit={handleSubmit}>
              <button type="button" className="discussion-attach-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <input
                type="text"
                className="discussion-input"
                placeholder="Ask a commerce doubt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="discussion-send-btn" disabled={!input.trim()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CommerceDoubt;
