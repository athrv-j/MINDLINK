/* ═══════════════════════════════════════════════════════════════
   TYPING INDICATOR
   Animated bouncing dots shown while waiting for AI response.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './TypingIndicator.css';

export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-indicator__avatar" aria-hidden="true">🌿</div>
      <div className="typing-indicator__dots" aria-label="Assistant is typing">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
    </div>
  );
}
