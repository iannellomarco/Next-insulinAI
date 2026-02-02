'use client';

import { Calculator, Target, Zap, Sun, Clock, Moon, Check, Activity, Key, Brain } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { CarbRatios } from '@/types';

type SettingsTab = 'insulin' | 'glucose' | 'advanced';

export default function SettingsView() {
    const { settings, updateSettings } = useStore();
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('insulin');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setSaved(false);
        setLocalSettings((prev) => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
        }));
    };

    const handleCarbRatioChange = (meal: keyof CarbRatios, value: number) => {
        setSaved(false);
        setLocalSettings((prev) => ({
            ...prev,
            carbRatios: {
                ...prev.carbRatios,
                [meal]: value,
            },
        }));
    };

    const toggleMealSpecificRatios = () => {
        setSaved(false);
        setLocalSettings((prev) => ({
            ...prev,
            useMealSpecificRatios: !prev.useMealSpecificRatios,
        }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

    return (
        <section id="settings-view" className="view settings-view-new">
            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button 
                    className={`settings-tab ${activeTab === 'insulin' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insulin')}
                >
                    <Calculator size={16} />
                    <span>Insulin</span>
                </button>
                <button 
                    className={`settings-tab ${activeTab === 'glucose' ? 'active' : ''}`}
                    onClick={() => setActiveTab('glucose')}
                >
                    <Activity size={16} />
                    <span>Glucose</span>
                </button>
                <button 
                    className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                    onClick={() => setActiveTab('advanced')}
                >
                    <Zap size={16} />
                    <span>Advanced</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="settings-content">
                {/* Insulin Tab */}
                {activeTab === 'insulin' && (
                    <div className="settings-panel">
                        <div className="panel-header">
                            <h3>Carbohydrate Ratios</h3>
                            <p>Configure how many grams of carbs are covered by 1 unit of insulin</p>
                        </div>

                        <div className="ratio-mode-selector">
                            <button 
                                className={`mode-btn ${!localSettings.useMealSpecificRatios ? 'active' : ''}`}
                                onClick={() => localSettings.useMealSpecificRatios && toggleMealSpecificRatios()}
                            >
                                Single Ratio
                            </button>
                            <button 
                                className={`mode-btn ${localSettings.useMealSpecificRatios ? 'active' : ''}`}
                                onClick={() => !localSettings.useMealSpecificRatios && toggleMealSpecificRatios()}
                            >
                                Per Meal
                            </button>
                        </div>

                        {!localSettings.useMealSpecificRatios ? (
                            <div className="single-ratio-card">
                                <div className="ratio-input-large">
                                    <span className="ratio-prefix">1u : </span>
                                    <input
                                        type="number"
                                        id="carbRatio"
                                        placeholder="10"
                                        min="1"
                                        max="100"
                                        value={localSettings.carbRatio}
                                        onChange={handleChange}
                                    />
                                    <span className="ratio-suffix">g</span>
                                </div>
                                <p className="ratio-description">1 unit of insulin covers {localSettings.carbRatio}g of carbs</p>
                            </div>
                        ) : (
                            <div className="meal-ratios-grid">
                                <div className="meal-ratio-card">
                                    <div className="meal-icon breakfast">
                                        <Sun size={20} />
                                    </div>
                                    <div className="meal-info">
                                        <span className="meal-name">Breakfast</span>
                                        <span className="meal-time">5:00 - 11:00</span>
                                    </div>
                                    <div className="meal-input">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={localSettings.carbRatios?.breakfast ?? 8}
                                            onChange={(e) => handleCarbRatioChange('breakfast', Number(e.target.value))}
                                        />
                                        <span>g/u</span>
                                    </div>
                                </div>
                                <div className="meal-ratio-card">
                                    <div className="meal-icon lunch">
                                        <Clock size={20} />
                                    </div>
                                    <div className="meal-info">
                                        <span className="meal-name">Lunch</span>
                                        <span className="meal-time">11:00 - 16:00</span>
                                    </div>
                                    <div className="meal-input">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={localSettings.carbRatios?.lunch ?? 10}
                                            onChange={(e) => handleCarbRatioChange('lunch', Number(e.target.value))}
                                        />
                                        <span>g/u</span>
                                    </div>
                                </div>
                                <div className="meal-ratio-card">
                                    <div className="meal-icon dinner">
                                        <Moon size={20} />
                                    </div>
                                    <div className="meal-info">
                                        <span className="meal-name">Dinner</span>
                                        <span className="meal-time">16:00 - 5:00</span>
                                    </div>
                                    <div className="meal-input">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={localSettings.carbRatios?.dinner ?? 12}
                                            onChange={(e) => handleCarbRatioChange('dinner', Number(e.target.value))}
                                        />
                                        <span>g/u</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="divider" />

                        <div className="panel-header">
                            <h3>Correction Factor</h3>
                            <p>How much 1 unit of insulin lowers your blood sugar</p>
                        </div>

                        <div className="correction-card">
                            <div className="correction-icon">
                                <Target size={24} />
                            </div>
                            <div className="correction-input">
                                <span className="correction-prefix">1u drops</span>
                                <input
                                    type="number"
                                    id="correctionFactor"
                                    placeholder="50"
                                    min="1"
                                    max="200"
                                    value={localSettings.correctionFactor}
                                    onChange={handleChange}
                                />
                                <span className="correction-suffix">mg/dL</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Glucose Tab */}
                {activeTab === 'glucose' && (
                    <div className="settings-panel">
                        <div className="panel-header">
                            <h3>Glucose Thresholds</h3>
                            <p>Define your target range for glucose readings</p>
                        </div>

                        <div className="threshold-cards">
                            <div className="threshold-card high">
                                <div className="threshold-header">
                                    <span className="threshold-label">High Threshold</span>
                                    <span className="threshold-indicator high-indicator" />
                                </div>
                                <div className="threshold-input-group">
                                    <input
                                        type="number"
                                        id="highThreshold"
                                        min="100"
                                        max="300"
                                        value={localSettings.highThreshold}
                                        onChange={handleChange}
                                    />
                                    <span className="threshold-unit">mg/dL</span>
                                </div>
                                <p className="threshold-hint">Values above this will be flagged as high</p>
                            </div>

                            <div className="threshold-card low">
                                <div className="threshold-header">
                                    <span className="threshold-label">Low Threshold</span>
                                    <span className="threshold-indicator low-indicator" />
                                </div>
                                <div className="threshold-input-group">
                                    <input
                                        type="number"
                                        id="lowThreshold"
                                        min="40"
                                        max="100"
                                        value={localSettings.lowThreshold}
                                        onChange={handleChange}
                                    />
                                    <span className="threshold-unit">mg/dL</span>
                                </div>
                                <p className="threshold-hint">Values below this will be flagged as low</p>
                            </div>
                        </div>

                        <div className="range-visual">
                            <div className="range-bar">
                                <div className="range-zone low-zone" style={{ width: `${(localSettings.lowThreshold / 300) * 100}%` }} />
                                <div className="range-zone target-zone" style={{ 
                                    left: `${(localSettings.lowThreshold / 300) * 100}%`,
                                    width: `${((localSettings.highThreshold - localSettings.lowThreshold) / 300) * 100}%`
                                }} />
                                <div className="range-zone high-zone" style={{ 
                                    left: `${(localSettings.highThreshold / 300) * 100}%`,
                                    width: `${((300 - localSettings.highThreshold) / 300) * 100}%`
                                }} />
                            </div>
                            <div className="range-labels">
                                <span>0</span>
                                <span>{localSettings.lowThreshold}</span>
                                <span>{localSettings.highThreshold}</span>
                                <span>300</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                    <div className="settings-panel">
                        <div className="panel-header">
                            <h3>Smart Features</h3>
                            <p>AI-powered enhancements for better suggestions</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Brain size={24} />
                            </div>
                            <div className="feature-content">
                                <div className="feature-header">
                                    <span className="feature-name">Smart History</span>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            id="smartHistory"
                                            checked={localSettings.smartHistory}
                                            onChange={handleChange}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <p className="feature-description">
                                    Use your past meal data to improve insulin suggestions. 
                                    The AI learns from your glucose responses to similar meals.
                                </p>
                            </div>
                        </div>

                        <div className="divider" />

                        <div className="panel-header">
                            <h3>API Configuration</h3>
                            <p>Use your own API key for unlimited requests</p>
                        </div>

                        <div className="api-card">
                            <div className="api-icon">
                                <Key size={20} />
                            </div>
                            <div className="api-content">
                                <label htmlFor="apiKey">OpenAI API Key</label>
                                <input
                                    type="password"
                                    id="apiKey"
                                    placeholder="sk-..."
                                    value={localSettings.apiKey}
                                    onChange={handleChange}
                                />
                                <p className="api-hint">Leave blank to use the default system key</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            {hasChanges && (
                <button 
                    className={`settings-save-fab ${saved ? 'saved' : ''}`}
                    onClick={handleSave}
                    aria-label={saved ? 'Saved' : 'Save Settings'}
                >
                    <Check size={24} />
                    {saved && <span className="save-label">Saved!</span>}
                </button>
            )}
        </section>
    );
}
