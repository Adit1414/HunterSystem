import React, { useState } from 'react';
import QuestCard from './QuestCard';
import QuestFilters from './QuestFilters';
import QuestForm from './QuestForm';
import { completeQuest } from '../../services/api';
import './Quests.css';

function QuestBoard({ quests, onQuestComplete, onQuestsChange }) {
    const [filter, setFilter] = useState('All');
    const [showForm, setShowForm] = useState(false);

    const filteredQuests = quests.filter(quest =>
        filter === 'All' || quest.difficulty === filter
    );

    const handleComplete = async (id) => {
        try {
            const result = await completeQuest(id);
            onQuestComplete(result);
        } catch (error) {
            console.error("Failed to complete quest:", error);
        }
    };

    const handleQuestCreated = () => {
        setShowForm(false);
        onQuestsChange(); // Refresh list
    };

    return (
        <div className="quest-board">
            <div className="board-header">
                <QuestFilters filter={filter} onFilterChange={setFilter} />
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Close Form' : '+ New Quest'}
                </button>
            </div>

            {showForm && (
                <div className="quest-form-wrapper fade-in">
                    <QuestForm
                        onQuestCreated={handleQuestCreated}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}

            <div className="quests-grid">
                {filteredQuests.length > 0 ? (
                    filteredQuests.map(quest => (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            onComplete={handleComplete}
                        />
                    ))
                ) : (
                    <div className="no-quests">
                        <p>No active quests found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuestBoard;
