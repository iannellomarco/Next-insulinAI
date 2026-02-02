'use client';

import { Calculator, Target, ChevronDown, Zap, Sun, Clock, Moon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { CarbRatios } from '@/types';

export default function SettingsView() {
    const { settings, updateSettings } = useStore();
    const [localSettings, setLocalSettings] = useState(settings);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

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
        console.log("[v0] Saving settings - carbRatios:", localSettings.carbRatios, "useMealSpecificRatios:", localSettings.useMealSpecificRatios);
        updateSettings(localSettings);
        setSaved(true);
    };

    return (
        <section id="settings-view" className="view settings-view">
            <h2 className="settings-title">Settings</h2>
            
            <div className="settings-form">
                {/* Carb Ratio Section */}
                <div className="settings-section">
                    <div className="section-icon">
                        <Calculator size={18} />
                    </div>
                    <div className="section-content">
                        <div className="input-group">
                            <div className="ratio-header">
                                <label>Carb Ratios</label>
                                <button 
                                    type="button"
                                    className={`ratio-toggle ${localSettings.useMealSpecificRatios ? 'active' : ''}`}
                                    onClick={toggleMealSpecificRatios}
                                >
                                    {localSettings.useMealSpecificRatios ? 'Per Meal' : 'Single'}
                                </button>
                            </div>
                            <p className="hint">1 unit of insulin covers X grams of carbs</p>
                            
                            {!localSettings.useMealSpecificRatios ? (
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        id="carbRatio"
                                        placeholder="10"
                                        min="1"
                                        max="100"
                                        value={localSettings.carbRatio}
                                        onChange={handleChange}
                                    />
                                    <span className="input-unit">g/unit</span>
                                </div>
                            ) : (
                                <div className="meal-ratios">
                                    <div className="meal-ratio-item">
                                        <div className="meal-ratio-label">
                                            <Sun size={14} />
                                            <span>Breakfast</span>
                                            <span className="time-hint">5am - 11am</span>
                                        </div>
                                        <div className="input-with-unit compact">
                                            <input
                                                type="number"
                                                placeholder="8"
                                                min="1"
                                                max="100"
                                                value={localSettings.carbRatios?.breakfast ?? 8}
                                                onChange={(e) => handleCarbRatioChange('breakfast', Number(e.target.value))}
                                            />
                                            <span className="input-unit">g/u</span>
                                        </div>
                                    </div>
                                    <div className="meal-ratio-item">
                                        <div className="meal-ratio-label">
                                            <Clock size={14} />
                                            <span>Lunch</span>
                                            <span className="time-hint">11am - 4pm</span>
                                        </div>
                                        <div className="input-with-unit compact">
                                            <input
                                                type="number"
                                                placeholder="10"
                                                min="1"
                                                max="100"
                                                value={localSettings.carbRatios?.lunch ?? 10}
                                                onChange={(e) => handleCarbRatioChange('lunch', Number(e.target.value))}
                                            />
                                            <span className="input-unit">g/u</span>
                                        </div>
                                    </div>
                                    <div className="meal-ratio-item">
                                        <div className="meal-ratio-label">
                                            <Moon size={14} />
                                            <span>Dinner</span>
                                            <span className="time-hint">4pm - 5am</span>
                                        </div>
                                        <div className="input-with-unit compact">
                                            <input
                                                type="number"
                                                placeholder="12"
                                                min="1"
                                                max="100"
                                                value={localSettings.carbRatios?.dinner ?? 12}
                                                onChange={(e) => handleCarbRatioChange('dinner', Number(e.target.value))}
                                            />
                                            <span className="input-unit">g/u</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Correction Factor Section */}
                <div className="settings-section">
                    <div className="section-icon">
                        <Target size={18} />
                    </div>
                    <div className="section-content">
                        <div className="input-group">
                            <label htmlFor="correctionFactor">Correction Factor</label>
                            <p className="hint">1 unit drops blood sugar by X mg/dL</p>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    id="correctionFactor"
                                    placeholder="50"
                                    min="1"
                                    max="200"
                                    value={localSettings.correctionFactor}
                                    onChange={handleChange}
                                />
                                <span className="input-unit">mg/dL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Glucose Thresholds */}
                <div className="settings-card">
                    <h3>Glucose Thresholds</h3>
                    <p className="card-hint">Values outside these ranges will be highlighted</p>
                    
                    <div className="threshold-inputs">
                        <div className="input-group">
                            <label htmlFor="highThreshold">High</label>
                            <div className="input-with-unit compact">
                                <input
                                    type="number"
                                    id="highThreshold"
                                    placeholder="180"
                                    min="100"
                                    max="300"
                                    value={localSettings.highThreshold}
                                    onChange={handleChange}
                                />
                                <span className="input-unit">mg/dL</span>
                            </div>
                        </div>
                        <div className="input-group">
                            <label htmlFor="lowThreshold">Low</label>
                            <div className="input-with-unit compact">
                                <input
                                    type="number"
                                    id="lowThreshold"
                                    placeholder="70"
                                    min="40"
                                    max="100"
                                    value={localSettings.lowThreshold}
                                    onChange={handleChange}
                                />
                                <span className="input-unit">mg/dL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <button 
                    className="advanced-toggle"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    aria-expanded={showAdvanced}
                >
                    <Zap size={16} />
                    <span>Advanced Settings</span>
                    <ChevronDown 
                        size={16} 
                        className={`toggle-icon ${showAdvanced ? 'open' : ''}`}
                    />
                </button>

                {showAdvanced && (
                    <div className="advanced-content">
                        <div className="input-group">
                            <label htmlFor="apiKey">Custom API Key</label>
                            <p className="hint">Leave blank to use the default system key</p>
                            <input
                                type="password"
                                id="apiKey"
                                placeholder="Enter your OpenAI API key"
                                value={localSettings.apiKey}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="toggle-setting">
                            <div className="toggle-info">
                                <label htmlFor="smartHistory">Smart History</label>
                                <p className="hint">Use past meal data for better suggestions</p>
                            </div>
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
                    </div>
                )}
            </div>
            
            <button 
                id="save-settings" 
                className={`btn ${saved ? 'success' : 'primary'} full-width`}
                onClick={handleSave}
            >
                {saved ? 'Saved!' : 'Save Settings'}
            </button>
        </section>
    );
}
