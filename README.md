# Secrecy — StudyHub

A full-stack real-time private communication platform disguised as an ed-tech study app. Built with **React + Vite** on the frontend and **Express + Socket.IO** on the backend.

The app looks and functions like a legitimate study platform (PhysicsWallah-inspired) with real YouTube lectures, course cards, and a study dashboard — but underneath, it has a **hidden real-time chat system**, **live WebRTC camera streaming**, **emergency panic purge**, and **remote force-logout**, all designed for complete secrecy.

---

## ✨ Features

### 🎓 Cover App — StudyHub
- Fully functional study dashboard with real YouTube JEE/NEET video lectures
- Course cards with thumbnails, progress bars, and tags (Popular, Trending, New)
- Landing page with hero banner, course grid, and stats section
- Picture-in-Picture floating video player
- Clean, responsive PhysicsWallah-inspired UI

### 💬 Hidden Chat System
- Real-time messaging via Socket.IO (WebSocket)
- Image sharing (up to 4MB, base64-encoded)
- In-memory message storage (last 200 messages)
- Smooth scroll-to-bottom with entry animations
- **Easter egg access on Mini's dashboard** — chat is hidden by default, revealed only by tapping the "Continue Learning" heading **5 times within 3 seconds**

### 📹 Live Camera Streaming (WebRTC)
- One-way live video feed from **Mini → Avni**
- Peer-to-peer WebRTC connection via STUN server (`stun.l.google.com`)
- Signaling relay through the server (offer/answer/ICE candidates)
- Live badge indicator and camera placeholder when offline
- Auto-reconnect when both users are online

### 🔴 Emergency Panic Button
- One-click **purge all messages** + instant logout
- Clears all chat entries on the server
- Broadcasts `entries-cleared` to all connected clients
- Destroys server-side session and clears cookies
- Redirects to home page instantly

### 🔌 Remote Force-Logout
- **Avni can instantly force-logout Mini** with a single button press
- Red power button appears in Avni's chat input bar when Mini is online
- Server-side socket disconnect + client-side session wipe
- Mini is immediately redirected to the home page

