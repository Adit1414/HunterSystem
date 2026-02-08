import React from 'react';
import './Modals.css';

function LevelUpModal({ data, onClose }) {
    const { level } = data;

    return (
        <div className="modal-overlay">
            <div className="modal-content level-up-modal glow-pulse">
                <h2 className="level-up-title">LEVEL UP!</h2>

                <div className="level-circle">
                    <span className="level-number">{level}</span>
                </div>

                <div className="stats-increase">
                    <h3>Rewards</h3>
                    <div className="stat-points-reward">
                        <span className="plus-icon">+</span>
                        <span className="points-val">5</span>
                        <span className="points-label">Stat Points</span>
                    </div>
                    <p className="points-hint">Allocate them in your Dashboard</p>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary btn-lg" onClick={onClose}>
                        Accept Power
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LevelUpModal;
