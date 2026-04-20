/* ═══════════════════════════════════════════════════════════════
   MOOD CHECK-IN VIEW
   Primary view for logging daily mood with optional note.
   Includes animated mood orb, mood pills, note textarea,
   AI-generated micro-insight after logging, and a pre-emptive
   stress warning banner when stressful events are imminent.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MOODS, PROMPTS } from '../constants';
import { api } from '../services/api';
import { filterByDays } from '../utils/helpers';
import MoodOrb from '../components/MoodOrb';
import MoodPill from '../components/MoodPill';
import InsightCard from '../components/InsightCard';
import './MoodCheckin.css';

const NEGATIVE_MOODS = ['sad', 'anxious', 'angry', 'tired'];

export default function MoodCheckin() {
  const { addEntry, entries, calendarEvents, showToast } = useApp();

  const [selected, setSelected]             = useState('neutral');
  const [note, setNote]                     = useState('');
  const [pulsing, setPulsing]               = useState(false);
  const [insight, setInsight]               = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // ── Stress banner logic ──
  const stressfulEvents = useMemo(() => calendarEvents.filter((e) => e.is_stressful), [calendarEvents]);
  const last3 = useMemo(() => filterByDays(entries, 3), [entries]);
  const recentMoodsNegative = last3.length > 0 && last3.slice(0, 2).every((e) => NEGATIVE_MOODS.includes(e.mood));

  const urgentEvent = useMemo(() => {
    if (stressfulEvents.length === 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return stressfulEvents
      .map((ev) => ({ ...ev, days: Math.round((new Date(ev.event_date) - today) / 86_400_000) }))
      .filter((ev) => ev.days >= 0 && ev.days <= 3)
      .sort((a, b) => a.days - b.days)[0] || null;
  }, [stressfulEvents]);

  const showBanner = urgentEvent !== null;

  // ── Smarter insight: passes recent history + next event ──
  const fetchInsight = useCallback(
    async (mood, noteText) => {
      setLoadingInsight(true);
      try {
        // Build rich user context
        const recentHistory = last3.slice(0, 3)
          .map((e) => `${e.mood}${e.note ? ` ("${e.note}")` : ''}`)
          .join(', ');

        const eventContext = urgentEvent
          ? ` Also note: the user has "${urgentEvent.title}" in ${urgentEvent.days === 0 ? 'today' : urgentEvent.days === 1 ? 'tomorrow' : `${urgentEvent.days} days`}.`
          : '';

        const userMessage = `Current mood: ${mood}${noteText ? `. Journal note: "${noteText}"` : ''}.
Recent mood history (last 3 entries): ${recentHistory || 'none yet'}.${eventContext}`;

        const rawText = await api.callAI([
          { role: 'system', content: PROMPTS.moodInsight },
          { role: 'user', content: userMessage }
        ], 400, 0.55, { type: 'json_object' });

        const start = rawText.indexOf('{');
        const end   = rawText.lastIndexOf('}') + 1;
        if (start > -1 && end > 0) {
          setInsight(JSON.parse(rawText.substring(start, end)));
        } else {
          setInsight({ reflection: rawText, todos: [] });
        }
      } catch (err) {
        setInsight({ reflection: 'Could not generate insight right now. Please try again later.', todos: [] });
        showToast('Insight generation failed', 'error');
      }
      setLoadingInsight(false);
    },
    [showToast, last3, urgentEvent]
  );

  const handleLog = useCallback(() => {
    addEntry(selected, note);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 750);
    showToast('Mood logged ✓');
    fetchInsight(selected, note.trim());
    setNote('');
  }, [selected, note, addEntry, showToast, fetchInsight]);

  const handleNoteChange = useCallback((e) => {
    if (e.target.value.length <= 200) setNote(e.target.value);
  }, []);

  return (
    <div className="checkin">
      {/* Header */}
      <div className="checkin__header">
        <h1>How are you feeling?</h1>
        <p className="section-subtitle">Take a moment to check in with yourself</p>
      </div>

      {/* ── Stress Warning Banner ── */}
      {showBanner && (
        <div className="checkin__stress-banner">
          <span className="checkin__stress-banner-icon">⚡</span>
          <div className="checkin__stress-banner-text">
            <strong>Heads up!</strong> You have{' '}
            <em>&ldquo;{urgentEvent.title}&rdquo;</em>{' '}
            {urgentEvent.days === 0 ? 'today' : urgentEvent.days === 1 ? 'tomorrow' : `in ${urgentEvent.days} days`}.
            {' '}Log your mood for tailored advice to help you prepare.
          </div>
        </div>
      )}

      {/* Mood Orb */}
      <div className="checkin__orb-wrapper">
        <MoodOrb mood={selected} pulsing={pulsing} />
      </div>

      {/* Mood Pills */}
      <div className="checkin__pills">
        {MOODS.map((m) => (
          <MoodPill
            key={m.key}
            mood={m}
            isSelected={selected === m.key}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Note Input */}
      <div className="checkin__note glass">
        <div className="checkin__note-header">
          <label htmlFor="mood-note" className="label-text">
            What's on your mind?
          </label>
          <span className="checkin__note-count">{note.length}/200</span>
        </div>
        <textarea
          id="mood-note"
          value={note}
          onChange={handleNoteChange}
          placeholder="Optional — jot down a thought, a feeling, a moment..."
          rows={3}
          className="checkin__textarea input-field"
          aria-label="Optional mood note"
        />
      </div>

      {/* Log Button */}
      <div className="checkin__action">
        <button
          onClick={handleLog}
          className="btn-primary checkin__log-btn"
          aria-label="Log mood entry"
        >
          <span className="checkin__log-icon">🌿</span>
          Log Mood
        </button>
      </div>

      {/* AI Insight */}
      {(loadingInsight || insight) && (
        <InsightCard title="Reflection" loading={loadingInsight}>
          {typeof insight === 'string' ? insight : insight?.reflection}

          {/* Self-care tip (new field) */}
          {insight?.self_care_tip && (
            <div className="checkin__self-care">
              <span>💆 </span>{insight.self_care_tip}
            </div>
          )}

          {insight?.todos && insight.todos.length > 0 && (
            <div className="insight-todos">
              <h4>Recommended Actions:</h4>
              {insight.todos.map((todo, i) => (
                <label key={i} className="checkin__todo-row">
                  <input type="checkbox" style={{ accentColor: 'var(--color-accent)', width: '18px', height: '18px' }} />
                  <span>{todo}</span>
                </label>
              ))}
            </div>
          )}
        </InsightCard>
      )}
    </div>
  );
}
