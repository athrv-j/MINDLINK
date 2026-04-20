import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MOODS } from '../constants';
import { api } from '../services/api';
import {
  filterByDays,
  calculateStreak,
  getMostCommonMood,
  computeRiskScore,
  getRiskBand,
  predictNextMood,
  getTimeOfDayPattern,
  buildFullContext,
} from '../utils/helpers';
import StatCard from '../components/StatCard';
import MoodChart from '../components/MoodChart';
import './Insights.css';

/* ───────── HELPERS ───────── */

const moodScore = { sad: 2, neutral: 5, calm: 7, happy: 9, angry: 3, anxious: 3, energized: 8, tired: 4 };

function calculateScore(entries) {
  if (!entries || entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + (moodScore[e.mood] || 5), 0);
  return Math.round((total / entries.length) * 10);
}

function calculateTrend(last7) {
  if (!last7 || last7.length < 2) return 0;
  const first = moodScore[last7[last7.length - 1]?.mood] || 5;
  const last  = moodScore[last7[0]?.mood] || 5;
  return last - first;
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/* ───────── COMPONENT ───────── */

export default function Insights() {
  const { entries, showToast, user, calendarEvents } = useApp();

  const [summary, setSummary]           = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // DATA
  const last14       = useMemo(() => filterByDays(entries, 14), [entries]);
  const last7        = useMemo(() => filterByDays(entries, 7),  [entries]);
  const streak       = useMemo(() => calculateStreak(entries),  [entries]);
  const topMoodKey   = useMemo(() => getMostCommonMood(last7),  [last7]);
  const topMood      = MOODS.find((m) => m.key === topMoodKey);
  const score        = useMemo(() => calculateScore(entries),   [entries]);
  const trend        = useMemo(() => calculateTrend(last7),     [last7]);
  const timePattern  = useMemo(() => getTimeOfDayPattern(entries), [entries]);

  // PREDICTIVE
  const stressfulEvents = useMemo(() => calendarEvents.filter((e) => e.is_stressful), [calendarEvents]);
  const riskScore    = useMemo(() => computeRiskScore(entries, stressfulEvents), [entries, stressfulEvents]);
  const riskBand     = useMemo(() => getRiskBand(riskScore),                     [riskScore]);
  const predictedMood = useMemo(() => predictNextMood(entries, riskScore),       [entries, riskScore]);
  const predictedMoodDef = MOODS.find((m) => m.key === predictedMood);

  // AI WEEKLY SUMMARY
  const fetchWeeklySummary = async () => {
    if (last7.length === 0) {
      showToast('No mood data this week', 'error');
      return;
    }
    setLoadingSummary(true);

    const fullContext = buildFullContext(last7, stressfulEvents);
    const stressfulContext = stressfulEvents.length > 0
      ? `\n\nUpcoming stressful calendar events:\n${stressfulEvents
          .map((e) => `- "${e.title}" in ${daysUntil(e.event_date)} day(s) (${e.event_date})`)
          .join('\n')}`
      : '';

    try {
      const raw = await api.callAI(
        [
          { role: 'system', content: `You are a compassionate mental wellness coach.\n\nReturn JSON:\n{\n "reflection": "short human insight based on mood history and upcoming stressful events",\n "pattern": "pattern detected in mood",\n "trigger": "possible stress triggers including upcoming events",\n "focus": "what to improve or prepare for",\n "mood_forecast": "predicted mood for next 3 days and why",\n "risk_level": "Low | Moderate | High",\n "calendar_prep": "specific preparation advice for most critical upcoming event (omit key if no events)",\n "self_care_tip": "one targeted self-care tip for this person right now",\n "todos": ["2-3 concrete actions"]\n}` },
          { role: 'user', content: `Full context: ${fullContext}\n\nMood entries (last 7 days): ${JSON.stringify(last7)}${stressfulContext}` }
        ],
        600, 0.6, { type: 'json_object' }
      );

      const start = raw.indexOf('{');
      const end   = raw.lastIndexOf('}') + 1;
      if (start !== -1 && end !== -1) {
        setSummary(JSON.parse(raw.substring(start, end)));
      } else {
        setSummary({ reflection: raw });
      }
    } catch (e) {
      showToast('AI failed', 'error');
    }
    setLoadingSummary(false);
  };

  return (
    <div className="insights">

      {/* HEADER */}
      <div className="insights__header">
        <h1>Insights</h1>
        <p>Your mood patterns, predictions &amp; upcoming stress signals</p>
      </div>

      {/* STATS */}
      <div className="insights__stats">
        <StatCard label="Mental Score">{score}%</StatCard>
        <StatCard label="Mood Streak">{streak} days</StatCard>
        <StatCard label="Trend">
          {trend > 0 ? '📈 Improving' : trend < 0 ? '📉 Declining' : '➖ Stable'}
        </StatCard>
        <StatCard label="Top Mood">
          {topMood ? (
            <div className="insights__top-mood">
              <span className="insights__top-emoji">{topMood.emoji}</span>
              <span>{topMood.label}</span>
            </div>
          ) : 'No data'}
        </StatCard>
      </div>

      {/* ── RISK PREDICTOR CARD ── */}
      {entries.length >= 2 && (
        <div className="insights__risk-card" style={{ borderColor: riskBand.color, background: riskBand.bg }}>
          <div className="insights__risk-left">
            <span className="insights__risk-label">Tomorrow's Forecast</span>
            <div className="insights__risk-predicted">
              <span className="insights__risk-emoji">{predictedMoodDef?.emoji || '😐'}</span>
              <span className="insights__risk-mood">{predictedMoodDef?.label || 'Neutral'}</span>
            </div>
            {timePattern && (
              <span className="insights__risk-pattern">
                📍 You usually log in the {timePattern}
              </span>
            )}
          </div>
          <div className="insights__risk-right">
            <div className="insights__risk-score-ring" style={{ '--ring-color': riskBand.color }}>
              <span className="insights__risk-score-num">{riskScore}</span>
              <span className="insights__risk-score-label">risk</span>
            </div>
            <span className="insights__risk-band" style={{ color: riskBand.color }}>
              {riskBand.icon} {riskBand.label} Risk
            </span>
            {stressfulEvents.length > 0 && (
              <span className="insights__risk-events-note">
                ⚡ {stressfulEvents.length} stressful event{stressfulEvents.length > 1 ? 's' : ''} upcoming
              </span>
            )}
          </div>
        </div>
      )}

      {/* CHART */}
      <MoodChart entries={last14} />

      {/* ── CALENDAR PANEL — always visible ── */}
      <div className="insights__calendar-panel">
        <div className="insights__calendar-panel-header">
          <span className="insights__calendar-panel-icon">📅</span>
          <div>
            <h3 className="insights__calendar-panel-title">Calendar Events</h3>
            <span className="insights__calendar-panel-sub">
              {calendarEvents.length > 0
                ? `${calendarEvents.length} event${calendarEvents.length !== 1 ? 's' : ''} synced · ${stressfulEvents.length} stressful`
                : 'No calendar synced yet'}
            </span>
          </div>
        </div>

        {calendarEvents.length === 0 ? (
          <div className="insights__calendar-empty">
            <p className="insights__calendar-empty-text">
              Connect your calendar to get proactive stress predictions.
            </p>
            <p className="insights__calendar-empty-hint">
              → Go to <strong>Settings → Calendar Integration</strong> to paste your .ics link.
            </p>
          </div>
        ) : (
          <div className="insights__calendar-events">
            {calendarEvents.map((event) => {
              const days = daysUntil(event.event_date);
              const urgency = event.is_stressful
                ? (days <= 2 ? 'urgent' : days <= 7 ? 'soon' : 'stressful')
                : 'normal';
              return (
                <div key={event.id} className={`insights__cal-item insights__cal-item--${urgency}`}>
                  <div className="insights__cal-item-left">
                    <span className="insights__cal-item-dot" />
                    <div>
                      <span className="insights__cal-item-title">{event.title}</span>
                      {event.is_stressful && event.stress_reason && (
                        <span className="insights__cal-item-reason">{event.stress_reason}</span>
                      )}
                    </div>
                  </div>
                  <div className="insights__cal-item-right">
                    <span className="insights__cal-item-days">
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                    <span className="insights__cal-item-date">{event.event_date}</span>
                    {event.is_stressful && (
                      <span className="insights__cal-item-badge">⚡ stressful</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {stressfulEvents.length > 0 && (
          <p className="insights__calendar-tip">
            💡 Tap <strong>AI Weekly Summary</strong> below for personalised advice based on these events.
          </p>
        )}
      </div>

      {/* AI SUMMARY BUTTON */}
      <div className="insights__summary-action">
        <button onClick={fetchWeeklySummary}>
          {loadingSummary ? '⏳ Analysing...' : '🧠 AI Weekly Summary'}
        </button>
      </div>

      {/* AI SUMMARY RESULT — rich structured card */}
      {summary && (
        <div className="insights__ai-card">

          {/* Risk badge from AI */}
          {summary.risk_level && (
            <div className={`insights__ai-risk-badge insights__ai-risk-badge--${summary.risk_level.toLowerCase()}`}>
              {summary.risk_level === 'High' ? '🔴' : summary.risk_level === 'Moderate' ? '🟡' : '🟢'}
              &nbsp;{summary.risk_level} Risk Level
            </div>
          )}

          {/* Reflection */}
          <p className="insights__ai-reflection">{summary.reflection}</p>

          <div className="insights__ai-grid">
            {summary.pattern && (
              <div className="insights__ai-block">
                <h4>🔍 Pattern</h4>
                <p>{summary.pattern}</p>
              </div>
            )}
            {summary.trigger && (
              <div className="insights__ai-block">
                <h4>⚡ Trigger</h4>
                <p>{summary.trigger}</p>
              </div>
            )}
            {summary.focus && (
              <div className="insights__ai-block">
                <h4>🎯 Focus This Week</h4>
                <p>{summary.focus}</p>
              </div>
            )}
            {summary.mood_forecast && (
              <div className="insights__ai-block insights__ai-block--forecast">
                <h4>🔮 3-Day Forecast</h4>
                <p>{summary.mood_forecast}</p>
              </div>
            )}
          </div>

          {summary.calendar_prep && (
            <div className="insights__ai-calendar-prep">
              <h4>📅 Event Preparation</h4>
              <p>{summary.calendar_prep}</p>
            </div>
          )}

          {summary.self_care_tip && (
            <div className="insights__ai-self-care">
              <span className="insights__ai-self-care-icon">💆</span>
              <p>{summary.self_care_tip}</p>
            </div>
          )}

          {summary.todos && summary.todos.length > 0 && (
            <div className="insights__ai-todos">
              <h4>✅ Your Action Plan</h4>
              <ul>
                {summary.todos.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* EMPTY */}
      {last14.length === 0 && (
        <div className="insights__empty">
          <p>Log your first mood to unlock insights and predictions ✨</p>
        </div>
      )}

    </div>
  );
}