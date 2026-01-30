'use client';

import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/lib/store';
import { AnalysisResult } from '@/types';
import FunFactLoader from '@/components/ui/FunFactLoader';

export default function ResultsView({ onBack }: { onBack: () => void }) {
    const { analysisResult, isLoading } = useStore();

    if (isLoading) {
        return (
            <section id="results-view" className="view">
                <FunFactLoader />
            </section>
        );
    }

    if (!analysisResult) return null;

    const {
        friendly_description,
        suggested_insulin,
        total_carbs,
        food_items,
        reasoning,
        split_bolus_recommendation,
        warnings,
    } = analysisResult;

    return (
        <section id="results-view" className="view">
            <div className="view-header">
                <button id="back-home" className="icon-btn" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Analysis</h2>
            </div>

            <div id="analysis-content">
                <div className="summary-card">
                    <h3>Suggested Insulin</h3>
                    <div className="insulin-dose">{suggested_insulin} <span className="unit">units</span></div>
                    <p>{friendly_description}</p>
                </div>

                {split_bolus_recommendation?.recommended && (
                    <div className="split-bolus-card">
                        <div className="split-header">
                            <span className="split-icon">🍕</span>
                            <h3>Split Bolus Recommended</h3>
                        </div>
                        <div className="split-details">
                            <p><strong>Split:</strong> {split_bolus_recommendation.split_percentage}</p>
                            <p><strong>Duration:</strong> {split_bolus_recommendation.duration}</p>
                            <p className="split-reason">"{split_bolus_recommendation.reason}"</p>
                        </div>
                    </div>
                )}

                <div className="result-card">
                    <h3>Macros</h3>
                    <p>Total Carbs: <strong>{total_carbs}g</strong></p>
                    <div style={{ marginTop: '12px' }}>
                        {food_items.map((item, idx) => (
                            <div key={idx} className="food-item">
                                <span className="food-name">{item.name}</span>
                                <span className="food-macros">
                                    {item.carbs}g carbs • {item.fat}g fat • {item.protein}g prot
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="result-card">
                    <h3>Reasoning</h3>
                    {Array.isArray(reasoning) ? (
                        <ul className="reasoning-list">
                            {reasoning.map((step, idx) => (
                                <li key={idx}>{step}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>{reasoning}</p>
                    )}
                </div>

                {warnings && warnings.length > 0 && (
                    <div className="warning-box">
                        ⚠️ {warnings.join(' ')}
                    </div>
                )}
            </div>
        </section>
    );
}
