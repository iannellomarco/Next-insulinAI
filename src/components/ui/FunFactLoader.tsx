'use client';

import { Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

const STATIC_FACTS = [
    "Fiber helps slow down glucose absorption.",
    "Walking after meals can lower blood sugar.",
    "Protein and fat don't spike insulin as much as carbs.",
    "Hydration is key for better glucose control.",
    "Cinnamon may help improve insulin sensitivity.",
    "Stress releases hormones that can raise blood sugar.",
    "A good night's sleep improves insulin resistance.",
    "Whole grains are better than refined grains.",
    "Regular testing helps you spot patterns.",
    "The 'pizza effect' causes delayed glucose spikes.",
    "Pre-bolusing 15-20 mins before eating can help.",
    "Exercise increases insulin sensitivity for hours."
];

interface FunFactLoaderProps {
    isLoggedIn?: boolean;
}

export default function FunFactLoader({ isLoggedIn = false }: FunFactLoaderProps) {
    const [facts, setFacts] = useState<string[]>(STATIC_FACTS);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAiGenerated, setIsAiGenerated] = useState(false);
    const [isLoadingFacts, setIsLoadingFacts] = useState(false);

    // Fetch AI-generated facts for logged-in users
    useEffect(() => {
        if (isLoggedIn && !isLoadingFacts) {
            setIsLoadingFacts(true);
            fetch('/api/facts', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.facts && data.facts.length > 0) {
                        setFacts(data.facts);
                        setIsAiGenerated(true);
                        setActiveIndex(0);
                    }
                })
                .catch(() => {
                    // Keep static facts on error
                })
                .finally(() => {
                    setIsLoadingFacts(false);
                });
        }
    }, [isLoggedIn]);

    // Rotate through facts
    useEffect(() => {
        setActiveIndex(Math.floor(Math.random() * facts.length));

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % facts.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [facts]);

    return (
        <div className="loader-container" role="status" aria-live="polite">
            <div className="loader-spinner">
                <Loader2 className="spinner-icon" size={40} />
            </div>
            
            <p className="loader-text">Analyzing your food...</p>

            <div className={`fact-card ${isAiGenerated ? 'ai-generated' : ''}`}>
                <div className="fact-header">
                    {isAiGenerated ? (
                        <>
                            <Sparkles size={14} />
                            <span>AI-powered tip</span>
                        </>
                    ) : (
                        <>
                            <Lightbulb size={14} />
                            <span>Did you know?</span>
                        </>
                    )}
                </div>
                <div className="facts-wrapper">
                    {facts.map((fact, index) => (
                        <p
                            key={`${index}-${fact.substring(0, 10)}`}
                            className={`fact-item ${index === activeIndex ? 'active' : ''}`}
                        >
                            {fact}
                        </p>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .loader-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 60vh;
                    text-align: center;
                    padding: 2rem 1.5rem;
                }

                .loader-spinner {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.25rem;
                }

                :global(.spinner-icon) {
                    color: var(--primary);
                    animation: spin 1s linear infinite;
                }

                .loader-text {
                    font-size: 1.0625rem;
                    font-weight: 500;
                    color: var(--foreground);
                    margin-bottom: 2rem;
                }

                .fact-card {
                    max-width: 300px;
                    width: 100%;
                    background: var(--card);
                    padding: 1.25rem;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    transition: all 0.3s ease;
                }

                .fact-card.ai-generated {
                    border-color: var(--primary);
                    background: linear-gradient(135deg, var(--card) 0%, rgba(13, 148, 136, 0.05) 100%);
                }

                .fact-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.375rem;
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--primary);
                    margin-bottom: 0.875rem;
                    font-weight: 600;
                }

                .facts-wrapper {
                    position: relative;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .fact-item {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    font-size: 0.9375rem;
                    color: var(--foreground);
                    line-height: 1.5;
                    margin: 0;
                    opacity: 0;
                    transform: translateY(8px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                    pointer-events: none;
                }

                .fact-item.active {
                    opacity: 1;
                    transform: translateY(0);
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
