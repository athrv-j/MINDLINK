/* ═══════════════════════════════════════════════════════════════
   BOTTOM NAVIGATION BAR
   Mobile-first tab bar with sliding accent indicator.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { TABS } from '../constants';
import './NavBar.css';

export default function NavBar({ activeTab, onTabChange }) {
  const activeIndex = TABS.findIndex((t) => t.key === activeTab);

  return (
    <nav className="navbar" role="tablist" aria-label="Main navigation">
      <div className="navbar__inner">
        {/* Sliding indicator */}
        <div
          className="navbar__indicator"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={`navbar__tab ${isActive ? 'navbar__tab--active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span className="navbar__icon">{tab.icon}</span>
              <span className="navbar__label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
