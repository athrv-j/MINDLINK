/* ═══════════════════════════════════════════════════════════════
   MOOD PILL BUTTON
   Selectable mood option with hover glow and active state.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './MoodPill.css';

export default function MoodPill({ mood, isSelected, onSelect }) {
  return (
    <button
      className={`mood-pill ${isSelected ? 'mood-pill--active' : ''}`}
      onClick={() => onSelect(mood.key)}
      aria-label={`Select mood: ${mood.label}`}
      aria-pressed={isSelected}
      style={{
        '--pill-color': mood.color,
        '--pill-color-soft': `${mood.color}18`,
        '--pill-color-border': `${mood.color}44`,
      }}
    >
      <span className="mood-pill__emoji">{mood.emoji}</span>
      <span className="mood-pill__label">{mood.label}</span>
    </button>
  );
}
