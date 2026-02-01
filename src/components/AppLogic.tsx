'use client';

import { useState, useMemo } from 'react';
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
import { HistoryItem } from '@/types';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import SoftLoginModal from '@/components/SoftLoginModal';
import { useUser } from '@clerk/nextjs';

const DAILY_LIMIT_GUEST = 5;

type ViewType = 'home' | 'results' | 'history' | 'insights' | 'settings';
type NavType = 'home' | 'log' | 'insights' | 'settings';

export default function AppLogic() {
    const { settings, history, addHistoryItem, setAnalysisResult, setIsLoading } = useStore();
    const { user } = useUser();
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [activeNav, setActiveNav] = useState<NavType>('home');
    const [showTextModal, setShowTextModal] = useState(false);
    const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const { toasts, addToast, removeToast } = useToast();

    // Count today's logged meals for guest users
    const todayMealCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        return history.filter(item => item.timestamp >= todayStart).length;
    }, [history]);

    const canLogFood = !!user || todayMealCount < DAILY_LIMIT_GUEST;
    const remainingLogs = DAILY_LIMIT_GUEST - todayMealCount;

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
            // Note: User will save manually from ResultsView to include pre_glucose

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
