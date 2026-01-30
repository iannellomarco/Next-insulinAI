'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AnalysisResult, Settings, HistoryItem, DEFAULT_SETTINGS } from '@/types';

interface StoreContextType {
    settings: Settings;
    history: HistoryItem[];
    updateSettings: (newSettings: Partial<Settings>) => void;
    addHistoryItem: (item: HistoryItem) => void;
    updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
    clearHistory: () => void;
    analysisResult: AnalysisResult | null;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem('insulin-calc-ai-settings');
            if (storedSettings) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
            }

            const storedHistory = localStorage.getItem('insulin_calc_history');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error('Failed to load storage:', e);
        } finally {
            setLoaded(true);
        }
    }, []);

    // Save changes to localStorage
    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('insulin-calc-ai-settings', JSON.stringify(updated));
    };

    const addHistoryItem = (item: HistoryItem) => {
        const updated = [item, ...history].slice(0, 50); // Keep last 50
        setHistory(updated);
        localStorage.setItem('insulin_calc_history', JSON.stringify(updated));
    };

    const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
        const updated = history.map((item) =>
            item.id === id ? { ...item, ...updates } : item
        );
        setHistory(updated);
        localStorage.setItem('insulin_calc_history', JSON.stringify(updated));
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('insulin_calc_history');
    };

    // Prevent flash of default content until loaded (optional, handled in UI usually)
    // if (!loaded) return null; 

    return (
        <StoreContext.Provider
            value={{
                settings,
                history,
                updateSettings,
                addHistoryItem,
                updateHistoryItem,
                clearHistory,
                analysisResult,
                setAnalysisResult,
                isLoading,
                setIsLoading,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
