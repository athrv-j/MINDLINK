/* ═══════════════════════════════════════════════════════════════
   APP SHELL
   Root component: header, view router, navigation bar,
   toast overlay, and floating particles background.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import FloatingParticles from './components/FloatingParticles';
import AuroraBackground from './components/AuroraBackground';
import Toast from './components/Toast';
import NavBar from './components/NavBar';
import PageTransition from './components/PageTransition';
import MoodCheckin from './views/MoodCheckin';
import Insights from './views/Insights';
import Chat from './views/Chat';
import Goals from './views/Goals';
import Settings from './views/Settings';
import Login from './views/Login';
import './App.css';

const VIEW_MAP = {
  checkin: MoodCheckin,
  insights: Insights,
  chat: Chat,
  goals: Goals,
  settings: Settings,
};

export default function App() {
  const [tab, setTab] = useState('checkin');
  const { toast, user } = useApp();

  return (
    <>
      {/* Ambient Background */}
      <AuroraBackground />
      <FloatingParticles />

      {/* Toast Notifications */}
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />

      {!user.isLoggedIn ? (
        <main className="app-main">
          <Login />
        </main>
      ) : (
        <>
          {/* Header */}
          <header className="app-header">
            <div className="app-header__inner">
              <div className="app-header__brand">
                <img src="/logo.png" alt="MindLink Logo" className="app-header__logo" />
              </div>
              {user.name && (
                <span className="app-header__greeting">Hi, {user.name}</span>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="app-main">
            <PageTransition viewKey={tab}>
              {React.createElement(VIEW_MAP[tab])}
            </PageTransition>
          </main>

          {/* Navigation */}
          <NavBar activeTab={tab} onTabChange={setTab} />
        </>
      )}
    </>
  );
}
