const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// --- Config ---
const PORT = process.env.PORT || 3001;
const SESSION_SECRET = "studyhub_s3cr3t_key_2024";

// Hardcoded users
const USERS = [
  { id: "u1", username: "krati", password: "krishna", displayName: "Krati" },
  { id: "u2", username: "avni", password: "krishna", displayName: "Avni" },
  { id: "u3", username: "vishi", password: "krishna", displayName: "Vishi" },
  { id: "u4", username: "vibhuti", password: "krishna", displayName: "Vibhuti" },
];

// In-memory discussion entries
const entries = [];

// --- Middleware ---
const sessionOptions = {
  secret: process.env.SESSION_SECRET || SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
const sessionMiddleware = session(sessionOptions);

let allowedOrigin = process.env.CORS_ORIGIN || [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// Remove trailing slash if exists
if (typeof allowedOrigin === "string") {
  allowedOrigin = allowedOrigin.replace(/\/$/, "");
}

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(sessionMiddleware);

// --- Auth middleware ---
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// --- Routes ---

// ✅ FIXED LOGIN ROUTE
app.post("/api/verify", (req, res) => {
  let { username, password } = req.body;

  // Trim username only (correct practice)
  const usernameInput = username?.trim();
  const passwordInput = password; // DO NOT trim password

  console.log(`[Auth] Login attempt: ${usernameInput}`);

  const user = USERS.find(
    (u) =>
      u.username === usernameInput &&
      u.password === passwordInput
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
});

// Check auth status
app.get("/api/status", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  return res.json({ authenticated: false });
});

// Logout
app.post("/api/reset", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed" });
    res.clearCookie("connect.sid");
    return res.json({ success: true });
  });
});

// Get entries
app.get("/api/data", requireAuth, (req, res) => {
  return res.json({ entries });
});

// Purge
app.post("/api/purge", requireAuth, (req, res) => {
  entries.length = 0;
  io.emit("entries-cleared");

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed" });
    res.clearCookie("connect.sid");
    return res.json({ success: true });
  });
});

// --- Socket.io ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
  maxHttpBufferSize: 5e6,
});

io.engine.use(sessionMiddleware);

const connectedUsers = new Map();

io.on("connection", (socket) => {
  const session = socket.request.session;

  if (!session || !session.user) {
    socket.disconnect(true);
    return;
  }

  const user = session.user;
  console.log(`[StudyHub] ${user.displayName} connected`);

  connectedUsers.set(user.id, socket);

  if (user.id === "u1") {
    const avniSocket = connectedUsers.get("u2");
    if (avniSocket) {
      socket.emit("viewer-ready");
      avniSocket.emit("streamer-online");
    }
  }

  if (user.id === "u2") {
    const miniSocket = connectedUsers.get("u1");
    if (miniSocket) {
      miniSocket.emit("viewer-ready");
      socket.emit("streamer-online");
    }
  }

  socket.on("get-initial-status", () => {
    if (user.id === "u2") {
      if (connectedUsers.has("u1")) {
        socket.emit("streamer-online");
        const miniSocket = connectedUsers.get("u1");
        if (miniSocket) miniSocket.emit("viewer-ready");
      } else {
        socket.emit("streamer-offline");
      }
    }
  });

  socket.on("rtc-offer", (offer) => {
    if (user.id === "u1") {
      const avniSocket = connectedUsers.get("u2");
      if (avniSocket) avniSocket.emit("rtc-offer", offer);
    }
  });

  socket.on("rtc-answer", (answer) => {
    if (user.id === "u2") {
      const miniSocket = connectedUsers.get("u1");
      if (miniSocket) miniSocket.emit("rtc-answer", answer);
    }
  });

  socket.on("rtc-ice-candidate", (candidate) => {
    const targetId = user.id === "u1" ? "u2" : "u1";
    const targetSocket = connectedUsers.get(targetId);
    if (targetSocket) targetSocket.emit("rtc-ice-candidate", candidate);
  });

  socket.on("force-logout", () => {
    if (user.id !== "u2") return;
    const miniSocket = connectedUsers.get("u1");
    if (miniSocket) {
      miniSocket.emit("force-logout");
      miniSocket.disconnect(true);
    }
  });

  socket.on("submit-entry", (data) => {
    const entry = {
      id: uuidv4(),
      author: user.displayName,
      authorId: user.id,
      content: data.content || "",
      image: data.image || null,
      timestamp: new Date().toISOString(),
    };

    entries.push(entry);

    if (entries.length > 200) {
      entries.splice(0, entries.length - 200);
    }

    io.emit("new-entry", entry);
  });

  socket.on("disconnect", () => {
    console.log(`[StudyHub] ${user.displayName} disconnected`);
    connectedUsers.delete(user.id);

    if (user.id === "u1") {
      const avniSocket = connectedUsers.get("u2");
      if (avniSocket) avniSocket.emit("streamer-offline");
    }
  });
});

// --- Start ---
server.listen(PORT, () => {
  console.log(`[StudyHub] Server running on http://localhost:${PORT}`);
});
