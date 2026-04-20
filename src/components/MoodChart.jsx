/* ═══════════════════════════════════════════════════════════════
   MOOD FREQUENCY CHART
   Pure SVG bar chart with animated grow-in bars, hover tooltips,
   and grid lines. No chart library dependencies.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { MOODS } from '../constants';
import './MoodChart.css';

const BAR_WIDTH = 38;
const BAR_GAP = 16;
const CHART_HEIGHT = 150;
const LABEL_HEIGHT = 35;

export default function MoodChart({ entries }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Count frequencies
  const freq = {};
  MOODS.forEach((m) => (freq[m.key] = 0));
  entries.forEach((e) => {
    if (freq[e.mood] !== undefined) freq[e.mood]++;
  });
  const maxFreq = Math.max(...Object.values(freq), 1);

  const chartWidth = MOODS.length * (BAR_WIDTH + BAR_GAP);
  const totalHeight = CHART_HEIGHT + LABEL_HEIGHT;

  return (
    <div className="mood-chart glass">
      <h3 className="mood-chart__title">Mood Frequency</h3>
      <p className="mood-chart__subtitle">Last 14 days</p>

      <div className="mood-chart__wrapper">
        <svg
          width={chartWidth}
          height={totalHeight}
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          role="img"
          aria-label="Mood frequency bar chart for the last 14 days"
          className="mood-chart__svg"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={CHART_HEIGHT * (1 - pct)}
              x2={chartWidth}
              y2={CHART_HEIGHT * (1 - pct)}
              stroke="rgba(127, 255, 110, 0.04)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          ))}

          {/* Baseline */}
          <line
            x1="0" y1={CHART_HEIGHT}
            x2={chartWidth} y2={CHART_HEIGHT}
            stroke="rgba(127, 255, 110, 0.08)"
            strokeWidth="1"
          />

          {/* Bars */}
          {MOODS.map((m, i) => {
            const x = i * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
            const ratio = maxFreq > 0 ? freq[m.key] / maxFreq : 0;
            const barHeight = ratio * CHART_HEIGHT;
            const y = CHART_HEIGHT - barHeight;
            const isHovered = hoveredBar === m.key;

            return (
              <g
                key={m.key}
                onMouseEnter={() => setHoveredBar(m.key)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover background */}
                <rect
                  x={x - 4}
                  y={0}
                  width={BAR_WIDTH + 8}
                  height={CHART_HEIGHT}
                  fill={isHovered ? 'rgba(127,255,110,0.03)' : 'transparent'}
                  rx="6"
                />

                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  rx={8}
                  ry={8}
                  fill={m.color}
                  opacity={isHovered ? 0.9 : 0.65}
                  className="mood-chart__bar"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    transformOrigin: `${x + BAR_WIDTH / 2}px ${CHART_HEIGHT}px`,
                  }}
                />

                {/* Bar glow on hover */}
                {isHovered && barHeight > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={barHeight}
                    rx={8}
                    ry={8}
                    fill="none"
                    stroke={m.color}
                    strokeWidth="1"
                    opacity="0.4"
                  />
                )}

                {/* Count label */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill={isHovered ? m.color : `${m.color}99`}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="var(--font-body)"
                  className="mood-chart__count"
                >
                  {freq[m.key]}
                </text>

                {/* Emoji label */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT + 24}
                  textAnchor="middle"
                  fontSize="18"
                  className="mood-chart__emoji"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 4px ${m.color}66)` : 'none',
                  }}
                >
                  {m.emoji}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
