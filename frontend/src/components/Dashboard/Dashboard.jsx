/**
 * Dashboard Component
 * Displays user stats, level, XP, and overview
 */

import React, { useState } from 'react';
import XPBar from './XPBar';
import api from '../../services/api';
import { formatNumber } from '../../utils/formatters';
import './Dashboard.css';

function Dashboard({ user, stats, onRefresh }) {
  const [allocating, setAllocating] = useState(false);

  if (!user) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const completionRate = stats?.quests?.total > 0
    ? Math.round((stats.quests.completed / stats.quests.total) * 100)
    : 0;

  const statPoints = user.stats?.statPoints || 0;

  const allocateStat = async (statName) => {
    if (allocating) return;
    setAllocating(true);
    try {
      // Use centralized API service
      await api.post('/user/stats', { [statName.toLowerCase()]: 1 });

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error allocation stat:", error);
    } finally {
      setAllocating(false);
    }
  };

  const renderStatCard = (label, value, key) => (
    <div className="attribute-card">
      <span className="attr-label">{label}</span>
      <span className="attr-value">{value}</span>
      {statPoints > 0 && (
        <button
          className="btn-plus"
          onClick={() => allocateStat(key)}
          disabled={allocating}
          title={`Increase ${label}`}
        >
          +
        </button>
      )}
    </div>
  );

  return (
    <div className="dashboard">
      {/* Level & Rank Display */}
      <div className="dashboard-hero">
        <div className="level-display">
          <div className="level-number">{user.level}</div>
          <div className="level-label">Level</div>
        </div>

        <div className="rank-display">
          <div className="rank-title">Hunter Rank</div>
          <div className="rank-name">{user.rankName}</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="dashboard-section">
        <XPBar
          currentXP={user.xp}
          xpForNextLevel={user.xpForNextLevel}
          progressPercentage={user.progressPercentage}
          level={user.level}
        />
      </div>

      {/* Player Stats (Attributes) */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Player Attributes</h3>
          {statPoints > 0 && (
            <div className="points-available">
              <span className="points-count">{statPoints}</span>
              <span className="points-text">Points Available</span>
            </div>
          )}
        </div>

        <div className="attributes-grid">
          {renderStatCard('Strength', user.stats?.strength || 10, 'strength')}
          {renderStatCard('Agility', user.stats?.agility || 10, 'agility')}
          {renderStatCard('Sense', user.stats?.sense || 10, 'sense')}
          {renderStatCard('Vitality', user.stats?.vitality || 10, 'vitality')}
          {renderStatCard('Intelligence', user.stats?.intelligence || 10, 'intelligence')}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="dashboard-section">
        <h3 className="section-title">Activity Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⚔️</div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(user.totalXpEarned)}</div>
              <div className="stat-label">Total XP</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.quests?.total || 0}</div>
              <div className="stat-label">Total Quests</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.quests?.completed || 0}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{completionRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎒</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.items?.total || 0}</div>
              <div className="stat-label">Items</div>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">
                {(stats?.items?.legendary || 0) + (stats?.items?.mythic || 0)}
              </div>
              <div className="stat-label">Legendary+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;