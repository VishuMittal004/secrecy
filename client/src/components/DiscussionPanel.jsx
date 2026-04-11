import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./DiscussionPanel.css";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getDateLabel = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffTime = today - targetDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays < 7) {
    return date.toLocaleDateString("en-IN", { weekday: "long" });
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getAvatarColor = (name) => {
  const colors = [
    "linear-gradient(135deg, #1a73e8, #4a9af5)",
    "linear-gradient(135deg, #00c853, #69f0ae)",
    "linear-gradient(135deg, #ff6d00, #ffa040)",
    "linear-gradient(135deg, #e91e63, #f48fb1)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Memoized message item to prevent re-renders when other messages or typing state change
// Memoized message item for performance, now includes lazy-loading for images
const MessageItem = memo(
  ({
    entry,
    isOwn,
    showDivider,
    currentLabel,
    formatTime,
    getAvatarColor,
    onReply,
    onImageClick,
  }) => {
    const [imgSrc, setImgSrc] = useState(null)
    const [imgLoading, setImgLoading] = useState(false)

    useEffect(() => {
      // If the message has an image, fetch it lazily
      if (entry.hasImage && !imgSrc && !imgLoading) {
        setImgLoading(true)
        const apiUrl = import.meta.env.VITE_API_URL || ""
        fetch(`${apiUrl}/api/data/${entry.id}/image`, { credentials: "include" })
          .then(res => res.json())
          .then(data => {
            if (data.image) setImgSrc(data.image)
          })
          .catch(() => {})
          .finally(() => setImgLoading(false))
      }
    }, [entry.id, entry.hasImage, imgSrc, imgLoading])

    return (
      <React.Fragment>
        {showDivider && (
          <div className="discussion-date-divider">
            <span>{currentLabel}</span>
          </div>
        )}
        <div
          className={`discussion-entry ${isOwn ? "discussion-entry-own" : ""}`}
          id={`entry-${entry.id}`}
        >
          {!isOwn && (
            <div
              className="discussion-entry-avatar"
              style={{ background: getAvatarColor(entry.author) }}
            >
              {entry.author[0]}
            </div>
          )}

          <div className="discussion-bubble-wrap">
            <button
              className="discussion-reply-btn"
              onClick={() => onReply(entry)}
              title="Reply"
              aria-label="Reply"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
            </button>

            <div
              className={`discussion-bubble ${isOwn ? "discussion-bubble-own" : "discussion-bubble-other"}`}
            >
              {!isOwn && (
                <span className="discussion-bubble-author">{entry.author}</span>
              )}

              {entry.replyTo && (
                <div className="discussion-reply-quote">
                  <span className="discussion-reply-quote-author">
                    {entry.replyTo.author}
                  </span>
                  {entry.replyTo.image && !entry.replyTo.content && (
                    <span className="discussion-reply-quote-text">
                      📷 Photo
                    </span>
                  )}
                  {entry.replyTo.content && (
                    <span className="discussion-reply-quote-text">
                      {entry.replyTo.content.slice(0, 80)}
                      {entry.replyTo.content.length > 80 ? "…" : ""}
                    </span>
                  )}
                </div>
              )}

              {entry.content && (
                <p className="discussion-bubble-text">{entry.content}</p>
              )}

              {/* Lazy Loading Image Area */}
              {entry.hasImage && (
                <div className="discussion-entry-image-container">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt="Shared image"
                      className="discussion-entry-image"
                      onClick={() => onImageClick(imgSrc)}
                    />
                  ) : (
                    <div className="discussion-entry-image-placeholder">
                      {imgLoading ? (
                        <div className="image-mini-spinner"></div>
                      ) : (
                        <span className="image-placeholder-text">📷</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <span className="discussion-bubble-time">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          </div>

          {isOwn && (
            <div
              className="discussion-entry-avatar"
              style={{ background: getAvatarColor(entry.author) }}
            >
              {entry.author[0]}
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
);

// Isolated input component to prevent re-rendering the whole panel on every keystroke
const MessageInput = ({
  connected,
  onSendMessage,
  onImagePick,
  onPanic,
  onKick,
  isAvni,
  miniOnline,
  replyTo,
  onCancelReply,
  pendingImage,
  onRemoveImage,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content && !pendingImage) return;
    onSendMessage(content);
    setInput("");
  };

  return (
    <div className="discussion-footer-area">
      {replyTo && (
        <div className="discussion-reply-bar">
          <div className="discussion-reply-bar-content">
            <span className="discussion-reply-bar-author">
              {replyTo.author}
            </span>
            <span className="discussion-reply-bar-text">
              {replyTo.image && !replyTo.content
                ? "📷 Photo"
                : replyTo.content?.slice(0, 60)}
            </span>
          </div>
          <button
            className="discussion-reply-bar-close"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            ×
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="discussion-image-preview">
          <img
            src={pendingImage}
            alt="Preview"
            className="discussion-image-thumb"
          />
          <button
            type="button"
            className="discussion-image-remove"
            onClick={onRemoveImage}
          >
            x
          </button>
        </div>
      )}

      <form
        className="discussion-input-bar"
        onSubmit={handleSubmit}
        id="discussion-form"
      >
        {onPanic && (
          <button
            type="button"
            className="discussion-panic-btn"
            onClick={onPanic}
            title="Emergency exit"
            id="panic-btn"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}

        {isAvni && miniOnline && (
          <button
            type="button"
            className="discussion-kick-btn"
            onClick={onKick}
            title="Force logout Mini"
            id="kick-btn"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className="discussion-attach-btn"
          onClick={onImagePick}
          title="Attach image"
          id="attach-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <input
          type="text"
          className="discussion-input"
          placeholder="Ask a doubt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          id="discussion-input"
          autoComplete="off"
        />
        <button
          type="submit"
          className="discussion-send-btn"
          disabled={(!input.trim() && !pendingImage) || !connected}
          id="discussion-submit"
          aria-label="Post doubt"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

function DiscussionPanel({ user, onPanic, onStreamChange, onLogout }) {
  const [entries, setEntries] = useState([]);
  const [connected, setConnected] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [miniOnline, setMiniOnline] = useState(false);
  const [toast, setToast] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const listEndRef = useRef(null);
  const listRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const isHistoryLoadingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const waveTimerRef = useRef(null);

  const [hasMore, setHasMore] = useState(true);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const lastScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);

  const isMini = user.id === "u1";
  const isAvni = user.id === "u2";

  const scrollToBottom = (force = false) => {
    const isInitial = isInitialLoadRef.current;
    if (isInitial && entries.length > 0) isInitialLoadRef.current = false;

    // Prevent jerk-to-bottom if we are loading history and not explicitly forced
    if (!force && !isInitial && (isHistoryLoadingRef.current || isManualLoading)) return;

    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({
        behavior: isInitial ? "auto" : "smooth",
      });
    }
  };

  const cleanupRTC = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (onStreamChange) onStreamChange(null);
  }, [onStreamChange]);

  // Mini: acquire camera and create offer
  const startStreaming = useCallback(async (socket) => {
    // Clean up any old connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    try {
      // Get camera if not already active
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        localStreamRef.current = stream;
        console.log("[Stream] Camera acquired");
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("rtc-ice-candidate", e.candidate);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[Stream] Mini ICE:", pc.iceConnectionState);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("rtc-offer", offer);
      console.log("[Stream] Offer sent");
    } catch (err) {
      console.log("[Stream] Camera error:", err.message);
    }
  }, []);

  // Avni: handle incoming offer
  const handleOffer = useCallback(
    async (offer, socket) => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.ontrack = (e) => {
        console.log("[Stream] Track received");
        if (e.streams[0] && onStreamChange) {
          onStreamChange(e.streams[0]);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("rtc-ice-candidate", e.candidate);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[Stream] Avni ICE:", pc.iceConnectionState);
        if (
          pc.iceConnectionState === "disconnected" ||
          pc.iceConnectionState === "failed"
        ) {
          if (onStreamChange) onStreamChange(null);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("rtc-answer", answer);
      console.log("[Stream] Answer sent");
    },
    [onStreamChange],
  );

  // Helper to show system notifications via Service Worker (more reliable for mobile)
  const showSystemNotification = useCallback((title, options) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration
            .showNotification(title, {
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              ...options,
            })
            .catch((err) => {
              console.error("SW Notification error:", err);
              // Fallback to standard notification if SW fails
              new Notification(title, options);
            });
        });
      } else {
        new Notification(title, options);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch existing entries
    const apiUrl = import.meta.env.VITE_API_URL || "";

    // PHASE 1: Instant Load (Latest 15)
    fetch(`${apiUrl}/api/data?latest=15`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.entries) {
          setEntries(data.entries);
          setLoading(false);

          // PHASE 2: Wave Loading (Background Chunks) - Limit to 200 messages total
          const CHUNK_SIZE = 50;
          const BACKGROUND_LIMIT = 200;
          let currentSkip = 15;

          const loadNextWave = () => {
            // Stop if we have over the background limit already
            if (currentSkip >= BACKGROUND_LIMIT) {
              setHasMore(true); // Likely there is more, but we stop background fetch
              return;
            }

            if (waveTimerRef.current) clearTimeout(waveTimerRef.current);

            fetch(
              `${apiUrl}/api/data?skip=${currentSkip}&limit=${CHUNK_SIZE}`,
              { credentials: "include" },
            )
              .then((res) => res.json())
              .then((waveData) => {
                if (waveData.entries && waveData.entries.length > 0) {
                  setEntries((prev) => {
                    const existingIds = new Set(prev.map((e) => e.id));
                    const newEntries = waveData.entries.filter(
                      (e) => !existingIds.has(e.id),
                    );
                    return [...newEntries, ...prev];
                  });

                  if (waveData.entries.length === CHUNK_SIZE) {
                    currentSkip += CHUNK_SIZE;
                    isHistoryLoadingRef.current = true;
                    waveTimerRef.current = setTimeout(loadNextWave, 2000);
                  } else {
                    isHistoryLoadingRef.current = false;
                    setHasMore(false);
                  }
                } else {
                  isHistoryLoadingRef.current = false;
                  setHasMore(false);
                }
              })
              .catch(() => {
                isHistoryLoadingRef.current = false;
              });
          };

          waveTimerRef.current = setTimeout(loadNextWave, 5000);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const socket = io(apiUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (isAvni) socket.emit("get-initial-status");
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("new-entry", (entry) => {
      setEntries((prev) => [...prev, entry]);

      // Force scroll to bottom on *new* message from socket
      setTimeout(() => scrollToBottom(true), 100);

      // Avni: show notification when someone messages
      if (isAvni && entry.authorId !== user.id) {
        showSystemNotification("StudyHub", {
          body: `${entry.author}: ${entry.content || (entry.image ? "sent an image" : "")}`,
          tag: "studyhub-msg",
        });
      }
    });

    socket.on("entries-cleared", () => {
      setEntries([]);
    });

    // Mini: listen for force-logout from Avni
    if (isMini) {
      socket.on("force-logout", () => {
        localStorage.removeItem("studyhub_user");
        localStorage.removeItem("studyhub_user_ts");
        if (onLogout) onLogout();
        navigate("/");
      });
    }

    // --- Mini: camera streaming ---
    if (isMini) {
      // Request camera immediately on mount so it's ready
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        })
        .then((stream) => {
          localStreamRef.current = stream;
          console.log("[Stream] Camera pre-acquired on mount");
        })
        .catch(() => {
          console.log("[Stream] Camera denied on mount");
        });

      // When avni comes online (or is already online), create the connection
      socket.on("viewer-ready", () => {
        console.log("[Stream] viewer-ready received");
        startStreaming(socket);
      });

      socket.on("rtc-answer", async (answer) => {
        if (
          pcRef.current &&
          pcRef.current.signalingState === "have-local-offer"
        ) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
          console.log("[Stream] Answer applied");
        }
      });
    }

    // --- Avni: receive stream ---
    if (isAvni) {
      socket.on("rtc-offer", (offer) => {
        console.log("[Stream] Offer received");
        handleOffer(offer, socket);
      });

      socket.on("streamer-online", () => {
        console.log("[Stream] Mini came online");
        setMiniOnline(true);
        setToast({ message: "Mini is now online", type: "online" });
        setTimeout(() => setToast(null), 3000);

        showSystemNotification("StudyHub", {
          body: "Mini is now online",
          tag: "studyhub-online",
        });
      });

      socket.on("streamer-offline", () => {
        console.log("[Stream] Streamer offline");
        setMiniOnline(false);
        setToast({ message: "Mini went offline", type: "offline" });
        setTimeout(() => setToast(null), 3000);
        cleanupRTC();

        showSystemNotification("StudyHub", {
          body: "Mini went offline",
          tag: "studyhub-offline",
        });
      });
    }

    // Both: ICE candidates
    socket.on("rtc-ice-candidate", (candidate) => {
      if (pcRef.current) {
        pcRef.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(() => {});
      }
    });

    return () => {
      cleanupRTC();
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [entries]);

  // Adjust scroll position after prepending history to prevent "jumping"
  useLayoutEffect(() => {
    if (isPrependingRef.current && listRef.current) {
      const delta = listRef.current.scrollHeight - lastScrollHeightRef.current;
      listRef.current.scrollTop += delta;
      isPrependingRef.current = false;
    }
  }, [entries]);

  const handleLoadMore = useCallback(() => {
    if (isManualLoading || !hasMore) return;
    setIsManualLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL || "";
    const currentSkip = entries.length;
    const CHUNK_SIZE = 50;

    if (listRef.current) {
      lastScrollHeightRef.current = listRef.current.scrollHeight;
      isPrependingRef.current = true;
    }

    fetch(`${apiUrl}/api/data?skip=${currentSkip}&limit=${CHUNK_SIZE}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((waveData) => {
        if (waveData.entries && waveData.entries.length > 0) {
          setEntries((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEntries = waveData.entries.filter(
              (e) => !existingIds.has(e.id),
            );
            return [...newEntries, ...prev];
          });
          if (waveData.entries.length < CHUNK_SIZE) setHasMore(false);
        } else {
          setHasMore(false);
        }
      })
      .catch(() => {})
      .finally(() => setIsManualLoading(false));
  }, [entries.length, isManualLoading, hasMore]);

  // Refresh timestamps every 30 seconds + on tab focus
  const [, setTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setTick(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleSendMessage = useCallback(
    (content) => {
      if (!socketRef.current) return;
      socketRef.current.emit("submit-entry", {
        content,
        image: pendingImage,
        replyTo: replyTo
          ? {
              id: replyTo.id,
              author: replyTo.author,
              content: replyTo.content,
              image: replyTo.image,
            }
          : null,
      });
      setPendingImage(null);
      setReplyTo(null);
    },
    [pendingImage, replyTo],
  );

  const handleImagePick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        alert("Image must be under 4MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPendingImage(reader.result);
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  };

  return (
    <div className="discussion-panel" id="discussion-panel">
      <div className="discussion-header">
        <div className="discussion-header-left">
          <div>
            <h2 className="discussion-title">Doubt Section</h2>
            <p className="discussion-subtitle">
              Ask questions, share notes, and resolve doubts
            </p>
          </div>
        </div>
        {isAvni && (
          <div
            className={`mini-status-badge ${miniOnline ? "online" : "offline"}`}
          >
            <span className="status-dot"></span>
            {miniOnline ? "Mini Online" : "Mini Offline"}
            {Notification.permission === "default" && (
              <button
                className="enable-notifs-btn"
                onClick={() =>
                  Notification.requestPermission().then(() =>
                    window.location.reload(),
                  )
                }
                title="Enable browser notifications"
              >
                🔔
              </button>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className={`discussion-toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="discussion-list" ref={listRef} id="discussion-entries">
        {loading ? (
          <div className="discussion-loading-main">
            <div className="chat-spinner"></div>
            <p>Loading chats...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="discussion-empty">
            <p>No doubts posted yet. Be the first to ask!</p>
          </div>
        ) : (
          <React.Fragment>
            {hasMore && (
              <div className="discussion-load-more">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={isManualLoading}
                >
                  {isManualLoading
                    ? "Loading history..."
                    : "Load Older Messages"}
                </button>
              </div>
            )}
            {entries.map((entry, index) => {
              const isOwn = entry.authorId === user.id;
              const currentLabel = getDateLabel(entry.timestamp);
              const prevLabel =
                index > 0 ? getDateLabel(entries[index - 1].timestamp) : null;
              const showDivider = currentLabel !== prevLabel;

              return (
                <MessageItem
                  key={entry.id}
                  entry={entry}
                  isOwn={isOwn}
                  showDivider={showDivider}
                  currentLabel={currentLabel}
                  formatTime={formatTime}
                  getAvatarColor={getAvatarColor}
                  onReply={setReplyTo}
                  onImageClick={setLightboxImage}
                />
              );
            })}
          </React.Fragment>
        )}
        <div ref={listEndRef} />
      </div>

      <MessageInput
        connected={connected}
        onSendMessage={handleSendMessage}
        onImagePick={handleImagePick}
        onPanic={onPanic}
        onKick={() =>
          socketRef.current && socketRef.current.emit("force-logout")
        }
        isAvni={isAvni}
        miniOnline={miniOnline}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        pendingImage={pendingImage}
        onRemoveImage={() => setPendingImage(null)}
      />
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="discussion-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="discussion-lightbox-close"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="discussion-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default DiscussionPanel;
