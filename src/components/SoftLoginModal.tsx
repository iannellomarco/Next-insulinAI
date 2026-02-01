'use client';

import { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Sparkles, Activity, History, Settings, ChevronRight, X, Zap } from 'lucide-react';

const FEATURES = [
    {
        icon: History,
        title: 'Sync History',
        description: 'Access your meal logs on any device'
    },
    {
        icon: Settings,
        title: 'Save Settings',
        description: 'Your carb ratio and preferences stay put'
    },
    {
        icon: Activity,
        title: 'Track Progress',
        description: 'View insights and glucose trends over time'
    }
];

export default function SoftLoginModal() {
    const { isLoaded, userId } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!isLoaded) return;

        if (userId) {
            setShowModal(false);
            return;
        }

        const hasSkipped = sessionStorage.getItem('skipped_login_prompt');

        if (!hasSkipped) {
            const timer = setTimeout(() => {
                if (!sessionStorage.getItem('skipped_login_prompt')) {
                    setShowModal(true);
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, userId]);

    const handleSkip = () => {
        setShowModal(false);
        sessionStorage.setItem('skipped_login_prompt', 'true');
    };

    const nextSlide = () => {
        if (currentSlide < FEATURES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    if (!showModal) return null;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                {/* Close Button */}
                <button 
                    className="onboarding-close" 
                    onClick={handleSkip}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="onboarding-header">
                    <div className="onboarding-icon">
                        <Zap size={28} />
                    </div>
                    <h2>Unlock Full Features</h2>
                    <p>Create a free account to get the most out of InsulinAI</p>
                </div>

                {/* Feature Cards */}
                <div className="onboarding-features">
                    {FEATURES.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div 
                                key={index} 
                                className={`onboarding-feature ${index === currentSlide ? 'active' : ''}`}
                            >
                                <div className="feature-icon-wrap">
                                    <Icon size={20} />
                                </div>
                                <div className="feature-text">
                                    <span className="feature-title">{feature.title}</span>
                                    <span className="feature-desc">{feature.description}</span>
                                </div>
                                <ChevronRight size={16} className="feature-arrow" />
                            </div>
                        );
                    })}
                </div>

                {/* Guest Notice */}
                <div className="guest-notice">
                    <Sparkles size={14} />
                    <span>Guest mode: Data is stored locally and won't sync across devices</span>
                </div>

                {/* Actions */}
                <div className="onboarding-actions">
                    <SignInButton mode="modal">
                        <button className="onboarding-btn primary">
                            Create Free Account
                        </button>
                    </SignInButton>

                    <button className="onboarding-btn secondary" onClick={handleSkip}>
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}
