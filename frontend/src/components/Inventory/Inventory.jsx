import React, { useState } from 'react';
import ItemCard from './ItemCard';
import './Inventory.css';

function Inventory({ items, onItemsChange }) {
    const [filter, setFilter] = useState('All');

    const categories = ['All', 'Weapon', 'Armor', 'Consumable', 'Material'];

    const filteredItems = items.filter(item =>
        filter === 'All' || item.type.toLowerCase() === filter.toLowerCase()
    );

    const handleUse = (id) => {
        console.log(`Used item ${id}`);
        // Implement use logic
    };

    const handleEquip = (id) => {
        console.log(`Equipped item ${id}`);
        // Implement equip logic
    };

    return (
        <div className="inventory-board">
            <div className="inventory-header">
                <div className="filter-options">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="inventory-grid">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onUse={handleUse}
                            onEquip={handleEquip}
                        />
                    ))
                ) : (
                    <div className="no-items">
                        <p>Inventory is empty.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Inventory;
