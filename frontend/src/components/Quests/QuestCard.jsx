import React from 'react';

/**
 * QuestCard Component
 * Displays individual quest details and actions
 */
function QuestCard({ quest, onComplete }) {
    const difficultyColors = {
        'E': 'var(--rank-e)',
        'D': 'var(--rank-d)',
        'C': 'var(--rank-c)',
        'B': 'var(--rank-b)',
        'A': 'var(--rank-a)',
        'S': 'var(--rank-s)',
    };

    const borderColor = difficultyColors[quest.difficulty] || 'var(--border-color)';

    return (
        <div className="card quest-card" style={{ borderLeft: `4px solid ${borderColor}` }}>
            <div className="quest-header">
                <div className="quest-badges">
                    <span className={`badge badge-${quest.difficulty.toLowerCase()}`}>
                        {quest.difficulty}-Rank
                    </span>
                    {quest.gold_reward > 0 && (
                        <span className="badge badge-gold">
                            💰 {quest.gold_reward}
                        </span>
                    )}
                </div>
                <h3 className="quest-title">{quest.title}</h3>
            </div>

            <p className="quest-description">{quest.description}</p>

            <div className="quest-footer">
                <div className="quest-rewards">
                    <span className="xp-reward">+{quest.xp_reward} XP</span>
                </div>

                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onComplete(quest.id)}
                >
                    Complete
                </button>
            </div>
        </div>
    );
}

export default QuestCard;
