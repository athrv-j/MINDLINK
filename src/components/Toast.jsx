/* ═══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   Slide-in notification with progress bar and auto-dismiss.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './Toast.css';

export default function Toast({ message, visible, type = 'success' }) {
  if (!visible) return null;

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast__icon">
        {type === 'error' ? '⚠️' : '✓'}
      </span>
      <span className="toast__message">{message}</span>
      <div className="toast__progress" />
    </div>
  );
}
