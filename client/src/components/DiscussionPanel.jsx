import React from 'react';
import MessageItem from './MessageItem';

const MessageList = React.memo(({ entries, user, getAvatarColor, formatTime, getDateLabel, setReplyTo, setLightboxImage, listEndRef }) => {
  if (entries.length === 0) {
    return (
      <div className="discussion-empty">
        <p>No doubts posted yet. Be the first to ask!</p>
      </div>
    );
  }

  return (
    <>
      {entries.map((entry, index) => {
        const isOwn = entry.authorId === user.id;
        const currentLabel = getDateLabel(entry.timestamp);
        const prevLabel = index > 0 ? getDateLabel(entries[index - 1].timestamp) : null;
        const showDivider = currentLabel !== prevLabel;

        return (
          <MessageItem
            key={entry.id || `temp-${index}`}
            entry={entry}
            isOwn={isOwn}
            currentLabel={currentLabel}
            showDivider={showDivider}
            getAvatarColor={getAvatarColor}
            formatTime={formatTime}
            setReplyTo={setReplyTo}
            setLightboxImage={setLightboxImage}
          />
        );
      })}
      <div ref={listEndRef} />
    </>
  );
});

export default MessageList;
