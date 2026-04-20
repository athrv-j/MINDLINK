/* ═══════════════════════════════════════════════════════════════
   STAT CARD
   Glass card for displaying a numeric stat with label.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './StatCard.css';

export default function StatCard({ label, children, accentColor }) {
  return (
    <div
      className="stat-card glass"
      style={accentColor ? { '--stat-accent': accentColor } : undefined}
    >
      <p className="stat-card__label">{label}</p>
      <div className="stat-card__value">{children}</div>
    </div>
  );
}
