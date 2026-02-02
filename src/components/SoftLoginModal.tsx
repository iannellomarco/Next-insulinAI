'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Sparkles, Activity, History, Settings, ChevronRight, X, Zap } from 'lucide-react';
import { useTranslations } from '@/lib/translations';

export default function SoftLoginModal() {
    const { isLoaded, userId } = useAuth();
    const t = useTranslations();
    const [showModal, setShowModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const FEATURES = useMemo(() => [
        {
            icon: History,
            title: t.onboarding.syncTitle,
            description: t.onboarding.syncDesc
        },
        {
            icon: Settings,
            title: t.onboarding.saveTitle,
            description: t.onboarding.saveDesc
        },
        {
            icon: Activity,
            title: t.onboarding.trackTitle,
            description: t.onboarding.trackDesc
        }
    ], [t]);

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

    if (!showModal) return null;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                {/* Close Button */}
                <button
                    className="onboarding-close"
                    onClick={handleSkip}
                    aria-label={t.general.close}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="onboarding-header">
                    <div className="onboarding-icon">
                        <Zap size={28} />
                    </div>
                    <h2>{t.onboarding.unlockTitle}</h2>
                    <p>{t.onboarding.unlockSub}</p>
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
                    <span>{t.onboarding.guestNotice}</span>
                </div>

                {/* Actions */}
                <div className="onboarding-actions">
                    <SignInButton mode="modal">
                        <button className="onboarding-btn primary">
                            {t.onboarding.createAccount}
                        </button>
                    </SignInButton>

                    <button className="onboarding-btn secondary" onClick={handleSkip}>
                        {t.onboarding.continueGuest}
                    </button>
                </div>
            </div>
        </div>
    );
}
