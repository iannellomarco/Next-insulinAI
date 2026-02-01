'use client';

import { useState } from 'react';
import { ArrowLeft, Activity, Check, AlertTriangle, Clock, Percent } from 'lucide-react';
import { useStore } from '@/lib/store';
import { HistoryItem } from '@/types';
import FunFactLoader from '@/components/ui/FunFactLoader';

interface ResultsViewProps {
    onBack: () => void;
    onSave?: () => void;
}

export default function ResultsView({ onBack, onSave }: ResultsViewProps) {
    const { analysisResult, isLoading, addHistoryItem } = useStore();
    const [preGlucose, setPreGlucose] = useState<string>('');
    const [saved, setSaved] = useState(false);

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

    const handleSave = () => {
        const historyItem: HistoryItem = {
            ...analysisResult,
            id: `meal-${Date.now()}`,
            timestamp: Date.now(),
            pre_glucose: preGlucose ? parseInt(preGlucose, 10) : undefined,
        };
        addHistoryItem(historyItem);
        setSaved(true);
        if (onSave) onSave();
    };

    return (
        <section id="results-view" className="view">
            <div className="view-header">
                <button 
                    id="back-home" 
                    className="icon-btn" 
                    onClick={onBack}
                    aria-label="Go back"
                >
                    <ArrowLeft size={22} />
                </button>
                <h2>Analysis Results</h2>
                <div style={{ width: 40 }} />
            </div>

            <div id="analysis-content">
                {/* Main Summary Card */}
                <div className="summary-card">
                    <h3>Recommended Insulin</h3>
                    <div className="insulin-dose">
                        {suggested_insulin}
                        <span className="unit">units</span>
                    </div>
                    <p>{friendly_description}</p>
                </div>

                {/* Pre-meal Glucose Input */}
                <div className="glucose-input-card">
                    <div className="glucose-header">
                        <Activity size={18} strokeWidth={2} />
                        <h3>Current Glucose</h3>
                        <span className="optional-badge">Optional</span>
                    </div>
                    <div className="glucose-input-row">
                        <input
                            type="number"
                            placeholder="e.g. 120"
                            value={preGlucose}
                            onChange={(e) => setPreGlucose(e.target.value)}
                            className="glucose-input"
                            aria-label="Enter current glucose level"
                        />
                        <span className="glucose-unit">mg/dL</span>
                    </div>
                </div>

                {/* Split Bolus Recommendation */}
                {split_bolus_recommendation?.recommended && (
                    <div className="split-bolus-card">
                        <div className="split-header">
                            <Clock size={18} className="text-warning" />
                            <h3>Split Bolus Recommended</h3>
                        </div>
                        <div className="split-details">
                            <div className="split-row">
                                <Percent size={14} />
                                <p><strong>Split:</strong> {split_bolus_recommendation.split_percentage}</p>
                            </div>
                            <div className="split-row">
                                <Clock size={14} />
                                <p><strong>Duration:</strong> {split_bolus_recommendation.duration}</p>
                            </div>
                            <p className="split-reason">{split_bolus_recommendation.reason}</p>
                        </div>
                    </div>
                )}

                {/* Macros Card */}
                <div className="result-card">
                    <h3>Nutrition Breakdown</h3>
                    <p className="total-carbs">
                        Total Carbs: <strong>{total_carbs}g</strong>
                    </p>
                    <div className="food-list">
                        {food_items.map((item, idx) => (
                            <div key={idx} className="food-item">
                                <span className="food-name">{item.name}</span>
                                <span className="food-macros">
                                    {item.carbs}g carbs · {item.fat}g fat · {item.protein}g protein
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reasoning Card */}
                <div className="result-card">
                    <h3>How we calculated this</h3>
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

                {/* Warnings */}
                {warnings && warnings.length > 0 && (
                    <div className="warning-box" role="alert">
                        <AlertTriangle size={18} />
                        <span>{warnings.join(' ')}</span>
                    </div>
                )}
            </div>

            {/* Fixed Save Button */}
            <div className="save-footer">
                <button
                    className={`save-meal-btn ${saved ? 'saved' : ''}`}
                    onClick={handleSave}
                    disabled={saved}
                    aria-label={saved ? 'Meal saved' : 'Save to history'}
                >
                    {saved ? (
                        <>
                            <Check size={20} />
                            Saved to History
                        </>
                    ) : (
                        'Save to History'
                    )}
                </button>
            </div>
        </section>
    );
}
