/* ═══════════════════════════════════════════════════════════════
   MOOD ORB
   Multi-layered SVG orb with rotating outer ring, pulsing glow,
   and dynamic color transitions based on selected mood.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { MOODS } from '../constants';
import './MoodOrb.css';

export default function MoodOrb({ mood, pulsing = false }) {
  const moodData = MOODS.find((m) => m.key === mood) || MOODS[5];
  const [g1, g2] = moodData.orbGradient;

  return (
    <div className={`mood-orb ${pulsing ? 'mood-orb--pulsing' : ''}`}>
      {/* Background glow */}
      <div
        className="mood-orb__glow"
        style={{
          background: `radial-gradient(circle, ${moodData.color}30 0%, ${moodData.color}08 50%, transparent 70%)`,
        }}
      />

      <svg
        className="mood-orb__svg"
        viewBox="0 0 200 200"
        aria-label={`Mood orb showing ${moodData.label}`}
      >
        <defs>
          <radialGradient id="orb-fill-grad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor={g1} stopOpacity="0.95" />
            <stop offset="100%" stopColor={g2} stopOpacity="0.35" />
          </radialGradient>
          <filter id="orb-soft-glow">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="orb-inner-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="shadow" />
            <feOffset dx="0" dy="3" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feFlood floodColor={g2} floodOpacity="0.3" />
            <feComposite in2="SourceGraphic" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer rotating dashed ring */}
        <circle
          className="mood-orb__ring-outer"
          cx="100" cy="100" r="92"
          fill="none"
          stroke={moodData.color}
          strokeWidth="0.6"
          strokeDasharray="3 9"
          opacity="0.3"
        />

        {/* Middle pulsing ring */}
        <circle
          className="mood-orb__ring-mid"
          cx="100" cy="100" r="78"
          fill="none"
          stroke={moodData.color}
          strokeWidth="1.2"
          opacity="0.15"
        />

        {/* Inner gradient sphere with glow */}
        <circle
          cx="100" cy="100" r="58"
          fill="url(#orb-fill-grad)"
          filter="url(#orb-soft-glow)"
          opacity="0.55"
        />
        <circle
          cx="100" cy="100" r="58"
          fill="url(#orb-fill-grad)"
          filter="url(#orb-inner-shadow)"
        />

        {/* Subtle edge ring */}
        <circle
          cx="100" cy="100" r="58"
          fill="none"
          stroke={moodData.color}
          strokeWidth="0.8"
          opacity="0.25"
        />

        {/* Highlight arc */}
        <path
          d="M 68 60 Q 80 45 100 42"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Emoji */}
        <text
          x="100" y="120"
          textAnchor="middle"
          fontSize="72"
          style={{ filter: 'none' }}
        >
          {moodData.emoji}
        </text>
      </svg>
    </div>
  );
}
