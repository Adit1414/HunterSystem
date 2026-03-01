import React from 'react';
import '../Modals/Modals.css';

/**
 * FailQuestModal Component
 * Prompts user with 50% attribute penalty warning before failing.
 */
function FailQuestModal({ quest, onConfirm, onCancel }) {
    if (!quest) return null;

    const attributeName = quest.attribute || 'strength';

    return (
        <div className="modal-overlay fade-in">
            <div className="modal-content fail-quest-modal">
                <div className="modal-header">
                    <h2>⚠️ Warning: Quest Failure</h2>
                </div>

                <div className="modal-body text-center mt-3">
                    <p className="mb-3">
                        Failing this quest will have a <strong>50% chance</strong> of reducing a <strong style={{ color: 'var(--danger)' }}>{attributeName}</strong> point.
                    </p>
                    <p className="mb-4 text-secondary">
                        Are you sure you can't finish this quest?
                    </p>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        No, I can do this
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => onConfirm(quest.id)}
                    >
                        Yes, I failed
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FailQuestModal;
