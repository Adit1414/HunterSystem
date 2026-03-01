import React, { useState } from 'react';
import { createQuest } from '../../services/api';

function QuestForm({ onQuestCreated, onCancel }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'E',
        dueDate: '',
        attribute: 'strength'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createQuest(formData);
            onQuestCreated();
            setFormData({ title: '', description: '', difficulty: 'E', dueDate: '', attribute: 'strength' });
        } catch (error) {
            console.error('Failed to create quest:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quest-form-container">
            <h3>Create New Quest</h3>
            <form onSubmit={handleSubmit} className="quest-form">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Enter quest title..."
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter quest details..."
                        rows="3"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Difficulty</label>
                        <select
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        >
                            <option value="E">E-Rank</option>
                            <option value="D">D-Rank</option>
                            <option value="C">C-Rank</option>
                            <option value="B">B-Rank</option>
                            <option value="A">A-Rank</option>
                            <option value="S">S-Rank</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Attribute Reward</label>
                        <select
                            value={formData.attribute}
                            onChange={(e) => setFormData({ ...formData, attribute: e.target.value })}
                        >
                            <option value="strength">Strength</option>
                            <option value="creation">Creation</option>
                            <option value="network">Network</option>
                            <option value="vitality">Vitality</option>
                            <option value="intelligence">Intelligence</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Due Date (Optional)</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Quest'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default QuestForm;
