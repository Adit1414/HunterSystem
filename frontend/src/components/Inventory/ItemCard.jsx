import React from 'react';

/**
 * ItemCard Component
 * Displays individual item details in inventory
 */
function ItemCard({ item, onUse, onEquip }) {
    const rarityColors = {
        'common': 'var(--rarity-common)',
        'rare': 'var(--rarity-rare)',
        'epic': 'var(--rarity-epic)',
        'legendary': 'var(--rarity-legendary)',
        'mythic': 'var(--rarity-mythic)',
    };

    const borderColor = rarityColors[item.rarity.toLowerCase()] || 'var(--border-color)';
    const isStreakFreeze = item.name === "Ice Monarch's blessing";
    const nameStyle = { 
        color: borderColor,
        textShadow: isStreakFreeze ? '0 0 8px rgba(100, 200, 255, 0.8)' : 'none'
    };

    return (
        <div className="card item-card" style={{ borderColor: borderColor }}>
            <div className="item-header">
                <span className="badge" style={{ backgroundColor: borderColor, color: 'white' }}>
                    {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                </span>
                <h4 className="item-name" style={nameStyle}>{item.name}</h4>
            </div>

            <div className="item-type">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</div>
            <p className="item-description">{item.description}</p>

            {item.stats && (
                <div className="item-stats">
                    {Object.entries(item.stats).map(([key, value]) => (
                        <div key={key} className="stat-row">
                            <span className="stat-label">{key}:</span>
                            <span className="stat-value">+{value}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="item-actions" style={{ alignItems: 'center' }}>
                {item.type === 'Consumable' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onUse(item.id)}>
                        Use
                    </button>
                )}
                {(item.type === 'Weapon' || item.type === 'Armor') && (
                    <button className="btn btn-secondary btn-sm" onClick={() => onEquip(item.id)}>
                        Equip
                    </button>
                )}
                
                {item.quantity > 1 && (
                    <div className="item-quantity-badge" style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        x{item.quantity}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ItemCard;
