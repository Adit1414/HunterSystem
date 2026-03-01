import React, { useState, useEffect } from 'react';
import { getDailyQuests, completeQuest } from '../../services/api';
import QuestCard from './QuestCard';
import './DailyQuests.css';

function DailyQuests({ onQuestComplete }) {
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    const fetchDailyData = async () => {
        try {
            setLoading(true);
            const data = await getDailyQuests();
            setQuests(data.quests);
        } catch (error) {
            console.error('Failed to load daily quests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyData();

        // Timer for midnight countdown
        const timer = setInterval(() => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;

            if (diff <= 0) {
                // Time to refresh!
                fetchDailyData();
            } else {
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleComplete = async (id) => {
        try {
            const result = await completeQuest(id);
            fetchDailyData(); // Refresh list to show it as completed
            if (onQuestComplete) {
                onQuestComplete(result); // Pass up for level up modals
            }
        } catch (error) {
            console.error('Failed to complete daily quest:', error);
            alert('Failed to complete quest. See console for details.');
        }
    };

    const completedCount = quests.filter(q => q.status === 'completed').length;
    const isSafe = completedCount >= 3;

    if (loading) {
        return <div className="daily-quests-loading">Loading Daily Quests...</div>;
    }

    return (
        <div className="daily-quests-container">
            <div className="daily-header-card">
                <h2>Daily Routine</h2>
                <p className="reset-timer">Resets in: <span>{timeLeft}</span></p>

                <div className={`status-banner ${isSafe ? 'safe' : 'danger'}`}>
                    <div className="status-info">
                        <span className="completion-count">{completedCount} / 5 Completed</span>
                        <p>
                            {isSafe
                                ? "Penalty avoided! Good job fulfilling your daily duties."
                                : "Warning: Complete at least 3 quests before midnight to avoid a penalty (-1 all stats)."}
                        </p>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${(completedCount / 5) * 100}%`, backgroundColor: isSafe ? 'var(--quest-completed)' : 'var(--danger-color)' }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="quest-grid">
                {quests.length === 0 ? (
                    <p className="no-quests">No daily quests found. Try refreshing.</p>
                ) : (
                    quests.map(quest => (
                        <div key={quest.id} className={`daily-wrapper ${quest.status === 'completed' ? 'completed-wrapper' : ''}`}>
                            <QuestCard
                                quest={quest}
                                onComplete={quest.status === 'active' ? handleComplete : undefined}
                            />
                            {quest.status === 'completed' && (
                                <div className="completed-overlay">
                                    <span>COMPLETED</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default DailyQuests;
