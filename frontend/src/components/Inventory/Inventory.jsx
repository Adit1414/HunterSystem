import React, { useState } from 'react';
import ItemCard from './ItemCard';
import './Inventory.css';

function Inventory({ items, onItemsChange }) {
    const [filter, setFilter] = useState('All');

    const categories = ['All', 'Weapon', 'Armor', 'Consumable', 'Accessory'];

    const filteredItems = items.filter(item =>
        filter === 'All' || item.type.toLowerCase() === filter.toLowerCase()
    );

    // Group items by name to avoid duplicates and show quantity
    const groupedItems = [];
    const itemMap = new Map();

    filteredItems.forEach(item => {
        const normalizedName = item.name.trim().toLowerCase();
        if (itemMap.has(normalizedName)) {
            itemMap.get(normalizedName).quantity += 1;
        } else {
            const newItem = { ...item, quantity: 1 };
            itemMap.set(normalizedName, newItem);
            groupedItems.push(newItem);
        }
    });

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
                {groupedItems.length > 0 ? (
                    groupedItems.map(item => (
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
