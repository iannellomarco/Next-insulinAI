'use client';

import { Camera, Type, Sparkles, ChevronRight, Lightbulb, Link2, X, AlertCircle, Lock } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import SmartFavorites from './SmartFavorites';
import RecentHistory from './RecentHistory';
import { useStore } from '@/lib/store';
import { HistoryItem, Favorite } from '@/types';
import { SignInButton } from '@clerk/nextjs';

interface HomeViewProps {
    onAnalyze: (input: File | string, type: 'image' | 'text') => void;
    onManualEntry: () => void;
    onViewHistory: () => void;
    canLogFood?: boolean;
    remainingLogs?: number;
    isGuest?: boolean;
}

const PRO_TIPS = [
    "Include portion sizes for better accuracy",
    "Add cooking method for precise carb counts",
    "Mention brand names when possible",
    "Describe sauces and toppings separately",
    "Good lighting helps AI identify foods better",
];

export default function HomeView({ onAnalyze, onManualEntry, onViewHistory, canLogFood = true, remainingLogs = 5, isGuest = false }: HomeViewProps) {
    const { history, chainedMeals, isChaining, clearChain } = useStore();
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
            setTipIndex((prev) => (prev + 1) % PRO_TIPS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
                        <span>Adding to meal ({chainedMeals.length} item{chainedMeals.length > 1 ? 's' : ''})</span>
                        <small>{chainedMeals.reduce((sum, m) => sum + m.total_carbs, 0)}g carbs so far</small>
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
                    <span>{remainingLogs} free log{remainingLogs !== 1 ? 's' : ''} remaining today. Sign in for unlimited access.</span>
                </div>
            )}

            {/* Log Food Card */}
            <div className={`log-food-card-wrapper ${!canLogFood ? 'limit-reached' : ''}`}>
                <div className={`log-food-card ${!canLogFood ? 'blurred' : ''}`}>
                    <div className="log-food-header">
                        <Sparkles size={20} className="sparkle-icon" />
                        <h2>{isChaining ? 'Add Another Food' : 'Log Food'}</h2>
                    </div>

                    {/* Mode Toggle */}
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${inputMode === 'photo' ? 'active' : ''}`}
                            onClick={() => canLogFood && setInputMode('photo')}
                        >
                            <Camera size={18} />
                            <span>Photo</span>
                        </button>
                        <button
                            className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                            onClick={() => canLogFood && setInputMode('text')}
                        >
                            <Type size={18} />
                            <span>Text</span>
                        </button>
                    </div>

                    {/* Scan Zone */}
                    <button 
                        className="scan-zone" 
                        onClick={canLogFood ? handleScanClick : undefined}
                        aria-label={inputMode === 'photo' ? 'Take a photo of your food' : 'Enter food manually'}
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
                            {inputMode === 'photo' ? 'Tap to scan food' : 'Tap to type food'}
                        </span>
                        <span className="scan-subtitle">
                            {inputMode === 'photo' 
                                ? 'AI will identify carbs instantly' 
                                : 'Describe what you\'re eating'}
                        </span>
                    </button>

                    {/* Pro Tip */}
                    <div className="pro-tip">
                        <div className="pro-tip-label">
                            <Lightbulb size={14} />
                            <span>Pro tip</span>
                        </div>
                        <p key={tipIndex} className="fade-in">{PRO_TIPS[tipIndex]}</p>
                        <ChevronRight size={16} className="tip-arrow" />
                    </div>
                </div>

                {/* Limit Reached Overlay */}
                {!canLogFood && (
                    <div className="limit-overlay">
                        <div className="limit-overlay-icon">
                            <Lock size={32} />
                        </div>
                        <h3>Daily Limit Reached</h3>
                        <p>Sign in to unlock unlimited food logging and track your meals without restrictions.</p>
                        <SignInButton mode="modal">
                            <button className="btn primary">Sign In to Continue</button>
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
