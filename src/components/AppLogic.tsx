'use client';

import { useState } from 'react';
import HomeView from '@/components/HomeView';
import ResultsView from '@/components/ResultsView';
import HistoryView from '@/components/HistoryView';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import SettingsModal from '@/components/SettingsModal';
import TextInputModal from '@/components/TextInputModal';
import ErrorModal from '@/components/ErrorModal';
import { useStore } from '@/lib/store';
import { AIService } from '@/lib/ai-service';
import { fileToBase64, resizeImage } from '@/lib/utils';
import { HistoryItem } from '@/types';
import { ToastContainer, useToast } from '@/components/ui/Toast';

type ViewType = 'home' | 'results' | 'history' | 'insights';
type NavType = 'home' | 'log' | 'insights' | 'settings';

export default function AppLogic() {
    const { settings, history, addHistoryItem, setAnalysisResult, setIsLoading } = useStore();
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [activeNav, setActiveNav] = useState<NavType>('home');
    const [showSettings, setShowSettings] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const { toasts, addToast, removeToast } = useToast();

    const handleNavigation = (item: NavType) => {
        setActiveNav(item);
        if (item === 'home') {
            setCurrentView('home');
        } else if (item === 'log') {
            setCurrentView('history');
        } else if (item === 'insights') {
            setCurrentView('insights');
        } else if (item === 'settings') {
            setShowSettings(true);
        }
    };

    const handleAnalyze = async (input: File | string, type: 'image' | 'text') => {
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

            const newItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                ...result
            };
            addHistoryItem(newItem);

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
                    />
                )}

                {currentView === 'results' && (
                    <ResultsView onBack={() => {
                        setCurrentView('home');
                        setActiveNav('home');
                    }} />
                )}

                {currentView === 'history' && (
                    <HistoryView onBack={() => {
                        setCurrentView('home');
                        setActiveNav('home');
                    }} />
                )}

                {currentView === 'insights' && (
                    <div className="insights-placeholder">
                        <h2>📊 Insights</h2>
                        <p>Coming soon! Track your trends and patterns here.</p>
                    </div>
                )}
            </main>

            <BottomNav active={activeNav} onNavigate={handleNavigation} />

            {showSettings && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}

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
        </div>
    );
}

