import React from 'react';
import './AuroraBackground.css';

/**
 * AuroraBackground
 * A high-performance ambient background consisting of 
 * slow-morphing, blurred color blobs. Optimized to avoid 
 * flickering and minimize CPU load.
 */
const AuroraBackground = () => {
  return (
    <div className="aurora-container" aria-hidden="true">
      <div className="aurora-blob aurora-blob--1" />
      <div className="aurora-blob aurora-blob--2" />
      <div className="aurora-blob aurora-blob--3" />
    </div>
  );
};

export default AuroraBackground;