### 🔔 Push Notifications
- Browser notifications for new messages (Avni's account)
- Online/offline status notifications when Mini connects/disconnects
- Service Worker registration for reliable notification delivery
- Notification permission prompt on first visit

### 🔐 Session-Based Authentication
- Express-session with httpOnly cookies
- Secure cookie configuration for production (SameSite=none, Secure=true)
- Session verification on app mount
- Invite-only access (no public registration)

---

## 👥 User Roles

| Role | Description |
|---|---|
| **Streamer** | Sends camera feed, has panic button, chat hidden behind easter egg |
| **Viewer** | Receives camera feed, can force-logout streamer, gets push notifications |
| **Regular** | Standard dashboard with courses + chat |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.4 | UI framework |
| **Vite** | 8.0.1 | Build tool and dev server |
| **React Router DOM** | 7.13.1 | Client-side routing |
| **Socket.IO Client** | 4.8.3 | Real-time WebSocket communication |
| **Vanilla CSS** | — | Custom styling with CSS variables |
| **Google Fonts (Inter)** | — | Typography |
| **WebRTC** | Native | Peer-to-peer camera streaming |
| **Service Worker** | Native | Push notification support |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Express** | 4.18.2 | HTTP server and REST API |
| **Socket.IO** | 4.7.4 | Real-time bidirectional event-based communication |
| **express-session** | 1.17.3 | Server-side session management |
| **cors** | 2.8.5 | Cross-origin resource sharing |
| **uuid** | 9.0.0 | Unique IDs for chat entries |

### Deployment
| Platform | Purpose |
|---|---|
| **Vercel** | Frontend hosting (SPA with rewrites) |
| **Render** | Backend hosting (with trust proxy) |

---

## 📁 Project Structure

```
secrecy/
├── client/
│   ├── .env                          # VITE_API_URL environment variable
│   └── client/
│       ├── public/
│       │   └── sw.js                 # Service Worker for push notifications
│       ├── src/
│       │   ├── main.jsx              # App entry point + SW registration
│       │   ├── App.jsx               # Root component — routing + auth state
│       │   ├── App.css               # App-level styles
│       │   ├── index.css             # Global CSS variables + reset
│       │   ├── pages/
│       │   │   ├── Home.jsx          # Landing page — hero + course grid
│       │   │   ├── Home.css
│       │   │   ├── Dashboard.jsx     # Main dashboard — user-specific layouts
│       │   │   ├── Dashboard.css
│       │   │   ├── Login.jsx         # Login form
│       │   │   └── Login.css
│       │   └── components/
│       │       ├── Navbar.jsx        # Top navigation bar + user menu
│       │       ├── Navbar.css
│       │       ├── CourseCard.jsx    # YouTube course card component
│       │       ├── CourseCard.css
│       │       ├── DiscussionPanel.jsx  # Chat + WebRTC + panic + kick
│       │       └── DiscussionPanel.css
│       ├── vercel.json               # Vercel SPA rewrite config
│       └── package.json
└── server/
    └── server/
        ├── index.js                  # Express + Socket.IO server
        └── package.json
```

---

## 📋 Function Reference

### `main.jsx` — Entry Point

| Function | Description |
|---|---|
| Service Worker registration | Registers `/sw.js` on window load for push notification support |
| `createRoot().render()` | Mounts the `<App />` component inside React StrictMode |

---

### `App.jsx` — Root Component

| Function | Description |
|---|---|
| `App()` | Root component. Manages `user` auth state via `sessionStorage`. Sets up routing with `BrowserRouter` |
| `useState(() => ...)` | Lazy initializer — restores user from `sessionStorage` (`studyhub_user` key) on mount |
| `useEffect` (session verify) | On mount, calls `GET /api/status` to verify the session cookie is still valid server-side |
| `handleLogin(userData)` | Saves user data to state + `sessionStorage` after successful login |
| `handleLogout()` | Calls `POST /api/reset` to destroy session server-side, clears local state + `sessionStorage` |

**Routes:**
| Path | Component | Auth Required |
|---|---|---|
| `/` | `Home` | No |
| `/login` | `Login` (redirects to `/dashboard` if logged in) | No |
| `/dashboard` | `Dashboard` (redirects to `/login` if not logged in) | Yes |
| `*` | Redirects to `/` | No |

---

### `Home.jsx` — Landing Page

| Function | Description |
|---|---|
| `Home({ user, onLogout })` | Landing page with hero banner, course grid, video player modal, and stats section |
| `pickRandom(arr)` | Picks a random item from an array (used for randomizing course videos) |
| `useMemo` (courses) | Generates 6 random course cards (2 Physics, 2 Chemistry, 2 Maths) from predefined video pools |
| `playingVideo` state | Controls the full-screen YouTube video overlay modal |

**Video Pools:** `PHYSICS_VIDEOS`, `CHEMISTRY_VIDEOS`, `MATHS_VIDEOS` — arrays of real YouTube lecture video IDs with titles and descriptions.

---

### `Login.jsx` — Login Page

| Function | Description |
|---|---|
| `Login({ onLogin })` | Login form component with username/password fields |
| `handleSubmit(e)` | Sends `POST /api/verify` with credentials. On success, calls `onLogin(data.user)` and navigates to `/dashboard`. On failure, shows error message |

**States:** `username`, `password`, `error`, `loading`

---

### `Dashboard.jsx` — Main Dashboard

| Function | Description |
|---|---|
| `Dashboard({ user, onLogout })` | Main dashboard — renders different layouts based on user role |
| `pickRandom(arr)` | Random video picker (same as Home) |
| `handlePlay(videoId, title)` | Opens PiP floating YouTube video player |
| `handleStreamChange(stream)` | Callback for DiscussionPanel — attaches/detaches remote WebRTC stream to `<video>` element |
| `handlePanic()` | Emergency exit — calls `POST /api/purge`, clears session, logs out, navigates to `/` |
| `handleEasterEgg()` | Secret interaction handler — unlocks the hidden chat section for specific users |

**User-specific dashboards:**
| Role | Dashboard Layout |
|---|---|
| **Viewer** | Big camera feed area + chat panel (no courses) |
| **Streamer** | Courses + PiP video + hidden chat (revealed via easter egg) |
| **Regular** | Courses + PiP video + chat panel (always visible) |

**States:** `activeVideo`, `activeTitle`, `streamActive`, `chatUnlocked`
**Refs:** `remoteVideoRef`, `tapCountRef`, `tapTimerRef`

---

### `Navbar.jsx` — Navigation Bar

| Function | Description |
|---|---|
| `Navbar({ user, onLogout })` | Top navigation bar with StudyHub branding and user avatar dropdown |
| `handleLogout()` | Closes menu, calls `onLogout()`, navigates to `/` |

**Dropdown menu items:** Dashboard, Home, Sign Out (conditionally rendered if `onLogout` is provided).

---

### `CourseCard.jsx` — Course Card Component

| Function | Description |
|---|---|
| `CourseCard({ icon, title, description, progress, tag, videoId, onPlay })` | Renders a course card with YouTube thumbnail, play overlay, tag badge, title/description, instructor info, and progress bar |

**Thumbnail URL:** `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

---

### `DiscussionPanel.jsx` — Chat + WebRTC + Controls

| Function | Description |
|---|---|
| `DiscussionPanel({ user, onPanic, onStreamChange, onLogout })` | Full-featured chat panel with real-time messaging, WebRTC camera streaming, and control buttons |
| `scrollToBottom()` | Auto-scrolls chat list to the latest message |
| `cleanupRTC()` | Closes WebRTC peer connection, stops camera tracks, clears remote stream |
| `startStreaming(socket)` | **Mini only** — acquires camera, creates RTCPeerConnection, sends WebRTC offer to Avni via server |
| `handleOffer(offer, socket)` | **Avni only** — receives WebRTC offer, creates answer, establishes peer connection, passes remote stream to `onStreamChange` |
| `showSystemNotification(title, options)` | Shows system notification via Service Worker (fallback to standard `Notification` API) |
| `handleSubmit(e)` | Sends chat message (text and/or image) via `socket.emit('submit-entry')` |
| `handleImagePick()` | Opens native file picker for image attachment (max 4MB, converted to base64 Data URL) |
| `formatTime(timestamp)` | Converts ISO timestamp to relative format (`just now`, `5m ago`, `2h ago`, `15 Mar`) |
| `getAvatarColor(name)` | Deterministic gradient color for user avatars based on name hash |

**Socket events listened:**
| Event | Handler |
|---|---|
| `connect` | Sets `connected = true`. Avni emits `get-initial-status` |
| `disconnect` | Sets `connected = false` |
| `new-entry` | Appends message to chat list. Avni gets system notification |
| `entries-cleared` | Clears all chat entries (triggered by panic purge) |
| `viewer-ready` | **Mini** — starts camera streaming |
| `rtc-answer` | **Mini** — applies WebRTC answer from Avni |
| `rtc-offer` | **Avni** — handles incoming WebRTC offer |
| `streamer-online` | **Avni** — shows "Mini Online" toast + notification |
| `streamer-offline` | **Avni** — shows "Mini Offline" toast, cleans up RTC |
| `rtc-ice-candidate` | Both — adds ICE candidate to peer connection |
| `force-logout` | **Mini** — clears session, calls `onLogout()`, navigates to `/` |

**Control buttons in input bar:**
| Button | Visible To | Action |
|---|---|---|
| 🔴 Panic | Mini | Purges all messages + logs out |
| ⏻ Kick | Avni (when Mini is online) | Force-logs out Mini remotely |
| 📷 Attach | Everyone | Opens image file picker |
| ➤ Send | Everyone | Sends message |

---

### `sw.js` — Service Worker

| Event Handler | Description |
|---|---|
| `push` | Receives push event data, shows system notification with title, body, icon |
| `notificationclick` | Closes notification, focuses existing window or opens new one |

---

### Server — `index.js`

#### REST API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/verify` | No | Login — validates username/password, creates session |
| `GET` | `/api/status` | No | Returns `{ authenticated, user }` — checks session validity |
| `POST` | `/api/reset` | No | Logout — destroys session, clears cookie |
| `GET` | `/api/data` | Yes | Returns all chat entries from memory |
| `POST` | `/api/purge` | Yes | Deletes ALL chat entries, broadcasts `entries-cleared`, destroys session |

#### Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | Validates session, tracks socket in `connectedUsers` map |
| `disconnect` | Client → Server | Removes from `connectedUsers`. If Mini disconnects, notifies Avni |
| `get-initial-status` | Avni → Server | Checks if Mini is already online and triggers streaming if so |
| `submit-entry` | Client → Server | Creates chat entry with UUID, broadcasts `new-entry` to all |
| `rtc-offer` | Mini → Server → Avni | Relays WebRTC offer for camera streaming |
| `rtc-answer` | Avni → Server → Mini | Relays WebRTC answer back |
| `rtc-ice-candidate` | Both → Server → Other | Relays ICE candidates for NAT traversal |
| `force-logout` | Avni → Server → Mini | Force-disconnects Mini's socket, emits `force-logout` to Mini's client |

#### Server Functions

| Function | Description |
|---|---|
| `requireAuth(req, res, next)` | Express middleware — returns 401 if no valid session |
| `connectedUsers` (Map) | Tracks active socket connections by user ID (`userId → socket`) |
| Session configuration | httpOnly cookies, 24h expiry, secure in production, SameSite=none for cross-origin |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd secrecy

# Install server dependencies
cd server/server
npm install

# Install client dependencies
cd ../../client/client
npm install
```

### Environment Setup

Create `client/.env`:
```
VITE_API_URL=http://localhost:3001
```

For production, set these environment variables on your hosting platform:
- `CORS_ORIGIN` — your frontend URL (no trailing slash)
- `SESSION_SECRET` — a strong random string
- `NODE_ENV=production` — enables secure cookies

### Running Locally

```bash
# Terminal 1 — Start the backend
cd server/server
npm start
# Server runs on http://localhost:3001

# Terminal 2 — Start the frontend
cd client/client
npm run dev
# Client runs on http://localhost:5173
```

> **Note:** Login credentials are managed server-side. Contact the project owner for access.

---

## 🌐 Deployment

### Frontend (Vercel)
- Set root directory to `client/client`
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variable: `VITE_API_URL=<your-backend-url>`

### Backend (Render)
- Set root directory to `server/server`
- Start command: `npm start`
- Add environment variables: `CORS_ORIGIN`, `SESSION_SECRET`, `NODE_ENV=production`

---

## 📄 License

Private project. Not for public distribution.
