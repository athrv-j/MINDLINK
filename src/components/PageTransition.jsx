/* ═══════════════════════════════════════════════════════════════
   PAGE TRANSITION
   Wraps each view to provide a fade+slide entrance animation
   with staggered children.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import './PageTransition.css';

export default function PageTransition({ children, viewKey }) {
  return (
    <div className="page-transition stagger-children" key={viewKey}>
      {children}
    </div>
  );
}
