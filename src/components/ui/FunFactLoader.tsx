'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const DIABETES_FACTS = [
    "Fiber helps slow down glucose absorption.",
    "Walking after meals can lower blood sugar.",
    "Protein and fat don't spike insulin as much as carbs.",
    "Hydration is key for better glucose control.",
    "Cinnamon may help improve insulin sensitivity.",
    "Stress releases hormones that can raise blood sugar.",
    "A good night's sleep improves insulin resistance.",
    "Whole grains are better than refined grains.",
    "Regular testing helps you spot patterns.",
    "The 'pizza effect' causes delayed glucose spikes."
];

export default function FunFactLoader() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        // Random start
        setActiveIndex(Math.floor(Math.random() * DIABETES_FACTS.length));

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % DIABETES_FACTS.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div id="loading" className="fun-fact-loader">
            <Loader2 className="spinner" size={48} />
            <p className="loading-text">Analyzing food...</p>

            <div className="fact-wrapper">
                <p className="did-you-know">Did you know?</p>
                <div className="facts-container">
                    {DIABETES_FACTS.map((fact, index) => (
                        <p
                            key={index}
                            className={`fact-text ${index === activeIndex ? 'active' : ''}`}
                        >
                            {fact}
                        </p>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .fun-fact-loader {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 60vh;
                    text-align: center;
                    padding: 20px;
                }

                .spinner {
                    color: var(--primary-color);
                    margin-bottom: 20px;
                    animation: spin 1s linear infinite;
                }

                .loading-text {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 30px;
                    color: white;
                }

                .fact-wrapper {
                    max-width: 320px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .did-you-know {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--primary-color);
                    margin-bottom: 16px;
                    font-weight: 700;
                    z-index: 10;
                }

                .facts-container {
                    position: relative;
                    width: 100%;
                    height: 80px; /* Fixed height to accommodate text */
                    display: flex;
                    justify-content: center;
                }

                .fact-text {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    font-size: 1rem;
                    color: #e5e5e5;
                    line-height: 1.5;
                    margin: 0;
                    font-style: italic;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 1s ease-in-out, transform 1s ease-in-out;
                    pointer-events: none; /* Prevent selection of invisible text */
                }

                .fact-text.active {
                    opacity: 1;
                    transform: translateY(0);
                    z-index: 1;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
