'use client';

import { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Sparkles, X } from 'lucide-react';

export default function SoftLoginModal() {
    const { isLoaded, userId } = useAuth();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        // If user is already logged in, don't show prompt
        if (userId) {
            setShowModal(false);
            return;
        }

        // Check if user has skipped this session
        const hasSkipped = sessionStorage.getItem('skipped_login_prompt');

        if (!hasSkipped) {
            // Show modal after a short delay for better UX
            const timer = setTimeout(() => {
                // Double check before showing
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
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        padding: '12px',
                        borderRadius: '50%',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                        <Sparkles size={32} color="white" />
                    </div>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Unlock Full Power</h3>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                    Create a free account to get personalized AI greetings, save your history across devices, and unlock smart tracking features.
                </p>

                <div className="modal-actions" style={{ flexDirection: 'column', gap: '12px' }}>
                    <SignInButton mode="modal">
                        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Sign Up / Log In
                        </button>
                    </SignInButton>

                    <button
                        onClick={handleSkip}
                        className="btn secondary"
                        style={{ width: '100%', justifyContent: 'center', background: 'transparent', border: '1px solid #374151' }}
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}
