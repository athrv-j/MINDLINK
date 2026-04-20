/* ═══════════════════════════════════════════════════════════════
   ENTRY POINT
   Mounts the React app with AppProvider context.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import App from './App';

// ── Global Styles (order matters) ──
import './styles/variables.css';
import './styles/base.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
