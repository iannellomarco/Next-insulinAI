'use client';

import { useState } from 'react';
import { ArrowLeft, Activity, Check, AlertTriangle, Clock, Percent, Plus, Link2, Edit3 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { HistoryItem, AnalysisResult, getCurrentMealPeriod } from '@/types';
import { AIService } from '@/lib/ai-service';
import FunFactLoader from '@/components/ui/FunFactLoader';

// Split bolus timing - time between first and second dose
const SPLIT_INTERVAL_PRESETS = [
    { label: '1h', value: '1 hour', description: 'Take second dose 1 hour after first' },
    { label: '1.5h', value: '1.5 hours', description: 'Take second dose 1.5 hours after first' },
    { label: '2h', value: '2 hours', description: 'Take second dose 2 hours after first' },
    { label: '3h', value: '3 hours', description: 'Take second dose 3 hours after first (high fat)' },
];

interface ResultsViewProps {
    onBack: () => void;
    onSave?: () => void;
    onAddMore?: () => void;
}

export default function ResultsView({ onBack, onSave, onAddMore }: ResultsViewProps) {
    const { 
        analysisResult, 
        isLoading, 
        addHistoryItem, 
        chainedMeals, 
        addToChain,
        clearChain,
        isChaining,
        setIsChaining 
    } = useStore();
    const [preGlucose, setPreGlucose] = useState<string>('');
    const [saved, setSaved] = useState(false);
    const [splitBolusAccepted, setSplitBolusAccepted] = useState<boolean | null>(null);
    const [isEditingInsulin, setIsEditingInsulin] = useState(false);
    const [customInsulin, setCustomInsulin] = useState<string>('');
    const [selectedSplitDuration, setSelectedSplitDuration] = useState<string>('');

    if (isLoading) {
        return (
            <section id="results-view" className="view">
                <FunFactLoader />
            </section>
        );
    }

    if (!analysisResult) return null;

    // Combine chained meals with current result for display
    const allMeals = isChaining ? [...chainedMeals, analysisResult] : [analysisResult];
    const displayResult = allMeals.length > 1 
        ? AIService.combineResults(allMeals) 
        : analysisResult;

    const {
        friendly_description,
        suggested_insulin,
        total_carbs,
        food_items,
        reasoning,
        split_bolus_recommendation,
        warnings,
    } = displayResult;

    const handleSave = () => {
        const baseTimestamp = Date.now();
        const parsedPreGlucose = preGlucose ? parseInt(preGlucose, 10) : undefined;
        const hasSplitBolus = split_bolus_recommendation?.recommended && splitBolusAccepted === true;
        // Save actual insulin: use custom value if set, otherwise use suggested
        const finalInsulin = customInsulin ? parseFloat(customInsulin) : suggested_insulin;
        const mealPeriod = getCurrentMealPeriod();
        
        console.log("[v0] Saving meal - customInsulin:", customInsulin, "suggested:", suggested_insulin, "finalInsulin:", finalInsulin);
        
        if (allMeals.length > 1) {
            // Save each meal individually with a shared chainId for visualization
            const chainId = `chain-${baseTimestamp}`;
            allMeals.forEach((meal, index) => {
                const historyItem: HistoryItem = {
                    ...meal,
                    id: `meal-${baseTimestamp}-${index}`,
                    timestamp: baseTimestamp,
                    pre_glucose: index === 0 ? parsedPreGlucose : undefined,
                    chainId,
                    chainIndex: index,
                    split_bolus_accepted: index === 0 ? hasSplitBolus : undefined,
                    actual_insulin: index === 0 ? finalInsulin : undefined,
                    meal_period: index === 0 ? mealPeriod : undefined,
                };
                addHistoryItem(historyItem);
            });
        } else {
            // Single meal - no chain
            const historyItem: HistoryItem = {
                ...displayResult,
                id: `meal-${baseTimestamp}`,
                timestamp: baseTimestamp,
                pre_glucose: parsedPreGlucose,
                split_bolus_accepted: hasSplitBolus,
                actual_insulin: finalInsulin,
                meal_period: mealPeriod,
            };
            addHistoryItem(historyItem);
        }
        
        setSaved(true);
        clearChain();
        if (onSave) onSave();
    };

    const handleAddAnother = () => {
        // Add current result to chain and go back to scan
        addToChain(analysisResult);
        setIsChaining(true);
        if (onAddMore) onAddMore();
    };

    return (
        <section id="results-view" className="view">
            <div className="view-header">
                <button 
                    id="back-home" 
                    className="icon-btn" 
                    onClick={() => {
                        clearChain();
                        onBack();
                    }}
                    aria-label="Go back"
                >
                    <ArrowLeft size={22} />
                </button>
                <h2>Analysis Results</h2>
                <div style={{ width: 40 }} />
            </div>

            <div id="analysis-content">
                {/* Chain Banner - Show when items are chained */}
                {allMeals.length > 1 && (
                    <div className="chain-banner">
                        <div className="chain-icon">
                            <Link2 size={18} />
                        </div>
                        <div className="chain-info">
                            <span>Combined Meal ({allMeals.length} items)</span>
                            <small>Totals calculated from all scanned foods</small>
                        </div>
                        <button 
                            className="chain-clear" 
                            onClick={() => {
                                clearChain();
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Chained Items List */}
                {allMeals.length > 1 && (
                    <div className="chain-items-list">
                        {allMeals.map((meal, idx) => (
                            <div key={idx} className="chain-item">
                                <span className="chain-item-number">{idx + 1}</span>
                                <span className="chain-item-name">
                                    {meal.food_items[0]?.name || meal.friendly_description.slice(0, 30)}
                                </span>
                                <span className="chain-item-carbs">{meal.total_carbs}g</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Summary Card */}
                <div className="summary-card">
                    <h3>Recommended Insulin</h3>
                    {isEditingInsulin ? (
                        <div className="insulin-edit-container">
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                className="insulin-edit-input"
                                value={customInsulin}
                                onChange={(e) => setCustomInsulin(e.target.value)}
                                autoFocus
                                onBlur={() => {
                                    if (!customInsulin) setCustomInsulin(suggested_insulin.toString());
                                    setIsEditingInsulin(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (!customInsulin) setCustomInsulin(suggested_insulin.toString());
                                        setIsEditingInsulin(false);
                                    }
                                }}
                            />
                            <span className="unit">units</span>
                        </div>
                    ) : (
                        <button 
                            className="insulin-dose clickable"
                            onClick={() => {
                                setCustomInsulin(customInsulin || suggested_insulin.toString());
                                setIsEditingInsulin(true);
                            }}
                            title="Click to edit insulin amount"
                        >
                            {customInsulin || suggested_insulin}
                            <span className="unit">units</span>
                            <Edit3 size={14} className="edit-icon" />
                        </button>
                    )}
                    {customInsulin && parseFloat(customInsulin) !== suggested_insulin && (
                        <p className="insulin-adjusted">
                            Adjusted from {suggested_insulin}u suggested
                        </p>
                    )}
                    <p>{allMeals.length > 1 ? `Combined: ${friendly_description}` : friendly_description}</p>
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
                    <div className={`split-bolus-card ${splitBolusAccepted === true ? 'accepted' : ''} ${splitBolusAccepted === false ? 'declined' : ''}`}>
                        <div className="split-header">
                            <Clock size={18} className="text-warning" />
                            <h3>Split Bolus Recommended</h3>
                        </div>
                        <div className="split-details">
                            <div className="split-row">
                                <Percent size={14} />
                                <p><strong>Split:</strong> {split_bolus_recommendation.split_percentage}</p>
                            </div>
                            <p className="split-reason">{split_bolus_recommendation.reason}</p>
                            
                            {/* Time Between Doses */}
                            <div className="split-timing-section">
                                <p className="timing-label">Time between doses:</p>
                                <div className="timing-presets">
                                    {SPLIT_INTERVAL_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            className={`timing-preset ${(selectedSplitDuration || '1.5 hours') === preset.value ? 'active' : ''}`}
                                            onClick={() => setSelectedSplitDuration(preset.value)}
                                            title={preset.description}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="timing-hint">
                                    {SPLIT_INTERVAL_PRESETS.find(p => p.value === (selectedSplitDuration || '1.5 hours'))?.description}
                                </p>
                            </div>
                        </div>
                        {splitBolusAccepted === null && (
                            <div className="split-actions">
                                <button 
                                    className="split-btn accept"
                                    onClick={() => setSplitBolusAccepted(true)}
                                >
                                    <Check size={16} />
                                    Accept Split
                                </button>
                                <button 
                                    className="split-btn decline"
                                    onClick={() => setSplitBolusAccepted(false)}
                                >
                                    Skip
                                </button>
                            </div>
                        )}
                        {splitBolusAccepted === true && (
                            <div className="split-status accepted">
                                <Check size={16} />
                                Take second dose in {selectedSplitDuration || '1.5 hours'}
                            </div>
                        )}
                        {splitBolusAccepted === false && (
                            <div className="split-status declined">
                                Standard bolus selected
                            </div>
                        )}
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

                {/* Add Another Food Button */}
                {!saved && (
                    <button className="chain-add-btn" onClick={handleAddAnother}>
                        <Plus size={18} />
                        Add another food to this meal
                    </button>
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
