/* ═══════════════════════════════════════════════════════════════
   CHAT BUBBLE
   Message bubble with distinct styling for user vs assistant.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './ChatBubble.css';

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
      {!isUser && (
        <div className="chat-bubble__avatar" aria-hidden="true">
          🌿
        </div>
      )}
      <div className="chat-bubble__content">
        {content}
      </div>
    </div>
  );
}
