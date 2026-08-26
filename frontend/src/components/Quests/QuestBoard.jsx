import React, { useState, useEffect } from 'react';
import QuestCard from './QuestCard';
import QuestFilters from './QuestFilters';
import QuestForm from './QuestForm';
import FailQuestModal from '../Modals/FailQuestModal';
import { completeQuest, failQuest, getArchivedQuests, restoreQuest } from '../../services/api';
import './Quests.css';

function QuestBoard({ quests, onQuestComplete, onQuestsChange }) {
    const [filter, setFilter] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [questToFail, setQuestToFail] = useState(null);

    // Archive state
    const [archivedQuests, setArchivedQuests] = useState([]);
    const [showArchive, setShowArchive] = useState(false);
    const [restoringQuestId, setRestoringQuestId] = useState(null);

    useEffect(() => {
        loadArchivedQuests();
    }, [quests]); // Reload archive when quests change (completed/failed)

    const loadArchivedQuests = async () => {
        try {
            const result = await getArchivedQuests();
            setArchivedQuests(result.quests || []);
        } catch (error) {
            console.error("Failed to load archived quests:", error);
        }
    };

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

    const handleFailConfirm = async (id) => {
        try {
            const result = await failQuest(id);
            setQuestToFail(null);

            if (result.penaltyApplied) {
                // To keep it simple, we just alert. In a bigger app, use a toast system.
                alert(`Penalty Applied! You lost 1 ${result.attributePenalized} point.`);
            }

            // Tell parent to refresh active quests (and user data if penalty applied)
            // But App.jsx onQuestComplete doesn't handle fail natively perfectly unless we make it.
            // App.jsx onQuestsChange will just refresh the list. 
            // Better to trigger a hard refresh via onQuestComplete with appropriate payload, but since fail doesn't drop items we can invoke onQuestsChange for now.
            onQuestsChange();
            // Ideally we also want to refresh user stats. App.jsx might need `onQuestFailed`.
            // For now, let's trigger both onQuestComplete empty-ish or tell App to refresh. 
            // We'll call onQuestComplete with a dummy structure so it calls refreshUser() up in App.
            onQuestComplete({ levelUp: null, rewards: { items: [], special: [] } });
        } catch (error) {
            console.error("Failed to fail quest:", error);
            setQuestToFail(null);
        }
    };

    const handleQuestCreated = () => {
        setShowForm(false);
        onQuestsChange(); // Refresh list
    };

    const handleRestore = async (questId) => {
        if (restoringQuestId) return; // prevent double-click
        setRestoringQuestId(questId);
        try {
            const result = await restoreQuest(questId);
            // Refresh the active quests list and user data
            onQuestsChange();
            // Also trigger a user refresh (same pattern as handleFailConfirm)
            onQuestComplete({ levelUp: null, rewards: { items: [], special: [] }, user: result.user });
            // Reload archive
            await loadArchivedQuests();
        } catch (error) {
            console.error('Failed to restore quest:', error);
        } finally {
            setRestoringQuestId(null);
        }
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
                            onFail={(q) => setQuestToFail(q)}
                        />
                    ))
                ) : (
                    <div className="no-quests">
                        <p>No active quests found.</p>
                    </div>
                )}
            </div>

            {/* Past Quests / Archive */}
            <div className="archive-section mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowArchive(!showArchive)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
                >
                    <span>Past Quests (Archive)</span>
                    <span>{showArchive ? '▲' : '▼'}</span>
                </button>

                {showArchive && (
                    <div className="quests-grid mt-3">
                        {archivedQuests.length > 0 ? (
                            archivedQuests.map(quest => (
                                <div key={quest.id} className="card quest-card archive-quest-card" style={{ opacity: 0.82, borderLeft: `4px solid ${quest.status === 'completed' ? 'var(--success)' : 'var(--danger)'}` }}>
                                    <div className="quest-header">
                                        <div className="quest-badges">
                                            <span className={`badge badge-${quest.difficulty.toLowerCase()}`}>
                                                {quest.difficulty}-Rank
                                            </span>
                                            <span className={`badge`} style={{
                                                backgroundColor: quest.status === 'completed' ? 'var(--success)' : 'var(--danger)',
                                                color: quest.status === 'completed' ? 'var(--bg-primary)' : 'white'
                                            }}>
                                                {quest.status.toUpperCase()}
                                            </span>
                                            {quest.attribute && (
                                                <span className="badge" style={{
                                                    background: 'var(--bg-tertiary)',
                                                    color: quest.attribute === 'strength' ? 'var(--danger)' :
                                                           quest.attribute === 'intelligence' ? 'var(--accent-primary)' :
                                                           quest.attribute === 'vitality' ? 'var(--success)' :
                                                           quest.attribute === 'creation' ? 'var(--accent-gold)' :
                                                           quest.attribute === 'network' ? 'var(--rarity-mythic)' : 'var(--text-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {quest.attribute.charAt(0).toUpperCase() + quest.attribute.slice(1)}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="quest-title" style={{ textDecoration: quest.status === 'failed' ? 'line-through' : 'none', opacity: quest.status === 'failed' ? 0.6 : 1 }}>
                                            {quest.title}
                                        </h3>
                                    </div>
                                    <p className="quest-description">{quest.description}</p>
                                    <div className="quest-footer" style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                            {quest.xp_awarded != null
                                                ? <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>−{quest.xp_awarded} XP on restore</span>
                                                : <span style={{ color: 'var(--text-tertiary)' }}>No XP to deduct</span>
                                            }
                                        </span>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.35rem 0.9rem',
                                                borderRadius: '6px',
                                                cursor: restoringQuestId === quest.id ? 'not-allowed' : 'pointer',
                                                opacity: restoringQuestId === quest.id ? 0.6 : 1,
                                                fontWeight: 600,
                                                fontSize: '0.82rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => handleRestore(quest.id)}
                                            disabled={!!restoringQuestId}
                                            title="Restore this quest to active status"
                                        >
                                            {restoringQuestId === quest.id ? (
                                                <>
                                                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
                                                    Restoring…
                                                </>
                                            ) : (
                                                <>
                                                    ↩ Restore
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-quests">
                                <p>No past quests yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Fail Modal */}
            <FailQuestModal
                quest={questToFail}
                onConfirm={handleFailConfirm}
                onCancel={() => setQuestToFail(null)}
            />
        </div>
    );
}

export default QuestBoard;
