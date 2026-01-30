'use client';

import { useState } from 'react';
import ScanView from '@/components/ScanView';
import ResultsView from '@/components/ResultsView';
import HistoryView from '@/components/HistoryView';
import Header from '@/components/Header';
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

            {/* Header with Auth & Navigation */}
            <Header
                onHistoryClick={() => setCurrentView('history')}
                onSettingsClick={() => setShowSettings(true)}
            />

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
