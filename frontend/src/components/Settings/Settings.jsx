import React, { useState } from 'react';
import './Settings.css';

function Settings({ onSignOut, onStartTutorial }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleTutorial = () => {
        if (onStartTutorial) {
            onStartTutorial();
        }
    };

    return (
        <div className="settings-container">
            <h2>Settings</h2>
            
            <div className="settings-section">
                <h3>Preferences</h3>
                <div className="setting-item">
                    <span>Theme</span>
                    <button className="settings-btn" onClick={handleThemeToggle}>
                        {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>
                </div>
            </div>

            <div className="settings-section">
                <h3>Help & Support</h3>
                <div className="setting-item">
                    <span>System Tutorial</span>
                    <button className="settings-btn" onClick={handleTutorial}>View Tutorial</button>
                </div>
            </div>

            <div className="settings-section danger-zone">
                <h3>Account</h3>
                <div className="setting-item">
                    <span>Session</span>
                    <button className="settings-btn danger" onClick={onSignOut}>Log Out</button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
