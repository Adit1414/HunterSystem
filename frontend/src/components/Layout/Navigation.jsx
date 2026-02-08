/**
 * Navigation Component
 * Bottom or side navigation bar
 */

import React from 'react';
import './Navigation.css';

function Navigation({ activeView, setActiveView }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'quests', icon: '📋', label: 'Quests' },
    { id: 'inventory', icon: '🎒', label: 'Inventory' }
  ];

  return (
    <nav className="navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => setActiveView(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navigation;