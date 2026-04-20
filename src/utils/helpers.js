/* ═══════════════════════════════════════════════════════════════
   HELPER UTILITIES
   Pure functions with no side effects. Used across the app.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate a unique ID. Uses crypto.randomUUID when available,
 * falls back to a timestamp-based approach.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).slice(2, 10) +
    '-' +
    Date.now().toString(36)
  );
}

/**
 * Number of calendar days between two date values.
 */
export function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor(Math.abs(a - b) / 86_400_000);
}

/**
 * Format an ISO timestamp to a short date string: "Apr 18"
 */
export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO timestamp to time: "3:45 PM"
 */
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Calculate the current logging streak (consecutive days from today).
 */
export function calculateStreak(entries) {
  if (entries.length === 0) return 0;

  const loggedDays = new Set();
  entries.forEach((e) => loggedDays.add(new Date(e.timestamp).toDateString()));

  let streak = 0;
  const cursor = new Date();

  while (loggedDays.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Get mood frequency counts from entries.
 * Returns an object: { happy: 3, sad: 1, ... }
 */
export function getMoodFrequency(entries) {
  const freq = {};
  entries.forEach((e) => {
    freq[e.mood] = (freq[e.mood] || 0) + 1;
  });
  return freq;
}

/**
 * Get the most common mood from entries.
 * Returns the mood key string, or null if no entries.
 */
export function getMostCommonMood(entries) {
  const freq = getMoodFrequency(entries);
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

/**
 * Filter entries to the last N days from now.
 */
export function filterByDays(entries, days) {
  const now = new Date();
  return entries.filter((e) => daysBetween(e.timestamp, now) < days);
}

/**
 * Build a natural-language summary of recent mood entries
 * for use in the chatbot's system prompt.
 */
export function buildMoodContext(entries) {
  const recent = entries.slice(0, 5);
  if (recent.length === 0) return 'No mood history available yet.';

  return recent
    .map((e) => {
      const date = formatShortDate(e.timestamp);
      const note = e.note ? ` ("${e.note}")` : '';
      return `${date}: felt ${e.mood}${note}`;
    })
    .join('; ');
}

/**
 * Trigger a browser download of JSON data.
 */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════
   PREDICTIVE ANALYTICS HELPERS
   ═══════════════════════════════════════════════════════════════ */

const MOOD_SCORE = {
  happy: 9, energized: 8, calm: 7, neutral: 5,
  sad: 2, angry: 3, anxious: 3, tired: 4,
};

/**
 * Compute a 0–100 risk score from mood history + upcoming stressful events.
 * Higher score = more at-risk.
 * Components:
 *   - Average mood level this week        (0–50 pts)
 *   - Declining trend                     (−10 to +15 pts)
 *   - Stressful calendar events ≤ 7 days  (0–35 pts)
 */
export function computeRiskScore(entries, stressfulEvents = []) {
  if (entries.length === 0) return 0;

  const last7 = filterByDays(entries, 7);

  // 1. Average mood risk (low mood = high risk)
  const avgScore = last7.length > 0
    ? last7.reduce((s, e) => s + (MOOD_SCORE[e.mood] || 5), 0) / last7.length
    : 5;
  const moodRisk = Math.round(((9 - avgScore) / 8) * 50); // 0–50

  // 2. Trend risk (declining moods = +15, improving = −10)
  let trendRisk = 0;
  if (last7.length >= 2) {
    const oldest = MOOD_SCORE[last7[last7.length - 1]?.mood] || 5;
    const newest = MOOD_SCORE[last7[0]?.mood] || 5;
    if (newest < oldest) trendRisk = 15;
    else if (newest > oldest) trendRisk = -10;
  }

  // 3. Calendar pressure (upcoming stressful events in next 7 days)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const urgentCount = stressfulEvents.filter((ev) => {
    const diff = Math.round((new Date(ev.event_date) - today) / 86_400_000);
    return diff >= 0 && diff <= 7;
  }).length;
  const calendarRisk = Math.min(urgentCount * 12, 35); // 0–35

  return Math.min(100, Math.max(0, moodRisk + trendRisk + calendarRisk));
}

/**
 * Map a numeric risk score to a labelled band with colour tokens.
 */
export function getRiskBand(score) {
  if (score >= 70) return { label: 'High',     color: '#ff4f4f', bg: 'rgba(255,79,79,0.1)',   icon: '🔴' };
  if (score >= 40) return { label: 'Moderate', color: '#ffa44f', bg: 'rgba(255,164,79,0.1)', icon: '🟡' };
  return              { label: 'Low',      color: '#00ffc8', bg: 'rgba(0,255,200,0.08)',  icon: '🟢' };
}

/**
 * Predict the most likely next mood based on recent trend + risk score.
 */
export function predictNextMood(entries, riskScore) {
  const last3 = filterByDays(entries, 3);
  if (last3.length === 0) return 'neutral';

  const mostRecent = last3[0]?.mood || 'neutral';

  if (riskScore >= 75) return 'anxious';
  if (riskScore >= 65 && ['happy', 'energized'].includes(mostRecent)) return 'neutral';
  if (riskScore >= 55 && ['sad', 'anxious'].includes(mostRecent)) return 'tired';
  if (riskScore < 30 && ['happy', 'energized', 'calm'].includes(mostRecent)) return mostRecent;

  return mostRecent;
}

/**
 * Detect the user's typical logging time of day.
 */
export function getTimeOfDayPattern(entries) {
  if (entries.length === 0) return null;
  const hours = entries.slice(0, 10).map((e) => new Date(e.timestamp).getHours());
  const avg = hours.reduce((s, h) => s + h, 0) / hours.length;
  if (avg < 10) return 'morning';
  if (avg < 14) return 'afternoon';
  if (avg < 20) return 'evening';
  return 'night';
}

/**
 * Build a rich, natural-language context string for AI prompts.
 * Combines recent mood history with upcoming stressful calendar events.
 */
export function buildFullContext(entries, stressfulEvents = []) {
  const moodPart = buildMoodContext(entries);
  if (stressfulEvents.length === 0) return moodPart;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const eventPart = stressfulEvents
    .filter((ev) => Math.round((new Date(ev.event_date) - today) / 86_400_000) >= 0)
    .slice(0, 5)
    .map((ev) => {
      const days = Math.round((new Date(ev.event_date) - today) / 86_400_000);
      const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
      return `"${ev.title}" ${when}`;
    })
    .join('; ');

  return `${moodPart}. Upcoming stressful events: ${eventPart}.`;
}
