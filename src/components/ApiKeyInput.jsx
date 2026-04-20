/* ═══════════════════════════════════════════════════════════════
   API KEY INPUT
   Password input with show/hide toggle and helper text.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import './ApiKeyInput.css';

export default function ApiKeyInput({ id, label, value, onChange, placeholder, description }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="api-key-input">
      <label htmlFor={id} className="api-key-input__label label-text">
        {label}
      </label>
      <div className="api-key-input__group">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="api-key-input__field input-field"
          aria-label={label}
          autoComplete="off"
        />
        <button
          type="button"
          className="api-key-input__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
      {description && (
        <p className="api-key-input__desc">{description}</p>
      )}
    </div>
  );
}
