/* ═══════════════════════════════════════════════════════════════
   FULL-STACK API SERVICE 
   Connects the React frontend to the Python/Flask backend.
   ═══════════════════════════════════════════════════════════════ */

const BASE_URL = 'http://127.0.0.1:5000/api';

export const api = {
  // ── Authentication ──
  async login(username, password) {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async signup(username, password) {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');
    return data;
  },

  // ── Database (Moods) ──
  async getMoodEntries(username) {
    const res = await fetch(`${BASE_URL}/moods/get?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch moods');
    return data;
  },

  async saveMoodEntry(username, entry) {
    const res = await fetch(`${BASE_URL}/moods/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save mood');
    return data;
  },

  // ── Database (Goals) ──
  async getGoals(username) {
    const res = await fetch(`${BASE_URL}/goals/get?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch goals');
    return data;
  },

  async addGoal(username, title) {
    const res = await fetch(`${BASE_URL}/goals/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add goal');
    return data;
  },

  async toggleGoal(id, completed) {
    const res = await fetch(`${BASE_URL}/goals/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to toggle goal');
    return data;
  },

  async deleteGoal(id) {
    const res = await fetch(`${BASE_URL}/goals/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete goal');
    return data;
  },

  // ── Calendar Integration ──
  async syncCalendar(username, icsUrl) {
    const res = await fetch(`${BASE_URL}/calendar/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, ics_url: icsUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Calendar sync failed');
    return data;
  },

  async getCalendarEvents(username) {
    const res = await fetch(`${BASE_URL}/calendar/events?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch calendar events');
    return data;
  },

  // ── AI Generation (Groq wrapper) ──
  async callAI(messages, maxTokens = 500, temperature = 0.5, responseFormat = null) {
    const res = await fetch(`${BASE_URL}/ai/groq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        maxTokens,
        temperature,
        response_format: responseFormat
      }),
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'AI request failed');
    }
    return data.text;
  }
};
