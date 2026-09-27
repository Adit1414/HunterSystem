import React from 'react';
import './Modals.css';

function RewardModal({ data, onClose, onItemClaim }) {
    const { xp, gold, items, special } = data;

    return (
        <div className="modal-overlay">
            <div className="modal-content reward-modal">
                <h2>MISSION COMPLETE</h2>

                <div className="rewards-list">
                    {special && special.length > 0 && (
                        <div className="special-rewards-section" style={{ marginBottom: '15px' }}>
                            {special.map((s, idx) => (
                                <div key={idx} className="reward-item special-reward" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                    <span className="reward-icon">✨</span>
                                    <span className="reward-text">{s.message || 'Special Reward!'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {xp > 0 && (
                        <div className="reward-item xp">
                            <span className="reward-icon">⚔️</span>
                            <span className="reward-text">+{xp} XP</span>
                        </div>
                    )}

                    {gold > 0 && (
                        <div className="reward-item gold">
                            <span className="reward-icon">💰</span>
                            <span className="reward-text">+{gold} Gold</span>
                        </div>
                    )}

                    {items && items.length > 0 && (
                        <div className="items-reward-section">
                            <h3>Items Obtained:</h3>
                            <div className="reward-items-grid">
                                {items.map((item, index) => (
                                    <div key={index} className="reward-item-card rarity-border" style={{ borderColor: `var(--rarity-${item.rarity.toLowerCase()})` }}>
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-rarity">{item.rarity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={() => {
                        if (onItemClaim) onItemClaim();
                        onClose();
                    }}>
                        Claim Rewards
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RewardModal;
