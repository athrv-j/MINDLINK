import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import './Goals.css';

export default function Goals() {
  const { user, showToast } = useApp();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const data = await api.getGoals(user.name);
      setGoals(data);
    } catch (e) {
      showToast('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.name, showToast]);

  useEffect(() => {
    if (user.name) {
      fetchGoals();
    }
  }, [user.name, fetchGoals]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    try {
      await api.addGoal(user.name, newGoal.trim());
      setNewGoal('');
      fetchGoals();
      showToast('Goal added ✓');
    } catch (e) {
      showToast('Failed to add goal', 'error');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    // optimistic update
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !currentStatus } : g));
    try {
      await api.toggleGoal(id, !currentStatus);
    } catch (e) {
      // revert
      fetchGoals();
      showToast('Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      showToast('Goal removed');
    } catch (e) {
      showToast('Action failed', 'error');
    }
  };

  const completedCount = goals.filter(g => g.completed).length;

  return (
    <div className="goals-view">
      <div className="goals__header">
        <h1>Wellness Goals</h1>
        <p className="section-subtitle">Set meaningful mental health goals</p>
      </div>

      <div className="goals__stats glass">
        <h3>Progress</h3>
        <div className="goals__progress-bar">
          <div 
            className="goals__progress-fill" 
            style={{ width: goals.length ? `${(completedCount / goals.length) * 100}%` : '0%' }}
          ></div>
        </div>
        <p>{completedCount} of {goals.length} completed</p>
      </div>

      <form className="goals__add-form" onSubmit={handleAddGoal}>
        <input 
          type="text" 
          className="input-field goals__input" 
          placeholder="e.g., Meditate for 10 minutes..." 
          value={newGoal} 
          onChange={(e) => setNewGoal(e.target.value)}
          maxLength={100}
        />
        <button type="submit" className="btn-primary goals__add-btn" disabled={!newGoal.trim()}>
          Add
        </button>
      </form>

      <div className="goals__list">
        {loading ? (
          <p className="goals__loading">Loading goals...</p>
        ) : goals.length === 0 ? (
          <div className="goals__empty glass">
            <span className="goals__empty-icon">🎯</span>
            <p>No wellness goals yet.</p>
            <p>Start by setting a small, achievable task today!</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className={`goal-item glass ${goal.completed ? 'completed' : ''}`}>
              <label className="goal-item__label">
                <input 
                  type="checkbox" 
                  className="goal-item__checkbox"
                  checked={goal.completed}
                  onChange={() => handleToggle(goal.id, goal.completed)}
                />
                <span className="goal-item__text">{goal.title}</span>
              </label>
              <button 
                className="goal-item__delete hover-glow" 
                onClick={() => handleDelete(goal.id)}
                aria-label="Delete goal"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
