import React, { useState, useEffect } from 'react';
import './Tutorial.css';

const TUTORIAL_STEPS = [
    {
        title: 'Welcome to the Hunter System!',
        content: 'This system is designed to help you track your solo productivity journey. Let me guide you through how everything works.',
        view: 'dashboard',
        targetSelector: null,
        position: 'center'
    },
    {
        title: 'Player Attributes',
        content: `Your stats are divided into 5 core attributes:
• Strength: Physical workouts and fitness goals.
• Creation: Coding, building things, writing, and art.
• Network: Socializing, networking events, and helping others.
• Vitality: Sleep, health, meditation, and eating well.
• Intelligence: Studying, reading, and learning new skills.`,
        view: 'dashboard',
        targetSelector: '.attributes-grid',
        position: 'top'
    },
    {
        title: 'Leveling Up',
        content: 'You automatically gain 1 point in EVERY attribute for each level you gain.\n\nOn top of that, attribute points are allocated automatically based on your quest XP! For every ~17% of a level\'s total XP you earn from a specific attribute, you get 1 extra point in it.\n\nFor example: if 35% of your XP came from Strength and 30% from Creation, Strength gets +2 points and Creation gets +1 point automatically when you level up!',
        view: 'dashboard',
        targetSelector: '.dashboard-section:nth-of-type(2)', // XP Progress bar wrapper
        position: 'bottom'
    },
    {
        title: 'Hunter Ranks',
        content: 'As you level up, you will also ascend in Hunter Rank:\n\n• Level 1: E-Rank\n• Level 5: D-Rank\n• Level 10: C-Rank\n• Level 20: B-Rank\n• Level 35: A-Rank\n• Level 50: S-Rank\n• Level 75: National Level Hunter\n• Level 100: Shadow Monarch',
        view: 'dashboard',
        targetSelector: '.dashboard-hero',
        position: 'bottom'
    },
    {
        title: 'Daily Quests & The Penalty',
        content: 'You must finish at least 3 daily quests every day. These are designed to be the bare minimum you should be able to do, and you can edit them to fit your own routine!\n\nIf you fail to do 3, you face a penalty: you lose 1 point from each attribute (with a minimum floor of 10).',
        view: 'daily',
        targetSelector: '.status-banner',
        position: 'bottom'
    },
    {
        title: 'Penalty Skip',
        content: 'Need a break or feeling sick? You can turn on the penalty skip toggle to avoid stat loss. However, while this is active, you will earn significantly less XP from all quests.',
        view: 'daily',
        targetSelector: '.penalty-toggle-section',
        position: 'bottom'
    },
    {
        title: 'Customizing Quests',
        content: 'You can set your own custom quests and decide their difficulty (E, D, C, B, A, S rank).\n\nYou decide what counts as an "E-rank" baseline quest for you. From there, each higher rank sequentially doubles in difficulty and grants proportionally higher XP!',
        view: 'quests',
        targetSelector: '.board-header',
        position: 'bottom'
    },
    {
        title: 'Ready to awaken?',
        content: 'Your journey begins now. Complete quests, earn XP, gather items in your inventory, and level up to become a Shadow Monarch!',
        view: 'dashboard',
        targetSelector: null,
        position: 'center'
    }
];

function Tutorial({ isActive, onClose, setActiveView }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    // Whenever step changes, update the app's active view and calculate target rect
    useEffect(() => {
        if (!isActive) return;
        const step = TUTORIAL_STEPS[currentStep];
        
        setActiveView(step.view);
        setTargetRect(null); // Reset while we calculate

        if (step.targetSelector) {
            const timer = setTimeout(() => {
                const el = document.querySelector(step.targetSelector);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const top = rect.top + window.scrollY;
                    const left = rect.left + window.scrollX;
                    setTargetRect({ top, left, width: rect.width, height: rect.height });
                    
                    // Smoothly scroll to center the element
                    window.scrollTo({
                        top: top - window.innerHeight / 2 + rect.height / 2,
                        behavior: 'smooth'
                    });
                }
            }, 300); // Wait for page transition to finish rendering
            return () => clearTimeout(timer);
        }
    }, [currentStep, isActive, setActiveView]);

    if (!isActive) return null;

    const step = TUTORIAL_STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === TUTORIAL_STEPS.length - 1;

    const handleNext = () => {
        if (!isLast) setCurrentStep(c => c + 1);
    };

    const handlePrev = () => {
        if (!isFirst) setCurrentStep(c => c - 1);
    };

    const handleFinish = () => {
        setCurrentStep(0);
        onClose();
    };

    // Calculate spotlight overlay styles
    const overlayStyle = targetRect ? {
        position: 'absolute',
        top: targetRect.top - 12,
        left: targetRect.left - 12,
        width: targetRect.width + 24,
        height: targetRect.height + 24,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
        borderRadius: '12px',
        pointerEvents: 'none',
        zIndex: 999,
        transition: 'all 0.3s ease'
    } : {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 999,
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
    };

    // Calculate modal positioning
    let modalStyle = { zIndex: 1000 };
    if (targetRect && step.position === 'bottom') {
        modalStyle = {
            position: 'absolute',
            top: targetRect.top + targetRect.height + 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000
        };
    } else if (targetRect && step.position === 'top') {
        modalStyle = {
            position: 'absolute',
            top: targetRect.top - 24,
            left: '50%',
            transform: 'translate(-50%, -100%)',
            zIndex: 1000
        };
    } else {
        modalStyle = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
        };
    }

    return (
        <div className="tutorial-wrapper">
            <div className="tutorial-spotlight" style={overlayStyle}></div>
            
            <div className="tutorial-modal" style={modalStyle}>
                <div className="tutorial-header">
                    <h2>{step.title}</h2>
                    <span className="tutorial-counter">{currentStep + 1} / {TUTORIAL_STEPS.length}</span>
                </div>
                
                <div className="tutorial-content">
                    {step.content.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
                </div>

                <div className="tutorial-footer">
                    <button className="tutorial-btn secondary" onClick={handleFinish}>
                        Skip / Exit
                    </button>
                    
                    <div className="tutorial-nav-buttons">
                        <button 
                            className="tutorial-btn" 
                            onClick={handlePrev} 
                            disabled={isFirst}
                        >
                            Back
                        </button>
                        
                        {isLast ? (
                            <button className="tutorial-btn primary" onClick={handleFinish}>
                                Finish
                            </button>
                        ) : (
                            <button className="tutorial-btn primary" onClick={handleNext}>
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Tutorial;
