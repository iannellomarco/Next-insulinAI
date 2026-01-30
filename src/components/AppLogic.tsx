'use client';

import { useState } from 'react';
import ScanView from '@/components/ScanView';
import ResultsView from '@/components/ResultsView';
import HistoryView from '@/components/HistoryView';
import SettingsModal from '@/components/SettingsModal';
import TextInputModal from '@/components/TextInputModal';
import ErrorModal from '@/components/ErrorModal';
import { useStore } from '@/lib/store';
import { AIService } from '@/lib/ai-service';
import { fileToBase64, resizeImage } from '@/lib/utils';
import { HistoryItem } from '@/types';
import { ToastContainer, useToast } from '@/components/ui/Toast';

export default function AppLogic() {
    const { settings, history, addHistoryItem, setAnalysisResult, setIsLoading } = useStore();
    const [currentView, setCurrentView] = useState<'scan' | 'results' | 'history'>('scan');
    const [showSettings, setShowSettings] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const { toasts, addToast, removeToast } = useToast();

    // Hook into Header buttons (simplistic approach: global event listener or just moving header inside here)
    // For now, let's assume Header is outside, but we need a way to trigger views. 
    // ACTUALLY: The Header is in `layout.tsx`, which is hard to communicate with. 
    // Let's replace the global header in layout with one here, or use a Context for UI state.
    // FASTEST FIX: Move Header logic into this component or a specific UI Context. 
    // Let's create a temporary "ClientHeader" inside here or just override the layout one?
    // No, better to listen to custom events or just render Header here.
    // I'll Render a specific Header within the Views or just floating buttons?
    // The original app had a sticky header. 
    // Let's use a simple State for now.

    const handleAnalyze = async (input: File | string, type: 'image' | 'text') => {
        setIsLoading(true);
        setCurrentView('results');

        try {
            let payload = input;
            if (input instanceof File) {
                const base64 = await fileToBase64(input);
                payload = await resizeImage(base64);
            }

            // We need to access the 'history' from the store (via destructured props)
            const historyContext = settings.smartHistory ? history.slice(0, 5) : [];

            const result = await AIService.analyze(payload, type, settings, historyContext);

            setAnalysisResult(result);

            // Add to history
            const newItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                ...result
            };
            addHistoryItem(newItem);

        } catch (error) {
            const msg = error instanceof Error ? error.message : "Analysis failed. Please try again.";

            // Check for non-food error (based on keywords from AI Service)
            // If it's a validation error, we DO NOT log to console.error to avoid Next.js overlay in dev
            const isValidationError = msg.includes("analyze food") || msg.includes("No food items") || msg.includes("help with food");

            if (isValidationError) {
                // Just show the modal
                setErrorModal({ open: true, message: msg });
                // Optional: log as info/warn if needed for debugging
                console.warn("Input rejected by verification:", msg);
            } else {
                // Real system error -> log it and show generic toast
                console.error(error);
                addToast(msg, 'error');
            }

            setCurrentView('scan');

            setCurrentView('scan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* We need to portal or control the Header buttons. 
            For now, let's render a local Header here and remove the one in Layout? 
            Or proper way: UIContext. 
            Lets just put a header here for simplicity of migration. 
        */}
            <header className="app-header">
                <h1>InsulinAI</h1>
                <div className="header-actions">
                    <button className="icon-btn" aria-label="History" onClick={() => setCurrentView('history')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                    <button className="icon-btn" aria-label="Settings" onClick={() => setShowSettings(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                </div>
            </header>

            <main>
                {currentView === 'scan' && (
                    <ScanView
                        onAnalyze={handleAnalyze}
                        onManualEntry={() => setShowTextModal(true)}
                    />
                )}

                {currentView === 'results' && (
                    <ResultsView onBack={() => setCurrentView('scan')} />
                )}

                {currentView === 'history' && (
                    <HistoryView onBack={() => setCurrentView('scan')} />
                )}

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
            </main>
        </>
    );
}
