/* ═══════════════════════════════════════════════════════════════
   AI CHAT VIEW
   Full chat interface with Groq-powered LLM, mood-aware system
   prompt, auto-scroll, typing indicator, and Enter-to-send.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { PROMPTS } from '../constants';
import { api } from '../services/api';
import { buildFullContext } from '../utils/helpers';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import './Chat.css';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi there 🌿 I'm your MindLink companion. I'm here to listen, support, and chat about whatever's on your mind. How can I help today?",
};

export default function Chat() {
  const { entries, apiKeys, calendarEvents, showToast } = useApp();
  const stressfulEvents = calendarEvents.filter((e) => e.is_stressful);

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, typing]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setTyping(true);

    try {
      const fullContext = buildFullContext(entries, stressfulEvents);
      const systemPrompt = PROMPTS.chatCompanion(fullContext);

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...updated.map((m) => ({ role: m.role, content: m.content })),
      ];

      const responseText = await api.callAI(apiMessages);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: responseText },
      ]);
    } catch (err) {
      const errorMessage = "I'm sorry, I couldn't connect right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage },
      ]);

      showToast('Chat response failed', 'error');
    }

    setTyping(false);
  }, [input, typing, messages, entries, apiKeys.groq, showToast]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="chat">
      <div className="chat__header">
        <h1>MindLink Chat</h1>
        <p className="section-subtitle">Your mood-aware companion</p>
      </div>

      {/* Messages */}
      <div className="chat__messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {typing && <TypingIndicator />}
      </div>

      {/* Input Bar */}
      <div className="chat__input-bar">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="chat__input input-field"
          aria-label="Chat message input"
          disabled={typing}
        />
        <button
          onClick={sendMessage}
          disabled={typing || !input.trim()}
          className="chat__send btn-primary"
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
