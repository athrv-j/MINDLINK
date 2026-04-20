/* ═══════════════════════════════════════════════════════════════
   SETTINGS VIEW
   User profile, API key management, data export/clear, and
   app information.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { APP_NAME, APP_VERSION } from '../constants';
import { downloadJSON } from '../utils/helpers';
import ApiKeyInput from '../components/ApiKeyInput';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';
import './Settings.css';

export default function Settings() {
  const {
    entries,
    user,
    apiKeys,
    updateUser,
    updateApiKey,
    clearAllData,
    showToast,
    logout,
    fetchCalendarEvents,
  } = useApp();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarResult, setCalendarResult] = useState(null);

  const handleCalendarSync = useCallback(async () => {
    if (!icsUrl.trim()) {
      showToast('Please enter a calendar URL', 'error');
      return;
    }
    setCalendarSyncing(true);
    setCalendarResult(null);
    try {
      const result = await api.syncCalendar(user.name, icsUrl.trim());
      setCalendarResult(result);
      showToast(result.message || 'Calendar synced! ✓');
      // Immediately fetch the updated events into global state
      fetchCalendarEvents(user.name);
    } catch (e) {
      showToast(e.message || 'Calendar sync failed', 'error');
    } finally {
      setCalendarSyncing(false);
    }
  }, [icsUrl, user.name, showToast, fetchCalendarEvents]);

  const handleExport = useCallback(() => {
    if (entries.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    const filename = `mindlink-export-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJSON(entries, filename);
    showToast('Data exported ✓');
  }, [entries, showToast]);

  const handleClearConfirm = useCallback(() => {
    clearAllData();
    setConfirmOpen(false);
    showToast('All data cleared');
  }, [clearAllData, showToast]);

  return (
    <div className="settings">
      <div className="settings__header">
        <h1>Settings</h1>
        <p className="section-subtitle">Manage your profile, API keys, and data</p>
      </div>

      {/* ── Profile ── */}
      <section className="settings__section glass" aria-label="Profile">
        <h3 className="settings__section-title">Profile</h3>
        <div className="settings__field">
          <label htmlFor="settings-name" className="label-text">
            Display Name
          </label>
          <input
            id="settings-name"
            value={user.name}
            onChange={(e) => updateUser({ name: e.target.value })}
            placeholder="Enter your name"
            className="input-field"
            aria-label="Display name"
          />
        </div>
        <button
          onClick={logout}
          className="btn-primary"
          style={{ marginTop: '20px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', boxShadow: '0 0 15px rgba(239,68,68,0.2)' }}
        >
          🔴 Log Out
        </button>
      </section>

      {/* ── Calendar Integration ── */}
      <section className="settings__section glass" aria-label="Calendar Integration">
        <h3 className="settings__section-title">📅 Calendar Integration</h3>
        <p className="settings__data-info">
          Connect your Google Calendar, Apple Calendar, or Outlook to automatically detect upcoming stressful events and get smarter AI insights.
        </p>

        {/* HOW IT WORKS */}
        <div className="settings__calendar-steps">
          <div className="settings__calendar-step">
            <span className="settings__calendar-step-num">1</span>
            <span>Choose your provider below and follow the steps to copy your secret <strong>.ics</strong> address.</span>
          </div>
          <div className="settings__calendar-step">
            <span className="settings__calendar-step-num">2</span>
            <span>Paste the link in the box at the bottom and tap <strong>Sync Calendar</strong>.</span>
          </div>
          <div className="settings__calendar-step">
            <span className="settings__calendar-step-num">3</span>
            <span>MindLink AI classifies stressful events and tailors your Insights automatically.</span>
          </div>
        </div>

        {/* WHERE TO GET THE ICS */}
        <div className="settings__ics-guide">
          <p className="settings__ics-guide-title">📍 Where to get your .ics address</p>
          <IcsAccordion
            icon="🔵"
            provider="Google Calendar"
            steps={[
              'Open calendar.google.com in your browser.',
              'Click the ⚙️ gear icon (top-right) → Settings.',
              'In the left sidebar under "My calendars", click your calendar name.',
              'Scroll to the "Integrate calendar" section.',
              'Find "Secret address in iCal format" — a URL starting with https://calendar.google.com/calendar/ical/…',
              'Click the copy icon next to that URL and paste it below.',
            ]}
          />
          <IcsAccordion
            icon="🍎"
            provider="Apple Calendar (iCloud)"
            steps={[
              'Open iCloud.com and go to Calendar (or use the Calendar app on Mac).',
              'Hover over your calendar in the left sidebar.',
              'Click the Share icon (signal / WiFi-wave icon) next to the calendar name.',
              'Tick "Public Calendar" to generate a sharing link.',
              'Copy the webcal:// URL shown, then replace "webcal://" with "https://" before pasting below.',
            ]}
          />
          <IcsAccordion
            icon="🟦"
            provider="Outlook / Microsoft 365"
            steps={[
              'Open outlook.com or the Outlook desktop app → switch to Calendar view.',
              'Right-click your calendar in the left panel and choose "Sharing and Permissions".',
              'Set access to "Can view all details" and click Publish.',
              'Copy the ICS link that appears (it ends with .ics).',
              'Paste that link in the field below.',
            ]}
          />
        </div>

        {/* INPUT + SYNC */}
        <div className="settings__field" style={{ marginTop: '18px' }}>
          <label htmlFor="settings-ics-url" className="label-text">Calendar URL (.ics link)</label>
          <input
            id="settings-ics-url"
            type="url"
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/your-calendar.ics"
            className="input-field"
            aria-label="Calendar ICS URL"
          />
        </div>
        <button
          onClick={handleCalendarSync}
          className="btn-primary"
          disabled={calendarSyncing}
          style={{ marginTop: '16px' }}
          id="settings-sync-calendar-btn"
        >
          {calendarSyncing ? '⏳ Syncing...' : '🔄 Sync Calendar'}
        </button>
        {calendarResult && (
          <div className="settings__calendar-result">
            <span className="settings__calendar-result-icon">✅</span>
            <div>
              <strong>{calendarResult.total}</strong> events synced&nbsp;·&nbsp;
              <strong className="settings__calendar-stress-count">{calendarResult.stressful}</strong> marked as stressful
            </div>
          </div>
        )}
      </section>

      {/* ── Data Management ── */}
      <section className="settings__section glass" aria-label="Data Management">
        <h3 className="settings__section-title">Data Management</h3>
        <p className="settings__data-info">
          {entries.length} mood {entries.length === 1 ? 'entry' : 'entries'} stored locally
        </p>
        <div className="settings__data-actions">
          <button onClick={handleExport} className="btn-secondary" aria-label="Export mood data as JSON">
            📦 Export Data
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="btn-danger"
            aria-label="Clear all data"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </section>

      {/* ── About ── */}
      <div className="settings__about glass">
        <div className="settings__about-logo">
          <span className="settings__about-dot">●</span>
          <span className="settings__about-name">{APP_NAME}</span>
          <span className="settings__about-version">v{APP_VERSION}</span>
        </div>
        <p className="settings__about-text">
          A compassionate mental wellness companion. Your data never leaves your
          device. AI features powered by Groq.
        </p>
      </div>

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmOpen}
        title="Clear All Data?"
        message="This will permanently delete all mood entries, your profile, and API keys. This action cannot be undone."
        confirmText="Yes, clear everything"
        cancelText="Cancel"
        danger
        onConfirm={handleClearConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

/* ─── ICS Accordion ─── */
function IcsAccordion({ icon, provider, steps }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ics-accordion${open ? ' ics-accordion--open' : ''}`}>
      <button
        className="ics-accordion__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="ics-accordion__icon">{icon}</span>
        <span className="ics-accordion__provider">{provider}</span>
        <span className="ics-accordion__chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ol className="ics-accordion__steps">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
