import React from 'react';
import './Header.css';

function Header({ user, activeView, setActiveView, onRefresh }){
    return(
        <header className = "header">
            <div className='header-container'>
                <div className='header-brand'>
                    <div className='brand-icon'>⚔️</div>
                    <div className='brand-info'>
                        <h1 className='brand-title'>HUNTER SYSTEM</h1>
                        <p className='brand-subtitle'>Solo Productivity Tracker</p>
                    </div>
                </div>
            </div>

            <nav className = "header-nav">
                <button
                    className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveView('dashboard')}
                >Dashboard</button>
                <button
                    className={`nav-btn ${activeView === 'quests' ? 'active' : ''}`}
                    onClick={() => setActiveView('quests')}
                >Quests</button> 
                <button
                    className={`nav-btn ${activeView === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveView('inventory')}
                >Inventory</button> 
            </nav>

            <div className='header-actions'>
                {user && (
                    <div className='user-quick-stats'>
                        <span className='quick-stat'>LVL {user.level}</span>
                        <span className='quick-stat rank'>  {user.rankName}</span>
                    </div>
                )}
                <button className='btn-icon' onClick={onRefresh} title = "Refresh">🔄️</button>
            </div>
        </header>
    );
}

export default Header;