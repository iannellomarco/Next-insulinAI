'use client';

import { Camera, Type, Sparkles, ChevronRight, Lightbulb, Link2, X, AlertCircle, Lock } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import SmartFavorites from './SmartFavorites';
import RecentHistory from './RecentHistory';
import { useStore } from '@/lib/store';
import { HistoryItem, Favorite } from '@/types';
import { SignInButton } from '@clerk/nextjs';
import { useTranslations } from '@/lib/translations';

interface HomeViewProps {
    onAnalyze: (input: File | string, type: 'image' | 'text') => void;
    onManualEntry: () => void;
    onViewHistory: () => void;
    canLogFood?: boolean;
    remainingLogs?: number;
    isGuest?: boolean;
}

export default function HomeView({ onAnalyze, onManualEntry, onViewHistory, canLogFood = true, remainingLogs = 5, isGuest = false }: HomeViewProps) {
    const { history, chainedMeals, isChaining, clearChain } = useStore();
    const t = useTranslations();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewRef = useRef<HTMLElement>(null);
    const [inputMode, setInputMode] = useState<'photo' | 'text'>('photo');
    const [tipIndex, setTipIndex] = useState(0);

    // Scroll to top when chaining mode is active (returning from "Add Another Food")
    useEffect(() => {
        if (isChaining) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            viewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isChaining]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % t.home.tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [t.home.tips.length]);

    const handleScanClick = () => {
        if (inputMode === 'photo') {
            fileInputRef.current?.click();
        } else {
            onManualEntry();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAnalyze(file, 'image');
        }
    };

    const handleFavoriteSelect = (item: Favorite) => {
        onAnalyze(item.name, 'text');
    };

    const handleHistoryItemClick = (item: HistoryItem) => {
        console.log('Clicked history item:', item);
    };

    return (
        <section id="home-view" className="view home-view" ref={viewRef}>
            <input
                type="file"
                id="file-input"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Chaining Banner */}
            {isChaining && chainedMeals.length > 0 && (
                <div className="chain-banner">
                    <div className="chain-icon">
                        <Link2 size={18} />
                    </div>
                    <div className="chain-info">
                        <span>{t.home.addingToMeal} ({chainedMeals.length} {chainedMeals.length > 1 ? t.home.items : t.home.item})</span>
                        <small>{chainedMeals.reduce((sum, m) => sum + m.total_carbs, 0)}g {t.home.soFar}</small>
                    </div>
                    <button className="chain-clear" onClick={clearChain}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Guest Limit Warning */}
            {isGuest && remainingLogs <= 2 && remainingLogs > 0 && (
                <div className="limit-warning">
                    <AlertCircle size={16} />
                    <span>{remainingLogs} {remainingLogs !== 1 ? t.home.freeLogsRemaining : t.home.freeLogRemaining}</span>
                </div>
            )}

            {/* Log Food Card */}
            <div className={`log-food-card-wrapper ${!canLogFood ? 'limit-reached' : ''}`}>
                <div className={`log-food-card ${!canLogFood ? 'blurred' : ''}`}>
                    <div className="log-food-header">
                        <Sparkles size={20} className="sparkle-icon" />
                        <h2>{isChaining ? t.home.addAnother : t.home.logFood}</h2>
                    </div>

                    {/* Mode Toggle */}
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${inputMode === 'photo' ? 'active' : ''}`}
                            onClick={() => canLogFood && setInputMode('photo')}
                        >
                            <Camera size={18} />
                            <span>{t.home.photo}</span>
                        </button>
                        <button
                            className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                            onClick={() => canLogFood && setInputMode('text')}
                        >
                            <Type size={18} />
                            <span>{t.home.text}</span>
                        </button>
                    </div>

                    {/* Scan Zone */}
                    <button
                        className="scan-zone"
                        onClick={canLogFood ? handleScanClick : undefined}
                        aria-label={inputMode === 'photo' ? t.home.tapScan : t.home.tapType}
                        disabled={!canLogFood}
                    >
                        <div className="scan-icon-wrapper">
                            {inputMode === 'photo' ? (
                                <Camera size={28} strokeWidth={1.5} />
                            ) : (
                                <Type size={28} strokeWidth={1.5} />
                            )}
                        </div>
                        <span className="scan-title">
                            {inputMode === 'photo' ? t.home.tapScan : t.home.tapType}
                        </span>
                        <span className="scan-subtitle">
                            {inputMode === 'photo'
                                ? t.home.aiIdentify
                                : t.home.describeEating}
                        </span>
                    </button>

                    {/* Pro Tip */}
                    <div className="pro-tip">
                        <div className="pro-tip-label">
                            <Lightbulb size={14} />
                            <span>{t.home.proTip}</span>
                        </div>
                        <p key={tipIndex} className="fade-in">{t.home.tips[tipIndex]}</p>
                        <ChevronRight size={16} className="tip-arrow" />
                    </div>
                </div>

                {/* Limit Reached Overlay */}
                {!canLogFood && (
                    <div className="limit-overlay">
                        <div className="limit-overlay-icon">
                            <Lock size={32} />
                        </div>
                        <h3>{t.home.limitReached}</h3>
                        <p>{t.home.limitReachedSub}</p>
                        <SignInButton mode="modal">
                            <button className="btn primary">{t.home.signInContinue}</button>
                        </SignInButton>
                    </div>
                )}
            </div>

            {/* Smart Favorites */}
            <SmartFavorites
                onSelect={handleFavoriteSelect}
                onAddNew={onManualEntry}
            />

            {/* Recent History */}
            <RecentHistory
                items={history}
                onViewAll={onViewHistory}
                onItemClick={handleHistoryItemClick}
            />
        </section>
    );
}
