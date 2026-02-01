'use client';

import { useState, useEffect, useCallback } from 'react';
import HomeView from '@/components/HomeView';
import ResultsView from '@/components/ResultsView';
import HistoryView from '@/components/HistoryView';
import ReportView from '@/components/ReportView';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import SettingsView from '@/components/SettingsModal';
import TextInputModal from '@/components/TextInputModal';
import ErrorModal from '@/components/ErrorModal';
import { useStore } from '@/lib/store';
import { AIService } from '@/lib/ai-service';
import { fileToBase64, resizeImage } from '@/lib/utils';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import SoftLoginModal from '@/components/SoftLoginModal';
import { useUser } from '@clerk/nextjs';

const DAILY_LIMIT_GUEST = 5;
const SCAN_COUNT_KEY = 'insulinai_daily_scans';

// Get today's date key for localStorage
const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

// Get scan count from localStorage (independent of history)
const getDailyScanCount = (): number => {
    if (typeof window === 'undefined') return 0;
    try {
        const data = localStorage.getItem(SCAN_COUNT_KEY);
        if (!data) return 0;
        const parsed = JSON.parse(data);
        const todayKey = getTodayKey();
        // Reset if it's a new day
        if (parsed.date !== todayKey) return 0;
        return parsed.count || 0;
    } catch {
        return 0;
    }
};

// Increment scan count in localStorage
const incrementScanCount = () => {
    if (typeof window === 'undefined') return;
    const todayKey = getTodayKey();
    const currentCount = getDailyScanCount();
    localStorage.setItem(SCAN_COUNT_KEY, JSON.stringify({
        date: todayKey,
        count: currentCount + 1
    }));
};

type ViewType = 'home' | 'results' | 'history' | 'insights' | 'settings';
type NavType = 'home' | 'log' | 'insights' | 'settings';

export default function AppLogic() {
    const { settings, history, setAnalysisResult, setIsLoading } = useStore();
    const { user } = useUser();
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [activeNav, setActiveNav] = useState<NavType>('home');
    const [showTextModal, setShowTextModal] = useState(false);
    const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const { toasts, addToast, removeToast } = useToast();
    
    // Track daily scan count (separate from history to prevent bypass via clearing history)
    const [dailyScanCount, setDailyScanCount] = useState(0);
    
    // Load scan count from localStorage on mount
    useEffect(() => {
        setDailyScanCount(getDailyScanCount());
    }, []);

    const canLogFood = !!user || dailyScanCount < DAILY_LIMIT_GUEST;
    const remainingLogs = Math.max(0, DAILY_LIMIT_GUEST - dailyScanCount);
    
    // Increment scan count (called after successful analysis)
    const incrementDailyScans = useCallback(() => {
        if (!user) {
            incrementScanCount();
            setDailyScanCount(prev => prev + 1);
        }
    }, [user]);

    const handleNavigation = (item: NavType) => {
        setActiveNav(item);
        if (item === 'home') {
            setCurrentView('home');
        } else if (item === 'log') {
            setCurrentView('history');
        } else if (item === 'insights') {
            setCurrentView('insights');
        } else if (item === 'settings') {
            setCurrentView('settings');
        }
    };

    const handleAnalyze = async (input: File | string, type: 'image' | 'text') => {
        // Check daily limit for guest users
        if (!canLogFood) {
            setErrorModal({ 
                open: true, 
                message: `You've reached your daily limit of ${DAILY_LIMIT_GUEST} food logs. Sign in for unlimited access!` 
            });
            return;
        }

        setIsLoading(true);
        setCurrentView('results');

        try {
            let payload = input;
            if (input instanceof File) {
                const base64 = await fileToBase64(input);
                payload = await resizeImage(base64);
            }

            const historyContext = settings.smartHistory ? history.slice(0, 5) : [];
            const result = await AIService.analyze(payload, type, settings, historyContext);

            setAnalysisResult(result);
            // Increment daily scan count for guest users (after successful analysis)
            incrementDailyScans();

        } catch (error) {
            const msg = error instanceof Error ? error.message : "Analysis failed. Please try again.";
            const isValidationError = msg.includes("analyze food") || msg.includes("No food items") || msg.includes("help with food");

            if (isValidationError) {
                setErrorModal({ open: true, message: msg });
                console.warn("Input rejected by verification:", msg);
            } else {
                console.error(error);
                addToast(msg, 'error');
            }

            setCurrentView('home');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-wrapper">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <Header />

            <main className="main-content">
                {currentView === 'home' && (
                    <HomeView
                        onAnalyze={handleAnalyze}
                        onManualEntry={() => setShowTextModal(true)}
                        onViewHistory={() => {
                            setCurrentView('history');
                            setActiveNav('log');
                        }}
                        canLogFood={canLogFood}
                        remainingLogs={remainingLogs}
                        isGuest={!user}
                    />
                )}

                {currentView === 'results' && (
                    <ResultsView 
                        onBack={() => {
                            setCurrentView('home');
                            setActiveNav('home');
                        }}
                        onAddMore={() => {
                            setCurrentView('home');
                            setActiveNav('home');
                        }}
                    />
                )}

                {currentView === 'history' && (
                    <HistoryView onBack={() => {
                        setCurrentView('home');
                        setActiveNav('home');
                    }} />
                )}

                {currentView === 'insights' && (
                    <ReportView onBack={() => {
                        setCurrentView('home');
                        setActiveNav('home');
                    }} />
                )}

                {currentView === 'settings' && <SettingsView />}
            </main>

            <BottomNav active={activeNav} onNavigate={handleNavigation} />

            {/* Modals */}
            {showTextModal && (
                <TextInputModal
                    onClose={() => setShowTextModal(false)}
                    onAnalyze={(text) => handleAnalyze(text, 'text')}
                />
            )}

            {errorModal.open && (
                <ErrorModal
                    message={errorModal.message}
                    onClose={() => setErrorModal({ ...errorModal, open: false })}
                />
            )}

            {/* Login Prompt Wall */}
            <SoftLoginModal />
        </div>
    );
}
