/**
 * StatsCard Component
 * Individual stat display card
 */

import React from 'react';
import './StatsCard.css';

function StatsCard({ icon, value, label, highlight }) {
  return (
    <div className={`stats-card ${highlight ? 'highlight' : ''}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <div className="stats-value">{value}</div>
        <div className="stats-label">{label}</div>
      </div>
    </div>
  );
}

export default StatsCard;