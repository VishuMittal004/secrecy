import React from 'react';

const MessageItem = React.memo(({ entry, id, isOwn, currentLabel, showDivider, getAvatarColor, formatTime, setReplyTo, setLightboxImage }) => {
  return (
    <React.Fragment key={entry.id}>
      {showDivider && (
        <div className="discussion-date-divider">
          <span>{currentLabel}</span>
        </div>
      )}
      <div
        className={`discussion-entry ${isOwn ? 'discussion-entry-own' : ''} ${entry.optimistic ? 'optimistic' : ''}`}
        id={`entry-${entry.id}`}
      >
        {/* Avatar — only show on other side */}
        {!isOwn && (
          <div className="discussion-entry-avatar" style={{ background: getAvatarColor(entry.author) }}>
            {entry.author[0]}
          </div>
        )}

        <div className="discussion-bubble-wrap">
          {/* Reply button on hover */}
          {!entry.optimistic && (
            <button
              className="discussion-reply-btn"
              onClick={() => setReplyTo(entry)}
              title="Reply"
              aria-label="Reply"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
            </button>
          )}

          <div className={`discussion-bubble ${isOwn ? 'discussion-bubble-own' : 'discussion-bubble-other'}`}>
            {/* Sender name — only for others */}
            {!isOwn && <span className="discussion-bubble-author">{entry.author}</span>}

            {/* Quoted reply preview */}
            {entry.replyTo && (
              <div className="discussion-reply-quote">
                <span className="discussion-reply-quote-author">{entry.replyTo.author}</span>
                {entry.replyTo.image && !entry.replyTo.content && (
                  <span className="discussion-reply-quote-text">📷 Photo</span>
                )}
                {entry.replyTo.content && (
                  <span className="discussion-reply-quote-text">{entry.replyTo.content.slice(0, 80)}{entry.replyTo.content.length > 80 ? '…' : ''}</span>
                )}
              </div>
            )}

            {entry.content && <p className="discussion-bubble-text">{entry.content}</p>}
            {entry.image && (
              <img
                src={entry.image}
                alt="Shared image"
                className="discussion-entry-image"
                onClick={() => setLightboxImage(entry.image)}
              />
            )}
            <span className="discussion-bubble-time">
              {entry.optimistic ? 'Sending...' : formatTime(entry.timestamp)}
            </span>
          </div>
        </div>

        {/* Own avatar on right */}
        {isOwn && (
          <div className="discussion-entry-avatar" style={{ background: getAvatarColor(entry.author) }}>
            {entry.author[0]}
          </div>
        )}
      </div>
    </React.Fragment>
  );
});

export default MessageItem;
