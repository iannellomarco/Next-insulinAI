'use client';

import { Calculator, Target, Zap, Sun, Clock, Moon, Activity, Key, Brain, Loader2, CheckCircle, XCircle, Link, Globe } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import { CarbRatios } from '@/types';
import { fetchLibreDataAction } from '@/app/actions/libre';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useTranslations, Language } from '@/lib/translations';

type SettingsTab = 'insulin' | 'glucose' | 'advanced';

export default function SettingsView() {
    const { settings, updateSettings } = useStore();
    const { user } = useUser();
    const t = useTranslations();
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('insulin');
    const [showToast, setShowToast] = useState(false);

    const isInitialMount = useRef(true);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Libre Testing State
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        // Force save current credentials first
        await updateSettings(localSettings);

        try {
            const result = await fetchLibreDataAction();
            if (result.success) {
                setTestResult({ success: true, message: `${t.settings.connected} ${result.connectionName}` });
            } else {
                setTestResult({ success: false, message: result.error || t.general.error });
            }
        } catch (error) {
            setTestResult({ success: false, message: t.general.error });
        } finally {
            setIsTesting(false);
        }
    };

    // Handle tab change - scroll to top
    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0;
        }
    };

    // Sync from store when settings change externally
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    // Auto-save with debounce (500ms delay)
    useEffect(() => {
        // Skip on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Check if there are actual changes
        if (JSON.stringify(localSettings) === JSON.stringify(settings)) {
            return;
        }

        // Debounced save
        saveTimeoutRef.current = setTimeout(() => {
            updateSettings(localSettings);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }, 500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [localSettings, settings, updateSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setLocalSettings((prev) => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
        }));
    };

    const handleCarbRatioChange = (meal: keyof CarbRatios, value: number) => {
        setLocalSettings((prev) => ({
            ...prev,
            carbRatios: {
                ...prev.carbRatios,
                [meal]: value,
            },
        }));
    };

    const toggleMealSpecificRatios = () => {
        setLocalSettings((prev) => ({
            ...prev,
            useMealSpecificRatios: !prev.useMealSpecificRatios,
        }));
    };

    return (
        <section id="settings-view" className="view settings-view-new">
            {/* Fixed Tab Navigation - NOT inside scroll area */}
            <div className="settings-header-fixed">
                <div className="settings-tabs">
                    <button
                        className={`settings-tab ${activeTab === 'insulin' ? 'active' : ''}`}
                        onClick={() => handleTabChange('insulin')}
                    >
                        <Calculator size={16} />
                        <span>{t.settings.insulin}</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'glucose' ? 'active' : ''}`}
                        onClick={() => handleTabChange('glucose')}
                    >
                        <Activity size={16} />
                        <span>{t.settings.glucose}</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                        onClick={() => handleTabChange('advanced')}
                    >
                        <Zap size={16} />
                        <span>{t.settings.advanced}</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="settings-scroll-area" ref={scrollAreaRef}>
                <div className="settings-content">
                    {/* Insulin Tab */}
                    {activeTab === 'insulin' && (
                        <div className="settings-panel">
                            <div className="panel-header">
                                <h3>{t.settings.carbRatios}</h3>
                                <p>{t.settings.carbRatiosSub}</p>
                            </div>

                            <div className="ratio-mode-selector">
                                <button
                                    className={`mode-btn ${!localSettings.useMealSpecificRatios ? 'active' : ''}`}
                                    onClick={() => localSettings.useMealSpecificRatios && toggleMealSpecificRatios()}
                                >
                                    {t.settings.singleRatio}
                                </button>
                                <button
                                    className={`mode-btn ${localSettings.useMealSpecificRatios ? 'active' : ''}`}
                                    onClick={() => !localSettings.useMealSpecificRatios && toggleMealSpecificRatios()}
                                >
                                    {t.settings.perMeal}
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
                                    <p className="ratio-description">{t.settings.covers} {localSettings.carbRatio}g {t.home.carbsShort}</p>
                                </div>
                            ) : (
                                <div className="meal-ratios-grid">
                                    <div className="meal-ratio-card">
                                        <div className="meal-icon breakfast">
                                            <Sun size={20} />
                                        </div>
                                        <div className="meal-info">
                                            <span className="meal-name">{t.settings.breakfast}</span>
                                            <span className="meal-time">{t.settings.breakfastTime}</span>
                                        </div>
                                        <div className="meal-input">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={localSettings.carbRatios?.breakfast ?? 8}
                                                onChange={(e) => handleCarbRatioChange('breakfast', Number(e.target.value))}
                                            />
                                            <span>{t.settings.unitGU}</span>
                                        </div>
                                    </div>
                                    <div className="meal-ratio-card">
                                        <div className="meal-icon lunch">
                                            <Clock size={20} />
                                        </div>
                                        <div className="meal-info">
                                            <span className="meal-name">{t.settings.lunch}</span>
                                            <span className="meal-time">{t.settings.lunchTime}</span>
                                        </div>
                                        <div className="meal-input">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={localSettings.carbRatios?.lunch ?? 10}
                                                onChange={(e) => handleCarbRatioChange('lunch', Number(e.target.value))}
                                            />
                                            <span>{t.settings.unitGU}</span>
                                        </div>
                                    </div>
                                    <div className="meal-ratio-card">
                                        <div className="meal-icon dinner">
                                            <Moon size={20} />
                                        </div>
                                        <div className="meal-info">
                                            <span className="meal-name">{t.settings.dinner}</span>
                                            <span className="meal-time">{t.settings.dinnerTime}</span>
                                        </div>
                                        <div className="meal-input">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={localSettings.carbRatios?.dinner ?? 12}
                                                onChange={(e) => handleCarbRatioChange('dinner', Number(e.target.value))}
                                            />
                                            <span>{t.settings.unitGU}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="divider" />

                            <div className="panel-header">
                                <h3>{t.settings.correctionFactor}</h3>
                                <p>{t.settings.correctionFactorSub}</p>
                            </div>

                            <div className="correction-card">
                                <div className="correction-icon">
                                    <Target size={24} />
                                </div>
                                <div className="correction-input">
                                    <span className="correction-prefix">{t.settings.drops}</span>
                                    <input
                                        type="number"
                                        id="correctionFactor"
                                        placeholder="50"
                                        min="1"
                                        max="200"
                                        value={localSettings.correctionFactor}
                                        onChange={handleChange}
                                    />
                                    <span className="correction-suffix">{t.history.glucoseUnit}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Glucose Tab */}
                    {activeTab === 'glucose' && (
                        <div className="settings-panel">
                            <div className="panel-header">
                                <h3>{t.settings.thresholds}</h3>
                                <p>{t.settings.thresholdsSub}</p>
                            </div>

                            <div className="threshold-cards">
                                <div className="threshold-card high">
                                    <div className="threshold-header">
                                        <span className="threshold-label">{t.settings.high}</span>
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
                                        <span className="threshold-unit">{t.history.glucoseUnit}</span>
                                    </div>
                                    <p className="threshold-hint">{t.settings.highHint}</p>
                                </div>

                                <div className="threshold-card low">
                                    <div className="threshold-header">
                                        <span className="threshold-label">{t.settings.low}</span>
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
                                        <span className="threshold-unit">{t.history.glucoseUnit}</span>
                                    </div>
                                    <p className="threshold-hint">{t.settings.lowHint}</p>
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
                                <h3>{t.settings.language || 'Language'}</h3>
                                <p>{t.settings.languageSub || 'Choose your preferred language'}</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">
                                    <Globe size={24} />
                                </div>
                                <div className="feature-content">
                                    <div className="feature-header">
                                        <select
                                            id="language"
                                            className="settings-select"
                                            value={localSettings.language}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--secondary)',
                                                color: 'var(--foreground)'
                                            }}
                                        >
                                            <option value="en">English</option>
                                            <option value="it">Italiano</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="divider" />

                            <div className="panel-header">
                                <h3>{t.settings.smartFeatures}</h3>
                                <p>{t.settings.smartFeaturesSub}</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">
                                    <Brain size={24} />
                                </div>
                                <div className="feature-content">
                                    <div className="feature-header">
                                        <span className="feature-name">{t.settings.smartHistory}</span>
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
                                        {t.settings.smartHistorySub}
                                    </p>
                                </div>
                            </div>

                            <div className="divider" />

                            <div className="panel-header">
                                <h3>{t.settings.libre}</h3>
                                <p>{t.settings.libreSub}</p>
                            </div>

                            <div className="api-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div className="api-icon">
                                    <Link size={20} />
                                </div>
                                <div className={`api-content ${!user ? 'blurred-content' : ''}`}>
                                    <label htmlFor="libreUsername">{t.settings.email}</label>
                                    <input
                                        type="email"
                                        id="libreUsername"
                                        placeholder="email@example.com"
                                        value={user ? (localSettings.libreUsername || '') : 'hidden@email.com'}
                                        onChange={handleChange}
                                        disabled={!user}
                                    />

                                    <label htmlFor="librePassword" style={{ marginTop: '12px' }}>{t.settings.password}</label>
                                    <input
                                        type="password"
                                        id="librePassword"
                                        placeholder="••••••••"
                                        value={user ? (localSettings.librePassword || '') : 'password123'}
                                        onChange={handleChange}
                                        disabled={!user}
                                    />

                                    <div className="test-connection-wrapper" style={{ marginTop: '16px' }}>
                                        <button
                                            className="test-connection-btn"
                                            onClick={handleTestConnection}
                                            disabled={isTesting || !user || !localSettings.libreUsername || !localSettings.librePassword}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                backgroundColor: '#fafdff',
                                                border: '1px solid #e1e6eb',
                                                color: '#0066cc',
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                cursor: isTesting ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {isTesting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    {t.settings.connecting}
                                                </>
                                            ) : (
                                                t.settings.test
                                            )}
                                        </button>

                                        {testResult && (
                                            <div style={{
                                                marginTop: '12px',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                color: testResult.success ? '#10b981' : '#ef4444'
                                            }}>
                                                {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                {testResult.message}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lock Overlay for Guest Users */}
                                {!user && (
                                    <div className="settings-lock-overlay" style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        backdropFilter: 'blur(4px)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        gap: '12px',
                                        padding: '24px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            background: '#fff',
                                            borderRadius: '50%',
                                            padding: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}>
                                            <Link size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{t.settings.connectLibre}</h4>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                                                {t.settings.connectLibreSub}
                                            </p>
                                            <SignInButton mode="modal">
                                                <button className="btn primary" style={{ width: 'auto', padding: '8px 20px', fontSize: '14px' }}>
                                                    {t.settings.signInConnect}
                                                </button>
                                            </SignInButton>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="divider" />

                            <div className="panel-header">
                                <h3>{t.settings.api}</h3>
                                <p>{t.settings.apiSub}</p>
                            </div>

                            <div className="api-card">
                                <div className="api-icon">
                                    <Key size={20} />
                                </div>
                                <div className="api-content">
                                    <label htmlFor="apiKey">{t.settings.apiKey}</label>
                                    <input
                                        type="password"
                                        id="apiKey"
                                        placeholder="sk-..."
                                        value={localSettings.apiKey}
                                        onChange={handleChange}
                                    />
                                    <p className="api-hint">{t.settings.apiKeySub}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="settings-toast">
                    ✓ {t.settings.saved}
                </div>
            )}
        </section>
    );
}
