import React from 'react';

function QuestFilters({ filter, onFilterChange }) {
    const difficulties = ['All', 'E', 'D', 'C', 'B', 'A', 'S'];

    return (
        <div className="quest-filters">
            <span className="filter-label">Difficulty:</span>
            <div className="filter-options">
                {difficulties.map(diff => (
                    <button
                        key={diff}
                        className={`filter-btn ${filter === diff ? 'active' : ''}`}
                        onClick={() => onFilterChange(diff)}
                    >
                        {diff}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default QuestFilters;
