/* ═══════════════════════════════════════════════════════════════
   APP CONSTANTS
   Single source of truth for mood definitions, localStorage keys,
   API endpoints, and navigation config.
   ═══════════════════════════════════════════════════════════════ */

// ── localStorage Keys ──
export const LS_ENTRIES = 'mindlink_entries';
export const LS_USER = 'mindlink_user';
export const LS_KEYS = 'mindlink_keys';

// ── API Configuration ──
export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
export const ANTHROPIC_VERSION = '2023-06-01';

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── App Metadata ──
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'MindLink';

// ── Mood Definitions ──
export const MOODS = [
  {
    key: 'happy',
    emoji: '😊',
    label: 'Happy',
    color: '#00ffcc',
    orbGradient: ['#00ffcc', '#0099ff'],
  },
  {
    key: 'sad',
    emoji: '😔',
    label: 'Sad',
    color: '#00ccff',
    orbGradient: ['#0033cc', '#00ccff'],
  },
  {
    key: 'anxious',
    emoji: '😤',
    label: 'Anxious',
    color: '#ff3366',
    orbGradient: ['#ff0033', '#ff6699'],
  },
  {
    key: 'tired',
    emoji: '😴',
    label: 'Tired',
    color: '#9933ff',
    orbGradient: ['#6600cc', '#cc66ff'],
  },
  {
    key: 'energized',
    emoji: '🔥',
    label: 'Energized',
    color: '#ffcc00',
    orbGradient: ['#ff9900', '#ffcc00'],
  },
  {
    key: 'neutral',
    emoji: '😐',
    label: 'Neutral',
    color: '#8888aa',
    orbGradient: ['#444466', '#aaddff'],
  },
];

// ── Navigation Tabs ──
export const TABS = [
  { key: 'checkin',  icon: '🌿', label: 'Check-in' },
  { key: 'insights', icon: '📊', label: 'Insights' },
  { key: 'chat',     icon: '💬', label: 'Chat' },
  { key: 'goals',    icon: '🎯', label: 'Goals' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

// ── AI System Prompts ──
export const PROMPTS = {
  moodInsight:
    `You are a compassionate wellness companion. Given a mood entry, optional journal note, recent mood history, and any upcoming stressful events, generate a warm, non-clinical 2-3 sentence reflection that is personalised to the user's context. Then provide 2-3 specific, actionable tasks to improve or maintain their mood today — these should account for any upcoming stressful events if present. You MUST respond ONLY with valid JSON exactly like this: {"reflection": "your reflection text", "todos": ["task 1", "task 2"], "self_care_tip": "one brief self-care tip tailored to current mood + events"}`,

  weeklySummary:
    `You are a mental wellness analyst. Analyze the week's mood log, trend, and any upcoming stressful calendar events to provide a deep, personalized assessment. You MUST respond ONLY with valid JSON exactly like this:
{
  "reflection": "3-4 sentence warm summary of emotional patterns this week",
  "pattern": "key emotional pattern detected",
  "trigger": "most likely stress triggers, referencing specific upcoming events if present",
  "focus": "what to prioritize mentally in the next 7 days",
  "mood_forecast": "predicted mood for next 3 days and why, based on trends + events",
  "risk_level": "Low | Moderate | High",
  "calendar_prep": "specific preparation advice for the most critical upcoming event (omit if no events)",
  "self_care_tip": "one targeted self-care tip for this specific person right now",
  "todos": ["2-3 concrete actions for next week"]
}`,

  chatCompanion: (moodContext) =>
    `You are MindLink's emotional support companion. The user's recent context is: ${moodContext}. Use this context to personalize every response — reference their moods and upcoming events naturally. Be warm, empathetic, non-judgmental, and solution-oriented. If they have a stressful event coming up, gently acknowledge it. Never diagnose. Suggest professional help if distress is severe. Keep responses concise (2–4 sentences unless more is needed).`,
};
