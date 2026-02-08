/**
 * XP Progress Bar Component
 * Shows current XP progress to next level with animated fill
 */

import React from 'react';
import { formatNumber } from '../../utils/formatters';
import './XPBar.css';

function XPBar({ currentXP, xpForNextLevel, progressPercentage, level }) {
  return (
    <div className="xp-bar-container">
      <div className="xp-bar-header">
        <span className="xp-label">XP Progress</span>
        <span className="xp-amount">
          {formatNumber(currentXP)} / {formatNumber(xpForNextLevel)}
        </span>
      </div>

      <div className="xp-bar-wrapper">
        <div 
          className="xp-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="xp-bar-shimmer"></div>
        </div>
        
        <div className="xp-bar-percentage">
          {progressPercentage}%
        </div>
      </div>

      <div className="xp-bar-footer">
        <span className="xp-footer-text">
          Level {level} → {level + 1}
        </span>
        <span className="xp-remaining">
          {formatNumber(xpForNextLevel - currentXP)} XP remaining
        </span>
      </div>
    </div>
  );
}

export default XPBar;