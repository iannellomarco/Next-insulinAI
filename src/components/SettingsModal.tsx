'use client';

import { X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
    const { settings, updateSettings } = useStore();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setLocalSettings((prev) => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
        }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    return (
        <section id="settings-view" className="view">
            <div className="view-header">
                <h2>Settings</h2>
                <button className="icon-btn" onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>
            </div>
            <div className="settings-form">
                <div className="input-group">
                    <label htmlFor="carbRatio">Carb Ratio (1 unit : X grams)</label>
                    <input
                        type="number"
                        id="carbRatio"
                        placeholder="10"
                        min="1"
                        value={localSettings.carbRatio}
                        onChange={handleChange}
                    />
                    <p className="hint">How many grams of carbs does 1 unit of insulin cover?</p>
                </div>

                <div className="input-group">
                    <label htmlFor="correctionFactor">Correction Factor (Optional)</label>
                    <input
                        type="number"
                        id="correctionFactor"
                        placeholder="50"
                        min="1"
                        value={localSettings.correctionFactor}
                        onChange={handleChange}
                    />
                    <p className="hint">1 unit drops blood sugar by X mg/dL.</p>
                </div>

                <div className="input-group">
                    <label htmlFor="highThreshold">High Glucose Threshold</label>
                    <input
                        type="number"
                        id="highThreshold"
                        placeholder="180"
                        min="100"
                        value={localSettings.highThreshold}
                        onChange={handleChange}
                    />
                    <p className="hint">Values above this will be marked red.</p>
                </div>

                <div className="input-group">
                    <label htmlFor="lowThreshold">Low Glucose Threshold</label>
                    <input
                        type="number"
                        id="lowThreshold"
                        placeholder="70"
                        min="40"
                        value={localSettings.lowThreshold}
                        onChange={handleChange}
                    />
                    <p className="hint">Values below this will be marked red.</p>
                </div>

                <details className="advanced-settings">
                    <summary>Advanced Settings</summary>
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <input
                            type="password"
                            id="apiKey"
                            placeholder="Enter your key or leave blank to use free tier"
                            value={localSettings.apiKey}
                            onChange={handleChange}
                        />
                        <p className="hint">Leave blank to use the provided system key.</p>
                    </div>

                    <div
                        className="input-group checkbox-group"
                        style={{
                            marginTop: '1rem',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <label htmlFor="smartHistory" style={{ margin: 0, fontSize: '1rem', flex: 1 }}>
                            Smart History (Use past data context)
                        </label>
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
                </details>
            </div>
            <button id="save-settings" className="btn primary full-width" onClick={handleSave}>
                Save Settings
            </button>
        </section>
    );
}
