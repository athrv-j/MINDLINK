/* ═══════════════════════════════════════════════════════════════
   INSIGHT CARD
   AI-generated insight display with accent left border.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './InsightCard.css';

export default function InsightCard({ title, children, loading = false, icon = '✨' }) {
  return (
    <div className="insight-card glass">
      <div className="insight-card__accent" />
      <div className="insight-card__header">
        <span className="insight-card__icon">{icon}</span>
        <h4 className="insight-card__title">{title}</h4>
      </div>
      <div className="insight-card__body">
        {loading ? (
          <div className="insight-card__loading">
            <div className="insight-card__dot" style={{ animationDelay: '0s' }} />
            <div className="insight-card__dot" style={{ animationDelay: '0.15s' }} />
            <div className="insight-card__dot" style={{ animationDelay: '0.3s' }} />
          </div>
        ) : (
          <p className="insight-card__text">{children}</p>
        )}
      </div>
    </div>
  );
}
