import React, { useState } from 'react';
import '../Modals/Modals.css';

/**
 * EditDailyQuestModal Component
 * Two-screen flow: guidance → edit form
 */
function EditDailyQuestModal({ quest, onSave, onCancel }) {
    const [screen, setScreen] = useState('guidance'); // 'guidance' | 'edit'
    const [title, setTitle] = useState(quest?.title || '');
    const [description, setDescription] = useState(quest?.description || '');
    const [saving, setSaving] = useState(false);

    if (!quest) return null;

    const attributeName = quest.attribute
        ? quest.attribute.charAt(0).toUpperCase() + quest.attribute.slice(1)
        : 'Strength';

    const attributeColor =
        quest.attribute === 'strength' ? 'var(--danger)' :
        quest.attribute === 'intelligence' ? 'var(--accent-primary)' :
        quest.attribute === 'vitality' ? 'var(--success)' :
        quest.attribute === 'creation' ? 'var(--accent-gold)' :
        quest.attribute === 'network' ? 'var(--rarity-mythic)' : 'var(--text-primary)';

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            await onSave(quest.id, { title: title.trim(), description: description.trim() });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay fade-in">
            <div className="modal-content edit-daily-modal">
                {screen === 'guidance' ? (
                    <>
                        <div className="edit-guidance-icon">✏️</div>
                        <h2 className="edit-guidance-title">
                            Edit Your <span style={{ color: attributeColor }}>{attributeName}</span> Quest
                        </h2>
                        <div className="edit-guidance-body">
                            <p>
                                Choose an <strong>easy quest</strong> related to <strong style={{ color: attributeColor }}>{attributeName}</strong> — 
                                something you could potentially do <em>every single day</em>.
                            </p>
                            <p className="edit-guidance-emphasis">
                                Pick something you <strong>should</strong> do daily for your personal growth.
                            </p>
                            <p className="edit-guidance-hint">
                                The best daily quests are small habits that compound over time.
                            </p>
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={onCancel}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setScreen('edit')}>
                                Got it →
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={{ color: attributeColor, marginBottom: '1.5rem' }}>
                            ✏️ Edit Quest
                        </h2>
                        <div className="edit-form">
                            <div className="edit-form-group">
                                <label htmlFor="edit-quest-title">Title</label>
                                <input
                                    id="edit-quest-title"
                                    type="text"
                                    className="edit-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Quest title..."
                                    maxLength={100}
                                    autoFocus
                                />
                            </div>
                            <div className="edit-form-group">
                                <label htmlFor="edit-quest-description">Description</label>
                                <textarea
                                    id="edit-quest-description"
                                    className="edit-textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What do you need to do?"
                                    maxLength={300}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setScreen('guidance')}>
                                ← Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving || !title.trim()}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default EditDailyQuestModal;
