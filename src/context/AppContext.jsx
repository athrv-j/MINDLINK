/* ═══════════════════════════════════════════════════════════════
   APP CONTEXT
   Centralized state management for entries, user, API keys, and toast.
   Every component in the tree can access state via useApp().
   ═══════════════════════════════════════════════════════════════ */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { LS_ENTRIES, LS_USER, LS_KEYS } from '../constants';
import { loadJSON, saveJSON, removeKey } from '../utils/storage';
import { generateId } from '../utils/helpers';
import { api } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Persisted State ──
  const [entries, setEntries] = useState([]);
  const [apiKeys, setApiKeys] = useState(() =>
    loadJSON(LS_KEYS, { groq: '' })
  );
  const [user, setUser] = useState({ name: '', isLoggedIn: false });
  const [calendarEvents, setCalendarEvents] = useState([]);

  // ── Toast State ──
  const [toast, setToast] = useState({
    message: '',
    visible: false,
    type: 'success',
  });
  const toastTimerRef = useRef(null);

  // ── Actions ──

  const addEntry = useCallback(
    async (mood, note) => {
      const entry = {
        id: generateId(),
        mood,
        note: note.trim(),
        timestamp: new Date().toISOString(),
      };

      // ── Intelligent Alert Logic ──
      if (entries.length > 0) {
        const lastMood = entries[0].mood;
        const isNegative = (m) => m === 'sad' || m === 'anxious' || m === 'tired';
        const isPositive = (m) => m === 'happy' || m === 'energized';

        if (isNegative(mood) && isNegative(lastMood)) {
          setTimeout(() => showToast('We noticed you are feeling down. Try fulfilling a wellness goal or chatting with AI.', 'warning'), 3500);
        } else if (isPositive(lastMood) && isNegative(mood)) {
          setTimeout(() => showToast('Sudden energy drop. Please take it easy and be gentle with yourself.', 'warning'), 3500);
        } else if (isNegative(lastMood) && isPositive(mood)) {
          setTimeout(() => showToast('Great job bouncing back! Keep up the positive momentum.', 'success'), 3500);
        }
      }

      // Optimistic update
      setEntries((prev) => [entry, ...prev]);
      
      if (user.isLoggedIn) {
        try {
          await api.saveMoodEntry(user.name, entry);
        } catch (e) {
          showToast('Failed to sync to database', 'error');
        }
      }
      return entry;
    },
    [user.name, user.isLoggedIn]
  );

  const clearEntries = useCallback(() => {
    setEntries([]);
    if (user.isLoggedIn) {
      mockDB.saveMoodEntry(user.name, []);
    }
  }, [user.name, user.isLoggedIn]);

  const fetchCalendarEvents = useCallback(async (username) => {
    try {
      const events = await api.getCalendarEvents(username);
      setCalendarEvents(events);
      return events;
    } catch (e) {
      setCalendarEvents([]);
      return [];
    }
  }, []);

  const login = async (username, password, isSignup = false) => {
    if (isSignup) {
      await api.signup(username, password);
    }
    const res = await api.login(username, password);
    setUser({ name: username, isLoggedIn: true });

    // Load entries and calendar events for this user from Flask
    try {
      const dbEntries = await api.getMoodEntries(username);
      setEntries(dbEntries);
    } catch (e) {
      setEntries([]);
    }
    const events = await fetchCalendarEvents(username);

    // Show a toast with the upcoming stressful event on login
    const stressfulEvents = events ? events.filter((e) => e.is_stressful) : [];
    if (stressfulEvents.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const urgentEvent = stressfulEvents
        .map((ev) => ({ ...ev, days: Math.round((new Date(ev.event_date) - today) / 86_400_000) }))
        .filter((ev) => ev.days >= 0)
        .sort((a, b) => a.days - b.days)[0];
      
      if (urgentEvent) {
        const timeStr = urgentEvent.days === 0 ? 'today' : urgentEvent.days === 1 ? 'tomorrow' : `in ${urgentEvent.days} days`;
        setTimeout(() => showToast(`Heads up: You have "${urgentEvent.title}" ${timeStr}.`, 'warning'), 1500);
      } else {
        setTimeout(() => showToast('Login successful', 'success'), 500);
      }
    } else {
      setTimeout(() => showToast('Login successful', 'success'), 500);
    }
  };

  const logout = () => {
    setUser({ name: null, isLoggedIn: false });
    setEntries([]);
    setCalendarEvents([]);
  };

  const updateApiKey = useCallback(
    (field, value) => {
      setApiKeys((prev) => {
        const updated = { ...prev, [field]: value };
        saveJSON(LS_KEYS, updated);
        return updated;
      });
    },
    []
  );

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      saveJSON(LS_USER, updated);
      return updated;
    });
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true, type });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const clearAllData = useCallback(() => {
    removeKey(LS_KEYS);
    setEntries([]);
    setApiKeys({ groq: '' });
    setUser({ name: '', isLoggedIn: false });
  }, []);

  const value = {
    // State
    entries,
    apiKeys,
    user,
    toast,
    calendarEvents,
    // Actions
    addEntry,
    clearEntries,
    updateApiKey,
    updateUser,
    showToast,
    clearAllData,
    login,
    logout,
    fetchCalendarEvents,
    setCalendarEvents,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to access the app context. Must be used within <AppProvider>.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
